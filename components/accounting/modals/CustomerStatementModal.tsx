import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Customer, Sale, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import DocumentChartBarIcon from '../../icons/DocumentChartBarIcon';
import XMarkIcon from '../../icons/XMarkIcon';
import PrinterIcon from '../../icons/PrinterIcon';

interface CustomerStatementModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer;
    sales: Sale[];
    storeSettings: StoreSettings;
}

const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({ isOpen, onClose, customer, sales, storeSettings }) => {
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const customerSales = sales
        .filter(s => s.customerId === customer.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const statementLines = customerSales.flatMap(sale => {
        const lines: { date: string; description: string; amount: number; type: 'invoice' | 'payment' }[] = [{
            date: sale.timestamp,
            description: `Invoice #${sale.transactionId}`,
            amount: sale.total,
            type: 'invoice' as const,
        }];

        (sale.payments || []).forEach(p => {
            lines.push({
                date: p.date || '',
                description: `Payment received — ${p.method}`,
                amount: -p.amount,
                type: 'payment' as const,
            });
        });

        return lines;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const finalLines = statementLines.map(line => {
        runningBalance += line.amount;
        return { ...line, balance: runningBalance };
    });

    const handlePrint = () => {
        const printContents = printRef.current?.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow && printContents) {
            printWindow.document.write('<html lang="en"><head><title>Customer Statement</title>');
            printWindow.document.write('<style>body{font-family:sans-serif;font-size:12px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background-color:#f2f2f2;} tr:nth-child(even){background-color:#f9f9f9;} .text-right{text-align:right;} .header{margin-bottom:20px;} h1,h2,h3{margin:0;} .total-row{font-weight:bold;background-color:#f2f2f2;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
        }
    };

    const LABEL = 'text-[11px] font-bold text-brand-text-muted uppercase tracking-wider';

    return createPortal(
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
                            <DocumentChartBarIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-brand-text tracking-tight leading-tight">Customer Statement</h3>
                            <p className="text-xs text-brand-text-muted">As of {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg text-brand-text-muted hover:bg-surface-variant transition-colors flex-shrink-0">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 overflow-y-auto flex-1 custom-scrollbar" ref={printRef}>
                    {/* Party + balance */}
                    <div className="rounded-2xl bg-surface-variant border border-brand-border p-5 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-brand-text truncate">{customer.name}</h2>
                                <div className="mt-2 space-y-1">
                                    {customer.email && <p className="text-sm text-brand-text-muted truncate">{customer.email}</p>}
                                    {customer.phone && <p className="text-sm text-brand-text-muted">{customer.phone}</p>}
                                    {customer.address && <p className="text-sm text-brand-text-muted">{customer.address.street}, {customer.address.city}, {customer.address.state} {customer.address.zip}</p>}
                                </div>
                            </div>
                            <div className="sm:text-right">
                                <div className={LABEL}>Current Balance</div>
                                <div className="text-3xl font-black text-primary tracking-tight mt-1">{formatCurrency(customer.accountBalance, storeSettings)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Ledger */}
                    <div className="overflow-x-auto rounded-2xl border border-brand-border">
                        <table className="min-w-full divide-y divide-brand-border">
                            <thead className="bg-surface-variant">
                                <tr>
                                    <th className={`px-4 py-3 text-left ${LABEL}`}>Date</th>
                                    <th className={`px-4 py-3 text-left ${LABEL}`}>Description</th>
                                    <th className={`px-4 py-3 text-right ${LABEL}`}>Amount</th>
                                    <th className={`px-4 py-3 text-right ${LABEL}`}>Balance</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-brand-border">
                                {finalLines.map((line, index) => (
                                    <tr key={index} className="hover:bg-surface-variant transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-text-muted font-medium">
                                            {new Date(line.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-brand-text">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${line.type === 'payment' ? 'bg-success' : 'bg-primary'}`}></span>
                                                <span className="font-semibold">{line.description}</span>
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold ${line.type === 'payment' ? 'text-success' : 'text-brand-text'}`}>
                                            {formatCurrency(line.amount, storeSettings)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-brand-text">
                                            {formatCurrency(line.balance, storeSettings)}
                                        </td>
                                    </tr>
                                ))}
                                {finalLines.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-brand-text-muted">No transactions on record for this customer.</td>
                                    </tr>
                                )}
                                <tr className="bg-surface-variant">
                                    <td colSpan={3} className={`px-4 py-4 text-right ${LABEL}`}>Current Balance Due</td>
                                    <td className="px-4 py-4 text-right font-black text-primary text-lg">{formatCurrency(customer.accountBalance, storeSettings)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-surface">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-brand-text bg-surface-variant rounded-xl hover:brightness-95 transition-all active:scale-95"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Print
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CustomerStatementModal;
