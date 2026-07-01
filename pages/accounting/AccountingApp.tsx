import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import type {
  Account, JournalEntry, Sale, Expense, SupplierInvoice, StoreSettings,
  Customer, Supplier, PurchaseOrder, RecurringExpense, Payment, SupplierPayment, User,
} from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { parseApiDate } from '../../components/crm/crmModel';
import { logEvent } from '../../src/utils/analytics';
import AccountingShell, { ACCT_NAV, AcctSection } from '../../components/accounting/AccountingShell';
import AccountingDatePicker, { DateRange, defaultDateRange } from '../../components/accounting/AccountingDatePicker';
import './accounting.css';

// Rich management views — the accounting feature set, consolidated into this hub.
import ARManagementView from '../../components/accounting/views/ARManagementView';
import APManagementView from '../../components/accounting/views/APManagementView';
import ExpensesView from '../../components/accounting/views/ExpensesView';
import ChartOfAccountsView from '../../components/accounting/views/ChartOfAccountsView';
import JournalView from '../../components/accounting/views/JournalView';
import FinancialStatementsView from '../../components/accounting/views/FinancialStatementsView';
import TaxReportView from '../../components/accounting/views/TaxReportView';

// Modals (lazy — only loaded when opened).
// One modal now handles both one-time and recurring expenses.
const ExpenseFormModal = React.lazy(() => import('../../components/accounting/ExpenseFormModal'));
const AccountAdjustmentModal = React.lazy(() => import('../../components/accounting/AccountAdjustmentModal'));
const SupplierInvoiceFormModal = React.lazy(() => import('../../components/accounting/SupplierInvoiceFormModal'));
const SupplierInvoiceDetailModal = React.lazy(() => import('../../components/accounting/SupplierInvoiceDetailModal'));
const SalesInvoiceDetailModal = React.lazy(() => import('../../components/accounting/SalesInvoiceDetailModal'));
const UnifiedRecordPaymentModal = React.lazy(() => import('../../components/accounting/UnifiedRecordPaymentModal'));

type Tab = AcctSection;

interface FinancialSummary {
  summary: { inventoryValue: number; accountsReceivable: number; accountsPayable: number; storeCreditValue: number; cashBalance: number; totalAssets: number; totalLiabilities: number; equity: number };
  period: { revenue: number; cogs: number; expenses: number; grossProfit: number; netIncome: number };
}

interface AccountingAppProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  supplierInvoices: SupplierInvoice[];
  purchaseOrders: PurchaseOrder[];
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  storeSettings: StoreSettings;
  isLoading: boolean;
  error: string | null;
  onSaveAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddManualJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  onRecordPayment: (saleId: string, payment: Omit<Payment, 'id'>) => void;
  onSaveSupplierInvoice: (invoice: SupplierInvoice) => void;
  onRecordSupplierPayment: (invoiceId: string, payment: Omit<SupplierPayment, 'id'>) => void;
  onSaveExpense: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'> & { id?: string }) => void;
  onDeleteExpense: (expenseId: string) => void;
  onSaveRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'nextRunDate' | 'status'> & { id?: string; status?: string }) => void;
  onDeleteRecurringExpense: (expenseId: string) => void;
  user: User;
  onExit: () => void;
  onLogout: () => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const sameMonth = (d: Date, y: number, m: number) => d.getFullYear() === y && d.getMonth() === m;

/** UTC-safe timestamp helpers (backend naive strings = server-local = UTC). */
const tsOf = (v?: string): number => parseApiDate(v ?? null)?.getTime() ?? 0;
const inMonth = (v: string | undefined, y: number, m: number): boolean => {
  const d = parseApiDate(v ?? null);
  return !!d && sameMonth(d, y, m);
};
const fmtLocalDate = (v?: string): string => parseApiDate(v ?? null)?.toLocaleDateString() ?? '';

const TAB_NAMES = ACCT_NAV.map((n) => n.id) as string[];

