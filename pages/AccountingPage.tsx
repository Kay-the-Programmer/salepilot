import React from 'react';
import { api } from '../services/api';
import { Account, JournalEntry, StoreSettings, Sale, Customer, Payment, SupplierInvoice, SupplierPayment, PurchaseOrder, Supplier, Expense, RecurringExpense } from '../types';
import UnifiedRecordPaymentModal from '../components/accounting/UnifiedRecordPaymentModal';
import SupplierInvoiceFormModal from '../components/accounting/SupplierInvoiceFormModal';
import SupplierInvoiceDetailModal from '../components/accounting/SupplierInvoiceDetailModal';
import SalesInvoiceDetailModal from '../components/accounting/SalesInvoiceDetailModal';
import { logEvent } from '../src/utils/analytics';
import ArrowTrendingUpIcon from '../components/icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from '../components/icons/ArrowTrendingDownIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import DocumentChartBarIcon from '../components/icons/DocumentChartBarIcon';
import ReceiptPercentIcon from '../components/icons/ReceiptPercentIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';


import ExpenseFormModal from '../components/accounting/ExpenseFormModal';
import AccountAdjustmentModal from '../components/accounting/AccountAdjustmentModal';
import RecurringExpenseFormModal from '../components/accounting/RecurringExpenseFormModal';

// Extracted accounting components
import AccountingDashboard from '../components/accounting/views/AccountingDashboard';
import ChartOfAccountsView from '../components/accounting/views/ChartOfAccountsView';
import JournalView from '../components/accounting/views/JournalView';
import ARManagementView from '../components/accounting/views/ARManagementView';
import APManagementView from '../components/accounting/views/APManagementView';
import ExpensesView from '../components/accounting/views/ExpensesView';
import TaxReportView from '../components/accounting/views/TaxReportView';
import FinancialStatementsView from '../components/accounting/views/FinancialStatementsView';

// --- Main Accounting Page Component ---

interface AccountingPageProps {
    accounts: Account[];
    journalEntries: JournalEntry[];
    sales: Sale[];
    customers: Customer[];
    suppliers: Supplier[];
    supplierInvoices: SupplierInvoice[];
    purchaseOrders: PurchaseOrder[];
    onSaveAccount: (account: Account) => void;
    onDeleteAccount: (accountId: string) => void;
    onAddManualJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
    onRecordPayment: (saleId: string, payment: Omit<Payment, 'id'>) => void;
    onSaveSupplierInvoice: (invoice: SupplierInvoice) => void;
    onRecordSupplierPayment: (invoiceId: string, payment: Omit<SupplierPayment, 'id'>) => void;
    expenses: Expense[];
    recurringExpenses: RecurringExpense[];
    onSaveExpense: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'> & { id?: string }) => void;
    onDeleteExpense: (expenseId: string) => void;
    onSaveRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'nextRunDate' | 'status'> & { id?: string, status?: string }) => void;
    onDeleteRecurringExpense: (expenseId: string) => void;
    isLoading: boolean;
    error: string | null;
    storeSettings: StoreSettings;
}

const AccountingPage: React.FC<AccountingPageProps> = ({
    accounts, journalEntries, sales, customers, suppliers, supplierInvoices, purchaseOrders, expenses, recurringExpenses,
    onSaveAccount, onDeleteAccount, onAddManualJournalEntry, onRecordPayment,
    onSaveSupplierInvoice, onRecordSupplierPayment, onSaveExpense, onDeleteExpense,
    onSaveRecurringExpense, onDeleteRecurringExpense,
    isLoading, error, storeSettings
}) => {
    const [activeTab, setActiveTab] = React.useState('dashboard');

    const [isSupplierInvoiceFormOpen, setIsSupplierInvoiceFormOpen] = React.useState(false);
    const [editingSupplierInvoice, setEditingSupplierInvoice] = React.useState<SupplierInvoice | null>(null);
    const [viewingAPInvoice, setViewingAPInvoice] = React.useState<SupplierInvoice | null>(null);
    const [viewingARInvoice, setViewingARInvoice] = React.useState<Sale | null>(null);
    const [isRecordSupplierPaymentOpen, setIsRecordSupplierPaymentOpen] = React.useState(false);
    const [invoiceToPayAP, setInvoiceToPayAP] = React.useState<SupplierInvoice | null>(null);
    const [isRecordARPaymentOpen, setIsRecordARPaymentOpen] = React.useState(false);
    const [invoiceToPayAR, setInvoiceToPayAR] = React.useState<Sale | null>(null);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = React.useState(false);
    const [accountToAdjust, setAccountToAdjust] = React.useState<Account | null>(null);
    const [isExpenseFormOpen, setIsExpenseFormOpen] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
    const [isRecurringExpenseFormOpen, setIsRecurringExpenseFormOpen] = React.useState(false);
    const [editingRecurringExpense, setEditingRecurringExpense] = React.useState<RecurringExpense | null>(null);

    const availableTabs = React.useRef<string[]>([
        'dashboard',
        'reports',
        'ar_management',
        'ap_management',
        'expenses',
        'recurring_expenses',
        'taxes',
        'chart_of_accounts',
        'journal',
    ]);

    React.useEffect(() => {
        const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
        if (hash && availableTabs.current.includes(hash)) {
            setActiveTab(hash);
        }
    }, []);

    const setActiveTabAndHash = (tabName: string) => {
        const previousTab = activeTab;
        setActiveTab(tabName);
        if (previousTab !== tabName) {
            logEvent('Accounting', 'navigate_tab', tabName);
        }
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `#${tabName}`);
        }
    };



    const handleOpenRecordPaymentAP = (invoice: SupplierInvoice) => {
        setInvoiceToPayAP(invoice);
        setIsRecordSupplierPaymentOpen(true);
        setViewingAPInvoice(null);
    };

    const handleOpenRecordPaymentAR = (invoice: Sale) => {
        setInvoiceToPayAR(invoice);
        setIsRecordARPaymentOpen(true);
        setViewingARInvoice(null);
    };

    const handleAdjustAccount = async (
        accountId: string,
        adjustmentAmount: number,
        offsetAccountId: string,
        offsetAccountName: string,
        description: string
    ) => {
        try {
            await api.post(`/accounting/accounts/${accountId}/adjust`, {
                adjustmentAmount,
                offsetAccountId,
                offsetAccountName,
                description
            });

            logEvent('Accounting', 'adjust_account', accountId);

            // Trigger a page reload to refresh data
            window.location.reload();
        } catch (error: any) {
            console.error('Error adjusting account:', error);
            alert(error.message || 'Error adjusting account balance');
        }
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setIsExpenseFormOpen(true);
    };

    const handleEditRecurringExpense = (expense: RecurringExpense) => {
        setEditingRecurringExpense(expense);
        setIsRecurringExpenseFormOpen(true);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading accounting data...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200 p-6">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                <span className="text-white text-xs">!</span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-900">Error Loading Data</h4>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'ar_management':
                return <ARManagementView sales={sales} customers={customers} storeSettings={storeSettings} onRecordPayment={onRecordPayment} onViewInvoice={setViewingARInvoice} />
            case 'ap_management':
                return <APManagementView
                    supplierInvoices={supplierInvoices}
                    purchaseOrders={purchaseOrders}
                    suppliers={suppliers}
                    storeSettings={storeSettings}
                    onRecordPayment={onRecordSupplierPayment}
                    onSaveInvoice={onSaveSupplierInvoice}
                    onViewInvoice={setViewingAPInvoice}
                    onOpenInvoiceForm={() => { setEditingSupplierInvoice(null); setIsSupplierInvoiceFormOpen(true); }}
                />
            case 'chart_of_accounts':
                return <ChartOfAccountsView
                    accounts={accounts}
                    storeSettings={storeSettings}
                    onSaveAccount={(account) => {
                        logEvent('Accounting', account.id ? 'update_account' : 'create_account', account.name);
                        onSaveAccount(account);
                    }}
                    onDeleteAccount={(id) => {
                        logEvent('Accounting', 'delete_account', id);
                        onDeleteAccount(id);
                    }}
                    onAdjustAccount={(account) => {
                        setAccountToAdjust(account);
                        setIsAdjustmentModalOpen(true);
                    }}
                    recurringExpenses={recurringExpenses}
                />;
            case 'journal':
                return <JournalView entries={journalEntries} accounts={accounts} sales={sales} customers={customers} storeSettings={storeSettings} onAddEntry={onAddManualJournalEntry} />;
            case 'expenses':
                return (
                    <ExpensesView
                        expenses={expenses}
                        recurringExpenses={recurringExpenses}
                        accounts={accounts}
                        storeSettings={storeSettings}
                        onSave={(expense) => {
                            logEvent('Accounting', expense.id ? 'edit_expense' : 'create_expense', expense.id);
                            onSaveExpense(expense);
                        }}
                        onDelete={(id) => {
                            logEvent('Accounting', 'delete_expense', id);
                            onDeleteExpense(id);
                        }}
                        onEdit={handleEditExpense}
                        onOpenForm={() => { setEditingExpense(null); setIsExpenseFormOpen(true); }}
                        onSaveRecurring={(expense) => {
                            logEvent('Accounting', expense.id ? 'edit_recurring_expense' : 'create_recurring_expense', expense.id);
                            onSaveRecurringExpense(expense);
                        }}
                        onDeleteRecurring={(id) => {
                            logEvent('Accounting', 'delete_recurring_expense', id);
                            onDeleteRecurringExpense(id);
                        }}
                        onEditRecurring={handleEditRecurringExpense}
                        onOpenRecurringForm={() => { setEditingRecurringExpense(null); setIsRecurringExpenseFormOpen(true); }}
                    />
                );
            case 'taxes':
                return <TaxReportView sales={sales} storeSettings={storeSettings} />;
            case 'reports':
                return <FinancialStatementsView accounts={accounts} journalEntries={journalEntries} storeSettings={storeSettings} />;
            case 'dashboard':
            default:
                return <AccountingDashboard accounts={accounts} journalEntries={journalEntries} storeSettings={storeSettings} />;
        }
    };

    const tabConfig = [
        { tabName: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: <ChartBarIcon className="w-4 h-4" /> },
        { tabName: 'reports', label: 'Reports', shortLabel: 'Reports', icon: <DocumentChartBarIcon className="w-4 h-4" /> },
        { tabName: 'ar_management', label: 'Accounts Receivable', shortLabel: 'A/R', icon: <ArrowTrendingUpIcon className="w-4 h-4" /> },
        { tabName: 'ap_management', label: 'Accounts Payable', shortLabel: 'A/P', icon: <ArrowTrendingDownIcon className="w-4 h-4" /> },
        { tabName: 'expenses', label: 'Expenses', shortLabel: 'Expenses', icon: <BanknotesIcon className="w-4 h-4" /> },
        { tabName: 'taxes', label: 'Taxes', shortLabel: 'Taxes', icon: <ReceiptPercentIcon className="w-4 h-4" /> },
        { tabName: 'chart_of_accounts', label: 'Chart of Accounts', shortLabel: 'Accounts', icon: <BookOpenIcon className="w-4 h-4" /> },
        { tabName: 'journal', label: 'Journal', shortLabel: 'Journal', icon: <ClipboardDocumentListIcon className="w-4 h-4" /> },
    ];

    return (
        <div className="flex flex-col h-[100dvh] bg-mesh-light dark:bg-slate-950 transition-colors duration-200 font-google overflow-hidden relative">
            {/* Header — compact on mobile */}
            <header className="flex-none liquid-glass-header sticky top-0 z-40" role="banner">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="p-2 md:p-2.5 bg-blue-600 rounded-xl md:rounded-2xl shadow-lg shadow-blue-500/20 flex-shrink-0">
                            <BookOpenIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-tight truncate tracking-tight">
                                Accounting
                            </h1>
                            <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 tracking-wide font-medium truncate uppercase">
                                Financial Control Center
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Universal Google-style Pill Tab Bar */}
            <nav
                className="flex-none liquid-glass sticky top-[60px] md:top-[80px] z-30 transition-all duration-300 border-b border-transparent dark:border-white/5"
                role="tablist"
                aria-label="Accounting sections"
            >
                <div className="max-w-[1400px] mx-auto px-3 md:px-8 py-2 md:py-3 flex items-center justify-between">
                    <div className="flex overflow-x-auto scrollbar-hide gap-2 snap-x snap-mandatory pb-1 max-w-full">
                        {tabConfig.map((tab) => {
                            const isActive = activeTab === tab.tabName;
                            return (
                                <button
                                    key={tab.tabName}
                                    role="tab"
                                    aria-selected={isActive}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={() => setActiveTabAndHash(tab.tabName)}
                                    className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-2.5 md:py-3 rounded-full text-[13px] md:text-sm font-bold tracking-wide whitespace-nowrap outline-none flex-shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 liquid-glass-pill transition-all duration-200 ${isActive ? 'active scale-105 shadow-md shadow-blue-500/20' : 'hover:scale-102'}`}
                                >
                                    <span className={`transition-transform duration-300 ${isActive ? 'scale-110 opacity-100' : 'opacity-70'}`}>
                                        {React.cloneElement(tab.icon as any, { className: "w-4 h-4 md:w-4.5 md:h-4.5" })}
                                    </span>
                                    <span>{tab.shortLabel || tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 scroll-smooth">
                <div className="max-w-[1400px] mx-auto w-full">

                    {/* Content */}
                    <div className="animate-fade-in">
                        {renderContent()}
                    </div>
                </div>
            </main>

            {/* Mobile Footer Spacing */}
            <div className="h-20 md:hidden flex-none"></div>


            {/* Modals */}
            < SupplierInvoiceFormModal
                isOpen={isSupplierInvoiceFormOpen}
                onClose={() => setIsSupplierInvoiceFormOpen(false)}
                onSave={onSaveSupplierInvoice}
                invoiceToEdit={editingSupplierInvoice}
                purchaseOrders={purchaseOrders}
                suppliers={suppliers}
            />
            {
                viewingAPInvoice && (
                    <SupplierInvoiceDetailModal
                        isOpen={!!viewingAPInvoice}
                        onClose={() => setViewingAPInvoice(null)}
                        invoice={viewingAPInvoice}
                        onRecordPayment={handleOpenRecordPaymentAP}
                        storeSettings={storeSettings}
                    />
                )
            }
            {
                invoiceToPayAP && (
                    <UnifiedRecordPaymentModal
                        isOpen={isRecordSupplierPaymentOpen}
                        onClose={() => setIsRecordSupplierPaymentOpen(false)}
                        title="Record Supplier Payment"
                        invoiceId={invoiceToPayAP.id}
                        invoiceNumber={invoiceToPayAP.invoiceNumber}
                        balanceDue={invoiceToPayAP.amount - (invoiceToPayAP.amountPaid || 0)}
                        customerOrSupplierName={suppliers.find(s => s.id === invoiceToPayAP.supplierId)?.name || 'Unknown Supplier'}
                        paymentMethods={storeSettings.paymentMethods}
                        onSave={(invoiceId, payment) => {
                            logEvent('Accounting', 'record_supplier_payment', invoiceId);
                            onRecordSupplierPayment(invoiceId, payment);
                        }}
                        storeSettings={storeSettings}
                    />
                )
            }
            {
                viewingARInvoice && (
                    <SalesInvoiceDetailModal
                        isOpen={!!viewingARInvoice}
                        onClose={() => setViewingARInvoice(null)}
                        invoice={sales.find(s => s.transactionId === viewingARInvoice.transactionId) || viewingARInvoice}
                        onRecordPayment={handleOpenRecordPaymentAR}
                        storeSettings={storeSettings}
                        customerName={viewingARInvoice.customerName || (viewingARInvoice.customerId ? (customers.find(c => c.id === viewingARInvoice.customerId)?.name) : undefined) || undefined}
                    />
                )
            }
            {
                invoiceToPayAR && (
                    <UnifiedRecordPaymentModal
                        isOpen={isRecordARPaymentOpen}
                        onClose={() => setIsRecordARPaymentOpen(false)}
                        title="Record Payment"
                        invoiceId={invoiceToPayAR.transactionId}
                        balanceDue={invoiceToPayAR.total - (invoiceToPayAR.payments?.reduce((s, p) => s + p.amount, 0) || invoiceToPayAR.amountPaid || 0)}
                        customerOrSupplierName={invoiceToPayAR.customerName || (invoiceToPayAR.customerId ? (customers.find(c => c.id === invoiceToPayAR.customerId)?.name) : undefined)}
                        paymentMethods={storeSettings.paymentMethods}
                        onSave={(invoiceId, payment) => {
                            logEvent('Accounting', 'record_sale_payment', invoiceId);
                            onRecordPayment(invoiceId, payment);
                        }}
                        storeSettings={storeSettings}
                    />
                )
            }

            {/* Account Adjustment Modal */}
            {
                accountToAdjust && (
                    <AccountAdjustmentModal
                        isOpen={isAdjustmentModalOpen}
                        onClose={() => {
                            setIsAdjustmentModalOpen(false);
                            setAccountToAdjust(null);
                        }}
                        onSave={(amount, offsetId, offsetName, desc) => {
                            handleAdjustAccount(accountToAdjust.id, amount, offsetId, offsetName, desc);
                            setIsAdjustmentModalOpen(false);
                            setAccountToAdjust(null);
                        }}
                        account={accountToAdjust}
                        accounts={accounts}
                    />
                )
            }

            {/* Expense Form Modal */}
            <ExpenseFormModal
                isOpen={isExpenseFormOpen}
                onClose={() => {
                    setIsExpenseFormOpen(false);
                    setEditingExpense(null);
                }}
                onSave={onSaveExpense}
                expenseToEdit={editingExpense}
                accounts={accounts}
            />

            {
                isRecurringExpenseFormOpen && (
                    <RecurringExpenseFormModal
                        isOpen={isRecurringExpenseFormOpen}
                        onClose={() => {
                            setIsRecurringExpenseFormOpen(false);
                            setEditingRecurringExpense(null);
                        }}
                        onSave={onSaveRecurringExpense}
                        expenseToEdit={editingRecurringExpense}
                        accounts={accounts}
                    />
                )
            }
        </div >
    );
};

export default AccountingPage;