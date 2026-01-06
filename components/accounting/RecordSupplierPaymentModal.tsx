import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SupplierInvoice, SupplierPayment, StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import { formatCurrency } from '../../utils/currency';
import { InputField } from '../ui/InputField';
import { Button } from '../ui/Button';

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

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-lg">
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
                                <InputField
                                    label="Payment Amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    max={balanceDue}
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <InputField
                                    label="Payment Date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <select
                                value={method}
                                onChange={e => setMethod(e.target.value as any)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none"
                            >
                                {(storeSettings.supplierPaymentMethods || []).map(pm => (
                                    <option key={pm.id} value={pm.name}>{pm.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputField
                                label="Reference / Check #"
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-3 border-t">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isInvalid}
                            className="flex-1 sm:flex-none"
                        >
                            Record Payment
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
};

export default RecordSupplierPaymentModal;