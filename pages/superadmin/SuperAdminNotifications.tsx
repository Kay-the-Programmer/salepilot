import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import {
    ClockIcon,
    EyeIcon,
    EnvelopeIcon,
    UsersIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronDownIcon,
    UserCircleIcon,
    SearchIcon,
    FilterIcon
} from '../../components/icons';

// Types
interface SystemNotification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    createdBy: string;
    type?: 'info' | 'warning' | 'urgent' | 'maintenance';
    totalStores?: number;
    readStores?: number;
}

interface NotificationDetail {
    notification: SystemNotification;
    statuses: {
        storeId: string;
        storeName: string;
        isRead: boolean;
        readAt?: string;
        sentAt: string;
    }[];
}

interface NotificationFilters {
    search: string;
    type: 'all' | SystemNotification['type'];
    dateRange: 'all' | 'today' | 'week' | 'month';
}

const SuperAdminNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [notificationType, setNotificationType] = useState<SystemNotification['type']>('info');

    // Modal State
    const [selectedNotif, setSelectedNotif] = useState<NotificationDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');

    // Filters
    const [filters, setFilters] = useState<NotificationFilters>({
        search: '',
        type: 'all',
        dateRange: 'all'
    });

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const resp = await api.get<{ notifications: SystemNotification[] }>("/superadmin/notifications");
            setNotifications(resp.notifications || []);
        } catch (e: any) {
            console.error('Failed to load notifications:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        setSending(true);
        try {
            await api.post('/superadmin/notifications', {
                title,
                message,
                type: notificationType
            });
            setTitle('');
            setMessage('');
            setNotificationType('info');

            // Show success message
            const event = new CustomEvent('notify', {
                detail: {
                    type: 'success',
                    message: 'Broadcast sent successfully!'
                }
            });
            window.dispatchEvent(event);

            loadNotifications();
        } catch (error: any) {
            const event = new CustomEvent('notify', {
                detail: {
                    type: 'error',
                    message: error.message || 'Failed to send broadcast'
                }
            });
            window.dispatchEvent(event);
        } finally {
            setSending(false);
        }
    };

    const viewStatus = async (id: string) => {
        setModalLoading(true);
        try {
            const resp = await api.get<NotificationDetail>(`/superadmin/notifications/${id}/status`);
            setSelectedNotif(resp);
            setIsModalOpen(true);
        } catch (e) {
            const event = new CustomEvent('notify', {
                detail: {
                    type: 'error',
                    message: 'Failed to fetch delivery details'
                }
            });
            window.dispatchEvent(event);
        } finally {
            setModalLoading(false);
        }
    };

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        return notifications.filter(notification => {
            const matchesSearch = !filters.search ||
                notification.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                notification.message.toLowerCase().includes(filters.search.toLowerCase()) ||
                notification.createdBy.toLowerCase().includes(filters.search.toLowerCase());

            const matchesType = filters.type === 'all' || notification.type === filters.type;

            const matchesDate = (() => {
                if (filters.dateRange === 'all') return true;

                const notificationDate = new Date(notification.createdAt);
                const today = new Date();
                const diffTime = today.getTime() - notificationDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                switch (filters.dateRange) {
                    case 'today': return diffDays === 0;
                    case 'week': return diffDays <= 7;
                    case 'month': return diffDays <= 30;
                    default: return true;
                }
            })();

            return matchesSearch && matchesType && matchesDate;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notifications, filters]);

    // Filtered statuses for modal
    const filteredStatuses = useMemo(() => {
        if (!selectedNotif) return [];

        return selectedNotif.statuses.filter(status => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'read') return status.isRead;
            if (statusFilter === 'unread') return !status.isRead;
            return true;
        });
    }, [selectedNotif, statusFilter]);

    const getTypeConfig = (type?: SystemNotification['type']) => {
        const configs = {
            info: { color: 'bg-blue-100 text-blue-700', icon: '📢', label: 'Info' },
            warning: { color: 'bg-amber-100 text-amber-700', icon: '⚠️', label: 'Warning' },
            urgent: { color: 'bg-red-100 text-red-700', icon: '🔴', label: 'Urgent' },
            maintenance: { color: 'bg-purple-100 text-purple-700', icon: '🔧', label: 'Maintenance' }
        };
        return configs[type || 'info'];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const getStats = () => {
        const total = notifications.length;
        const today = notifications.filter(n => {
            const date = new Date(n.createdAt);
            const today = new Date();
            return date.toDateString() === today.toDateString();
        }).length;

        const readRate = notifications.reduce((acc, n) => {
            if (n.readStores && n.totalStores) {
                return acc + (n.readStores / n.totalStores);
            }
            return acc;
        }, 0) / (notifications.length || 1);

        return { total, today, readRate };
    };

    const stats = getStats();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg backdrop-blur-sm">
                                <EnvelopeIcon className="w-6 h-6" />
                            </div>
                            Broadcast Center
                        </h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-1">
                            Send announcements and monitor delivery status across all stores
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadNotifications}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <ClockIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600 dark:text-slate-400">Total Broadcasts</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
                            </div>
                            <EnvelopeIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                            {stats.today} sent today
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600 dark:text-slate-400">Avg. Read Rate</div>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                    {(stats.readRate * 100).toFixed(0)}%
                                </div>
                            </div>
                            <EyeIcon className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                            Across all broadcasts
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600 dark:text-slate-400">Active Stores</div>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                    {notifications[0]?.totalStores || 0}
                                </div>
                            </div>
                            <UsersIcon className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                            Total recipients
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Broadcast Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 p-6 sticky top-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <EnvelopeIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Broadcast</h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Send announcement to all stores</p>
                                </div>
                            </div>

                            <form onSubmit={handleSend} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Notification Type
                                    </label>
                                    <select
                                        className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-colors"
                                        value={notificationType}
                                        onChange={(e) => setNotificationType(e.target.value as SystemNotification['type'])}
                                    >
                                        <option value="info">📢 Information</option>
                                        <option value="warning">⚠️ Warning</option>
                                        <option value="urgent">🔴 Urgent</option>
                                        <option value="maintenance">🔧 Maintenance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-slate-500"
                                        placeholder="e.g. Scheduled Maintenance"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none h-48 resize-none transition-colors placeholder-gray-400 dark:placeholder-slate-500"
                                        placeholder="Type your announcement message here..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        required
                                    />
                                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                                        This message will be sent to all stores immediately
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending || !title.trim() || !message.trim()}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow"
                                >
                                    {sending ? (
                                        <>
                                            <ClockIcon className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <EnvelopeIcon className="w-4 h-4" />
                                            Send Broadcast
                                        </>
                                    )}
                                </button>

                                <div className="text-xs text-gray-500 dark:text-slate-500 text-center pt-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-center gap-1">
                                        <UsersIcon className="w-3 h-3" />
                                        Will be delivered to {notifications[0]?.totalStores || 0} stores
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden h-full flex flex-col backdrop-blur-sm">
                            <div className="p-6 border-b border-gray-100 dark:border-white/5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Broadcast History</h2>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                            {filteredNotifications.length} of {notifications.length} broadcasts
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <SearchIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Search broadcasts..."
                                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none w-full sm:w-64"
                                                value={filters.search}
                                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <FilterIcon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                            <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Advanced Filters */}
                                {showFilters && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Type</label>
                                            <select
                                                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                                                value={filters.type}
                                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                                            >
                                                <option value="all">All Types</option>
                                                <option value="info">Information</option>
                                                <option value="warning">Warning</option>
                                                <option value="urgent">Urgent</option>
                                                <option value="maintenance">Maintenance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Date Range</label>
                                            <select
                                                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                                                value={filters.dateRange}
                                                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                                            >
                                                <option value="all">All Time</option>
                                                <option value="today">Today</option>
                                                <option value="week">Past Week</option>
                                                <option value="month">Past Month</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {loading ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 h-32"></div>
                                        ))}
                                    </div>
                                ) : filteredNotifications.length === 0 ? (
                                    <div className="text-center py-12">
                                        <EnvelopeIcon className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-slate-400 font-medium">No broadcasts found</p>
                                        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                                            {filters.search ? 'Try adjusting your search' : 'Send your first broadcast'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredNotifications.map(notification => {
                                            const typeConfig = getTypeConfig(notification.type);
                                            const readRate = notification.readStores && notification.totalStores
                                                ? Math.round((notification.readStores / notification.totalStores) * 100)
                                                : 0;

                                            return (
                                                <div
                                                    key={notification.id}
                                                    className="bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-white/5 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-sm dark:hover:bg-slate-800/50 transition-all group"
                                                >
                                                    <div className="flex justify-between items-start gap-4 mb-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`px-2 py-1 rounded-lg text-sm font-medium ${typeConfig.color}`}>
                                                                {typeConfig.icon} {typeConfig.label}
                                                            </div>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                {notification.title}
                                                            </h3>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                                            <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                                                <ClockIcon className="w-3 h-3" />
                                                                {formatDate(notification.createdAt)}
                                                            </span>
                                                            <button
                                                                onClick={() => viewStatus(notification.id)}
                                                                disabled={modalLoading}
                                                                className="text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                                            >
                                                                <EyeIcon className="w-3 h-3" />
                                                                View Status
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 whitespace-pre-wrap line-clamp-2">
                                                        {notification.message}
                                                    </p>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <UserCircleIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                                                <span className="text-gray-600 dark:text-slate-400">{notification.createdBy}</span>
                                                            </div>
                                                            {notification.totalStores && (
                                                                <div className="flex items-center gap-2">
                                                                    <UsersIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                                                    <span className="text-gray-600 dark:text-slate-400">
                                                                        {notification.readStores || 0}/{notification.totalStores} stores read
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <div className="w-32">
                                                                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
                                                                    <span>Read Rate</span>
                                                                    <span>{readRate}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-emerald-500 transition-all duration-500"
                                                                        style={{ width: `${readRate}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Modal */}
                {isModalOpen && selectedNotif && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <div
                            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-300 border border-gray-200 dark:border-slate-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {selectedNotif.notification.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                        Delivery status across all stores
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Filter:</span>
                                            <select
                                                className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-1.5 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                            >
                                                <option value="all">All Stores</option>
                                                <option value="read">Read Only</option>
                                                <option value="unread">Unread Only</option>
                                            </select>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">
                                            Showing {filteredStatuses.length} of {selectedNotif.statuses.length} stores
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                                {selectedNotif.statuses.filter(s => s.isRead).length} read
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ClockIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                            <span className="text-gray-600 dark:text-slate-400">
                                                {selectedNotif.statuses.filter(s => !s.isRead).length} unread
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {modalLoading ? (
                                    <div className="flex items-center justify-center p-12">
                                        <ClockIcon className="w-6 h-6 animate-spin text-indigo-600" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                                            <thead className="bg-gray-50 dark:bg-slate-800/50 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                        Store
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                        Time
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                                                {filteredStatuses.length > 0 ? (
                                                    filteredStatuses.map((status, i) => (
                                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {status.storeName}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                                                                        ID: {status.storeId.substring(0, 8)}...
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {status.isRead ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                                        <CheckCircleIcon className="w-3 h-3" />
                                                                        Read
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                                                        <ClockIcon className="w-3 h-3" />
                                                                        Unread
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                                                                <div className="flex flex-col">
                                                                    <span>Sent: {formatDate(status.sentAt)}</span>
                                                                    {status.readAt && (
                                                                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                                                            Read: {formatDate(status.readAt)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                                <FilterIcon className="w-12 h-12 mb-3 opacity-50" />
                                                                <p className="text-sm font-medium">No stores match your filter</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500 dark:text-slate-400">
                                        Broadcast sent on {new Date(selectedNotif.notification.createdAt).toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminNotifications;