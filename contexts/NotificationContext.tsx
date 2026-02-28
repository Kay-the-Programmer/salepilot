import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, getOnlineStatus } from '../services/api';
import SocketService from '../services/socketService';
import { Announcement, User } from '../types';
import { useToast } from './ToastContext';
import { notificationService } from '../services/notificationService';
import { messagingPromise } from '../firebase/firebase';
import { onMessage } from 'firebase/messaging';
import Logo from '../assets/logo.png';

interface NotificationContextType {
    notifications: Announcement[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode; user: User | null }> = ({ children, user }) => {
    const [notifications, setNotifications] = useState<Announcement[]>([]);
    const { showToast } = useToast();

    const knownNotificationIds = React.useRef<Set<string>>(new Set());
    const isInitialLoad = React.useRef(true);

    const fetchNotifications = useCallback(async () => {
        if (!user?.currentStoreId || !user?.token || !getOnlineStatus()) return;
        try {
            const data = await api.get<Announcement[]>(`/notifications/stores/${user.currentStoreId}`);
            const fetchedNotifications = data || [];

            // Identify new unread notifications
            if (!isInitialLoad.current) {
                const newUnread = fetchedNotifications.filter(n =>
                    !n.isRead && !knownNotificationIds.current.has(n.id)
                );

                newUnread.forEach(n => {
                    showToast(n.title, 'info');
                });
            }

            // Update known IDs
            fetchedNotifications.forEach(n => knownNotificationIds.current.add(n.id));

            setNotifications(fetchedNotifications);
            isInitialLoad.current = false;
        } catch (error) {
            console.warn('Failed to fetch notifications:', error);
        }
    }, [user?.currentStoreId, showToast]);

    const markAllAsRead = useCallback(async () => {
        try {
            const unread = notifications.filter(n => !n.isRead);
            if (unread.length === 0) return;
            await Promise.all(unread.map(n => api.patch(`/notifications/${n.id}/read`, {})));
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }, [notifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    // Initial Fetch & Polling — delay first call slightly to avoid racing
    // auth token writes to localStorage on login.
    useEffect(() => {
        if (!user?.token) return; // don't even schedule if not authenticated
        const timer = setTimeout(() => fetchNotifications(), 500);
        const interval = setInterval(fetchNotifications, 30000); // 30s poll
        return () => { clearTimeout(timer); clearInterval(interval); };
    }, [fetchNotifications, user?.token]);

    // Socket Listener
    useEffect(() => {
        if (!user || user.role === 'customer') return;

        const socketService = SocketService.getInstance();
        const socket = socketService.getSocket();

        socket.emit('join_sellers');

        const handleNewRequest = (data: any) => {
            if (data.storeId && user?.currentStoreId && data.storeId !== user.currentStoreId) {
                return;
            }

            showToast(`New Request: ${data.title}`, 'info');

            if (Notification.permission === 'granted') {
                new Notification('New Deal Request', {
                    body: data.title,
                    icon: Logo
                });
            }
            // Refresh to get the new notification item if backend creates one
            fetchNotifications();
        };

        socket.on('new_request', handleNewRequest);
        return () => {
            socket.off('new_request', handleNewRequest);
        };
    }, [user, showToast, fetchNotifications]);

    // FCM Foreground Message Listener
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupFCMForeground = async () => {
            if (!messagingPromise) return;
            const messaging = await messagingPromise;
            if (!messaging) return;

            unsubscribe = onMessage(messaging, (payload) => {
                console.log('[NotificationContext] Foreground message received:', payload);
                const title = payload.notification?.title || 'New Notification';
                const body = payload.notification?.body || '';

                showToast(`${title}: ${body}`, 'info');
                fetchNotifications(); // Refresh hub
            });
        };

        setupFCMForeground();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [showToast, fetchNotifications]);

    // FCM Subscription on Login
    useEffect(() => {
        if (user?.id) {
            notificationService.subscribeUser(user.id).catch(err => {
                console.error('[NotificationContext] FCM Auto-subscription failed:', err);
            });
        }
    }, [user?.id]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications: fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
