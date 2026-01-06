import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SupplierInvoice, PurchaseOrder, Supplier } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import { InputField } from '../ui/InputField';
import { Button } from '../ui/Button';

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
        setInvoice(prev => ({
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
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                        <h3 className="text-lg font-medium text-gray-900">{invoiceToEdit ? 'Edit' : 'Record'} Supplier Invoice</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                                <select value={selectedSupplierId} onChange={handleSupplierSelect} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all">
                                    <option value="" disabled>-- Select Supplier --</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Link to Purchase Order</label>
                                <select name="purchaseOrderId" value={invoice.purchaseOrderId} onChange={handlePOSelect} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" disabled={!selectedSupplierId}>
                                    <option value="">-- Select PO --</option>
                                    {availablePOs.map(po => <option key={po.id} value={po.id}>{po.poNumber} - {new Date(po.createdAt).toLocaleDateString()}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                                label="Supplier's Invoice #"
                                name="invoiceNumber"
                                value={invoice.invoiceNumber || ''}
                                onChange={handleChange}
                                required
                            />
                            <InputField
                                label="Invoice Amount"
                                name="amount"
                                type="number"
                                value={invoice.amount?.toString() || ''}
                                onChange={handleChange}
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                                label="Invoice Date"
                                name="invoiceDate"
                                type="date"
                                value={invoice.invoiceDate || ''}
                                onChange={handleChange}
                                required
                            />
                            <InputField
                                label="Due Date"
                                name="dueDate"
                                type="date"
                                value={invoice.dueDate || ''}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t gap-3">
                        <Button type="submit" disabled={isInvalid} variant="primary">Save Invoice</Button>
                        <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default SupplierInvoiceFormModal;