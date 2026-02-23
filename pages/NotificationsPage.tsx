import React from 'react';
import { api } from '../services/api';


const NotificationsPage: React.FC<{
    announcements: import('../types').Announcement[];
    onRefresh: () => Promise<void>;
    userId?: string;
    showSnackbar: (msg: string, type?: any) => void;
}> = ({ announcements = [], onRefresh, userId, showSnackbar }) => {
    const [isPushEnabled, setIsPushEnabled] = React.useState(false);
    const [isSupported, setIsSupported] = React.useState(true);
    const [isPending, setIsPending] = React.useState(false);

    const unreadCount = announcements.filter(n => !n.isRead).length;
    const [selectedNotification, setSelectedNotification] = React.useState<import('../types').Announcement | null>(null);

    React.useEffect(() => {
        const checkStatus = async () => {
            const { notificationService } = await import('../services/notificationService');

            const status = await notificationService.getSubscriptionStatus();
            setIsPushEnabled(status);

            const supported = 'serviceWorker' in navigator && 'PushManager' in window;
            setIsSupported(supported);
        };
        checkStatus();
    }, []);

    const togglePush = async () => {
        if (isPending) return;
        setIsPending(true);
        const { notificationService } = await import('../services/notificationService');
        try {
            if (isPushEnabled) {
                await notificationService.unsubscribeUser();
                setIsPushEnabled(false);
                showSnackbar('Push notifications disabled', 'info');
            } else {
                const sub = await notificationService.subscribeUser(userId);
                if (sub) {
                    setIsPushEnabled(true);
                    showSnackbar('Push notifications enabled!', 'success');
                }
            }
        } catch (error: any) {
            console.error('Push toggle error:', error);
            const msg = error.message || 'Failed to update push settings';
            showSnackbar(msg, 'error');

            // Check if permission was denied
            if (Notification.permission === 'denied') {
                showSnackbar('Notifications are blocked by your browser. Please enable them in site settings.', 'error');
            }
        } finally {
            setIsPending(false);
        }
    };

    // Sort by date descending (newest first)
    const sortedAnnouncements = [...announcements].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await api.patch(`/notifications/${id}/read`, {});
            onRefresh();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unread = announcements.filter(n => !n.isRead);
            await Promise.all(unread.map(n => api.patch(`/notifications/${n.id}/read`, {})));
            onRefresh();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-full font-sans pb-10 transition-colors duration-200">
            {/* Header */}
            <div className="liquid-glass-header dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm transition-colors duration-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Notifications</h1>
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Push Notification Controls */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-violet-900 rounded-2xl shadow-lg p-6 text-white mb-8 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>

                    <div className="relative flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold mb-1">Push Notifications</h2>
                            <p className="text-indigo-100 text-sm opacity-90 max-w-xl">
                                {isSupported
                                    ? "Stay updated with real-time alerts even when the app is closed. We'll notify you about important updates and actions."
                                    : "Push notifications are not supported in your current browser."}
                            </p>
                        </div>
                        {isSupported && (
                            <button
                                onClick={togglePush}
                                disabled={isPending}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ring-2 ring-white/20 shadow-inner ${isPushEnabled ? 'bg-white' : 'bg-black/20'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full transition-transform shadow-md ${isPushEnabled ? 'translate-x-[22px] bg-indigo-600' : 'translate-x-1 bg-white'} ${isPending ? 'animate-pulse' : ''}`}
                                />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-4">
                {sortedAnnouncements.length === 0 ? (
                    <div className="liquid-glass-card rounded-[2rem] flex flex-col items-center justify-center py-20 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 transition-colors duration-200">
                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-full mb-4">
                            <svg className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No notifications yet</h3>
                        <p className="text-gray-500 dark:text-slate-400 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    sortedAnnouncements.map((announcement) => (
                        <div
                            key={announcement.id}
                            onClick={() => {
                                handleMarkAsRead(announcement.id);
                                setSelectedNotification(announcement);
                            }}
                            className={`
                                bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-5 transition-all cursor-pointer relative overflow-hidden group hover:shadow-md dark:hover:shadow-slate-700/50
                                ${announcement.isRead
                                    ? 'border-gray-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                                    : 'border-indigo-100 dark:border-indigo-900/50 ring-1 ring-indigo-50 dark:ring-indigo-900/20 shadow-indigo-100 dark:shadow-none'
                                }
                            `}
                        >
                            {!announcement.isRead && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 dark:bg-indigo-500"></div>
                            )}
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 p-2.5 rounded-xl flex-shrink-0 ${announcement.isRead
                                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400'
                                    : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    }`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-base font-bold truncate ${announcement.isRead ? 'text-gray-700 dark:text-slate-300' : 'text-gray-900 dark:text-white'}`}>
                                                {announcement.title}
                                            </h3>
                                            {!announcement.isRead && (
                                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap ml-2">
                                            {new Date(announcement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className={`text-sm line-clamp-2 ${announcement.isRead ? 'text-gray-500 dark:text-slate-500' : 'text-gray-600 dark:text-slate-400'}`}>
                                        {announcement.message}
                                    </p>

                                    {announcement.link && (
                                        <div className="mt-2 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                            View details
                                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <React.Suspense fallback={null}>
                {selectedNotification && (
                    <NotificationDetailsModalLazied
                        isOpen={!!selectedNotification}
                        onClose={() => setSelectedNotification(null)}
                        notification={selectedNotification}
                        onMarkAsRead={handleMarkAsRead}
                    />
                )}
            </React.Suspense>
        </div>
    );
};

const NotificationDetailsModalLazied = React.lazy(() => import('../components/NotificationDetailsModal'));

export default NotificationsPage;
