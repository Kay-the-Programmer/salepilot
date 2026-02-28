/**
 * firebase/firebase.ts
 *
 * Single source of truth for all Firebase SDK initialization.
 * Supersedes the old firebase/firebase.js and services/firebase/config.ts.
 *
 * Services initialised here:
 *  - Firebase App
 *  - Firebase Auth  (with Google provider)
 *  - Firebase App Check (reCAPTCHA v3 in prod, debug provider in dev)
 *  - Firebase Analytics (optional, best-effort)
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getMessaging, Messaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import {
    initializeAppCheck,
    ReCaptchaV3Provider,
    AppCheck,
} from 'firebase/app-check';

// ─── Firebase project config ─────────────────────────────────────────────────
// Values come from `.env` (VITE_FIREBASE_*). The hard-coded strings are
// safe-to-commit public identifiers, not secrets.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBqcS-rap5P5jRl7nhfdESKWEJtZb4Zy8c',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'salepilot-ae09f.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'salepilot-ae09f',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'salepilot-ae09f.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '980903093215',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:980903093215:web:2c821c0758a9ec70335a6a',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-2885SSEE1Y',
};

// ─── Initialize Firebase (guard against HMR double-init) ─────────────────────
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─── Auth ─────────────────────────────────────────────────────────────────────
const auth: Auth = getAuth(app);

// ─── Google Auth Provider ──────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
// Always show account picker so users can switch accounts
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('profile');
googleProvider.addScope('email');

// ─── App Check (reCAPTCHA v3) ──────────────────────────────────────────────────
//
// App Check validates that requests originate from THIS app, protecting your
// backend APIs from abuse. When enabled, each request carries a short-lived
// App Check token that your Express backend can verify with the Firebase Admin SDK.
//
// SETUP STEPS:
//   1. Firebase Console → App Check → Register your web app with reCAPTCHA v3
//   2. Add: VITE_RECAPTCHA_SITE_KEY=<your-site-key> to .env
//   3. On your Express backend, verify the X-Firebase-AppCheck header using
//      the Admin SDK (see https://firebase.google.com/docs/app-check/custom-resource-backend)
//
// In development (VITE_APPCHECK_DEBUG=true or DEV mode), a debug token is used.
// Register that debug token at Firebase Console → App Check → Manage debug tokens.
let appCheck: AppCheck | undefined;
try {
    const forceDebug = import.meta.env.VITE_APPCHECK_DEBUG === 'true';
    const reCaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    if (forceDebug) {
        // Debug mode: Firebase generates a token you register in the Console
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        // Use the test key (always passes) in debug mode when no real key is available
        appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(
                reCaptchaSiteKey ?? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
            ),
            isTokenAutoRefreshEnabled: true,
        });
        console.info(
            '[Firebase] App Check running in DEBUG mode. ' +
            'Register the debug token at Firebase Console → App Check → Manage debug tokens.'
        );
    } else if (reCaptchaSiteKey) {
        // Production: real reCAPTCHA v3 enforcement
        appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(reCaptchaSiteKey),
            isTokenAutoRefreshEnabled: true,
        });
    } else {
        console.info('[Firebase] App Check is DISABLED (no VITE_RECAPTCHA_SITE_KEY found).');
    }
} catch (e) {
    console.warn('[Firebase] App Check initialization failed (non-fatal):', e);
}

// ─── Analytics (best-effort – may be blocked by ad-blockers) ──────────────────
let analytics: Analytics | undefined;
try {
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
    }
} catch (e) {
    console.warn('[Firebase] Analytics failed to initialize:', e);
}

// ─── Messaging ───────────────────────────────────────────────────────────────
let messagingPromise: Promise<Messaging | null> | undefined;

if (typeof window !== 'undefined') {
    messagingPromise = isMessagingSupported().then((supported) => {
        if (supported) {
            return getMessaging(app);
        }
        console.warn('[Firebase] Messaging not supported by this browser.');
        return null;
    }).catch(e => {
        console.error('[Firebase] Messaging initialization failed:', e);
        return null;
    });
}

export { app, auth, googleProvider, appCheck, analytics, messagingPromise };
