import { api } from './api';
import { User } from '../types';

export type RegisterStoreResponse = {
  store: { id: string; name: string; createdAt: string };
};

/**
 * Registers a new store for the current authenticated user.
 * Backend will promote user to admin and set current_store_id.
 * After registration, we fetch /auth/me to get the refreshed user with currentStoreId.
 */
export async function registerStoreAndRefreshUser(name: string, businessTypes: string[] = [], phone?: string, address?: string): Promise<{ store: RegisterStoreResponse['store']; user: User }> {
  if (!name || name.trim().length < 2) {
    throw new Error('Please provide a valid store name (min 2 characters).');
  }
  const resp = await api.post<RegisterStoreResponse>('/stores/register', { name: name.trim(), businessTypes, phone, address }, { skipQueue: true });
  // Store registration cannot be completed offline
  if ((resp as any)?.offline) {
    throw new Error('Cannot create a store while offline. Please connect to the internet and try again.');
  }
  const store = (resp as RegisterStoreResponse).store || (resp as any)?.store;
  if (!store) {
    throw new Error('Store registration failed.');
  }
  const user = await api.get<User>('/auth/me');
  return { store, user };
}

/**
 * Checks if a store name is already taken.
 */
export async function checkStoreNameAvailability(name: string): Promise<boolean> {
  if (!name || name.trim().length < 2) return true;
  const resp = await api.get<{ exists: boolean }>(`/stores/check-name?name=${encodeURIComponent(name.trim())}`);
  return !(resp as any)?.exists;
}

/** A business owned by the current user (Multi-Store Manager). */
export interface MyStore {
  id: string;
  name: string;
  status: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionEndsAt?: string | null;
  isVerified?: boolean;
  createdAt: string;
  isCurrent: boolean;
}

/** Every business the signed-in user owns. */
export async function getMyStores(): Promise<MyStore[]> {
  const resp = await api.get<MyStore[]>('/stores/mine');
  return Array.isArray(resp) ? resp : [];
}

/** Per-business KPIs for the Business Manager portfolio dashboard. */
export interface MyStoreSummary extends MyStore {
  revenue: number;
  prevRevenue: number;
  transactions: number;
  productsCount: number;
  lowStockCount: number;
  inventoryValue: number;
  customersCount: number;
  usersCount: number;
  trend: { date: string; revenue: number }[];
}

export interface MyStoresSummary {
  days: number;
  stores: MyStoreSummary[];
  totals: {
    revenue: number;
    prevRevenue: number;
    transactions: number;
    productsCount: number;
    lowStockCount: number;
    inventoryValue: number;
    customersCount: number;
    usersCount: number;
  } | null;
}

/** Portfolio KPIs + daily revenue trend for every business the user owns. */
export async function getMyStoresSummary(days: number): Promise<MyStoresSummary> {
  return api.get<MyStoresSummary>(`/stores/mine/summary?days=${days}`);
}

/** Switch the active business (only among owned stores); returns the refreshed user. */
export async function switchStore(storeId: string): Promise<User> {
  await api.post('/stores/switch', { storeId }, { skipQueue: true });
  return api.get<User>('/auth/me');
}

