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
    PencilIcon,
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
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                icon: <CheckCircleIcon className="w-3 h-3" />
            },
            inactive: {
                color: 'bg-gray-50 text-gray-700 border-gray-200',
                icon: <ChevronDownIcon className="w-3 h-3" />
            },
            suspended: {
                color: 'bg-red-50 text-red-700 border-red-200',
                icon: <XCircleIcon className="w-3 h-3" />
            }
        };
        return configs[status];
    };

    // Subscription badge styling
    const getSubscriptionConfig = (status: StoreRow['subscriptionStatus']) => {
        const configs = {
            trial: {
                color: 'bg-purple-50 text-purple-700 border-purple-200',
                label: 'Trial'
            },
            active: {
                color: 'bg-blue-50 text-blue-700 border-blue-200',
                label: 'Active'
            },
            past_due: {
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                label: 'Past Due'
            },
            canceled: {
                color: 'bg-gray-50 text-gray-700 border-gray-200',
                label: 'Canceled'
            }
        };
        return configs[status];
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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Store Management</h1>
                        <p className="text-gray-600 mt-1">
                            Monitor and manage all stores on your platform
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadStores}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="text-sm text-gray-600">Total Stores</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{stores.length}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="text-sm text-gray-600">Active</div>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">
                            {stores.filter(s => s.status === 'active').length}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="text-sm text-gray-600">On Trial</div>
                        <div className="text-2xl font-bold text-purple-600 mt-1">
                            {stores.filter(s => s.subscriptionStatus === 'trial').length}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="text-sm text-gray-600">Suspended</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">
                            {stores.filter(s => s.status === 'suspended').length}
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedStores.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                                {selectedStores.length}
                            </div>
                            <span className="font-medium text-blue-900">
                                {selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => bulkUpdateStatus('active')}
                                className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                                Activate
                            </button>
                            <button
                                onClick={() => bulkUpdateStatus('inactive')}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Deactivate
                            </button>
                            <button
                                onClick={() => bulkUpdateStatus('suspended')}
                                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                Suspend
                            </button>
                            <button
                                onClick={() => setSelectedStores([])}
                                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search stores by name, email, or ID..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FilterIcon className="w-5 h-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Filters</span>
                                <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subscription</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-12 px-6 py-3">
                                        <input
                                            type="checkbox"
                                            checked={paginatedStores.length > 0 && selectedStores.length === paginatedStores.length}
                                            onChange={selectAllStores}
                                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Store
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Subscription
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-4"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedStores.length > 0 ? (
                                    paginatedStores.map(store => {
                                        const statusConfig = getStatusConfig(store.status);
                                        const subConfig = getSubscriptionConfig(store.subscriptionStatus);

                                        return (
                                            <tr
                                                key={store.id}
                                                className="hover:bg-gray-50 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStores.includes(store.id)}
                                                        onChange={() => toggleStoreSelection(store.id)}
                                                        className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                            {store.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                                            {store.email || 'No email'}
                                                        </div>
                                                        <div className="text-xs font-mono text-gray-400 mt-1">
                                                            ID: {store.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                                            {statusConfig.icon}
                                                            {store.status}
                                                        </span>
                                                        {store.usersCount !== undefined && (
                                                            <span className="text-xs text-gray-500">
                                                                • {store.usersCount} user{store.usersCount !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex items-center self-start px-2 py-1 rounded text-xs font-medium border ${subConfig.color}`}>
                                                            {subConfig.label}
                                                        </span>
                                                        {store.subscriptionEndsAt && (
                                                            <span className="text-xs text-gray-500">
                                                                Ends {formatDate(store.subscriptionEndsAt)}
                                                            </span>
                                                        )}
                                                        {store.plan && (
                                                            <span className="text-xs text-gray-500">
                                                                {store.plan} Plan
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {formatDate(store.createdAt)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => updateStoreStatus(store.id, store.status === 'active' ? 'inactive' : 'active')}
                                                            disabled={updatingId === store.id}
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${store.status === 'active'
                                                                ? 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100'
                                                                : 'text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
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
                                                                className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                                                            >
                                                                Suspend
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => navigate(`/superadmin/stores/${store.id}`)}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
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
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <FilterIcon className="w-12 h-12 mb-3 opacity-50" />
                                                <p className="text-sm font-medium">No stores found</p>
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
                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredStores.length)}</span> of{' '}
                                <span className="font-medium">{filteredStores.length}</span> stores
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                                className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${currentPage === pageNum
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    {totalPages > 5 && (
                                        <span className="px-2 text-gray-500">...</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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