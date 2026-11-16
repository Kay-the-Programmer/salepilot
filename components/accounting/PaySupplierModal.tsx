import React, { useEffect, useMemo, useState } from 'react';
import { Supplier, SupplierInvoice, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';
import { XMarkIcon } from '../icons';
import { toDateInputValue } from '../../utils/date';

/** What is still owed on one supplier bill. */
const dueOn = (b: SupplierInvoice) => Math.max(0, Math.round(((Number(b.amount) || 0) - (Number(b.amountPaid) || 0)) * 100) / 100);

/** Their unpaid bills in the order the server pays them: due date, then bill date. */
export const openBillsOf = (bills: SupplierInvoice[], supplierId: string): SupplierInvoice[] =>
    bills
        .filter(b => b.supplierId === supplierId && dueOn(b) > 0.004)
        .sort((a, b) => {
            const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            return ad - bd || new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
        });

/** How the shop paid: each lands in its own money account in the books. */
const METHODS = ['Cash', 'Mobile Money', 'Bank transfer'];

/**
 * Pay a supplier toward everything you owe them in one go. The server applies
 * it to the oldest bills first; this shows which ones before it is sent.
 */
const PaySupplierModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    suppliers: Supplier[];
    bills: SupplierInvoice[];
    storeSettings: StoreSettings;
    supplierId?: string;
    onPaid: () => void;
}> = ({ isOpen, onClose, suppliers, bills, storeSettings, supplierId, onPaid }) => {
    const { showToast } = useToast();
    const methods = METHODS.map(name => ({ id: name, name }));
    const customerId = supplierId;
    const [who, setWho] = useState(customerId || '');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState(methods[0]?.name || '');
    const [reference, setReference] = useState('');
    const [date, setDate] = useState(toDateInputValue(new Date()));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Suppliers named only on bills still show up.
    const people = useMemo(() => {
        const m = new Map<string, { id: string; name: string }>();
        suppliers.forEach(x => m.set(x.id, { id: x.id, name: x.name }));
        bills.forEach(b => { if (!m.has(b.supplierId)) m.set(b.supplierId, { id: b.supplierId, name: b.supplierName }); });
        return [...m.values()];
    }, [suppliers, bills]);
    const owing = useMemo(() => people
        .map(c => ({ c, open: openBillsOf(bills, c.id) }))
        .filter(x => x.open.length > 0), [people, bills]);

    const open = useMemo(() => (who ? openBillsOf(bills, who) : []), [bills, who]);
    const owed = Math.round(open.reduce((a, s) => a + dueOn(s), 0) * 100) / 100;

    useEffect(() => {
        if (!isOpen) return;
        const initial = customerId || (owing.length === 1 ? owing[0].c.id : '');
        setWho(initial);
        setError(null);
        setReference('');
        setDate(toDateInputValue(new Date()));
        setMethod(methods[0]?.name || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, customerId]);

    // Default to paying everything owed; a part payment is one edit.
    useEffect(() => { setAmount(owed > 0 ? owed.toFixed(2) : ''); }, [who, owed]);

    // Which invoices this amount settles, oldest first — exactly what the server does.
    const allocation = useMemo(() => {
        let left = Math.round((parseFloat(amount) || 0) * 100) / 100;
        return open.map(s => {
            const due = dueOn(s);
            const take = Math.min(due, Math.max(0, left));
            left = Math.round((left - take) * 100) / 100;
            return { s, due, take };
        });
    }, [open, amount]);

    if (!isOpen) return null;

    const value = Math.round((parseFloat(amount) || 0) * 100) / 100;
    const invalid = !who || !(value > 0) || value > owed + 0.005;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (invalid || saving) return;
        setSaving(true);
        setError(null);
        try {
            const res = await api.post<{ applied: { invoiceId: string; amount: number }[]; remainingOwed: number }>(
                `/accounting/suppliers/${who}/payments`,
                { amount: value, method, reference: reference.trim() || undefined, date: new Date(`${date}T12:00:00`).toISOString() },
            );
            if ((res as any)?.offline) {
                showToast('Offline: payment saved on this device and will be applied when it syncs.', 'info');
            } else {
                const n = res.applied?.length || 0;
                showToast(`Paid ${formatCurrency(value, storeSettings)} — ${n} bill${n === 1 ? '' : 's'} updated${res.remainingOwed > 0 ? `, ${formatCurrency(res.remainingOwed, storeSettings)} still owed` : ', all paid up'}.`, 'success');
            }
            onPaid();
            onClose();
        } catch (err: any) {
            setError(err?.body?.message || err?.message || 'Could not record the payment.');
        } finally {
            setSaving(false);
        }
    };

    const field = 'w-full px-4 py-3 rounded-xl text-sm font-semibold bg-surface-variant text-brand-text border border-brand-border focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';
    const label = 'block text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5';
    const who_ = people.find(c => c.id === who);

    return (
        <Modal open onClose={() => { if (!saving) onClose(); }} size="lg" sheet ariaLabel="Pay supplier">
            <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
                <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-brand-border">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-brand-text tracking-tight">Pay supplier</h3>
                        <p className="text-xs text-brand-text-muted">Applied to the oldest bills first</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-lg text-brand-text-muted hover:bg-surface-variant">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                    {!customerId && (
                        <div>
                            <label className={label} htmlFor="psp-customer">Supplier</label>
                            <select id="psp-customer" className={field} value={who} onChange={e => setWho(e.target.value)}>
                                <option value="">Who are you paying?</option>
                                {owing.map(({ c, open: o }) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} — owes {formatCurrency(o.reduce((a, s) => a + dueOn(s), 0), storeSettings)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {who && (
                        <>
                            <div className="rounded-2xl bg-surface-variant border border-brand-border px-5 py-4">
                                <div className="flex items-baseline justify-between">
                                    <span className={label + ' mb-0'}>You owe {who_?.name || 'them'}</span>
                                    <span className="text-lg font-bold text-brand-text tabular-nums">{formatCurrency(owed, storeSettings)}</span>
                                </div>
                                <label className={label + ' mt-4'} htmlFor="psp-amount">Paying now</label>
                                <input id="psp-amount" className={field + ' text-2xl text-center tabular-nums'} inputMode="decimal" value={amount}
                                    onChange={e => { if (/^\d*(\.\d{0,2})?$/.test(e.target.value)) setAmount(e.target.value); }} />
                                {value > owed + 0.005 && (
                                    <p className="text-xs font-medium text-danger mt-1.5">That is more than you owe ({formatCurrency(owed, storeSettings)}).</p>
                                )}
                            </div>

                            <div>
                                <span className={label}>Paid from</span>
                                <div className="flex flex-wrap gap-2">
                                    {methods.map(m => (
                                        <button key={m.id} type="button" onClick={() => setMethod(m.name)}
                                            className={`px-3 py-2 rounded-full text-sm font-bold border transition-all ${method === m.name ? 'bg-sp-navy border-sp-navy text-white' : 'bg-surface border-brand-border text-brand-text'}`}>
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={label} htmlFor="psp-date">Date</label>
                                    <input id="psp-date" type="date" className={field} value={date} max={toDateInputValue(new Date())} onChange={e => setDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className={label} htmlFor="psp-ref">Reference</label>
                                    <input id="psp-ref" className={field} value={reference} onChange={e => setReference(e.target.value)} placeholder="Optional" />
                                </div>
                            </div>

                            <div>
                                <span className={label}>Settles</span>
                                <ul className="divide-y divide-brand-border rounded-xl border border-brand-border">
                                    {allocation.map(({ s, due, take }) => (
                                        <li key={s.id} className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${take <= 0 ? 'opacity-50' : ''}`}>
                                            <span className="min-w-0">
                                                <span className="font-semibold text-brand-text">{s.invoiceNumber || s.poNumber}</span>
                                                <span className="block text-[11px] text-brand-text-muted">
                                                    {new Date(s.invoiceDate).toLocaleDateString()}{s.dueDate ? ` · due ${new Date(s.dueDate).toLocaleDateString()}` : ''}
                                                </span>
                                            </span>
                                            <span className="text-right tabular-nums">
                                                <span className="font-bold text-brand-text">{formatCurrency(take, storeSettings)}</span>
                                                <span className="block text-[11px] text-brand-text-muted">
                                                    {take >= due - 0.004 && take > 0 ? 'paid in full' : take > 0 ? `of ${formatCurrency(due, storeSettings)}` : 'not this time'}
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                    {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
                </div>

                <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-border bg-surface">
                    <button type="button" onClick={onClose} disabled={saving} className="px-5 py-3 text-sm font-bold text-brand-text-muted hover:text-brand-text">Cancel</button>
                    <button type="submit" disabled={invalid || saving} className="flex-1 py-3 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50">
                        {saving ? 'Saving…' : value > 0 ? `Pay ${formatCurrency(value, storeSettings)}` : 'Pay supplier'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PaySupplierModal;
