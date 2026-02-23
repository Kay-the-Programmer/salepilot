import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    HiOutlineArrowLeft,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlinePhone,
    HiOutlineEnvelope,
    HiOutlineMapPin,
    HiOutlineArrowPath
} from 'react-icons/hi2';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import Snackbar from '../../components/Snackbar';
import { SnackbarType } from '../../App';
import { MarketplaceRequest } from '../../types';

export default function CustomerRequestTrackingPage() {
    const { requestId } = useParams<{ requestId: string }>();
    const [request, setRequest] = useState<MarketplaceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType } | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
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
        const interval = setInterval(fetchRequestDetails, 30000);
        return () => clearInterval(interval);
    }, [requestId]);

    const handleRespond = async (offerId: string, action: 'accept' | 'decline') => {
        setRespondingTo(offerId);
        try {
            await api.post(`/marketplace/offers/${offerId}/respond`, { action });
            setSnackbar({
                message: action === 'accept' ? 'Offer accepted!' : 'Offer declined',
                type: 'success'
            });
            fetchRequestDetails();
        } catch (err: any) {
            setSnackbar({ message: err.message || 'Failed to respond', type: 'error' });
        } finally {
            setRespondingTo(null);
        }
    };

    const handleCancelRequest = async () => {
        if (!request) return;

        setIsCancelling(true);
        try {
            await api.put(`/marketplace/requests/${requestId}/cancel`, {});
            setSnackbar({ message: 'Request cancelled successfully', type: 'success' });
            setShowCancelConfirm(false);
            // Refresh request details to show updated status
            await fetchRequestDetails();
        } catch (err: any) {
            setSnackbar({ message: err.message || 'Failed to cancel request', type: 'error' });
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full"></div>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <HiOutlineXCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Not Found</h2>
                    <p className="text-slate-500 mb-6">{error || "This request doesn't exist"}</p>
                    <button
                        onClick={() => navigate('/directory')}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors active:scale-95 transition-all duration-300"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    const acceptedOffer = request.offers?.find(o => o.status === 'accepted');

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="liquid-glass-header border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors active:scale-95 transition-all duration-300"
                    >
                        <HiOutlineArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <span className="text-sm font-medium text-slate-500">Request Tracking</span>
                    <button
                        onClick={fetchRequestDetails}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors active:scale-95 transition-all duration-300"
                    >
                        <HiOutlineArrowPath className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Request Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${request.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            request.status === 'open' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                            {request.status}
                        </span>
                        <span className="text-sm text-slate-400">
                            {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-6">"{request.query}"</h1>
                    <div className="flex gap-8">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Target Price</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {formatCurrency(request.targetPrice, currencySettings as any)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Offers</p>
                            <p className="text-2xl font-bold text-slate-900">{request.offers?.length || 0}</p>
                        </div>
                    </div>

                    {/* Cancel Request Button */}
                    {request.status === 'open' && !acceptedOffer && (
                        <div className="mt-6">
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors border border-red-200 active:scale-95 transition-all duration-300"
                            >
                                Cancel Request
                            </button>
                        </div>
                    )}

                    {request.status === 'cancelled' && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700 font-medium">This request has been cancelled</p>
                        </div>
                    )}
                </div>

                {/* Accepted Deal Section */}
                {acceptedOffer && (
                    <div className="bg-slate-900 text-white rounded-2xl p-8 mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <HiOutlineCheckCircle className="w-6 h-6 text-emerald-400" />
                            <div>
                                <h3 className="text-xl font-bold">Deal Accepted</h3>
                                <p className="text-sm text-slate-300">{acceptedOffer.storeName}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-slate-400 mb-1">Final Price</p>
                            <p className="text-3xl font-bold">
                                {formatCurrency(acceptedOffer.sellerPrice, currencySettings as any)}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {acceptedOffer.storePhone && (
                                <a
                                    href={`tel:${acceptedOffer.storePhone}`}
                                    className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors active:scale-95 transition-all duration-300"
                                >
                                    <HiOutlinePhone className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="text-xs text-slate-400">Phone</p>
                                        <p className="font-medium">{acceptedOffer.storePhone}</p>
                                    </div>
                                </a>
                            )}
                            {acceptedOffer.storeEmail && (
                                <a
                                    href={`mailto:${acceptedOffer.storeEmail}`}
                                    className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors active:scale-95 transition-all duration-300"
                                >
                                    <HiOutlineEnvelope className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="text-xs text-slate-400">Email</p>
                                        <p className="font-medium truncate">{acceptedOffer.storeEmail}</p>
                                    </div>
                                </a>
                            )}
                        </div>

                        {acceptedOffer.storeAddress && (
                            <div className="flex items-start gap-3 p-4 bg-white/10 rounded-lg mt-4">
                                <HiOutlineMapPin className="w-5 h-5 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Address</p>
                                    <p className="font-medium">{acceptedOffer.storeAddress}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Offers List */}
                {!acceptedOffer && (
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">
                            {request.offers?.length === 0 ? 'Waiting for Offers' : 'Available Offers'}
                        </h2>

                        {request.offers?.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-500">Sellers are reviewing your request</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {request.offers?.filter(o => o.status !== 'declined').map((offer) => (
                                    <div key={offer.id} className="border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-1">{offer.storeName}</h3>
                                                <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded">
                                                    Verified
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500 mb-1">Offer Price</p>
                                                <p className="text-3xl font-bold text-slate-900">
                                                    {formatCurrency(offer.sellerPrice, currencySettings as any)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleRespond(offer.id, 'accept')}
                                                disabled={!!respondingTo}
                                                className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium active:scale-95 transition-all duration-300"
                                            >
                                                {respondingTo === offer.id ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                                                ) : (
                                                    'Accept Offer'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleRespond(offer.id, 'decline')}
                                                disabled={!!respondingTo}
                                                className="px-6 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 font-medium active:scale-95 transition-all duration-300"
                                            >
                                                Decline
                                            </button>
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

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && request && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="liquid-glass-card rounded-[2rem] max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <HiOutlineXCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Request?</h3>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to cancel this request? All pending offers will be declined.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    disabled={isCancelling}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50 active:scale-95 transition-all duration-300"
                                >
                                    Keep Request
                                </button>
                                <button
                                    onClick={handleCancelRequest}
                                    disabled={isCancelling}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-300"
                                >
                                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
