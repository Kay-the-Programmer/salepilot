import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Account, JournalEntry, Sale, Expense, SupplierInvoice, StoreSettings } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { parseApiDate } from '../../components/crm/crmModel';
import StandaloneShell from '../../components/standalone/StandaloneShell';
import './accounting.css';

const ExpenseFormModal = React.lazy(() => import('../../components/accounting/ExpenseFormModal'));

type Tab = 'dashboard' | 'ledger' | 'expenses' | 'reports';

interface FinancialSummary {
  summary: { inventoryValue: number; accountsReceivable: number; accountsPayable: number; storeCreditValue: number; cashBalance: number; totalAssets: number; totalLiabilities: number; equity: number };
  period: { revenue: number; cogs: number; expenses: number; grossProfit: number; netIncome: number };
}

interface AccountingAppProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  sales: Sale[];
  expenses: Expense[];
  supplierInvoices: SupplierInvoice[];
  storeSettings: StoreSettings;
  onSaveExpense: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'> & { id?: string }) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DONUT_COLORS = ['#008060', '#ffa535', '#56566d', '#ba1a1a', '#75d9b3', '#895100'];

const sameMonth = (d: Date, y: number, m: number) => d.getFullYear() === y && d.getMonth() === m;

/** UTC-safe timestamp helpers (backend naive strings = server-local = UTC). */
const tsOf = (v?: string): number => parseApiDate(v ?? null)?.getTime() ?? 0;
const inMonth = (v: string | undefined, y: number, m: number): boolean => {
  const d = parseApiDate(v ?? null);
  return !!d && sameMonth(d, y, m);
};
const fmtLocalDate = (v?: string): string => parseApiDate(v ?? null)?.toLocaleDateString() ?? '';

