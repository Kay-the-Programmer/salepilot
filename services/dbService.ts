

const DB_NAME = 'SalePilotDB';
const DB_VERSION = 8;
const STORES = ['products', 'categories', 'customers', 'suppliers', 'sales', 'returns', 'purchaseOrders', 'supplierInvoices', 'users', 'accounts', 'journalEntries', 'auditLogs', 'settings', 'syncQueue', 'accounting', 'reports', 'announcements', 'marketStores', 'marketProducts', 'marketRequests'];

const STORE_KEY_PATHS: { [key: string]: string } = {
    sales: 'transactionId',
};


export interface SyncQueueItem {
    id?: number;
    endpoint: string;
    options: any; // Serialized options
    timestamp: number;
    retries?: number;
    lastError?: string;
    status: 'pending' | 'syncing' | 'failed';
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

    // Sync Queue methods
    async addMutationToQueue(endpoint: string, options: any): Promise<void> {
        const item: Omit<SyncQueueItem, 'id'> = {
            endpoint,
            options,
            timestamp: Date.now(),
            retries: 0,
            status: 'pending'
        };
        await this.put('syncQueue', item);
    }

    async markMutationFailed(id: number, error: string): Promise<void> {
        const item = await this.get<SyncQueueItem>('syncQueue', id);
        if (item) {
            item.status = 'failed';
            item.lastError = error;
            item.retries = (item.retries || 0) + 1;
            await this.put('syncQueue', item);
        }
    }

    async markMutationSyncing(id: number): Promise<void> {
        const item = await this.get<SyncQueueItem>('syncQueue', id);
        if (item) {
            item.status = 'syncing';
            await this.put('syncQueue', item);
        }
    }

    async getQueuedMutations(): Promise<SyncQueueItem[]> {
        return this.getAll<SyncQueueItem>('syncQueue');
    }

    async deleteQueuedMutation(id: number): Promise<void> {
        const store = await this.getStore('syncQueue', 'readwrite');
        const request = store.delete(id);
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
