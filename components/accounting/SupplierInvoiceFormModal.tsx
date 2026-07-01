import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SupplierInvoice, PurchaseOrder, Supplier, StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';

interface SupplierInvoiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoice: SupplierInvoice) => void;
    invoiceToEdit?: SupplierInvoice | null;
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    storeSettings?: StoreSettings;
}

// One field language for the whole form (shared with the expense modal).
const FIELD = 'w-full px-4 py-3 rounded-xl text-sm font-semibold bg-surface-variant text-brand-text border border-brand-border focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';
const LABEL = 'block text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5';

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
        <select {...props} className={FIELD + ' appearance-none pr-10' + (props.disabled ? ' opacity-60' : '')} />
        <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
    </div>
);

const getInitialState = (po?: PurchaseOrder): Partial<SupplierInvoice> => ({
    invoiceNumber: '',
    supplierId: po?.supplierId || '',
    supplierName: po?.supplierName || '',
    purchaseOrderId: po?.id || '',
    poNumber: po?.poNumber || '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: po?.total || 0,
});

const SupplierInvoiceFormModal: React.FC<SupplierInvoiceFormModalProps> = ({ isOpen, onClose, onSave, invoiceToEdit, purchaseOrders, suppliers, storeSettings }) => {
    const [invoice, setInvoice] = useState<Partial<SupplierInvoice>>(getInitialState());
    const [selectedSupplierId, setSelectedSupplierId] = useState('');

    const symbol = storeSettings?.currency?.symbol ?? '';

    useEffect(() => {
        if (isOpen) {
            if (invoiceToEdit) {
                setInvoice(invoiceToEdit);
                setSelectedSupplierId(invoiceToEdit.supplierId);
            } else {
                setInvoice(getInitialState());
                setSelectedSupplierId('');
            }
        }
    }, [invoiceToEdit, isOpen]);

    const availablePOs = useMemo(() => {
        return purchaseOrders.filter(po =>
            po.supplierId === selectedSupplierId &&
            ['ordered', 'partially_received', 'received'].includes(po.status)
        );
    }, [selectedSupplierId, purchaseOrders]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInvoice(prev => ({ ...prev, [name]: value }));
    };

    const handleSupplierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSupplierId(e.target.value);
        const supplier = suppliers.find(s => s.id === e.target.value);
        setInvoice(() => ({
            ...getInitialState(),
            supplierId: supplier?.id,
            supplierName: supplier?.name,
        }));
    };

    const handlePOSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const poId = e.target.value;
        const po = purchaseOrders.find(p => p.id === poId);
        if (po) {
            setInvoice(prev => ({ ...prev, ...getInitialState(po) }));
        } else {
            handleSupplierSelect({ target: { value: selectedSupplierId } } as any);
        }
    };

    const isInvalid = !invoice.invoiceNumber || !invoice.supplierId || !invoice.purchaseOrderId || !invoice.amount || invoice.amount <= 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isInvalid) {
            alert('Please fill in all required fields.');
            return;
        }

        const finalInvoice: SupplierInvoice = {
            id: invoiceToEdit?.id || `inv-sup-${Date.now()}`,
            amountPaid: invoiceToEdit?.amountPaid || 0,
            status: invoiceToEdit?.status || 'unpaid',
            payments: invoiceToEdit?.payments || [],
            ...invoice,
        } as SupplierInvoice;

        onSave(finalInvoice);
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
                                <ClipboardDocumentListIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-brand-text tracking-tight leading-tight">
                                    {invoiceToEdit ? 'Edit Invoice' : 'Record Invoice'}
                                </h3>
                                <p className="text-xs text-brand-text-muted">Supplier bill — accounts payable</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-brand-text-muted hover:bg-surface-variant transition-colors flex-shrink-0"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Supplier + PO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Supplier</label>
                                <Select value={selectedSupplierId} onChange={handleSupplierSelect} required>
                                    <option value="">Select supplier…</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <label className={LABEL}>Purchase Order</label>
                                <Select
                                    name="purchaseOrderId"
                                    value={invoice.purchaseOrderId}
                                    onChange={handlePOSelect}
                                    required
                                    disabled={!selectedSupplierId}
                                >
                                    <option value="">{selectedSupplierId ? 'Select PO…' : 'Choose supplier first'}</option>
                                    {availablePOs.map(po => (
                                        <option key={po.id} value={po.id}>{po.poNumber} — {new Date(po.createdAt).toLocaleDateString()}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Invoice number + amount */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Invoice Number</label>
                                <input
                                    name="invoiceNumber"
                                    value={invoice.invoiceNumber || ''}
                                    onChange={handleChange}
                                    required
                                    placeholder="INV-2024-001"
                                    className={FIELD}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>Amount</label>
                                <div className="relative">
                                    {symbol && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-text-muted pointer-events-none">{symbol}</span>}
                                    <input
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={invoice.amount?.toString() || ''}
                                        onChange={handleChange}
                                        required
                                        placeholder="0.00"
                                        className={FIELD + (symbol ? ' pl-9' : '')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Issue Date</label>
                                <input
                                    name="invoiceDate"
                                    type="date"
                                    value={invoice.invoiceDate || ''}
                                    onChange={handleChange}
                                    required
                                    className={FIELD}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>Due Date</label>
                                <input
                                    name="dueDate"
                                    type="date"
                                    value={invoice.dueDate || ''}
                                    onChange={handleChange}
                                    required
                                    className={FIELD}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-border bg-surface">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 text-sm font-bold text-brand-text-muted hover:text-brand-text transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isInvalid}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                        >
                            <ClipboardDocumentListIcon className="w-5 h-5" />
                            {invoiceToEdit ? 'Update Invoice' : 'Record Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default SupplierInvoiceFormModal;
