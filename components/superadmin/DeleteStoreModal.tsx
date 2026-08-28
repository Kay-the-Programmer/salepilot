import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';

interface DeletionPreview {
    storeId: string;
    storeName: string;
    tables: Array<{ table: string; rows: number }>;
    totalRows: number;
    usersOrphaned: Array<{ id: string; name: string; email: string }>;
    usersRepointed: Array<{ id: string; name: string; email: string }>;
    fileUrls: string[];
}

interface DeleteStoreModalProps {
    storeId: string;
    storeName: string;
    onCancel: () => void;
    onDeleted: (summary: string) => void;
}

/**
 * Erasing a store, with the consequence shown first.
 *
 * There is no undo, so this is deliberately slow: the damage is counted before
 * it is done, the people affected are named, and the store's name has to be
 * typed back. An id in a URL is one character away from a different store, and
 * nothing else on this screen would reveal that before it mattered.
 */
const DeleteStoreModal: React.FC<DeleteStoreModalProps> = ({
    storeId, storeName, onCancel, onDeleted,
}) => {
    const [preview, setPreview] = useState<DeletionPreview | null>(null);
    const [typed, setTyped] = useState('');
    const [archive, setArchive] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        api.get<DeletionPreview>(`/superadmin/stores/${storeId}/deletion-preview`)
            .then(p => { if (!cancelled) setPreview(p); })
            .catch(e => { if (!cancelled) setError(e?.message || 'Could not load what would be deleted.'); });
        return () => { cancelled = true; };
    }, [storeId]);

    const confirmed = typed.trim() === storeName.trim();

    const destroy = async () => {
        setBusy(true);
        setError(null);
        try {
            const r = await api.delete<{ totalRows: number }>(
                `/superadmin/stores/${storeId}`,
                { confirmName: typed.trim(), archive },
                // Never queued: a deferred delete is replayed later, from a
                // device whose owner has moved on, against a store nobody is
                // looking at any more.
                { skipQueue: true },
            );
            onDeleted(`"${storeName}" deleted — ${(r as any).totalRows} records removed.`);
        } catch (e: any) {
            setError(e?.message || 'Could not delete the store.');
            setBusy(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-xl bg-surface border border-danger/40 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-brand-border">
                    <h2 className="text-base font-bold text-danger">Delete this store permanently</h2>
                    <p className="text-[11px] text-brand-text-muted mt-1">
                        This cannot be undone.
                    </p>
                </div>

                <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto">
                    {!preview && !error && (
                        <p className="text-sm text-brand-text-muted">Working out what would be deleted…</p>
                    )}

                    {preview && (
                        <>
                            <div className="rounded-lg bg-surface-variant p-3">
                                <p className="text-sm font-bold text-brand-text">
                                    {preview.totalRows.toLocaleString()} records across {preview.tables.length} tables
                                </p>
                                <ul className="mt-2 space-y-0.5 text-[11px] text-brand-text-muted">
                                    {preview.tables.slice(0, 8).map(t => (
                                        <li key={t.table} className="flex justify-between gap-3">
                                            <span className="truncate">{t.table.replace(/_/g, ' ')}</span>
                                            <span className="shrink-0 font-bold">{t.rows.toLocaleString()}</span>
                                        </li>
                                    ))}
                                    {preview.tables.length > 8 && (
                                        <li className="pt-1">and {preview.tables.length - 8} more…</li>
                                    )}
                                </ul>
                                {preview.fileUrls.length > 0 && (
                                    <p className="mt-2 text-[11px] text-brand-text-muted">
                                        {preview.fileUrls.length} uploaded image
                                        {preview.fileUrls.length === 1 ? '' : 's'} will also be removed.
                                    </p>
                                )}
                            </div>

                            {/* The consequence nobody expects, so it gets its own box. */}
                            {(preview.usersOrphaned.length > 0 || preview.usersRepointed.length > 0) && (
                                <div className="rounded-lg border border-brand-border p-3 space-y-2">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-brand-text-muted">
                                        People
                                    </p>
                                    {preview.usersOrphaned.length > 0 && (
                                        <div>
                                            <p className="text-xs text-brand-text">
                                                {preview.usersOrphaned.length} account
                                                {preview.usersOrphaned.length === 1 ? '' : 's'} will be left with no
                                                store. They keep their login and can set up a new one.
                                            </p>
                                            <p className="text-[11px] text-brand-text-muted truncate">
                                                {preview.usersOrphaned.map(u => u.email).join(', ')}
                                            </p>
                                        </div>
                                    )}
                                    {preview.usersRepointed.length > 0 && (
                                        <p className="text-xs text-brand-text">
                                            {preview.usersRepointed.length} owner
                                            {preview.usersRepointed.length === 1 ? '' : 's'} of another store will be
                                            moved to it.
                                        </p>
                                    )}
                                </div>
                            )}

                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input type="checkbox" className="mt-0.5" checked={archive}
                                    onChange={e => setArchive(e.target.checked)} />
                                <span className="text-xs text-brand-text">
                                    Save a copy of everything first
                                    <span className="block text-[11px] text-brand-text-muted">
                                        Written to the server, never published. Leave this on unless the
                                        store is being erased because someone asked to be forgotten —
                                        then a copy is the one thing you must not keep.
                                    </span>
                                </span>
                            </label>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-brand-text-muted mb-1.5" htmlFor="confirm-store-name">
                                    Type <span className="text-brand-text">{storeName}</span> to confirm
                                </label>
                                <input
                                    id="confirm-store-name"
                                    value={typed}
                                    onChange={e => setTyped(e.target.value)}
                                    autoComplete="off"
                                    className="w-full rounded-lg border border-brand-border bg-surface px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-danger/40"
                                    placeholder={storeName}
                                />
                            </div>
                        </>
                    )}

                    {error && <p className="text-xs text-danger">{error}</p>}
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border bg-surface-variant/40">
                    <button type="button" onClick={onCancel} disabled={busy}
                        className="rounded-lg px-3 py-2 text-sm font-bold text-brand-text-muted hover:text-brand-text disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="button" onClick={destroy} disabled={busy || !confirmed || !preview}
                        className="rounded-lg bg-danger px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">
                        {busy ? 'Deleting…' : 'Delete permanently'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default DeleteStoreModal;
