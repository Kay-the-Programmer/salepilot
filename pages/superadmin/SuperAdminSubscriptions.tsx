import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { formatDate as fmtDate } from '../../utils/date';
import { formatMoney } from '../../utils/currency';
import { INPUT_CLASS } from '../../utils/ui';
import Modal from '../../components/ui/Modal';
import { StatusPill, subscriptionMeta, PillTone } from '../../components/ui/StatusPill';
import {
    CreditCardIcon,
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ChevronDownIcon,
    SearchIcon,
    FilterIcon,
    RefreshIcon,
    PlusIcon,
    InformationCircleIcon,
    ChevronRightIcon,
    EyeIcon
} from '../../components/icons';

// Types
interface StoreRow {
    id: string;
    name: string;
    email?: string;
    ownerName?: string;
    status: string;
    subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
    subscriptionEndsAt?: string | null;
    subscriptionStartedAt?: string | null;
    subscriptionPlan?: string | null;
    planName?: string | null;
    lastPaymentAt?: string | null;
    usersCount?: number;
    totalRevenue?: number;
}

interface PaymentRow {
    id: string;
    storeId: string;
    storeName?: string;
    amount: number | string;
    currency: string;
    planId?: string | null;
    periodStart?: string | null;
    periodEnd?: string | null;
    paidAt?: string | null;
    method?: string;
    reference?: string | null;
    status?: string;
    notes?: string | null;
    createdAt: string;
}

interface CatalogPlanLite {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    active: boolean;
}

interface PaymentFormData {
    storeId: string;
    amount: string;
    currency: string;
    periodDays: string;
    notes?: string;
    paymentMethod?: string;
    reference?: string;
}

interface ManageFormData {
    subscriptionStatus: StoreRow['subscriptionStatus'];
    subscriptionPlan: string;
    /** yyyy-mm-dd for the date input; '' = no expiry */
    subscriptionEndsAt: string;
}

// Stable idempotency key per payment attempt so a double-submit can't double-charge/extend.
const newPaymentReference = () =>
    `manual_${(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`)}`;

interface SubscriptionStats {
    total: number;
    active: number;
    trial: number;
    pastDue: number;
    canceled: number;
    totalRevenue: number;
}

const CURRENCY_SYMBOL: Record<string, string> = { ZMW: 'K', USD: '$', EUR: '€', GBP: '£', CAD: '$' };

/** Whole days from now until a date (negative = past). null when no date. */
const daysUntil = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    const t = new Date(dateStr).getTime();
    if (isNaN(t)) return null;
    return Math.ceil((t - Date.now()) / 86_400_000);
};

/** Human summary + urgency tone for a subscription expiry date. */
const expiryInfo = (dateStr?: string | null): { label: string; className: string } => {
    const days = daysUntil(dateStr);
    if (days === null) return { label: 'No expiry set', className: 'text-brand-text-muted' };
    if (days < 0) return { label: `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`, className: 'text-danger font-semibold' };
    if (days === 0) return { label: 'Expires today', className: 'text-danger font-semibold' };
    if (days <= 7) return { label: `${days} day${days !== 1 ? 's' : ''} left`, className: 'text-sp-amber font-semibold' };
    return { label: `${days} days left`, className: 'text-brand-text-muted' };
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

const SuperAdminSubscriptions: React.FC = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | StoreRow['subscriptionStatus']>('all');
    const [planFilter, setPlanFilter] = useState<'all' | 'none' | string>('all');
    const [expiryFilter, setExpiryFilter] = useState<'all' | 'week' | 'month' | 'expired'>('all');

    // Catalog plans (for the manage-subscription plan picker + plan filter labels)
    const [plans, setPlans] = useState<CatalogPlanLite[]>([]);

    // Payment history
    const [payments, setPayments] = useState<PaymentRow[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);

    // Payment Modal
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
    const [processing, setProcessing] = useState(false);
    const [storePickerSearch, setStorePickerSearch] = useState('');

    // Manage-subscription Modal (status / plan / expiry)
    const [manageStore, setManageStore] = useState<StoreRow | null>(null);
    const [manageForm, setManageForm] = useState<ManageFormData>({ subscriptionStatus: 'trial', subscriptionPlan: '', subscriptionEndsAt: '' });
    const [savingManage, setSavingManage] = useState(false);

    // Payment Form
    const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
        storeId: '',
        amount: '',
        currency: 'ZMW',
        periodDays: '30',
        notes: '',
        paymentMethod: 'manual'
    });

    // Stats
    const [stats, setStats] = useState<SubscriptionStats>({
        total: 0,
        active: 0,
        trial: 0,
        pastDue: 0,
        canceled: 0,
        totalRevenue: 0
    });

    useEffect(() => {
        loadStores();
        loadPayments();
        loadPlans();
    }, []);

    const loadStores = async () => {
        setLoading(true);
        try {
            const resp = await api.get<{ stores: StoreRow[] }>("/superadmin/stores");
            const storesData = resp.stores || [];
            setStores(storesData);
            calculateStats(storesData);
        } catch (e) {
            console.error('Failed to load subscriptions:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadPayments = async () => {
        setPaymentsLoading(true);
        try {
            const resp = await api.get<{ payments: PaymentRow[] }>("/superadmin/revenue/payments");
            setPayments(resp.payments || []);
        } catch (e) {
            console.error('Failed to load payments:', e);
        } finally {
            setPaymentsLoading(false);
        }
    };

    const loadPlans = async () => {
        try {
            const resp = await api.get<{ plans: CatalogPlanLite[] }>("/superadmin/catalog/plans");
            setPlans(resp.plans || []);
        } catch (e) {
            console.warn('Could not load catalog plans:', e);
        }
    };

    const calculateStats = (storesData: StoreRow[]) => {
        const newStats: SubscriptionStats = {
            total: storesData.length,
            active: 0,
            trial: 0,
            pastDue: 0,
            canceled: 0,
            totalRevenue: 0
        };

        storesData.forEach(store => {
            if (store.subscriptionStatus === 'active') newStats.active++;
            else if (store.subscriptionStatus === 'trial') newStats.trial++;
            else if (store.subscriptionStatus === 'past_due') newStats.pastDue++;
            else if (store.subscriptionStatus === 'canceled') newStats.canceled++;

            newStats.totalRevenue += Number(store.totalRevenue) || 0;
        });

        setStats(newStats);
    };

    const openPaymentModal = (store?: StoreRow) => {
        setSelectedStore(store || null);
        setStorePickerSearch('');
        setPaymentForm({
            storeId: store?.id || '',
            amount: '',
            currency: 'ZMW',
            periodDays: '30',
            notes: '',
            paymentMethod: 'manual',
            reference: newPaymentReference()
        });
        setPaymentModalOpen(true);
    };

    const openManageModal = (store: StoreRow) => {
        setManageStore(store);
        setManageForm({
            subscriptionStatus: store.subscriptionStatus,
            subscriptionPlan: store.subscriptionPlan || '',
            subscriptionEndsAt: store.subscriptionEndsAt ? new Date(store.subscriptionEndsAt).toISOString().slice(0, 10) : '',
        });
    };

    const handleSaveManage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manageStore) return;
        setSavingManage(true);
        try {
            await api.patch(`/superadmin/stores/${manageStore.id}`, {
                subscriptionStatus: manageForm.subscriptionStatus,
                subscriptionPlan: manageForm.subscriptionPlan || null,
                subscriptionEndsAt: manageForm.subscriptionEndsAt
                    ? new Date(`${manageForm.subscriptionEndsAt}T23:59:59`).toISOString()
                    : null,
            });
            setManageStore(null);
            await loadStores();
        } catch (err: any) {
            alert('Failed to update subscription: ' + (err.message || 'Unknown error'));
        } finally {
            setSavingManage(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore) return;

        setProcessing(true);
        try {
            // Update the store ID based on selection
            const payload = {
                ...paymentForm,
                storeId: selectedStore.id
            };

            await api.post("/superadmin/revenue/payments", payload);
            setPaymentModalOpen(false);
            loadStores(); // Reload to see updates
            loadPayments();
        } catch (err: any) {
            console.error(err);
            alert("Failed to record payment: " + (err.message || 'Unknown error'));
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateStr?: string | null) => fmtDate(dateStr, 'N/A');

    const formatCurrency = (amount: number, currency = 'ZMW') => formatMoney(amount, { currency });

    // Plan options actually in use (for the filter), labelled from the catalog when possible.
    const planOptions = useMemo(() => {
        const seen = new Map<string, string>();
        stores.forEach(s => {
            if (s.subscriptionPlan) seen.set(s.subscriptionPlan, s.planName || s.subscriptionPlan);
        });
        plans.forEach(p => { if (seen.has(p.id)) seen.set(p.id, p.name); });
        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [stores, plans]);

    const filteredStores = useMemo(() => {
        return stores.filter(store => {
            const matchesSearch = !search ||
                store.name.toLowerCase().includes(search.toLowerCase()) ||
                store.email?.toLowerCase().includes(search.toLowerCase()) ||
                store.id.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || store.subscriptionStatus === statusFilter;

            const matchesPlan = planFilter === 'all'
                || (planFilter === 'none' ? !store.subscriptionPlan : store.subscriptionPlan === planFilter);

            const days = daysUntil(store.subscriptionEndsAt);
            const matchesExpiry = expiryFilter === 'all'
                || (expiryFilter === 'expired' && days !== null && days < 0)
                || (expiryFilter === 'week' && days !== null && days >= 0 && days <= 7)
                || (expiryFilter === 'month' && days !== null && days >= 0 && days <= 30);

            return matchesSearch && matchesStatus && matchesPlan && matchesExpiry;
        }).sort((a, b) => {
            // Sort by status priority
            const statusOrder: Record<string, number> = { 'past_due': 0, 'trial': 1, 'active': 2, 'canceled': 3 };
            return statusOrder[a.subscriptionStatus] - statusOrder[b.subscriptionStatus];
        });
    }, [stores, search, statusFilter, planFilter, expiryFilter]);

    // Subscription status icons; tone, label & colours come from the shared StatusPill meta.
    const SUB_STATUS_ICON: Record<StoreRow['subscriptionStatus'], React.ReactNode> = {
        active: <CheckCircleIcon className="w-4 h-4" />,
        trial: <ClockIcon className="w-4 h-4" />,
        past_due: <ExclamationTriangleIcon className="w-4 h-4" />,
        canceled: <XCircleIcon className="w-4 h-4" />,
    };

    const inputClass = INPUT_CLASS;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-text flex items-center gap-3">
                            <span className="w-11 h-11 bg-sp-green-soft text-sp-green-dark rounded-xl flex items-center justify-center">
                                <CreditCardIcon className="w-6 h-6" />
                            </span>
                            Subscription Management
                        </h1>
                        <p className="text-brand-text-muted mt-1">
                            Monitor billing status, track payments, and manage subscriptions
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { loadStores(); loadPayments(); }}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-xl shadow-sm hover:bg-surface-variant transition-all disabled:opacity-50 active:scale-95"
                        >
                            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={() => openPaymentModal()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sp-amber text-white font-bold rounded-xl hover:bg-sp-green-dark transition-all shadow-sm active:scale-95"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Record Payment
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">Total Stores</div>
                        <div className="text-2xl font-extrabold text-brand-text mt-1 tnum">{stats.total}</div>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">Active</div>
                        <div className="text-2xl font-extrabold text-success mt-1 tnum">{stats.active}</div>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">Trial</div>
                        <div className="text-2xl font-extrabold text-sp-amber mt-1 tnum">{stats.trial}</div>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">Past Due</div>
                        <div className="text-2xl font-extrabold text-danger mt-1 tnum">{stats.pastDue}</div>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">Canceled</div>
                        <div className="text-2xl font-extrabold text-brand-text-muted mt-1 tnum">{stats.canceled}</div>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">Total Revenue</div>
                        <div className="text-2xl font-extrabold text-sp-green-dark mt-1 tnum">
                            {formatCurrency(stats.totalRevenue)}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-brand-border">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="relative flex-1">
                                <SearchIcon className="w-5 h-5 text-brand-text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search stores by name, email, or ID..."
                                    className={`${inputClass} pl-10`}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <FilterIcon className="w-5 h-5 text-brand-text-muted" />
                                    <select
                                        className="bg-surface border border-brand-border rounded-xl py-2.5 px-3 text-sm text-brand-text focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="trial">Trial</option>
                                        <option value="past_due">Past Due</option>
                                        <option value="canceled">Canceled</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-brand-border rounded-xl hover:bg-surface-variant transition-all active:scale-95"
                                >
                                    <span className="text-sm font-semibold text-brand-text">More Filters</span>
                                    <ChevronDownIcon className={`w-4 h-4 text-brand-text-muted transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-2">Plan</label>
                                    <select
                                        className="w-full bg-surface border border-brand-border rounded-xl py-2 px-3 text-sm text-brand-text focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none"
                                        value={planFilter}
                                        onChange={(e) => setPlanFilter(e.target.value)}
                                    >
                                        <option value="all">All Plans</option>
                                        <option value="none">No Plan</option>
                                        {planOptions.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-2">Expiration</label>
                                    <select
                                        className="w-full bg-surface border border-brand-border rounded-xl py-2 px-3 text-sm text-brand-text focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none"
                                        value={expiryFilter}
                                        onChange={(e) => setExpiryFilter(e.target.value as any)}
                                    >
                                        <option value="all">Any Time</option>
                                        <option value="week">Within 7 Days</option>
                                        <option value="month">Within 30 Days</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-brand-border">
                            <thead className="bg-surface-variant">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        Store Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        Subscription
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        Expiration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        Revenue
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-brand-border">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-surface-variant rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 bg-surface-variant rounded w-20 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : filteredStores.length > 0 ? (
                                    filteredStores.map(store => {
                                        const expiry = expiryInfo(store.subscriptionEndsAt);
                                        return (
                                            <tr key={store.id} className="hover:bg-surface-variant/60 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="font-semibold text-brand-text group-hover:text-sp-green-dark transition-colors">
                                                            {store.name}
                                                        </div>
                                                        <div className="text-sm text-brand-text-muted truncate max-w-[200px]">
                                                            {store.email || 'No email'}
                                                        </div>
                                                        <div className="text-xs font-mono text-brand-text-muted mt-1">
                                                            ID: {store.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <StatusPill tone={subscriptionMeta(store.subscriptionStatus).tone} icon={SUB_STATUS_ICON[store.subscriptionStatus]}>
                                                                {subscriptionMeta(store.subscriptionStatus).label}
                                                            </StatusPill>
                                                            <span className="text-xs text-brand-text-muted">
                                                                • {store.planName || 'No plan'}
                                                            </span>
                                                        </div>
                                                        {store.subscriptionStartedAt && (
                                                            <div className="text-xs text-brand-text-muted">
                                                                First payment {formatDate(store.subscriptionStartedAt)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1 text-sm text-brand-text">
                                                            <CalendarIcon className="w-4 h-4 text-brand-text-muted" />
                                                            {formatDate(store.subscriptionEndsAt)}
                                                        </div>
                                                        <div className={`text-xs mt-1 ${expiry.className}`}>
                                                            {expiry.label}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-brand-text tnum">
                                                        {formatCurrency(Number(store.totalRevenue) || 0)}
                                                    </div>
                                                    <div className="text-xs text-brand-text-muted">
                                                        {store.lastPaymentAt ? `Last paid ${formatDate(store.lastPaymentAt)}` : 'No payments yet'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openPaymentModal(store)}
                                                            className="px-3 py-1.5 text-sm font-semibold text-sp-green-dark bg-sp-green-soft border border-sp-green/20 rounded-lg hover:bg-sp-green/15 transition-all flex items-center gap-1 active:scale-95"
                                                        >
                                                            <CreditCardIcon className="w-4 h-4" />
                                                            Record Payment
                                                        </button>
                                                        <button
                                                            onClick={() => openManageModal(store)}
                                                            className="px-3 py-1.5 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-lg hover:bg-surface-variant transition-all active:scale-95"
                                                            title="Change status, plan or expiry"
                                                        >
                                                            Manage
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/superadmin/stores/${store.id}`)}
                                                            className="p-1.5 text-brand-text-muted hover:text-sp-green-dark transition-colors"
                                                            title="View store details"
                                                        >
                                                            <EyeIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-brand-text-muted">
                                                <CreditCardIcon className="w-12 h-12 mb-3 opacity-50" />
                                                <p className="text-sm font-semibold">No subscriptions found</p>
                                                <p className="text-xs mt-1">
                                                    {search ? 'Try adjusting your search' : 'No stores available'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-brand-border flex items-center justify-between">
                        <h2 className="text-lg font-extrabold tracking-tight text-brand-text flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-brand-text-muted" />
                            Recent Payments
                        </h2>
                        <span className="text-xs text-brand-text-muted">{payments.length} record{payments.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-brand-border">
                            <thead className="bg-surface-variant sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Store</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Period</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Paid</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-brand-border">
                                {paymentsLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-20"></div></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : payments.length > 0 ? (
                                    payments.map(p => (
                                        <tr key={p.id} className="hover:bg-surface-variant/60 transition-colors">
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/superadmin/stores/${p.storeId}`)}
                                                    className="text-sm font-semibold text-brand-text hover:text-sp-green-dark transition-colors text-left"
                                                >
                                                    {p.storeName || p.storeId}
                                                </button>
                                                {p.reference && (
                                                    <div className="text-xs font-mono text-brand-text-muted mt-0.5 truncate max-w-[180px]" title={p.reference}>
                                                        {p.reference}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-brand-text tnum">
                                                {formatCurrency(Number(p.amount) || 0, p.currency)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-brand-text-muted capitalize">
                                                {(p.method || '—').replace(/_/g, ' ')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-brand-text-muted whitespace-nowrap">
                                                {formatDate(p.periodStart)} → {formatDate(p.periodEnd)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-brand-text-muted whitespace-nowrap">
                                                {formatDate(p.paidAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusPill tone={paymentRowMeta(p.status).tone}>
                                                    {paymentRowMeta(p.status).label}
                                                </StatusPill>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-brand-text-muted text-sm">
                                            No payments recorded yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Manage Subscription Modal */}
            {manageStore && (
                <Modal open onClose={() => !savingManage && setManageStore(null)} size="md" className="p-6">
                    <div className="flex items-start gap-3 mb-5">
                        <span className="w-11 h-11 bg-sp-green-soft text-sp-green-dark rounded-xl flex items-center justify-center">
                            <CreditCardIcon className="w-6 h-6" />
                        </span>
                        <div>
                            <h3 className="text-lg font-extrabold tracking-tight text-brand-text">Manage Subscription</h3>
                            <p className="text-sm text-brand-text-muted">{manageStore.name}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveManage} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">Status</label>
                            <select
                                className={inputClass}
                                value={manageForm.subscriptionStatus}
                                onChange={e => setManageForm(prev => ({ ...prev, subscriptionStatus: e.target.value as any }))}
                                disabled={savingManage}
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
                                value={manageForm.subscriptionPlan}
                                onChange={e => setManageForm(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
                                disabled={savingManage}
                            >
                                <option value="">No plan (free core)</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} — {CURRENCY_SYMBOL[p.currency] || p.currency}{p.price}/{p.interval === 'year' ? 'yr' : 'mo'}{!p.active ? ' (inactive)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">Expires On</label>
                            <input
                                type="date"
                                className={inputClass}
                                value={manageForm.subscriptionEndsAt}
                                onChange={e => setManageForm(prev => ({ ...prev, subscriptionEndsAt: e.target.value }))}
                                disabled={savingManage}
                            />
                            <p className="text-xs text-brand-text-muted mt-1.5">Leave blank for no expiry. To extend after a payment, prefer "Record Payment" so the revenue is tracked.</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setManageStore(null)}
                                disabled={savingManage}
                                className="flex-1 py-2.5 rounded-xl bg-surface-variant text-brand-text font-semibold hover:bg-brand-border transition-all disabled:opacity-50 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingManage}
                                className="flex-1 py-2.5 rounded-xl bg-sp-amber text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                            >
                                {savingManage ? (<><RefreshIcon className="w-4 h-4 animate-spin" /> Saving…</>) : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <Modal open onClose={() => setPaymentModalOpen(false)} disabled={processing} size="lg">
                        <div className="p-6 border-b border-brand-border flex justify-between items-center">
                            <h3 className="font-extrabold text-lg text-brand-text flex items-center gap-2">
                                <CreditCardIcon className="w-5 h-5 text-sp-green-dark" />
                                Record Manual Payment
                            </h3>
                            <button
                                onClick={() => !processing && setPaymentModalOpen(false)}
                                disabled={processing}
                                className="p-2 text-brand-text-muted hover:text-brand-text hover:bg-surface-variant rounded-lg transition-all disabled:opacity-50 active:scale-95"
                            >
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] custom-scrollbar">
                            {!selectedStore ? (
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-brand-text">Select a store</h4>
                                    <div className="relative">
                                        <SearchIcon className="w-5 h-5 text-brand-text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Search stores..."
                                            className={`${inputClass} pl-10`}
                                            value={storePickerSearch}
                                            onChange={e => setStorePickerSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto border border-brand-border rounded-xl divide-y divide-brand-border">
                                        {stores
                                            .filter(s => {
                                                const q = storePickerSearch.trim().toLowerCase();
                                                if (!q) return true;
                                                return s.name.toLowerCase().includes(q)
                                                    || (s.email?.toLowerCase().includes(q) ?? false)
                                                    || s.id.toLowerCase().includes(q);
                                            })
                                            .slice(0, 10)
                                            .map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => { setSelectedStore(s); setPaymentForm(prev => ({ ...prev, storeId: s.id })); }}
                                                className="w-full px-4 py-3 text-left hover:bg-surface-variant/60 flex items-center justify-between group transition-colors active:scale-95"
                                            >
                                                <div>
                                                    <div className="font-semibold text-brand-text group-hover:text-sp-green-dark">{s.name}</div>
                                                    <div className="text-xs text-brand-text-muted">{s.email}</div>
                                                </div>
                                                <ChevronRightIcon className="w-4 h-4 text-brand-text-muted group-hover:text-sp-green-dark" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-surface-variant p-4 rounded-xl flex items-center justify-between border border-brand-border">
                                        <div>
                                            <div className="text-sm text-brand-text-muted">Store</div>
                                            <div className="font-semibold text-brand-text">{selectedStore.name}</div>
                                            <div className="text-xs text-brand-text-muted mt-0.5">
                                                {subscriptionMeta(selectedStore.subscriptionStatus).label}
                                                {selectedStore.subscriptionEndsAt ? ` · expires ${formatDate(selectedStore.subscriptionEndsAt)}` : ''}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedStore(null); setPaymentForm(prev => ({ ...prev, storeId: '' })); }}
                                            className="text-sm text-sp-green-dark hover:text-sp-green font-semibold"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <form onSubmit={handleRecordPayment} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-brand-text mb-2">
                                                Duration
                                            </label>
                                            <select
                                                className={inputClass}
                                                value={paymentForm.periodDays}
                                                onChange={e => setPaymentForm(prev => ({ ...prev, periodDays: e.target.value }))}
                                                disabled={processing}
                                            >
                                                <option value="30">1 Month (30 days)</option>
                                                <option value="90">3 Months (90 days)</option>
                                                <option value="180">6 Months (180 days)</option>
                                                <option value="365">1 Year (365 days)</option>
                                                <option value="730">2 Years (730 days)</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-brand-text mb-2">
                                                    Amount
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-text-muted">
                                                        {CURRENCY_SYMBOL[paymentForm.currency] || paymentForm.currency}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className={`${inputClass} pl-8`}
                                                        value={paymentForm.amount}
                                                        onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                                        required
                                                        disabled={processing}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-brand-text mb-2">
                                                    Currency
                                                </label>
                                                <select
                                                    className={inputClass}
                                                    value={paymentForm.currency}
                                                    onChange={e => setPaymentForm(prev => ({ ...prev, currency: e.target.value }))}
                                                    disabled={processing}
                                                >
                                                    <option value="ZMW">ZMW (K)</option>
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="CAD">CAD ($)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-brand-text mb-2">
                                                Payment Method
                                            </label>
                                            <select
                                                className={inputClass}
                                                value={paymentForm.paymentMethod}
                                                onChange={e => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                                disabled={processing}
                                            >
                                                <option value="manual">Manual Entry</option>
                                                <option value="mobile_money">Mobile Money</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-brand-text mb-2">
                                                Notes (Optional)
                                            </label>
                                            <textarea
                                                className={`${inputClass} resize-none h-24`}
                                                placeholder="Add any notes about this payment..."
                                                value={paymentForm.notes}
                                                onChange={e => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                                disabled={processing}
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <div className="bg-sp-green-soft border border-sp-green/20 rounded-2xl p-4 mb-4">
                                                <div className="flex items-center gap-2 text-sp-green-dark mb-2">
                                                    <InformationCircleIcon className="w-5 h-5" />
                                                    <span className="font-bold">Summary</span>
                                                </div>
                                                <div className="text-sm text-sp-green-dark">
                                                    This will extend the subscription by {paymentForm.periodDays} days from its current expiry (or from today if already expired).
                                                    {paymentForm.amount && (
                                                        <div className="mt-1 font-bold">
                                                            Total: {paymentForm.currency} {parseFloat(paymentForm.amount).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => !processing && setPaymentModalOpen(false)}
                                                disabled={processing}
                                                className="flex-1 py-3 text-brand-text bg-surface-variant hover:bg-brand-border rounded-xl font-semibold transition-all disabled:opacity-50 active:scale-95"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing || !selectedStore || !paymentForm.amount}
                                                className="flex-1 py-3 bg-sp-amber text-white font-bold rounded-xl hover:bg-sp-green-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                {processing ? (
                                                    <>
                                                        <RefreshIcon className="w-4 h-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCardIcon className="w-4 h-4" />
                                                        Confirm Payment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                </Modal>
            )}
        </div>
    );
};

export default SuperAdminSubscriptions;
