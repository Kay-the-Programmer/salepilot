import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/date';
import { INPUT_CLASS } from '../../utils/ui';
import Modal from '../../components/ui/Modal';
import { StatusPill, storeMeta, subscriptionMeta } from '../../components/ui/StatusPill';
import {
    SearchIcon,
    FilterIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    EyeIcon,
    RefreshIcon,
    CheckCircleIcon,
    XCircleIcon
} from '../../components/icons';

// Types
interface StoreRow {
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
}

interface StoreFilters {
    search: string;
    status: 'all' | StoreRow['status'];
    subscription: 'all' | StoreRow['subscriptionStatus'];
}

// Reason codes captured (and audited) for destructive lifecycle changes.
const REASON_CODES = ['Non-payment', 'Policy violation', 'Fraud / abuse', 'Customer request', 'Maintenance', 'Other'];

type PendingChange =
    | { kind: 'single'; storeId: string; storeName: string; status: StoreRow['status'] }
    | { kind: 'bulk'; ids: string[]; status: StoreRow['status'] };

const STATUS_INPUT = INPUT_CLASS;

const SuperAdminStores: React.FC = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Strict status-change workflow (reason code + typed confirmation to suspend)
    const [pending, setPending] = useState<PendingChange | null>(null);
    const [reasonCode, setReasonCode] = useState('');
    const [reasonNote, setReasonNote] = useState('');
    const [confirmText, setConfirmText] = useState('');

    // Filters
    const [filters, setFilters] = useState<StoreFilters>({
        search: '',
        status: 'all',
        subscription: 'all'
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedStores, setSelectedStores] = useState<string[]>([]);

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        setLoading(true);
        try {
            const resp = await api.get<{ stores: StoreRow[] }>("/superadmin/stores");
            setStores(resp.stores || []);
        } catch (e: any) {
            console.error('Failed to load stores:', e);
        } finally {
            setLoading(false);
        }
    };

    const needsConfirm = (status: StoreRow['status']) => status === 'suspended' || status === 'inactive';

    const executeSingle = async (id: string, status: StoreRow['status'], reason?: string) => {
        setUpdatingId(id);
        try {
            const resp = await api.patch<{ store: StoreRow }>(`/superadmin/stores/${id}`, { status, reason });
            setStores(prev => prev.map(s => s.id === id ? resp.store : s));
        } catch (e: any) {
            alert(e.message || 'Update failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const executeBulk = async (ids: string[], status: StoreRow['status'], reason?: string) => {
        try {
            await Promise.all(ids.map(id => api.patch(`/superadmin/stores/${id}`, { status, reason })));
            await loadStores();
            setSelectedStores([]);
        } catch (e: any) {
            alert('Bulk update failed');
        }
    };

    // Entry points used by the buttons: positive/reversible changes run immediately;
    // suspend/deactivate open a modal requiring a reason (+ typed confirmation to suspend).
    const updateStoreStatus = (id: string, newStatus: StoreRow['status']) => {
        if (!needsConfirm(newStatus)) { executeSingle(id, newStatus); return; }
        const store = stores.find(s => s.id === id);
        setReasonCode(''); setReasonNote(''); setConfirmText('');
        setPending({ kind: 'single', storeId: id, storeName: store?.name || id, status: newStatus });
    };

    const bulkUpdateStatus = (newStatus: StoreRow['status']) => {
        if (!selectedStores.length) return;
        if (!needsConfirm(newStatus)) { executeBulk(selectedStores, newStatus); return; }
        setReasonCode(''); setReasonNote(''); setConfirmText('');
        setPending({ kind: 'bulk', ids: [...selectedStores], status: newStatus });
    };

    const runPending = async () => {
        if (!pending || !canConfirm) return;
        const reason = reasonCode === 'Other' ? reasonNote.trim() : (reasonNote.trim() ? `${reasonCode} — ${reasonNote.trim()}` : reasonCode);
        const p = pending;
        setPending(null);
        if (p.kind === 'single') await executeSingle(p.storeId, p.status, reason);
        else await executeBulk(p.ids, p.status, reason);
    };

    // Filter stores
    const filteredStores = useMemo(() => {
        return stores.filter(store => {
            const matchesSearch = !filters.search ||
                store.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                store.id.toLowerCase().includes(filters.search.toLowerCase()) ||
                store.email?.toLowerCase().includes(filters.search.toLowerCase());

            const matchesStatus = filters.status === 'all' || store.status === filters.status;
            const matchesSubscription = filters.subscription === 'all' ||
                store.subscriptionStatus === filters.subscription;

            return matchesSearch && matchesStatus && matchesSubscription;
        });
    }, [stores, filters]);

    // Pagination
    const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
    const paginatedStores = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredStores.slice(start, end);
    }, [filteredStores, currentPage]);

    // Store status icons; tone, label & colours come from the shared StatusPill meta.
    const STORE_STATUS_ICON: Record<StoreRow['status'], React.ReactNode> = {
        active: <CheckCircleIcon className="w-3 h-3" />,
        inactive: <ChevronDownIcon className="w-3 h-3" />,
        suspended: <XCircleIcon className="w-3 h-3" />,
    };

    // Handle store selection
    const toggleStoreSelection = (id: string) => {
        setSelectedStores(prev =>
            prev.includes(id)
                ? prev.filter(storeId => storeId !== id)
                : [...prev, id]
        );
    };

    const selectAllStores = () => {
        if (selectedStores.length === paginatedStores.length) {
            setSelectedStores([]);
        } else {
            setSelectedStores(paginatedStores.map(store => store.id));
        }
    };

    const verb = pending?.status === 'suspended' ? 'Suspend' : 'Deactivate';
    const confirmRequirement = pending?.kind === 'single' ? pending.storeName : 'SUSPEND';
    const confirmNeedsTyping = pending?.status === 'suspended';
    const reasonValid = reasonCode === 'Other' ? reasonNote.trim().length > 0 : reasonCode.length > 0;
    const canConfirm = !!pending && reasonValid && (!confirmNeedsTyping || confirmText.trim() === confirmRequirement);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest text-sp-green-dark">Platform</p>
                        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-text">Store Management</h1>
                        <p className="text-brand-text-muted mt-1">
                            Monitor and manage all stores on your platform
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadStores}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-xl hover:bg-surface-variant transition-all shadow-sm active:scale-95"
                        >
                            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">Total Stores</div>
                        <div className="text-2xl font-extrabold text-brand-text mt-1 tnum">{stores.length}</div>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">Active</div>
                        <div className="text-2xl font-extrabold text-success mt-1 tnum">
                            {stores.filter(s => s.status === 'active').length}
                        </div>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">On Trial</div>
                        <div className="text-2xl font-extrabold text-sp-amber mt-1 tnum">
                            {stores.filter(s => s.subscriptionStatus === 'trial').length}
                        </div>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                        <div className="text-sm text-brand-text-muted">Suspended</div>
                        <div className="text-2xl font-extrabold text-danger mt-1 tnum">
                            {stores.filter(s => s.status === 'suspended').length}
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedStores.length > 0 && (
                    <div className="bg-sp-green-soft border border-sp-green/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-sp-green/15 text-sp-green-dark font-bold rounded-lg">
                                {selectedStores.length}
                            </div>
                            <span className="font-semibold text-sp-green-dark">
                                {selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => bulkUpdateStatus('active')}
                                className="px-3 py-1.5 text-sm font-semibold text-success bg-success-muted rounded-lg hover:opacity-80 transition-all active:scale-95"
                            >
                                Activate
                            </button>
                            <button
                                onClick={() => bulkUpdateStatus('inactive')}
                                className="px-3 py-1.5 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-lg hover:bg-surface-variant transition-all active:scale-95"
                            >
                                Deactivate
                            </button>
                            <button
                                onClick={() => bulkUpdateStatus('suspended')}
                                className="px-3 py-1.5 text-sm font-semibold text-danger bg-danger-muted rounded-lg hover:opacity-80 transition-all active:scale-95"
                            >
                                Suspend
                            </button>
                            <button
                                onClick={() => setSelectedStores([])}
                                className="px-3 py-1.5 text-sm font-semibold text-brand-text-muted hover:text-brand-text"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="bg-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-brand-border">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <SearchIcon className="w-5 h-5 text-brand-text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search stores by name, email, or ID..."
                                    className="w-full pl-10 pr-4 py-3 bg-surface border border-brand-border rounded-xl focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none transition-colors text-brand-text placeholder-brand-text-muted"
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-3 bg-surface border border-brand-border rounded-xl hover:bg-surface-variant transition-all active:scale-95"
                            >
                                <FilterIcon className="w-5 h-5 text-brand-text-muted" />
                                <span className="text-sm font-semibold text-brand-text">Filters</span>
                                <ChevronDownIcon className={`w-4 h-4 text-brand-text-muted transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-2">Status</label>
                                    <select
                                        className="w-full bg-surface border border-brand-border rounded-xl py-2.5 px-3 text-sm text-brand-text focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none"
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-2">Subscription</label>
                                    <select
                                        className="w-full bg-surface border border-brand-border rounded-xl py-2.5 px-3 text-sm text-brand-text focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none"
                                        value={filters.subscription}
                                        onChange={(e) => setFilters(prev => ({ ...prev, subscription: e.target.value as any }))}
                                    >
                                        <option value="all">All Subscriptions</option>
                                        <option value="trial">Trial</option>
                                        <option value="active">Active</option>
                                        <option value="past_due">Past Due</option>
                                        <option value="canceled">Canceled</option>
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
                                    <th className="w-12 px-6 py-3">
                                        <input
                                            type="checkbox"
                                            checked={paginatedStores.length > 0 && selectedStores.length === paginatedStores.length}
                                            onChange={selectAllStores}
                                            className="h-4 w-4 rounded border-brand-border accent-sp-green"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        Store
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        Subscription
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        Created
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
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-4"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-surface-variant rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-surface-variant rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-variant rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 bg-surface-variant rounded w-20 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedStores.length > 0 ? (
                                    paginatedStores.map(store => {
                                        return (
                                            <tr
                                                key={store.id}
                                                className="hover:bg-surface-variant/60 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStores.includes(store.id)}
                                                        onChange={() => toggleStoreSelection(store.id)}
                                                        className="h-4 w-4 rounded border-brand-border accent-sp-green"
                                                    />
                                                </td>
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
                                                    <div className="flex items-center gap-2">
                                                        <StatusPill tone={storeMeta(store.status).tone} icon={STORE_STATUS_ICON[store.status]} className="capitalize">
                                                            {store.status}
                                                        </StatusPill>
                                                        {store.usersCount !== undefined && (
                                                            <span className="text-xs text-brand-text-muted">
                                                                • {store.usersCount} user{store.usersCount !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <StatusPill tone={subscriptionMeta(store.subscriptionStatus).tone} className="self-start">
                                                            {subscriptionMeta(store.subscriptionStatus).label}
                                                        </StatusPill>
                                                        {store.subscriptionEndsAt && (
                                                            <span className="text-xs text-brand-text-muted">
                                                                Ends {formatDate(store.subscriptionEndsAt)}
                                                            </span>
                                                        )}
                                                        {store.plan && (
                                                            <span className="text-xs text-brand-text-muted">
                                                                {store.plan} Plan
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-brand-text-muted">
                                                    {formatDate(store.createdAt)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => updateStoreStatus(store.id, store.status === 'active' ? 'inactive' : 'active')}
                                                            disabled={updatingId === store.id}
                                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 ${store.status === 'active'
                                                                ? 'text-danger bg-danger-muted hover:opacity-80'
                                                                : 'text-success bg-success-muted hover:opacity-80'
                                                                } ${updatingId === store.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {updatingId === store.id ? (
                                                                <RefreshIcon className="w-3 h-3 animate-spin" />
                                                            ) : store.status === 'active' ? (
                                                                'Deactivate'
                                                            ) : (
                                                                'Activate'
                                                            )}
                                                        </button>
                                                        {store.status !== 'suspended' && (
                                                            <button
                                                                onClick={() => updateStoreStatus(store.id, 'suspended')}
                                                                disabled={updatingId === store.id}
                                                                className="px-3 py-1.5 text-xs font-semibold text-sp-amber bg-sp-amber-soft rounded-lg hover:opacity-80 transition-all disabled:opacity-50 active:scale-95"
                                                            >
                                                                Suspend
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => navigate(`/superadmin/stores/${store.id}`)}
                                                            className="p-1.5 text-brand-text-muted hover:text-sp-green-dark transition-colors"
                                                            title="View details"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-brand-text-muted">
                                                <FilterIcon className="w-12 h-12 mb-3 opacity-50" />
                                                <p className="text-sm font-semibold">No stores found</p>
                                                <p className="text-xs mt-1">
                                                    Try adjusting your search or filters
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-sm text-brand-text-muted">
                                Showing <span className="font-semibold text-brand-text">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                <span className="font-semibold text-brand-text">{Math.min(currentPage * itemsPerPage, filteredStores.length)}</span> of{' '}
                                <span className="font-semibold text-brand-text">{filteredStores.length}</span> stores
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-lg hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors ${currentPage === pageNum
                                                    ? 'bg-sp-amber text-white shadow-sm'
                                                    : 'text-brand-text hover:bg-surface-variant'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    {totalPages > 5 && (
                                        <span className="px-2 text-brand-text-muted">...</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-lg hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    Next
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Strict status-change confirmation: reason code (+ typed confirm to suspend) */}
            {pending && (
                <Modal open onClose={() => setPending(null)} size="md" className="p-6">
                        <div className="flex items-start gap-3">
                            <span className={`material-symbols-rounded w-11 h-11 rounded-xl flex items-center justify-center text-[22px] ${pending.status === 'suspended' ? 'bg-danger-muted text-danger' : 'bg-sp-amber-soft text-sp-amber'}`}>
                                {pending.status === 'suspended' ? 'gpp_bad' : 'pause_circle'}
                            </span>
                            <div>
                                <h3 className="text-lg font-extrabold tracking-tight text-brand-text">
                                    {verb} {pending.kind === 'single' ? 'store' : `${pending.ids.length} stores`}
                                </h3>
                                <p className="text-sm text-brand-text-muted">
                                    {pending.kind === 'single' ? pending.storeName : `${pending.ids.length} selected stores`} — this affects store access.
                                </p>
                            </div>
                        </div>

                        <label className="block mt-5 text-sm font-semibold text-brand-text mb-1.5">Reason <span className="text-danger">*</span></label>
                        <select className={STATUS_INPUT} value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
                            <option value="">Select a reason…</option>
                            {REASON_CODES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        <label className="block mt-4 text-sm font-semibold text-brand-text mb-1.5">
                            Note {reasonCode === 'Other' && <span className="text-danger">*</span>}
                        </label>
                        <textarea
                            className={`${STATUS_INPUT} h-20 resize-none`}
                            placeholder="Add context — recorded in the audit log…"
                            value={reasonNote}
                            onChange={(e) => setReasonNote(e.target.value)}
                        />

                        {confirmNeedsTyping && (
                            <>
                                <label className="block mt-4 text-sm font-semibold text-brand-text mb-1.5">
                                    Type <span className="font-mono font-bold text-danger">{confirmRequirement}</span> to confirm
                                </label>
                                <input
                                    className={STATUS_INPUT}
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder={confirmRequirement}
                                />
                            </>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setPending(null)}
                                className="flex-1 py-2.5 rounded-xl bg-surface-variant text-brand-text font-semibold hover:bg-brand-border transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!canConfirm}
                                onClick={runPending}
                                className={`flex-1 py-2.5 rounded-xl text-white font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${pending.status === 'suspended' ? 'bg-danger hover:opacity-90' : 'bg-sp-amber hover:opacity-90'}`}
                            >
                                {verb}
                            </button>
                        </div>
                </Modal>
            )}
        </div>
    );
};

export default SuperAdminStores;
