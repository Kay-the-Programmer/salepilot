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

    // Calculate amount paid from payments array if available, as it might be more up-to-date than the static field
    // especially after immediate client-side updates
    const calculatedAmountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? invoice.amountPaid;
    const balanceDue = Math.max(0, invoice.total - calculatedAmountPaid);

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
                            <p>${typeof storeSettings.address === 'object'
                // @ts-ignore - Runtime check for legacy/mixed data types
                ? `${(storeSettings.address as any).street || ''}, ${(storeSettings.address as any).city || ''}, ${(storeSettings.address as any).state || ''} ${(storeSettings.address as any).zip || ''}`
                : storeSettings.address}
                            </p>
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
                                        <td class="text-right">${formatCurrency(calculatedAmountPaid, storeSettings)}</td>
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
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
            <div className="liquid-glass-card rounded-[2rem] glass-effect !/95 dark:!bg-slate-900/95 w-full rounded-t-3xl sm: max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-4xl">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Invoice Details</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{invoice.transactionId}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-95 transition-all duration-300">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Bill To:</h4>
                            <p className="text-slate-600 dark:text-slate-300">{customerName || invoice.customerName || 'Unknown Customer'}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-slate-100">Invoice Date:</span> {new Date(invoice.timestamp).toLocaleDateString()}</p>
                            <p className="text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-slate-100">Due Date:</span> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 mb-6">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Item</th>
                                <th className="px-4 py-3 text-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Qty</th>
                                <th className="px-4 py-3 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Price</th>
                                <th className="px-4 py-3 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
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
                        <div className="space-y-4">
                            {(invoice.payments?.length || 0) > 0 && (
                                <>
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Payment History</h4>
                                    <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
                                        <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                            {invoice.payments?.map(p => (
                                                <li key={p.id} className="px-4 py-2.5 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors active:scale-95 transition-all duration-300">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">{new Date(p.date).toLocaleDateString()} · {p.method}</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount, storeSettings)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="text-right space-y-2 text-sm">
                            <p><strong>Subtotal:</strong> {formatCurrency(invoice.subtotal, storeSettings)}</p>
                            <p><strong>Tax:</strong> {formatCurrency(invoice.tax, storeSettings)}</p>
                            <p className="text-lg font-bold"><strong>Total:</strong> {formatCurrency(invoice.total, storeSettings)}</p>
                            <p className="text-green-600"><strong>Paid:</strong> {formatCurrency(calculatedAmountPaid, storeSettings)}</p>
                            <p className="text-xl font-bold text-red-600 border-t pt-2 mt-2"><strong>Balance Due:</strong> {formatCurrency(balanceDue, storeSettings)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-5 sm:px-8 flex flex-row flex-wrap gap-3 border-t border-slate-200 dark:border-slate-800 justify-end transition-colors">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 active:scale-95 transition-all duration-300"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Print
                    </button>
                    {balanceDue > 0 && (
                        <button
                            type="button"
                            onClick={() => onRecordPayment(invoice)}
                            className="px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                        >
                            Record Payment
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-950 rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesInvoiceDetailModal;