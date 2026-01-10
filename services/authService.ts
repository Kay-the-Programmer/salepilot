import { User } from '../types';
import { api } from './api';

const CURRENT_USER_KEY = 'salePilotUser';

// --- Private Helper ---
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
    currentStoreId: u.currentStoreId,
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


// --- Public API ---

export const login = async (email: string, password?: string): Promise<User> => {
    const user = await api.post<User>('/auth/login', { email, password });
    const normalized = normalizeUser(user);
    if (normalized && normalized.token) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
        return normalized;
    }
    throw new Error('Login failed: No user data or token returned.');
};

export const loginWithGoogle = async (idToken: string, role?: 'business' | 'customer'): Promise<User | { isNewUser: true, email: string, name: string }> => {
    const response = await api.post<User | { isNewUser: true, email: string, name: string }>('/auth/google', { idToken, role });

    // Check if it's a new user response (has isNewUser flag)
    if ('isNewUser' in response && response.isNewUser) {
        return response as { isNewUser: true, email: string, name: string };
    }

    // Otherwise it's a logged in user
    const user = response as User;
    const normalized = normalizeUser(user);
    if (normalized && normalized.token) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
        return normalized;
    }
    throw new Error('Google Login failed: No user data or token returned from backend.');
};

export const register = async (name: string, email: string, password?: string): Promise<User> => {
    const u = await api.post<User>('/auth/register', { name, email, password });
    return normalizeUser(u);
};

export const registerCustomer = async (name: string, email: string, password?: string): Promise<User> => {
    const u = await api.post<User>('/auth/register-customer', { name, email, password });
    const normalized = normalizeUser(u);
    if (normalized && normalized.token) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
        return normalized;
    }
    return normalized;
};

export const loginWithGoogle = async (idToken: string): Promise<User> => {
    const user = await api.post<User>('/auth/google', { idToken: idToken });
    const normalized = normalizeUser(user);
    if (normalized && normalized.token) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
        return normalized;
    }
    throw new Error('Google Login failed: No user data returned.');
};

export const logout = (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;

    try {
        const raw = JSON.parse(userJson);
        return normalizeUser(raw);
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        return null;
    }
};

export const forgotPassword = async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
};

export const getUsers = async (): Promise<User[]> => {
    const list = await api.get<any[]>('/users');
    return (list || []).map(normalizeUser);
};

export const saveUser = (user: Omit<User, 'id'>, id?: string): Promise<User> => {
    if (id) {
        // If we are updating the current user, update localStorage too
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === id) {
            updateStoredUser(user);
        }
        return api.put<User>(`/users/${id}`, user) as Promise<any>;
    }
    return api.post<User>('/users', user) as Promise<any>;
};

export const deleteUser = (userId: string): Promise<void> => {
    return api.delete<void>(`/users/${userId}`);
};

export const verifySession = async (): Promise<User> => {
    const u = await api.get<User>('/auth/me');
    return normalizeUser(u);
};

export const changePassword = (passwordData: { currentPassword: string, newPassword: string }): Promise<void> => {
    return api.post('/auth/change-password', passwordData);
};
