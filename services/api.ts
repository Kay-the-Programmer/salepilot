import { dbService, genClientRequestId, STORE_KEY_PATHS } from './dbService';

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

const getDevFallback = () => {
  return LOCAL_BACKEND;
};


// Ensure BASE_URL is set. If VITE_API_URL is provided, use it; otherwise fallback to dev backend.
let rawBase = (RUNTIME_BASE || ENV_BASE || getDevFallback()).replace(/\/+$/, '');
if (!rawBase.endsWith('/api')) {
  rawBase += '/api';
}
const BASE_URL = rawBase;

/** The resolved API base (…/api). Exposed for building absolute backend URLs
 *  such as the WhatsApp webhook callback shown in the connection settings. */
export const API_BASE_URL = BASE_URL;

/**
 * Diagnostic logger for request URLs / endpoints. OFF by default in every
 * environment so the console isn't flooded (and request URLs never leak to end
 * users in production). Opt in while debugging with either:
 *   • `window.__API_DEBUG = true`, or
 *   • `localStorage.setItem('sp_api_debug', '1')`
 * then reload.
 */
const API_DEBUG: boolean = (() => {
  try {
    if (typeof window !== 'undefined' && (window as any).__API_DEBUG) return true;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('sp_api_debug') === '1') return true;
  } catch { /* ignore */ }
  return false;
})();
const devLog = (...args: unknown[]): void => {
  if (API_DEBUG) console.log(...args);
};


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
async function request<T>(endpoint: string, init: RequestInit = {}, idempotencyKey?: string): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && (init.body as any) instanceof FormData;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  };
  // Idempotency key lets the server dedupe a mutation that is retried after an
  // offline queue replay (or a lost response), preventing duplicate sales.
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
  // Dev-only: never logged in production, and never includes the bearer token.
  devLog('[api] Request to', url, '(auth:', headers.Authorization ? 'yes' : 'no', ')');
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
    // Entitlement paywall: a 402 with a `module` means the feature is a locked
    // premium add-on. Broadcast it so a global host can offer an in-context
    // upgrade, then still throw so the calling feature fails gracefully.
    if (resp.status === 402 && body && typeof body === 'object' && body.module && typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('salepilot:paywall', { detail: { module: body.module, message } }));
      } catch (_) { }
    }
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

function entityFromEndpoint(endpoint: string): string | undefined {
  const store = ENDPOINT_TO_STORE[endpoint.split('?')[0]];
  return store ? store.replace(/s$/, '') : undefined; // 'sales' -> 'sale'
}

/**
 * Ask the service worker to replay the queue once connectivity returns — this
 * fires even if the tab is backgrounded or was closed and reopened. The in-app
 * retry timer is the fallback where Background Sync is unsupported (e.g. Safari).
 */
async function requestBackgroundSync(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator &&
        typeof window !== 'undefined' && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register('salepilot-sync-mutations');
    }
  } catch { /* unsupported — covered by the in-app retry timer */ }
}

