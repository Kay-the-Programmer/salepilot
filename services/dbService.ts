

const DB_NAME = 'SalePilotDB';
const DB_VERSION = 11;
const STORES = ['products', 'categories', 'customers', 'suppliers', 'sales', 'returns', 'purchaseOrders', 'supplierInvoices', 'users', 'accounts', 'journalEntries', 'auditLogs', 'settings', 'syncQueue', 'accounting', 'reports', 'announcements', 'marketStores', 'marketProducts', 'marketRequests', 'couriers', 'buses', 'shipments', 'aiHistory'];

export const STORE_KEY_PATHS: { [key: string]: string } = {
    sales: 'transactionId',
};

/** Generate a stable idempotency key reused across every retry of a mutation. */
export function genClientRequestId(): string {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch { /* fall through */ }
    return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export interface SyncQueueItem {
    id?: number;
    /** Idempotency key, reused across every retry so the server can dedupe replays. */
    clientRequestId: string;
    endpoint: string;
    options: any; // Serialized RequestInit (+ optimistic-cleanup hints)
    timestamp: number;
    retries: number;
    /** After this many failed attempts the item is dead-lettered (status 'failed'). */
    maxRetries: number;
    /** Epoch ms before which this item must not be retried (exponential backoff gate). */
    nextAttemptAt: number;
    lastError?: string;
    /** 'pending' = eligible, 'syncing' = in flight, 'failed' = dead-lettered (needs attention). */
    status: 'pending' | 'syncing' | 'failed';
    /** Friendly label for UI/logging, e.g. 'sale', 'product'. */
    entity?: string;
}

class DBService {
    private db: IDBDatabase | null = null;
    private dbPromise: Promise<void> | null = null;

    constructor() {
        this.init();
    }

    // Method to delete the database - can be called for troubleshooting
    async deleteDatabase(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        this.dbPromise = null;

        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(DB_NAME);
            request.onsuccess = () => {
                console.log(`Database ${DB_NAME} successfully deleted`);
                // Reinitialize the database
                this.init().then(resolve).catch(reject);
            };
            request.onerror = () => {
                console.error(`Failed to delete database ${DB_NAME}:`, request.error);
                reject(request.error);
            };
        });
    }

    private init(): Promise<void> {
        if (!this.dbPromise) {
            this.dbPromise = new Promise((resolve, reject) => {
                // First, try to open the database without specifying a version to check the current version
                const checkVersionRequest = indexedDB.open(DB_NAME);

                checkVersionRequest.onsuccess = () => {
                    const currentVersion = checkVersionRequest.result.version;
                    checkVersionRequest.result.close();

                    console.log(`Current IndexedDB version: ${currentVersion}, Expected version: ${DB_VERSION}`);

                    // Determine which version to use - use the higher version to avoid VersionError
                    const versionToUse = Math.max(currentVersion, DB_VERSION);
                    console.log(`Using IndexedDB version: ${versionToUse}`);

                    // Now open with the appropriate version
                    const request = indexedDB.open(DB_NAME, versionToUse);

                    request.onerror = () => {
                        const error = request.error;
                        console.error("IndexedDB error:", error);
                        reject(error);
                    };

                    request.onsuccess = () => {
                        this.db = request.result;
                        resolve();
                    };

                    request.onupgradeneeded = (event) => {
                        const db = (event.target as IDBOpenDBRequest).result;
                        console.log(`Upgrading IndexedDB from version ${event.oldVersion} to ${event.newVersion}`);

                        STORES.forEach(storeName => {
                            if (!db.objectStoreNames.contains(storeName)) {
                                console.log(`Creating object store: ${storeName}`);
                                if (storeName === 'syncQueue') {
                                    db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                                } else if (storeName === 'settings') {
                                    db.createObjectStore(storeName); // No keyPath for single object store
                                }
                                else {
                                    const keyPath = STORE_KEY_PATHS[storeName] || 'id';
                                    db.createObjectStore(storeName, { keyPath });
                                }
                            }
                        });
                    };
                };

                checkVersionRequest.onerror = () => {
                    console.error("Failed to check database version:", checkVersionRequest.error);

                    // If we can't check the version, try with our expected version
                    const request = indexedDB.open(DB_NAME, DB_VERSION);

                    request.onerror = () => {
                        const error = request.error;
                        console.error("IndexedDB error:", error);
                        reject(error);
                    };

                    request.onsuccess = () => {
                        this.db = request.result;
                        resolve();
                    };

                    request.onupgradeneeded = (event) => {
                        const db = (event.target as IDBOpenDBRequest).result;
                        STORES.forEach(storeName => {
                            if (!db.objectStoreNames.contains(storeName)) {
                                if (storeName === 'syncQueue') {
                                    db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                                } else if (storeName === 'settings') {
                                    db.createObjectStore(storeName); // No keyPath for single object store
                                }
                                else {
                                    const keyPath = STORE_KEY_PATHS[storeName] || 'id';
                                    db.createObjectStore(storeName, { keyPath });
                                }
                            }
                        });
                    };
                };
            });
        }
        return this.dbPromise;
    }

    private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        const store = await this.getStore(storeName, 'readonly');
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async bulkPut<T>(storeName: string, items: T[]): Promise<void> {
        if (items.length === 0) return;
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const transaction = store.transaction;
            items.forEach(item => store.put(item));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async get<T>(storeName: string, key: any): Promise<T | undefined> {
        const store = await this.getStore(storeName, 'readonly');
        const request = store.get(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName: string, item: any, key?: IDBValidKey): Promise<void> {
        const store = await this.getStore(storeName, 'readwrite');
        const request = key ? store.put(item, key) : store.put(item);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ── Sync Queue ───────────────────────────────────────────────────────────
    async addMutationToQueue(
        endpoint: string,
        options: any,
        meta: { clientRequestId?: string; maxRetries?: number; entity?: string } = {}
    ): Promise<void> {
        const item: Omit<SyncQueueItem, 'id'> = {
            clientRequestId: meta.clientRequestId || genClientRequestId(),
            endpoint,
            options,
            timestamp: Date.now(),
            retries: 0,
            maxRetries: meta.maxRetries ?? 8,
            nextAttemptAt: 0,
            status: 'pending',
            entity: meta.entity,
        };
        await this.put('syncQueue', item);
    }

    async markMutationSyncing(id: number): Promise<void> {
        const item = await this.get<SyncQueueItem>('syncQueue', id);
        if (item) {
            item.status = 'syncing';
            await this.put('syncQueue', item);
        }
    }

    /** Transient failure: keep the item pending and gate the next retry behind a backoff. */
    async backoffMutation(id: number, retries: number, nextAttemptAt: number, error: string): Promise<void> {
        const item = await this.get<SyncQueueItem>('syncQueue', id);
        if (item) {
            item.status = 'pending';
            item.retries = retries;
            item.nextAttemptAt = nextAttemptAt;
            item.lastError = error;
            await this.put('syncQueue', item);
        }
    }

    /** Permanent failure (4xx or retries exhausted): dead-letter so it stops retrying and surfaces to the user. */
    async deadLetterMutation(id: number, error: string): Promise<void> {
        const item = await this.get<SyncQueueItem>('syncQueue', id);
        if (item) {
            item.status = 'failed';
            item.lastError = error;
            item.retries = (item.retries || 0) + 1;
            await this.put('syncQueue', item);
        }
    }

    /** Recover items left mid-flight by a crash/reload so they aren't skipped forever. */
    async requeueStaleSyncing(): Promise<number> {
        const all = await this.getQueuedMutations();
        let n = 0;
        for (const it of all) {
            if (it.status === 'syncing' && it.id != null) {
                it.status = 'pending';
                await this.put('syncQueue', it);
                n++;
            }
        }
        return n;
    }

    /** Reset every dead-lettered item to pending — backs a "retry failed changes" action. */
    async retryDeadLetters(): Promise<number> {
        const all = await this.getQueuedMutations();
        let n = 0;
        for (const it of all) {
            if (it.status === 'failed' && it.id != null) {
                it.status = 'pending';
                it.retries = 0;
                it.nextAttemptAt = 0;
                it.lastError = undefined;
                await this.put('syncQueue', it);
                n++;
            }
        }
        return n;
    }

    /** Count of items still trying to sync (pending or in-flight, excludes dead-lettered). */
    async getActiveMutationCount(): Promise<number> {
        const all = await this.getQueuedMutations();
        return all.filter(i => i.status !== 'failed').length;
    }

    async getDeadLetterCount(): Promise<number> {
        const all = await this.getQueuedMutations();
        return all.filter(i => i.status === 'failed').length;
    }

    async getQueuedMutations(): Promise<SyncQueueItem[]> {
        return this.getAll<SyncQueueItem>('syncQueue');
    }

    async deleteQueuedMutation(id: number): Promise<void> {
        await this.deleteFromStore('syncQueue', id);
    }

    /** Remove a single record from any store by key (used to clear optimistic placeholders). */
    async deleteFromStore(storeName: string, key: any): Promise<void> {
        const store = await this.getStore(storeName, 'readwrite');
        const request = store.delete(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearStore(storeName: string): Promise<void> {
        const store = await this.getStore(storeName, 'readwrite');
        const request = store.clear();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async updateLastSync(): Promise<void> {
        await this.put('settings', Date.now(), 'lastSyncTimestamp');
    }

    async getLastSync(): Promise<number | null> {
        return (await this.get<number>('settings', 'lastSyncTimestamp')) || null;
    }
}

export const dbService = new DBService();
