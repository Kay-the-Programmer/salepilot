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
export async function registerStoreAndRefreshUser(name: string, businessTypes: string[] = []): Promise<{ store: RegisterStoreResponse['store']; user: User }> {
  if (!name || name.trim().length < 2) {
    throw new Error('Please provide a valid store name (min 2 characters).');
  }
  const resp = await api.post<RegisterStoreResponse>('/stores/register', { name: name.trim(), businessTypes }, { skipQueue: true });
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
