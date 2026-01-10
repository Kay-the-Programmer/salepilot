import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    HiOutlineBuildingStorefront,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineArrowLeft,
    HiOutlinePhone,
    HiOutlineEnvelope,
    HiOutlineMapPin,
    HiOutlineChatBubbleLeftRight,
    HiOutlineBolt,
    HiOutlineArrowPath
} from 'react-icons/hi2';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import Snackbar from '../../components/Snackbar';
import { SnackbarType } from '../../App';
import { MarketplaceRequest } from '../../types';

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

    @keyframes pingSlow {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.2); opacity: 0.4; }
        100% { transform: scale(1); opacity: 0.8; }
    }
    .animate-pingSlow {
        animation: pingSlow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
`;

export default function CustomerRequestTrackingPage() {
    const { requestId } = useParams<{ requestId: string }>();
    const [request, setRequest] = useState<MarketplaceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType } | null>(null);
    const navigate = useNavigate();

    const currencySettings = useMemo(() => ({
        currency: { symbol: '$', code: 'USD', position: 'before' }
    }), []);

    const fetchRequestDetails = async () => {
        try {
            const data = await api.get<MarketplaceRequest>(`/marketplace/requests/${requestId}`);
            setRequest(data);
        } catch (err: any) {
            console.error('Error fetching request details:', err);
            setError(err.message || 'Failed to load request details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequestDetails();
        const interval = setInterval(fetchRequestDetails, 30000); // Polling for new offers
        return () => clearInterval(interval);
    }, [requestId]);

    const handleRespond = async (offerId: string, action: 'accept' | 'decline') => {
        setRespondingTo(offerId);
        try {
            await api.post(`/marketplace/offers/${offerId}/respond`, { action });
            setSnackbar({
                message: action === 'accept' ? 'Offer accepted! Contact details exchanged.' : 'Offer declined.',
                type: 'success'
            });
            fetchRequestDetails();
        } catch (err: any) {
            setSnackbar({ message: err.message || 'Failed to respond to offer', type: 'error' });
        } finally {
            setRespondingTo(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-8 max-w-md text-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <HiOutlineBolt className="w-8 h-8 text-indigo-400 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Scanning Marketplace</h2>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Connecting to verified sellers...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-12 sm:p-20 rounded-[56px] shadow-2xl shadow-slate-200 border border-slate-100 max-w-xl w-full">
                    <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto mb-10">
                        <HiOutlineXCircle className="w-12 h-12 text-rose-500" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Request Not Found</h2>
                    <p className="text-slate-500 font-bold mb-12 text-lg leading-relaxed">{error || "The request you're looking for doesn't exist or has been removed."}</p>
                    <button
                        onClick={() => navigate('/directory')}
                        className="w-full bg-slate-900 text-white px-10 py-6 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    const acceptedOffer = request.offers?.find(o => o.status === 'accepted');

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 selection:bg-indigo-100 selection:text-indigo-900 relative">
            <style>{styles}</style>

            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-50/50 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <header className="glass-effect border-b border-slate-200/60 sticky top-0 z-[60] h-20 flex items-center">
                <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all active:scale-95 border border-transparent shadow-sm"
                    >
                        <HiOutlineArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/directory')}>
                        <div className="bg-slate-900 p-2.5 rounded-2xl shadow-xl shadow-slate-200 ring-4 ring-slate-50 group-hover:scale-110 transition-transform duration-500">
                            <HiOutlineBuildingStorefront className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">SalePilot <span className="text-indigo-600">Track</span></h1>
                    </div>
                    <div className="w-12"></div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16 animate-fadeIn">
                {/* Request Status Banner */}
                <div className="bg-white rounded-[56px] p-8 sm:p-14 shadow-sm border border-slate-100 mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/30 rounded-full -mr-40 -mt-40 blur-3xl opacity-60"></div>

                    <div className="relative">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${request.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    request.status === 'open' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                    {request.status} Request
                                </span>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mt-1 ml-4 border-l pl-4 border-slate-100">
                                    {new Date(request.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex -space-x-3">
                                {request.offers?.slice(0, 5).map((o, i) => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center text-xs font-black text-slate-500 hover:scale-110 transition-transform cursor-default" style={{ zIndex: 10 - i }}>
                                        <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center uppercase">{o.storeName[0]}</div>
                                    </div>
                                ))}
                                {(request.offers?.length || 0) > 5 && (
                                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white border-4 border-white flex items-center justify-center text-[10px] font-black z-0 shadow-lg">
                                        +{(request.offers?.length || 0) - 5}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter mb-10 leading-[0.9]">
                            "{request.query}"
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100/50 flex items-center gap-5">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100 text-indigo-600">
                                    <HiOutlineClock className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Target Price</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none italic">
                                        {formatCurrency(request.targetPrice, currencySettings as any)}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100/50 flex items-center gap-5">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100 text-emerald-600">
                                    <HiOutlineBolt className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Participation</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{request.offers?.length || 0} Stores</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accepted Deal Info */}
                {acceptedOffer && (
                    <div className="bg-slate-900 rounded-[56px] p-8 sm:p-14 shadow-2xl shadow-indigo-100 text-white mb-16 relative overflow-hidden animate-fadeIn">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-12">
                                <div className="flex-1">
                                    <div className="flex items-center gap-6 mb-10">
                                        <div className="w-16 h-16 bg-emerald-500 rounded-[24px] flex items-center justify-center shadow-2xl shadow-emerald-500/30 border-4 border-emerald-400">
                                            <HiOutlineCheckCircle className="w-10 h-10 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-2">Deal Secured!</h3>
                                            <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Connected with {acceptedOffer.storeName}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                                        {acceptedOffer.storePhone && (
                                            <button
                                                onClick={() => window.open(`tel:${acceptedOffer.storePhone}`)}
                                                className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-[32px] p-6 text-left transition-all active:scale-95 group"
                                            >
                                                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <HiOutlinePhone className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Call Store</p>
                                                <p className="text-lg font-black">{acceptedOffer.storePhone}</p>
                                            </button>
                                        )}
                                        {acceptedOffer.storeEmail && (
                                            <button
                                                onClick={() => window.open(`mailto:${acceptedOffer.storeEmail}`)}
                                                className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-[32px] p-6 text-left transition-all active:scale-95 group"
                                            >
                                                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <HiOutlineEnvelope className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Email Store</p>
                                                <p className="text-lg font-black truncate">{acceptedOffer.storeEmail}</p>
                                            </button>
                                        )}
                                    </div>

                                    {acceptedOffer.storeAddress && (
                                        <div className="bg-white/5 border border-white/5 rounded-[32px] p-8 mt-6">
                                            <div className="flex items-start gap-5">
                                                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                                                    <HiOutlineMapPin className="w-6 h-6 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Collection Point</p>
                                                    <p className="text-xl font-black leading-relaxed">{acceptedOffer.storeAddress}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0 flex items-center justify-center">
                                    <div className="bg-white p-12 sm:p-16 rounded-[48px] text-center shadow-2xl flex flex-col items-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Final Price</p>
                                        <p className="text-6xl font-black text-slate-900 tracking-tighter mb-10 italic">
                                            {formatCurrency(acceptedOffer.sellerPrice, currencySettings as any)}
                                        </p>
                                        <div className="px-8 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                                            Handled Offline
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Offers Section */}
                {!acceptedOffer && (
                    <div className="space-y-10">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                Live Offers
                                {request.offers?.length === 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pingSlow"></div>
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Scanning...</span>
                                    </div>
                                )}
                            </h3>
                            <button
                                onClick={fetchRequestDetails}
                                className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
                            >
                                <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {request.offers?.length === 0 ? (
                            <div className="bg-white border-4 border-dashed border-slate-100 rounded-[56px] py-32 px-10 text-center flex flex-col items-center">
                                <div className="bg-slate-50 w-28 h-28 rounded-[40px] flex items-center justify-center mb-10">
                                    <HiOutlineBuildingStorefront className="h-12 w-12 text-slate-200" />
                                </div>
                                <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Hang tight.</h4>
                                <p className="text-slate-500 font-bold text-lg max-w-sm mx-auto leading-relaxed">Verified sellers are evaluating your request. You'll receive a notification the moment an offer is live.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-12">
                                {request.offers?.filter(o => o.status !== 'declined').map((offer, idx) => (
                                    <div
                                        key={offer.id}
                                        className="bg-white rounded-[56px] p-8 sm:p-14 shadow-sm hover:shadow-2xl transition-all duration-700 border border-slate-100 group overflow-hidden relative"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[100px] -mr-8 -mt-8"></div>

                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-16">
                                                <div className="flex items-center gap-8">
                                                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 shadow-inner group-hover:scale-110 transition-transform duration-700 border border-slate-100">
                                                        <HiOutlineBuildingStorefront className="w-12 h-12" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{offer.storeName}</h4>
                                                        <div className="flex items-center gap-3 mt-4">
                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified Seller</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center md:items-end">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-2">Store Offer</p>
                                                    <p className="text-6xl font-black text-slate-900 tracking-tighter italic">
                                                        {formatCurrency(offer.sellerPrice, currencySettings as any)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-auto flex flex-col sm:flex-row gap-5">
                                                <button
                                                    onClick={() => handleRespond(offer.id, 'accept')}
                                                    disabled={!!respondingTo}
                                                    className="flex-[2] bg-slate-900 text-white py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95 group/btn"
                                                >
                                                    {respondingTo === offer.id ? (
                                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            Accept This Offer
                                                            <HiOutlineCheckCircle className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleRespond(offer.id, 'decline')}
                                                    disabled={!!respondingTo}
                                                    className="flex-1 bg-white text-slate-400 py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs hover:bg-rose-50 hover:text-rose-500 transition-all disabled:opacity-50 active:scale-95 border border-slate-200 hover:border-rose-100"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

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
