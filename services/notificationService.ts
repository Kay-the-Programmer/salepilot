
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class NotificationService {
    async getVapidPublicKey() {
        const response = await fetch(`${API_URL}/push/vapid-public-key`);
        const data = await response.json();
        return data.publicKey;
    }

    async subscribeUser(userId?: string) {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Get public key from server
            const vapidPublicKey = await this.getVapidPublicKey();
            const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });

            // Send subscription to server
            await fetch(`${API_URL}/push/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription,
                    userId
                })
            });

            console.log('User subscribed to push notifications');
            return subscription;
        } catch (error) {
            console.error('Failed to subscribe user:', error);
            return null;
        }
    }

    async unsubscribeUser() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Notify server
                await fetch(`${API_URL}/push/unsubscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint
                    })
                });

                console.log('User unsubscribed from push notifications');
            }
        } catch (error) {
            console.error('Failed to unsubscribe user:', error);
        }
    }

    async getSubscriptionStatus() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return !!subscription;
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
