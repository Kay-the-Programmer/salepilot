import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, getOnlineStatus } from '../services/api';
import SocketService from '../services/socketService';
import { Announcement, User } from '../types';
import { useToast } from './ToastContext';
import Logo from '../assets/logo.png'; // Make sure this path is correct relative to this file

interface NotificationContextType {
    notifications: Announcement[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode; user: User | null }> = ({ children, user }) => {
    const [notifications, setNotifications] = useState<Announcement[]>([]);
    const { showToast } = useToast();

    const knownNotificationIds = React.useRef<Set<string>>(new Set());
    const isInitialLoad = React.useRef(true);

    const fetchNotifications = useCallback(async () => {
        if (!user?.currentStoreId || !getOnlineStatus()) return;
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

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    // Initial Fetch & Polling
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // 30s poll
        return () => clearInterval(interval);
    }, [fetchNotifications]);

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

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, refreshNotifications: fetchNotifications }}>
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
