import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineBuildingStorefront,
    HiOutlineMagnifyingGlass,
    HiOutlineShoppingBag,
    HiOutlinePlus,
    HiOutlineArrowRight,
    HiOutlineUserCircle,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineBolt
} from 'react-icons/hi2';
import { api } from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import { formatCurrency } from '../../utils/currency';
import RequestWizard from '../../components/RequestWizard';
import Snackbar from '../../components/Snackbar';
import { SnackbarType } from '../../App';
import SalePilotLogo from '../../assets/salepilot.png';


// interface PublicStore {
//     id: string;
//     name: string;
//     status: string;
//     address?: string;
//     phone?: string;
//     email?: string;
//     website?: string;
//     currency?: { code: string; symbol: string };
// }

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
    // const [stores, setStores] = useState<PublicStore[]>([]);
    const [products, setProducts] = useState<PublicProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    // const [activeTab, setActiveTab] = useState<'stores' | 'products'>('stores');
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    // const [apiError, setApiError] = useState<string | null>(null);
    // const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType } | null>(null);

    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const showSnackbar = (message: string, type: SnackbarType = 'success') => {
        setSnackbar({ message, type });
    };

    useEffect(() => {
        // if (activeTab === 'stores') fetchStores();
        // else 
        fetchGlobalProducts();
    }, []);

    // const fetchStores = async () => {
    //     setLoading(true);
    //     // setApiError(null);
    //     try {
    //         const data = await api.get<PublicStore[]>('/shop/stores');
    //         setStores(data || []);
    //     } catch (error: any) {
    //         console.error('Failed to fetch stores', error);
    //         setStores([]);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchGlobalProducts = async () => {
        setLoading(true);
        // setApiError(null);
        try {
            const data = await api.get<PublicProduct[]>('/shop/global-products');
            setProducts(data || []);
        } catch (error: any) {
            console.error('Failed to fetch products', error);
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
            // fetchRecentRequests();
        } catch (error) {
            console.error('Error submitting request:', error);
            throw error;
        }
    };

    // const fetchRecentRequests = async () => {
    //     try {
    //         const data = await api.get<any[]>('/marketplace/requests/recent');
    //         setRecentRequests(data);
    //     } catch (error) {
    //         console.error('Error fetching recent requests:', error);
    //     }
    // };

    // useEffect(() => {
    //     fetchRecentRequests();
    //     const interval = setInterval(fetchRecentRequests, 10000);
    //     return () => clearInterval(interval);
    // }, []);

    // const filteredStores = useMemo(() => stores.filter(store =>
    //     store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //     (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
    // ), [stores, searchTerm]);

    const filteredProducts = useMemo(() => products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Top Bar */}
            <div className="bg-slate-100 py-2 text-center border-b border-slate-200 hidden sm:block">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Free express worldwide shipping on all orders over $200. <span className="underline cursor-pointer">See Details</span>
                </p>
            </div>

            {/* Main Header */}
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

                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl hidden md:block relative">
                        <input
                            type="text"
                            placeholder="Search for products, brands and more..."
                            className="w-full h-11 pl-5 pr-12 rounded-full bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* Hero Section */}
            <section className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Slider */}
                <div className="lg:col-span-8 bg-slate-100 rounded-3xl overflow-hidden relative min-h-[400px] flex items-center px-12">
                    <div className="relative z-10 max-w-lg">
                        <span className="px-3 py-1 bg-white/80 backdrop-blur rounded-lg text-[10px] font-black uppercase tracking-widest text-[#FF7F27] mb-4 inline-block">SalePilot Deals</span>
                        <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-[0.9] mb-6 tracking-tight">
                            Performance <br /> Meets Design
                        </h2>
                        <button onClick={() => { }} className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold uppercase text-xs tracking-widest hover:bg-[#0A2E5C] transition-colors">
                            Shop Now
                        </button>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-orange-100 to-transparent pointer-events-none" />
                    {/* Abstract shape or image placeholder */}
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 w-80 h-80 bg-[#FF7F27]/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Right Banners */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-[#fff8f0] rounded-3xl p-8 relative overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1">
                        <div className="relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2 block">Limited Edition</span>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">Spring Revival</h3>
                            <button className="text-xs font-bold underline decoration-2 underline-offset-4 decoration-orange-500">Shop Sales</button>
                        </div>
                    </div>
                    <div className="flex-1 bg-[#f0f9ff] rounded-3xl p-8 relative overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1">
                        <div className="relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 block">New Arrivals</span>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">Vacuum Robots</h3>
                            <button className="text-xs font-bold underline decoration-2 underline-offset-4 decoration-blue-500">Discover</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Strip */}
            <div className="max-w-[1400px] mx-auto px-6 py-8 border-b border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: HiOutlineShoppingBag, title: "Fast Free Shipping", sub: "On orders over $180" },
                        { icon: HiOutlineUserCircle, title: "24/7 Support", sub: "Online consultations" },
                        { icon: HiOutlineArrowRight, title: "Risk-Free Returns", sub: "30-day money back" },
                        { icon: HiOutlineBuildingStorefront, title: "Verified Sellers", sub: "Trusted marketplace" },
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                            <feature.icon className="w-8 h-8 text-slate-300" />
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wide text-slate-900">{feature.title}</h4>
                                <p className="text-[10px] text-slate-400 font-bold">{feature.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Flash Deals Section (Using Stores for now or Products mock) */}
            <section className="max-w-[1400px] mx-auto px-6 py-16">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Flash Deals</h3>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors">
                            <HiOutlineArrowLeftOnRectangle className="w-4 h-4 rotate-180" />
                        </button>
                        <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors">
                            <HiOutlineArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                    {loading ? (
                        [1, 2, 3, 4, 5].map(i => <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse" />)
                    ) : (
                        (filteredProducts.length > 0 ? filteredProducts.slice(0, 5) : []).map((product: any, idx) => (
                            <div
                                key={product.id || idx}
                                className="group cursor-pointer"
                                onClick={() => product.storeId && navigate(`/shop/${product.storeId}/product/${product.id}`)}
                            >
                                <div className="relative bg-slate-50 rounded-3xl p-6 mb-4 overflow-hidden">
                                    {product?.id && (
                                        <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg z-10">
                                            -20%
                                        </div>
                                    )}
                                    <div className="aspect-[4/5] flex items-center justify-center">
                                        {product?.imageUrls?.[0] ? (
                                            <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <HiOutlineShoppingBag className="w-16 h-16 text-slate-200" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{product?.name || 'Example Product'}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500 font-black">
                                            {product.currency ? formatCurrency(product.price, { currency: product.currency } as any) : `$${product.price}`}
                                        </span>
                                        {/* <span className="text-slate-300 text-xs line-through decoration-2">$399.00</span> */}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Categories Grid */}
            <section className="bg-slate-50 py-20 border-y border-slate-200/50">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center mb-12">
                        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">What Are You Shopping For?</h3>
                        <a href="#" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600">View All Categories</a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#e0f2f1] rounded-[40px] p-10 relative overflow-hidden h-80 group cursor-pointer">
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black text-[#00695c] mb-4">Home & Garden</h4>
                                <button className="px-6 py-3 bg-white text-[#00695c] rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#00695c] hover:text-white transition-colors">Go to Store</button>
                            </div>
                        </div>
                        <div className="bg-[#e3f2fd] rounded-[40px] p-10 relative overflow-hidden h-80 group cursor-pointer">
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black text-[#1565c0] mb-4">Electronics</h4>
                                <button className="px-6 py-3 bg-white text-[#1565c0] rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#1565c0] hover:text-white transition-colors">See More</button>
                            </div>
                            <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-[#bbdefb] rounded-full blur-3xl opacity-50 pointer-events-none" />
                        </div>
                        <div className="bg-[#fce4ec] rounded-[40px] p-10 relative overflow-hidden h-80 group cursor-pointer">
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black text-[#ad1457] mb-4">Fashion & Style</h4>
                                <button className="px-6 py-3 bg-white text-[#ad1457] rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#ad1457] hover:text-white transition-colors">Explore</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Request Banner */}
            <section className="max-w-[1400px] mx-auto px-6 py-20">
                <div className="bg-slate-900 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h3 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Can't find what you need?</h3>
                        <p className="text-slate-400 text-lg mb-10">Post a request and let our network of sellers come to you with their best offers.</p>
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="px-10 py-5 bg-white text-slate-900 rounded-full font-black uppercase text-sm tracking-widest hover:bg-[#FF7F27] hover:text-white transition-all shadow-xl shadow-white/10"
                        >
                            <HiOutlinePlus className="inline w-5 h-5 mr-2 -mt-0.5" />
                            Post a Request
                        </button>
                    </div>
                    {/* Abstract Circles */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-[#0A2E5C]/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#FF7F27]/20 rounded-full blur-[100px]" />
                </div>
            </section>

            {/* Brands Strip */}
            <div className="border-t border-slate-100 bg-slate-50 py-12">
                <div className="max-w-[1400px] mx-auto px-6 overflow-hidden">
                    <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">Trusted by Global Brands</p>
                    <div className="flex justify-between items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500 overflow-x-auto gap-12">
                        {['Samsung', 'Apple', 'Sony', 'Nike', 'Adidas', 'Huawei', 'Xiaomi'].map(brand => (
                            <span key={brand} className="text-2xl font-black text-slate-900 shrink-0">{brand}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-20">
                <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <img src={SalePilotLogo} alt="SalePilot" className="h-10 w-auto object-contain" />
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">The most trusted marketplace for verified local businesses and global brands.</p>
                    </div>
                    {[
                        { head: "Company", links: ["About Us", "Careers", "Blog", "Contact"] },
                        { head: "Shop", links: ["All Products", "Locations", "Flash Deals", "Request Item"] },
                        { head: "Support", links: ["Help Center", "Terms of Service", "Privacy Policy", "Returns"] }
                    ].map((col, i) => (
                        <div key={i}>
                            <h5 className="font-bold text-slate-900 mb-6">{col.head}</h5>
                            <ul className="space-y-4">
                                {col.links.map(l => (
                                    <li key={l}><a href="#" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">{l}</a></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="max-w-[1400px] mx-auto px-6 mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <p>&copy; 2026 SalePilot. All rights reserved.</p>
                    <div className="flex gap-6">
                        <span>Visa</span>
                        <span>Mastercard</span>
                        <span>Wipay</span>
                        <span>PayPal</span>
                    </div>
                </div>
            </footer>

            {/* Mobile Actions */}
            <div className="fixed bottom-6 right-6 z-50 md:hidden">
                <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="w-14 h-14 bg-[#FF7F27] rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-500/30 hover:scale-110 active:scale-95 transition-all"
                >
                    <HiOutlinePlus className="w-6 h-6" />
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
