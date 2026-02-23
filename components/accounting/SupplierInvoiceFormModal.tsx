import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SupplierInvoice, PurchaseOrder, Supplier } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import TagIcon from '../icons/TagIcon';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import CalendarIcon from '../icons/CalendarIcon';
import { InputField } from '../ui/InputField';

interface SupplierInvoiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoice: SupplierInvoice) => void;
    invoiceToEdit?: SupplierInvoice | null;
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
}

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


const SupplierInvoiceFormModal: React.FC<SupplierInvoiceFormModalProps> = ({ isOpen, onClose, onSave, invoiceToEdit, purchaseOrders, suppliers }) => {
    const [invoice, setInvoice] = useState<Partial<SupplierInvoice>>(getInitialState());
    const [selectedSupplierId, setSelectedSupplierId] = useState('');

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
            supplierName: supplier?.name
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
            alert("Please fill in all required fields.");
            return;
        }

        const finalInvoice: SupplierInvoice = {
            id: invoiceToEdit?.id || `inv-sup-${Date.now()}`,
            amountPaid: invoiceToEdit?.amountPaid || 0,
            status: invoiceToEdit?.status || 'unpaid',
            payments: invoiceToEdit?.payments || [],
            ...invoice
        } as SupplierInvoice;

        onSave(finalInvoice);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            <div className="liquid-glass-card rounded-[2rem] relative glass-effect !/95 dark:!bg-slate-900/95 w-full sm:max-w-xl max-h-[96vh] sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden flex flex-col animate-slide-up bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50">
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-6 sm:px-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                {invoiceToEdit ? 'Edit' : 'Record'} Invoice
                            </h3>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                Supplier Accounts Payable
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-all duration-300"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 space-y-8 custom-scrollbar">
                        {/* Section: Partnership */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <BuildingOfficeIcon className="w-4 h-4" />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Partner Intelligence</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Supplier Entity</label>
                                    <div className="relative">
                                        <BuildingOfficeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                        <select
                                            value={selectedSupplierId}
                                            onChange={handleSupplierSelect}
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-900 dark:text-slate-100 font-bold shadow-sm"
                                        >
                                            <option value="" disabled className="dark:bg-slate-900">Select Supplier</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Linked PO Reference</label>
                                    <div className="relative">
                                        <ClipboardDocumentListIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                        <select
                                            name="purchaseOrderId"
                                            value={invoice.purchaseOrderId}
                                            onChange={handlePOSelect}
                                            required
                                            disabled={!selectedSupplierId}
                                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-900 dark:text-slate-100 font-bold shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-400 dark:disabled:text-slate-600"
                                        >
                                            <option value="" className="dark:bg-slate-900">Select PO Reference</option>
                                            {availablePOs.map(po => <option key={po.id} value={po.id} className="dark:bg-slate-900">{po.poNumber} — {new Date(po.createdAt).toLocaleDateString()}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Invoice Identity */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                    <TagIcon className="w-4 h-4" />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Invoice Details</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField
                                    label="External Invoice #"
                                    name="invoiceNumber"
                                    value={invoice.invoiceNumber || ''}
                                    onChange={handleChange}
                                    required
                                    placeholder="INV-2024-001"
                                    icon={<TagIcon className="h-4 w-4" />}
                                    className="!font-black text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 focus:ring-blue-500/20 shadow-sm"
                                />
                                <InputField
                                    label="Absolute Amount"
                                    name="amount"
                                    type="number"
                                    value={invoice.amount?.toString() || ''}
                                    onChange={handleChange}
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    icon={<CurrencyDollarIcon className="h-4 w-4" />}
                                    className="!font-black text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 focus:ring-blue-500/20 shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField
                                    label="Issue Date"
                                    name="invoiceDate"
                                    type="date"
                                    value={invoice.invoiceDate || ''}
                                    onChange={handleChange}
                                    required
                                    icon={<CalendarIcon className="h-4 w-4" />}
                                    className="!font-black text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 focus:ring-blue-500/20 shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
                                />
                                <InputField
                                    label="Maturity (Due) Date"
                                    name="dueDate"
                                    type="date"
                                    value={invoice.dueDate || ''}
                                    onChange={handleChange}
                                    required
                                    icon={<CalendarIcon className="h-4 w-4" />}
                                    className="!font-black text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 focus:ring-blue-500/20 shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-6 sm:px-8 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 sm:flex sm:flex-row-reverse gap-4">
                        <button
                            type="submit"
                            disabled={isInvalid}
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.5rem] font-bold text-sm hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-xl shadow-slate-900/10 dark:shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all duration-300"
                        >
                            <ClipboardDocumentListIcon className="w-5 h-5" />
                            {invoiceToEdit ? 'Finalize Changes' : 'Record Invoice'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto mt-3 sm:mt-0 px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98] flex items-center justify-center active:scale-95 transition-all duration-300"
                        >
                            Discard
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default SupplierInvoiceFormModal;