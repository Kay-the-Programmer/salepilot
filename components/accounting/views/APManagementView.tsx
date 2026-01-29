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
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900">Accounts Payable</h3>
                    <p className="text-sm text-slate-600 mt-1">Manage supplier invoices and payments</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                        <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Total Outstanding</div>
                        <div className="text-lg md:text-xl font-bold text-amber-900">{formatCurrency(totalOutstanding, storeSettings)}</div>
                    </div>
                    <button
                        onClick={onOpenInvoiceForm}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md shadow-blue-100"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="whitespace-nowrap">Record Invoice</span>
                    </button>
                </div>
            </div>

            {/* Stats and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <div className="text-sm font-medium text-slate-700">Total Invoices</div>
                    <div className="text-2xl font-bold text-slate-900">{invoicesWithStatus.length}</div>
                </div>
                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                    <div className="text-sm font-medium text-red-700">Overdue</div>
                    <div className="text-2xl font-bold text-red-900">{overdueCount}</div>
                </div>
                <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                    <div className="text-sm font-medium text-amber-700">Unpaid</div>
                    <div className="text-2xl font-bold text-amber-900">{unpaidCount}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {['all', 'unpaid', 'overdue', 'paid'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${statusFilter === status
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
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
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group active:bg-slate-50 transition-colors"
                        onClick={() => onViewInvoice(invoice)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</span>
                                    <StatusBadge status={invoice.status} />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                    <span>{invoice.supplierName}</span>
                                </div>
                            </div>
                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setActiveActionMenu(activeActionMenu === invoice.id ? null : invoice.id)}
                                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </button>
                                {activeActionMenu === invoice.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-1 animate-fade-in-up">
                                        <button
                                            onClick={() => {
                                                onViewInvoice(invoice);
                                                setActiveActionMenu(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
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
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                                            >
                                                <CalculatorIcon className="w-4 h-4" />
                                                Record Payment
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Due Date</div>
                                <div className={`text-sm font-semibold ${invoice.status === 'overdue' ? 'text-red-600' : 'text-slate-900'}`}>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Outstanding</div>
                                <div className="text-sm font-bold text-slate-900">
                                    {formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">PO #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Balance Due</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredInvoices.map(invoice => (
                                <tr
                                    key={invoice.id}
                                    onClick={() => onViewInvoice(invoice)}
                                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="text-sm font-medium text-slate-900">{invoice.invoiceNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg flex items-center justify-center">
                                                <BuildingOfficeIcon className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <span className="text-sm text-slate-900">{invoice.supplierName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                        {invoice.poNumber}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-bold text-slate-900">{formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => setInvoiceToPay(invoice)}
                                                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200"
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
