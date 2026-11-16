import React, { useEffect, useState } from 'react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getBooksHealth, BooksHealth, niceDate } from './booksApi';

/**
 * "Can I trust these numbers?" Compares each control account in the books
 * with the records it should equal (stock on hand, what customers owe, unpaid
 * supplier bills, store credit) and says plainly where they disagree.
 */
const BooksHealthCard: React.FC<{ storeSettings: StoreSettings; onOpenReports: () => void }> = ({ storeSettings, onOpenReports }) => {
    const money = (n: number) => formatCurrency(n, storeSettings);
    const [h, setH] = useState<BooksHealth | null>(null);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);

    const load = () => {
        setError(false);
        getBooksHealth().then(r => { setH(r); setOpen(!r.allOk); }).catch(() => setError(true));
    };
    useEffect(load, []);

    if (error) return (
        <div className="m3-bg-surface-lowest rounded-2xl p-5 border m3-border-outline-variant text-sm m3-text-on-surface-variant">
            Couldn't check the books. <button className="underline font-semibold" onClick={load}>Try again</button>
        </div>
    );
    if (!h) return null;

    const issues = h.checks.filter(c => !c.ok).length + (h.unbalancedEntries ? 1 : 0);
    return (
        <div className="m3-bg-surface-lowest rounded-2xl p-5 border m3-border-outline-variant">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${h.allOk ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'}`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{h.allOk ? 'verified' : 'warning'}</span>
                    </span>
                    <div>
                        <h3 className="text-base font-bold m3-text-on-surface">Books health</h3>
                        <p className="text-xs m3-text-on-surface-variant">
                            {h.allOk ? 'Everything in the books matches your records.' : `${issues} thing${issues === 1 ? '' : 's'} to look at.`}
                            {h.lockedUntil && ` Closed up to ${niceDate(h.lockedUntil)}.`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setOpen(o => !o)} className="text-xs font-semibold m3-text-primary">{open ? 'Hide checks' : 'Show checks'}</button>
                    <button onClick={onOpenReports} className="text-xs font-semibold m3-text-primary">Reports</button>
                </div>
            </div>

            {open && (
                <ul className="mt-4 divide-y divide-[var(--m3-outline-variant)]">
                    {h.checks.map(c => (
                        <li key={c.key} className="py-3 flex items-start gap-3">
                            <span className={`material-symbols-outlined mt-0.5 ${c.ok ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} style={{ fontSize: 18 }}>
                                {c.ok ? 'check_circle' : 'error'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold m3-text-on-surface">{c.label}</p>
                                <p className="text-xs m3-text-on-surface-variant tabular-nums">
                                    Books {money(c.ledger)} · Records {money(c.records)}
                                    {!c.ok && <> · <b>off by {money(Math.abs(c.difference))}</b></>}
                                </p>
                                {!c.ok && c.hint && <p className="text-xs m3-text-on-surface-variant mt-1">{c.hint}</p>}
                            </div>
                        </li>
                    ))}
                    {h.unbalancedEntries > 0 && (
                        <li className="py-3 flex items-start gap-3">
                            <span className="material-symbols-outlined mt-0.5 text-amber-600" style={{ fontSize: 18 }}>error</span>
                            <p className="text-sm m3-text-on-surface">{h.unbalancedEntries} journal entr{h.unbalancedEntries === 1 ? 'y doesn’t' : 'ies don’t'} add up on both sides.</p>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default BooksHealthCard;
