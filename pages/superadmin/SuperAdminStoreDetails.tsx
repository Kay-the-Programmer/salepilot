import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'inactive': return 'bg-gray-50 text-gray-700 border-gray-200';
            case 'suspended': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading store details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!store) return <div className="p-8 text-center text-gray-500">Store not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/superadmin/stores')}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 border border-transparent hover:border-gray-200"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
                        <p className="text-sm text-gray-500">Store ID: {store.id}</p>
                    </div>
                    <div className={`ml-auto px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(store.status)} capitalize`}>
                        {store.status}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BuildingStorefrontIcon className="w-5 h-5 text-gray-400" />
                                Store Information
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-medium uppercase">Owner</label>
                                    <div className="text-sm font-medium text-gray-900 mt-1">{store.ownerName || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-medium uppercase">Email</label>
                                    <div className="text-sm font-medium text-gray-900 mt-1">{store.email || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-medium uppercase">Phone</label>
                                    <div className="text-sm font-medium text-gray-900 mt-1">{store.phone || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-medium uppercase">Joined</label>
                                    <div className="text-sm font-medium text-gray-900 mt-1">{new Date(store.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs text-gray-500 font-medium uppercase">Address</label>
                                    <div className="text-sm font-medium text-gray-900 mt-1">{store.address || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                                Send Notification
                            </h2>
                            <form onSubmit={handleSendNotification} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Notification Title"
                                        value={notifTitle}
                                        onChange={e => setNotifTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
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
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2"
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Subscription</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Status</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize`}>
                                        {store.subscriptionStatus}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Plan</span>
                                    <span className="text-sm font-medium text-gray-900">{store.plan || 'Standard'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Expires</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {store.subscriptionEndsAt ? new Date(store.subscriptionEndsAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Usage Stats</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 flex items-center gap-2">
                                        <UserIcon className="w-4 h-4" /> Users
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">{store.usersCount || 0}</span>
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
