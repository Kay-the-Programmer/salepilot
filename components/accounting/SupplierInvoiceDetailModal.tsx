import React from 'react';
import { SupplierInvoice, StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import CalendarIcon from '../icons/CalendarIcon';
import BanknotesIcon from '../icons/BanknotesIcon';
import { formatCurrency } from '../../utils/currency';

interface SupplierInvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: SupplierInvoice;
    onRecordPayment: (invoice: SupplierInvoice) => void;
    storeSettings: StoreSettings;
}

const LABEL = 'text-[11px] font-bold text-brand-text-muted uppercase tracking-wider';

const SupplierInvoiceDetailModal: React.FC<SupplierInvoiceDetailModalProps> = ({ isOpen, onClose, invoice, onRecordPayment, storeSettings }) => {
    if (!isOpen) return null;

    // Prefer payment records when present; guard against an empty array reading as 0 paid.
    const paid = (invoice.payments && invoice.payments.length > 0)
        ? invoice.payments.reduce((s, p) => s + p.amount, 0)
        : (invoice.amountPaid || 0);
    const balanceDue = invoice.amount - paid;
    const isPaid = balanceDue <= 0.001;
    const isOverdue = !isPaid && new Date(invoice.dueDate) < new Date();
    const statusChip = isPaid
        ? 'bg-green-500/15 text-green-700 dark:text-green-400'
        : isOverdue ? 'bg-red-500/15 text-red-700 dark:text-red-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
    const statusLabel = isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Outstanding';

    const InfoCard: React.FC<{ label: string; value: string; icon: React.FC<{ className?: string }>; danger?: boolean }> = ({ label, value, icon: Icon, danger }) => (
        <div className="bg-surface-variant border border-brand-border rounded-xl p-3">
            <div className={LABEL + ' mb-1'}>{label}</div>
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-brand-text-muted flex-shrink-0" />
                <span className={`text-sm font-bold ${danger ? 'text-danger' : 'text-brand-text'} truncate`}>{value}</span>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-warm-900/50 backdrop-blur-sm animate-fade-in" />

            <div
                className="relative bg-surface w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:animate-scale-up max-h-[95vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-brand-border">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ClipboardDocumentListIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-brand-text tracking-tight leading-tight">Invoice Details</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusChip}`}>{statusLabel}</span>
                            </div>
                            <p className="text-xs text-brand-text-muted truncate">Ref: {invoice.invoiceNumber}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg text-brand-text-muted hover:bg-surface-variant transition-colors flex-shrink-0">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                    {/* Amounts */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-surface-variant border border-brand-border p-3 text-center">
                            <div className={LABEL}>Total</div>
                            <div className="text-base font-black text-brand-text mt-1">{formatCurrency(invoice.amount, storeSettings)}</div>
                        </div>
                        <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-center">
                            <div className="text-[11px] font-bold text-success uppercase tracking-wider">Paid</div>
                            <div className="text-base font-black text-success mt-1">{formatCurrency(paid, storeSettings)}</div>
                        </div>
                        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                            <div className="text-[11px] font-bold text-primary uppercase tracking-wider">Balance</div>
                            <div className="text-base font-black text-primary mt-1">{formatCurrency(balanceDue, storeSettings)}</div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <InfoCard label="Supplier" value={invoice.supplierName} icon={BuildingOfficeIcon} />
                        <InfoCard label="PO Number" value={invoice.poNumber} icon={ClipboardDocumentListIcon} />
                        <InfoCard label="Issue Date" value={new Date(invoice.invoiceDate).toLocaleDateString()} icon={CalendarIcon} />
                        <InfoCard label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString()} icon={CalendarIcon} danger={isOverdue} />
                    </div>

                    {/* Payment history */}
                    <div>
                        <div className={LABEL + ' mb-2'}>Payment History</div>
                        {invoice.payments.length > 0 ? (
                            <div className="overflow-hidden border border-brand-border rounded-xl divide-y divide-brand-border">
                                {invoice.payments.map((p, idx) => (
                                    <div key={p.id || idx} className="px-4 py-3 flex items-center justify-between hover:bg-surface-variant transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center flex-shrink-0">
                                                <BanknotesIcon className="w-4 h-4 text-brand-text-muted" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-brand-text capitalize truncate">{p.method.replace('_', ' ')}</p>
                                                <p className="text-xs text-brand-text-muted truncate">{new Date(p.date).toLocaleDateString()} · {p.reference || 'No ref'}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-brand-text flex-shrink-0">{formatCurrency(p.amount, storeSettings)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 border-2 border-dashed border-brand-border rounded-xl flex flex-col items-center justify-center text-center">
                                <div className="w-11 h-11 bg-surface-variant rounded-xl flex items-center justify-center mb-2">
                                    <BanknotesIcon className="w-5 h-5 text-brand-text-muted" />
                                </div>
                                <p className="text-sm font-semibold text-brand-text">No payments yet</p>
                                <p className="text-xs text-brand-text-muted mt-1">Record a payment to settle this invoice</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-surface">
                    {balanceDue > 0 && (
                        <button
                            onClick={() => onRecordPayment(invoice)}
                            className="flex items-center gap-2 px-5 py-3 bg-secondary hover:brightness-95 text-white rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
                        >
                            <BanknotesIcon className="w-5 h-5" />
                            Record Payment
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierInvoiceDetailModal;
