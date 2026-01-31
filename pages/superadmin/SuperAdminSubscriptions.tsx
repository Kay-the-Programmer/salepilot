import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
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
    ChevronRightIcon
} from '../../components/icons';

// Types
interface StoreRow {
    id: string;
    name: string;
    email?: string;
    status: string;
    subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
    subscriptionEndsAt?: string | null;
    subscriptionStartedAt?: string | null;
    planName?: string;
    totalRevenue?: number;
}

interface PaymentFormData {
    storeId: string;
    amount: string;
    currency: string;
    periodDays: string;
    notes?: string;
    paymentMethod?: string;
}

interface SubscriptionStats {
    total: number;
    active: number;
    trial: number;
    pastDue: number;
    canceled: number;
    totalRevenue: number;
}

const SuperAdminSubscriptions: React.FC = () => {
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | StoreRow['subscriptionStatus']>('all');

    // Payment Modal
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
    const [processing, setProcessing] = useState(false);

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

            newStats.totalRevenue += store.totalRevenue || 0;
        });

        setStats(newStats);
    };

    const openPaymentModal = (store?: StoreRow) => {
        setSelectedStore(store || null);
        setPaymentForm({
            storeId: store?.id || '',
            amount: '',
            currency: 'ZMW',
            periodDays: '30',
            notes: '',
            paymentMethod: 'manual'
        });
        setPaymentModalOpen(true);
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

            await api.post("/superadmin/payments/record", payload);
            setPaymentModalOpen(false);
            loadStores(); // Reload to see updates
        } catch (err: any) {
            console.error(err);
            alert("Failed to record payment: " + (err.message || 'Unknown error'));
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW'
        }).format(amount);
    };

    const filteredStores = useMemo(() => {
        return stores.filter(store => {
            const matchesSearch = !search ||
                store.name.toLowerCase().includes(search.toLowerCase()) ||
                store.email?.toLowerCase().includes(search.toLowerCase()) ||
                store.id.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || store.subscriptionStatus === statusFilter;

            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            // Sort by status priority
            const statusOrder: Record<string, number> = { 'past_due': 0, 'trial': 1, 'active': 2, 'canceled': 3 };
            return statusOrder[a.subscriptionStatus] - statusOrder[b.subscriptionStatus];
        });
    }, [stores, search, statusFilter]);

    const getSubscriptionConfig = (status: StoreRow['subscriptionStatus']) => {
        const configs = {
            active: {
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
                icon: <CheckCircleIcon className="w-4 h-4" />,
                label: 'Active'
            },
            trial: {
                color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
                icon: <ClockIcon className="w-4 h-4" />,
                label: 'Trial'
            },
            past_due: {
                color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
                icon: <ExclamationTriangleIcon className="w-4 h-4" />,
                label: 'Past Due'
            },
            canceled: {
                color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-gray-700',
                icon: <XCircleIcon className="w-4 h-4" />,
                label: 'Canceled'
            }
        };
        return configs[status];
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg backdrop-blur-sm">
                                <CreditCardIcon className="w-6 h-6" />
                            </div>
                            Subscription Management
                        </h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-1">
                            Monitor billing status, track payments, and manage subscriptions
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadStores}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={() => openPaymentModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 border border-transparent text-white font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-indigo-500/25"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Record Payment
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        <div className="text-sm text-gray-600 dark:text-slate-400">Total Stores</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        <div className="text-sm text-gray-600 dark:text-slate-400">Active</div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        <div className="text-sm text-gray-600 dark:text-slate-400">Trial</div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.trial}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        <div className="text-sm text-gray-600 dark:text-slate-400">Past Due</div>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pastDue}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        <div className="text-sm text-gray-600 dark:text-slate-400">Canceled</div>
                        <div className="text-2xl font-bold text-gray-600 dark:text-slate-500 mt-1">{stats.canceled}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        <div className="text-sm text-gray-600 dark:text-slate-400">Total Revenue</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {formatCurrency(stats.totalRevenue)}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden backdrop-blur-sm">
                    <div className="p-4 border-b border-gray-100 dark:border-white/5">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="relative flex-1">
                                <SearchIcon className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search stores by name, email, or ID..."
                                    className="w-full bg-white dark:bg-slate-800 pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-colors"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <FilterIcon className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                    <select
                                        className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
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
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">More Filters</span>
                                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Additional filters can be added here */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Plan Type</label>
                                    <select className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none">
                                        <option value="all">All Plans</option>
                                        <option value="basic">Basic</option>
                                        <option value="pro">Professional</option>
                                        <option value="premium">Premium</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Expiration</label>
                                    <select className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none">
                                        <option value="all">Any Time</option>
                                        <option value="week">Within 7 Days</option>
                                        <option value="month">Within 30 Days</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Payment Status</label>
                                    <select className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none">
                                        <option value="all">All Payments</option>
                                        <option value="paid">Paid</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                            <thead className="bg-gray-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                        Store Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                        Subscription
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                        Expiration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                        Revenue
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-20 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : filteredStores.length > 0 ? (
                                    filteredStores.map(store => {
                                        const config = getSubscriptionConfig(store.subscriptionStatus);

                                        return (
                                            <tr key={store.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {store.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-slate-400 truncate max-w-[200px]">
                                                            {store.email || 'No email'}
                                                        </div>
                                                        <div className="text-xs font-mono text-gray-400 dark:text-slate-500 mt-1">
                                                            ID: {store.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                                                                {config.icon}
                                                                {config.label}
                                                            </span>
                                                            {store.planName && (
                                                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                                                    • {store.planName}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {store.subscriptionStartedAt && (
                                                            <div className="text-xs text-gray-500 dark:text-slate-500">
                                                                Started {formatDate(store.subscriptionStartedAt)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1 text-sm dark:text-slate-300">
                                                            <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                                            {formatDate(store.subscriptionEndsAt)}
                                                        </div>
                                                        {store.subscriptionEndsAt && (
                                                            <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                                                {new Date(store.subscriptionEndsAt).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(store.totalRevenue || 0)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-500">
                                                        Lifetime revenue
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openPaymentModal(store)}
                                                            className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
                                                        >
                                                            <CreditCardIcon className="w-4 h-4" />
                                                            Record Payment
                                                        </button>
                                                        <button
                                                            onClick={() => {/* View details */ }}
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                                                            title="View details"
                                                        >
                                                            <InformationCircleIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                                                <CreditCardIcon className="w-12 h-12 mb-3 opacity-50" />
                                                <p className="text-sm font-medium">No subscriptions found</p>
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

                    {/* Pagination could be added here */}
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => !processing && setPaymentModalOpen(false)}
                >
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300 border border-gray-200 dark:border-slate-800">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCardIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Record Manual Payment
                            </h3>
                            <button
                                onClick={() => !processing && setPaymentModalOpen(false)}
                                disabled={processing}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] custom-scrollbar">
                            {!selectedStore ? (
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white">Select a store</h4>
                                    <div className="relative">
                                        <SearchIcon className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Search stores..."
                                            className="w-full bg-white dark:bg-slate-800 pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                                            onChange={(e) => {/* Implement local search if needed */ }}
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg divide-y divide-gray-100 dark:divide-slate-800">
                                        {stores.slice(0, 10).map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedStore(s)}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 flex items-center justify-between group transition-colors"
                                            >
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{s.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400">{s.email}</div>
                                                </div>
                                                <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg flex items-center justify-between border border-gray-200 dark:border-slate-700">
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-slate-400">Store</div>
                                            <div className="font-medium text-gray-900 dark:text-white">{selectedStore.name}</div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedStore(null)}
                                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <form onSubmit={handleRecordPayment} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                Duration
                                            </label>
                                            <select
                                                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-colors"
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
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                    Amount
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400">
                                                        $
                                                    </div>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-colors"
                                                        value={paymentForm.amount}
                                                        onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                                        required
                                                        disabled={processing}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                    Currency
                                                </label>
                                                <select
                                                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-colors"
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
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                Payment Method
                                            </label>
                                            <select
                                                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-colors"
                                                value={paymentForm.paymentMethod}
                                                onChange={e => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                                disabled={processing}
                                            >
                                                <option value="manual">Manual Entry</option>
                                                <option value="stripe">Stripe</option>
                                                <option value="paypal">PayPal</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="cash">Cash</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                Notes (Optional)
                                            </label>
                                            <textarea
                                                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-colors resize-none h-24"
                                                placeholder="Add any notes about this payment..."
                                                value={paymentForm.notes}
                                                onChange={e => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                                disabled={processing}
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-4">
                                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                                                    <InformationCircleIcon className="w-5 h-5" />
                                                    <span className="font-medium">Summary</span>
                                                </div>
                                                <div className="text-sm text-blue-600 dark:text-blue-300">
                                                    This will extend the subscription by {paymentForm.periodDays} days from today.
                                                    {paymentForm.amount && (
                                                        <div className="mt-1 font-medium">
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
                                                className="flex-1 py-3 text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing || !paymentForm.storeId || !paymentForm.amount}
                                                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminSubscriptions;