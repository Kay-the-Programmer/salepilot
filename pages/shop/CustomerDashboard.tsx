import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus,
    HiOutlineChatBubbleLeftRight,
    HiOutlineClock,
    HiOutlineFire,
    HiOutlineRectangleStack
} from 'react-icons/hi2';
import { api } from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import { formatCurrency } from '../../utils/currency';
import RequestWizard from '../../components/RequestWizard';
import Snackbar from '../../components/Snackbar';
import { SnackbarType } from '../../App';

export default function CustomerDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'requests'>('dashboard');
    const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType } | null>(null);
    const navigate = useNavigate();
    const user = getCurrentUser();

    const defaultSettings = useMemo(() => ({
        currency: { code: 'USD', symbol: '$', position: 'before' },
        businessName: 'SalePilot'
    }), []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await api.get<any[]>('/marketplace/my-requests');
            setRequests(data);
        } catch (error: any) {
            console.error('Error fetching requests:', error);
            setSnackbar({ message: 'Failed to load requests', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'customer') {
            navigate('/customer/login');
            return;
        }
        fetchRequests();

        // Refetch when page becomes visible (e.g., when navigating back)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchRequests();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Refetch requests when switching back to dashboard tab
    useEffect(() => {
        if (activeTab === 'dashboard' && !loading) {
            fetchRequests();
        }
    }, [activeTab]);

    const handleRequestSubmit = async (formData: any) => {
        try {
            const response = await api.post<{ id: string }>('/marketplace/requests', {
                ...formData,
                targetPrice: parseFloat(formData.targetPrice)
            });
            setSnackbar({ message: 'Broadcasting your request...', type: 'success' });
            setTimeout(() => {
                if (response && response.id) {
                    navigate(`/marketplace/track/${response.id}`);
                } else {
                    fetchRequests();
                }
            }, 1500);
        } catch (error) {
            console.error('Error submitting request:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header Navigation */}
            <header className="liquid-glass-header border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <h1 className="text-xl font-bold text-slate-900">SalePilot</h1>
                            <nav className="hidden md:flex gap-1">
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'dashboard'
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setActiveTab('requests')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'requests'
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <HiOutlineRectangleStack className="w-4 h-4" />My Requests
                                </button>
                            </nav>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
                            <button
                                onClick={() => setIsRequestModalOpen(true)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 active:scale-95 transition-all duration-300"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                                <span className="hidden sm:inline">New Request</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="md:hidden flex gap-1 pb-3">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'dashboard'
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'requests'
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <HiOutlineRectangleStack className="w-4 h-4" />
                            Requests
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto px-6 w-full py-8">
                {activeTab === 'dashboard' ? (
                    <>
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Active Requests</p>
                                        <h3 className="text-3xl font-bold text-slate-900">{requests.filter(r => r.status === 'open').length}</h3>
                                    </div>
                                    <HiOutlineFire className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Pending Offers</p>
                                        <h3 className="text-3xl font-bold text-slate-900">{requests.reduce((acc, r) => acc + (r.offerCount || 0), 0)}</h3>
                                    </div>
                                    <HiOutlineChatBubbleLeftRight className="w-8 h-8 text-orange-600" />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Completed Deals</p>
                                        <h3 className="text-3xl font-bold text-slate-900">{requests.filter(r => r.status === 'completed').length}</h3>
                                    </div>
                                    <HiOutlineClock className="w-8 h-8 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        {/* Recent Requests Preview */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Recent Requests</h3>
                                <button
                                    onClick={() => setActiveTab('requests')}
                                    className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                                >
                                    View All
                                </button>
                            </div>

                            {requests.length === 0 ? (
                                <div className="py-12 text-center">
                                    <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 mb-4">No requests yet</p>
                                    <button
                                        onClick={() => setIsRequestModalOpen(true)}
                                        className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors active:scale-95 transition-all duration-300"
                                    >
                                        Create First Request
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {requests.slice(0, 4).map((req) => (
                                        <div
                                            key={req.id}
                                            onClick={() => navigate(`/marketplace/track/${req.id}`)}
                                            className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors cursor-pointer active:scale-95 transition-all duration-300"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                    req.status === 'open' ? 'bg-blue-50 text-blue-700' :
                                                        'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h4 className="font-semibold text-slate-900 mb-2 line-clamp-1">
                                                "{req.query}"
                                            </h4>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">{req.offerCount || 0} offers</span>
                                                <span className="font-bold text-slate-900">{formatCurrency(req.targetPrice, defaultSettings as any)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // All Requests Tab
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">All My Requests</h2>
                        {requests.length === 0 ? (
                            <div className="py-24 text-center border border-slate-200 rounded-2xl">
                                <HiOutlineChatBubbleLeftRight className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 mb-4">No requests found</p>
                                <button
                                    onClick={() => setIsRequestModalOpen(true)}
                                    className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors active:scale-95 transition-all duration-300"
                                >
                                    Create Your First Request
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {requests.map((req) => (
                                    <div
                                        key={req.id}
                                        onClick={() => navigate(`/marketplace/track/${req.id}`)}
                                        className="border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer active:scale-95 transition-all duration-300"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                req.status === 'open' ? 'bg-blue-50 text-blue-700' :
                                                    'bg-amber-50 text-amber-700'
                                                }`}>
                                                {req.status}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h4 className="text-lg font-semibold text-slate-900 mb-3 line-clamp-2">
                                            "{req.query}"
                                        </h4>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <div>
                                                <p className="text-xs text-slate-500">Offers</p>
                                                <p className="text-lg font-bold text-slate-900">{req.offerCount || 0}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">Target Price</p>
                                                <p className="text-lg font-bold text-slate-900">{formatCurrency(req.targetPrice, defaultSettings as any)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

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
