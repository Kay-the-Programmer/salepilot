import { useState } from 'react';
import { HiOutlineInbox, HiOutlinePaperAirplane, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi2';

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
            <h2 className="text-3xl font-black text-brand-text tracking-tight mb-8">My Activity</h2>

            {/* Sub-tabs */}
            <div className="flex items-center gap-4 mb-8 border-b border-brand-border">
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'sent' ? 'text-sp-green-dark border-b-2 border-sp-green' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                    Sent Offers
                </button>
                <button
                    onClick={() => setActiveTab('received')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'received' ? 'text-sp-green-dark border-b-2 border-sp-green' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                    My Requests
                </button>
            </div>

            {activeTab === 'sent' && (
                <div className="space-y-4">
                    {sentOffers.length > 0 ? sentOffers.map(offer => (
                        <div key={offer.id} className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${offer.status === 'accepted' ? 'bg-success-muted text-success' : 'bg-sp-amber-soft text-sp-amber'}`}>
                                    {offer.status === 'accepted' ? <HiOutlineCheckCircle className="w-6 h-6" /> : <HiOutlineClock className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-text">{offer.item}</h4>
                                    <p className="text-xs text-brand-text-muted font-bold uppercase tracking-wider">To: {offer.to} • {offer.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-brand-text">{offer.price}</p>
                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${offer.status === 'accepted' ? 'bg-success-muted text-success' : 'bg-sp-amber-soft text-sp-amber'}`}>
                                    {offer.status}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 bg-surface rounded-3xl border border-dashed border-brand-border">
                            <HiOutlinePaperAirplane className="w-12 h-12 text-brand-border mx-auto mb-3" />
                            <p className="text-brand-text-muted font-medium">You haven't sent any offers yet.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'received' && (
                <div className="space-y-4">
                    {receivedRequests.length > 0 ? (
                        <div>Requests list...</div>
                    ) : (
                        <div className="text-center py-12 bg-surface rounded-3xl border border-dashed border-brand-border">
                            <HiOutlineInbox className="w-12 h-12 text-brand-border mx-auto mb-3" />
                            <p className="text-brand-text-muted font-medium">No active requests found.</p>
                            <button className="mt-4 px-6 py-2 bg-sp-green-soft text-sp-green-dark rounded-full text-xs font-bold uppercase tracking-widest hover:bg-sp-green/15 transition-colors active:scale-95">
                                Create New Request
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
