import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/date';
import { formatMoney } from '../../utils/currency';
import { INPUT_CLASS } from '../../utils/ui';
import Modal from '../../components/ui/Modal';
import { StatusPill, storeMeta, subscriptionMeta, PillTone } from '../../components/ui/StatusPill';
import {
    ArrowLeftIcon,
    BuildingStorefrontIcon,
    EnvelopeIcon,
    UserIcon,
    CreditCardIcon,
    RefreshIcon
} from '../../components/icons';

interface StoreDetails {
    id: string;
    name: string;
    email?: string;
    status: 'active' | 'inactive' | 'suspended';
    subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
    subscriptionEndsAt?: string | null;
    subscriptionStartedAt?: string | null;
    subscriptionPlan?: string | null;
    planName?: string | null;
    lastPaymentAt?: string | null;
    createdAt: string;
    updatedAt: string;
    usersCount?: number;
    productsCount?: number;
    salesCount?: number;
    salesTotal?: number;
    totalRevenue?: number;
    paymentsCount?: number;
    address?: string;
    phone?: string;
    ownerName?: string;
    ownerEmail?: string;
}

interface PaymentRow {
    id: string;
    amount: number | string;
    currency: string;
    periodStart?: string | null;
    periodEnd?: string | null;
    paidAt?: string | null;
    method?: string;
    reference?: string | null;
    status?: string;
    notes?: string | null;
    createdAt: string;
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

interface CatalogPlanLite {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    active: boolean;
}

const modMoney = (n: number, c = 'ZMW') => `${c === 'ZMW' ? 'K' : c === 'USD' ? '$' : ''}${(Number.isFinite(n) ? n : 0).toLocaleString()}`;

/** Whole days from now until a date (negative = past). null when no date. */
const daysUntil = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    const t = new Date(dateStr).getTime();
    if (isNaN(t)) return null;
    return Math.ceil((t - Date.now()) / 86_400_000);
};

/** Payment record status → pill tone + label. */
const paymentRowMeta = (s?: string): { tone: PillTone; label: string } => {
    switch ((s || '').toLowerCase()) {
        case 'completed': return { tone: 'success', label: 'Paid' };
        case 'pending': return { tone: 'amber', label: 'Pending' };
        case 'failed': return { tone: 'danger', label: 'Failed' };
        case 'canceled':
        case 'cancelled': return { tone: 'neutral', label: 'Canceled' };
        default: return { tone: 'neutral', label: s || '—' };
    }
};

