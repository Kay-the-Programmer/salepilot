import React, { useState, useMemo } from 'react';
import { Sale, Customer, StoreSettings, Payment } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import DocumentChartBarIcon from '../../icons/DocumentChartBarIcon';
import UsersIcon from '../../icons/UsersIcon';
import EllipsisVerticalIcon from '../../icons/EllipsisVerticalIcon';
import EyeIcon from '../../icons/EyeIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import UnifiedRecordPaymentModal from '../UnifiedRecordPaymentModal';
import CustomerStatementModal from '../modals/CustomerStatementModal';

interface ARManagementViewProps {
    sales: Sale[];
    customers: Customer[];
    storeSettings: StoreSettings;
    onRecordPayment: (saleId: string, payment: Omit<Payment, 'id'>) => void;
    onViewInvoice: (invoice: Sale) => void;
}

const FILTERS: { id: string; label: string }[] = [
    { id: 'open', label: 'Open' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'paid', label: 'Paid' },
    { id: 'all', label: 'All History' },
];

// Prefer the payment records when present (freshest detail); fall back to the
// stored running total. Guarding on length avoids an empty array reading as 0 paid.
const paidAmount = (s: Sale) => (s.payments && s.payments.length > 0)
    ? s.payments.reduce((sum, p) => sum + p.amount, 0)
    : (s.amountPaid || 0);
const isSalePaid = (s: Sale) => s.paymentStatus === 'paid' || Math.round((s.total - paidAmount(s)) * 100) <= 0;
const isSaleOverdue = (s: Sale) => !isSalePaid(s) && !!s.dueDate && new Date(s.dueDate) < new Date();

