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
            type: 'invoice' as const
        }];

        (sale.payments || []).forEach(p => {
            lines.push({
                date: p.date || '',
                description: `Payment Received - ${p.method}`,
                amount: -p.amount,
                type: 'payment' as const
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

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                <div className="px-6 py-5 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                <DocumentChartBarIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Customer Statement</h3>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <XMarkIcon className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto overflow-x-auto" ref={printRef}>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                                <div className="mt-2 space-y-1">
                                    {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
                                    {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
                                    {customer.address && <p className="text-sm text-slate-600">{customer.address.street}, {customer.address.city}, {customer.address.state} {customer.address.zip}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-500">Statement Date</div>
                                <div className="text-lg font-bold text-slate-900">{new Date().toLocaleDateString()}</div>
                                <div className="mt-4">
                                    <div className="text-sm text-slate-500">Current Balance</div>
                                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(customer.accountBalance, storeSettings)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {finalLines.map((line, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                            {new Date(line.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${line.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                                {line.description}
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${line.type === 'payment' ? 'text-green-600' : 'text-slate-900'}`}>
                                            {formatCurrency(line.amount, storeSettings)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-slate-900">
                                            {formatCurrency(line.balance, storeSettings)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                                    <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-900">Current Balance Due</td>
                                    <td className="px-4 py-4 text-right font-bold text-blue-700">{formatCurrency(customer.accountBalance, storeSettings)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gradient-to-b from-white to-slate-50 px-6 py-5 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Print Statement
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
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
