import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useOutletContext, useSearchParams } from 'react-router-dom';
import { HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineCheck } from 'react-icons/hi2';
import { shopService, ShopSort, ShopCategory } from '../../services/shop.service';
import { Product } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { addToCart, updateQuantity, useShopCart } from './cartStore';
import ShopProductCard from './ShopProductCard';
import type { ShopOutletContext } from './ShopLayout';

const PAGE_SIZE = 24;

const SORT_OPTIONS: { value: ShopSort; label: string }[] = [
    { value: 'name', label: 'Name (A–Z)' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
];

/**
 * Catalog page, organized like a familiar collection page:
 * contextual header (category / search context + count) → facet rail
 * (counted categories, availability) → toolbar → grid → load more.
 * Every filter lives in the URL, so views are shareable and Back works.
 */
const ShopProductList: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const { formatPrice } = useOutletContext<ShopOutletContext>();
    const [searchParams, setSearchParams] = useSearchParams();

    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || '';
    const sort = (searchParams.get('sort') as ShopSort) || 'name';
    const inStockOnly = searchParams.get('stock') === 'in';

    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [categories, setCategories] = useState<ShopCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchDraft, setSearchDraft] = useState(query);
    const { qtyOf } = useShopCart(storeId);
    const { showToast } = useToast();
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => { setSearchDraft(query); }, [query]);

    // Live search: results follow the input as you type (350ms debounce),
    // no Enter required. URL is replaced (not pushed) to keep Back sane.
    useEffect(() => {
        if (searchDraft.trim() === query) return;
        debounceRef.current = setTimeout(() => {
            const next = new URLSearchParams(searchParams);
            const q = searchDraft.trim();
            if (q) next.set('q', q); else next.delete('q');
            setSearchParams(next, { replace: true });
        }, 350);
        return () => clearTimeout(debounceRef.current);
    }, [searchDraft]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!storeId) return;
        shopService.getCategories(storeId).then(setCategories).catch(() => { });
    }, [storeId]);

    // Reload page 1 whenever a filter changes.
    useEffect(() => {
        if (!storeId) return;
        let cancelled = false;
        setLoading(true);
        setPage(1);
        shopService.getProducts(storeId, {
            categoryId: categoryId || undefined,
            search: query || undefined,
            sort,
            inStock: inStockOnly || undefined,
            page: 1,
            limit: PAGE_SIZE,
        })
            .then(res => {
                if (cancelled) return;
                setProducts(res.items);
                setTotal(res.total);
            })
            .catch(err => console.error('Failed to load products', err))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [storeId, categoryId, query, sort, inStockOnly]);

    const loadMore = async () => {
        if (!storeId || loadingMore) return;
        setLoadingMore(true);
        try {
            const next = page + 1;
            const res = await shopService.getProducts(storeId, {
                categoryId: categoryId || undefined,
                search: query || undefined,
                sort,
                inStock: inStockOnly || undefined,
                page: next,
                limit: PAGE_SIZE,
            });
            setProducts(prev => [...prev, ...res.items]);
            setPage(next);
        } catch (err) {
            console.error('Failed to load more products', err);
        } finally {
            setLoadingMore(false);
        }
    };

    const updateParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value); else next.delete(key);
        setSearchParams(next, { replace: false });
    };

    /** One-tap add / stepper wiring for a grid card. */
    const quickAddFor = (p: Product) => ({
        qty: qtyOf(p.id),
        onAdd: () => {
            addToCart(storeId!, {
                id: p.id, name: p.name, price: p.price,
                image: p.imageUrls?.[0], stock: p.stock, unitOfMeasure: p.unitOfMeasure,
            });
            showToast(`${p.name} added to cart`, 'success');
        },
        onSetQty: (q: number) => updateQuantity(storeId!, p.id, q),
    });

    const activeCategory = useMemo(
        () => categories.find(c => c.id === categoryId) || null,
        [categories, categoryId]
    );

    const hasFilters = !!(query || categoryId || inStockOnly);
    const hasMore = products.length < total;

    // Contextual page title, like a real collection page.
    const pageTitle = activeCategory ? activeCategory.name : query ? 'Search results' : 'All products';

    return (
        <div>
            {/* ── Page header ── */}
            <div className="mb-5">
                <h1 className="text-2xl sm:text-[32px] sm:leading-10 font-semibold tracking-tight text-brand-text">
                    {pageTitle}
                </h1>
                {!loading && (
                    <p className="text-sm text-brand-text-muted mt-1">
                        {total} {total === 1 ? 'product' : 'products'}
                        {query && <> matching “<span className="font-semibold text-brand-text">{query}</span>”</>}
                        {inStockOnly && <> · in stock</>}
                    </p>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* ── Facet rail (desktop): counted categories + availability ── */}
                <aside className="hidden lg:block w-60 flex-none sticky top-36">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-brand-text-muted mb-3">Categories</h3>
                    <ul className="space-y-1 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                        <li>
                            <button
                                onClick={() => updateParam('category', '')}
                                className={`w-full flex items-center justify-between h-11 px-3.5 rounded-lg text-sm font-medium transition-colors ${!categoryId ? 'bg-sp-navy text-white' : 'text-brand-text-muted hover:bg-surface-variant hover:text-brand-text'}`}
                            >
                                All products
                            </button>
                        </li>
                        {categories.map(cat => (
                            <li key={cat.id}>
                                <button
                                    onClick={() => updateParam('category', cat.id)}
                                    className={`w-full flex items-center justify-between gap-2 h-11 px-3.5 rounded-lg text-sm font-medium transition-colors ${categoryId === cat.id ? 'bg-sp-navy text-white' : 'text-brand-text-muted hover:bg-surface-variant hover:text-brand-text'}`}
                                >
                                    <span className="truncate">{cat.name}</span>
                                    <span className={`flex-none text-xs font-bold tabular-nums ${categoryId === cat.id ? 'text-white/70' : 'text-brand-text-muted/70'}`}>
                                        {cat.productCount}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <h3 className="text-xs font-bold uppercase tracking-widest text-brand-text-muted mt-6 mb-3">Availability</h3>
                    <button
                        onClick={() => updateParam('stock', inStockOnly ? '' : 'in')}
                        aria-pressed={inStockOnly}
                        className={`w-full flex items-center gap-2.5 h-11 px-3.5 rounded-lg text-sm font-medium transition-colors ${inStockOnly ? 'bg-sp-navy text-white' : 'text-brand-text-muted hover:bg-surface-variant hover:text-brand-text'}`}
                    >
                        <span className={`w-[18px] h-[18px] flex-none rounded border flex items-center justify-center ${inStockOnly ? 'bg-white border-white' : 'border-warm-400'}`}>
                            {inStockOnly && <HiOutlineCheck className="w-3 h-3 text-sp-navy" strokeWidth={3} />}
                        </span>
                        In stock only
                    </button>
                </aside>

                <div className="flex-1 w-full min-w-0">
                    {/* ── Toolbar ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <form
                            onSubmit={e => { e.preventDefault(); updateParam('q', searchDraft.trim()); }}
                            className="relative flex-1"
                        >
                            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted pointer-events-none" />
                            <input
                                type="search"
                                value={searchDraft}
                                onChange={e => setSearchDraft(e.target.value)}
                                placeholder="Search this store…"
                                className="w-full h-12 pl-11 pr-4 rounded-lg bg-surface border border-brand-border text-sm font-medium text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-b-2 focus:border-sp-amber transition-colors"
                            />
                        </form>
                        <div className="flex items-center gap-3">
                            {/* Mobile in-stock pill (desktop uses the facet rail) */}
                            <button
                                onClick={() => updateParam('stock', inStockOnly ? '' : 'in')}
                                aria-pressed={inStockOnly}
                                className={`lg:hidden flex-none h-12 px-4 rounded-lg text-sm font-semibold border transition-colors ${inStockOnly ? 'bg-sp-navy text-white border-sp-navy' : 'bg-surface text-brand-text-muted border-brand-border'}`}
                            >
                                In stock
                            </button>
                            <select
                                value={sort}
                                onChange={e => updateParam('sort', e.target.value)}
                                aria-label="Sort products"
                                className="flex-1 sm:flex-none h-12 px-3.5 rounded-lg bg-surface border border-brand-border text-sm font-semibold text-brand-text focus:outline-none focus:border-sp-navy cursor-pointer"
                            >
                                {SORT_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Mobile category chips (with counts) ── */}
                    <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                        <button
                            onClick={() => updateParam('category', '')}
                            className={`flex-none h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${!categoryId ? 'bg-sp-navy text-white border-sp-navy' : 'bg-surface text-brand-text-muted border-brand-border'}`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => updateParam('category', cat.id)}
                                className={`flex-none h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${categoryId === cat.id ? 'bg-sp-navy text-white border-sp-navy' : 'bg-surface text-brand-text-muted border-brand-border'}`}
                            >
                                {cat.name}
                                <span className={`ml-1.5 text-xs font-bold ${categoryId === cat.id ? 'text-white/70' : 'text-brand-text-muted/70'}`}>{cat.productCount}</span>
                            </button>
                        ))}
                    </div>

                    {/* ── Active filter chips (each individually removable) ── */}
                    {hasFilters && (
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                            {activeCategory && (
                                <button
                                    onClick={() => updateParam('category', '')}
                                    className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-sp-navy/10 text-xs font-semibold text-sp-navy hover:bg-sp-navy/15 transition-colors"
                                >
                                    {activeCategory.name} <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {query && (
                                <button
                                    onClick={() => updateParam('q', '')}
                                    className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-sp-navy/10 text-xs font-semibold text-sp-navy hover:bg-sp-navy/15 transition-colors"
                                >
                                    “{query}” <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {inStockOnly && (
                                <button
                                    onClick={() => updateParam('stock', '')}
                                    className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-sp-navy/10 text-xs font-semibold text-sp-navy hover:bg-sp-navy/15 transition-colors"
                                >
                                    In stock <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => setSearchParams({}, { replace: false })}
                                className="h-8 px-3 rounded-full text-xs font-semibold text-brand-text-muted hover:text-brand-text hover:bg-surface-variant transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* ── Grid ── */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="rounded-lg border border-brand-border bg-surface h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="rounded-lg border border-brand-border bg-surface py-20 text-center px-6">
                            <p className="font-semibold text-brand-text mb-1">No products found</p>
                            <p className="text-sm text-brand-text-muted mb-5">Try a different search or remove a filter.</p>
                            {hasFilters && (
                                <button
                                    onClick={() => setSearchParams({}, { replace: false })}
                                    className="inline-flex items-center h-11 px-6 rounded-lg border border-sp-navy text-sp-navy font-semibold text-sm hover:bg-sp-navy/5 transition-colors active:scale-[0.98]"
                                >
                                    Show everything
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                {products.map(product => (
                                    <ShopProductCard
                                        key={product.id}
                                        product={product}
                                        storeId={storeId!}
                                        formatPrice={formatPrice}
                                        quickAdd={quickAddFor(product)}
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
                </div>
            </div>
        </div>
    );
};

export default ShopProductList;
