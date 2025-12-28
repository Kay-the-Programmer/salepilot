import React from 'react';
import { Sale, StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import PrinterIcon from '../icons/PrinterIcon';
import { formatCurrency } from '../../utils/currency';

interface SalesInvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Sale;
    onRecordPayment: (invoice: Sale) => void;
    storeSettings: StoreSettings;
    customerName?: string;
}

const SalesInvoiceDetailModal: React.FC<SalesInvoiceDetailModalProps> = ({ isOpen, onClose, invoice, onRecordPayment, storeSettings, customerName }) => {
    if (!isOpen) return null;

    const balanceDue = invoice.total - invoice.amountPaid;

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=600');
        if (!printWindow) {
            alert('Could not open print window. Please check your browser\'s pop-up blocker settings.');
            return;
        }
    
        const html = `
            <html>
                <head>
                    <title>Invoice ${invoice.transactionId}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333; }
                        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                        .header, .footer { text-align: center; margin-bottom: 20px; }
                        .header h1 { margin: 0; font-size: 24px; color: #000; }
                        .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
                        .details div { width: 48%; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
                        th { background-color: #f9f9f9; font-weight: 600; }
                        .text-right { text-align: right; }
                        .totals { float: right; width: 40%; }
                        .totals table { width: 100%; }
                        .totals td { border: none; }
                        .totals .label { font-weight: 600; }
                        .balance-due { font-size: 1.2em; font-weight: bold; color: #d9534f; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Invoice</h1>
                            <p>${storeSettings.name}</p>
                            <p>${storeSettings.address}</p>
                        </div>
                        <div class="details">
                            <div>
                                <strong>Bill To:</strong><br>
                                ${customerName || invoice.customerName || 'N/A'}
                            </div>
                            <div class="text-right">
                                <strong>Invoice #:</strong> ${invoice.transactionId}<br>
                                <strong>Date:</strong> ${new Date(invoice.timestamp).toLocaleDateString()}<br>
                                <strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th class="text-right">Quantity</th>
                                    <th class="text-right">Unit Price</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.cart.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td class="text-right">${item.quantity}</td>
                                        <td class="text-right">${formatCurrency(item.price, storeSettings)}</td>
                                        <td class="text-right">${formatCurrency(item.price * item.quantity, storeSettings)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div style="clear: both;"></div>
                        <div class="totals">
                            <table>
                                <tbody>
                                    <tr>
                                        <td class="label">Subtotal:</td>
                                        <td class="text-right">${formatCurrency(invoice.subtotal, storeSettings)}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Tax (${storeSettings.taxRate}%):</td>
                                        <td class="text-right">${formatCurrency(invoice.tax, storeSettings)}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Total:</td>
                                        <td class="text-right">${formatCurrency(invoice.total, storeSettings)}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Amount Paid:</td>
                                        <td class="text-right">${formatCurrency(invoice.amountPaid, storeSettings)}</td>
                                    </tr>
                                    <tr>
                                        <td class="label balance-due">Balance Due:</td>
                                        <td class="text-right balance-due">${formatCurrency(balanceDue, storeSettings)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </body>
            </html>
        `;
    
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-4xl w-full">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
                        <p className="text-sm text-gray-500">{invoice.transactionId}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div>
                            <h4 className="font-semibold text-gray-800">Bill To:</h4>
                            <p>{customerName || invoice.customerName || 'Unknown Customer'}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>Invoice Date:</strong> {new Date(invoice.timestamp).toLocaleDateString()}</p>
                            <p><strong>Due Date:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200 mb-6">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoice.cart.map(item => (
                                <tr key={item.productId}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{item.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{item.quantity}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.price, storeSettings)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.price * item.quantity, storeSettings)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                             {(invoice.payments?.length || 0) > 0 && (
                                <>
                                <h4 className="font-semibold text-gray-800 mb-2">Payments</h4>
                                <ul className="divide-y divide-gray-200 border rounded-md">
                                    {invoice.payments?.map(p => (
                                        <li key={p.id} className="px-3 py-2 flex justify-between text-sm">
                                            <span>{new Date(p.date).toLocaleDateString()} - {p.method}</span>
                                            <span className="font-medium text-green-600">{formatCurrency(p.amount, storeSettings)}</span>
                                        </li>
                                    ))}
                                </ul>
                                </>
                            )}
                        </div>
                        <div className="text-right space-y-2 text-sm">
                            <p><strong>Subtotal:</strong> {formatCurrency(invoice.subtotal, storeSettings)}</p>
                            <p><strong>Tax:</strong> {formatCurrency(invoice.tax, storeSettings)}</p>
                            <p className="text-lg font-bold"><strong>Total:</strong> {formatCurrency(invoice.total, storeSettings)}</p>
                            <p className="text-green-600"><strong>Paid:</strong> {formatCurrency(invoice.amountPaid, storeSettings)}</p>
                            <p className="text-xl font-bold text-red-600 border-t pt-2 mt-2"><strong>Balance Due:</strong> {formatCurrency(balanceDue, storeSettings)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3 border-t">
                    <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                        <PrinterIcon className="w-5 h-5"/> Print
                    </button>
                    {balanceDue > 0 && (
                        <button onClick={() => onRecordPayment(invoice)} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                            Record Payment
                        </button>
                    )}
                    <button onClick={onClose} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesInvoiceDetailModal;