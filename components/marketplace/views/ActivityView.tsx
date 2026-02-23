import { useState } from 'react';
import { HiOutlineInbox, HiOutlinePaperAirplane, HiOutlineShoppingBag, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi2';

export default function ActivityView() {
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('sent');

    // Mock Data
    const sentOffers = [
        { id: 1, to: 'Alice Coffee Shop', item: 'Organic Coffee Beans', status: 'pending', price: '$14.50', date: '2 hours ago' },
        { id: 2, to: 'Tech Start Inc.', item: 'Ergonomic Chairs', status: 'accepted', price: '$195.00', date: '1 day ago' },
    ];

    const receivedRequests = [
        // Assuming this user is a seller, they might receive direct inquiries (future feature)
        // Or if they are a buyer, they see their requests here.
        // Let's assume this view is mixed context.
    ];

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">My Activity</h2>

            {/* Sub-tabs */}
            <div className="flex items-center gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'sent' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Sent Offers
                </button>
                <button
                    onClick={() => setActiveTab('received')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'received' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    My Requests
                </button>
            </div>

            {activeTab === 'sent' && (
                <div className="space-y-4">
                    {sentOffers.length > 0 ? sentOffers.map(offer => (
                        <div key={offer.id} className="liquid-glass-card rounded-[2rem] p-6 border border-slate-100 flex items-center justify-between hover: transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {offer.status === 'accepted' ? <HiOutlineCheckCircle className="w-6 h-6" /> : <HiOutlineClock className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{offer.item}</h4>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">To: {offer.to} • {offer.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-slate-900">{offer.price}</p>
                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${offer.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {offer.status}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                            <HiOutlinePaperAirplane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">You haven't sent any offers yet.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'received' && (
                <div className="space-y-4">
                    {receivedRequests.length > 0 ? (
                        <div>Requests list...</div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                            <HiOutlineInbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No active requests found.</p>
                            <button className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors active:scale-95 transition-all duration-300">
                                Create New Request
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
