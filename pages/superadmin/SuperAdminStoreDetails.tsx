import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { INPUT_CLASS } from '../../utils/ui';
import { StatusPill, storeMeta } from '../../components/ui/StatusPill';
import {
    ArrowLeftIcon,
    BuildingStorefrontIcon,
    EnvelopeIcon,
    UserIcon
} from '../../components/icons';

interface StoreDetails {
    id: string;
    name: string;
    email?: string;
    status: 'active' | 'inactive' | 'suspended';
    subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
    subscriptionEndsAt?: string | null;
    createdAt: string;
    updatedAt: string;
    usersCount?: number;
    plan?: string;
    address?: string;
    phone?: string;
    ownerName?: string;
}

interface SuperAdminStoreDetailsProps {
    storeId: string;
}

const SuperAdminStoreDetails: React.FC<SuperAdminStoreDetailsProps> = ({ storeId }) => {
    const navigate = useNavigate();
    const [store, setStore] = useState<StoreDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Notification State
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadStoreDetails();
    }, [storeId]);

    const loadStoreDetails = async () => {
        setLoading(true);
        try {
            // Assuming this endpoint exists or will be created.
            // If not, we might need to fallback to finding from a list or new endpoint.
            const resp = await api.get<{ store: StoreDetails }>(`/superadmin/stores/${storeId}`);
            setStore(resp.store);
        } catch (e: any) {
            setError(e.message || 'Failed to load store details');
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifTitle.trim() || !notifMessage.trim()) return;

        setSending(true);
        try {
            await api.post(`/superadmin/stores/${storeId}/notifications`, {
                title: notifTitle,
                message: notifMessage
            });
            alert('Notification sent successfully!');
            setNotifTitle('');
            setNotifMessage('');
        } catch (e: any) {
            alert(e.message || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-background p-8 text-center text-brand-text-muted">Loading store details...</div>;
    if (error) return <div className="min-h-screen bg-background p-8 text-center text-danger">Error: {error}</div>;
    if (!store) return <div className="min-h-screen bg-background p-8 text-center text-brand-text-muted">Store not found</div>;

    const inputClass = INPUT_CLASS;

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/superadmin/stores')}
                        className="p-2 hover:bg-surface rounded-xl transition-all text-brand-text-muted hover:text-brand-text border border-transparent hover:border-brand-border active:scale-95"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-brand-text">{store.name}</h1>
                        <p className="text-sm text-brand-text-muted">Store ID: {store.id}</p>
                    </div>
                    <StatusPill tone={storeMeta(store.status).tone} className="ml-auto text-sm capitalize">
                        {store.status}
                    </StatusPill>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-extrabold tracking-tight text-brand-text mb-4 flex items-center gap-2">
                                <BuildingStorefrontIcon className="w-5 h-5 text-brand-text-muted" />
                                Store Information
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-brand-text-muted font-semibold uppercase tracking-wide">Owner</label>
                                    <div className="text-sm font-semibold text-brand-text mt-1">{store.ownerName || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-brand-text-muted font-semibold uppercase tracking-wide">Email</label>
                                    <div className="text-sm font-semibold text-brand-text mt-1">{store.email || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-brand-text-muted font-semibold uppercase tracking-wide">Phone</label>
                                    <div className="text-sm font-semibold text-brand-text mt-1">{store.phone || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-brand-text-muted font-semibold uppercase tracking-wide">Joined</label>
                                    <div className="text-sm font-semibold text-brand-text mt-1">{new Date(store.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs text-brand-text-muted font-semibold uppercase tracking-wide">Address</label>
                                    <div className="text-sm font-semibold text-brand-text mt-1">{store.address || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-extrabold tracking-tight text-brand-text mb-4 flex items-center gap-2">
                                <EnvelopeIcon className="w-5 h-5 text-brand-text-muted" />
                                Send Notification
                            </h2>
                            <form onSubmit={handleSendNotification} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-1.5">Title</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        placeholder="Notification Title"
                                        value={notifTitle}
                                        onChange={e => setNotifTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-1.5">Message</label>
                                    <textarea
                                        className={`${inputClass} h-32 resize-none`}
                                        placeholder="Message to store owner..."
                                        value={notifMessage}
                                        onChange={e => setNotifMessage(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="bg-sp-green text-white px-4 py-2.5 rounded-xl font-bold hover:bg-sp-green-dark transition-all disabled:opacity-70 flex items-center gap-2 shadow-sm active:scale-95"
                                    >
                                        <EnvelopeIcon className="w-4 h-4" />
                                        {sending ? 'Sending...' : 'Send Notification'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6">
                            <h2 className="text-sm font-bold text-brand-text-muted mb-4 uppercase tracking-wider">Subscription</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted">Status</span>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sp-green-soft text-sp-green-dark capitalize">
                                        {store.subscriptionStatus}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted">Plan</span>
                                    <span className="text-sm font-semibold text-brand-text">{store.plan || 'Standard'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted">Expires</span>
                                    <span className="text-sm font-semibold text-brand-text">
                                        {store.subscriptionEndsAt ? new Date(store.subscriptionEndsAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6">
                            <h2 className="text-sm font-bold text-brand-text-muted mb-4 uppercase tracking-wider">Usage Stats</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted flex items-center gap-2">
                                        <UserIcon className="w-4 h-4" /> Users
                                    </span>
                                    <span className="text-sm font-semibold text-brand-text">{store.usersCount || 0}</span>
                                </div>
                                {/* Add more stats here if available, e.g. products count, sales count */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminStoreDetails;
