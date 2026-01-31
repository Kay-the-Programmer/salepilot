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
            unpaid: { color: 'from-amber-500 to-yellow-500', bg: 'bg-gradient-to-r from-amber-50 to-yellow-100', text: 'text-amber-700' },
            partially_paid: { color: 'from-blue-500 to-blue-600', bg: 'bg-gradient-to-r from-blue-50 to-blue-100', text: 'text-blue-700' },
            paid: { color: 'from-green-500 to-emerald-500', bg: 'bg-gradient-to-r from-green-50 to-emerald-100', text: 'text-green-700' },
            overdue: { color: 'from-red-500 to-red-600', bg: 'bg-gradient-to-r from-red-50 to-red-100', text: 'text-red-700' },
        };
        const config = statusConfig[status] || statusConfig.unpaid;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium ${config.bg} ${config.text}`}>
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-br ${config.color}`}></div>
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
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">Accounts Payable</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage supplier invoices and payments</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 px-4 py-3 glass-effect !bg-amber-50/50 dark:!bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50 rounded-2xl">
                        <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Total Outstanding</div>
                        <div className="text-lg md:text-2xl font-black text-amber-900 dark:text-amber-50">{formatCurrency(totalOutstanding, storeSettings)}</div>
                    </div>
                    <button
                        onClick={onOpenInvoiceForm}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="whitespace-nowrap">Record Invoice</span>
                    </button>
                </div>
            </div>

            {/* Stats and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 glass-effect !bg-slate-50/50 dark:!bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50 rounded-2xl">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-400">Total Invoices</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{invoicesWithStatus.length}</div>
                </div>
                <div className="p-4 glass-effect !bg-red-50/50 dark:!bg-red-900/20 border-red-200/50 dark:border-red-800/50 rounded-2xl">
                    <div className="text-sm font-medium text-red-700 dark:text-red-300">Overdue</div>
                    <div className="text-2xl font-black text-red-900 dark:text-red-50">{overdueCount}</div>
                </div>
                <div className="p-4 glass-effect !bg-amber-50/50 dark:!bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50 rounded-2xl">
                    <div className="text-sm font-medium text-amber-700 dark:text-amber-300">Unpaid</div>
                    <div className="text-2xl font-black text-amber-900 dark:text-amber-50">{unpaidCount}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {['all', 'unpaid', 'overdue', 'paid'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${statusFilter === status
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                        className="glass-effect p-4 rounded-2xl relative overflow-hidden group active:scale-[0.98] transition-all"
                        onClick={() => onViewInvoice(invoice)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</span>
                                    <StatusBadge status={invoice.status} />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                    <span>{invoice.supplierName}</span>
                                </div>
                            </div>
                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setActiveActionMenu(activeActionMenu === invoice.id ? null : invoice.id)}
                                    className="p-2 -mr-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full"
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
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium"
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
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">Due Date</div>
                                <div className={`text-sm font-semibold ${invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">Outstanding</div>
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">PO #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Balance Due</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredInvoices.map(invoice => (
                                <tr
                                    key={invoice.id}
                                    onClick={() => onViewInvoice(invoice)}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                                <BuildingOfficeIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <span className="text-sm text-slate-900 dark:text-slate-100">{invoice.supplierName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">
                                        {invoice.poNumber}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => setInvoiceToPay(invoice)}
                                                className="px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200"
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
                                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <DocumentChartBarIcon className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-600 font-medium">No invoices found</p>
                                        <p className="text-sm text-slate-500 mt-1">Try changing your filters</p>
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
