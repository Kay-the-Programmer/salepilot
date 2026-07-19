import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineMagnifyingGlass, HiOutlineBuildingStorefront } from 'react-icons/hi2';
import { shopService, ShopInfo } from '../../services/shop.service';
import { formatCurrency } from '../../utils/currency';
import LoadingSpinner from '../../components/LoadingSpinner';
import CartDrawer from './CartDrawer';
import { CartItem, cartCount, getCart, subscribeToCart } from './cartStore';

export interface ShopOutletContext {
    shopInfo: ShopInfo;
    formatPrice: (price: number) => string;
    openCart: () => void;
}

/**
 * Public storefront shell (Velocity): surface header with store identity,
 * search and a badge cart that opens a slide-over drawer; deep-navy footer.
 */
const ShopLayout: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [searchDraft, setSearchDraft] = useState(searchParams.get('q') || '');
    const { pathname } = useLocation();

    // Start each page at the top (browser SPA navigation keeps old scroll).
    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [pathname]);

    useEffect(() => {
        if (!storeId || storeId === 'undefined') {
            setLoading(false);
            return;
        }
        shopService.getShopInfo(storeId)
            .then(info => {
                setShopInfo(info);
                document.title = info.settings.name || info.name || 'Online Store';
            })
            .catch(err => console.error('Failed to load shop info', err))
            .finally(() => setLoading(false));

        const refresh = () => setCartItems(getCart(storeId));
        refresh();
        return subscribeToCart(refresh);
    }, [storeId]);

    const formatPrice = useCallback(
        (price: number) => formatCurrency(price, (shopInfo?.settings || {}) as any),
        [shopInfo]
    );

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchDraft.trim();
        navigate(`/shop/${storeId}/products${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    };

    if (loading) return <LoadingSpinner text="Loading store..." />;

    if (!shopInfo) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
                <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-6">
                    <HiOutlineBuildingStorefront className="w-8 h-8 text-brand-text-muted" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-text mb-2">Store not found</h1>
                <p className="text-brand-text-muted max-w-md">This store link may be incorrect or the store may no longer be available.</p>
            </div>
        );
    }

    if (shopInfo.settings.isOnlineStoreEnabled === false) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
                <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-6">
                    <HiOutlineShoppingBag className="w-8 h-8 text-brand-text-muted" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-text mb-2">
                    {shopInfo.settings.name || shopInfo.name} is currently offline
                </h1>
                <p className="text-brand-text-muted max-w-md">The store is temporarily closed. Please check back later.</p>
            </div>
        );
    }

    const storeName = shopInfo.settings.name || shopInfo.name;
    const itemCount = cartCount(cartItems);

    return (
        <div className="min-h-screen flex flex-col bg-background text-brand-text">
            {/* ── Header ── */}
            <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-brand-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between gap-4">
                        {/* Identity */}
                        <Link to={`/shop/${storeId}`} className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 flex-none bg-sp-navy rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                {storeName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-lg font-bold tracking-tight text-brand-text truncate max-w-[160px] sm:max-w-xs">
                                {storeName}
                            </span>
                        </Link>

                        {/* Desktop search */}
                        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl">
                            <div className="relative w-full">
                                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted pointer-events-none" />
                                <input
                                    type="search"
                                    value={searchDraft}
                                    onChange={e => setSearchDraft(e.target.value)}
                                    placeholder="Search products…"
                                    className="w-full h-11 pl-11 pr-4 rounded-lg bg-warm-100 border border-transparent text-sm font-medium text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:bg-surface focus:border-b-2 focus:border-sp-amber transition-colors"
                                />
                            </div>
                        </form>

                        {/* Nav + cart */}
                        <nav className="flex items-center gap-1 sm:gap-2">
                            <Link
                                to={`/shop/${storeId}/products`}
                                className="hidden sm:flex h-11 items-center px-4 rounded-lg text-sm font-semibold text-brand-text-muted hover:text-sp-navy hover:bg-surface-variant transition-colors"
                            >
                                Shop
                            </Link>
                            <button
                                onClick={() => setCartOpen(true)}
                                aria-label={`Open cart, ${itemCount} items`}
                                className="relative w-12 h-12 flex items-center justify-center rounded-lg text-brand-text hover:bg-surface-variant transition-colors active:scale-95"
                            >
                                <HiOutlineShoppingBag className="w-6 h-6" />
                                {itemCount > 0 && (
                                    // key={itemCount} remounts the badge so it "pops" on every change
                                    <span
                                        key={itemCount}
                                        className="absolute top-1 right-1 min-w-[20px] h-5 px-1 rounded-full bg-sp-amber text-white text-[11px] font-bold flex items-center justify-center animate-in zoom-in duration-300"
                                    >
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    {/* Mobile search row */}
                    <form onSubmit={submitSearch} className="md:hidden pb-3">
                        <div className="relative">
                            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted pointer-events-none" />
                            <input
                                type="search"
                                value={searchDraft}
                                onChange={e => setSearchDraft(e.target.value)}
                                placeholder="Search products…"
                                className="w-full h-11 pl-11 pr-4 rounded-lg bg-warm-100 border border-transparent text-sm font-medium text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:bg-surface focus:border-b-2 focus:border-sp-amber transition-colors"
                            />
                        </div>
                    </form>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Outlet context={{ shopInfo, formatPrice, openCart: () => setCartOpen(true) } satisfies ShopOutletContext} />
            </main>

            {/* ── Footer (deep navy, structural) ── */}
            <footer className="bg-sp-navy text-white mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-base font-bold mb-3">{storeName}</h3>
                        <ul className="space-y-1.5 text-sm text-white/70">
                            {shopInfo.settings.address && <li>{shopInfo.settings.address}</li>}
                            {shopInfo.settings.phone && <li>{shopInfo.settings.phone}</li>}
                            {shopInfo.settings.email && <li>{shopInfo.settings.email}</li>}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-base font-bold mb-3">Shop</h3>
                        <ul className="space-y-1.5 text-sm text-white/70">
                            <li><Link to={`/shop/${storeId}`} className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link to={`/shop/${storeId}/products`} className="hover:text-white transition-colors">All products</Link></li>
                            <li><Link to={`/shop/${storeId}/cart`} className="hover:text-white transition-colors">Cart</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-base font-bold mb-3">Powered by SalePilot</h3>
                        <p className="text-sm text-white/70 mb-3">Simple, powerful POS & inventory for growing businesses.</p>
                        <ul className="space-y-1.5 text-sm text-white/70">
                            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of service</Link></li>
                            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-white/50">
                        © {new Date().getFullYear()} {storeName}. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* ── Cart drawer ── */}
            {storeId && (
                <CartDrawer
                    isOpen={cartOpen}
                    onClose={() => setCartOpen(false)}
                    storeId={storeId}
                    items={cartItems}
                    formatPrice={formatPrice}
                />
            )}
        </div>
    );
};

export default ShopLayout;
