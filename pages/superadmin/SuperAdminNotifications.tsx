import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { formatRelativeDate as formatDate } from '../../utils/date';
import { INPUT_CLASS } from '../../utils/ui';
import Modal from '../../components/ui/Modal';
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
    FilterIcon,
    PaperAirplaneIcon
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
            info: { color: 'bg-sp-green-soft text-sp-green-dark', icon: '📢', label: 'Info' },
            warning: { color: 'bg-sp-amber-soft text-sp-amber', icon: '⚠️', label: 'Warning' },
            urgent: { color: 'bg-danger-muted text-danger', icon: '🔴', label: 'Urgent' },
            maintenance: { color: 'bg-surface-variant text-brand-text-muted', icon: '🔧', label: 'Maintenance' }
        };
        return configs[type || 'info'];
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

    const inputClass = INPUT_CLASS;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest text-sp-green-dark">Platform</p>
                        <h1 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight text-brand-text flex items-center gap-3">
                            <span className="w-11 h-11 bg-sp-green-soft text-sp-green-dark rounded-xl flex items-center justify-center">
                                <EnvelopeIcon className="w-6 h-6" />
                            </span>
                            Broadcast Center
                        </h1>
                        <p className="text-brand-text-muted mt-1">
                            Send platform-wide announcements and track delivery across every store.
                        </p>
                    </div>
                    <button
                        onClick={loadNotifications}
                        disabled={loading}
                        className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-xl hover:bg-surface-variant transition-all disabled:opacity-50 shadow-sm active:scale-95"
                    >
                        <ClockIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-surface border border-brand-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <span className="w-11 h-11 rounded-xl bg-sp-green-soft text-sp-green-dark flex items-center justify-center">
                                <EnvelopeIcon className="w-6 h-6" />
                            </span>
                        </div>
                        <p className="mt-4 text-[13px] font-semibold tracking-wide text-brand-text-muted uppercase">Total broadcasts</p>
                        <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand-text tnum">{stats.total}</p>
                        <p className="mt-1 text-xs font-semibold text-brand-text-muted">{stats.today} sent today</p>
                    </div>

                    <div className="bg-surface border border-brand-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <span className="w-11 h-11 rounded-xl bg-success-muted text-success flex items-center justify-center">
                                <EyeIcon className="w-6 h-6" />
                            </span>
                        </div>
                        <p className="mt-4 text-[13px] font-semibold tracking-wide text-brand-text-muted uppercase">Avg read rate</p>
                        <p className="mt-1 text-3xl font-extrabold tracking-tight text-success tnum">{(stats.readRate * 100).toFixed(0)}%</p>
                        <p className="mt-1 text-xs font-semibold text-brand-text-muted">Across all broadcasts</p>
                    </div>

                    <div className="bg-surface border border-brand-border rounded-2xl p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                        <div className="flex items-start justify-between">
                            <span className="w-11 h-11 rounded-xl bg-sp-amber-soft text-sp-amber flex items-center justify-center">
                                <UsersIcon className="w-6 h-6" />
                            </span>
                        </div>
                        <p className="mt-4 text-[13px] font-semibold tracking-wide text-brand-text-muted uppercase">Stores reached</p>
                        <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand-text tnum">{notifications[0]?.totalStores || 0}</p>
                        <p className="mt-1 text-xs font-semibold text-brand-text-muted">Active receiving stores</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Form Column */}
                    <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
                        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-11 h-11 bg-sp-green-soft text-sp-green-dark rounded-xl flex items-center justify-center">
                                    <EnvelopeIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold tracking-tight text-brand-text">New broadcast</h2>
                                    <p className="text-sm text-brand-text-muted">Send a message to every store</p>
                                </div>
                            </div>

                            <form onSubmit={handleSend} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-1.5">Priority</label>
                                    <select
                                        className={inputClass}
                                        value={notificationType}
                                        onChange={(e) => setNotificationType(e.target.value as any)}
                                    >
                                        <option value="info">📢 Information</option>
                                        <option value="warning">⚠️ Warning</option>
                                        <option value="urgent">🔴 Urgent</option>
                                        <option value="maintenance">🔧 Maintenance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-1.5">Title</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        placeholder="Broadcast title..."
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-1.5">Message</label>
                                    <textarea
                                        className={`${inputClass} h-44 resize-none`}
                                        placeholder="Write your message to every store..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending || !title.trim() || !message.trim()}
                                    className="w-full flex items-center justify-center gap-2 h-12 bg-sp-amber text-white font-bold rounded-xl shadow-sm transition-all hover:bg-sp-green-dark active:scale-95 disabled:opacity-50"
                                >
                                    {sending ? (
                                        <>
                                            <ClockIcon className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <PaperAirplaneIcon className="w-5 h-5" />
                                            Send broadcast
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-brand-border text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-sp-green-soft rounded-full">
                                    <UsersIcon className="w-4 h-4 text-sp-green-dark" />
                                    <span className="text-xs font-bold text-sp-green-dark">
                                        Reaching {notifications[0]?.totalStores || 0} stores
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[600px]">
                            <div className="p-6 border-b border-brand-border">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-extrabold tracking-tight text-brand-text">Broadcast history</h2>
                                        <p className="text-sm text-brand-text-muted">
                                            {filteredNotifications.length} shown · {notifications.length} total
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <SearchIcon className="w-4 h-4 text-brand-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Search broadcasts..."
                                                className={`${inputClass} pl-10 w-full sm:w-64`}
                                                value={filters.search}
                                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all active:scale-95 ${showFilters
                                                ? 'bg-sp-amber text-white border-sp-green shadow-sm'
                                                : 'bg-surface text-brand-text-muted border-brand-border hover:bg-surface-variant'}`}
                                        >
                                            <FilterIcon className="w-4 h-4" />
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {showFilters && (
                                    <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-brand-text mb-1.5">Type</label>
                                            <select
                                                className={inputClass}
                                                value={filters.type}
                                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                                            >
                                                <option value="all">🌐 All types</option>
                                                <option value="info">📢 Information</option>
                                                <option value="warning">⚠️ Warnings</option>
                                                <option value="urgent">🔴 Urgent alerts</option>
                                                <option value="maintenance">🔧 Maintenance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-brand-text mb-1.5">Date range</label>
                                            <select
                                                className={inputClass}
                                                value={filters.dateRange}
                                                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                                            >
                                                <option value="all">⌛ All time</option>
                                                <option value="today">🕒 Today</option>
                                                <option value="week">📅 Last 7 days</option>
                                                <option value="month">🗓️ Last 30 days</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse bg-surface-variant rounded-2xl p-6 h-44 border border-brand-border"></div>
                                        ))}
                                    </div>
                                ) : filteredNotifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <div className="w-20 h-20 bg-sp-green-soft rounded-full flex items-center justify-center mb-5">
                                            <EnvelopeIcon className="w-9 h-9 text-sp-green-dark" />
                                        </div>
                                        <h3 className="text-lg font-extrabold tracking-tight text-brand-text">No broadcasts found</h3>
                                        <p className="text-sm text-brand-text-muted mt-1">Adjust your filters or send a new broadcast.</p>
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
                                                    className="bg-surface border border-brand-border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                                                >
                                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                                            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl ${typeConfig.color}`}>
                                                                {typeConfig.icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-lg font-bold text-brand-text truncate tracking-tight">
                                                                    {notification.title}
                                                                </h3>
                                                                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-variant rounded-full text-xs font-bold text-brand-text-muted">
                                                                        <UserCircleIcon className="w-3 h-3" />
                                                                        {notification.createdBy}
                                                                    </span>
                                                                    <span className="text-xs text-brand-text-muted flex items-center gap-1">
                                                                        <ClockIcon className="w-3 h-3" />
                                                                        {formatDate(notification.createdAt)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => viewStatus(notification.id)}
                                                            className="self-end sm:self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-brand-border text-brand-text text-xs font-bold hover:bg-surface-variant transition-all active:scale-95"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                            View delivery
                                                        </button>
                                                    </div>

                                                    <div className="px-4 py-3 bg-surface-variant rounded-xl mb-5">
                                                        <p className="text-sm text-brand-text leading-relaxed">
                                                            {notification.message}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-brand-border">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-success-muted flex items-center justify-center">
                                                                <UsersIcon className="w-5 h-5 text-success" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide leading-none mb-1">Read</p>
                                                                <p className="text-sm font-bold text-success leading-none tnum">
                                                                    {notification.readStores || 0} / {notification.totalStores}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="w-full sm:w-64 space-y-2">
                                                            <div className="flex justify-between items-end">
                                                                <p className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide">Read rate</p>
                                                                <p className="text-xs font-bold text-sp-green-dark tnum">{readRate}%</p>
                                                            </div>
                                                            <div className="h-2.5 bg-surface-variant rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-sp-green rounded-full transition-all duration-500"
                                                                    style={{ width: `${readRate}%` }}
                                                                />
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
                    <Modal open onClose={() => setIsModalOpen(false)} size="5xl" zIndexClass="z-[100]">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-brand-border flex justify-between items-center gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getTypeConfig(selectedNotif.notification.type).color}`}>
                                        {getTypeConfig(selectedNotif.notification.type).icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-extrabold text-xl text-brand-text tracking-tight leading-tight truncate">
                                            {selectedNotif.notification.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs font-bold text-sp-green-dark uppercase tracking-wide bg-sp-green-soft px-2 py-0.5 rounded-full">Delivery report</span>
                                            <span className="text-xs font-mono text-brand-text-muted">ID: {selectedNotif.notification.id.substring(0, 12)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="shrink-0 p-2 text-brand-text-muted hover:text-brand-text hover:bg-surface-variant rounded-xl transition-all active:scale-95"
                                >
                                    <XCircleIcon className="w-7 h-7" />
                                </button>
                            </div>

                            {/* Modal Filters */}
                            <div className="px-6 py-4 bg-surface-variant border-b border-brand-border">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold uppercase tracking-wide text-brand-text-muted">Filter</span>
                                        <select
                                            className="bg-surface border border-brand-border rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none text-brand-text transition-colors min-w-[160px]"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                        >
                                            <option value="all">🌐 All stores</option>
                                            <option value="read">✅ Read</option>
                                            <option value="unread">⏳ Pending</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wide mb-1">Read</p>
                                            <p className="text-sm font-extrabold text-success tnum">{selectedNotif.statuses.filter(s => s.isRead).length}</p>
                                        </div>
                                        <div className="w-px h-8 bg-brand-border"></div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wide mb-1">Pending</p>
                                            <p className="text-sm font-extrabold text-sp-amber tnum">{selectedNotif.statuses.filter(s => !s.isRead).length}</p>
                                        </div>
                                        <div className="w-px h-8 bg-brand-border"></div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wide mb-1">Total</p>
                                            <p className="text-sm font-extrabold text-brand-text tnum">{selectedNotif.statuses.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Table Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {modalLoading ? (
                                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                                        <div className="w-12 h-12 border-4 border-sp-green-soft rounded-full animate-spin border-t-sp-green"></div>
                                        <span className="text-sm font-semibold text-brand-text-muted">Loading delivery details…</span>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-brand-border">
                                            <thead>
                                                <tr className="bg-surface-variant">
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-brand-text-muted">Store</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-brand-text-muted">Status</th>
                                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-brand-text-muted">Delivery</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-brand-border">
                                                {filteredStatuses.length > 0 ? (
                                                    filteredStatuses.map((status, i) => (
                                                        <tr key={i} className="hover:bg-surface-variant/60 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center">
                                                                        <UsersIcon className="w-5 h-5 text-brand-text-muted" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-sm font-bold text-brand-text tracking-tight">
                                                                            {status.storeName}
                                                                        </span>
                                                                        <span className="block text-xs text-brand-text-muted font-mono mt-0.5">ID: {status.storeId.substring(0, 16)}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {status.isRead ? (
                                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success-muted text-success rounded-full">
                                                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                                                        <span className="text-xs font-bold">Read</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sp-amber-soft text-sp-amber rounded-full">
                                                                        <ClockIcon className="w-3.5 h-3.5" />
                                                                        <span className="text-xs font-bold">Pending</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wide">Sent</span>
                                                                        <span className="text-xs font-semibold text-brand-text">{formatDate(status.sentAt)}</span>
                                                                    </div>
                                                                    {status.readAt && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-success uppercase tracking-wide">Read</span>
                                                                            <span className="text-xs font-semibold text-success">{formatDate(status.readAt)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-24 text-center">
                                                            <div className="flex flex-col items-center justify-center text-brand-text-muted">
                                                                <FilterIcon className="w-12 h-12 mb-3 opacity-50" />
                                                                <p className="text-sm font-semibold">No stores match this filter</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-surface-variant border-t border-brand-border flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-surface rounded-lg border border-brand-border flex items-center justify-center">
                                        <ClockIcon className="w-4 h-4 text-brand-text-muted" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide leading-none mb-1">Sent</p>
                                        <p className="text-xs font-semibold text-brand-text">{new Date(selectedNotif.notification.createdAt).toLocaleString('en-ZM', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-sp-amber text-white font-bold text-sm rounded-xl hover:bg-sp-green-dark transition-all shadow-sm active:scale-95"
                                >
                                    Close
                                </button>
                            </div>
                </Modal>
                )}
            </div>
        </div>
    );
};

export default SuperAdminNotifications;
