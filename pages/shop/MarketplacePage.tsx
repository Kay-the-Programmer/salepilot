import { useState, useEffect, useRef, FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import MarketplaceLayout, { MarketplaceNavMenu } from '../../components/marketplace/MarketplaceLayout';
import ShopDiscoveryView from '../../components/marketplace/views/ShopDiscoveryView';
import SuppliersDirectoryView from '../../components/marketplace/views/SuppliersDirectoryView';
import MyOrdersView from '../../components/marketplace/views/MyOrdersView';
import { getCurrentUser } from '../../services/authService';
import SalePilotLogo from '../../assets/salepilot.png';
import { HiOutlineUserCircle, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

/**
 * SalePilot Marketplace — public, shopping-first discovery across every store
 * with an online storefront (default "Shop" view), plus the B2B hub views
 * (quick offers, requests, suppliers, retailers) for signed-in businesses.
 */
export default function MarketplacePage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchDraft, setSearchDraft] = useState(searchParams.get('q') || '');

    const activeView = searchParams.get('view') || 'shop';

    useEffect(() => {
        setCurrentUser(getCurrentUser());
    }, []);

    useEffect(() => {
        document.title = 'SalePilot Marketplace';
    }, []);

    useEffect(() => { setSearchDraft(searchParams.get('q') || ''); }, [searchParams]);

    // Live search while on the Shop view: results follow the input (350ms
    // debounce, URL replaced not pushed). Other tabs keep explicit submit so
    // typing never yanks the user away from a B2B view.
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
        if (activeView !== 'shop') return;
        if (searchDraft.trim() === (searchParams.get('q') || '')) return;
        debounceRef.current = setTimeout(() => {
            const next = new URLSearchParams(location.search);
            next.set('view', 'shop');
            const q = searchDraft.trim();
            if (q) next.set('q', q); else next.delete('q');
            setSearchParams(next, { replace: true });
        }, 350);
        return () => clearTimeout(debounceRef.current);
    }, [searchDraft]); // eslint-disable-line react-hooks/exhaustive-deps

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        const next = new URLSearchParams(location.search);
        next.set('view', 'shop');
        const q = searchDraft.trim();
        if (q) next.set('q', q); else next.delete('q');
        setSearchParams(next);
    };

    const renderView = () => {
        switch (activeView) {
            case 'suppliers':
                return <SuppliersDirectoryView />;
            case 'my-orders':
                return <MyOrdersView />;
            // Legacy mock B2B views (quick-offers / requests / activity /
            // retailers) fall through to the wholesale landing.
            case 'shop':
            default:
                return <ShopDiscoveryView />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-brand-text">
            {/* ── Navy structural header (Velocity) ── */}
            <header className="bg-sp-navy text-white sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
                        {/* Section menu (hamburger) */}
                        <MarketplaceNavMenu />

                        {/* Brand */}
                        <button
                            onClick={() => { setSearchParams(new URLSearchParams()); }}
                            className="flex-none flex items-center gap-3 active:scale-95 transition-transform"
                            aria-label="Marketplace home"
                        >
                            <img src={SalePilotLogo} alt="SalePilot" className="h-8 sm:h-10 w-auto object-contain rounded bg-white/95 px-2 py-1" />
                            <span className="hidden lg:block text-sm font-bold uppercase tracking-[0.18em] text-white/70">Marketplace</span>
                        </button>

                        {/* Search */}
                        <form onSubmit={submitSearch} className="flex-1 max-w-2xl hidden md:block">
                            <div className="relative">
                                <input
                                    type="search"
                                    value={searchDraft}
                                    onChange={e => setSearchDraft(e.target.value)}
                                    placeholder="Search wholesale products & suppliers…"
                                    className="w-full h-11 pl-5 pr-14 rounded-lg bg-white text-brand-text text-sm font-medium placeholder:text-brand-text-muted/70 focus:outline-none focus:ring-2 focus:ring-sp-amber"
                                />
                                <button
                                    type="submit"
                                    aria-label="Search"
                                    className="absolute right-1 top-1 bottom-1 w-11 bg-sp-amber rounded-md flex items-center justify-center hover:brightness-95 transition-all active:scale-95"
                                >
                                    <HiOutlineMagnifyingGlass className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </form>

                        {/* Account */}
                        <div className="flex-none flex items-center gap-3">
                            {currentUser ? (
                                <button
                                    onClick={() => navigate(currentUser.role === 'customer' ? '/marketplace' : '/dash')}
                                    className="flex items-center gap-2 h-11 px-3 sm:px-4 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <HiOutlineUserCircle className="w-6 h-6 text-white/80" />
                                    <span className="hidden sm:block text-sm font-semibold text-white/90 max-w-[120px] truncate">
                                        {currentUser.name?.split(' ')[0] || 'Account'}
                                    </span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="h-11 px-3 sm:px-4 rounded-lg text-sm font-semibold text-white/85 hover:bg-white/10 transition-colors"
                                    >
                                        Log in
                                    </button>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="h-11 px-4 sm:px-5 rounded-lg bg-sp-amber text-white text-sm font-bold hover:brightness-95 transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        <span className="sm:hidden">Sell</span>
                                        <span className="hidden sm:inline">Sell on SalePilot</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile search */}
                    <form onSubmit={submitSearch} className="md:hidden pb-3">
                        <div className="relative">
                            <input
                                type="search"
                                value={searchDraft}
                                onChange={e => setSearchDraft(e.target.value)}
                                placeholder="Search wholesale products & suppliers…"
                                className="w-full h-11 pl-4 pr-14 rounded-lg bg-white text-brand-text text-sm font-medium placeholder:text-brand-text-muted/70 focus:outline-none focus:ring-2 focus:ring-sp-amber"
                            />
                            <button
                                type="submit"
                                aria-label="Search"
                                className="absolute right-1 top-1 bottom-1 w-11 bg-sp-amber rounded-md flex items-center justify-center active:scale-95"
                            >
                                <HiOutlineMagnifyingGlass className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </form>
                </div>
            </header>

            <MarketplaceLayout>
                {renderView()}
            </MarketplaceLayout>

            {/* ── Footer (navy, structural) ── */}
            <footer className="bg-sp-navy text-white">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-base font-bold mb-3">SalePilot Marketplace</h3>
                        <p className="text-sm text-white/70 leading-relaxed max-w-xs">
                            Where retailers buy from wholesalers — live stock, real prices, direct from each supplier.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-base font-bold mb-3">Explore</h3>
                        <ul className="space-y-1.5 text-sm text-white/70">
                            <li>
                                <button onClick={() => setSearchParams(new URLSearchParams())} className="hover:text-white transition-colors">
                                    Browse products
                                </button>
                            </li>
                            <li>
                                <button onClick={() => { const p = new URLSearchParams(); p.set('view', 'suppliers'); setSearchParams(p); }} className="hover:text-white transition-colors">
                                    Suppliers
                                </button>
                            </li>
                            <li>
                                <button onClick={() => { const p = new URLSearchParams(); p.set('view', 'my-orders'); setSearchParams(p); }} className="hover:text-white transition-colors">
                                    My orders
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/track')} className="hover:text-white transition-colors">
                                    Track a shipment
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-base font-bold mb-3">For businesses</h3>
                        <p className="text-sm text-white/70 mb-3">Get your store online with POS, inventory and a free storefront.</p>
                        <button
                            onClick={() => navigate('/register')}
                            className="h-11 px-5 rounded-lg bg-sp-amber text-white text-sm font-bold hover:brightness-95 transition-all active:scale-95"
                        >
                            Sell on SalePilot
                        </button>
                    </div>
                </div>
                <div className="border-t border-white/10">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 text-xs text-white/50">
                        © {new Date().getFullYear()} SalePilot. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
