import React, { useCallback, useEffect, useState } from 'react';
import { StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import {
    getStatements, getTakings, getBooksHealth, setBooksLock,
    Statements, Takings, StatementLine, downloadCsv, niceDate, today, dayOf,
} from '../booksApi';
import { usePeriod, PeriodPicker, DateField, Card, Row, Segmented, ExportButton, LoadState } from './booksUi';

/**
 * Reports, computed by the server over the whole ledger:
 *  - Profit & loss for a period (revenue → cost of goods → gross profit → running costs → profit)
 *  - Balance sheet on any date, with a "does it balance" check
 *  - Trial balance (every account's debit/credit; totals must match)
 *  - Money in and out per Cash / Mobile Money / Bank
 *  - Close the books up to a date so past months can't change
 */

type Tab = 'pnl' | 'balance' | 'trial' | 'money';
const TABS: { id: Tab; label: string }[] = [
    { id: 'pnl', label: 'Profit & loss' },
    { id: 'balance', label: 'Balance sheet' },
    { id: 'trial', label: 'Trial balance' },
    { id: 'money', label: 'Money in & out' },
];

const MONEY_LABEL: Record<string, string> = { cash: 'Cash', mobile_money: 'Mobile Money', bank: 'Bank' };

interface Props {
    storeSettings: StoreSettings;
}

const FinancialStatementsView: React.FC<Props> = ({ storeSettings }) => {
    const money = (n: number) => formatCurrency(n, storeSettings);
    const [tab, setTab] = useState<Tab>('pnl');
    const period = usePeriod('this_month');
    const [asOf, setAsOf] = useState(today());
    const [data, setData] = useState<Statements | null>(null);
    const [takings, setTakings] = useState<Takings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [s, t] = await Promise.all([
                getStatements(period.from, period.to, asOf),
                getTakings(period.from, period.to),
            ]);
            setData(s);
            setTakings(t);
        } catch (e: any) {
            setError(e?.message || 'Could not load the reports.');
        } finally {
            setLoading(false);
        }
    }, [period.from, period.to, asOf]);
    useEffect(() => { load(); }, [load]);

    const fileTag = tab === 'balance' || tab === 'trial' ? asOf : `${period.from}_to_${period.to}`;
    const exportCsv = () => {
        if (!data) return;
        const lines = (title: string, ls: StatementLine[]) => [[title, ''], ...ls.map(l => [`${l.number} ${l.name}`, l.amount])];
        if (tab === 'pnl') {
            const p = data.profitAndLoss;
            downloadCsv(`profit-and-loss_${fileTag}.csv`, [
                ['Profit & loss', `${period.from} to ${period.to}`],
                ...lines('Sales', p.revenue), ['Total sales', p.totalRevenue],
                ...lines('Cost of goods sold', p.cogs), ['Total cost of goods sold', p.totalCogs],
                ['Gross profit', p.grossProfit],
                ...lines('Running costs', p.operating), ['Total running costs', p.totalOperating],
                ['Profit', p.netProfit],
            ]);
        } else if (tab === 'balance') {
            const b = data.balanceSheet;
            downloadCsv(`balance-sheet_${fileTag}.csv`, [
                ['Balance sheet as of', asOf],
                ...lines('What you own (assets)', b.assets), ['Total assets', b.totalAssets],
                ...lines('What you owe (liabilities)', b.liabilities), ['Total liabilities', b.totalLiabilities],
                ...lines("Owner's equity", b.equity), ['Profit kept in the business', b.earningsToDate], ['Total equity', b.totalEquity],
                ['Liabilities + equity', b.totalLiabilities + b.totalEquity],
            ]);
        } else if (tab === 'trial') {
            const t = data.trialBalance;
            downloadCsv(`trial-balance_${fileTag}.csv`, [
                ['Account', 'Name', 'Type', 'Debit', 'Credit'],
                ...t.rows.map(r => [r.number, r.name, r.type, r.debit || '', r.credit || '']),
                ['', 'Total', '', t.totalDebit, t.totalCredit],
            ]);
        } else if (takings) {
            downloadCsv(`money-in-and-out_${fileTag}.csv`, [
                ['Account', 'Money in', 'Money out', 'Balance now'],
                ...takings.accounts.map(a => [a.name, a.moneyIn, a.moneyOut, a.balance]),
            ]);
        }
    };

    const lineRows = (ls: StatementLine[], empty: string) => ls.length
        ? ls.map(l => <Row key={l.id} label={l.name} value={money(l.amount)} />)
        : <div className="px-4 py-3 text-sm m3-text-on-surface-variant">{empty}</div>;

    const renderPnl = (d: Statements) => {
        const p = d.profitAndLoss;
        const margin = p.totalRevenue ? Math.round((p.netProfit / p.totalRevenue) * 1000) / 10 : null;
        return (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <Card>
                    <Row label="Sales" value="" strong />
                    {lineRows(p.revenue, 'No sales in this period')}
                    <Row label="Total sales" value={money(p.totalRevenue)} strong />
                    <Row label="Cost of goods sold" hint="What the goods you sold cost you" value="" strong />
                    {lineRows(p.cogs, 'Nothing sold')}
                    <Row label="Gross profit" hint="Sales minus what the goods cost" value={money(p.grossProfit)} strong />
                    <Row label="Running costs" hint="Rent, wages, transport and other expenses" value="" strong />
                    {lineRows(p.operating, 'No running costs recorded')}
                    <Row label="Total running costs" value={money(p.totalOperating)} strong />
                </Card>
                <div className="space-y-4">
                    <div className={`rounded-2xl p-5 border ${p.netProfit >= 0 ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800' : 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800'}`}>
                        <div className="text-sm font-semibold m3-text-on-surface-variant">{p.netProfit >= 0 ? 'Profit' : 'Loss'}</div>
                        <div className={`text-3xl font-bold tabular-nums ${p.netProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{money(p.netProfit)}</div>
                        <div className="text-xs m3-text-on-surface-variant mt-1">
                            Sales minus cost of goods and running costs, {niceDate(period.from)} – {niceDate(period.to)}
                        </div>
                        {margin !== null && <div className="text-xs mt-2 m3-text-on-surface">Profit margin: <b>{margin}%</b> of sales</div>}
                    </div>
                    <p className="text-xs m3-text-on-surface-variant px-1">
                        Sales are counted when made (not when paid), after discounts and without VAT. Cancelled sales are left out.
                    </p>
                </div>
            </div>
        );
    };

    const renderBalance = (d: Statements) => {
        const b = d.balanceSheet;
        return (
            <div className="space-y-4">
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${b.balanced ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
                    {b.balanced
                        ? `✓ Balanced: what you own equals what you owe plus equity on ${niceDate(d.asOf)}.`
                        : `Out of balance by ${money(Math.abs(b.difference))}. Open Books health on the Overview to find the cause.`}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="What you own (assets)" right={money(b.totalAssets)}>
                        {lineRows(b.assets, 'Nothing yet')}
                    </Card>
                    <div className="space-y-4">
                        <Card title="What you owe (liabilities)" right={money(b.totalLiabilities)}>
                            {lineRows(b.liabilities, 'Nothing owed')}
                        </Card>
                        <Card title="Owner's equity" right={money(b.totalEquity)}>
                            {lineRows(b.equity, 'No capital recorded')}
                            <Row label="Profit kept in the business" hint="All profit to this date" value={money(b.earningsToDate)} />
                        </Card>
                        <Card>
                            <Row label="Liabilities + equity" value={money(b.totalLiabilities + b.totalEquity)} strong />
                        </Card>
                    </div>
                </div>
            </div>
        );
    };

    const renderTrial = (d: Statements) => {
        const t = d.trialBalance;
        return (
            <Card>
                <div className={`px-4 py-3 text-sm font-semibold ${t.balanced ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {t.balanced ? '✓ Debits equal credits' : `Debits and credits differ by ${money(Math.abs(t.totalDebit - t.totalCredit))}`}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase tracking-wide m3-text-on-surface-variant border-y m3-border-outline-variant">
                                <th className="px-4 py-2 font-semibold">Account</th>
                                <th className="px-4 py-2 font-semibold text-right">Debit</th>
                                <th className="px-4 py-2 font-semibold text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {t.rows.map(r => (
                                <tr key={r.id} className="border-b m3-border-outline-variant last:border-0">
                                    <td className="px-4 py-2 m3-text-on-surface"><span className="m3-text-on-surface-variant mr-2 tabular-nums">{r.number}</span>{r.name}</td>
                                    <td className="px-4 py-2 text-right tabular-nums m3-text-on-surface">{r.debit ? money(r.debit) : ''}</td>
                                    <td className="px-4 py-2 text-right tabular-nums m3-text-on-surface">{r.credit ? money(r.credit) : ''}</td>
                                </tr>
                            ))}
                            {t.rows.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center m3-text-on-surface-variant">No postings yet</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 m3-border-outline-variant font-bold m3-text-on-surface">
                                <td className="px-4 py-2">Total</td>
                                <td className="px-4 py-2 text-right tabular-nums">{money(t.totalDebit)}</td>
                                <td className="px-4 py-2 text-right tabular-nums">{money(t.totalCredit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
        );
    };

    const renderMoney = () => {
        const accts = takings?.accounts || [];
        return (
            <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-3">
                    {accts.map(a => (
                        <Card key={a.id} title={MONEY_LABEL[a.subType] || a.name}>
                            <Row label="Money in" value={money(a.moneyIn)} />
                            <Row label="Money out" value={money(a.moneyOut)} />
                            <Row label="Balance now" value={money(a.balance)} strong />
                        </Card>
                    ))}
                </div>
                {accts.length === 0 && <div className="text-sm m3-text-on-surface-variant">No money accounts yet.</div>}
                <p className="text-xs m3-text-on-surface-variant px-1">
                    Each sale is filed under how it was paid. Sales made before this was added are all under Cash.
                </p>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Segmented value={tab} options={TABS} onChange={setTab} />
                <div className="flex flex-wrap items-center gap-2">
                    {tab === 'balance' || tab === 'trial'
                        ? <DateField label="As of" value={asOf} max={today()} onChange={v => v && setAsOf(v)} />
                        : <PeriodPicker period={period} />}
                    <ExportButton onClick={exportCsv} disabled={!data || loading} />
                </div>
            </div>

            <LoadState loading={loading && !data} error={error} onRetry={load} />
            {data && !error && (
                <div style={{ opacity: loading ? 0.6 : 1 }}>
                    {tab === 'pnl' && renderPnl(data)}
                    {tab === 'balance' && renderBalance(data)}
                    {tab === 'trial' && renderTrial(data)}
                    {tab === 'money' && renderMoney()}
                </div>
            )}

            <CloseBooks />
        </div>
    );
};

/** Close the books up to a date: nothing on or before it can be added or changed. */
const CloseBooks: React.FC = () => {
    const [locked, setLocked] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        getBooksHealth().then(h => setLocked(h.lockedUntil)).catch(() => { /* card still usable */ });
    }, []);

    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return dayOf(d); })();
    const save = async (value: string | null) => {
        setSaving(true);
        setMsg(null);
        try {
            const r = await setBooksLock(value);
            setLocked(r.lockedUntil);
            setDraft('');
            setMsg(r.lockedUntil ? `Closed up to ${niceDate(r.lockedUntil)}.` : 'Books reopened.');
        } catch (e: any) {
            setMsg(e?.message || 'Could not save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card title="Close past months">
            <div className="px-4 py-3 space-y-3">
                <p className="text-sm m3-text-on-surface-variant">
                    {locked
                        ? <>Books are closed up to <b className="m3-text-on-surface">{niceDate(locked)}</b>. Sales, expenses, refunds and payments dated on or before then are refused, so reports you have already filed stay the same.</>
                        : 'Once a month is filed (for example your VAT return), close it so nothing dated in it can change.'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <DateField label="Close up to" value={draft} max={yesterday} onChange={setDraft} />
                    <button
                        disabled={!draft || saving}
                        onClick={() => save(draft)}
                        className="px-4 py-2 text-sm font-semibold rounded-xl m3-bg-primary m3-text-on-primary disabled:opacity-50"
                    >
                        Close books
                    </button>
                    {locked && (
                        <button disabled={saving} onClick={() => save(null)} className="px-3 py-2 text-sm font-semibold rounded-xl m3-text-primary hover:underline disabled:opacity-50">
                            Reopen
                        </button>
                    )}
                    {msg && <span className="text-sm m3-text-on-surface-variant">{msg}</span>}
                </div>
            </div>
        </Card>
    );
};

export default FinancialStatementsView;
