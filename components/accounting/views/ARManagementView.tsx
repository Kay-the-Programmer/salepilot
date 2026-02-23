import React, { useState, useMemo } from 'react';
import { Sale, Customer, StoreSettings, Payment } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import DocumentChartBarIcon from '../../icons/DocumentChartBarIcon';
import UsersIcon from '../../icons/UsersIcon';
import EllipsisVerticalIcon from '../../icons/EllipsisVerticalIcon';
import EyeIcon from '../../icons/EyeIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import UnifiedRecordPaymentModal from '../UnifiedRecordPaymentModal';
import CustomerStatementModal from '../modals/CustomerStatementModal';

interface ARManagementViewProps {
    sales: Sale[];
    customers: Customer[];
    storeSettings: StoreSettings;
    onRecordPayment: (saleId: string, payment: Omit<Payment, 'id'>) => void;
    onViewInvoice: (invoice: Sale) => void;
}

const ARManagementView: React.FC<ARManagementViewProps> = ({ sales, customers, storeSettings, onRecordPayment, onViewInvoice }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
    const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
    const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<Customer | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('open');
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

    const sortedInvoices = useMemo(() => {
        return sales
            .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
    }, [sales]);

    const customersById = useMemo(() => {
        const map: Record<string, Customer> = {};
        for (const c of customers) {
            map[c.id] = c;
        }
        return map;
    }, [customers]);

    const filteredInvoices = useMemo(() => {
        const isPaid = (s: Sale) => {
            const calculatedAmountPaid = s.payments?.reduce((sum, p) => sum + p.amount, 0) ?? s.amountPaid;
            const balanceCents = Math.round((s.total - calculatedAmountPaid) * 100);
            return s.paymentStatus === 'paid' || balanceCents <= 0;
        };

        if (statusFilter === 'all') return sortedInvoices;

        if (statusFilter === 'paid') {
            return sortedInvoices.filter(s => isPaid(s));
        }

        if (statusFilter === 'overdue') {
            return sortedInvoices.filter(s => !isPaid(s) && s.dueDate && new Date(s.dueDate) < new Date());
        }

        return sortedInvoices.filter(s => !isPaid(s));
    }, [sortedInvoices, statusFilter]);

    const totalOutstanding = useMemo(() =>
        sortedInvoices.reduce((sum, inv) => {
            const calculatedAmountPaid = inv.payments?.reduce((pSum, p) => pSum + p.amount, 0) ?? inv.amountPaid;
            return sum + Math.max(0, inv.total - calculatedAmountPaid);
        }, 0),
        [sortedInvoices]
    );

    const handleRecordPaymentClick = (invoice: Sale) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    };

    const handleGenerateStatement = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setSelectedCustomerForStatement(customer);
            setIsStatementModalOpen(true);
        }
    };

    const StatusBadge: React.FC<{ invoice: Sale }> = ({ invoice }) => {
        const calculatedAmountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? invoice.amountPaid;
        const rawBalance = (invoice.total - calculatedAmountPaid);
        const balanceCents = Math.round(rawBalance * 100);
        const isPaid = balanceCents <= 0 || invoice.paymentStatus === 'paid';
        const isOverdue = !isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date();

        if (isPaid) {
            return (
                <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                    Paid
                </span>
            );
        }

        if (isOverdue) {
            return (
                <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                    Overdue
                </span>
            );
        }

        return (
            <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                Pending
            </span>
        );
    };

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Accounts Receivable</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage customer invoices and payments</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-400">Total Outstanding</div>
                        <div className="text-xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">{formatCurrency(totalOutstanding, storeSettings)}</div>
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['open', 'overdue', 'paid', 'all'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${statusFilter === status
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                                }`}
                        >
                            {status === 'all' ? 'All History' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>

                <div className="flex-1"></div>

                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <UsersIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <select
                        onChange={e => e.target.value && handleGenerateStatement(e.target.value)}
                        value={''}
                        className="w-full md:w-64 pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer active:scale-95 transition-all duration-300"
                    >
                        <option value="" disabled className="dark:bg-slate-900">Generate Statement</option>
                        {customers.filter(c => c.accountBalance > 0).map(c => (
                            <option key={c.id} value={c.id} className="dark:bg-slate-900">
                                {c.name} ({formatCurrency(c.accountBalance, storeSettings)})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredInvoices.map(invoice => {
                    const calculatedAmountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? invoice.amountPaid;
                    const rawBalance = (invoice.total - calculatedAmountPaid);
                    const balanceCents = Math.round(rawBalance * 100);
                    const balanceDue = Math.max(0, balanceCents) / 100;
                    const isPaid = balanceCents <= 0 || invoice.paymentStatus === 'paid';
                    const isOverdue = !isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date();
                    const customerName = invoice.customerName || (invoice.customerId ? customersById[invoice.customerId]?.name : undefined) || 'Unknown Customer';

                    return (
                        <div
                            key={invoice.transactionId}
                            className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                            onClick={() => onViewInvoice(invoice)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">#{invoice.transactionId}</span>
                                        <StatusBadge invoice={invoice} />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        <UsersIcon className="w-3.5 h-3.5" />
                                        <span>{customerName}</span>
                                    </div>
                                </div>
                                <div className="relative" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => setActiveActionMenu(activeActionMenu === invoice.transactionId ? null : invoice.transactionId)}
                                        className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                                    >
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </button>
                                    {activeActionMenu === invoice.transactionId && (
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
                                            {!isPaid && (
                                                <button
                                                    onClick={() => {
                                                        handleRecordPaymentClick(invoice);
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
                                    <div className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Balance Due</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {formatCurrency(balanceDue, storeSettings)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop View: Table */}
            <div className="liquid-glass-card rounded-[2rem] hidden md:block dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Invoice #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Due Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Balance Due</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredInvoices.map(invoice => {
                                const calculatedAmountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? invoice.amountPaid;
                                const rawBalance = (invoice.total - calculatedAmountPaid);
                                const balanceCents = Math.round(rawBalance * 100);
                                const balanceDue = Math.max(0, balanceCents) / 100;
                                const isPaid = balanceCents <= 0 || invoice.paymentStatus === 'paid';
                                const isOverdue = !isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date();
                                const customerName = invoice.customerName || (invoice.customerId ? customersById[invoice.customerId]?.name : undefined) || 'Unknown Customer';

                                return (
                                    <tr
                                        key={invoice.transactionId}
                                        onClick={() => onViewInvoice(invoice)}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors active:scale-95 transition-all duration-300"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">#{invoice.transactionId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">{customerName}</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(balanceDue, storeSettings)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <StatusBadge invoice={invoice} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                            {!isPaid && (
                                                <button
                                                    onClick={() => handleRecordPaymentClick(invoice)}
                                                    className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors active:scale-95 transition-all duration-300"
                                                >
                                                    Pay
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredInvoices.length === 0 && (
                <div className="text-center py-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <DocumentChartBarIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-900 dark:text-slate-100 font-medium">No open invoices found</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All invoices are paid up!</p>
                </div>
            )}

            {
                selectedInvoice && (
                    <UnifiedRecordPaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => {
                            setIsPaymentModalOpen(false);
                            setActiveActionMenu(null);
                        }}
                        invoiceId={selectedInvoice.transactionId}
                        balanceDue={Math.max(0, selectedInvoice.total - (selectedInvoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? selectedInvoice.amountPaid))}
                        customerOrSupplierName={selectedInvoice.customerName || (selectedInvoice.customerId ? customersById[selectedInvoice.customerId]?.name : undefined)}
                        paymentMethods={storeSettings.paymentMethods}
                        onSave={onRecordPayment}
                        storeSettings={storeSettings}
                    />
                )
            }
            {
                selectedCustomerForStatement && (
                    <CustomerStatementModal
                        isOpen={isStatementModalOpen}
                        onClose={() => {
                            setIsStatementModalOpen(false);
                            setSelectedCustomerForStatement(null);
                        }}
                        customer={selectedCustomerForStatement}
                        sales={sales}
                        storeSettings={storeSettings}
                    />
                )
            }
        </div >
    );
};

export default ARManagementView;
