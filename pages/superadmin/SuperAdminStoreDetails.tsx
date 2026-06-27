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

interface CatalogModuleLite {
    id: string;
    name: string;
    price: number;
    currency: string;
    active: boolean;
}

const modMoney = (n: number, c = 'ZMW') => `${c === 'ZMW' ? 'K' : c === 'USD' ? '$' : ''}${(Number.isFinite(n) ? n : 0).toLocaleString()}`;

const SuperAdminStoreDetails: React.FC<SuperAdminStoreDetailsProps> = ({ storeId }) => {
    const navigate = useNavigate();
    const [store, setStore] = useState<StoreDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Notification State
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Premium add-on grant state
    const [modules, setModules] = useState<CatalogModuleLite[]>([]);
    const [enabled, setEnabled] = useState<Set<string>>(new Set());
    const [modLoading, setModLoading] = useState(true);
    const [savingMod, setSavingMod] = useState<string | null>(null);

    useEffect(() => {
        loadStoreDetails();
        loadModules();
    }, [storeId]);

    const loadModules = async () => {
        setModLoading(true);
        try {
            const [cat, ent] = await Promise.all([
                api.get<{ modules: CatalogModuleLite[] }>('/superadmin/catalog/modules'),
                api.get<{ enabledModules: string[] }>(`/superadmin/stores/${storeId}/modules`),
            ]);
            setModules(cat.modules || []);
            setEnabled(new Set(ent.enabledModules || []));
        } catch (e) {
            console.warn('Could not load store modules', e);
        } finally {
            setModLoading(false);
        }
    };

    const toggleModule = async (id: string) => {
        const prev = enabled;
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        setEnabled(next); // optimistic
        setSavingMod(id);
        try {
            await api.put(`/superadmin/stores/${storeId}/modules`, { enabledModules: Array.from(next) });
        } catch (e: any) {
            setEnabled(prev); // revert
            alert(e.message || 'Failed to update add-ons for this store');
        } finally {
            setSavingMod(null);
        }
    };

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
                                        className="bg-sp-amber text-white px-4 py-2.5 rounded-xl font-bold hover:bg-sp-green-dark transition-all disabled:opacity-70 flex items-center gap-2 shadow-sm active:scale-95"
                                    >
                                        <EnvelopeIcon className="w-4 h-4" />
                                        {sending ? 'Sending...' : 'Send Notification'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Premium add-on grants */}
                        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-extrabold tracking-tight text-brand-text mb-1 flex items-center gap-2">
                                <span className="material-symbols-rounded text-sp-green text-[20px]">extension</span>
                                Premium Add-ons
                            </h2>
                            <p className="text-sm text-brand-text-muted mb-4">Grant or revoke à-la-carte add-ons for this store — e.g. comp a customer or unlock after a manual payment. Changes take effect immediately.</p>
                            {modLoading ? (
                                <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-surface-variant animate-pulse" />)}</div>
                            ) : modules.length === 0 ? (
                                <p className="text-sm text-brand-text-muted">No add-on modules in the catalog yet. Create some under Plans &amp; Pricing.</p>
                            ) : (
                                <div className="space-y-2">
                                    {modules.map(m => {
                                        const on = enabled.has(m.id);
                                        return (
                                            <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-brand-border">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-brand-text flex items-center gap-2">
                                                        {m.name}
                                                        {!m.active && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface-variant text-brand-text-muted">inactive</span>}
                                                    </div>
                                                    <div className="text-xs text-brand-text-muted">{modMoney(m.price, m.currency)}/mo · {m.id}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModule(m.id)}
                                                    disabled={savingMod === m.id}
                                                    aria-pressed={on}
                                                    title={on ? 'Granted — tap to revoke' : 'Locked — tap to grant'}
                                                    className={`shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors disabled:opacity-50 ${on ? 'bg-sp-green' : 'bg-surface-variant border border-brand-border'}`}
                                                >
                                                    <span className="block w-6 h-6 bg-white rounded-full shadow transition-transform" style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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
