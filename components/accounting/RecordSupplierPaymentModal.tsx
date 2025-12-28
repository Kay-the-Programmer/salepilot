import React, { useState, useEffect } from 'react';
import { SupplierInvoice, SupplierPayment, StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import { formatCurrency } from '../../utils/currency';

interface RecordSupplierPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: SupplierInvoice;
    onSave: (invoiceId: string, payment: Omit<SupplierPayment, 'id'>) => void;
    storeSettings: StoreSettings;
}

const RecordSupplierPaymentModal: React.FC<RecordSupplierPaymentModalProps> = ({ isOpen, onClose, invoice, onSave, storeSettings }) => {
    const balanceDue = invoice.amount - invoice.amountPaid;
    const [amount, setAmount] = useState(balanceDue.toFixed(2));
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('');
    const [reference, setReference] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount(balanceDue.toFixed(2));
            setDate(new Date().toISOString().split('T')[0]);
            setMethod(storeSettings.supplierPaymentMethods?.[0]?.name || '');
            setReference('');
        }
    }, [invoice, balanceDue, isOpen, storeSettings.supplierPaymentMethods]);
    
    if (!isOpen) return null;

    const isInvalid = isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || parseFloat(amount) > balanceDue + 0.001;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isInvalid) {
            alert("Invalid payment amount.");
            return;
        }
        const paymentAmount = parseFloat(amount);
        onSave(invoice.id, { date, amount: paymentAmount, method, reference });
        onClose();
    };
    
    return (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
             <div className="bg-white rounded-lg shadow-xl sm:max-w-lg w-full m-4">
                 <form onSubmit={handleSubmit}>
                     <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                         <div>
                            <h3 className="text-lg font-medium text-gray-900">Record Payment for Invoice {invoice.invoiceNumber}</h3>
                            <p className="text-sm text-gray-500 mt-1">Balance Due: {formatCurrency(balanceDue, storeSettings)}</p>
                         </div>
                         <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                     </div>
                     <div className="px-6 py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
                                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} max={balanceDue} step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                             <select value={method} onChange={e => setMethod(e.target.value as any)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                                {(storeSettings.supplierPaymentMethods || []).map(pm => (
                                    <option key={pm.id} value={pm.name}>{pm.name}</option>
                                ))}
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Reference / Check #</label>
                            <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                         </div>
                     </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                        <button type="submit" disabled={isInvalid} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-400">Record Payment</button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                    </div>
                 </form>
             </div>
        </div>
    )
};

export default RecordSupplierPaymentModal;