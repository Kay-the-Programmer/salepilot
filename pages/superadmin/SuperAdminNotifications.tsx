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

        return date.toLocaleDateString('en-ZM', {
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 selection:bg-indigo-500/30 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-500/5 dark:bg-purple-900/10 rounded-full blur-[120px]"></div>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform">
                                <EnvelopeIcon className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                Broadcast <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Center</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">
                            Omnichannel signal dispatch and delivery reconciliation
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadNotifications}
                            disabled={loading}
                            className="group flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm backdrop-blur-md"
                        >
                            <ClockIcon className={`w-4 h-4 transition-transform group-hover:rotate-180 ${loading ? 'animate-spin' : ''}`} />
                            SYNC_SYSTEM
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="relative group overflow-hidden bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-2xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Total_Transmission</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
                            </div>
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                                <EnvelopeIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-indigo-500/60 font-bold uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            {stats.today} dispatched_cycle_today
                        </div>
                    </div>

                    <div className="relative group overflow-hidden bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-2xl transition-all hover:shadow-2xl hover:shadow-emerald-500/10">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Avg_Acknowledge_Rate</p>
                                <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{(stats.readRate * 100).toFixed(0)}%</h3>
                            </div>
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <EyeIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-emerald-500/60 font-bold uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Engagement_Stable_Optimized
                        </div>
                    </div>

                    <div className="relative group overflow-hidden bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-2xl transition-all hover:shadow-2xl hover:shadow-purple-500/10 sm:col-span-2 lg:col-span-1">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Terminal_Fleet_Size</p>
                                <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400">{notifications[0]?.totalStores || 0}</h3>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                <UsersIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-purple-500/60 font-bold uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                            Active_Receiver_Nodes
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Form Column */}
                    <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-10">
                        <div className="relative overflow-hidden bg-white/60 dark:bg-slate-900/60 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-3xl group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 rotate-6 group-hover:rotate-0 transition-transform">
                                    <EnvelopeIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Signal Dispatch</h2>
                                    <p className="text-[10px] font-mono text-slate-400 dark:text-indigo-400/50 uppercase tracking-widest mt-0.5 font-bold">Transmit_New_Packet</p>
                                </div>
                            </div>

                            <form onSubmit={handleSend} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Priority_Rank</label>
                                    <select
                                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer ring-1 ring-indigo-500/10 hover:ring-indigo-500/30"
                                        value={notificationType}
                                        onChange={(e) => setNotificationType(e.target.value as any)}
                                    >
                                        <option value="info">📢 Information</option>
                                        <option value="warning">⚠️ Warning</option>
                                        <option value="urgent">🔴 Urgent</option>
                                        <option value="maintenance">🔧 Maintenance</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Signal_Header</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        placeholder="Identification code..."
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Payload_Data</label>
                                    <textarea
                                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none h-48 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        placeholder="Input message content for broadcast fleet..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending || !title.trim() || !message.trim()}
                                    className="w-full group/btn relative overflow-hidden h-14 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        {sending ? (
                                            <>
                                                <ClockIcon className="w-5 h-5 animate-spin" />
                                                Broadcasting...
                                            </>
                                        ) : (
                                            <>
                                                <PaperAirplaneIcon className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                                Initiate_Link
                                            </>
                                        )}
                                    </div>
                                </button>
                            </form>

                            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/5 rounded-full">
                                    <UsersIcon className="w-4 h-4 text-indigo-500" />
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                        Targeting {notifications[0]?.totalStores || 0} receiving units
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="lg:col-span-2">
                        <div className="relative overflow-hidden bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-3xl flex flex-col h-[calc(100vh-280px)] min-h-[600px] group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

                            <div className="p-8 border-b border-slate-100 dark:border-white/5 relative bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Signal History</h2>
                                        </div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-[0.2em] font-bold">
                                            {filteredNotifications.length} active_signals_detected / {notifications.length} total_logged
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative group/search">
                                            <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/search:text-indigo-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Search transmission logs..."
                                                className="pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-white/5 rounded-2xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                value={filters.search}
                                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all active:scale-95 ${showFilters
                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                        >
                                            <FilterIcon className="w-4 h-4" />
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {showFilters && (
                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Type_Classification</label>
                                            <select
                                                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-transparent dark:border-white/5 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                                value={filters.type}
                                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                                            >
                                                <option value="all">🌐 All Transmissions</option>
                                                <option value="info">📢 Information</option>
                                                <option value="warning">⚠️ Warnings</option>
                                                <option value="urgent">🔴 Urgent Alerts</option>
                                                <option value="maintenance">🔧 Maintenance</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Temporal_Window</label>
                                            <select
                                                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-transparent dark:border-white/5 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                                value={filters.dateRange}
                                                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                                            >
                                                <option value="all">⌛ Full Archive</option>
                                                <option value="today">🕒 Current Cycle</option>
                                                <option value="week">📅 7-Day Window</option>
                                                <option value="month">🗓️ 30-Day Window</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {loading ? (
                                    <div className="space-y-6">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800/40 rounded-3xl p-6 h-48 border border-transparent dark:border-white/5"></div>
                                        ))}
                                    </div>
                                ) : filteredNotifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 text-center">
                                        <div className="w-24 h-24 bg-indigo-500/5 rounded-full flex items-center justify-center mb-6 border border-indigo-500/10">
                                            <EnvelopeIcon className="w-10 h-10 text-indigo-500/20" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">No Signals Detected</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-mono">ADJUST_PARAMETERS_OR_INITIATE_BROADCAST</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pb-4">
                                        {filteredNotifications.map(notification => {
                                            const typeConfig = getTypeConfig(notification.type);
                                            const readRate = notification.readStores && notification.totalStores
                                                ? Math.round((notification.readStores / notification.totalStores) * 100)
                                                : 0;

                                            return (
                                                <div
                                                    key={notification.id}
                                                    className="group/item relative overflow-hidden bg-white/40 dark:bg-slate-800/10 border border-slate-200 dark:border-white/5 rounded-3xl p-6 transition-all hover:bg-white dark:hover:bg-slate-800/30 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
                                                >
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover/item:opacity-100 transition-all duration-300"></div>

                                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6">
                                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                                            <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${typeConfig.color} shadow-lg shadow-current/10 border border-white/20`}>
                                                                {typeConfig.icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover/item:text-indigo-400 transition-colors truncate tracking-tight">
                                                                    {notification.title}
                                                                </h3>
                                                                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/5 rounded-full text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
                                                                        <UserCircleIcon className="w-3 h-3" />
                                                                        {notification.createdBy}
                                                                    </span>
                                                                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                                        <ClockIcon className="w-3 h-3" />
                                                                        {formatDate(notification.createdAt)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => viewStatus(notification.id)}
                                                            className="self-end sm:self-start flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-indigo-500/20"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                            Audit_Signal
                                                        </button>
                                                    </div>

                                                    <div className="relative px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl mb-6">
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                                                            "{notification.message}"
                                                        </p>
                                                        <div className="absolute right-4 bottom-2 opacity-5 dark:opacity-10 pointer-events-none">
                                                            <EnvelopeIcon className="w-12 h-12" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 border-t border-slate-100 dark:border-white/5">
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                                    <UsersIcon className="w-5 h-5 text-emerald-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Acknowledge</p>
                                                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                                                        {notification.readStores || 0} / {notification.totalStores}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="w-full sm:w-64 space-y-2">
                                                            <div className="flex justify-between items-end">
                                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reconciliation_Rate</p>
                                                                <p className="text-[10px] font-mono font-bold text-indigo-500">{readRate}%</p>
                                                            </div>
                                                            <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-transparent dark:border-white/10">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-1000 ease-out relative"
                                                                    style={{ width: `${readRate}%` }}
                                                                >
                                                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
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
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10 transition-opacity duration-300 bg-slate-950/80 backdrop-blur-xl"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <div
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_0_100px_-20px_rgba(79,70,229,0.3)] w-full max-w-5xl max-h-full flex flex-col animate-in fade-in zoom-in-95 duration-500 border border-white/20 dark:border-white/10 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-500/5 to-transparent relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50"></div>
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl ${getTypeConfig(selectedNotif.notification.type).color} shadow-lg border border-white/20`}>
                                        {getTypeConfig(selectedNotif.notification.type).icon}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight leading-tight">
                                            {selectedNotif.notification.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] font-mono bg-indigo-500/5 px-2 py-0.5 rounded-full">Signal_Audit_Active</span>
                                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">ID: {selectedNotif.notification.id.substring(0, 12)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95 group"
                                >
                                    <XCircleIcon className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>

                            {/* Modal Filters */}
                            <div className="px-8 py-6 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">Filter_Status:</span>
                                            <select
                                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all shadow-sm appearance-none cursor-pointer pr-10 min-w-[160px]"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                            >
                                                <option value="all">🌐 All Receiver Nodes</option>
                                                <option value="read">✅ Acknowledged</option>
                                                <option value="unread">⏳ Outstanding</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">ACKD</p>
                                            <p className="text-sm font-black text-emerald-500 font-mono">{selectedNotif.statuses.filter(s => s.isRead).length}</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">PEND</p>
                                            <p className="text-sm font-black text-amber-500 font-mono">{selectedNotif.statuses.filter(s => !s.isRead).length}</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">TOTAL</p>
                                            <p className="text-sm font-black text-indigo-500 font-mono">{selectedNotif.statuses.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Table Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {modalLoading ? (
                                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full animate-spin border-t-indigo-500"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-8 h-8 bg-indigo-500 rounded-full animate-pulse"></div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono animate-pulse">Reconstructing_Node_Logs...</span>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-separate border-spacing-0">
                                            <thead>
                                                <tr className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 border-b border-slate-100 dark:border-white/5 font-mono">Terminal_Location</th>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 border-b border-slate-100 dark:border-white/5 font-mono">Signal_Status</th>
                                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 border-b border-slate-100 dark:border-white/5 font-mono">Transmission_Metadata</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                                {filteredStatuses.length > 0 ? (
                                                    filteredStatuses.map((status, i) => (
                                                        <tr key={i} className="group/row hover:bg-indigo-500/[0.02] transition-colors">
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-transparent dark:border-white/10 group-hover/row:border-indigo-500/30 transition-all">
                                                                        <UsersIcon className="w-5 h-5 text-slate-400 group-hover/row:text-indigo-500 transition-colors" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-sm font-black text-slate-900 dark:text-white group-hover/row:text-indigo-400 transition-colors tracking-tight">
                                                                            {status.storeName}
                                                                        </span>
                                                                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">ID: {status.storeId.substring(0, 16).toUpperCase()}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                {status.isRead ? (
                                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest font-mono">Ack_Delivered</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest font-mono">Pending_Sync</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Sent:</span>
                                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">{formatDate(status.sentAt)}</span>
                                                                    </div>
                                                                    {status.readAt && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest font-mono">Ack:</span>
                                                                            <span className="text-[10px] font-black text-emerald-500/80 font-mono">{formatDate(status.readAt)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-8 py-32 text-center">
                                                            <div className="flex flex-col items-center justify-center opacity-20 group">
                                                                <FilterIcon className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform" />
                                                                <p className="text-sm font-black uppercase tracking-[0.3em] font-mono">Zero_Nodes_Match_Parameters</p>
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
                            <div className="p-8 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-200 dark:bg-white/5 rounded-lg border border-transparent dark:border-white/5">
                                        <ClockIcon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none mb-1">Origin_Timestamp</p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-400 font-mono">{new Date(selectedNotif.notification.createdAt).toLocaleString('en-ZM', { dateStyle: 'long', timeStyle: 'medium' })}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full sm:w-auto px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/10"
                                >
                                    Dismiss_Audit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 10px;
                }
                dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.2);
                }
            `}</style>
        </div>
    );
};

export default SuperAdminNotifications;
