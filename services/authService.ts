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
import { api, API_BASE_URL, cookieSessionWorks, getCsrfHeader } from './api';
import { firebaseSignOut } from './firebase/auth';

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
    isVerified: u.isVerified ?? u.is_verified ?? false,
    subscriptionStatus: u.subscriptionStatus || u.subscription_status,
    subscriptionEndsAt: u.subscriptionEndsAt || u.subscription_ends_at,
    subscriptionPlan: u.subscriptionPlan || u.subscription_plan,
    onboardingState: u.onboardingState || u.onboarding_state,
    referralCode: u.referralCode || u.referral_code,
    discountBalance: u.discountBalance || u.discount_balance,
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

/** Persist the active business on the stored session (keeps the JWT intact). */
export const setStoredCurrentStore = (storeId: string): User | null => updateStoredUser({ currentStoreId: storeId });

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Store the session — without the JWT when the cookie can carry it.
 *
 * Signing in also sets an httpOnly session cookie. Where that cookie reaches
 * the API, keeping the token in localStorage is pure downside: it is the copy
 * an XSS can read, and nothing needs it. So we check whether the cookie alone
 * authenticates and, if it does, store the user with the token stripped.
 *
 * It is a probe rather than an assumption because the answer depends on the
 * deployment: the cookie is same-site on salepilot.space but cross-site from a
 * *.vercel.app origin, where it is not sent at all. Falling back to the stored
 * token there keeps those origins working instead of locking them out.
 */
const persistSession = async (normalized: User): Promise<User> => {
    let session = normalized;
    if (await cookieSessionWorks()) {
        const { token, ...withoutToken } = normalized as User & { token?: string };
        session = withoutToken as User;
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
    return session;
};

/** Email / password login → backend JWT */
export const login = async (email: string, password?: string): Promise<User> => {
    const user = await api.post<User>('/auth/login', { email, password });
    const normalized = normalizeUser(user);
    if (normalized?.token) {
        return persistSession(normalized);
    }
    throw new Error('Login failed: No user data or token returned.');
};

/** New business account registration */
export const register = async (name: string, email: string, password?: string, referralCode?: string): Promise<User> => {
    const u = await api.post<User>('/auth/register', { name, email, password, referralCode });
    return normalizeUser(u);
};

/** Customer self-registration */
export const registerCustomer = async (name: string, email: string, password?: string, referralCode?: string): Promise<User> => {
    const u = await api.post<User>('/auth/register-customer', { name, email, password, referralCode });
    const normalized = normalizeUser(u);
    if (normalized?.token) {
        return persistSession(normalized);
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
        return persistSession(normalized);
    }
    throw new Error('Google Login failed: No user data returned.');
};

/**
 * Clears the local session.
 * Also signs out of Firebase Auth so the Google popup resets properly.
 */
export const logout = (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
    // The session cookie is httpOnly, so the client cannot delete it — only the
    // server can, and it has to be asked. Without this, "log out" would clear
    // the local copy while leaving a usable 30-day cookie in the browser.
    //
    // `keepalive` so the request still completes if this is the last thing
    // before a navigation, which logging out usually is. Kept synchronous and
    // fire-and-forget because every caller treats logout as instant, and the
    // local session is already gone either way.
    clearServerSession();
    // Fire-and-forget: sign out of Firebase too so the Google session is cleared
    firebaseSignOut().catch(() => { });
};

/**
 * Ask the server to clear the session cookies. `/auth/logout` is deliberately
 * unauthenticated — clearing a cookie you already hold proves nothing — and
 * CSRF-exempt, so an expired session can still tidy up after itself.
 */
const clearServerSession = (): void => {
    try {
        void fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: getCsrfHeader(),
            keepalive: true,
        }).catch(() => { });
    } catch (_) { /* never let signing out fail on this */ }
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
 * Sends a password-reset email via the backend.
 * This ensures the reset link is sent to users regardless of whether they
 * were created via Firebase or the custom backend flow.
 */
export const forgotPassword = async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
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

export const changePassword = async (passwordData: {
    currentPassword: string;
    newPassword: string;
}): Promise<void> => {
    // Changing the password now ends every other session for the account, so
    // the server hands back a reissued token for THIS device. Persist it or the
    // next request goes out with a token the server has just invalidated and
    // the user is bounced to the login screen for changing their own password.
    const res = await api.post<{ token?: string }>('/auth/change-password', passwordData);
    if (res?.token) {
        updateStoredUser({ token: res.token });
    }
};

/**
 * Ends every session for this account, this device included — the control to
 * use after losing a phone or a till. The caller must then sign in again, so
 * clear the local session rather than leaving a token the server has dropped.
 */
export const signOutEverywhere = async (): Promise<void> => {
    try {
        await api.post('/auth/sign-out-everywhere');
    } finally {
        logout();
    }
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
