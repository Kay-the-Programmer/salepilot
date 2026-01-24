import { dbService } from './dbService';

// Determine API base URL
// Priority:
// 1. Runtime override (window.__API_URL) - useful for containerized builds
// 2. Build-time environment variable (VITE_API_URL) - standard for Vercel/CI
// 3. Dev fallback (localhost)
const LOCAL_BACKEND = 'http://localhost:5000/api';
const ENV_BASE = import.meta.env.VITE_API_URL;

// Optional runtime override: window.__API_URL or <meta name="app:apiUrl" content="...">
const RUNTIME_BASE = (typeof window !== 'undefined' && (window as any).__API_URL) ||
  (typeof document !== 'undefined' ? document.querySelector('meta[name="app:apiUrl"]')?.getAttribute('content') || undefined : undefined);

// Ensure BASE_URL is set. If VITE_API_URL is provided, use it; otherwise fallback to localhost (dev).
// Ensure BASE_URL is set. If VITE_API_URL is provided, use it; otherwise fallback to localhost (dev).
// NOTE: VITE_API_URL should define the full path to api, e.g. "https://backend.com/api"
// AUTO-FIX: We now enforce the /api suffix if it's missing, to avoid 404s when user only provides the domain.
let rawBase = (RUNTIME_BASE || ENV_BASE || LOCAL_BACKEND).replace(/\/+$/, '');
if (!rawBase.endsWith('/api')) {
  rawBase += '/api';
}
const BASE_URL = rawBase;

// Storage key used by authService
const CURRENT_USER_KEY = 'salePilotUser';

// Online status helpers
export const getOnlineStatus = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

// Bridge native online/offline to a custom event used in App
if (typeof window !== 'undefined') {
  const dispatchStatus = () => window.dispatchEvent(new Event('onlineStatusChange'));
  window.addEventListener('online', dispatchStatus);
  window.addEventListener('offline', dispatchStatus);
}

// Internal helper to get auth header
const getAuthHeaders = (): Record<string, string> => {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return {};
    const user = JSON.parse(raw);
    if (user && user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
  } catch (_) { }
  return {};
};

// Lightweight HTTP error with status and optional payload for better UI handling
export class HttpError extends Error {
  status: number;
  body?: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

// Generic fetch wrapper
async function request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && (init.body as any) instanceof FormData;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  };
  if (!isFormData && !('Content-Type' in headers) && !('content-type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  const resp = await fetch(url, { ...init, headers });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let message = text || `Request failed with status ${resp.status}`;
    let body: any = undefined;
    try {
      body = text ? JSON.parse(text) : undefined;
      if (body && typeof body === 'object' && body.message) {
        message = body.message;
      }
    } catch (_) { }
    throw new HttpError(resp.status, message, body);
  }
  // Try parse JSON, allow empty
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return (await resp.json()) as T;
  }
  // @ts-ignore - for endpoints that return nothing
  return undefined as T;
}

// When offline or network fails during a mutation, enqueue and return an offline marker
// Serialize RequestInit for IndexedDB-safe storage (FormData is not cloneable)
function serializeOptionsForQueue(options: RequestInit): any {
  const out: any = { method: options.method };
  if (options.headers) out.headers = options.headers;
  const body: any = (options as any).body;
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const entries: any[] = [];
    body.forEach((value, key) => {
      if (value instanceof Blob) {
        // Keep Blob/File as is (structured clone supports it); preserve filename if present
        const file: any = value as any;
        entries.push({ k: key, t: 'blob', v: value, n: file.name || undefined, m: value.type || undefined });
      } else {
        entries.push({ k: key, t: 'string', v: String(value) });
      }
    });
    out.body = { _form: true, entries };
  } else if (typeof body === 'string') {
    out.body = body; // JSON string
  } else if (body != null) {
    try {
      out.body = JSON.stringify(body);
    } catch {
      out.body = String(body);
    }
  }
  return out;
}

