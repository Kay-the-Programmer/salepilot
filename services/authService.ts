/**
 * services/authService.ts
 *
 * Handles all user-facing authentication flows for SalePilot.
 * Works in conjunction with Firebase Auth for Google Sign-In and token management.
 *
 * Flow for Google login:
 *   1. signInWithGoogle() → Firebase popup → FirebaseUser
 *   2. firebaseUser.getIdToken() → ID token string
 *   3. loginWithGoogle(idToken) → backend /auth/google → our app User + JWT
 *
 * The app JWT (stored in localStorage) is used for every API call.
 * Firebase Auth is used for Google sign-in and password-reset emails only.
 */
import { User } from '../types';
import { api } from './api';
import { sendResetEmail, firebaseSignOut } from './firebase/auth';

const CURRENT_USER_KEY = 'salePilotUser';

// ─── Private helpers ──────────────────────────────────────────────────────────

const normalizeRole = (role: any): User['role'] => {
    const r = String(role || '').toLowerCase().trim();
    if (['superadmin', 'super-user', 'super_user', 'superuser', 'owner', 'root'].includes(r)) return 'superadmin';
    if (['admin', 'administrator'].includes(r)) return 'admin';
    if (['inventory_manager', 'inventory-manager', 'inventory manager'].includes(r)) return 'inventory_manager';
    if (['customer', 'user', 'client'].includes(r)) return 'customer';
    // default to staff when unknown to avoid granting unintended privileges
    if (!['superadmin', 'admin', 'staff', 'inventory_manager', 'customer'].includes(r)) return 'staff';
    return r as User['role'];
};

const normalizeUser = (u: any): User => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: normalizeRole(u.role),
    token: u.token,
    currentStoreId: u.currentStoreId || u.current_store_id,
    profilePicture: u.profilePicture || u.profile_picture,
    isVerified: u.isVerified || u.is_verified,
    subscriptionStatus: u.subscriptionStatus || u.subscription_status,
    subscriptionEndsAt: u.subscriptionEndsAt || u.subscription_ends_at,
    subscriptionPlan: u.subscriptionPlan || u.subscription_plan,
    onboardingState: u.onboardingState || u.onboarding_state,
});

const updateStoredUser = (updatedFields: Partial<User>): User | null => {
    const user = getCurrentUser();
    if (user) {
        const newUser = { ...user, ...updatedFields };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
        return newUser;
    }
    return null;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Email / password login → backend JWT */
export const login = async (email: string, password?: string): Promise<User> => {
    const user = await api.post<User>('/auth/login', { email, password });
    const normalized = normalizeUser(user);
    if (normalized?.token) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
        return normalized;
    }
    throw new Error('Login failed: No user data or token returned.');
};

/** New business account registration */
export const register = async (name: string, email: string, password?: string): Promise<User> => {
    const u = await api.post<User>('/auth/register', { name, email, password });
    return normalizeUser(u);
};

/** Customer self-registration */
export const registerCustomer = async (name: string, email: string, password?: string): Promise<User> => {
    const u = await api.post<User>('/auth/register-customer', { name, email, password });
    const normalized = normalizeUser(u);
    if (normalized?.token) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
    }
    return normalized;
};

/**
 * Exchanges a Firebase ID token for an app-level session.
 * Called after signInWithGoogle() on the frontend.
 *
 * @param idToken  - Firebase ID token from firebaseUser.getIdToken()
 * @param role     - Hint for first-time users ('business' | 'customer')
 */
export const loginWithGoogle = async (
    idToken: string,
    role?: 'business' | 'customer'
): Promise<User> => {
    const user = await api.post<User>('/auth/google', { idToken, role });
    const normalized = normalizeUser(user);
    if (normalized?.token) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
        return normalized;
    }
    throw new Error('Google Login failed: No user data returned.');
};

/**
 * Clears the local session.
 * Also signs out of Firebase Auth so the Google popup resets properly.
 */
export const logout = (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
    // Fire-and-forget: sign out of Firebase too so the Google session is cleared
    firebaseSignOut().catch(() => { });
};

/** Returns the currently stored user from localStorage (synchronous). */
export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    try {
        const raw = JSON.parse(userJson);
        return normalizeUser(raw);
    } catch {
        console.error('[authService] Failed to parse user from localStorage');
        return null;
    }
};

/**
 * Sends a Firebase-powered password-reset email.
 * Uses Firebase directly — no backend call needed.
 */
export const forgotPassword = async (email: string): Promise<void> => {
    await sendResetEmail(email);
};

export const verifyRegistration = async (email: string, emailOtp: string): Promise<void> => {
    await api.post('/auth/verify-registration', { email, emailOtp });
};

export const getUsers = async (): Promise<User[]> => {
    const list = await api.get<any[]>('/users');
    return (list || []).map(normalizeUser);
};

export const saveUser = (user: Omit<User, 'id'>, id?: string): Promise<User> => {
    if (id) {
        const currentUser = getCurrentUser();
        if (currentUser?.id === id) {
            updateStoredUser(user);
        }
        return api.put<User>(`/users/${id}`, user) as Promise<any>;
    }
    return api.post<User>('/users', user) as Promise<any>;
};

export const deleteUser = (userId: string): Promise<void> => {
    return api.delete<void>(`/users/${userId}`);
};

/** Verifies the current session against the backend (refreshes user data). */
export const verifySession = async (): Promise<User> => {
    const u = await api.get<User>('/auth/me');
    return normalizeUser(u);
};

export const changePassword = (passwordData: {
    currentPassword: string;
    newPassword: string;
}): Promise<void> => {
    return api.post('/auth/change-password', passwordData);
};

export const verifyEmail = async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token });
};

export const resendVerificationEmail = async (email?: string): Promise<void> => {
    await api.post('/auth/resend-verification', { email });
};

export const resetPassword = async (
    token: string,
    newPassword: string
): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
};
