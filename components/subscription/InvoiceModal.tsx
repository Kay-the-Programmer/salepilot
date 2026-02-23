import React from 'react';
import { SubscriptionHistoryItem } from '../../types/subscription';
import XMarkIcon from '../icons/XMarkIcon';
import { Button } from '../ui/Button';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: SubscriptionHistoryItem;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, invoice }) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
            <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900 w-full max-w-2xl rounded-[32px] overflow-hidden animate-slide-up border border-slate-100 dark:border-slate-800 print:-none print:border-none print:w-full print:max-w-none print:rounded-none">
                {/* Header */}
                <div className="relative p-8 border-b border-slate-100 dark:border-slate-800 print:border-b-2 print:border-slate-900">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Invoice</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">#{invoice.invoiceId || invoice.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">SalePilot</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                123 Business Road<br />
                                Lusaka, Zambia
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute -right-3 -top-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all print:hidden"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Bill To */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Bill To</h3>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Valued Customer</p>
                            {/* In a real app, we'd pass user/store details here */}
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Date</h3>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="pb-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</th>
                                <th className="pb-3 text-right text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            <tr>
                                <td className="py-4">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{invoice.planName} Subscription</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {new Date(invoice.startDate).toLocaleDateString()} - {new Date(invoice.endDate).toLocaleDateString()}
                                    </p>
                                </td>
                                <td className="py-4 text-right text-sm font-bold text-slate-900 dark:text-white">
                                    {invoice.currency} {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-slate-100 dark:border-slate-800">
                                <td className="pt-4 text-sm font-bold text-slate-900 dark:text-white text-right">Total</td>
                                <td className="pt-4 text-right text-lg font-black text-indigo-600 dark:text-indigo-400">
                                    {invoice.currency} {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50/50 dark:bg-white/5 border-t border-slate-50 dark:border-slate-800/50 print:bg-white print:border-t-2 print:border-slate-900">
                    <div className="flex justify-between items-center print:hidden">
                        <Button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors active:scale-95 transition-all duration-300"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Invoice
                        </Button>
                        <Button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors bg-transparent"
                        >
                            Close
                        </Button>
                    </div>
                    <div className="hidden print:block text-center text-xs text-slate-500 mt-8">
                        <p>Thank you for your business!</p>
                        <p className="mt-1">For any questions, please contact support@salepilot.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
