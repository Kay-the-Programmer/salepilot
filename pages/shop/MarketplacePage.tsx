import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MarketplaceLayout from '../../components/marketplace/MarketplaceLayout';
import QuickOffersView from '../../components/marketplace/views/QuickOffersView';
import SuppliersView from '../../components/marketplace/views/SuppliersView';
import RetailersView from '../../components/marketplace/views/RetailersView';
import { getCurrentUser } from '../../services/authService';
import SalePilotLogo from '../../assets/salepilot.png';
import { HiOutlineUserCircle, HiOutlineShoppingBag, HiOutlineBolt, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';

export default function MarketplacePage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
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
            case 'suppliers':
                return <SuppliersView />;
            case 'retailers':
                return <RetailersView />;
            case 'quick-offers':
            default:
                return <QuickOffersView currentUser={currentUser} />;
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Top Bar - Recopied from original to maintain consistent header look */}
            <div className="bg-slate-100 py-2 text-center border-b border-slate-200 hidden sm:block">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Free express worldwide shipping on all orders over $200. <span className="underline cursor-pointer">See Details</span>
                </p>
            </div>

            {/* Main Header - Recopied for consistency across all views */}
            <header className="bg-[#0A2E5C] text-white sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
                    {/* Logo & Category Toggle */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/directory')}>
                            <img src={SalePilotLogo} alt="SalePilot" className="h-10 w-auto object-contain" />
                        </div>

                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition-colors">
                            <HiOutlineBolt className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
                        </div>
                    </div>

                    {/* Search Bar - Global for now */}
                    <div className="flex-1 max-w-2xl hidden md:block relative">
                        <input
                            type="text"
                            placeholder="Search marketplace..."
                            className="w-full h-11 pl-5 pr-12 rounded-full bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button className="absolute right-1 top-1 bottom-1 w-12 bg-[#FF7F27] rounded-full flex items-center justify-center hover:bg-[#E66B1F] transition-colors">
                            <HiOutlineMagnifyingGlass className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6">
                        {currentUser ? (
                            <div className="flex items-center gap-4">
                                <button className="flex flex-col items-center gap-1 group" onClick={() => navigate(currentUser.role === 'customer' ? '/customer/dashboard' : '/reports')}>
                                    <HiOutlineUserCircle className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white">Account</span>
                                </button>
                                {currentUser.role === 'customer' && (
                                    <button className="flex flex-col items-center gap-1 group" onClick={() => navigate('/customer/dashboard')}>
                                        <div className="relative">
                                            <HiOutlineShoppingBag className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">0</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white">Cart</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate('/customer/login')} className="text-sm font-bold text-slate-300 hover:text-white">Login</button>
                                <button onClick={() => navigate('/customer/register')} className="px-5 py-2 bg-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors">Sign Up</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <MarketplaceLayout>
                {renderView()}
            </MarketplaceLayout>
        </div>
    );
}
