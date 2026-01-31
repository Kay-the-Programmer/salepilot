import React, { useState, useMemo } from 'react';
import { SupplierInvoice, PurchaseOrder, StoreSettings, SupplierPayment, Supplier } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import PlusIcon from '../../icons/PlusIcon';
import DocumentChartBarIcon from '../../icons/DocumentChartBarIcon';
import BuildingOfficeIcon from '../../icons/BuildingOfficeIcon';
import EllipsisVerticalIcon from '../../icons/EllipsisVerticalIcon';
import EyeIcon from '../../icons/EyeIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import UnifiedRecordPaymentModal from '../UnifiedRecordPaymentModal';

interface APManagementViewProps {
    supplierInvoices: SupplierInvoice[];
    purchaseOrders: PurchaseOrder[];
    storeSettings: StoreSettings;
    onRecordPayment: (invoiceId: string, payment: Omit<SupplierPayment, 'id'>) => void;
    onSaveInvoice: (invoice: SupplierInvoice) => void;
    onViewInvoice: (invoice: SupplierInvoice) => void;
    suppliers: Supplier[];
    onOpenInvoiceForm: () => void;
}

const APManagementView: React.FC<APManagementViewProps> = ({ supplierInvoices, storeSettings, onRecordPayment, onViewInvoice, onOpenInvoiceForm }) => {
    const [invoiceToPay, setInvoiceToPay] = useState<SupplierInvoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

    const StatusBadge: React.FC<{ status: SupplierInvoice['status'] }> = ({ status }) => {
        const statusConfig = {
            unpaid: { color: 'from-amber-500 to-yellow-500', bg: 'bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-500/20' },
            partially_paid: { color: 'from-blue-500 to-blue-600', bg: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-indigo-900/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-500/20' },
            paid: { color: 'from-green-500 to-emerald-500', bg: 'bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40', text: 'text-green-700 dark:text-green-400', border: 'border-green-200/50 dark:border-green-500/20' },
            overdue: { color: 'from-red-500 to-red-600', bg: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/40 dark:to-rose-900/40', text: 'text-red-700 dark:text-red-400', border: 'border-red-200/50 dark:border-red-500/20' },
        };
        const config = statusConfig[status] || statusConfig.unpaid;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}>
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-br ${config.color} shadow-[0_0_8px_rgba(var(--color-shadow),0.4)]`}></div>
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
        );
    };

    const invoicesWithStatus = useMemo(() => {
        return supplierInvoices.map(inv => {
            if (inv.status !== 'paid' && new Date(inv.dueDate) < new Date()) {
                return { ...inv, status: 'overdue' as const };
            }
            return inv;
        }).sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    }, [supplierInvoices]);

    const filteredInvoices = useMemo(() => {
        if (statusFilter === 'all') return invoicesWithStatus;
        if (statusFilter === 'overdue') {
            return invoicesWithStatus.filter(inv => inv.status === 'overdue');
        }
        return invoicesWithStatus.filter(inv => inv.status === statusFilter);
    }, [invoicesWithStatus, statusFilter]);

    const totalOutstanding = useMemo(() =>
        filteredInvoices.reduce((sum, inv) => sum + (inv.amount - inv.amountPaid), 0),
        [filteredInvoices]
    );

    const overdueCount = useMemo(() =>
        invoicesWithStatus.filter(inv => inv.status === 'overdue').length,
        [invoicesWithStatus]
    );

    const unpaidCount = useMemo(() =>
        invoicesWithStatus.filter(inv => inv.status === 'unpaid').length,
        [invoicesWithStatus]
    );

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Accounts Payable</h3>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Manage supplier invoices and payments</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div glass-effect="" className="flex-1 px-4 py-3 !bg-amber-50/50 dark:!bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50 rounded-2xl">
                        <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest">Total Outstanding</div>
                        <div className="text-lg md:text-2xl font-black text-amber-900 dark:text-amber-50 tracking-tight">{formatCurrency(totalOutstanding, storeSettings)}</div>
                    </div>
                    <button
                        onClick={onOpenInvoiceForm}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 active:translate-y-0"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="whitespace-nowrap">Record Invoice</span>
                    </button>
                </div>
            </div>

            {/* Stats and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div glass-effect="" className="p-4 rounded-2xl">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Invoices</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{invoicesWithStatus.length}</div>
                </div>
                <div glass-effect="" className="p-4 !bg-red-50/50 dark:!bg-red-900/20 border-red-200/50 dark:border-red-800/50 rounded-2xl">
                    <div className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-widest">Overdue</div>
                    <div className="text-2xl font-black text-red-900 dark:text-red-50 tracking-tight">{overdueCount}</div>
                </div>
                <div glass-effect="" className="p-4 !bg-amber-50/50 dark:!bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50 rounded-2xl">
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest">Unpaid</div>
                    <div className="text-2xl font-black text-amber-900 dark:text-amber-50 tracking-tight">{unpaidCount}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {['all', 'unpaid', 'overdue', 'paid'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 active:scale-95 ${statusFilter === status
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        {status === 'all' ? 'All Invoices' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredInvoices.map(invoice => (
                    <div
                        key={invoice.id}
                        glass-effect=""
                        className="p-4 rounded-2xl relative overflow-hidden group active:scale-[0.98] transition-all"
                        onClick={() => onViewInvoice(invoice)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</span>
                                    <StatusBadge status={invoice.status} />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                    <span>{invoice.supplierName}</span>
                                </div>
                            </div>
                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setActiveActionMenu(activeActionMenu === invoice.id ? null : invoice.id)}
                                    className="p-2 -mr-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </button>
                                {activeActionMenu === invoice.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 glass-effect !bg-white/95 dark:!bg-slate-900/95 rounded-xl shadow-xl z-10 py-1 animate-fade-in-up">
                                        <button
                                            onClick={() => {
                                                onViewInvoice(invoice);
                                                setActiveActionMenu(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                            View Details
                                        </button>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => {
                                                    setInvoiceToPay(invoice);
                                                    setActiveActionMenu(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold"
                                            >
                                                <CalculatorIcon className="w-4 h-4" />
                                                Record Payment
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Due Date</div>
                                <div className={`text-sm font-bold ${invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Outstanding</div>
                                <div className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    {formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block glass-effect rounded-2xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Invoice #</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Supplier</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">PO #</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Due Date</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Balance Due</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredInvoices.map(invoice => (
                                <tr
                                    key={invoice.id}
                                    onClick={() => onViewInvoice(invoice)}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
                                                <BuildingOfficeIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <span className="text-sm text-slate-900 dark:text-slate-100 font-bold">{invoice.supplierName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-bold">
                                        {invoice.poNumber}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400 font-black' : 'text-slate-500 dark:text-slate-400 font-bold'}`}>
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => setInvoiceToPay(invoice)}
                                                className="px-4 py-2 text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 border border-blue-200/50 dark:border-blue-500/20 active:scale-95"
                                            >
                                                Record Payment
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12">
                                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-800">
                                            <DocumentChartBarIcon className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 font-bold">No invoices found</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Try changing your filters</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {invoiceToPay && (
                <UnifiedRecordPaymentModal
                    isOpen={!!invoiceToPay}
                    onClose={() => {
                        setInvoiceToPay(null);
                        setActiveActionMenu(null);
                    }}
                    invoiceId={invoiceToPay.id}
                    invoiceNumber={invoiceToPay.invoiceNumber}
                    balanceDue={invoiceToPay.amount - invoiceToPay.amountPaid}
                    customerOrSupplierName={invoiceToPay.supplierName}
                    paymentMethods={storeSettings.supplierPaymentMethods || storeSettings.paymentMethods}
                    onSave={onRecordPayment}
                    storeSettings={storeSettings}
                />
            )}
        </div>
    );
};

export default APManagementView;
