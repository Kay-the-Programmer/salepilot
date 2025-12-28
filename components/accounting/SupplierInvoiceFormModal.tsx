import React, { useState, useEffect, useMemo } from 'react';
import { SupplierInvoice, PurchaseOrder, Supplier } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            setInvoice(prev => ({...prev, ...getInitialState(po)}));
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

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
             <div className="bg-white rounded-lg shadow-xl sm:max-w-2xl w-full m-4">
                 <form onSubmit={handleSubmit}>
                     <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                         <h3 className="text-lg font-medium text-gray-900">{invoiceToEdit ? 'Edit' : 'Record'} Supplier Invoice</h3>
                         <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                     </div>
                     <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-700">Supplier</label>
                               <select value={selectedSupplierId} onChange={handleSupplierSelect} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                                   <option value="" disabled>-- Select Supplier --</option>
                                   {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                               </select>
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-gray-700">Link to Purchase Order</label>
                               <select name="purchaseOrderId" value={invoice.purchaseOrderId} onChange={handlePOSelect} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" disabled={!selectedSupplierId}>
                                   <option value="">-- Select PO --</option>
                                   {availablePOs.map(po => <option key={po.id} value={po.id}>{po.poNumber} - {new Date(po.createdAt).toLocaleDateString()}</option>)}
                               </select>
                           </div>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Supplier's Invoice #</label>
                                <input type="text" name="invoiceNumber" value={invoice.invoiceNumber} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Invoice Amount</label>
                                <input type="number" name="amount" value={invoice.amount || ''} onChange={handleChange} step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                                <input type="date" name="invoiceDate" value={invoice.invoiceDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                <input type="date" name="dueDate" value={invoice.dueDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                         </div>
                     </div>
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                        <button type="submit" disabled={isInvalid} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-400">Save Invoice</button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                    </div>
                 </form>
             </div>
        </div>
    );
};

export default SupplierInvoiceFormModal;