const ARManagementView: React.FC<ARManagementViewProps> = ({ sales, customers, storeSettings, onRecordPayment, onViewInvoice }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
    const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
    const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<Customer | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('open');
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

    const sortedInvoices = useMemo(() => {
        // Copy before sorting — never mutate the sales prop in place.
        return [...sales]
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
        if (statusFilter === 'all') return sortedInvoices;
        if (statusFilter === 'paid') return sortedInvoices.filter(isSalePaid);
        if (statusFilter === 'overdue') return sortedInvoices.filter(isSaleOverdue);
        return sortedInvoices.filter(s => !isSalePaid(s));
    }, [sortedInvoices, statusFilter]);

    const totalOutstanding = useMemo(() =>
        sortedInvoices.reduce((sum, inv) => sum + Math.max(0, inv.total - paidAmount(inv)), 0),
        [sortedInvoices]
    );
    const overdueCount = useMemo(() => sortedInvoices.filter(isSaleOverdue).length, [sortedInvoices]);
    const openCount = useMemo(() => sortedInvoices.filter(s => !isSalePaid(s)).length, [sortedInvoices]);

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
        if (isSalePaid(invoice)) {
            return <span className="px-2.5 py-1 bg-green-500/15 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">Paid</span>;
        }
        if (isSaleOverdue(invoice)) {
            return <span className="px-2.5 py-1 bg-red-500/15 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">Overdue</span>;
        }
        return <span className="px-2.5 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">Pending</span>;
    };

    const KPIS = [
        { label: 'Outstanding', value: formatCurrency(totalOutstanding, storeSettings), sub: 'Owed by customers', icon: BanknotesIcon, accent: 'm3-text-primary' },
        { label: 'Overdue', value: String(overdueCount), sub: 'Past due date', icon: CalendarIcon, accent: 'm3-text-error' },
        { label: 'Open', value: String(openCount), sub: 'Awaiting payment', icon: CalculatorIcon, accent: 'text-amber-600 dark:text-amber-400' },
        { label: 'Total Invoices', value: String(sortedInvoices.length), sub: 'All time', icon: DocumentChartBarIcon, accent: 'm3-text-on-surface-variant' },
    ];

    const owingCustomers = customers.filter(c => c.accountBalance > 0);

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold m3-text-on-surface tracking-tight">Accounts Receivable</h3>
                    <p className="text-sm m3-text-on-surface-variant mt-1">Manage customer invoices and payments</p>
                </div>
                <div className="relative self-start sm:self-auto w-full sm:w-64">
                    <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 m3-text-on-surface-variant pointer-events-none" />
                    <select
                        onChange={e => e.target.value && handleGenerateStatement(e.target.value)}
                        value={''}
                        disabled={owingCustomers.length === 0}
                        className="w-full pl-9 pr-8 py-2.5 rounded-lg text-sm font-medium m3-bg-surface-lowest m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-60"
                    >
                        <option value="" disabled>Generate statement…</option>
                        {owingCustomers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({formatCurrency(c.accountBalance, storeSettings)})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {KPIS.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[11px] font-semibold uppercase tracking-widest ${kpi.accent}`}>{kpi.label}</span>
                                <Icon className={`w-5 h-5 ${kpi.accent} opacity-70`} />
                            </div>
                            <div className="text-2xl font-bold m3-text-on-surface tracking-tight">{kpi.value}</div>
                            <p className="text-xs m3-text-on-surface-variant mt-1">{kpi.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setStatusFilter(f.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${statusFilter === f.id
                                ? 'm3-bg-primary m3-text-on-primary'
                                : 'm3-bg-surface-lowest m3-text-on-surface-variant hover:m3-bg-surface-container border m3-border-outline-variant'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <span className="text-xs font-medium m3-text-on-surface-variant">{filteredInvoices.length} shown</span>
            </div>

            {/* Mobile cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredInvoices.map(invoice => {
                    const balanceDue = Math.max(0, Math.round((invoice.total - paidAmount(invoice)) * 100)) / 100;
                    const paid = isSalePaid(invoice);
                    const overdue = isSaleOverdue(invoice);
                    const customerName = invoice.customerName || (invoice.customerId ? customersById[invoice.customerId]?.name : undefined) || 'Unknown Customer';

                    return (
                        <div
                            key={invoice.transactionId}
                            className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm"
                            onClick={() => onViewInvoice(invoice)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold m3-text-on-surface">#{invoice.transactionId}</span>
                                        <StatusBadge invoice={invoice} />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs m3-text-on-surface-variant">
                                        <UsersIcon className="w-3.5 h-3.5" />
                                        <span>{customerName}</span>
                                    </div>
                                </div>
                                <div className="relative" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => setActiveActionMenu(activeActionMenu === invoice.transactionId ? null : invoice.transactionId)}
                                        className="p-1.5 -mr-1.5 m3-text-on-surface-variant hover:m3-text-on-surface rounded-lg transition-colors"
                                    >
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </button>
                                    {activeActionMenu === invoice.transactionId && (
                                        <div className="m3-bg-surface-lowest rounded-xl shadow-lg absolute right-0 top-full mt-1 w-48 border m3-border-outline-variant z-20 py-1">
                                            <button
                                                onClick={() => { onViewInvoice(invoice); setActiveActionMenu(null); }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm m3-text-on-surface hover:m3-bg-surface-container transition-colors"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                                View Details
                                            </button>
                                            {!paid && (
                                                <button
                                                    onClick={() => { handleRecordPaymentClick(invoice); setActiveActionMenu(null); }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm m3-text-secondary hover:m3-bg-surface-container font-medium transition-colors"
                                                >
                                                    <CalculatorIcon className="w-4 h-4" />
                                                    Record Payment
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-3 border-t m3-border-outline-variant">
                                <div>
                                    <div className="text-xs m3-text-on-surface-variant mb-0.5">Due Date</div>
                                    <div className={`text-sm font-medium ${overdue ? 'm3-text-error' : 'm3-text-on-surface'}`}>
                                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs m3-text-on-surface-variant mb-0.5">Balance Due</div>
                                    <div className="text-sm font-bold m3-text-on-surface">{formatCurrency(balanceDue, storeSettings)}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop table */}
            <div className="m3-bg-surface-lowest rounded-2xl hidden md:block border m3-border-outline-variant shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-[var(--m3-outline-variant)]">
                        <thead className="m3-bg-surface-container">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold m3-text-on-surface-variant">Invoice #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold m3-text-on-surface-variant">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold m3-text-on-surface-variant">Due Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold m3-text-on-surface-variant">Balance Due</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold m3-text-on-surface-variant">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold m3-text-on-surface-variant">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-[var(--m3-outline-variant)]">
                            {filteredInvoices.map(invoice => {
                                const balanceDue = Math.max(0, Math.round((invoice.total - paidAmount(invoice)) * 100)) / 100;
                                const paid = isSalePaid(invoice);
                                const overdue = isSaleOverdue(invoice);
                                const customerName = invoice.customerName || (invoice.customerId ? customersById[invoice.customerId]?.name : undefined) || 'Unknown Customer';

                                return (
                                    <tr
                                        key={invoice.transactionId}
                                        onClick={() => onViewInvoice(invoice)}
                                        className="hover:m3-bg-surface-container cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--m3-primary)' }}></div>
                                                <span className="text-sm font-medium m3-text-on-surface">#{invoice.transactionId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm m3-text-on-surface font-medium">{customerName}</span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${overdue ? 'm3-text-error font-medium' : 'm3-text-on-surface-variant'}`}>
                                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold m3-text-on-surface tracking-tight">{formatCurrency(balanceDue, storeSettings)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <StatusBadge invoice={invoice} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                            {!paid && (
                                                <button
                                                    onClick={() => handleRecordPaymentClick(invoice)}
                                                    className="px-3 py-1.5 text-xs font-semibold m3-text-secondary m3-bg-secondary-fixed rounded-lg hover:brightness-95 transition-all active:scale-95"
                                                >
                                                    Pay
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-14">
                                        <div className="w-12 h-12 m3-bg-surface-container rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <DocumentChartBarIcon className="w-6 h-6 m3-text-on-surface-variant" />
                                        </div>
                                        <p className="m3-text-on-surface font-medium">No invoices found</p>
                                        <p className="text-sm m3-text-on-surface-variant mt-1">Nothing outstanding for this filter</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedInvoice && (
                <UnifiedRecordPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => { setIsPaymentModalOpen(false); setActiveActionMenu(null); }}
                    invoiceId={selectedInvoice.transactionId}
                    balanceDue={Math.max(0, selectedInvoice.total - paidAmount(selectedInvoice))}
                    customerOrSupplierName={selectedInvoice.customerName || (selectedInvoice.customerId ? customersById[selectedInvoice.customerId]?.name : undefined)}
                    paymentMethods={storeSettings.paymentMethods}
                    onSave={onRecordPayment}
                    storeSettings={storeSettings}
                />
            )}
            {selectedCustomerForStatement && (
                <CustomerStatementModal
                    isOpen={isStatementModalOpen}
                    onClose={() => { setIsStatementModalOpen(false); setSelectedCustomerForStatement(null); }}
                    customer={selectedCustomerForStatement}
                    sales={sales}
                    storeSettings={storeSettings}
                />
            )}
        </div>
    );
};

export default ARManagementView;
