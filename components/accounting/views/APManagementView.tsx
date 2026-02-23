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
            unpaid: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
            partially_paid: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
            paid: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
            overdue: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
        };
        const config = statusConfig[status] || statusConfig.unpaid;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
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
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Accounts Payable</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage supplier invoices and payments</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                        <div className="text-xs font-medium text-amber-700 dark:text-amber-400">Total Outstanding</div>
                        <div className="text-xl font-bold text-amber-900 dark:text-amber-100 tracking-tight">{formatCurrency(totalOutstanding, storeSettings)}</div>
                    </div>
                    <button
                        onClick={onOpenInvoiceForm}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors active:scale-95 transition-all duration-300"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="whitespace-nowrap">Record Invoice</span>
                    </button>
                </div>
            </div>

            {/* Stats and Filters */}
            {/* Stats and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Invoices</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{invoicesWithStatus.length}</div>
                </div>
                <div className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-medium text-red-600 dark:text-red-400">Overdue</div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400 tracking-tight">{overdueCount}</div>
                </div>
                <div className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Unpaid</div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tracking-tight">{unpaidCount}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {['all', 'unpaid', 'overdue', 'paid'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${statusFilter === status
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        {status === 'all' ? 'All Invoices' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Mobile View: Cards */}
            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredInvoices.map(invoice => (
                    <div
                        key={invoice.id}
                        className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
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
                                    className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </button>
                                {activeActionMenu === invoice.id && (
                                    <div className="liquid-glass-card rounded-[2rem] absolute right-0 top-full mt-1 w-48 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-20 py-1">
                                        <button
                                            onClick={() => {
                                                onViewInvoice(invoice);
                                                setActiveActionMenu(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 transition-all duration-300"
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
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium active:scale-95 transition-all duration-300"
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
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Due Date</div>
                                <div className={`text-sm font-medium ${invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Outstanding</div>
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="liquid-glass-card rounded-[2rem] hidden md:block dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Invoice #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Supplier</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">PO #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Due Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Balance Due</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredInvoices.map(invoice => (
                                <tr
                                    key={invoice.id}
                                    onClick={() => onViewInvoice(invoice)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors active:scale-95 transition-all duration-300"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">{invoice.supplierName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        {invoice.poNumber}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => setInvoiceToPay(invoice)}
                                                className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors active:scale-95 transition-all duration-300"
                                            >
                                                Pay
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12">
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <DocumentChartBarIcon className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="text-slate-900 dark:text-slate-100 font-medium">No invoices found</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try changing your filters</p>
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
