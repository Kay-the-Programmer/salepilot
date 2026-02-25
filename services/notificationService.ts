import { api } from './api';
import { messagingPromise } from '../firebase/firebase';
import { getToken, deleteToken } from 'firebase/messaging';

class NotificationService {
    async subscribeUser(userId?: string) {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return null;
        }

        if (!messagingPromise) {
            console.warn('Firebase Messaging is not supported or initialized');
            return null;
        }

        try {
            const messaging = await messagingPromise;
            if (!messaging) return null;

            console.log('Push subscription: checking service worker...');
            const registration = await navigator.serviceWorker.ready;
            console.log('Push subscription: service worker ready');

            console.log('Push subscription: requesting FCM token...');
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

            if (!vapidKey) {
                console.warn('VITE_FIREBASE_VAPID_KEY is not defined in .env');
            }

            const currentToken = await getToken(messaging, {
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
                console.log('Push subscription: browser subscription obtained');

                // Send subscription to server
                await api.post('/push/subscribe', {
                    subscription: currentToken,
                    userId
                }, { skipQueue: true });

                console.log('Push subscription: user subscribed successfully');
                return currentToken;
            } else {
                console.log('No registration token available. Request permission to generate one.');
                return null;
            }
        } catch (error) {
            console.error('Failed to subscribe user:', error);
            throw error;
        }
    }

    async unsubscribeUser() {
        if (!messagingPromise) return;

        try {
            const messaging = await messagingPromise;
            if (!messaging) return;

            const hasDeleted = await deleteToken(messaging);

            if (hasDeleted) {
                console.log('User unsubscribed from push notifications (FCM token deleted)');
            }
        } catch (error) {
            console.error('Failed to unsubscribe user:', error);
            throw error;
        }
    }

    async getSubscriptionStatus() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !messagingPromise) {
            return false;
        }

        try {
            if (Notification.permission === 'granted') {
                return true;
            }
            return false;
        } catch (error) {
            console.warn('Failed to get subscription status:', error);
            return false;
        }
    }
}

export const notificationService = new NotificationService();
