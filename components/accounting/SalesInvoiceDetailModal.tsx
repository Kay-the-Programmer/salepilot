import React from 'react';
import { Sale, StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import PrinterIcon from '../icons/PrinterIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import { formatCurrency } from '../../utils/currency';

interface SalesInvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Sale;
    onRecordPayment: (invoice: Sale) => void;
    storeSettings: StoreSettings;
    customerName?: string;
}

const LABEL = 'text-[11px] font-bold text-brand-text-muted uppercase tracking-wider';

const SalesInvoiceDetailModal: React.FC<SalesInvoiceDetailModalProps> = ({ isOpen, onClose, invoice, onRecordPayment, storeSettings, customerName }) => {
    if (!isOpen) return null;

    // Prefer payment records when present; guard against an empty array reading as 0 paid.
    const calculatedAmountPaid = (invoice.payments && invoice.payments.length > 0)
        ? invoice.payments.reduce((sum, p) => sum + p.amount, 0)
        : (invoice.amountPaid || 0);
    const balanceDue = Math.max(0, invoice.total - calculatedAmountPaid);
    const isPaid = balanceDue <= 0.001;
    const isOverdue = !isPaid && !!invoice.dueDate && new Date(invoice.dueDate) < new Date();
    const statusChip = isPaid
        ? 'bg-green-500/15 text-green-700 dark:text-green-400'
        : isOverdue ? 'bg-red-500/15 text-red-700 dark:text-red-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
    const statusLabel = isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending';

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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-warm-900/50 backdrop-blur-sm animate-fade-in" />

            <div
                className="relative bg-surface w-full max-w-3xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:animate-scale-up max-h-[95vh]"
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
                            <p className="text-xs text-brand-text-muted truncate">#{invoice.transactionId}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg text-brand-text-muted hover:bg-surface-variant transition-colors flex-shrink-0">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                    {/* Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <div className={LABEL}>Bill To</div>
                            <p className="text-sm font-bold text-brand-text mt-1">{customerName || invoice.customerName || 'Unknown Customer'}</p>
                        </div>
                        <div className="sm:text-right space-y-1">
                            <p className="text-sm text-brand-text-muted"><span className="font-semibold text-brand-text">Invoice Date:</span> {new Date(invoice.timestamp).toLocaleDateString()}</p>
                            <p className="text-sm text-brand-text-muted"><span className="font-semibold text-brand-text">Due Date:</span> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    {/* Line items */}
                    <div className="overflow-x-auto rounded-2xl border border-brand-border">
                        <table className="min-w-full divide-y divide-brand-border">
                            <thead className="bg-surface-variant">
                                <tr>
                                    <th className={`px-4 py-3 text-left ${LABEL}`}>Item</th>
                                    <th className={`px-4 py-3 text-center ${LABEL}`}>Qty</th>
                                    <th className={`px-4 py-3 text-right ${LABEL}`}>Price</th>
                                    <th className={`px-4 py-3 text-right ${LABEL}`}>Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {invoice.cart.map(item => (
                                    <tr key={item.productId}>
                                        <td className="px-4 py-2.5 text-sm text-brand-text">{item.name}</td>
                                        <td className="px-4 py-2.5 text-sm text-center text-brand-text-muted">{item.quantity}</td>
                                        <td className="px-4 py-2.5 text-sm text-right text-brand-text-muted">{formatCurrency(item.price, storeSettings)}</td>
                                        <td className="px-4 py-2.5 text-sm text-right font-semibold text-brand-text">{formatCurrency(item.price * item.quantity, storeSettings)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Payment history */}
                        <div>
                            {(invoice.payments?.length || 0) > 0 && (
                                <>
                                    <div className={LABEL + ' mb-2'}>Payment History</div>
                                    <div className="overflow-hidden border border-brand-border rounded-xl">
                                        <ul className="divide-y divide-brand-border text-sm">
                                            {invoice.payments?.map(p => (
                                                <li key={p.id} className="px-4 py-2.5 flex justify-between hover:bg-surface-variant transition-colors">
                                                    <span className="text-brand-text-muted font-medium">{new Date(p.date).toLocaleDateString()} · {p.method}</span>
                                                    <span className="font-bold text-success">{formatCurrency(p.amount, storeSettings)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Totals */}
                        <div className="rounded-2xl bg-surface-variant border border-brand-border p-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-brand-text-muted">Subtotal</span><span className="font-semibold text-brand-text">{formatCurrency(invoice.subtotal, storeSettings)}</span></div>
                            <div className="flex justify-between"><span className="text-brand-text-muted">Tax</span><span className="font-semibold text-brand-text">{formatCurrency(invoice.tax, storeSettings)}</span></div>
                            <div className="flex justify-between pt-2 border-t border-brand-border"><span className="font-bold text-brand-text">Total</span><span className="font-bold text-brand-text">{formatCurrency(invoice.total, storeSettings)}</span></div>
                            <div className="flex justify-between"><span className="text-brand-text-muted">Paid</span><span className="font-semibold text-success">{formatCurrency(calculatedAmountPaid, storeSettings)}</span></div>
                            <div className="flex justify-between pt-2 border-t border-brand-border"><span className="font-black text-brand-text">Balance Due</span><span className="font-black text-danger text-base">{formatCurrency(balanceDue, storeSettings)}</span></div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-surface">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-brand-text bg-surface-variant rounded-xl hover:brightness-95 transition-all active:scale-95"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Print
                    </button>
                    {balanceDue > 0 && (
                        <button
                            type="button"
                            onClick={() => onRecordPayment(invoice)}
                            className="px-5 py-3 text-sm font-bold text-white bg-secondary hover:brightness-95 rounded-xl shadow-sm transition-all active:scale-95"
                        >
                            Record Payment
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesInvoiceDetailModal;
