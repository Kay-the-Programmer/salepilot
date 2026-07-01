import React, { useState, useMemo } from 'react';
import { SupplierInvoice, PurchaseOrder, StoreSettings, SupplierPayment, Supplier } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { toneClass, toneDot } from '../../ui/StatusPill';
import PlusIcon from '../../icons/PlusIcon';
import DocumentChartBarIcon from '../../icons/DocumentChartBarIcon';
import BuildingOfficeIcon from '../../icons/BuildingOfficeIcon';
import EllipsisVerticalIcon from '../../icons/EllipsisVerticalIcon';
import EyeIcon from '../../icons/EyeIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import CalendarIcon from '../../icons/CalendarIcon';
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

const FILTERS: { id: string; label: string }[] = [
    { id: 'all', label: 'All Invoices' },
    { id: 'unpaid', label: 'Unpaid' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'paid', label: 'Paid' },
];

// Prefer the payment records when present; fall back to the stored running
// total. Guarding on length avoids an empty array reading as 0 paid.
const paidAmount = (inv: SupplierInvoice) => (inv.payments && inv.payments.length > 0)
    ? inv.payments.reduce((sum, p) => sum + p.amount, 0)
    : (inv.amountPaid || 0);

const APManagementView: React.FC<APManagementViewProps> = ({ supplierInvoices, storeSettings, onRecordPayment, onViewInvoice, onOpenInvoiceForm }) => {
    const [invoiceToPay, setInvoiceToPay] = useState<SupplierInvoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

    const StatusBadge: React.FC<{ status: SupplierInvoice['status'] }> = ({ status }) => {
        const TONE: Record<string, 'amber' | 'primary' | 'success' | 'danger'> = {
            unpaid: 'amber',
            partially_paid: 'primary',
            paid: 'success',
            overdue: 'danger',
        };
        const tone = TONE[status] || 'amber';

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${toneClass(tone)}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${toneDot(tone)}`}></div>
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

    // Total payables outstanding across ALL invoices (independent of the table
    // filter), never negative — mirrors the Receivables "Total Outstanding" KPI.
    const totalOutstanding = useMemo(() =>
        invoicesWithStatus.reduce((sum, inv) => sum + Math.max(0, inv.amount - paidAmount(inv)), 0),
        [invoicesWithStatus]
    );

    const overdueCount = useMemo(() =>
        invoicesWithStatus.filter(inv => inv.status === 'overdue').length,
        [invoicesWithStatus]
    );

    const unpaidCount = useMemo(() =>
        invoicesWithStatus.filter(inv => inv.status === 'unpaid').length,
        [invoicesWithStatus]
    );

    const KPIS = [
        { label: 'Outstanding', value: formatCurrency(totalOutstanding, storeSettings), sub: 'Owed to suppliers', icon: BanknotesIcon, accent: 'm3-text-primary' },
        { label: 'Overdue', value: String(overdueCount), sub: 'Past due date', icon: CalendarIcon, accent: 'm3-text-error' },
        { label: 'Unpaid', value: String(unpaidCount), sub: 'Awaiting payment', icon: CalculatorIcon, accent: 'text-amber-600 dark:text-amber-400' },
        { label: 'Total Invoices', value: String(invoicesWithStatus.length), sub: 'All time', icon: DocumentChartBarIcon, accent: 'm3-text-on-surface-variant' },
    ];

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold m3-text-on-surface tracking-tight">Accounts Payable</h3>
                    <p className="text-sm m3-text-on-surface-variant mt-1">Manage supplier invoices and payments</p>
                </div>
                <button
                    onClick={onOpenInvoiceForm}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 m3-bg-primary m3-text-on-primary font-bold text-sm rounded-lg shadow-sm active:scale-95 transition-all self-start sm:self-auto"
                >
                    <PlusIcon className="w-5 h-5" />
                    Record Invoice
                </button>
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
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${statusFilter === f.id
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
                {filteredInvoices.map(invoice => (
                    <div
                        key={invoice.id}
                        className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm"
                        onClick={() => onViewInvoice(invoice)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold m3-text-on-surface">{invoice.invoiceNumber}</span>
                                    <StatusBadge status={invoice.status} />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs m3-text-on-surface-variant">
                                    <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                    <span>{invoice.supplierName}</span>
                                </div>
                            </div>
                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setActiveActionMenu(activeActionMenu === invoice.id ? null : invoice.id)}
                                    className="p-1.5 -mr-1.5 m3-text-on-surface-variant hover:m3-text-on-surface rounded-lg transition-colors"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </button>
                                {activeActionMenu === invoice.id && (
                                    <div className="m3-bg-surface-lowest rounded-xl shadow-lg absolute right-0 top-full mt-1 w-48 border m3-border-outline-variant z-20 py-1">
                                        <button
                                            onClick={() => { onViewInvoice(invoice); setActiveActionMenu(null); }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm m3-text-on-surface hover:m3-bg-surface-container transition-colors"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                            View Details
                                        </button>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => { setInvoiceToPay(invoice); setActiveActionMenu(null); }}
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
                                <div className={`text-sm font-medium ${invoice.status === 'overdue' ? 'm3-text-error' : 'm3-text-on-surface'}`}>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs m3-text-on-surface-variant mb-0.5">Outstanding</div>
                                <div className="text-sm font-bold m3-text-on-surface">
                                    {formatCurrency(invoice.amount - paidAmount(invoice), storeSettings)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop table */}
            <div className="m3-bg-surface-lowest rounded-2xl hidden md:block border m3-border-outline-variant shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-[var(--m3-outline-variant)]">
                        <thead className="m3-bg-surface-container">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold m3-text-on-surface-variant">Invoice #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold m3-text-on-surface-variant">Supplier</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold m3-text-on-surface-variant">PO #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold m3-text-on-surface-variant">Due Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold m3-text-on-surface-variant">Balance Due</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold m3-text-on-surface-variant">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold m3-text-on-surface-variant">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-[var(--m3-outline-variant)]">
                            {filteredInvoices.map(invoice => (
                                <tr
                                    key={invoice.id}
                                    onClick={() => onViewInvoice(invoice)}
                                    className="hover:m3-bg-surface-container cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--m3-secondary)' }}></div>
                                            <span className="text-sm font-medium m3-text-on-surface">{invoice.invoiceNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm m3-text-on-surface font-medium">{invoice.supplierName}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm m3-text-on-surface-variant">
                                        {invoice.poNumber}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${invoice.status === 'overdue' ? 'm3-text-error font-semibold' : 'm3-text-on-surface-variant'}`}>
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-bold m3-text-on-surface tracking-tight">{formatCurrency(invoice.amount - paidAmount(invoice), storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => setInvoiceToPay(invoice)}
                                                className="px-3 py-1.5 text-xs font-semibold m3-text-secondary m3-bg-secondary-fixed rounded-lg hover:brightness-95 transition-all active:scale-95"
                                            >
                                                Pay
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-14">
                                        <div className="w-12 h-12 m3-bg-surface-container rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <DocumentChartBarIcon className="w-6 h-6 m3-text-on-surface-variant" />
                                        </div>
                                        <p className="m3-text-on-surface font-medium">No invoices found</p>
                                        <p className="text-sm m3-text-on-surface-variant mt-1">Try changing your filters or record a new invoice</p>
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
                    balanceDue={invoiceToPay.amount - paidAmount(invoiceToPay)}
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
