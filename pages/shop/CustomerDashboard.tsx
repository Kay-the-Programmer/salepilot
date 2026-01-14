import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineBuildingStorefront,
    HiOutlinePlus,
    HiOutlineChatBubbleLeftRight,
    HiOutlineClock,
    HiOutlineChevronRight,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineUserCircle,
    HiOutlineBolt,
    HiOutlineFire
} from 'react-icons/hi2';
import { api } from '../../services/api';
import { getCurrentUser, logout } from '../../services/authService';
import { formatCurrency } from '../../utils/currency';
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
`;

export default function CustomerDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType } | null>(null);
    const navigate = useNavigate();
    const user = getCurrentUser();

    // Mock settings for currency
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
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/directory');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-6 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
            <style>{styles}</style>

            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50/50 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]"></div>
            </div>

           

            <main className="flex-grow max-w-7xl mx-auto px-6 w-full py-20 animate-fadeIn">
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
                    <div className="max-w-2xl">
                        
                        <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-6">
                            Hello, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-indigo-900">{user?.name.split(' ')[0]}.</span>
                        </h2>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Manage your marketplace requests, track live offers, and secure the best deals in real-time.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/directory')}
                        className="flex items-center justify-center gap-4 bg-slate-900 text-white px-10 py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 shadow-2xl shadow-slate-200 transition-all active:scale-95 group shrink-0"
                    >
                        Post New Request
                        <HiOutlinePlus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Requests</p>
                            <h3 className="text-4xl font-black text-slate-900">{requests.filter(r => r.status === 'open').length}</h3>
                        </div>
                        <div className="w-14 h-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600">
                            <HiOutlineFire className="w-7 h-7" />
                        </div>
                    </div>
                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Offers</p>
                            <h3 className="text-4xl font-black text-slate-900">{requests.reduce((acc, r) => acc + (r.offerCount || 0), 0)}</h3>
                        </div>
                        <div className="w-14 h-14 bg-orange-50 rounded-[20px] flex items-center justify-center text-orange-600">
                            <HiOutlineChatBubbleLeftRight className="w-7 h-7" />
                        </div>
                    </div>
                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Completed Deals</p>
                            <h3 className="text-4xl font-black text-slate-900">{requests.filter(r => r.status === 'completed').length}</h3>
                        </div>
                        <div className="w-14 h-14 bg-emerald-50 rounded-[20px] flex items-center justify-center text-emerald-600">
                            <HiOutlineBolt className="w-7 h-7" />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-[56px] p-8 sm:p-14 shadow-sm border border-slate-50 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                            My Active Requests
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{requests.length}</span>
                        </h3>
                        <div className="w-12 h-1 bg-slate-100 rounded-full"></div>
                    </div>

                    {requests.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="w-28 h-28 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-10">
                                <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-4">No Requests Found</h3>
                            <p className="text-slate-500 font-bold mb-12 max-w-sm mx-auto text-lg leading-relaxed">Tell the marketplace what you're looking for and let the best deals come to you.</p>
                            <button
                                onClick={() => navigate('/directory')}
                                className="bg-slate-900 text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all active:scale-95"
                            >
                                Broadcast a Request
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {requests.map((req, idx) => (
                                <div
                                    key={req.id}
                                    onClick={() => navigate(`/marketplace/track/${req.id}`)}
                                    className="group bg-slate-50/50 rounded-[48px] border border-slate-100 p-10 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col h-full"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            req.status === 'open' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {req.status}
                                        </span>
                                        <span className="text-slate-300 font-black text-[10px] uppercase tracking-widest leading-none mt-2">
                                            {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>

                                    <h4 className="text-2xl font-black text-slate-900 mb-4 line-clamp-2 leading-[1.2] group-hover:text-indigo-600 transition-colors">
                                        "{req.query}"
                                    </h4>

                                    <div className="flex items-center gap-3 mb-12 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                                            <HiOutlineClock className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        {req.offerCount || 0} Offers received
                                    </div>

                                    <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Target Price</p>
                                            <p className="text-2xl font-black text-slate-900">{formatCurrency(req.targetPrice, defaultSettings)}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                            <HiOutlineChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
