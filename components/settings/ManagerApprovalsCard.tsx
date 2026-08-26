import React, { useEffect, useState } from 'react';
import { StoreSettings } from '@/types.ts';
import { getOverrideSettings, setManagerPin } from '../../services/overrides';

interface ManagerApprovalsCardProps {
    settings: Partial<StoreSettings>;
    onChange: (thresholds: Record<string, unknown>) => void;
    showSnackbar: (message: string, type?: 'success' | 'error') => void;
    inputCls: string;
}

/**
 * When a cashier must fetch a manager, and the PIN that lets one answer.
 *
 * The two belong on the same screen because a limit without a PIN is a till
 * that cannot complete a sale: the moment a threshold is set, someone has to be
 * able to approve. Setting a limit and discovering that at the counter is the
 * failure this layout is meant to prevent.
 */
const ManagerApprovalsCard: React.FC<ManagerApprovalsCardProps> = ({
    settings, onChange, showSnackbar, inputCls,
}) => {
    const thresholds = (settings as any).overrideThresholds || {};
    const [canApprove, setCanApprove] = useState(false);
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [savingPin, setSavingPin] = useState(false);

    useEffect(() => {
        getOverrideSettings()
            .then(s => setCanApprove(!!s.selfAuthorizes))
            .catch(() => setCanApprove(false));
    }, []);

    const set = (key: string, raw: string) => {
        const value = raw.trim() === '' ? null : Math.max(0, Number(raw) || 0);
        onChange({ ...thresholds, [key]: value });
    };

    const savePin = async (clear = false) => {
        setSavingPin(true);
        try {
            const r = await setManagerPin(password, clear ? null : pin);
            showSnackbar(r.hasPin ? 'Approval PIN saved.' : 'Approval PIN removed.', 'success');
            setPassword('');
            setPin('');
        } catch (e: any) {
            showSnackbar(e?.message || 'Could not save that PIN.', 'error');
        } finally {
            setSavingPin(false);
        }
    };

    const limit = (key: string, label: string, hint: string, suffix?: string) => (
        <div>
            <label className="block text-sm font-semibold m3-text-on-surface mb-1.5" htmlFor={`ovr-${key}`}>
                {label}
            </label>
            <div className="flex items-center gap-2">
                <input
                    id={`ovr-${key}`}
                    className={inputCls}
                    type="number"
                    min="0"
                    value={thresholds[key] ?? ''}
                    onChange={e => set(key, e.target.value)}
                    placeholder="No limit"
                />
                {suffix && <span className="text-sm m3-text-on-surface-variant">{suffix}</span>}
            </div>
            <p className="text-[11px] m3-text-on-surface-variant mt-1">{hint}</p>
        </div>
    );

    return (
        <div className="m3-card p-5 space-y-5">
            <div>
                <h3 className="text-sm font-bold m3-text-on-surface">Manager approvals</h3>
                <p className="text-[11px] m3-text-on-surface-variant mt-1">
                    Leave a box empty and that action never needs approval &mdash; which is how the
                    till behaves today. A manager working the register is never asked.
                </p>
            </div>

            {limit('discountPercent', 'Discount needs approval at', 'Measured against the basket, so it catches a big discount on a small sale.', '% and above')}
            {limit('refundAmount', 'Refund needs approval at', 'The value being refunded, whatever it is refunded to.', 'and above')}
            {limit('payOutAmount', 'Cash pay-out needs approval at', 'Money taken out of the drawer. Paying money in never needs approval.', 'and above')}

            <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={thresholds.noSale === true}
                    onChange={e => onChange({ ...thresholds, noSale: e.target.checked })}
                />
                <span className="text-sm m3-text-on-surface">
                    Approval to open the drawer with no sale
                    <span className="block text-[11px] m3-text-on-surface-variant">
                        Every opening is recorded either way.
                    </span>
                </span>
            </label>

            <div className="pt-4 border-t m3-border">
                <h4 className="text-sm font-bold m3-text-on-surface">Your approval PIN</h4>
                {!canApprove ? (
                    <p className="text-[11px] m3-text-on-surface-variant mt-1">
                        Only a manager can hold an approval PIN.
                    </p>
                ) : (
                    <>
                        <p className="text-[11px] m3-text-on-surface-variant mt-1 mb-3">
                            Six to twelve digits, and not a run or a repeat. Typed at the till by you,
                            not shared &mdash; every use is recorded against your name.
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <input
                                className={inputCls}
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Your account password"
                            />
                            <input
                                className={inputCls}
                                type="password"
                                inputMode="numeric"
                                autoComplete="off"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                placeholder="New PIN"
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                disabled={savingPin || !password || !pin}
                                onClick={() => savePin(false)}
                                className="m3-btn-filled px-4 py-2 text-sm disabled:opacity-50"
                            >
                                {savingPin ? 'Saving…' : 'Save PIN'}
                            </button>
                            <button
                                type="button"
                                disabled={savingPin || !password}
                                onClick={() => savePin(true)}
                                className="m3-btn-text px-3 py-2 text-sm disabled:opacity-50"
                            >
                                Remove PIN
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ManagerApprovalsCard;
