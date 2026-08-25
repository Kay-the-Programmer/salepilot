import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PosIcon from './PosIcon';
import { StoreSettings } from '@/types.ts';
import { formatCurrency } from '@/utils/currency.ts';
import {
    CashSession,
    addMovement,
    closeSession,
    getCurrentSession,
    openSession,
} from '../../services/cashSession';

interface CashDrawerModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeSettings: StoreSettings;
}

type View = 'loading' | 'closed' | 'open' | 'counting' | 'result';

/**
 * The cash drawer, as a shift.
 *
 * The one rule this screen exists to enforce: the cashier counts the drawer
 * before being told what it should contain. Everything on the open till view is
 * information they already have — their float, the movements they recorded
 * themselves — and the expected figure only appears after a count is committed.
 * A count made against a visible target checks nothing.
 */
const CashDrawerModal: React.FC<CashDrawerModalProps> = ({ isOpen, onClose, storeSettings }) => {
    const [view, setView] = useState<View>('loading');
    const [session, setSession] = useState<CashSession | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [float, setFloat] = useState('');
    const [counted, setCounted] = useState('');
    const [notes, setNotes] = useState('');
    const [moveType, setMoveType] = useState<'pay_in' | 'pay_out'>('pay_out');
    const [moveAmount, setMoveAmount] = useState('');
    const [moveReason, setMoveReason] = useState('');

    const money = useCallback(
        (n: number) => formatCurrency(n, storeSettings),
        [storeSettings],
    );

    const load = useCallback(async () => {
        setView('loading');
        setError(null);
        try {
            const current = await getCurrentSession();
            setSession(current);
            setView(current ? 'open' : 'closed');
        } catch {
            setError('Could not load the till.');
            setView('closed');
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setFloat('');
        setCounted('');
        setNotes('');
        setMoveAmount('');
        setMoveReason('');
        load();
    }, [isOpen, load]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        try {
            await fn();
        } catch (e: any) {
            setError(e?.message || 'Something went wrong.');
        } finally {
            setBusy(false);
        }
    };

    const amount = (raw: string): number | null => {
        const n = parseFloat(raw);
        return Number.isFinite(n) && n >= 0 ? n : null;
    };

    const doOpen = () => run(async () => {
        const value = amount(float);
        if (value === null) throw new Error('Enter the float you are starting with.');
        setSession(await openSession(value));
        setView('open');
    });

    const doMovement = () => run(async () => {
        if (!session) return;
        const value = amount(moveAmount);
        if (value === null || value <= 0) throw new Error('Enter an amount greater than zero.');
        if (!moveReason.trim()) throw new Error('Say what the money was for.');
        const { movements } = await addMovement(session.id, {
            type: moveType, amount: value, reason: moveReason.trim(),
        });
        setSession({ ...session, movements });
        setMoveAmount('');
        setMoveReason('');
    });

    const doClose = () => run(async () => {
        if (!session) return;
        const value = amount(counted);
        if (value === null) throw new Error('Count the drawer and enter the total.');
        setSession(await closeSession(session.id, value, notes.trim() || undefined));
        setView('result');
    });

    const field = 'w-full rounded-lg border border-brand-border bg-surface px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-primary/40';
    const label = 'block text-[11px] font-black uppercase tracking-wider text-brand-text-muted mb-1.5';

    const body = () => {
        if (view === 'loading') {
            return <p className="text-sm text-brand-text-muted">Loading the till…</p>;
        }

        if (view === 'closed') {
            return (
                <div className="space-y-3">
                    <p className="text-sm text-brand-text-muted">
                        Count the money you are starting with and enter it below. Everything sold,
                        refunded and paid out from now until you close is measured against it.
                    </p>
                    <div>
                        <label className={label} htmlFor="till-float">Opening float</label>
                        <input id="till-float" className={field} inputMode="decimal" value={float}
                            onChange={e => setFloat(e.target.value)} placeholder="0.00" autoFocus />
                    </div>
                </div>
            );
        }

        if (view === 'counting' && session) {
            return (
                <div className="space-y-3">
                    <p className="text-sm text-brand-text-muted">
                        Count everything in the drawer, notes and coins, and enter the total.
                        You will see how it compares once you submit.
                    </p>
                    <div>
                        <label className={label} htmlFor="till-count">Counted total</label>
                        <input id="till-count" className={field} inputMode="decimal" value={counted}
                            onChange={e => setCounted(e.target.value)} placeholder="0.00" autoFocus />
                    </div>
                    <div>
                        <label className={label} htmlFor="till-notes">Notes (optional)</label>
                        <input id="till-notes" className={field} value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Anything worth explaining" />
                    </div>
                </div>
            );
        }

        if (view === 'result' && session) {
            const variance = session.variance ?? 0;
            const balanced = Math.abs(variance) < 0.005;
            return (
                <div className="space-y-3">
                    <div className={`rounded-lg p-3 text-center ${balanced ? 'bg-success/10' : 'bg-danger/10'}`}>
                        <p className="text-[11px] font-black uppercase tracking-wider text-brand-text-muted">
                            {balanced ? 'Drawer balanced' : variance > 0 ? 'Over' : 'Short'}
                        </p>
                        <p className={`text-2xl font-black ${balanced ? 'text-success' : 'text-danger'}`}>
                            {balanced ? money(0) : money(Math.abs(variance))}
                        </p>
                    </div>
                    <dl className="text-sm">
                        <Row label="Counted" value={money(session.countedCash ?? 0)} />
                        <Row label="Expected" value={money(session.expectedCash ?? 0)} />
                        <Row label="Opening float" value={money(session.openingFloat)} />
                        {session.tenders?.map(t => (
                            <Row key={t.method} label={`${t.method} (${t.count})`} value={money(t.amount)} muted />
                        ))}
                        <Row label="Sales" value={String(session.sales ?? 0)} muted />
                        <Row label="Returns" value={String(session.returns ?? 0)} muted />
                    </dl>
                </div>
            );
        }

        if (!session) return null;

        // The open till. Note there is no expected figure anywhere on it.
        return (
            <div className="space-y-4">
                <dl className="text-sm">
                    <Row label="Opened by" value={session.openedBy} muted />
                    <Row label="Opening float" value={money(session.openingFloat)} />
                    <Row label="Sales rung up" value={String(session.sales ?? 0)} muted />
                    <Row label="Returns" value={String(session.returns ?? 0)} muted />
                </dl>

                <div className="rounded-lg border border-brand-border p-3 space-y-2.5">
                    <p className={label}>Money in or out</p>
                    <div className="flex gap-2">
                        {(['pay_out', 'pay_in'] as const).map(t => (
                            <button key={t} type="button" onClick={() => setMoveType(t)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${moveType === t ? 'border-primary bg-primary/10 text-primary' : 'border-brand-border text-brand-text'}`}>
                                {t === 'pay_out' ? 'Paid out' : 'Paid in'}
                            </button>
                        ))}
                    </div>
                    <input className={field} inputMode="decimal" value={moveAmount}
                        onChange={e => setMoveAmount(e.target.value)} placeholder="Amount" />
                    <input className={field} value={moveReason}
                        onChange={e => setMoveReason(e.target.value)}
                        placeholder="What was it for?" />
                    <button type="button" disabled={busy} onClick={doMovement}
                        className="w-full rounded-lg border border-brand-border py-2 text-xs font-bold text-brand-text hover:bg-surface-variant disabled:opacity-50">
                        Record
                    </button>

                    {!!session.movements?.length && (
                        <ul className="pt-1 space-y-1">
                            {session.movements.map(m => (
                                <li key={m.id} className="flex justify-between gap-3 text-[11px] text-brand-text-muted">
                                    <span className="truncate">
                                        {m.type === 'pay_in' ? '+' : '−'} {m.reason}
                                    </span>
                                    <span className="shrink-0 font-bold">{money(m.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    };

    const title = view === 'closed' ? 'Open till'
        : view === 'counting' ? 'Close till'
        : view === 'result' ? 'Till closed'
        : 'Till';

    return createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-xl bg-surface border border-brand-border shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                    <h2 className="text-base font-bold text-brand-text">{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="text-brand-text-muted hover:text-brand-text">
                        <PosIcon name="close" size={20} />
                    </button>
                </div>

                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {body()}
                    {error && <p className="mt-3 text-xs text-danger">{error}</p>}
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border bg-surface-variant/40">
                    {view === 'closed' && (
                        <>
                            <button type="button" onClick={onClose}
                                className="rounded-lg px-3 py-2 text-sm font-bold text-brand-text-muted hover:text-brand-text">
                                Cancel
                            </button>
                            <button type="button" disabled={busy} onClick={doOpen}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
                                {busy ? 'Opening…' : 'Open till'}
                            </button>
                        </>
                    )}

                    {view === 'open' && (
                        <>
                            <button type="button" onClick={onClose}
                                className="rounded-lg px-3 py-2 text-sm font-bold text-brand-text-muted hover:text-brand-text">
                                Done
                            </button>
                            <button type="button" disabled={busy} onClick={() => { setError(null); setView('counting'); }}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
                                Close till
                            </button>
                        </>
                    )}

                    {view === 'counting' && (
                        <>
                            <button type="button" onClick={() => { setError(null); setView('open'); }}
                                className="rounded-lg px-3 py-2 text-sm font-bold text-brand-text-muted hover:text-brand-text">
                                Back
                            </button>
                            <button type="button" disabled={busy} onClick={doClose}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
                                {busy ? 'Closing…' : 'Submit count'}
                            </button>
                        </>
                    )}

                    {view === 'result' && (
                        <button type="button" onClick={onClose}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};

const Row: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
    <div className="flex justify-between gap-4 py-1">
        <dt className={muted ? 'text-brand-text-muted' : 'text-brand-text'}>{label}</dt>
        <dd className={`font-bold ${muted ? 'text-brand-text-muted' : 'text-brand-text'}`}>{value}</dd>
    </div>
);

export default CashDrawerModal;
