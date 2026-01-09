import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Announcement } from '../types';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';

interface NotificationsPageProps {
    announcements: Announcement[];
    onRefresh?: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ announcements, onRefresh }) => {
    const navigate = useNavigate();
    const [isPushEnabled, setIsPushEnabled] = React.useState(false);
    const [isSupported, setIsSupported] = React.useState(true);

    React.useEffect(() => {
        const checkStatus = async () => {
            const status = await notificationService.getSubscriptionStatus();
            setIsPushEnabled(status);

            const supported = 'serviceWorker' in navigator && 'PushManager' in window;
            setIsSupported(supported);
        };
        checkStatus();
    }, []);

    const togglePush = async () => {
        if (isPushEnabled) {
            await notificationService.unsubscribeUser();
            setIsPushEnabled(false);
        } else {
            const sub = await notificationService.subscribeUser();
            if (sub) {
                setIsPushEnabled(true);
            }
        }
    };

    // Sort by date descending (newest first)
    const sortedAnnouncements = [...announcements].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`, {});
            onRefresh?.();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    return (
        <div className="bg-gray-50 min-h-full font-sans pb-10">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Push Notification Controls */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-lg p-6 text-white mb-8 border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold mb-1">Push Notifications</h2>
                            <p className="text-indigo-100 text-sm opacity-90">
                                {isSupported
                                    ? "Stay updated with real-time alerts even when the app is closed."
                                    : "Push notifications are not supported in your current browser."}
                            </p>
                        </div>
                        {isSupported && (
                            <button
                                onClick={togglePush}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-white/20 ${isPushEnabled ? 'bg-white' : 'bg-white/30'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${isPushEnabled ? 'translate-x-6 bg-indigo-600' : 'translate-x-1 bg-white shadow-sm'}`}
                                />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {sortedAnnouncements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No notifications yet</h3>
                        <p className="text-gray-500 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    sortedAnnouncements.map((announcement) => (
                        <div
                            key={announcement.id}
                            onClick={() => !announcement.isRead && handleMarkAsRead(announcement.id)}
                            className={`bg-white rounded-2xl shadow-sm border p-6 transition-all cursor-pointer relative overflow-hidden ${announcement.isRead ? 'border-gray-200 opacity-75' : 'border-indigo-100 ring-1 ring-indigo-50 shadow-md'}`}
                        >
                            {!announcement.isRead && (
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                            )}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`text-lg font-bold ${announcement.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{announcement.title}</h3>
                                        {!announcement.isRead && (
                                            <span className="px-2 py-0.5 bg-indigo-600 text-[10px] font-bold text-white rounded-full uppercase tracking-wider">New</span>
                                        )}
                                        {announcement.type === 'marketplace' && (
                                            <span className="px-2 py-0.5 bg-amber-100 text-[10px] font-bold text-amber-700 rounded-full uppercase tracking-wider">Marketplace</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mb-4">
                                        {new Date(announcement.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                        {announcement.senderName && ` • from ${announcement.senderName}`}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl ${announcement.isRead ? 'bg-gray-50 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 max-w-none leading-relaxed">
                                <p className="whitespace-pre-wrap">{announcement.message}</p>
                            </div>
                            {announcement.link && (
                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (announcement.link) navigate(announcement.link);
                                        }}
                                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        Take Action
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
