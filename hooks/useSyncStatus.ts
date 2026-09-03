import { useCallback, useEffect, useState } from 'react';
import { getOnlineStatus, getPendingMutationCount, SYNC_CHANGE_EVENT } from '../services/api';

export interface SyncStatus {
    /** Whether the browser currently has a connection. */
    online: boolean;
    /** Mutations written offline and still waiting to reach the server. */
    pending: number;
    /** A replay is running right now. */
    syncing: boolean;
}

/**
 * Live view of the offline queue for any surface that needs to show it.
 *
 * The sync engine has always tracked this — it just had nowhere to display it
 * after the legacy sidebar was retired, so a cashier working through a network
 * drop got no indication their sales were queued rather than saved. This hook
 * is the read side of that: it seeds from IndexedDB, then updates on the
 * connectivity and queue events the engine emits, rather than polling.
 */
export const useSyncStatus = (): SyncStatus => {
    const [online, setOnline] = useState<boolean>(getOnlineStatus);
    const [pending, setPending] = useState(0);
    const [syncing, setSyncing] = useState(false);

    const refreshPending = useCallback(() => {
        getPendingMutationCount()
            .then(setPending)
            .catch(() => { /* count unavailable — leave the last known value */ });
    }, []);

    useEffect(() => {
        let cancelled = false;

        const onStatus = () => { if (!cancelled) { setOnline(getOnlineStatus()); refreshPending(); } };
        const onSyncChange = (e: Event) => {
            if (cancelled) return;
            const detail = (e as CustomEvent<{ syncing?: boolean }>).detail;
            setSyncing(!!detail?.syncing);
            refreshPending();
        };

        refreshPending();
        window.addEventListener('onlineStatusChange', onStatus);
        window.addEventListener(SYNC_CHANGE_EVENT, onSyncChange);

        // Backstop: a replay driven by the service worker (Background Sync) can
        // drain the queue while this tab is asleep and emits nothing here.
        const onVisible = () => { if (document.visibilityState === 'visible') onStatus(); };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            window.removeEventListener('onlineStatusChange', onStatus);
            window.removeEventListener(SYNC_CHANGE_EVENT, onSyncChange);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [refreshPending]);

    return { online, pending, syncing };
};

export default useSyncStatus;
