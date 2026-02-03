import { api } from './api';

class NotificationService {
    async getVapidPublicKey() {
        try {
            const data = await api.get<{ publicKey: string }>('/push/vapid-public-key');
            return data.publicKey;
        } catch (error) {
            console.error('Failed to get VAPID public key:', error);
            throw error;
        }
    }

    async subscribeUser(userId?: string) {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return null;
        }

        try {
            console.log('Push subscription: checking service worker...');
            const registration = await navigator.serviceWorker.ready;
            console.log('Push subscription: service worker ready');

            // Get public key from server
            const vapidPublicKey = await this.getVapidPublicKey();
            const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

            console.log('Push subscription: requesting browser permission...');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
            console.log('Push subscription: browser subscription obtained');

            // Send subscription to server
            await api.post('/push/subscribe', {
                subscription,
                userId
            }, { skipQueue: true });

            console.log('Push subscription: user subscribed successfully');
            return subscription;
        } catch (error) {
            console.error('Failed to subscribe user:', error);
            // Re-throw so UI can handle it
            throw error;
        }
    }

    async unsubscribeUser() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Notify server
                await api.post('/push/unsubscribe', {
                    endpoint: subscription.endpoint
                }, { skipQueue: true });

                console.log('User unsubscribed from push notifications');
            }
        } catch (error) {
            console.error('Failed to unsubscribe user:', error);
            throw error;
        }
    }

    async getSubscriptionStatus() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false;
        }

        try {
            // Use a timeout for .ready to avoid hanging if SW is broken
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<null>((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 3000))
            ]);

            if (!registration) return false;

            const subscription = await registration.pushManager.getSubscription();
            return !!subscription;
        } catch (error) {
            console.warn('Failed to get subscription status:', error);
            return false;
        }
    }

    private urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

export const notificationService = new NotificationService();