const AccountingApp: React.FC<AccountingAppProps> = ({ accounts, journalEntries, sales, expenses, supplierInvoices, storeSettings, onSaveExpense }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState<'pl' | 'bs' | null>('pl');
  const fmt = (n: number) => formatCurrency(n, storeSettings);

  // Client-side fallback so the hub still works when the summary endpoint is unreachable.
  const fallback = useMemo<FinancialSummary>(() => {
    const now = new Date();
    const months = period === 'quarterly' ? 3 : 1;
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).getTime();
    const revenue = sales.filter((s) => tsOf(s.timestamp) >= start).reduce((a, s) => a + (s.total || 0), 0);
    const exp = expenses.filter((e) => tsOf(e.date) >= start).reduce((a, e) => a + (e.amount || 0), 0);
    const sum = (t: Account['type']) => accounts.filter((a) => a.type === t).reduce((a, x) => a + (x.balance || 0), 0);
    const totalAssets = sum('asset');
    const totalLiabilities = sum('liability');
    return {
      summary: { inventoryValue: 0, accountsReceivable: 0, accountsPayable: 0, storeCreditValue: 0, cashBalance: 0, totalAssets, totalLiabilities, equity: totalAssets - totalLiabilities },
      period: { revenue, cogs: 0, expenses: exp, grossProfit: revenue, netIncome: revenue - exp },
    };
  }, [accounts, sales, expenses, period]);

  useEffect(() => {
    const now = new Date();
    const months = period === 'quarterly' ? 3 : 1;
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    let active = true;
    api.get<FinancialSummary>(`/accounting/summary?startDate=${startDate}&endDate=${endDate}`)
      .then((d) => { if (active && d?.period) setSummary(d); })
      .catch(() => { /* keep fallback */ });
    return () => { active = false; };
  }, [period]);

  const fin = summary || fallback;

  /* ------------------------------ derived data ------------------------------ */
  const cashFlow = useMemo(() => {
    const now = new Date();
    const out: { label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear(), m = d.getMonth();
      const income = sales.filter((s) => inMonth(s.timestamp, y, m)).reduce((a, s) => a + (s.total || 0), 0);
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

  const monthLedger = useMemo(() => {
    const now = new Date();
    let debit = 0, credit = 0;
    journalEntries.forEach((e) => {
      if (inMonth(e.date, now.getFullYear(), now.getMonth())) {
        e.lines.forEach((l) => { if (l.type === 'debit') debit += l.amount; else credit += l.amount; });
      }
    });
    return { debit, credit };
  }, [journalEntries]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => { const c = e.category || e.expenseAccountName || 'Other'; map.set(c, (map.get(c) || 0) + (e.amount || 0)); });
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [expenses]);
  const expenseTotal = expenseByCategory.reduce((a, c) => a + c.value, 0);
  const monthExpense = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => inMonth(e.date, now.getFullYear(), now.getMonth())).reduce((a, e) => a + (e.amount || 0), 0);
  }, [expenses]);

  const byType = (t: Account['type']) => accounts.filter((a) => a.type === t).filter((a) => Math.abs(a.balance) > 0.001);
  const totalOf = (t: Account['type']) => accounts.filter((a) => a.type === t).reduce((a, x) => a + (x.balance || 0), 0);

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', active: tab === 'dashboard', onClick: () => setTab('dashboard') },
    { icon: 'menu_book', label: 'Ledger', active: tab === 'ledger', onClick: () => setTab('ledger') },
    { icon: 'payments', label: 'Expenses', active: tab === 'expenses', onClick: () => setTab('expenses') },
    { icon: 'bar_chart', label: 'Reports', active: tab === 'reports', onClick: () => setTab('reports') },
  ];

  return (
    <StandaloneShell icon="account_balance" title="Accounting Hub" scopeClass="sp-books" navItems={navItems}>
      <div className="px-4 md:px-8 py-5 max-w-3xl mx-auto w-full pb-28 md:pb-10">
        {/* Desktop tab switcher */}
        <div className="hidden md:flex justify-center mb-6">
          <div className="seg">
            {navItems.map((n) => (
              <button key={n.label} className={n.active ? 'is-active' : ''} onClick={n.onClick}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'dashboard' && (
          <div className="sp-fade-in">
            <h2 className="text-2xl md:text-[28px] font-bold m3-text-on-surface">Financial Pulse</h2>
            <p className="text-sm m3-text-on-surface-variant mb-4">Real-time business health monitoring</p>

            {/* period toggle */}
            <div className="inline-flex m3-bg-surface-container rounded-full p-1 mb-5">
              {(['monthly', 'quarterly'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition ${period === p ? 'm3-bg-surface-lowest m3-text-primary shadow-sm' : 'm3-text-on-surface-variant'}`}>{p}</button>
              ))}
            </div>

            {/* KPI cards */}
            <div className="space-y-3 mb-5">
              <KpiCard icon="trending_up" label="Total Revenue" value={fmt(fin.period.revenue)} tone="primary" />
              <KpiCard icon="trending_down" label="Total Expenses" value={fmt(fin.period.expenses + fin.period.cogs)} tone="error" />
              <div className="m3-bg-primary-container rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined m3-text-on-primary-container p-2 rounded-lg" style={{ background: 'rgba(255,255,255,.15)' }}>account_balance_wallet</span>
                  <span className="text-xs font-bold m3-text-on-primary-container">{fin.period.revenue > 0 ? `${((fin.period.netIncome / fin.period.revenue) * 100).toFixed(1)}% margin` : '—'}</span>
                </div>
                <p className="text-sm m3-text-on-primary-container/90" style={{ opacity: 0.9 }}>Net Profit</p>
                <p className="text-3xl font-bold m3-text-on-primary-container">{fmt(fin.period.netIncome)}</p>
              </div>
            </div>

            {/* Cash flow */}
            <div className="m3-bg-surface-lowest rounded-2xl p-5 shadow-sm border m3-border-outline-variant mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold m3-text-on-surface">Cash Flow</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 m3-text-on-surface-variant"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#008060' }} />Income</span>
                  <span className="flex items-center gap-1 m3-text-on-surface-variant"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ba1a1a' }} />Expense</span>
                </div>
              </div>
              <div className="flex items-end justify-between gap-2 h-40">
                {cashFlow.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 w-full justify-center" style={{ height: 130 }}>
                      <div className="bar w-3 md:w-4" style={{ height: `${Math.max(4, (c.income / cashFlowMax) * 130)}px`, background: '#008060' }} title={fmt(c.income)} />
                      <div className="bar w-3 md:w-4" style={{ height: `${Math.max(4, (c.expense / cashFlowMax) * 130)}px`, background: '#f3b0b0' }} title={fmt(c.expense)} />
                    </div>
                    <span className="text-[11px] m3-text-on-surface-variant">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending payments */}
            <div className="m3-bg-surface-lowest rounded-2xl p-5 shadow-sm border m3-border-outline-variant mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold m3-text-on-surface">Pending Payments</h3>
                <button onClick={() => navigate('/purchase-orders')} className="text-sm font-semibold m3-text-primary">View all</button>
              </div>
              {pending.length === 0 ? (
                <p className="text-sm m3-text-on-surface-variant py-4 text-center">No outstanding supplier invoices.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--m3-outline-variant)' }}>
                  {pending.map(({ inv, due, days, overdue }) => (
                    <div key={inv.id} className="flex items-center gap-3 py-3">
                      <span className="w-9 h-9 rounded-full m3-bg-surface-high flex items-center justify-center shrink-0"><span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 20 }}>store</span></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold m3-text-on-surface truncate">{inv.supplierName}</p>
                        <p className="text-[11px] m3-text-on-surface-variant">{overdue ? `Overdue ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}` : `Due in ${days} day${days === 1 ? '' : 's'}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold m3-text-on-surface">{fmt(due)}</p>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${overdue ? 'm3-bg-error-container m3-text-error' : 'm3-bg-secondary-fixed m3-text-secondary'}`}>{overdue ? 'Overdue' : 'Pending'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent ledger */}
            <LedgerCard title="Recent Ledger" entries={recentLedger} fmt={fmt} entryAmount={entryAmount} onExport={() => exportLedgerCSV(recentLedger)} onViewAll={() => setTab('ledger')} />
          </div>
        )}

        {tab === 'ledger' && (
          <div className="sp-fade-in">
            <div className="space-y-3 mb-5">
              <KpiCard icon="account_balance" label="Total Balance" value={fmt(fin.summary.totalAssets)} tone="primary" />
              <KpiCard icon="arrow_upward" label="Monthly Credits" value={fmt(monthLedger.credit)} tone="primary" big />
              <KpiCard icon="arrow_downward" label="Monthly Debits" value={fmt(monthLedger.debit)} tone="error" big />
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => exportLedgerCSV(journalEntries)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold m3-bg-surface-high m3-text-on-surface active:scale-95 transition">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span> Export CSV
              </button>
              <button onClick={() => setTab('expenses')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold m3-bg-primary m3-text-on-primary active:scale-95 transition">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> New Entry
              </button>
            </div>
            <LedgerTable entries={[...journalEntries].sort((a, b) => tsOf(b.date) - tsOf(a.date))} fmt={fmt} />
          </div>
        )}

        {tab === 'expenses' && (
          <div className="sp-fade-in">
            <h2 className="text-2xl md:text-[28px] font-bold m3-text-on-surface">Expenses</h2>
            <p className="text-sm m3-text-on-surface-variant mb-4">Track and manage your business outflows.</p>
            <button onClick={() => setExpenseModalOpen(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold m3-bg-primary m3-text-on-primary shadow active:scale-95 transition mb-5">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span> Add Expense
            </button>

            {/* Donut */}
            <div className="m3-bg-surface-lowest rounded-2xl p-6 shadow-sm border m3-border-outline-variant mb-4">
              {expenseTotal === 0 ? (
                <p className="text-center text-sm m3-text-on-surface-variant py-8">No expenses recorded yet.</p>
              ) : (
                <>
                  <div className="flex justify-center mb-5">
                    <Donut data={expenseByCategory} total={expenseTotal} fmt={fmt} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {expenseByCategory.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <div className="min-w-0">
                          <p className="text-[11px] m3-text-on-surface-variant truncate">{c.name}</p>
                          <p className="text-sm font-semibold m3-text-on-surface">{fmt(c.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="m3-bg-surface-lowest rounded-2xl p-4 shadow-sm border m3-border-outline-variant flex items-center justify-between">
                <div><p className="text-[11px] m3-text-on-surface-variant">Spent this month</p><p className="text-lg font-bold m3-text-secondary">{fmt(monthExpense)}</p></div>
                <span className="material-symbols-outlined m3-text-secondary">receipt_long</span>
              </div>
              <div className="m3-bg-surface-lowest rounded-2xl p-4 shadow-sm border m3-border-outline-variant flex items-center justify-between">
                <div><p className="text-[11px] m3-text-on-surface-variant">Total tracked</p><p className="text-lg font-bold m3-text-primary">{fmt(expenseTotal)}</p></div>
                <span className="material-symbols-outlined m3-text-primary">check_circle</span>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="m3-bg-surface-lowest rounded-2xl shadow-sm border m3-border-outline-variant overflow-hidden">
              <div className="p-4 border-b m3-border-outline-variant"><h3 className="text-lg font-bold m3-text-on-surface">Recent transactions</h3></div>
              {expenses.length === 0 ? (
                <p className="p-6 text-center text-sm m3-text-on-surface-variant">No expenses yet.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--m3-outline-variant)' }}>
                  {[...expenses].sort((a, b) => tsOf(b.date) - tsOf(a.date)).slice(0, 8).map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-4">
                      <span className="w-10 h-10 rounded-lg m3-bg-surface-high flex items-center justify-center shrink-0"><span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 20 }}>receipt</span></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold m3-text-on-surface truncate">{e.description}</p>
                        <p className="text-[11px] m3-text-on-surface-variant">{fmtLocalDate(e.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {e.category && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full m3-bg-tertiary-fixed m3-text-tertiary">{e.category}</span>}
                        <span className="text-sm font-bold m3-text-on-surface">{fmt(e.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="sp-fade-in">
            <h2 className="text-2xl md:text-[28px] font-bold m3-text-on-surface">Financial Statements</h2>
            <p className="text-sm m3-text-on-surface-variant mb-4">Review your business health through P&amp;L and Balance Sheet.</p>

            <div className="space-y-3 mb-5">
              <KpiCard icon="trending_up" label="Net Profit" value={fmt(fin.period.netIncome)} tone="primary" />
              <KpiCard icon="account_balance" label="Total Assets" value={fmt(fin.summary.totalAssets)} tone="primary" />
              <KpiCard icon="trending_down" label="Operating Expenses" value={fmt(fin.period.expenses)} tone="error" />
            </div>

            {/* P&L */}
            <div className="m3-bg-surface-lowest rounded-2xl shadow-sm border m3-border-outline-variant mb-4 overflow-hidden">
              <button onClick={() => setReportOpen(reportOpen === 'pl' ? null : 'pl')} className="w-full flex items-center gap-3 p-4">
                <span className="w-9 h-9 rounded-lg m3-bg-primary-fixed m3-text-primary flex items-center justify-center"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>query_stats</span></span>
                <div className="flex-1 text-left"><h3 className="text-base font-bold m3-text-on-surface">Profit &amp; Loss</h3><p className="text-[11px] m3-text-on-surface-variant">Chart of accounts</p></div>
                <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ transform: reportOpen === 'pl' ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }}>expand_more</span>
              </button>
              {reportOpen === 'pl' && (
                <div className="px-4 pb-4">
                  <StatementTable
                    sections={[
                      { title: 'Revenue', color: 'm3-text-primary', rows: byType('revenue').map((a) => ({ name: a.name, credit: a.balance })), total: { name: 'Total revenue', credit: totalOf('revenue') } },
                      { title: 'Operating Expenses', color: 'm3-text-error', rows: byType('expense').map((a) => ({ name: a.name, debit: a.balance })), total: { name: 'Total expenses', debit: totalOf('expense') } },
                    ]}
                    fmt={fmt}
                    net={{ name: 'Net ordinary income', value: totalOf('revenue') - totalOf('expense') }}
                  />
                </div>
              )}
            </div>

            {/* Balance sheet */}
            <div className="m3-bg-surface-lowest rounded-2xl shadow-sm border m3-border-outline-variant overflow-hidden">
              <button onClick={() => setReportOpen(reportOpen === 'bs' ? null : 'bs')} className="w-full flex items-center gap-3 p-4">
                <span className="w-9 h-9 rounded-lg m3-bg-tertiary-fixed m3-text-tertiary flex items-center justify-center"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>account_balance</span></span>
                <div className="flex-1 text-left"><h3 className="text-base font-bold m3-text-on-surface">Balance Sheet</h3><p className="text-[11px] m3-text-on-surface-variant">As of {new Date().toLocaleDateString()}</p></div>
                <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ transform: reportOpen === 'bs' ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }}>expand_more</span>
              </button>
              {reportOpen === 'bs' && (
                <div className="px-4 pb-4">
                  <StatementTable
                    sections={[
                      { title: 'Assets', color: 'm3-text-primary', rows: byType('asset').map((a) => ({ name: a.name, debit: a.balance })), total: { name: 'Total assets', debit: totalOf('asset') } },
                      { title: 'Liabilities', color: 'm3-text-error', rows: byType('liability').map((a) => ({ name: a.name, credit: a.balance })), total: { name: 'Total liabilities', credit: totalOf('liability') } },
                      { title: 'Equity', color: 'm3-text-tertiary', rows: byType('equity').map((a) => ({ name: a.name, credit: a.balance })), total: { name: 'Total equity', credit: totalOf('equity') } },
                    ]}
                    fmt={fmt}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {expenseModalOpen && (
        <Suspense fallback={null}>
          <ExpenseFormModal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} onSave={(e) => { onSaveExpense(e); setExpenseModalOpen(false); }} accounts={accounts} />
        </Suspense>
      )}
    </StandaloneShell>
  );
};

/* --------------------------------- pieces --------------------------------- */
const KpiCard: React.FC<{ icon: string; label: string; value: string; tone: 'primary' | 'error'; big?: boolean }> = ({ icon, label, value, tone, big }) => (
  <div className="m3-bg-surface-lowest rounded-2xl p-5 shadow-sm border m3-border-outline-variant">
    <span className={`material-symbols-outlined ${tone === 'error' ? 'm3-text-error' : 'm3-text-primary'}`} style={{ fontSize: 28 }}>{icon}</span>
    <p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant mt-2">{label}</p>
    <p className={`${big ? 'text-2xl' : 'text-2xl'} font-bold ${tone === 'error' ? 'm3-text-error' : 'm3-text-on-surface'}`}>{value}</p>
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
      <div className="divide-y" style={{ borderColor: 'var(--m3-outline-variant)' }}>
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

const LedgerTable: React.FC<{ entries: JournalEntry[]; fmt: (n: number) => string }> = ({ entries, fmt }) => {
  const [page, setPage] = useState(1);
  const size = 8;
  const totalPages = Math.max(1, Math.ceil(entries.length / size));
  const slice = entries.slice((page - 1) * size, page * size);
  const debit = (e: JournalEntry) => e.lines.filter((l) => l.type === 'debit').reduce((a, l) => a + l.amount, 0);
  const credit = (e: JournalEntry) => e.lines.filter((l) => l.type === 'credit').reduce((a, l) => a + l.amount, 0);
  const totDebit = entries.reduce((a, e) => a + debit(e), 0);
  const totCredit = entries.reduce((a, e) => a + credit(e), 0);
  return (
    <div className="m3-bg-surface-lowest rounded-2xl shadow-sm border m3-border-outline-variant overflow-hidden">
      {entries.length === 0 ? <p className="p-8 text-center text-sm m3-text-on-surface-variant">No journal entries yet.</p> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="m3-bg-surface-low m3-text-on-surface-variant">
                <tr><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Description</th><th className="px-4 py-3 font-semibold text-right">Debit</th><th className="px-4 py-3 font-semibold text-right">Credit</th></tr>
              </thead>
              <tbody>
                {slice.map((e) => (
                  <tr key={e.id} className="border-t m3-border-outline-variant hover:m3-bg-surface-low transition-colors">
                    <td className="px-4 py-3 m3-text-on-surface-variant whitespace-nowrap">{fmtLocalDate(e.date)}</td>
                    <td className="px-4 py-3 m3-text-on-surface"><span className="font-medium">{e.description}</span>{e.reference && <span className="block text-[11px] m3-text-on-surface-variant">{e.reference}</span>}</td>
                    <td className="px-4 py-3 text-right m3-text-error">{debit(e) ? fmt(debit(e)) : '—'}</td>
                    <td className="px-4 py-3 text-right m3-text-primary">{credit(e) ? fmt(credit(e)) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t m3-border-outline-variant text-xs">
            <div className="flex gap-4"><span className="m3-text-error font-semibold">Dr {fmt(totDebit)}</span><span className="m3-text-primary font-semibold">Cr {fmt(totCredit)}</span></div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg m3-bg-surface-high disabled:opacity-40"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span></button>
              <span className="m3-text-on-surface-variant">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg m3-bg-surface-high disabled:opacity-40"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Donut: React.FC<{ data: { name: string; value: number }[]; total: number; fmt: (n: number) => string }> = ({ data, total, fmt }) => {
  let acc = 0;
  const stops = data.map((d, i) => {
    const start = (acc / total) * 360; acc += d.value; const end = (acc / total) * 360;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}deg ${end}deg`;
  }).join(', ');
  return (
    <div className="donut relative" style={{ width: 200, height: 200, ['--donut' as any]: `conic-gradient(${stops})` }}>
      <div className="absolute inset-0 m-[28px] rounded-full m3-bg-surface-lowest flex flex-col items-center justify-center">
        <span className="text-[11px] m3-text-on-surface-variant">Total</span>
        <span className="text-xl font-bold m3-text-on-surface">{fmt(total)}</span>
      </div>
    </div>
  );
};

interface Row { name: string; debit?: number; credit?: number }
const StatementTable: React.FC<{ sections: { title: string; color: string; rows: Row[]; total: Row }[]; fmt: (n: number) => string; net?: { name: string; value: number } }> = ({ sections, fmt, net }) => (
  <table className="w-full text-sm mt-2">
    <thead><tr className="m3-text-on-surface-variant text-[11px] uppercase"><th className="text-left font-semibold py-2">Account</th><th className="text-right font-semibold py-2">Debit</th><th className="text-right font-semibold py-2">Credit</th></tr></thead>
    <tbody>
      {sections.map((s) => (
        <React.Fragment key={s.title}>
          <tr><td colSpan={3} className={`pt-3 pb-1 text-sm font-bold ${s.color}`}>{s.title}</td></tr>
          {s.rows.length === 0 && <tr><td colSpan={3} className="py-2 text-[13px] m3-text-on-surface-variant">No accounts</td></tr>}
          {s.rows.map((r, i) => (
            <tr key={i} className="border-b" style={{ borderColor: 'var(--m3-outline-variant)' }}>
              <td className="py-2 m3-text-on-surface-variant pl-2">{r.name}</td>
              <td className="py-2 text-right m3-text-on-surface">{r.debit ? fmt(r.debit) : '—'}</td>
              <td className="py-2 text-right m3-text-on-surface">{r.credit ? fmt(r.credit) : '—'}</td>
            </tr>
          ))}
          <tr className="font-bold"><td className="py-2 m3-text-on-surface">{s.total.name}</td><td className="py-2 text-right m3-text-on-surface">{s.total.debit ? fmt(s.total.debit) : '—'}</td><td className="py-2 text-right m3-text-on-surface">{s.total.credit ? fmt(s.total.credit) : '—'}</td></tr>
        </React.Fragment>
      ))}
      {net && (
        <tr className="m3-bg-primary-fixed"><td className="py-3 px-2 font-bold m3-text-primary rounded-l-lg">{net.name}</td><td /><td className="py-3 px-2 text-right font-bold m3-text-primary rounded-r-lg">{fmt(net.value)}</td></tr>
      )}
    </tbody>
  </table>
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
