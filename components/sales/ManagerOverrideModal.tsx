import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PosIcon from './PosIcon';
import { StoreSettings } from '@/types.ts';
import { formatCurrency } from '@/utils/currency.ts';
import { OverrideAction, authorizeOverride } from '../../services/overrides';

interface ManagerOverrideModalProps {
    isOpen: boolean;
    action: OverrideAction | null;
    amount: number;
    storeSettings: StoreSettings;
    onCancel: () => void;
    /** Handed the single-use approval to retry the action with. */
    onApproved: (overrideId: string, authorizedBy: string) => void;
}

/**
 * A manager, at the till, allowing one thing.
 *
 * States plainly what is being approved and at what size, because the person
 * typing the PIN is answering for it afterwards and a prompt that only says
 * "enter PIN" trains them to type it without reading. The approval it returns
 * is good once, for this action, at this size.
 */
const ManagerOverrideModal: React.FC<ManagerOverrideModalProps> = ({
    isOpen, action, amount, storeSettings, onCancel, onApproved,
}) => {
    const [pin, setPin] = useState('');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setPin('');
        setReason('');
        setError(null);
    }, [isOpen, action]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onCancel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onCancel]);

    if (!isOpen || !action) return null;

    const money = (n: number) => formatCurrency(n, storeSettings);
    const describe = (): string => {
        switch (action) {
            case 'discount': return `A discount of ${amount}% on this sale`;
            case 'refund': return `A refund of ${money(amount)}`;
            case 'pay_out': return `Taking ${money(amount)} out of the drawer`;
            case 'no_sale': return 'Opening the drawer with no sale';
        }
    };

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            const granted = await authorizeOverride({
                action,
                amount,
                pin,
                reason: reason.trim() || undefined,
            });
            onApproved(granted.id, granted.authorizedBy);
        } catch (e: any) {
            setError(e?.message || 'That PIN was not accepted.');
            setPin('');
        } finally {
            setBusy(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-xl bg-surface border border-brand-border shadow-xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-brand-border">
                    <PosIcon name="admin_panel_settings" size={20} />
                    <h2 className="text-base font-bold text-brand-text">Manager approval</h2>
                </div>

                <div className="p-5 space-y-4">
                    <div className="rounded-lg bg-surface-variant px-3 py-2.5">
                        <p className="text-[11px] font-black uppercase tracking-wider text-brand-text-muted">
                            Being approved
                        </p>
                        <p className="text-sm font-semibold text-brand-text">{describe()}</p>
                    </div>

                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-brand-text-muted mb-1.5" htmlFor="override-pin">
                            Manager PIN
                        </label>
                        <input
                            id="override-pin"
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            autoFocus
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && pin && !busy) submit(); }}
                            className="w-full rounded-lg border border-brand-border bg-surface px-3 py-2.5 text-lg tracking-[0.3em] text-brand-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                            placeholder="••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-brand-text-muted mb-1.5" htmlFor="override-reason">
                            Reason (optional)
                        </label>
                        <input
                            id="override-reason"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full rounded-lg border border-brand-border bg-surface px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                            placeholder="Damaged box, price match…"
                        />
                    </div>

                    {error && <p className="text-xs text-danger">{error}</p>}

                    <p className="text-[11px] text-brand-text-muted">
                        This approval covers this one action and is recorded against the manager
                        who gave it.
                    </p>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border bg-surface-variant/40">
                    <button type="button" onClick={onCancel}
                        className="rounded-lg px-3 py-2 text-sm font-bold text-brand-text-muted hover:text-brand-text">
                        Cancel
                    </button>
                    <button type="button" disabled={busy || !pin} onClick={submit}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
                        {busy ? 'Checking…' : 'Approve'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ManagerOverrideModal;
