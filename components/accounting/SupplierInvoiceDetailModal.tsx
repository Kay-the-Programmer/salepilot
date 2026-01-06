import React from 'react';
import { SupplierInvoice, StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../ui/Button';

interface SupplierInvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: SupplierInvoice;
    onRecordPayment: (invoice: SupplierInvoice) => void;
    storeSettings: StoreSettings;
}

const SupplierInvoiceDetailModal: React.FC<SupplierInvoiceDetailModalProps> = ({ isOpen, onClose, invoice, onRecordPayment, storeSettings }) => {
    if (!isOpen) return null;

    const balanceDue = invoice.amount - invoice.amountPaid;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-2xl">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Supplier Invoice Details</h3>
                        <p className="text-sm text-gray-500">Invoice #: {invoice.invoiceNumber}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                                    <dd className="mt-1 text-md text-gray-900 font-semibold">{invoice.supplierName}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Purchase Order</dt>
                                    <dd className="mt-1 text-md text-gray-900">{invoice.poNumber}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Invoice Date</dt>
                                    <dd className="mt-1 text-md text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                                    <dd className="mt-1 text-md text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</dd>
                                </div>
                            </dl>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Total Amount</span><span>{formatCurrency(invoice.amount, storeSettings)}</span></div>
                                <div className="flex justify-between text-green-600"><span>Amount Paid</span><span>{formatCurrency(invoice.amountPaid, storeSettings)}</span></div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 text-red-600"><span>Balance Due</span><span>{formatCurrency(balanceDue, storeSettings)}</span></div>
                            </dl>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Payment History</h4>
                        {invoice.payments.length > 0 ? (
                            <ul className="divide-y divide-gray-200 border rounded-md">
                                {invoice.payments.map(p => (
                                    <li key={p.id} className="px-4 py-3 grid grid-cols-4 gap-4 text-sm">
                                        <span>{new Date(p.date).toLocaleDateString()}</span>
                                        <span className="capitalize">{p.method.replace('_', ' ')}</span>
                                        <span className="text-gray-500">{p.reference || ''}</span>
                                        <span className="font-medium text-right">{formatCurrency(p.amount, storeSettings)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No payments recorded for this invoice.</p>
                        )}
                    </div>

                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3 border-t">
                    {balanceDue > 0 && (
                        <Button onClick={() => onRecordPayment(invoice)} variant="success">
                            Record Payment
                        </Button>
                    )}
                    <Button onClick={onClose} variant="primary">
                        Close
                    </Button>
                </div>
            </div>
        </div>

    );
};

export default SupplierInvoiceDetailModal;
