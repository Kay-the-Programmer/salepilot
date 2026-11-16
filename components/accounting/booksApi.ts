import { api } from '../../services/api';
import { Sale } from '../../types';

/**
 * Books reports from the server (s-back books.controller), computed over the
 * whole ledger for the dates asked for. The Books screens used to build these
 * in the browser from the newest 1,000 journal entries / sales, so longer
 * periods silently lost their older records.
 */

export interface StatementLine { id: string; number: string; name: string; subType?: string | null; amount: number }

export interface Statements {
    period: { from: string; to: string };
    asOf: string;
    profitAndLoss: {
        revenue: StatementLine[]; cogs: StatementLine[]; operating: StatementLine[];
        totalRevenue: number; totalCogs: number; grossProfit: number; totalOperating: number; netProfit: number;
    };
    balanceSheet: {
        assets: StatementLine[]; liabilities: StatementLine[]; equity: StatementLine[];
        earningsToDate: number; totalAssets: number; totalLiabilities: number; totalEquity: number;
        balanced: boolean; difference: number;
    };
    trialBalance: {
        rows: { id: string; number: string; name: string; type: string; debit: number; credit: number }[];
        totalDebit: number; totalCredit: number; balanced: boolean;
    };
}

export interface TaxReport {
    period: { from: string; to: string };
    salesCount: number;
    output: { taxClass: string; ratePct: number; net: number; tax: number }[];
    outputTax: number;
    refundsTax: number;
    refundsNet: number;
    inputTax: number;
    netPayable: number;
}

export interface JournalLine { accountId: string; accountName: string; type: 'debit' | 'credit'; amount: number }
export interface JournalItem {
    id: string; date: string; description: string; sourceType?: string; sourceId?: string;
    lines: JournalLine[];
    accountMovement?: number; accountBalanceAfter?: number;
}
export interface JournalPage {
    period: { from: string; to: string };
    total: number; limit: number; offset: number;
    items: JournalItem[];
    account: { id: string; number: string; name: string; debitNormal: boolean } | null;
}

export interface Takings {
    period: { from: string; to: string };
    accounts: { id: string; name: string; subType: string; moneyIn: number; moneyOut: number; balance: number }[];
}

export interface BooksHealth {
    checks: { key: string; label: string; ledger: number; records: number; difference: number; ok: boolean; hint: string }[];
    unbalancedEntries: number;
    allOk: boolean;
    lockedUntil: string | null;
}

const qs = (o: Record<string, string | number | undefined | null>) =>
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');

export const getStatements = (from: string, to: string, asOf?: string) =>
    api.get<Statements>(`/accounting/statements?${qs({ from, to, asOf })}`);
export const getTaxReport = (from: string, to: string) =>
    api.get<TaxReport>(`/accounting/tax-report?${qs({ from, to })}`);
export const getJournalPage = (p: { from: string; to: string; accountId?: string; q?: string; limit?: number; offset?: number }) =>
    api.get<JournalPage>(`/accounting/journal?${qs(p)}`);
export const getTakings = (from: string, to: string) =>
    api.get<Takings>(`/accounting/takings?${qs({ from, to })}`);
export const getBooksHealth = () => api.get<BooksHealth>('/accounting/health');
export const setBooksLock = (lockedUntil: string | null) =>
    api.put<{ lockedUntil: string | null }>('/accounting/lock', { lockedUntil });

/**
 * Every unpaid and part-paid invoice, however old. The app's general sales
 * list is capped at the newest 1,000, so older debts dropped off Receivables.
 */
export const getOpenInvoices = async (): Promise<Sale[]> => {
    const one = async (status: string) => {
        const r = await api.get<{ items: Sale[] } | Sale[]>(`/sales?${qs({ paymentStatus: status, page: 1, limit: 100000 })}`);
        return Array.isArray(r) ? r : (r?.items || []);
    };
    const [unpaid, partial] = await Promise.all([one('unpaid'), one('partially_paid')]);
    return [...unpaid, ...partial];
};

// ── Dates ──
const pad = (n: number) => String(n).padStart(2, '0');
export const dayOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => dayOf(new Date());
export const startOfMonth = () => { const d = new Date(); return dayOf(new Date(d.getFullYear(), d.getMonth(), 1)); };

export type PeriodPreset = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'last_year' | 'custom';
export const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
    { id: 'this_month', label: 'This month' },
    { id: 'last_month', label: 'Last month' },
    { id: 'this_quarter', label: 'This quarter' },
    { id: 'this_year', label: 'This year' },
    { id: 'last_year', label: 'Last year' },
    { id: 'custom', label: 'Choose dates' },
];
export const presetDates = (p: PeriodPreset): { from: string; to: string } | null => {
    const d = new Date();
    const y = d.getFullYear(), m = d.getMonth();
    switch (p) {
        case 'this_month': return { from: dayOf(new Date(y, m, 1)), to: today() };
        case 'last_month': return { from: dayOf(new Date(y, m - 1, 1)), to: dayOf(new Date(y, m, 0)) };
        case 'this_quarter': return { from: dayOf(new Date(y, Math.floor(m / 3) * 3, 1)), to: today() };
        case 'this_year': return { from: dayOf(new Date(y, 0, 1)), to: today() };
        case 'last_year': return { from: dayOf(new Date(y - 1, 0, 1)), to: dayOf(new Date(y - 1, 11, 31)) };
        default: return null;
    }
};
export const niceDate = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Download rows as a CSV file (for the accountant). */
export const downloadCsv = (fileName: string, rows: (string | number)[][]) => {
    const esc = (v: string | number) => {
        const t = String(v ?? '');
        return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const blob = new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