async function queueAndReturn<T>(endpoint: string, options: RequestInit, bodyEcho?: any): Promise<T & { offline: true }> {
  const serialized = serializeOptionsForQueue(options);
  await dbService.addMutationToQueue(endpoint, serialized);
  const echo: any = bodyEcho && typeof bodyEcho === 'object' ? { ...bodyEcho } : {};
  echo.offline = true;
  return echo as T & { offline: true };
}
export function buildAssetUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const backendBase = BASE_URL.replace(/\/?api$/i, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${path}`;
}

/**
 * Optimistically apply a mutation to the local IndexedDB cache.
 * This ensures the UI is updated immediately even when offline.
 */
async function applyOptimisticUpdate(endpoint: string, method: string, body: any): Promise<string | undefined> {
  const storeName = ENDPOINT_TO_STORE[endpoint.split('?')[0]];
  if (!storeName) return;

  try {
    if (method === 'POST') {
      const tempId = body.id || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const item = { ...body, id: tempId, _pending: true };
      await dbService.put(storeName, item);
      return tempId;
    } else if (method === 'PUT' || method === 'PATCH') {
      if (body.id) {
        const existing = await dbService.get<any>(storeName, body.id);
        await dbService.put(storeName, { ...existing, ...body, _pending: true });
      }
    } else if (method === 'DELETE') {
      // For delete, we might want to hide it rather than actually delete if it's pending sync
      // but for now, let's just delete it from cache
      const entityId = endpoint.split('/').pop();
      if (entityId) {
        // We can't easily "undo" this if sync fails, but better than nothing.
        // Actually, maybe add _deleted flag?
        const existing = await dbService.get<any>(storeName, entityId);
        if (existing) {
          await dbService.put(storeName, { ...existing, _deleted: true, _pending: true });
        }
      }
    }
  } catch (err) {
    console.warn('Optimistic update failed:', err);
  }
}

// Mapping of API endpoints to IndexedDB stores for automatic caching
const ENDPOINT_TO_STORE: Record<string, string> = {
  '/products': 'products',
  '/categories': 'categories',
  '/customers': 'customers',
  '/suppliers': 'suppliers',
  '/sales': 'sales',
  '/purchase-orders': 'purchaseOrders',
  '/accounting/accounts': 'accounts',
  '/accounting/journal-entries': 'journalEntries',
  '/accounting/supplier-invoices': 'supplierInvoices',
  '/users': 'users',
  '/returns': 'returns',
  '/audit': 'auditLogs',
  '/settings': 'settings',
  '/shop/stores': 'marketStores',
  '/shop/global-products': 'marketProducts',
  '/marketplace/requests/recent': 'marketRequests',
  '/logistics/couriers': 'couriers',
  '/logistics/shipments': 'shipments'
};

export const api = {
  async get<T>(endpoint: string, options: { useCache?: boolean; store?: string } = {}): Promise<T> {
    const isOnline = getOnlineStatus();
    const cacheStore = options.store || ENDPOINT_TO_STORE[endpoint.split('?')[0]];

    if (!isOnline && cacheStore) {
      console.log(`Offline: loading ${endpoint} from cache store ${cacheStore}`);
      if (cacheStore === 'settings') {
        const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
        const settings = await dbService.get<T>('settings', currentUser?.currentStoreId || 'default');
        if (settings) return settings;
      } else {
        const cached = await dbService.getAll<any>(cacheStore);
        if (cached && cached.length > 0) return cached as unknown as T;
      }
    }

    try {
      const data = await request<T>(endpoint, { method: 'GET' });

      // Background update cache if we have a match
      if (cacheStore && data) {
        if (cacheStore === 'settings') {
          const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
          dbService.put('settings', data, currentUser?.currentStoreId || 'default');
        } else if (Array.isArray(data)) {
          dbService.bulkPut(cacheStore, data);
        }
      }

      return data;
    } catch (err) {
      // If network request fails but we have cache, fallback
      if (cacheStore) {
        if (cacheStore === 'settings') {
          const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
          const settings = await dbService.get<T>('settings', currentUser?.currentStoreId || 'default');
          if (settings) return settings;
        } else {
          const cached = await dbService.getAll<any>(cacheStore);
          if (cached && cached.length > 0) return cached as unknown as T;
        }
      }
      throw err;
    }
  },

  async post<T>(endpoint: string, body?: any, options: { useCache?: boolean; store?: string; skipQueue?: boolean } = {}): Promise<T | (T & { offline: true })> {
    const reqOptions: RequestInit = {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      // For FormData, let the browser set the correct multipart headers
      headers: body instanceof FormData ? getAuthHeaders() : undefined,
    };

    if (!getOnlineStatus()) {
      if (options.skipQueue) {
        throw new Error('No internet connection');
      }
      const tempId = await applyOptimisticUpdate(endpoint, 'POST', body);
      if (tempId) (reqOptions as any)._tempId = tempId;
      return queueAndReturn<T>(endpoint, reqOptions, body);
    }

    try {
      return await request<T>(endpoint, reqOptions);
    } catch (err: any) {
      // Network errors -> queue; server errors should bubble up
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        if (options.skipQueue) throw err;
        return queueAndReturn<T>(endpoint, reqOptions, body);
      }
      throw err;
    }
  },

  async put<T>(endpoint: string, body?: any): Promise<T | (T & { offline: true })> {
    const options: RequestInit = {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      headers: body instanceof FormData ? getAuthHeaders() : undefined,
    };

    if (!getOnlineStatus()) {
      await applyOptimisticUpdate(endpoint, 'PUT', body);
      return queueAndReturn<T>(endpoint, options, body);
    }

    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        return queueAndReturn<T>(endpoint, options, body);
      }
      throw err;
    }
  },

  async patch<T>(endpoint: string, body?: any): Promise<T | (T & { offline: true })> {
    const options: RequestInit = {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      headers: body instanceof FormData ? getAuthHeaders() : undefined,
    };

    if (!getOnlineStatus()) {
      await applyOptimisticUpdate(endpoint, 'PATCH', body);
      return queueAndReturn<T>(endpoint, options, body);
    }

    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        return queueAndReturn<T>(endpoint, options, body);
      }
      throw err;
    }
  },

  async delete<T>(endpoint: string): Promise<T | (T & { offline: true })> {
    const options: RequestInit = { method: 'DELETE' };

    if (!getOnlineStatus()) {
      await applyOptimisticUpdate(endpoint, 'DELETE', {});
      return queueAndReturn<T>(endpoint, options, {});
    }

    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        return queueAndReturn<T>(endpoint, options, {});
      }
      throw err;
    }
  },

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T | (T & { offline: true })> {
    const options: RequestInit = {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(),
    };
    if (!getOnlineStatus()) {
      const obj: any = {};
      formData.forEach((v, k) => { if (!(v instanceof Blob)) obj[k] = v; });
      await applyOptimisticUpdate(endpoint, options.method || 'POST', obj);
      return queueAndReturn<T>(endpoint, options, formData);
    }
    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        return queueAndReturn<T>(endpoint, options, formData);
      }
      throw err;
    }
  },

  async putFormData<T>(endpoint: string, formData: FormData): Promise<T | (T & { offline: true })> {
    const options: RequestInit = {
      method: 'PUT',
      body: formData,
      headers: getAuthHeaders(),
    };
    if (!getOnlineStatus()) {
      const obj: any = {};
      formData.forEach((v, k) => { if (!(v instanceof Blob)) obj[k] = v; });
      await applyOptimisticUpdate(endpoint, options.method || 'POST', obj);
      return queueAndReturn<T>(endpoint, options, formData);
    }
    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        return queueAndReturn<T>(endpoint, options, formData);
      }
      throw err;
    }
  },
};

function reconstructOptions(options: any): RequestInit {
  const init: RequestInit = { method: options.method };
  // Rebuild body
  const body = options.body;
  if (body && body._form && Array.isArray(body.entries)) {
    const fd = new FormData();
    for (const e of body.entries) {
      if (e.t === 'blob' && e.v) {
        try {
          const file = new File([e.v], e.n || 'file', { type: e.m || (e.v && e.v.type) || 'application/octet-stream' });
          fd.append(e.k, file);
        } catch {
          // fallback to append blob directly
          fd.append(e.k, e.v, e.n || 'file');
        }
      } else {
        fd.append(e.k, e.v);
      }
    }
    init.body = fd;
    // For FormData we should not set Content-Type manually; refresh auth header
    init.headers = getAuthHeaders();
  } else if (typeof body === 'string') {
    init.body = body;
    init.headers = { 'Content-Type': 'application/json', ...getAuthHeaders(), ...(options.headers || {}) };
  } else if (body != null) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json', ...getAuthHeaders(), ...(options.headers || {}) };
  } else {
    init.headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  }
  return init;
}

export async function syncOfflineMutations(): Promise<{ succeeded: number; failed: number }> {
  const queued = await dbService.getQueuedMutations();
  const sorted = queued.sort((a, b) => a.timestamp - b.timestamp);

  let succeeded = 0;
  let failed = 0;

  for (const item of sorted) {
    if (item.id == null || item.status === 'syncing') continue;

    try {
      await dbService.markMutationSyncing(item.id);
      const init = reconstructOptions(item.options);
      await request(item.endpoint, init);

      // Cleanup optimistic record if needed
      const tempId = item.options._tempId;
      const storeName = ENDPOINT_TO_STORE[item.endpoint.split('?')[0]];
      if (tempId && storeName) {
        try {
          // Accessing private method getStore for cleanup (internal service use)
          const store = await (dbService as any).getStore(storeName, 'readwrite');
          await store.delete(tempId);
        } catch (err) {
          console.warn('Failed to cleanup optimistic record:', err);
        }
      }

      await dbService.deleteQueuedMutation(item.id);
      succeeded++;
    } catch (e: any) {
      console.error(`Sync failed for ${item.endpoint}:`, e);
      await dbService.markMutationFailed(item.id, e.message || 'Unknown error');
      failed++;

      // If it's a network error, stop syncing for now to avoid multiple errors
      if (e.message?.toLowerCase?.().includes('failed to fetch')) {
        break;
      }
    }
  }

  return { succeeded, failed };
}
