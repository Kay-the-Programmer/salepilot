import React, { useEffect, useState } from 'react';
import { MarketplaceRequest, Product, StoreSettings } from '../types';
import { api } from '../services/api';
import { getCurrentUser } from '../services/authService';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineShoppingBag, HiOutlineClock } from 'react-icons/hi2';
import { formatCurrency } from '../utils/currency';

interface MarketplaceRequestActionPageProps {
    requestId: string;
    products: Product[];
    storeSettings: StoreSettings | null;
    onBack: () => void;
    showSnackbar: (msg: string, type?: any) => void;
}

const MarketplaceRequestActionPage: React.FC<MarketplaceRequestActionPageProps> = ({
    requestId,
    products,
    storeSettings,
    onBack,
    showSnackbar
}) => {
    const [request, setRequest] = useState<MarketplaceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [offerPrice, setOfferPrice] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRequest();
    }, [requestId]);

    const fetchRequest = async () => {
        try {
            const data = await api.get<MarketplaceRequest>(`/marketplace/requests/${requestId}`);
            setRequest(data);
        } catch (error) {
            console.error('Failed to fetch request:', error);
            showSnackbar('Failed to load request details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!storeSettings || !user?.currentStoreId) return;
        setSubmitting(true);
        try {
            await api.post('/marketplace/offers', {
                requestId,
                storeId: user.currentStoreId,
                sellerPrice: parseFloat(offerPrice),
                productId: selectedProductId === 'custom' ? null : selectedProductId
            });
            showSnackbar('Offer submitted successfully!', 'success');
            onBack();
        } catch (error) {
            showSnackbar('Failed to submit offer', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-mesh-light flex flex-col items-center justify-center p-8 animate-pulse font-google">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Request...</p>
        </div>
    );

    if (!request) return (
        <div className="min-h-screen bg-mesh-light flex flex-col items-center justify-center p-8 font-google">
            <HiOutlineShoppingBag className="w-16 h-16 text-slate-200 mb-6" />
            <h2 className="text-2xl font-black text-slate-900">Request not found</h2>
            <button onClick={onBack} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold active:scale-95 transition-all">Go Back</button>
        </div>
    );

    const matchedProducts = products.filter(p =>
        p.name.toLowerCase().includes(request.query.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(request.query.toLowerCase()))
    );

    return (
        <div className="bg-mesh-light min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 font-google">
            {/* Header */}
            <header className="liquid-glass-header /80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[60] h-16 sm:h-20 flex items-center shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center gap-4">
                    <button onClick={onBack} className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:scale-90 active:scale-95 transition-all duration-300">
                        <HiOutlineArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Post Offer</h1>
                        <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marketplace Opportunity</p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="liquid-glass-card rounded-[2rem] rounded-[40px] -slate-200/50 border border-slate-100 overflow-hidden mb-12 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="p-8 sm:p-12">
                        {/* Status & Date */}
                        <div className="flex items-center justify-between mb-10">
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-indigo-100">Market Opportunity</span>
                            <div className="flex items-center gap-2 text-slate-400">
                                <HiOutlineClock className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(request.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Request Title */}
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
                            Looking for <span className="text-indigo-600">"{request.query}"</span>
                        </h2>

                        {/* Price Display */}
                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[32px] border border-slate-100 mb-10">
                            <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                                <HiOutlineShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Price</p>
                                <p className="text-3xl font-black text-slate-900">
                                    {storeSettings ? formatCurrency(request.targetPrice, storeSettings) : `$${request.targetPrice}`}
                                </p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-12">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Customer Profile</h3>
                            <div className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-[32px] group hover:border-indigo-100 transition-all">
                                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black group-hover:bg-indigo-600 transition-colors active:scale-95 transition-all duration-300">
                                    {request.customerName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{request.customerName}</p>
                                    <p className="text-sm font-bold text-slate-400 truncate">{request.customerEmail}</p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100 mb-12" />

                        {/* Offer Form */}
                        <form onSubmit={handleSubmitOffer} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Select Catalog Item</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-[24px] focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer active:scale-95 transition-all duration-300"
                                    value={selectedProductId}
                                    onChange={e => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">-- Match with your inventory --</option>
                                    {matchedProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>
                                    ))}
                                    <option value="custom">Generic Item / Manual Quote</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Your Quote ($)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <span className="text-xl font-black">$</span>
                                    </div>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full pl-12 pr-6 py-5 bg-slate-50 border-none rounded-[24px] focus:ring-2 focus:ring-indigo-500 font-black text-2xl text-slate-900 outline-none transition-all placeholder-slate-300"
                                        placeholder="0.00"
                                        value={offerPrice}
                                        onChange={e => setOfferPrice(e.target.value)}
                                    />
                                </div>
                                <p className="mt-3 text-[10px] font-bold text-slate-400 px-1 italic">Enter the price you are willing to sell for, including any applicable discounts.</p>
                            </div>

                            <div className="pt-6 flex flex-col sm:flex-row gap-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-5 bg-indigo-600 text-white rounded-[28px] font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? 'Broadcasting Offer...' : (
                                        <>
                                            <HiOutlineCheck className="w-6 h-6" />
                                            Submit Offer
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="px-10 py-5 bg-slate-100 text-slate-900 rounded-[28px] font-black text-lg hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Seller Protection Tip */}
                <div className="bg-emerald-50 rounded-[32px] p-8 border border-emerald-100 flex items-start gap-4">
                    <div className="bg-emerald-600 p-2 rounded-xl text-white shrink-0">
                        <HiOutlineCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-1">Seller Tip</h4>
                        <p className="text-sm font-medium text-emerald-700 leading-relaxed">
                            Matched items increase conversion by 40%. Ensure your product details are accurate before submitting your offer.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MarketplaceRequestActionPage;
