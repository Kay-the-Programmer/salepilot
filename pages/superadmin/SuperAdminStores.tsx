import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
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

const SuperAdminStores: React.FC = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

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

    const updateStoreStatus = async (id: string, newStatus: StoreRow['status']) => {
        if (!window.confirm(`Change store status to ${newStatus}? This will affect store access.`)) return;

        setUpdatingId(id);
        try {
            const resp = await api.patch<{ store: StoreRow }>(`/superadmin/stores/${id}`, {
                status: newStatus
            });
            setStores(prev => prev.map(s => s.id === id ? resp.store : s));
        } catch (e: any) {
            alert(e.message || 'Update failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const bulkUpdateStatus = async (newStatus: StoreRow['status']) => {
        if (!selectedStores.length) return;
        if (!window.confirm(`Update ${selectedStores.length} stores to ${newStatus}?`)) return;

        try {
            const promises = selectedStores.map(id =>
                api.patch(`/superadmin/stores/${id}`, { status: newStatus })
            );
            await Promise.all(promises);
            await loadStores();
            setSelectedStores([]);
        } catch (e: any) {
            alert('Bulk update failed');
        }
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

    // Status badge styling
    const getStatusConfig = (status: StoreRow['status']) => {
        const configs = {
            active: {
                color: 'bg-success-muted text-success',
                icon: <CheckCircleIcon className="w-3 h-3" />
            },
            inactive: {
                color: 'bg-surface-variant text-brand-text-muted',
                icon: <ChevronDownIcon className="w-3 h-3" />
            },
            suspended: {
                color: 'bg-danger-muted text-danger',
                icon: <XCircleIcon className="w-3 h-3" />
            }
        };
        return configs[status];
    };

    // Subscription badge styling
    const getSubscriptionConfig = (status: StoreRow['subscriptionStatus']) => {
        const configs = {
            trial: {
                color: 'bg-sp-amber-soft text-sp-amber',
                label: 'Trial'
            },
            active: {
                color: 'bg-success-muted text-success',
                label: 'Active'
            },
            past_due: {
                color: 'bg-danger-muted text-danger',
                label: 'Past Due'
            },
            canceled: {
                color: 'bg-surface-variant text-brand-text-muted',
                label: 'Canceled'
            }
        };
        return configs[status];
    };

    const getStatusStyle = (status: StoreRow['status']) => {
        const styles = {
            active: 'bg-success-muted text-success',
            inactive: 'bg-surface-variant text-brand-text-muted',
            suspended: 'bg-danger-muted text-danger'
        };
        return styles[status] || styles.inactive;
    };

    const getSubscriptionStyle = (status: StoreRow['subscriptionStatus']) => {
        const styles = {
            trial: 'bg-sp-amber-soft text-sp-amber',
            active: 'bg-success-muted text-success',
            past_due: 'bg-danger-muted text-danger',
            canceled: 'bg-surface-variant text-brand-text-muted'
        };
        return styles[status] || styles.canceled;
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
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
                                        const statusConfig = getStatusConfig(store.status);
                                        const subConfig = getSubscriptionConfig(store.subscriptionStatus);

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
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getStatusStyle(store.status)}`}>
                                                            {statusConfig.icon}
                                                            {store.status}
                                                        </span>
                                                        {store.usersCount !== undefined && (
                                                            <span className="text-xs text-brand-text-muted">
                                                                • {store.usersCount} user{store.usersCount !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-bold ${getSubscriptionStyle(store.subscriptionStatus)}`}>
                                                            {subConfig.label}
                                                        </span>
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
                                                    ? 'bg-sp-green text-white shadow-sm'
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
        </div>
    );
};

export default SuperAdminStores;