const AccountingApp: React.FC<AccountingAppProps> = ({
  accounts, journalEntries, sales, customers, suppliers, supplierInvoices, purchaseOrders,
  expenses, recurringExpenses, storeSettings, isLoading, error,
  onSaveAccount, onDeleteAccount, onAddManualJournalEntry, onRecordPayment,
  onSaveSupplierInvoice, onRecordSupplierPayment, onSaveExpense, onDeleteExpense,
  onSaveRecurringExpense, onDeleteRecurringExpense,
  user, onExit, onLogout,
}) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [range, setRange] = useState<DateRange>(defaultDateRange);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const fmt = (n: number) => formatCurrency(n, storeSettings);

  // Modal state (mirrors the legacy Accounting page so every action stays functional).
  const [isSupplierInvoiceFormOpen, setIsSupplierInvoiceFormOpen] = useState(false);
  const [editingSupplierInvoice, setEditingSupplierInvoice] = useState<SupplierInvoice | null>(null);
  const [viewingAPInvoice, setViewingAPInvoice] = useState<SupplierInvoice | null>(null);
  const [viewingARInvoice, setViewingARInvoice] = useState<Sale | null>(null);
  const [isRecordSupplierPaymentOpen, setIsRecordSupplierPaymentOpen] = useState(false);
  const [invoiceToPayAP, setInvoiceToPayAP] = useState<SupplierInvoice | null>(null);
  const [isRecordARPaymentOpen, setIsRecordARPaymentOpen] = useState(false);
  const [invoiceToPayAR, setInvoiceToPayAR] = useState<Sale | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [accountToAdjust, setAccountToAdjust] = useState<Account | null>(null);
  // Unified expense modal — one modal, two modes (one-time / recurring).
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseMode, setExpenseMode] = useState<'one-time' | 'recurring'>('one-time');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingRecurringExpense, setEditingRecurringExpense] = useState<RecurringExpense | null>(null);

  // Deep-link support: /books#expenses selects the matching tab on load.
  const didHash = useRef(false);
  useEffect(() => {
    if (didHash.current) return;
    didHash.current = true;
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hash && TAB_NAMES.includes(hash)) setTab(hash as Tab);
  }, []);

  const goTab = (t: Tab) => {
    if (t !== tab) logEvent('Accounting', 'navigate_tab', t);
    setTab(t);
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `#${t}`);
  };

  // Client-side fallback so the Overview still works when the summary endpoint is unreachable.
  // Follows the standard income-statement build-up:
  //   Net Revenue (ex-tax) − COGS = Gross Profit;  Gross Profit − Operating Expenses = Net Income.
  const fallback = useMemo<FinancialSummary>(() => {
    const startMs = range.start.getTime();
    const endMs = range.end.getTime() + 86400000; // include the whole end day
    const inRange = (v?: string) => { const t = tsOf(v); return t >= startMs && t <= endMs; };
    const periodSales = sales.filter((s) => inRange(s.timestamp) && s.fulfillmentStatus !== 'cancelled');
    // Revenue is net of sales tax — tax collected is a liability, not income.
    const revenue = periodSales.reduce((a, s) => a + (s.subtotal || 0), 0);
    // Cost of goods sold = per-line cost × quantity captured at time of sale.
    const cogs = periodSales.reduce(
      (a, s) => a + (s.cart || []).reduce((c, i) => c + (i.costPrice || 0) * (i.quantity || 0), 0),
      0,
    );
    const exp = expenses.filter((e) => inRange(e.date)).reduce((a, e) => a + (e.amount || 0), 0);
    const grossProfit = revenue - cogs;
    const netIncome = grossProfit - exp;
    const sum = (t: Account['type']) => accounts.filter((a) => a.type === t).reduce((a, x) => a + (x.balance || 0), 0);
    const totalAssets = sum('asset');
    const totalLiabilities = sum('liability');
    return {
      summary: { inventoryValue: 0, accountsReceivable: 0, accountsPayable: 0, storeCreditValue: 0, cashBalance: 0, totalAssets, totalLiabilities, equity: totalAssets - totalLiabilities },
      period: { revenue, cogs, expenses: exp, grossProfit, netIncome },
    };
  }, [accounts, sales, expenses, range]);

  useEffect(() => {
    const toIso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    let active = true;
    setSummary(null); // clear stale figures so the range-aware fallback shows while the fetch is in flight
    api.get<FinancialSummary>(`/accounting/summary?startDate=${toIso(range.start)}&endDate=${toIso(range.end)}`)
      .then((d) => { if (active && d?.period) setSummary(d); })
      .catch(() => { /* keep fallback */ });
    return () => { active = false; };
  }, [range]);

  const fin = summary || fallback;

  /* ------------------------------ Overview data ----------------------------- */
  const cashFlow = useMemo(() => {
    const now = new Date();
    const out: { label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear(), m = d.getMonth();
      // Income = net revenue (ex-tax), consistent with the revenue KPI above.
      const income = sales.filter((s) => inMonth(s.timestamp, y, m) && s.fulfillmentStatus !== 'cancelled').reduce((a, s) => a + (s.subtotal || 0), 0);
      const expense = expenses.filter((e) => inMonth(e.date, y, m)).reduce((a, e) => a + (e.amount || 0), 0);
      out.push({ label: MONTHS[m], income, expense });
    }
    return out;
  }, [sales, expenses]);
  const cashFlowMax = Math.max(1, ...cashFlow.flatMap((c) => [c.income, c.expense]));

  const pending = useMemo(() => {
    const now = Date.now();
    return supplierInvoices
      .map((inv) => ({ inv, due: (inv.amount || 0) - (inv.amountPaid || 0) }))
      .filter((x) => x.due > 0.01 && x.inv.status !== 'paid')
      .map((x) => {
        const dueTs = parseApiDate(x.inv.dueDate)?.getTime() ?? null;
        const days = dueTs !== null ? Math.round((dueTs - now) / 86400000) : 9999;
        return { ...x, days, overdue: (dueTs !== null && days < 0) || x.inv.status === 'overdue' };
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 4);
  }, [supplierInvoices]);

  const recentLedger = useMemo(
    () => [...journalEntries].sort((a, b) => tsOf(b.date) - tsOf(a.date)).slice(0, 5),
    [journalEntries],
  );
  const entryAmount = (e: JournalEntry) => e.lines.filter((l) => l.type === 'debit').reduce((a, l) => a + l.amount, 0);

  /* --------------------------------- handlers ------------------------------- */
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
    accountId: string, adjustmentAmount: number, offsetAccountId: string, offsetAccountName: string, description: string,
  ) => {
    try {
      await api.post(`/accounting/accounts/${accountId}/adjust`, { adjustmentAmount, offsetAccountId, offsetAccountName, description });
      logEvent('Accounting', 'adjust_account', accountId);
      window.location.reload();
    } catch (err: any) {
      console.error('Error adjusting account:', err);
      alert(err.message || 'Error adjusting account balance');
    }
  };
  const openExpenseModal = (m: 'one-time' | 'recurring', expense: Expense | null = null, recurring: RecurringExpense | null = null) => {
    setExpenseMode(m);
    setEditingExpense(expense);
    setEditingRecurringExpense(recurring);
    setExpenseModalOpen(true);
  };
  const closeExpenseModal = () => { setExpenseModalOpen(false); setEditingExpense(null); setEditingRecurringExpense(null); };
  const handleEditExpense = (expense: Expense) => openExpenseModal('one-time', expense);
  const handleEditRecurringExpense = (expense: RecurringExpense) => openExpenseModal('recurring', null, expense);

  /* --------------------------------- content -------------------------------- */
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-20">
          <div className="w-14 h-14 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--m3-outline-variant)', borderTopColor: 'var(--m3-primary)' }} />
          <p className="m3-text-on-surface-variant text-sm">Loading accounting data…</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="m3-bg-error-container rounded-2xl p-6 flex items-start gap-3">
          <span className="material-symbols-outlined m3-text-error mt-0.5">error</span>
          <div>
            <h4 className="font-bold m3-text-on-error-container">Error loading data</h4>
            <p className="text-sm m3-text-on-error-container/90 mt-1" style={{ opacity: 0.9 }}>{error}</p>
          </div>
        </div>
      );
    }

    switch (tab) {
      case 'ar_management':
        return (
          <ARManagementView
            sales={sales}
            customers={customers}
            storeSettings={storeSettings}
            onRecordPayment={onRecordPayment}
            onViewInvoice={setViewingARInvoice}
          />
        );
      case 'ap_management':
        return (
          <APManagementView
            supplierInvoices={supplierInvoices}
            purchaseOrders={purchaseOrders}
            suppliers={suppliers}
            storeSettings={storeSettings}
            onRecordPayment={onRecordSupplierPayment}
            onSaveInvoice={onSaveSupplierInvoice}
            onViewInvoice={setViewingAPInvoice}
            onOpenInvoiceForm={() => { setEditingSupplierInvoice(null); setIsSupplierInvoiceFormOpen(true); }}
          />
        );
      case 'chart_of_accounts':
        return (
          <ChartOfAccountsView
            accounts={accounts}
            storeSettings={storeSettings}
            onSaveAccount={(account) => { logEvent('Accounting', account.id ? 'update_account' : 'create_account', account.name); onSaveAccount(account); }}
            onDeleteAccount={(id) => { logEvent('Accounting', 'delete_account', id); onDeleteAccount(id); }}
            onAdjustAccount={(account) => { setAccountToAdjust(account); setIsAdjustmentModalOpen(true); }}
            recurringExpenses={recurringExpenses}
          />
        );
      case 'journal':
        return (
          <JournalView
            entries={journalEntries}
            accounts={accounts}
            sales={sales}
            customers={customers}
            storeSettings={storeSettings}
            onAddEntry={onAddManualJournalEntry}
          />
        );
      case 'expenses':
        return (
          <ExpensesView
            expenses={expenses}
            recurringExpenses={recurringExpenses}
            accounts={accounts}
            storeSettings={storeSettings}
            onSave={(expense) => { logEvent('Accounting', expense.id ? 'edit_expense' : 'create_expense', expense.id); onSaveExpense(expense); }}
            onDelete={(id) => { logEvent('Accounting', 'delete_expense', id); onDeleteExpense(id); }}
            onEdit={handleEditExpense}
            onOpenForm={() => openExpenseModal('one-time')}
            onSaveRecurring={(expense) => { logEvent('Accounting', expense.id ? 'edit_recurring_expense' : 'create_recurring_expense', expense.id); onSaveRecurringExpense(expense); }}
            onDeleteRecurring={(id) => { logEvent('Accounting', 'delete_recurring_expense', id); onDeleteRecurringExpense(id); }}
            onEditRecurring={handleEditRecurringExpense}
            onOpenRecurringForm={() => openExpenseModal('recurring')}
          />
        );
      case 'taxes':
        return <TaxReportView sales={sales} storeSettings={storeSettings} />;
      case 'reports':
        return <FinancialStatementsView accounts={accounts} journalEntries={journalEntries} storeSettings={storeSettings} />;
      case 'overview':
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => {
    const margin = fin.period.revenue > 0 ? (fin.period.netIncome / fin.period.revenue) * 100 : null;
    return (
      <div className="sp-fade-in space-y-6">
        {/* Header + encapsulated date picker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold m3-text-on-surface tracking-tight">Financial Pulse</h2>
            <p className="text-sm m3-text-on-surface-variant mt-1">Business health · {range.label}</p>
          </div>
          <AccountingDatePicker value={range} onChange={setRange} />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Revenue" value={fmt(fin.period.revenue)} icon="trending_up" accent="m3-text-primary" />
          <StatCard label="Gross Profit" value={fmt(fin.period.grossProfit)} icon="savings" accent="m3-text-tertiary" sub="Revenue − COGS" />
          <StatCard label="Total Costs" value={fmt(fin.period.expenses + fin.period.cogs)} icon="trending_down" accent="m3-text-error" sub="COGS + operating" />
          <div className="m3-bg-primary-container rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined m3-text-on-primary-container" style={{ fontSize: 22 }}>account_balance_wallet</span>
              {margin !== null && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full m3-text-on-primary-container" style={{ background: 'rgba(255,255,255,.15)' }}>{margin.toFixed(1)}%</span>
              )}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest m3-text-on-primary-container" style={{ opacity: 0.85 }}>Net Profit</p>
            <p className="text-2xl font-bold m3-text-on-primary-container tracking-tight mt-0.5">{fmt(fin.period.netIncome)}</p>
          </div>
        </div>

        {/* Charts + panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cash flow */}
          <div className="lg:col-span-2 m3-bg-surface-lowest rounded-2xl p-5 shadow-sm border m3-border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold m3-text-on-surface">Cash Flow</h3>
                <p className="text-[11px] m3-text-on-surface-variant">Last 6 months</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 m3-text-on-surface-variant"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--m3-primary)' }} />Income</span>
                <span className="flex items-center gap-1 m3-text-on-surface-variant"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--m3-error)' }} />Expense</span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-44">
              {cashFlow.map((c, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex items-end gap-1 w-full justify-center" style={{ height: 150 }}>
                    <div className="bar w-3.5 md:w-5" style={{ height: `${Math.max(4, (c.income / cashFlowMax) * 150)}px`, background: 'var(--m3-primary)' }} title={fmt(c.income)} />
                    <div className="bar w-3.5 md:w-5" style={{ height: `${Math.max(4, (c.expense / cashFlowMax) * 150)}px`, background: 'var(--m3-error)' }} title={fmt(c.expense)} />
                  </div>
                  <span className="text-[11px] m3-text-on-surface-variant">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending payments */}
          <div className="lg:col-span-1 m3-bg-surface-lowest rounded-2xl p-5 shadow-sm border m3-border-outline-variant">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold m3-text-on-surface">Pending Payments</h3>
              <button onClick={() => goTab('ap_management')} className="text-xs font-semibold m3-text-primary">View all</button>
            </div>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined m3-text-on-surface-variant mb-1" style={{ fontSize: 28, opacity: 0.6 }}>check_circle</span>
                <p className="text-sm m3-text-on-surface-variant">Nothing outstanding</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--m3-outline-variant)]">
                {pending.map(({ inv, due, days, overdue }) => (
                  <div key={inv.id} className="flex items-center gap-3 py-3">
                    <span className="w-9 h-9 rounded-full m3-bg-surface-high flex items-center justify-center shrink-0"><span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 20 }}>store</span></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold m3-text-on-surface truncate">{inv.supplierName}</p>
                      <p className="text-[11px] m3-text-on-surface-variant">{overdue ? `Overdue ${Math.abs(days)}d` : `Due in ${days}d`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold m3-text-on-surface">{fmt(due)}</p>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${overdue ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>{overdue ? 'Overdue' : 'Pending'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent ledger — full width */}
          <div className="lg:col-span-3">
            <LedgerCard title="Recent Ledger" entries={recentLedger} fmt={fmt} entryAmount={entryAmount} onExport={() => exportLedgerCSV(recentLedger)} onViewAll={() => goTab('journal')} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <AccountingShell active={tab} user={user} onNavigate={(s) => goTab(s)} onExit={onExit} onLogout={onLogout}>
      <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto w-full pb-28 md:pb-12">
        {renderContent()}
      </div>

      {/* ------------------------------- Modals ------------------------------- */}
      <Suspense fallback={null}>
        {isSupplierInvoiceFormOpen && (
          <SupplierInvoiceFormModal
            isOpen={isSupplierInvoiceFormOpen}
            onClose={() => setIsSupplierInvoiceFormOpen(false)}
            onSave={onSaveSupplierInvoice}
            invoiceToEdit={editingSupplierInvoice}
            purchaseOrders={purchaseOrders}
            suppliers={suppliers}
            storeSettings={storeSettings}
          />
        )}
        {viewingAPInvoice && (
          <SupplierInvoiceDetailModal
            isOpen={!!viewingAPInvoice}
            onClose={() => setViewingAPInvoice(null)}
            invoice={viewingAPInvoice}
            onRecordPayment={handleOpenRecordPaymentAP}
            storeSettings={storeSettings}
          />
        )}
        {invoiceToPayAP && (
          <UnifiedRecordPaymentModal
            isOpen={isRecordSupplierPaymentOpen}
            onClose={() => setIsRecordSupplierPaymentOpen(false)}
            title="Record Supplier Payment"
            invoiceId={invoiceToPayAP.id}
            invoiceNumber={invoiceToPayAP.invoiceNumber}
            balanceDue={invoiceToPayAP.amount - (invoiceToPayAP.amountPaid || 0)}
            customerOrSupplierName={suppliers.find((s) => s.id === invoiceToPayAP.supplierId)?.name || 'Unknown Supplier'}
            paymentMethods={storeSettings.paymentMethods}
            onSave={(invoiceId, payment) => { logEvent('Accounting', 'record_supplier_payment', invoiceId); onRecordSupplierPayment(invoiceId, payment); }}
            storeSettings={storeSettings}
          />
        )}
        {viewingARInvoice && (
          <SalesInvoiceDetailModal
            isOpen={!!viewingARInvoice}
            onClose={() => setViewingARInvoice(null)}
            invoice={sales.find((s) => s.transactionId === viewingARInvoice.transactionId) || viewingARInvoice}
            onRecordPayment={handleOpenRecordPaymentAR}
            storeSettings={storeSettings}
            customerName={viewingARInvoice.customerName || (viewingARInvoice.customerId ? customers.find((c) => c.id === viewingARInvoice.customerId)?.name : undefined) || undefined}
          />
        )}
        {invoiceToPayAR && (
          <UnifiedRecordPaymentModal
            isOpen={isRecordARPaymentOpen}
            onClose={() => setIsRecordARPaymentOpen(false)}
            title="Record Payment"
            invoiceId={invoiceToPayAR.transactionId}
            balanceDue={invoiceToPayAR.total - (invoiceToPayAR.payments?.reduce((s, p) => s + p.amount, 0) || invoiceToPayAR.amountPaid || 0)}
            customerOrSupplierName={invoiceToPayAR.customerName || (invoiceToPayAR.customerId ? customers.find((c) => c.id === invoiceToPayAR.customerId)?.name : undefined)}
            paymentMethods={storeSettings.paymentMethods}
            onSave={(invoiceId, payment) => { logEvent('Accounting', 'record_sale_payment', invoiceId); onRecordPayment(invoiceId, payment); }}
            storeSettings={storeSettings}
          />
        )}
        {accountToAdjust && (
          <AccountAdjustmentModal
            isOpen={isAdjustmentModalOpen}
            onClose={() => { setIsAdjustmentModalOpen(false); setAccountToAdjust(null); }}
            onSave={(amount, offsetId, offsetName, desc) => {
              handleAdjustAccount(accountToAdjust.id, amount, offsetId, offsetName, desc);
              setIsAdjustmentModalOpen(false);
              setAccountToAdjust(null);
            }}
            account={accountToAdjust}
            accounts={accounts}
          />
        )}
        {expenseModalOpen && (
          <ExpenseFormModal
            isOpen={expenseModalOpen}
            onClose={closeExpenseModal}
            accounts={accounts}
            storeSettings={storeSettings}
            initialMode={expenseMode}
            expenseToEdit={editingExpense}
            recurringToEdit={editingRecurringExpense}
            onSave={(e) => { logEvent('Accounting', e.id ? 'edit_expense' : 'create_expense', e.id); onSaveExpense(e); }}
            onSaveRecurring={(r) => { logEvent('Accounting', r.id ? 'edit_recurring_expense' : 'create_recurring_expense', r.id); onSaveRecurringExpense(r); }}
          />
        )}
      </Suspense>
    </AccountingShell>
  );
};

/* --------------------------------- pieces --------------------------------- */
const StatCard: React.FC<{ icon: string; label: string; value: string; accent: string; sub?: string }> = ({ icon, label, value, accent, sub }) => (
  <div className="m3-bg-surface-lowest rounded-2xl p-4 shadow-sm border m3-border-outline-variant">
    <div className="flex items-center justify-between mb-2">
      <span className={`text-[11px] font-semibold uppercase tracking-widest ${accent}`}>{label}</span>
      <span className={`material-symbols-outlined ${accent}`} style={{ fontSize: 20, opacity: 0.8 }}>{icon}</span>
    </div>
    <p className="text-2xl font-bold m3-text-on-surface tracking-tight">{value}</p>
    {sub && <p className="text-[11px] m3-text-on-surface-variant mt-1">{sub}</p>}
  </div>
);

const LedgerCard: React.FC<{ title: string; entries: JournalEntry[]; fmt: (n: number) => string; entryAmount: (e: JournalEntry) => number; onExport: () => void; onViewAll: () => void }> = ({ title, entries, fmt, entryAmount, onExport, onViewAll }) => (
  <div className="m3-bg-surface-lowest rounded-2xl p-5 shadow-sm border m3-border-outline-variant">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-bold m3-text-on-surface">{title}</h3>
      <div className="flex gap-2">
        <button onClick={onViewAll} className="text-xs font-semibold px-3 py-1.5 rounded-lg m3-bg-surface-high m3-text-on-surface">View all</button>
        <button onClick={onExport} className="text-xs font-semibold px-3 py-1.5 rounded-lg m3-bg-surface-high m3-text-on-surface flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>Export</button>
      </div>
    </div>
    {entries.length === 0 ? <p className="text-sm m3-text-on-surface-variant py-3 text-center">No transactions yet.</p> : (
      <div className="divide-y divide-[var(--m3-outline-variant)]">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium m3-text-on-surface truncate">{e.description}</p>
              <p className="text-[11px] m3-text-on-surface-variant">{fmtLocalDate(e.date)} · {e.reference || e.source?.type}</p>
            </div>
            {e.source?.type && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full m3-bg-tertiary-fixed m3-text-tertiary capitalize">{e.source.type}</span>}
            <span className="text-sm font-bold m3-text-on-surface">{fmt(entryAmount(e))}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

function exportLedgerCSV(entries: JournalEntry[]) {
  const rows = [['Date', 'Description', 'Reference', 'Source', 'Debit', 'Credit']];
  entries.forEach((e) => {
    const d = e.lines.filter((l) => l.type === 'debit').reduce((a, l) => a + l.amount, 0);
    const c = e.lines.filter((l) => l.type === 'credit').reduce((a, l) => a + l.amount, 0);
    rows.push([fmtLocalDate(e.date), e.description, e.reference || '', e.source?.type || '', String(d), String(c)]);
  });
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ledger_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default AccountingApp;