const SuperAdminStoreDetails: React.FC<SuperAdminStoreDetailsProps> = ({ storeId }) => {
    const navigate = useNavigate();
    const [store, setStore] = useState<StoreDetails | null>(null);
    const [payments, setPayments] = useState<PaymentRow[]>([]);
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

    // Edit-subscription state
    const [plans, setPlans] = useState<CatalogPlanLite[]>([]);
    const [editingSub, setEditingSub] = useState(false);
    const [subForm, setSubForm] = useState({ subscriptionStatus: 'trial', subscriptionPlan: '', subscriptionEndsAt: '' });
    const [savingSub, setSavingSub] = useState(false);

    useEffect(() => {
        loadStoreDetails();
        loadModules();
        loadPlans();
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

    const loadPlans = async () => {
        try {
            const resp = await api.get<{ plans: CatalogPlanLite[] }>('/superadmin/catalog/plans');
            setPlans(resp.plans || []);
        } catch (e) {
            console.warn('Could not load catalog plans', e);
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
            const resp = await api.get<{ store: StoreDetails; payments?: PaymentRow[] }>(`/superadmin/stores/${storeId}`);
            setStore(resp.store);
            setPayments(resp.payments || []);
        } catch (e: any) {
            setError(e.message || 'Failed to load store details');
        } finally {
            setLoading(false);
        }
    };

    const openEditSub = () => {
        if (!store) return;
        setSubForm({
            subscriptionStatus: store.subscriptionStatus,
            subscriptionPlan: store.subscriptionPlan || '',
            subscriptionEndsAt: store.subscriptionEndsAt ? new Date(store.subscriptionEndsAt).toISOString().slice(0, 10) : '',
        });
        setEditingSub(true);
    };

    const handleSaveSub = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSub(true);
        try {
            await api.patch(`/superadmin/stores/${storeId}`, {
                subscriptionStatus: subForm.subscriptionStatus,
                subscriptionPlan: subForm.subscriptionPlan || null,
                subscriptionEndsAt: subForm.subscriptionEndsAt
                    ? new Date(`${subForm.subscriptionEndsAt}T23:59:59`).toISOString()
                    : null,
            });
            setEditingSub(false);
            await loadStoreDetails();
        } catch (err: any) {
            alert('Failed to update subscription: ' + (err.message || 'Unknown error'));
        } finally {
            setSavingSub(false);
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
    const subDays = daysUntil(store.subscriptionEndsAt);
    const expiryNote = subDays === null ? null
        : subDays < 0 ? { text: `Expired ${Math.abs(subDays)} day${Math.abs(subDays) !== 1 ? 's' : ''} ago`, cls: 'text-danger' }
        : subDays === 0 ? { text: 'Expires today', cls: 'text-danger' }
        : subDays <= 7 ? { text: `${subDays} day${subDays !== 1 ? 's' : ''} left`, cls: 'text-sp-amber' }
        : { text: `${subDays} days left`, cls: 'text-brand-text-muted' };

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
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
                    <div className="ml-auto flex items-center gap-2">
                        <StatusPill tone={storeMeta(store.status).tone} className="text-sm">
                            {storeMeta(store.status).label}
                        </StatusPill>
                        <StatusPill tone={subscriptionMeta(store.subscriptionStatus).tone} className="text-sm">
                            {subscriptionMeta(store.subscriptionStatus).label}
                        </StatusPill>
                    </div>
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
                                    {store.ownerEmail && <div className="text-xs text-brand-text-muted">{store.ownerEmail}</div>}
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
                                    <div className="text-sm font-semibold text-brand-text mt-1">{formatDate(store.createdAt)}</div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs text-brand-text-muted font-semibold uppercase tracking-wide">Address</label>
                                    <div className="text-sm font-semibold text-brand-text mt-1">{store.address || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Payment History */}
                        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-6 pb-4 flex items-center justify-between">
                                <h2 className="text-lg font-extrabold tracking-tight text-brand-text flex items-center gap-2">
                                    <CreditCardIcon className="w-5 h-5 text-brand-text-muted" />
                                    Payment History
                                </h2>
                                <span className="text-xs text-brand-text-muted">{payments.length} record{payments.length !== 1 ? 's' : ''}</span>
                            </div>
                            {payments.length === 0 ? (
                                <p className="px-6 pb-6 text-sm text-brand-text-muted">No subscription payments recorded for this store yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-brand-border">
                                        <thead className="bg-surface-variant">
                                            <tr>
                                                <th className="px-6 py-2.5 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-2.5 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Period</th>
                                                <th className="px-6 py-2.5 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Method</th>
                                                <th className="px-6 py-2.5 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Paid</th>
                                                <th className="px-6 py-2.5 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-border">
                                            {payments.map(p => (
                                                <tr key={p.id} className="hover:bg-surface-variant/60 transition-colors">
                                                    <td className="px-6 py-3 text-sm font-semibold text-brand-text tnum whitespace-nowrap">
                                                        {formatMoney(Number(p.amount) || 0, { currency: p.currency })}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-brand-text-muted whitespace-nowrap">
                                                        {formatDate(p.periodStart)} → {formatDate(p.periodEnd)}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-brand-text-muted capitalize">
                                                        {(p.method || '—').replace(/_/g, ' ')}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-brand-text-muted whitespace-nowrap">
                                                        {formatDate(p.paidAt)}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <StatusPill tone={paymentRowMeta(p.status).tone}>
                                                            {paymentRowMeta(p.status).label}
                                                        </StatusPill>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
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
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-brand-text-muted uppercase tracking-wider">Subscription</h2>
                                <button
                                    onClick={openEditSub}
                                    className="text-xs font-bold text-sp-amber hover:opacity-80 transition-opacity"
                                >
                                    Edit
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted">Status</span>
                                    <StatusPill tone={subscriptionMeta(store.subscriptionStatus).tone}>
                                        {subscriptionMeta(store.subscriptionStatus).label}
                                    </StatusPill>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted">Plan</span>
                                    <span className="text-sm font-semibold text-brand-text">{store.planName || 'No plan'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted">Expires</span>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-brand-text">{formatDate(store.subscriptionEndsAt, 'No expiry')}</div>
                                        {expiryNote && <div className={`text-xs ${expiryNote.cls}`}>{expiryNote.text}</div>}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted">First payment</span>
                                    <span className="text-sm font-semibold text-brand-text">{formatDate(store.subscriptionStartedAt, '—')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted">Last payment</span>
                                    <span className="text-sm font-semibold text-brand-text">{formatDate(store.lastPaymentAt, '—')}</span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                                    <span className="text-sm text-brand-text-muted">Total paid</span>
                                    <span className="text-sm font-extrabold text-success tnum">
                                        {formatMoney(store.totalRevenue || 0)}
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
                                    <span className="text-sm font-semibold text-brand-text tnum">{store.usersCount ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted flex items-center gap-2">
                                        <span className="material-symbols-rounded text-[18px]">inventory_2</span> Products
                                    </span>
                                    <span className="text-sm font-semibold text-brand-text tnum">{store.productsCount ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-brand-text-muted flex items-center gap-2">
                                        <span className="material-symbols-rounded text-[18px]">receipt_long</span> Sales
                                    </span>
                                    <span className="text-sm font-semibold text-brand-text tnum">{store.salesCount ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                                    <span className="text-sm text-brand-text-muted">Sales volume</span>
                                    <span className="text-sm font-extrabold text-brand-text tnum">{formatMoney(store.salesTotal || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Subscription Modal */}
            {editingSub && (
                <Modal open onClose={() => !savingSub && setEditingSub(false)} size="md" className="p-6">
                    <div className="flex items-start gap-3 mb-5">
                        <span className="w-11 h-11 bg-sp-green-soft text-sp-green-dark rounded-xl flex items-center justify-center">
                            <CreditCardIcon className="w-6 h-6" />
                        </span>
                        <div>
                            <h3 className="text-lg font-extrabold tracking-tight text-brand-text">Edit Subscription</h3>
                            <p className="text-sm text-brand-text-muted">{store.name}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveSub} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">Status</label>
                            <select
                                className={inputClass}
                                value={subForm.subscriptionStatus}
                                onChange={e => setSubForm(prev => ({ ...prev, subscriptionStatus: e.target.value }))}
                                disabled={savingSub}
                            >
                                <option value="trial">Trial</option>
                                <option value="active">Active</option>
                                <option value="past_due">Past Due</option>
                                <option value="canceled">Canceled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">Plan</label>
                            <select
                                className={inputClass}
                                value={subForm.subscriptionPlan}
                                onChange={e => setSubForm(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
                                disabled={savingSub}
                            >
                                <option value="">No plan (free core)</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} — {p.currency === 'ZMW' ? 'K' : p.currency}{p.price}/{p.interval === 'year' ? 'yr' : 'mo'}{!p.active ? ' (inactive)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">Expires On</label>
                            <input
                                type="date"
                                className={inputClass}
                                value={subForm.subscriptionEndsAt}
                                onChange={e => setSubForm(prev => ({ ...prev, subscriptionEndsAt: e.target.value }))}
                                disabled={savingSub}
                            />
                            <p className="text-xs text-brand-text-muted mt-1.5">Leave blank for no expiry. To extend after a payment, record it on the Billing page so revenue is tracked.</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setEditingSub(false)}
                                disabled={savingSub}
                                className="flex-1 py-2.5 rounded-xl bg-surface-variant text-brand-text font-semibold hover:bg-brand-border transition-all disabled:opacity-50 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingSub}
                                className="flex-1 py-2.5 rounded-xl bg-sp-amber text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                            >
                                {savingSub ? (<><RefreshIcon className="w-4 h-4 animate-spin" /> Saving…</>) : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default SuperAdminStoreDetails;
