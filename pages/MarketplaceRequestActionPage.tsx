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
        <div className="min-h-screen bg-mesh-light flex flex-col items-center justify-center p-8 animate-pulse">
            <div className="w-12 h-12 border-4 border-sp-green border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-brand-text-muted uppercase tracking-widest">Loading Request...</p>
        </div>
    );

    if (!request) return (
        <div className="min-h-screen bg-mesh-light flex flex-col items-center justify-center p-8">
            <HiOutlineShoppingBag className="w-16 h-16 text-brand-border mb-6" />
            <h2 className="text-2xl font-black text-brand-text">Request not found</h2>
            <button onClick={onBack} className="mt-6 px-8 py-3 bg-sp-green text-white rounded-2xl font-bold hover:bg-sp-green-dark active:scale-95 transition-all">Go Back</button>
        </div>
    );

    const matchedProducts = products.filter(p =>
        p.name.toLowerCase().includes(request.query.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(request.query.toLowerCase()))
    );

    return (
        <div className="bg-mesh-light min-h-screen selection:bg-sp-green-soft selection:text-sp-green-dark">
            {/* Header */}
            <header className="bg-surface/90 backdrop-blur-md border-b border-brand-border sticky top-0 z-[60] h-16 sm:h-20 flex items-center shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center gap-4">
                    <button onClick={onBack} className="p-2.5 bg-surface-variant text-brand-text-muted hover:text-brand-text hover:bg-brand-border rounded-2xl transition-all active:scale-95">
                        <HiOutlineArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-brand-text tracking-tight">Post Offer</h1>
                        <p className="hidden sm:block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Marketplace Opportunity</p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="bg-surface border border-brand-border rounded-3xl shadow-sm overflow-hidden mb-12 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="p-8 sm:p-12">
                        {/* Status & Date */}
                        <div className="flex items-center justify-between mb-10">
                            <span className="px-4 py-1.5 bg-sp-green-soft text-sp-green-dark text-[10px] font-black rounded-xl uppercase tracking-widest border border-sp-green/20">Market Opportunity</span>
                            <div className="flex items-center gap-2 text-brand-text-muted">
                                <HiOutlineClock className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(request.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Request Title */}
                        <h2 className="text-3xl sm:text-4xl font-black text-brand-text mb-8 leading-tight tracking-tight">
                            Looking for <span className="text-sp-green-dark">"{request.query}"</span>
                        </h2>

                        {/* Price Display */}
                        <div className="flex items-center gap-6 p-6 bg-surface-variant rounded-[32px] border border-brand-border mb-10">
                            <div className="bg-sp-green p-3 rounded-2xl text-white">
                                <HiOutlineShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-1">Target Price</p>
                                <p className="text-3xl font-black text-brand-text">
                                    {storeSettings ? formatCurrency(request.targetPrice, storeSettings) : `$${request.targetPrice}`}
                                </p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-12">
                            <h3 className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-6 px-1">Customer Profile</h3>
                            <div className="flex items-center gap-4 p-6 bg-surface border border-brand-border rounded-[32px] group hover:border-sp-green/30 transition-all">
                                <div className="w-14 h-14 rounded-2xl bg-warm-900 flex items-center justify-center text-white text-xl font-black group-hover:bg-sp-green transition-colors active:scale-95">
                                    {request.customerName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-brand-text group-hover:text-sp-green-dark transition-colors">{request.customerName}</p>
                                    <p className="text-sm font-bold text-brand-text-muted truncate">{request.customerEmail}</p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-brand-border mb-12" />

                        {/* Offer Form */}
                        <form onSubmit={handleSubmitOffer} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-4 px-1">Select Catalog Item</label>
                                <select
                                    className="w-full px-6 py-4 bg-surface-variant border-none rounded-[24px] focus:ring-2 focus:ring-sp-green font-bold text-brand-text outline-none transition-all appearance-none cursor-pointer active:scale-95"
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
                                <label className="block text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-4 px-1">Your Quote ($)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-brand-text-muted group-focus-within:text-sp-green-dark transition-colors">
                                        <span className="text-xl font-black">$</span>
                                    </div>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full pl-12 pr-6 py-5 bg-surface-variant border-none rounded-[24px] focus:ring-2 focus:ring-sp-green font-black text-2xl text-brand-text outline-none transition-all placeholder-brand-text-muted"
                                        placeholder="0.00"
                                        value={offerPrice}
                                        onChange={e => setOfferPrice(e.target.value)}
                                    />
                                </div>
                                <p className="mt-3 text-[10px] font-bold text-brand-text-muted px-1 italic">Enter the price you are willing to sell for, including any applicable discounts.</p>
                            </div>

                            <div className="pt-6 flex flex-col sm:flex-row gap-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-5 bg-sp-green text-white rounded-[28px] font-black text-lg hover:bg-sp-green-dark transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
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
                                    className="px-10 py-5 bg-surface-variant text-brand-text rounded-[28px] font-black text-lg hover:bg-brand-border transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Seller Protection Tip */}
                <div className="bg-success-muted rounded-[32px] p-8 border border-success/20 flex items-start gap-4">
                    <div className="bg-success p-2 rounded-xl text-white shrink-0">
                        <HiOutlineCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-sp-green-dark uppercase tracking-widest mb-1">Seller Tip</h4>
                        <p className="text-sm font-medium text-sp-green-dark leading-relaxed">
                            Matched items increase conversion by 40%. Ensure your product details are accurate before submitting your offer.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MarketplaceRequestActionPage;
