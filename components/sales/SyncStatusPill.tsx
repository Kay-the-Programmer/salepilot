import React from 'react';
import PosIcon from './PosIcon';
import useSyncStatus from '../../hooks/useSyncStatus';

/**
 * Connection and offline-queue state for the till.
 *
 * A cashier working through a network drop needs to know three things without
 * asking anyone: that the till is offline, that their sales were kept, and
 * that those sales eventually reached the server. The engine tracked all of
 * it already; this is the part that says so out loud.
 *
 * Deliberately quiet while everything is normal — online with an empty queue
 * renders nothing, so the top bar stays clear during an ordinary shift.
 */
const SyncStatusPill: React.FC = () => {
    const { online, pending, syncing } = useSyncStatus();

    if (online && pending === 0 && !syncing) return null;

    if (!online) {
        const label = pending > 0
            ? `Offline — ${pending} sale${pending === 1 ? '' : 's'} saved here`
            : 'Offline — sales are saved on this device';
        return (
            <span
                className="sale__sync sale__sync--offline"
                title="No connection. Sales are stored on this device and sent automatically once you are back online."
                role="status"
            >
                <PosIcon name="cloud_off" size={16} />
                {label}
            </span>
        );
    }

    if (syncing) {
        return (
            <span className="sale__sync sale__sync--syncing" title="Sending queued sales to the server." role="status">
                <PosIcon name="sync" size={16} className="sale__sync-spin" />
                Syncing{pending > 0 ? ` ${pending}` : ''}…
            </span>
        );
    }

    // Online with a non-empty queue: the retry timer will pick these up.
    return (
        <span
            className="sale__sync sale__sync--pending"
            title="These sales are saved on this device and are waiting to reach the server."
            role="status"
        >
            <PosIcon name="cloud_upload" size={16} />
            {pending} waiting to sync
        </span>
    );
};

export default SyncStatusPill;
