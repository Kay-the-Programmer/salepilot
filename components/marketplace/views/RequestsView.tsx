import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { MarketplaceRequest } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { HiOutlineShoppingBag, HiOutlineArrowRight } from 'react-icons/hi2';

export default function RequestsView() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<MarketplaceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                // Try to fetch real requests
                const data = await api.get<MarketplaceRequest[]>('/marketplace/requests');
                // Filter for 'open' requests
                const openRequests = data.filter(r => r.status === 'open');
                setRequests(openRequests);
            } catch (error) {
                console.error("Failed to fetch requests, using mock data", error);
                // Mock data for demonstration
                setRequests([
                    {
                        id: 'req_1',
                        customerName: 'Alice Coffee Shop',
                        customerEmail: 'alice@example.com',
                        query: 'Organic Coffee Beans (Bulk)',
                        targetPrice: 15.00,
                        status: 'open',
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'req_2',
                        customerName: 'Tech Start Inc.',
                        customerEmail: 'procurement@techstart.io',
                        query: 'Ergonomic Office Chairs x 10',
                        targetPrice: 200.00,
                        status: 'open',
                        createdAt: new Date(Date.now() - 86400000).toISOString()
                    },
                    {
                        id: 'req_3',
                        customerName: 'Local Bistro',
                        customerEmail: 'chef@localbistro.com',
                        query: 'Fresh Tomatoes (20kg)',
                        targetPrice: 40.00,
                        status: 'open',
                        createdAt: new Date(Date.now() - 172800000).toISOString()
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Requests</h2>
                    <p className="text-slate-500 mt-2">Browse what buyers are looking for and submit your best offer.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <HiOutlineShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">No Active Requests</h3>
                    <p className="text-slate-500 mt-2">Check back later for new opportunities.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map(request => (
                        <div key={request.id} className="liquid-glass-card rounded-[2rem] p-6 md:p-8 border border-slate-100 hover: hover:-slate-200/50 transition-all group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                            Request
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        "{request.query}"
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                            {request.customerName.charAt(0)}
                                        </div>
                                        <span className="text-sm font-bold text-slate-500">{request.customerName}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 md:border-l md:border-slate-100 md:pl-8">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Price</p>
                                        <p className="text-2xl font-black text-slate-900">
                                            {formatCurrency(request.targetPrice, { currency: { symbol: '$', code: 'USD', position: 'before' } } as any)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/marketplace/request/${request.id}`)}
                                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-indigo-600 transition-colors flex items-center gap-2 active:scale-95 transition-all duration-300"
                                    >
                                        Post Offer
                                        <HiOutlineArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
