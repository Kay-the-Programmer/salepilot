import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MarketplaceLayout from '../../components/marketplace/MarketplaceLayout';
import Modal from '../../components/ui/Modal';
import QuickOffersView from '../../components/marketplace/views/QuickOffersView';
import SuppliersView from '../../components/marketplace/views/SuppliersView';
import RetailersView from '../../components/marketplace/views/RetailersView';
import RequestsView from '../../components/marketplace/views/RequestsView';
import ActivityView from '../../components/marketplace/views/ActivityView';
import { getCurrentUser } from '../../services/authService';
import SalePilotLogo from '../../assets/salepilot.png';
import { HiOutlineUserCircle, HiOutlineShoppingBag, HiOutlineBolt, HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';

export default function MarketplacePage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Determine active view from URL query param
    const searchParams = new URLSearchParams(location.search);
    const activeView = searchParams.get('view') || 'quick-offers';

    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
    }, []);

    const renderView = () => {
        switch (activeView) {
            case 'requests':
                return <RequestsView />;
            case 'activity':
                return <ActivityView />;
            case 'suppliers':
                return <SuppliersView />;
            case 'retailers':
                return <RetailersView />;
            case 'quick-offers':
            default:
                return <QuickOffersView />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-brand-text">
            {/* Top Bar - Recopied from original to maintain consistent header look */}
            <div className="bg-surface-variant py-2 text-center border-b border-brand-border hidden sm:block">
                <p className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider">
                    Free express worldwide shipping on all orders over $200. <span onClick={() => setIsShippingModalOpen(true)} className="underline cursor-pointer hover:text-sp-green-dark transition-colors active:scale-95">See Details</span>
                </p>
            </div>

            {/* Main Header - Recopied for consistency across all views */}
            <header className="bg-warm-900 text-white sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
                    {/* Logo & Category Toggle */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 cursor-pointer active:scale-95 transition-all duration-300" onClick={() => navigate('/directory')}>
                            <img src={SalePilotLogo} alt="SalePilot" className="h-10 w-auto object-contain" />
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                                className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-colors ${isCategoryMenuOpen ? 'bg-white text-brand-text' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                <HiOutlineBolt className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
                            </button>

                            {/* Categories Dropdown */}
                            {isCategoryMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-brand-border rounded-2xl shadow-lg overflow-hidden py-2 text-brand-text z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">Browse By</div>
                                    {['Electronics', 'Fashion', 'Home & Garden', 'Industrial', 'Raw Materials', 'Services'].map(cat => (
                                        <button key={cat} className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-surface-variant hover:text-sp-green-dark transition-colors active:scale-95">
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search Bar - Global for now */}
                    <div className="flex-1 max-w-2xl hidden md:block relative">
                        <input
                            type="text"
                            placeholder="Search marketplace..."
                            className="w-full h-11 pl-5 pr-12 rounded-full bg-white text-brand-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sp-green"
                        />
                        <button className="absolute right-1 top-1 bottom-1 w-12 bg-sp-green rounded-full flex items-center justify-center hover:bg-sp-green-dark transition-colors active:scale-95">
                            <HiOutlineMagnifyingGlass className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6">
                        {currentUser ? (
                            <div className="flex items-center gap-4">
                                <button className="flex flex-col items-center gap-1 group" onClick={() => navigate(currentUser.role === 'customer' ? '/customer/dashboard' : '/reports')}>
                                    <HiOutlineUserCircle className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 group-hover:text-white">Account</span>
                                </button>
                                {currentUser.role === 'customer' && (
                                    <button className="flex flex-col items-center gap-1 group" onClick={() => navigate('/customer/dashboard')}>
                                        <div className="relative">
                                            <HiOutlineShoppingBag className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-sp-amber text-warm-900 rounded-full text-[10px] font-bold flex items-center justify-center">0</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 group-hover:text-white">Cart</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate('/customer/login')} className="text-sm font-bold text-white/80 hover:text-white">Login</button>
                                <button onClick={() => navigate('/customer/register')} className="px-5 py-2 bg-sp-green rounded-full text-xs font-bold uppercase tracking-widest hover:bg-sp-green-dark transition-colors active:scale-95">Sign Up</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <MarketplaceLayout>
                {renderView()}
            </MarketplaceLayout>

            {/* Shipping Details Modal */}
            {isShippingModalOpen && (
                <Modal open onClose={() => setIsShippingModalOpen(false)} size="md" className="p-8 relative" zIndexClass="z-[100]">
                        <button
                            onClick={() => setIsShippingModalOpen(false)}
                            className="absolute top-4 right-4 p-2 bg-surface-variant rounded-full hover:bg-brand-border transition-colors active:scale-95"
                        >
                            <HiOutlineXMark className="w-5 h-5 text-brand-text-muted" />
                        </button>
                        <h3 className="text-2xl font-extrabold tracking-tight text-brand-text mb-4">Shipping Policy</h3>
                        <div className="space-y-4 text-brand-text-muted text-sm leading-relaxed">
                            <p>
                                <strong className="text-brand-text">Free Express Shipping:</strong> Available on all orders over $200 (subtotal).
                                We partner with major logistics providers to ensure your goods arrive safely and on time.
                            </p>
                            <p>
                                <strong className="text-brand-text">Delivery Times:</strong>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Domestic: 1-3 business days</li>
                                    <li>International: 3-7 business days</li>
                                </ul>
                            </p>
                            <p className="bg-surface-variant p-4 rounded-xl text-xs font-medium text-brand-text-muted border border-brand-border">
                                Note: Shipping times are estimates and may vary based on customs processing for international orders.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsShippingModalOpen(false)}
                            className="w-full mt-8 py-3 bg-sp-green text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-sp-green-dark transition-colors active:scale-95"
                        >
                            Got it
                        </button>
                </Modal>
            )}
        </div>
    );
}
