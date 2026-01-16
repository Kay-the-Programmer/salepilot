import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
    SearchIcon,
    FilterIcon,
} from '../../components/icons';

// Types
interface StoreRow {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'suspended';
    subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
    subscriptionEndsAt?: string | null;
    createdAt: string;
    updatedAt: string;
    usersCount?: number; // Optional, if backend provides it
}

const SuperAdminStores: React.FC = () => {
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | StoreRow['status']>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        setLoading(true);
        try {
            const resp = await api.get<{ stores: StoreRow[] }>("/superadmin/stores");
            setStores(resp.stores || []);
        } catch (e: any) {
            console.error(e);
            // alert('Failed to load stores'); 
        } finally {
            setLoading(false);
        }
    };

    const updateStoreStatus = async (id: string, newStatus: StoreRow['status']) => {
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
        try {
            const resp = await api.patch<{ store: StoreRow }>(`/superadmin/stores/${id}`, { status: newStatus });
            setStores(prev => prev.map(s => s.id === id ? resp.store : s));
        } catch (e: any) {
            alert(e.message || 'Update failed');
        }
    };

    // Filtering
    const filtered = stores.filter(s => {
        const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search);
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'inactive': return 'bg-gray-50 text-gray-700 border-gray-100';
            case 'suspended': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    const getSubColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-blue-600 bg-blue-50';
            case 'trial': return 'text-purple-600 bg-purple-50';
            case 'past_due': return 'text-orange-600 bg-orange-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Stores</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage all registered stores on the platform.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600">{filtered.length} Stores</span>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FilterIcon className="w-5 h-5 text-gray-400" />
                        <select
                            className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subscription</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {paginated.map(store => (
                                <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{store.name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{store.id.substring(0, 8)}...</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(store.status)} capitalize`}>
                                            {store.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className={`inline-flex self-start items-center px-2 py-0.5 rounded text-xs font-medium ${getSubColor(store.subscriptionStatus)} capitalize mb-1`}>
                                                {store.subscriptionStatus.replace('_', ' ')}
                                            </span>
                                            {store.subscriptionEndsAt && (
                                                <span className="text-xs text-gray-400">
                                                    Ends {new Date(store.subscriptionEndsAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(store.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex items-center justify-end gap-2">
                                            {store.status === 'active' ? (
                                                <button
                                                    onClick={() => updateStoreStatus(store.id, 'inactive')}
                                                    className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    Deactivate
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => updateStoreStatus(store.id, 'active')}
                                                    className="text-emerald-600 hover:text-emerald-800 text-xs font-medium px-2 py-1 border border-emerald-200 rounded hover:bg-emerald-50 transition-colors"
                                                >
                                                    Activate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && paginated.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No stores found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminStores;
