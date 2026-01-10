import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineBuildingStorefront,
    HiOutlineMagnifyingGlass,
    HiOutlineShoppingBag,
    HiOutlinePlus,
    HiOutlineMapPin,
    HiOutlineArrowRight,
    HiOutlineUserCircle,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineFire,
    HiOutlineBolt
} from 'react-icons/hi2';
import { api } from '../../services/api';
import { getCurrentUser, logout } from '../../services/authService';
import { formatCurrency } from '../../utils/currency';
import RequestWizard from '../../components/RequestWizard';
import Snackbar from '../../components/Snackbar';
import { SnackbarType } from '../../App';

const styles = `
    .premium-scrollbar::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }
    .premium-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .premium-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    .premium-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
        animation: fadeIn 0.4s ease-out forwards;
    }

    .glass-effect {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
    }
    
    @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
    }
    .animate-marquee {
        animation: marquee 30s linear infinite;
    }
`;

interface PublicStore {
    id: string;
    name: string;
    status: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    currency?: { code: string; symbol: string };
}

interface PublicProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    storeId: string;
    storeName: string;
    imageUrls?: string[];
    currency?: { code: string; symbol: string; position?: 'before' | 'after' };
}

export default function MarketplacePage() {
    const [stores, setStores] = useState<PublicStore[]>([]);
    const [products, setProducts] = useState<PublicProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'stores' | 'products'>('stores');
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType } | null>(null);

    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const showSnackbar = (message: string, type: SnackbarType = 'success') => {
        setSnackbar({ message, type });
    };

    useEffect(() => {
        if (activeTab === 'stores') fetchStores();
        else fetchGlobalProducts();
    }, [activeTab]);

    const fetchStores = async () => {
        setLoading(true);
        setApiError(null);
        try {
            const data = await api.get<PublicStore[]>('/shop/stores');
            setStores(data || []);
        } catch (error: any) {
            setApiError(error.message || 'Failed to fetch stores');
            setStores([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalProducts = async () => {
        setLoading(true);
        setApiError(null);
        try {
            const data = await api.get<PublicProduct[]>('/shop/global-products');
            setProducts(data || []);
        } catch (error: any) {
            setApiError(error.message || 'Failed to fetch products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSubmit = async (formData: any) => {
        try {
            const response = await api.post<{ id: string }>('/marketplace/requests', {
                ...formData,
                targetPrice: parseFloat(formData.targetPrice)
            });
            showSnackbar('Broadcasting your request...', 'success');
            setTimeout(() => {
                if (response && response.id) navigate(`/marketplace/track/${response.id}`);
            }, 1500);
            fetchRecentRequests();
        } catch (error) {
            console.error('Error submitting request:', error);
            throw error;
        }
    };

    const fetchRecentRequests = async () => {
        try {
            const data = await api.get<any[]>('/marketplace/requests/recent');
            setRecentRequests(data);
        } catch (error) {
            console.error('Error fetching recent requests:', error);
        }
    };

    useEffect(() => {
        fetchRecentRequests();
        const interval = setInterval(fetchRecentRequests, 10000);
        return () => clearInterval(interval);
    }, []);

    const filteredStores = useMemo(() => stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [stores, searchTerm]);

    const filteredProducts = useMemo(() => products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
            <style>{styles}</style>

            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/60 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-100/60 rounded-full blur-[120px]"></div>
            </div>

            {/* Premium Header */}
            <header className="glass-effect border-b border-slate-200/60 sticky top-0 z-[60] h-20 flex items-center">
                <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/directory')}>
                        <div className="bg-slate-900 p-2.5 rounded-2xl shadow-xl shadow-slate-200 ring-4 ring-slate-50 group-hover:scale-110 transition-transform duration-500">
                            <HiOutlineBuildingStorefront className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">SalePilot Market</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {currentUser ? (
                            <>
                                <button
                                    onClick={() => navigate(currentUser.role === 'customer' ? '/customer/dashboard' : '/reports')}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 group"
                                >
                                    <HiOutlineUserCircle className="w-5 h-5" />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </button>
                                {currentUser.role === 'customer' && (
                                    <button
                                        onClick={() => { logout(); window.location.reload(); }}
                                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                        title="Logout"
                                    >
                                        <HiOutlineArrowLeftOnRectangle className="w-5 h-5" />
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate('/customer/login')}
                                    className="px-6 py-3 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => navigate('/customer/register')}
                                    className="px-6 py-3 bg-[#FF7F27] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#e66a16] transition-all active:scale-95 shadow-xl shadow-orange-100"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:border-slate-400 transition-all font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95"
                        >
                            <HiOutlinePlus className="w-5 h-5" />
                            Post Request
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto px-6 w-full py-20 animate-fadeIn">
                {/* Hero Section */}
                <div className="text-center mb-24 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 animate-fadeIn">
                        <HiOutlineBolt className="w-4 h-4" />
                        Next-Gen Commerce Ecosystem
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9] animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                        Your global <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-indigo-900">marketplace.</span>
                    </h2>
                    <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                        Trade across a verified network of local stores or broadcast your procurement needs to thousands of sellers instantly.
                    </p>
                </div>

                {/* Live Activity Ticker */}
                {recentRequests.length > 0 && (
                    <div className="mb-24 flex justify-center animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                        <div className="w-full bg-white p-6 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 flex items-center gap-8 overflow-hidden">
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="p-2.5 bg-indigo-600 rounded-2xl">
                                    <HiOutlineFire className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hot Requests</span>
                            </div>

                            <div className="relative flex-1 overflow-hidden h-6">
                                <div className="flex gap-16 animate-marquee whitespace-nowrap min-w-full">
                                    {[...recentRequests, ...recentRequests].map((req, idx) => (
                                        <div key={`${req.id}-${idx}`} className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-slate-900">{req.customerName}</span>
                                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">needs</span>
                                            <span className="text-sm font-black text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">"{req.query}"</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Tabs Section */}
                <div className="sticky top-24 z-40 bg-[#f8fafc]/90 backdrop-blur-md py-6 -mx-6 px-6 mb-16">
                    <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[28px] shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-bold text-slate-700"
                                placeholder={activeTab === 'stores' ? "Find stores..." : "Search products..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex bg-white p-1.5 rounded-[28px] border border-slate-200 shadow-xl shadow-slate-200/50 shrink-0">
                            <button
                                onClick={() => setActiveTab('stores')}
                                className={`flex items-center gap-2 px-8 py-4 rounded-[22px] transition-all font-bold text-[10px] uppercase tracking-widest ${activeTab === 'stores' ? 'bg-slate-900 text-white shadow-xl rotate-0' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <HiOutlineBuildingStorefront className="w-4 h-4" />
                                Stores
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`flex items-center gap-2 px-8 py-4 rounded-[22px] transition-all font-bold text-[10px] uppercase tracking-widest ${activeTab === 'products' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <HiOutlineShoppingBag className="w-4 h-4" />
                                Products
                            </button>
                        </div>
                    </div>

                    {apiError && !loading && (
                        <div className="max-w-3xl mx-auto mt-4 p-4 bg-rose-50 border border-rose-100 rounded-[24px] flex items-center justify-between text-rose-600">
                            <p className="text-xs font-bold uppercase tracking-widest">{apiError}</p>
                            <button onClick={() => activeTab === 'stores' ? fetchStores() : fetchGlobalProducts()} className="px-4 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest">Retry</button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 animate-pulse h-64"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {activeTab === 'stores' ? (
                            filteredStores.length === 0 ? (
                                <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-slate-100 p-10">
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">No stores matches</h3>
                                    <p className="text-slate-400 font-medium">Try a different search term or category.</p>
                                </div>
                            ) : (
                                filteredStores.map(store => (
                                    <div
                                        key={store.id}
                                        onClick={() => store.id && navigate(`/shop/${store.id}`)}
                                        className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-colors duration-500">
                                            <HiOutlineBuildingStorefront className="w-8 h-8 text-slate-300 group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{store.name}</h3>
                                        {store.address && (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1 mb-6 flex items-center gap-2">
                                                <HiOutlineMapPin className="w-3 h-3" />
                                                {store.address}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] px-3 py-1 bg-indigo-50 rounded-lg">Official Partner</span>
                                            <HiOutlineArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            filteredProducts.length === 0 ? (
                                <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-slate-100 p-10">
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Product not found</h3>
                                    <p className="text-slate-400 font-medium mb-8">We couldn't find matches. Would you like to post a request?</p>
                                    <button onClick={() => setIsRequestModalOpen(true)} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Post Custom Request</button>
                                </div>
                            ) : (
                                filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => product.storeId && navigate(`/shop/${product.storeId}/product/${product.id}`)}
                                        className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col h-full"
                                    >
                                        <div className="aspect-square bg-slate-50 rounded-[32px] overflow-hidden mb-8 relative">
                                            {product.imageUrls?.[0] ? (
                                                <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <HiOutlineShoppingBag className="w-16 h-16 text-slate-200 group-hover:text-indigo-600/20 group-hover:scale-125 transition-all duration-1000" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                                                <p className="text-sm font-black text-slate-900">
                                                    {product.currency ? formatCurrency(product.price, { currency: product.currency } as any) : `$${product.price}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-slate-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">via {product.storeName}</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] px-3 py-1 bg-emerald-50 rounded-lg">Available Now</span>
                                            <div className="p-3 bg-slate-900 text-white rounded-2xl group-hover:bg-indigo-600 transition-colors shadow-lg">
                                                <HiOutlineArrowRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                )}
            </main>

            <footer className="mt-20 border-t border-slate-100 bg-white py-20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-slate-900 p-2 rounded-xl">
                                <HiOutlineBuildingStorefront className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-black text-slate-900 tracking-tight">SalePilot Market</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">The OS for modern commerce</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-10">
                        {['Partners', 'Legal', 'Privacy', 'Contact'].map(link => (
                            <a key={link} href="#" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">{link}</a>
                        ))}
                    </div>
                </div>
            </footer>

            {/* Mobile Actions */}
            <div className="fixed bottom-8 right-6 z-50 md:hidden">
                <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="p-5 bg-indigo-600 text-white rounded-[28px] shadow-2xl shadow-indigo-200 border-4 border-white active:scale-90 transition-all"
                >
                    <HiOutlinePlus className="w-7 h-7" />
                </button>
            </div>

            <RequestWizard
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSubmit={handleRequestSubmit}
            />

            {snackbar && (
                <Snackbar
                    message={snackbar.message}
                    type={snackbar.type}
                    onClose={() => setSnackbar(null)}
                />
            )}
        </div>
    );
}