async function queueAndReturn<T>(
  endpoint: string,
  options: RequestInit,
  bodyEcho?: any,
  meta: { clientRequestId?: string; optimistic?: { store: string; key: any } } = {}
): Promise<T & { offline: true }> {
  const clientRequestId = meta.clientRequestId || genClientRequestId();
  const serialized = serializeOptionsForQueue(options);
  // Persist where the optimistic placeholder lives so a successful replay can
  // remove it precisely (sales are keyed by transactionId, others by id).
  if (meta.optimistic) {
    serialized._optimisticStore = meta.optimistic.store;
    serialized._optimisticKey = meta.optimistic.key;
  }
  await dbService.addMutationToQueue(endpoint, serialized, {
    clientRequestId,
    entity: entityFromEndpoint(endpoint),
  });
  requestBackgroundSync();
  const isForm = typeof FormData !== 'undefined' && bodyEcho instanceof FormData;
  const echo: any = bodyEcho && typeof bodyEcho === 'object' && !isForm ? { ...bodyEcho } : {};
  echo.offline = true;
  echo.clientRequestId = clientRequestId;
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
async function applyOptimisticUpdate(endpoint: string, method: string, body: any): Promise<{ store: string; key: any } | undefined> {
  const storeName = ENDPOINT_TO_STORE[endpoint.split('?')[0]];
  if (!storeName) return;

  // Honour each store's real key path (sales use transactionId) so the optimistic
  // record can be matched and cleaned up after a successful replay.
  const keyPath = STORE_KEY_PATHS[storeName] || 'id';

  try {
    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
    const currentStoreId = currentUser?.currentStoreId;

    if (method === 'POST') {
      const key = body?.[keyPath] || `offline-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const item: any = { ...body, [keyPath]: key, _pending: true };

      // Inject storeId for store-scoped data
      if (currentStoreId && !GLOBAL_IDB_STORES.includes(storeName)) {
        item.storeId = currentStoreId;
      }

      await dbService.put(storeName, item);
      return { store: storeName, key };
    } else if (method === 'PUT' || method === 'PATCH') {
      const key = body?.[keyPath] ?? body?.id;
      if (key != null) {
        const existing = await dbService.get<any>(storeName, key);
        await dbService.put(storeName, { ...existing, ...body, _pending: true });
        return { store: storeName, key };
      }
    } else if (method === 'DELETE') {
      // Tombstone rather than hard-delete so the row can be restored if the
      // replay is permanently rejected.
      const entityId = endpoint.split('/').pop();
      if (entityId) {
        const existing = await dbService.get<any>(storeName, entityId);
        if (existing) {
          await dbService.put(storeName, { ...existing, _deleted: true, _pending: true });
        }
        return { store: storeName, key: entityId };
      }
    }
  } catch (err) {
    console.warn('Optimistic update failed:', err);
  }
  return;
}

// Stores that should not be filtered by storeId (global data)
const GLOBAL_IDB_STORES = ['marketStores', 'marketProducts', 'marketRequests', 'users'];

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
      devLog(`Offline: loading ${endpoint} from cache store ${cacheStore}`);
      if (cacheStore === 'settings') {
        const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
        const settings = await dbService.get<T>('settings', currentUser?.currentStoreId || 'default');
        if (settings) return settings;
      } else {
        let cached = await dbService.getAll<any>(cacheStore);

        // Filter by storeId for store-specific collections
        const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
        const currentStoreId = currentUser?.currentStoreId;

        if (currentStoreId && cached && !GLOBAL_IDB_STORES.includes(cacheStore)) {
          cached = cached.filter(item => item.storeId === currentStoreId);
        }

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
          // Identify current store to tag data
          const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
          const currentStoreId = currentUser?.currentStoreId;

          let dataToCache: any = data;

          // Inject storeId if we are in a specific store context and not a global store
          if (currentStoreId && !GLOBAL_IDB_STORES.includes(cacheStore)) {
            dataToCache = (data as any[]).map(item => ({ ...item, storeId: currentStoreId }));
          }

          dbService.bulkPut(cacheStore, dataToCache);
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
          let cached = await dbService.getAll<any>(cacheStore);

          // Filter by storeId for store-specific collections to avoid mixing data
          // GLOBAL_IDB_STORES are excluded from filtering
          const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
          const currentStoreId = currentUser?.currentStoreId;

          if (currentStoreId && cached && !GLOBAL_IDB_STORES.includes(cacheStore)) {
            cached = cached.filter(item => item.storeId === currentStoreId);
          }

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

    const isAuth = endpoint.includes('/auth/');
    // The idempotency key is only attached when a mutation is REPLAYED from the
    // offline queue (see syncOfflineMutations) — never on the live request. That
    // keeps normal online traffic free of a custom header, so it can't trip a
    // CORS preflight against a backend that hasn't allow-listed
    // x-idempotency-key. Auth requests are never queued, so they carry no key.
    const clientRequestId = isAuth ? undefined : genClientRequestId();

    if (!getOnlineStatus()) {
      if (options.skipQueue || isAuth) {
        throw new Error('No internet connection');
      }
      const optimistic = await applyOptimisticUpdate(endpoint, 'POST', body);
      return queueAndReturn<T>(endpoint, reqOptions, body, { clientRequestId, optimistic });
    }

    try {
      return await request<T>(endpoint, reqOptions);
    } catch (err: any) {
      // Network errors -> queue; server errors should bubble up
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        if (options.skipQueue || isAuth) throw err;
        const optimistic = await applyOptimisticUpdate(endpoint, 'POST', body);
        return queueAndReturn<T>(endpoint, reqOptions, body, { clientRequestId, optimistic });
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
    const clientRequestId = genClientRequestId();

    if (!getOnlineStatus()) {
      const optimistic = await applyOptimisticUpdate(endpoint, 'PUT', body);
      return queueAndReturn<T>(endpoint, options, body, { clientRequestId, optimistic });
    }

    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        const optimistic = await applyOptimisticUpdate(endpoint, 'PUT', body);
        return queueAndReturn<T>(endpoint, options, body, { clientRequestId, optimistic });
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
    const clientRequestId = genClientRequestId();

    if (!getOnlineStatus()) {
      const optimistic = await applyOptimisticUpdate(endpoint, 'PATCH', body);
      return queueAndReturn<T>(endpoint, options, body, { clientRequestId, optimistic });
    }

    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        const optimistic = await applyOptimisticUpdate(endpoint, 'PATCH', body);
        return queueAndReturn<T>(endpoint, options, body, { clientRequestId, optimistic });
      }
      throw err;
    }
  },

  async delete<T>(endpoint: string): Promise<T | (T & { offline: true })> {
    const options: RequestInit = { method: 'DELETE' };
    const clientRequestId = genClientRequestId();

    if (!getOnlineStatus()) {
      const optimistic = await applyOptimisticUpdate(endpoint, 'DELETE', {});
      return queueAndReturn<T>(endpoint, options, {}, { clientRequestId, optimistic });
    }

    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        const optimistic = await applyOptimisticUpdate(endpoint, 'DELETE', {});
        return queueAndReturn<T>(endpoint, options, {}, { clientRequestId, optimistic });
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
    const clientRequestId = genClientRequestId();
    if (!getOnlineStatus()) {
      const obj: any = {};
      formData.forEach((v, k) => { if (!(v instanceof Blob)) obj[k] = v; });
      const optimistic = await applyOptimisticUpdate(endpoint, 'POST', obj);
      return queueAndReturn<T>(endpoint, options, formData, { clientRequestId, optimistic });
    }
    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        const obj: any = {};
        formData.forEach((v, k) => { if (!(v instanceof Blob)) obj[k] = v; });
        const optimistic = await applyOptimisticUpdate(endpoint, 'POST', obj);
        return queueAndReturn<T>(endpoint, options, formData, { clientRequestId, optimistic });
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
    const clientRequestId = genClientRequestId();
    if (!getOnlineStatus()) {
      const obj: any = {};
      formData.forEach((v, k) => { if (!(v instanceof Blob)) obj[k] = v; });
      const optimistic = await applyOptimisticUpdate(endpoint, 'PUT', obj);
      return queueAndReturn<T>(endpoint, options, formData, { clientRequestId, optimistic });
    }
    try {
      return await request<T>(endpoint, options);
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('failed to fetch')) {
        const obj: any = {};
        formData.forEach((v, k) => { if (!(v instanceof Blob)) obj[k] = v; });
        const optimistic = await applyOptimisticUpdate(endpoint, 'PUT', obj);
        return queueAndReturn<T>(endpoint, options, formData, { clientRequestId, optimistic });
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

export interface SyncResult {
  /** Mutations confirmed by the server and removed from the queue. */
  succeeded: number;
  /** Transient failures that will be retried later (still queued). */
  failed: number;
  /** Permanently rejected (4xx) or retry-exhausted mutations needing attention. */
  deadLettered: number;
  /** Items still queued and awaiting sync after this run. */
  remaining: number;
}

const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MAX_MS = 5 * 60_000;

// Module-level guard: a reconnect event and the startup/timer paths can fire at
// once — without this they would replay the same items twice.
let _syncInFlight = false;

function isNetworkError(e: any): boolean {
  return typeof e?.message === 'string' && e.message.toLowerCase().includes('failed to fetch');
}

/** A 4xx (except 408 timeout / 429 rate-limit) won't succeed on retry — dead-letter it. */
function isPermanentError(e: any): boolean {
  if (e instanceof HttpError) {
    if (e.status === 408 || e.status === 429) return false;
    return e.status >= 400 && e.status < 500;
  }
  return false;
}

async function safeActiveCount(): Promise<number> {
  try { return await dbService.getActiveMutationCount(); } catch { return 0; }
}

/**
 * Replay queued offline mutations in FIFO order. Idempotency keys make replays
 * safe against duplicates; transient failures back off exponentially while
 * permanent (4xx) failures are dead-lettered so they stop blocking the queue.
 */
export async function syncOfflineMutations(): Promise<SyncResult> {
  if (_syncInFlight) {
    return { succeeded: 0, failed: 0, deadLettered: 0, remaining: await safeActiveCount() };
  }
  _syncInFlight = true;
  try {
    // Recover anything left 'syncing' by a previous crash/reload.
    await dbService.requeueStaleSyncing();

    const now = Date.now();
    const queued = (await dbService.getQueuedMutations())
      .filter(i => i.status !== 'failed' && (i.nextAttemptAt || 0) <= now)
      .sort((a, b) => a.timestamp - b.timestamp);

    let succeeded = 0;
    let failed = 0;
    let deadLettered = 0;

    for (const item of queued) {
      if (item.id == null) continue;

      try {
        await dbService.markMutationSyncing(item.id);
        const init = reconstructOptions(item.options);
        await request(item.endpoint, init, item.clientRequestId);

        // Replay confirmed — drop the optimistic placeholder so the server's
        // canonical record (fetched afterwards) doesn't appear twice.
        const store = item.options?._optimisticStore;
        const key = item.options?._optimisticKey;
        if (store && key != null) {
          try { await dbService.deleteFromStore(store, key); }
          catch (err) { console.warn('Failed to clean optimistic record:', err); }
        }

        await dbService.deleteQueuedMutation(item.id);
        succeeded++;
      } catch (e: any) {
        if (isPermanentError(e)) {
          console.error(`Sync permanently rejected for ${item.endpoint}:`, e);
          await dbService.deadLetterMutation(item.id, e.message || 'Rejected by server');
          deadLettered++;
          continue; // a bad item must not block the rest of the queue
        }

        // Transient (5xx / 408 / 429 / network): retry with exponential backoff.
        const retries = (item.retries || 0) + 1;
        if (retries >= item.maxRetries) {
          await dbService.deadLetterMutation(item.id, e.message || 'Max retries exceeded');
          deadLettered++;
        } else {
          const delay = Math.min(BACKOFF_BASE_MS * 2 ** (retries - 1), BACKOFF_MAX_MS);
          await dbService.backoffMutation(item.id, retries, Date.now() + delay, e.message || 'Temporary failure');
          failed++;
        }

        // The server is unreachable — stop now; the rest stay pending for the
        // next trigger rather than piling up identical network errors.
        if (isNetworkError(e)) break;
      }
    }

    if (succeeded > 0) {
      try { await dbService.updateLastSync(); } catch { /* non-fatal */ }
    }

    return { succeeded, failed, deadLettered, remaining: await safeActiveCount() };
  } finally {
    _syncInFlight = false;
  }
}

/** Number of mutations still queued for sync (excludes dead-lettered items). */
export async function getPendingMutationCount(): Promise<number> {
  return safeActiveCount();
}

/** Number of mutations that permanently failed and need user attention. */
export async function getDeadLetterCount(): Promise<number> {
  try { return await dbService.getDeadLetterCount(); } catch { return 0; }
}

/** Reset dead-lettered mutations to pending so the next sync retries them. */
export async function retryFailedMutations(): Promise<number> {
  try { return await dbService.retryDeadLetters(); } catch { return 0; }
}
