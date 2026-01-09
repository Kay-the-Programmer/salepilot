import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBuildingStorefront, HiOutlineMagnifyingGlass, HiOutlineShoppingBag, HiOutlinePlus, HiOutlineMapPin, HiOutlineArrowRight } from 'react-icons/hi2';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import RequestWizard from '../../components/RequestWizard';

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

const MarketplacePage: React.FC = () => {
    const [stores, setStores] = useState<PublicStore[]>([]);
    const [products, setProducts] = useState<PublicProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'stores' | 'products'>('stores');
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const navigate = useNavigate();

    const [recentRequests, setRecentRequests] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'stores') {
            fetchStores();
        } else {
            fetchGlobalProducts();
        }
    }, [activeTab]);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const data = await api.get<PublicStore[]>('/shop/stores');
            setStores(data);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalProducts = async () => {
        setLoading(true);
        try {
            const data = await api.get<PublicProduct[]>('/shop/global-products');
            setProducts(data);
        } catch (error) {
            console.error('Error fetching global products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSubmit = async (formData: any) => {
        try {
            await api.post('/marketplace/requests', {
                ...formData,
                targetPrice: parseFloat(formData.targetPrice)
            });
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

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Premium Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[60] h-16 sm:h-20 flex items-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group" onClick={() => navigate('/directory')}>
                        <div className="bg-[#0A2E5C] p-2 rounded-xl shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300">
                            <HiOutlineBuildingStorefront className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">SalePilot <span className="text-[#FF7F27]">Market</span></h1>
                    </div>

                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all font-bold text-xs sm:text-sm shadow-xl shadow-slate-200 active:scale-95"
                    >
                        <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden xs:inline">Post a Request</span>
                        <span className="xs:hidden">Request</span>
                    </button>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 sm:py-20">
                {/* Hero Section */}
                <div className="text-center mb-16 sm:mb-24 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF7F27]/5 rounded-full blur-3xl opacity-50 -z-10"></div>
                    <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
                        The ultimate supply <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0A2E5C] to-[#FF7F27]">marketplace.</span>
                    </h2>
                    <p className="text-base sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                        Search across our global partner network or post an RFQ to get the best deals from verified sellers.
                    </p>
                </div>

                {/* Live Activity Ticker */}
                {recentRequests.length > 0 && (
                    <div className="mb-16 -mt-8 flex justify-center animate-in slide-in-from-bottom-4 duration-1000">
                        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-full border border-indigo-100/50 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {recentRequests.slice(0, 3).map((r) => (
                                        <div key={r.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0A2E5C] to-[#FF7F27] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                            {r.customerName[0]}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Live Activity</span>
                            </div>
                            <div className="h-4 w-px bg-slate-200 mx-1"></div>
                            <div className="flex gap-4 overflow-hidden mask-fade-edges h-5 items-center">
                                <div className="flex gap-8 animate-marquee whitespace-nowrap">
                                    {[...recentRequests, ...recentRequests].map((req, idx) => (
                                        <div key={`${req.id}-${idx}`} className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-900">{req.customerName}</span>
                                            <span className="text-sm text-slate-500">requested</span>
                                            <span className="text-sm font-bold text-indigo-600">"{req.query}"</span>
                                            <span className="text-[10px] text-slate-300 font-black">•</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Tabs Section */}
                <div className="flex flex-col items-center gap-8 mb-16 sticky top-24 sm:top-28 z-40 px-2 py-2">
                    <div className="w-full max-w-2xl bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <HiOutlineMagnifyingGlass className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-12 pr-4 py-4 sm:py-4 border-none rounded-2xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 transition-all"
                                placeholder={activeTab === 'stores' ? "Find a store..." : "Search products..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl sm:w-auto">
                            <button
                                onClick={() => setActiveTab('stores')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'stores' ? 'bg-white text-[#0A2E5C] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <HiOutlineBuildingStorefront className="w-4 h-4" />
                                Stores
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'products' ? 'bg-white text-[#0A2E5C] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <HiOutlineShoppingBag className="w-4 h-4" />
                                Products
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in duration-500">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-pulse flex flex-col gap-4">
                                <div className="h-40 bg-slate-100 rounded-2xl"></div>
                                <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                                <div className="h-3 bg-slate-100 rounded-full w-1/2"></div>
                                <div className="mt-auto h-10 bg-slate-100 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {activeTab === 'stores' ? (
                            filteredStores.length === 0 ? (
                                <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <HiOutlineBuildingStorefront className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">No stores matched</h3>
                                    <p className="mt-2 text-slate-500">Try a different name or location.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {filteredStores.map(store => (
                                        <div
                                            key={store.id}
                                            className="bg-white rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 overflow-hidden flex flex-col group cursor-pointer"
                                            onClick={() => store.id && navigate(`/shop/${store.id}`)}
                                        >
                                            <div className="h-40 bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors relative">
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#0A2E5C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <HiOutlineBuildingStorefront className="h-14 w-14 text-slate-300 group-hover:text-[#FF7F27] group-hover:scale-110 transition-all duration-500" />
                                            </div>
                                            <div className="p-8 flex-1 flex flex-col">
                                                <div className="mb-4">
                                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-[#0A2E5C] transition-colors truncate">{store.name}</h3>
                                                    {store.address && (
                                                        <div className="flex items-start gap-1 mt-2">
                                                            <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                            <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">{store.address}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-auto pt-4 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">Verified Store</span>
                                                    <HiOutlineArrowRight className="w-5 h-5 text-[#FF7F27] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            filteredProducts.length === 0 ? (
                                <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <HiOutlineShoppingBag className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">Items not found</h3>
                                    <p className="mt-2 text-slate-500">Post a request and let sellers find it for you.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            className="bg-white rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 overflow-hidden flex flex-col group cursor-pointer"
                                            onClick={() => product.storeId && navigate(`/shop/${product.storeId}/product/${product.id}`)}
                                        >
                                            <div className="aspect-square bg-slate-50 relative overflow-hidden">
                                                {product.imageUrls?.[0] ? (
                                                    <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <HiOutlineShoppingBag className="w-16 h-16 text-slate-200 group-hover:scale-110 transition-transform duration-700" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg text-sm font-black text-[#FF7F27]">
                                                    {product.currency ? formatCurrency(product.price, { currency: product.currency } as any) : `$${product.price}`}
                                                </div>
                                            </div>
                                            <div className="p-8 flex-1 flex flex-col">
                                                <div className="mb-4">
                                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0A2E5C] transition-colors line-clamp-1">{product.name}</h3>
                                                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.2em] font-black">By {product.storeName}</p>
                                                </div>
                                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                                                    <span className="text-[10px] font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg">In Stock</span>
                                                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-[#FF7F27] transition-colors shadow-lg shadow-slate-100">
                                                        <HiOutlineArrowRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}
            </main>

            {/* Premium Request Wizard */}
            <RequestWizard
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSubmit={handleRequestSubmit}
            />

            <footer className="bg-white border-t border-slate-200 mt-20">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                            <div className="bg-slate-900 p-1.5 rounded-lg">
                                <HiOutlineBuildingStorefront className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-base font-black text-slate-900 tracking-tight">SalePilot Marketplace</span>
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Empowering commerce since 2024</p>
                    </div>
                    <div className="flex gap-10 text-sm font-bold text-slate-500">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Join as Seller</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MarketplacePage;
