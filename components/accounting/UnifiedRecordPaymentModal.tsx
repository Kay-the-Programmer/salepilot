import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import CreditCardIcon from '../icons/CreditCardIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import { formatCurrency } from '../../utils/currency';

interface UnifiedRecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    invoiceId: string;
    invoiceNumber?: string;
    balanceDue: number;
    customerOrSupplierName?: string;
    paymentMethods: { id: string; name: string; }[];
    onSave: (invoiceId: string, payment: { date: string; amount: number; method: string; reference?: string }) => void;
    storeSettings: StoreSettings;
}

// Shared modal field language.
const FIELD = 'w-full px-4 py-3 rounded-xl text-sm font-semibold bg-surface-variant text-brand-text border border-brand-border focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';
const LABEL = 'block text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5';

const UnifiedRecordPaymentModal: React.FC<UnifiedRecordPaymentModalProps> = ({
    isOpen,
    onClose,
    title = 'Record Payment',
    invoiceId,
    invoiceNumber,
    balanceDue,
    customerOrSupplierName,
    paymentMethods,
    onSave,
    storeSettings,
}) => {
    const [amount, setAmount] = useState(balanceDue.toFixed(2));
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('');
    const [reference, setReference] = useState('');

    const symbol = storeSettings?.currency?.symbol ?? '';

    useEffect(() => {
        if (isOpen) {
            setAmount(balanceDue.toFixed(2));
            setDate(new Date().toISOString().split('T')[0]);
            setMethod(paymentMethods[0]?.id || paymentMethods[0]?.name || '');
            setReference('');
        }
    }, [invoiceId, balanceDue, isOpen, paymentMethods]);

    if (!isOpen) return null;

    const isInvalid = isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || parseFloat(amount) > balanceDue + 0.001;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isInvalid) {
            alert('Invalid payment amount.');
            return;
        }
        onSave(invoiceId, { date, amount: parseFloat(amount), method, reference });
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-warm-900/50 backdrop-blur-sm animate-fade-in" />

            <div
                className="relative bg-surface w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:animate-scale-up max-h-[95vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-brand-border">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <CreditCardIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-brand-text tracking-tight leading-tight">{title}</h3>
                                <p className="text-xs text-brand-text-muted truncate">Invoice {invoiceNumber || invoiceId}</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg text-brand-text-muted hover:bg-surface-variant transition-colors flex-shrink-0">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Balance summary */}
                        <div className="rounded-2xl bg-primary/5 border border-primary/15 px-5 py-4 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-[11px] font-bold text-primary/80 uppercase tracking-wider mb-1">Balance Due</div>
                                <div className="text-2xl font-black text-primary tracking-tight">{formatCurrency(balanceDue, storeSettings)}</div>
                            </div>
                            <div className="text-right min-w-0">
                                <div className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">Billed To</div>
                                <div className="text-sm font-bold text-brand-text truncate max-w-[160px]">{customerOrSupplierName || 'N/A'}</div>
                            </div>
                        </div>

                        {/* Amount + date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider">Amount</label>
                                    <button type="button" onClick={() => setAmount(balanceDue.toFixed(2))} className="text-[11px] font-bold text-primary hover:underline">
                                        Pay full
                                    </button>
                                </div>
                                <div className="relative">
                                    {symbol && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-text-muted pointer-events-none">{symbol}</span>}
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        max={balanceDue}
                                        step="0.01"
                                        required
                                        className={FIELD + (symbol ? ' pl-9' : '')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={LABEL}>Date</label>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={FIELD} />
                            </div>
                        </div>

                        {/* Method */}
                        <div>
                            <label className={LABEL}>Payment Method</label>
                            <div className="relative">
                                <select
                                    value={method}
                                    onChange={e => setMethod(e.target.value)}
                                    className={FIELD + ' appearance-none pr-10'}
                                >
                                    {paymentMethods.map(pm => (
                                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                                    ))}
                                    {paymentMethods.length === 0 && <option value="" disabled>No payment methods configured</option>}
                                </select>
                                <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                            </div>
                        </div>

                        {/* Reference */}
                        <div>
                            <label className={LABEL}>Reference <span className="text-brand-text-muted/60 normal-case font-medium">(optional)</span></label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Transaction / cheque #"
                                className={FIELD}
                            />
                        </div>
                    </div>

                    {/* Footer — Pay is a conversion action → orange (DESIGN.md) */}
                    <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-border bg-surface">
                        <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-brand-text-muted hover:text-brand-text transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isInvalid}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary hover:brightness-95 text-white text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                        >
                            <CreditCardIcon className="w-5 h-5" />
                            Record Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default UnifiedRecordPaymentModal;
