import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    HiOutlineBuildingStorefront,
    HiOutlineArrowRight,
    HiOutlineMapPin,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineXMark,
    HiOutlineSparkles,
} from 'react-icons/hi2';
import { shopService, GlobalProduct, PublicStore, ShopSort } from '../../../services/shop.service';
import { formatCurrency } from '../../../utils/currency';
import ShopProductCard from '../../../pages/shop/ShopProductCard';

const PAGE_SIZE = 24;
const DEFAULT_CURRENCY = { code: 'ZMW', symbol: 'K', position: 'before' };

const SORT_OPTIONS: { value: ShopSort; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'name', label: 'Name (A–Z)' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
];

/** Compact store card used in the horizontal rail. */
const StoreRailCard: React.FC<{ store: PublicStore }> = ({ store }) => (
    <Link
        to={`/shop/${store.id}`}
        className="group flex-none w-56 snap-start flex items-center gap-3 bg-surface border border-brand-border rounded-lg p-3.5 transition-all hover:border-sp-navy hover:shadow-md active:scale-[0.98]"
    >
        <div className="w-11 h-11 flex-none rounded-lg bg-sp-navy flex items-center justify-center text-white font-bold text-lg">
            {store.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-text truncate group-hover:text-sp-navy transition-colors">{store.name}</p>
            <p className="text-[11px] text-brand-text-muted truncate flex items-center gap-1 mt-0.5">
                {store.address
                    ? <><HiOutlineMapPin className="w-3 h-3 flex-none" />{store.address}</>
                    : <><HiOutlineBuildingStorefront className="w-3 h-3 flex-none" />Online store</>}
            </p>
        </div>
    </Link>
);

/**
 * Marketplace "Shop" view, organized like a familiar marketplace landing:
 *   hero (identity + live stats, hidden while searching)
 *   → horizontal store rail (discovery up top, not buried)
 *   → product grid with toolbar (count + sort) and load-more.
 * While searching: results-first — matching stores row, then products.
 */
const ShopDiscoveryView: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const sort = (searchParams.get('sort') as ShopSort) || 'newest';
    const searching = !!query;

    const [products, setProducts] = useState<GlobalProduct[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [stores, setStores] = useState<PublicStore[]>([]);
    const [storesLoading, setStoresLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    /** Catalog-wide product count (from the unfiltered first load) for hero stats. */
    const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
    const railRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        shopService.getPublicStores({ wholesale: true })
            .then(setStores)
            .catch(() => { })
            .finally(() => setStoresLoading(false));
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setPage(1);
        shopService.getGlobalProducts({ search: query || undefined, sort, page: 1, limit: PAGE_SIZE, wholesale: true })
            .then(res => {
                if (cancelled) return;
                setProducts(res.items);
                setTotal(res.total);
                if (!query) setCatalogTotal(res.total);
            })
            .catch(err => console.error('Failed to load marketplace products', err))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [query, sort]);

    const loadMore = async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        try {
            const next = page + 1;
            const res = await shopService.getGlobalProducts({ search: query || undefined, sort, page: next, limit: PAGE_SIZE, wholesale: true });
            setProducts(prev => [...prev, ...res.items]);
            setPage(next);
        } finally {
            setLoadingMore(false);
        }
    };

    const priceFor = (p: GlobalProduct) => (price: number) =>
        formatCurrency(price, { currency: p.currency || DEFAULT_CURRENCY } as any);

    const updateParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value); else next.delete(key);
        setSearchParams(next, { replace: true });
    };

    /** Stores whose name matches the search — shown as mini-results. */
    const matchingStores = useMemo(() => {
        if (!searching) return [];
        const q = query.toLowerCase();
        return stores.filter(s => s.name.toLowerCase().includes(q));
    }, [searching, query, stores]);

    const scrollRail = (dir: 1 | -1) => {
        railRef.current?.scrollBy({ left: dir * 480 });
    };

    const hasMore = products.length < total;

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">

            {/* ── Hero: marketplace identity + live stats (browse mode only) ── */}
            {!searching && (
                <section className="relative overflow-hidden rounded-xl bg-sp-navy text-white">
                    <div
                        className="absolute inset-0 opacity-25"
                        style={{ background: 'radial-gradient(ellipse at 85% 10%, #FF7F27 0%, transparent 50%), radial-gradient(ellipse at 5% 90%, #1A428A 0%, transparent 55%)' }}
                    />
                    <div className="relative px-5 py-8 sm:px-10 sm:py-12 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
                        <div className="flex-1 min-w-0">
                            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">
                                <HiOutlineSparkles className="w-3.5 h-3.5" /> SalePilot Wholesale Marketplace
                            </p>
                            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight mb-2">
                                Stock your shop at wholesale
                            </h1>
                            <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-lg">
                                Buy directly from wholesalers and distributors — live stock, real prices, order online and pay on delivery or pickup.
                            </p>
                        </div>
                        {/* Live stats */}
                        <div className="flex sm:flex-col gap-3 sm:gap-2.5 flex-none">
                            <div className="flex-1 sm:flex-none bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 sm:px-5 text-center sm:text-left">
                                <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">{storesLoading ? '—' : stores.length}</p>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mt-1">Suppliers</p>
                            </div>
                            <div className="flex-1 sm:flex-none bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 sm:px-5 text-center sm:text-left">
                                <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">{catalogTotal ?? '—'}</p>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mt-1">Products</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Store rail: discovery up top, horizontally scrollable ── */}
            {!searching && (storesLoading || stores.length > 0) && (
                <section>
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-brand-text">
                            Browse suppliers
                            {!storesLoading && <span className="ml-2 text-sm font-medium text-brand-text-muted">({stores.length})</span>}
                        </h2>
                        {/* Desktop rail arrows */}
                        {stores.length > 4 && (
                            <div className="hidden md:flex items-center gap-1.5">
                                <button
                                    onClick={() => scrollRail(-1)}
                                    aria-label="Scroll stores left"
                                    className="w-9 h-9 rounded-lg border border-brand-border bg-surface flex items-center justify-center text-brand-text-muted hover:text-sp-navy hover:border-sp-navy transition-colors active:scale-95"
                                >
                                    <HiOutlineChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => scrollRail(1)}
                                    aria-label="Scroll stores right"
                                    className="w-9 h-9 rounded-lg border border-brand-border bg-surface flex items-center justify-center text-brand-text-muted hover:text-sp-navy hover:border-sp-navy transition-colors active:scale-95"
                                >
                                    <HiOutlineChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div ref={railRef} className="flex gap-3 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {storesLoading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex-none w-56 h-[72px] rounded-lg border border-brand-border bg-surface animate-pulse" />
                            ))
                            : stores.map(store => <StoreRailCard key={store.id} store={store} />)}
                    </div>
                </section>
            )}

            {/* ── Matching stores while searching (mini-results) ── */}
            {searching && matchingStores.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-brand-text-muted mb-3">
                        Suppliers matching “{query}”
                    </h2>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {matchingStores.map(store => <StoreRailCard key={store.id} store={store} />)}
                    </div>
                </section>
            )}

            {/* ── Products ── */}
            <section>
                {/* Toolbar: title + count left, sort right; stacks on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 sm:mb-5">
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-brand-text flex items-center gap-2 flex-wrap">
                            {searching ? <>Results for “{query}”</> : 'Discover products'}
                            {searching && (
                                <button
                                    onClick={() => updateParam('q', '')}
                                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-surface-variant text-xs font-semibold text-brand-text-muted hover:text-brand-text transition-colors"
                                >
                                    <HiOutlineXMark className="w-3.5 h-3.5" /> Clear
                                </button>
                            )}
                        </h2>
                        {!loading && (
                            <p className="text-sm text-brand-text-muted mt-0.5">
                                {total} {total === 1 ? 'product' : 'products'}
                                {!searching && !storesLoading ? <> from {stores.length} {stores.length === 1 ? 'supplier' : 'suppliers'}</> : null}
                            </p>
                        )}
                    </div>
                    <select
                        value={sort}
                        onChange={e => updateParam('sort', e.target.value)}
                        aria-label="Sort products"
                        className="h-11 px-3.5 rounded-lg bg-surface border border-brand-border text-sm font-semibold text-brand-text focus:outline-none focus:border-sp-navy cursor-pointer self-start sm:self-auto"
                    >
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="rounded-lg border border-brand-border bg-surface h-64 animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="rounded-lg border border-brand-border bg-surface py-20 text-center px-6">
                        <p className="font-semibold text-brand-text mb-1">No products found</p>
                        <p className="text-sm text-brand-text-muted mb-5">Try a different search term{matchingStores.length > 0 ? ', or visit a matching store above' : ''}.</p>
                        {searching && (
                            <button
                                onClick={() => updateParam('q', '')}
                                className="inline-flex items-center h-11 px-6 rounded-lg border border-sp-navy text-sp-navy font-semibold text-sm hover:bg-sp-navy/5 transition-colors active:scale-[0.98]"
                            >
                                Browse everything
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {products.map(p => (
                                <ShopProductCard
                                    key={`${p.storeId}-${p.id}`}
                                    product={p}
                                    storeId={(p as any).storeId}
                                    formatPrice={priceFor(p)}
                                    showStore
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="h-12 px-8 rounded-lg border border-sp-navy text-sp-navy font-semibold text-sm hover:bg-sp-navy/5 transition-colors active:scale-[0.98] disabled:opacity-60"
                                >
                                    {loadingMore ? 'Loading…' : `Load more (${total - products.length} remaining)`}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ── No suppliers yet: invite wholesalers to list themselves ── */}
            {!searching && !storesLoading && stores.length === 0 && (
                <section className="rounded-lg border border-brand-border bg-surface py-14 text-center px-6">
                    <p className="font-semibold text-brand-text mb-1">No wholesale suppliers listed yet</p>
                    <p className="text-sm text-brand-text-muted mb-5 max-w-md mx-auto">
                        Are you a wholesaler or distributor on SalePilot? Turn on “Wholesale supplier” in your Online Store settings to list your catalog here.
                    </p>
                    <Link
                        to="/store"
                        className="inline-flex items-center h-11 px-6 rounded-lg bg-sp-navy text-white font-semibold text-sm hover:bg-sp-navy-light transition-colors active:scale-[0.98]"
                    >
                        Open Online Store settings
                    </Link>
                </section>
            )}

            {/* ── All suppliers grid (browse mode, full directory at the end) ── */}
            {!searching && !storesLoading && stores.length > 3 && (
                <section className="border-t border-brand-border pt-8">
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-brand-text mb-4">All suppliers</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {stores.map(store => (
                            <Link
                                key={store.id}
                                to={`/shop/${store.id}`}
                                className="group flex items-center gap-3.5 bg-surface border border-brand-border rounded-lg p-4 transition-all hover:border-sp-navy hover:shadow-md active:scale-[0.99]"
                            >
                                <div className="w-11 h-11 flex-none rounded-lg bg-sp-navy flex items-center justify-center text-white font-bold text-lg">
                                    {store.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-brand-text truncate group-hover:text-sp-navy transition-colors">{store.name}</p>
                                    <p className="text-[11px] text-brand-text-muted truncate mt-0.5">
                                        {store.address || 'Online store'}
                                    </p>
                                </div>
                                <HiOutlineArrowRight className="w-4 h-4 flex-none text-brand-text-muted group-hover:text-sp-navy group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ShopDiscoveryView;
