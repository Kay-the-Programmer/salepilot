/**
 * services/firebase/auth.ts
 *
 * Central Firebase Auth helpers for SalePilot.
 * Wraps sign-in, sign-out, password reset, and token management so the
 * rest of the app never imports firebase/auth directly.
 */
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    sendPasswordResetEmail,
    getIdToken,
    getIdTokenResult,
    IdTokenResult,
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/firebase';

// Re-export so consumers don't need to import from the config file
export { auth, googleProvider };

// ─────────────────────────────────────────────────────────────────────────────
// Google Sign-In
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Opens a Google sign-in popup and returns the Firebase user.
 * After calling this you still need to exchange the ID token with your backend
 * via authService.loginWithGoogle() to get the app-level session.
 */
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
    if (!auth) throw new Error('Firebase Auth is not configured.');
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
};

// ─────────────────────────────────────────────────────────────────────────────
// Sign-out  (signs out of BOTH Firebase and the app session)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Signs the user out of Firebase Auth.
 * Call this alongside authService.logout() so both sessions are cleared.
 */
export const firebaseSignOut = async (): Promise<void> => {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (e) {
        console.warn('[Firebase] Sign-out error (non-fatal):', e);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Token management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a fresh Firebase ID token for the currently signed-in user, or null.
 * Pass `forceRefresh = true` if you know the token may be close to expiry.
 */
export const getFirebaseIdToken = async (forceRefresh = false): Promise<string | null> => {
    const user = auth?.currentUser;
    if (!user) return null;
    try {
        return await getIdToken(user, forceRefresh);
    } catch (e) {
        console.warn('[Firebase] Failed to get ID token:', e);
        return null;
    }
};

/**
 * Returns the full decoded ID token result (includes custom claims, expiry, etc.)
 */
export const getFirebaseTokenResult = async (forceRefresh = false): Promise<IdTokenResult | null> => {
    const user = auth?.currentUser;
    if (!user) return null;
    try {
        return await getIdTokenResult(user, forceRefresh);
    } catch (e) {
        console.warn('[Firebase] Failed to get token result:', e);
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth state observer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribes to Firebase Auth state changes.
 * Returns an unsubscribe function — call it in a useEffect cleanup.
 *
 * @example
 * useEffect(() => {
 *   const unsub = subscribeToAuthState((user) => { ... });
 *   return unsub;
 * }, []);
 */
export const subscribeToAuthState = (
    callback: (user: FirebaseUser | null) => void
): (() => void) => {
    if (!auth) return () => { };
    return onAuthStateChanged(auth, callback);
};

// ─────────────────────────────────────────────────────────────────────────────
// Password reset
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends a Firebase password-reset e-mail.
 * Works independently of the backend (uses Firebase's built-in email flow).
 */
export const sendResetEmail = async (email: string): Promise<void> => {
    if (!auth) throw new Error('Firebase Auth is not configured.');
    await sendPasswordResetEmail(auth, email);
};

// ─────────────────────────────────────────────────────────────────────────────
// Current Firebase user (synchronous)
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the currently signed-in Firebase user (or null if not signed in). */
export const getFirebaseUser = (): FirebaseUser | null => auth?.currentUser ?? null;
