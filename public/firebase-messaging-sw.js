// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
    apiKey: "AIzaSyBqcS-rap5P5jRl7nhfdESKWEJtZb4Zy8c",
    authDomain: "salepilot-ae09f.firebaseapp.com",
    projectId: "salepilot-ae09f",
    storageBucket: "salepilot-ae09f.firebasestorage.app",
    messagingSenderId: "980903093215",
    appId: "1:980903093215:web:2c821c0758a9ec70335a6a",
    measurementId: "G-2885SSEE1Y"
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage((rawData) => {
    console.log('[firebase-messaging-sw.js] Received background message ', rawData);

    let payload = {
        title: 'SalePilot Notification',
        body: 'You have a new message.',
        icon: '/images/salepilot.png',
        data: { url: '/' }
    };

    // Handle FCM format (nested notification object) or direct format
    const notification = rawData.notification || rawData;
    const data = rawData.data || rawData;

    payload.title = notification.title || payload.title;
    payload.body = notification.body || notification.message || payload.body;
    payload.icon = notification.icon || notification.imageUrl || payload.icon;
    payload.data = {
        ...payload.data,
        ...data
    };

    if (notification.actions) {
        payload.actions = notification.actions;
    }

    const notificationOptions = {
        body: payload.body,
        icon: payload.icon,
        badge: '/images/salepilot.png',
        data: payload.data,
        vibrate: [100, 50, 100],
        actions: payload.actions || []
    };

    return self.registration.showNotification(payload.title, notificationOptions);
});
