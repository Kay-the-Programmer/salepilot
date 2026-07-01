import React, { useState, useMemo } from 'react';
import { Account, JournalEntry, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import ArrowTrendingUpIcon from '../../icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from '../../icons/ArrowTrendingDownIcon';
import ChartBarIcon from '../../icons/ChartBarIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import CalendarDaysIcon from '../../icons/CalendarDaysIcon';

interface FinancialStatementsViewProps {
    accounts: Account[];
    journalEntries: JournalEntry[];
    storeSettings: StoreSettings;
}

const FinancialStatementsView: React.FC<FinancialStatementsViewProps> = ({ accounts, journalEntries, storeSettings }) => {
    const [activeReport, setActiveReport] = React.useState('pnl');
    const [pnlStartDate, setPnlStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [pnlEndDate, setPnlEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const pnlData = useMemo(() => {
        const start = new Date(pnlStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(pnlEndDate);
        end.setHours(23, 59, 59, 999);

        const revenueAccounts = new Map<string, { name: string, balance: number }>();
        const expenseAccounts = new Map<string, { name: string, balance: number }>();

        const revenueAccountIds = new Set(accounts.filter(a => a.type === 'revenue').map(a => a.id));
        const expenseAccountIds = new Set(accounts.filter(a => a.type === 'expense').map(a => a.id));

        const relevantEntries = journalEntries.filter(e => {
            const entryDate = new Date(e.date);
            return entryDate >= start && entryDate <= end;
        });

        for (const entry of relevantEntries) {
            for (const line of entry.lines) {
                if (revenueAccountIds.has(line.accountId)) {
                    const acc = revenueAccounts.get(line.accountId) || { name: line.accountName, balance: 0 };
                    acc.balance += (line.type === 'credit' ? line.amount : -line.amount);
                    revenueAccounts.set(line.accountId, acc);
                } else if (expenseAccountIds.has(line.accountId)) {
                    const acc = expenseAccounts.get(line.accountId) || { name: line.accountName, balance: 0 };
                    acc.balance += (line.type === 'debit' ? line.amount : -line.amount);
                    expenseAccounts.set(line.accountId, acc);
                }
            }
        }

        const totalRevenue = Array.from(revenueAccounts.values()).reduce((sum, acc) => sum + acc.balance, 0);
        const totalExpenses = Array.from(expenseAccounts.values()).reduce((sum, acc) => sum + acc.balance, 0);
        const netIncome = totalRevenue - totalExpenses;

        return {
            revenueAccounts: Array.from(revenueAccounts.values()).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
            expenseAccounts: Array.from(expenseAccounts.values()).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
            totalRevenue,
            totalExpenses,
            netIncome
        };
    }, [accounts, journalEntries, pnlStartDate, pnlEndDate]);

    const balanceSheetData = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'asset').sort((a, b) => a.number.localeCompare(b.number));
        const liabilities = accounts.filter(a => a.type === 'liability').sort((a, b) => a.number.localeCompare(b.number));
        const equity = accounts.filter(a => a.type === 'equity').sort((a, b) => a.number.localeCompare(b.number));

        const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
        // Retained earnings = accumulated (revenue − expenses). The books aren't periodically
        // closed, so this current-earnings figure must be carried into equity for the sheet
        // to balance (Assets = Liabilities + Equity).
        const retainedEarnings = accounts.filter(a => a.type === 'revenue').reduce((s, a) => s + a.balance, 0)
            - accounts.filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0);
        const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0) + retainedEarnings;

        return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, retainedEarnings };
    }, [accounts]);

    const dateInput = "w-full sm:w-auto pl-10 pr-4 py-2.5 rounded-lg text-sm font-medium m3-bg-surface-lowest m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] focus:border-transparent transition-all";

    const renderPNL = () => (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-bold m3-text-on-surface">Profit &amp; Loss Statement</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 m3-text-on-surface-variant" />
                        </div>
                        <input
                            type="date"
                            value={pnlStartDate}
                            onChange={e => setPnlStartDate(e.target.value)}
                            className={dateInput}
                        />
                    </div>
                    <span className="hidden sm:block m3-text-on-surface-variant px-1">-</span>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 m3-text-on-surface-variant" />
                        </div>
                        <input
                            type="date"
                            value={pnlEndDate}
                            onChange={e => setPnlEndDate(e.target.value)}
                            className={dateInput}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Revenue Section */}
                <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b m3-border-outline-variant m3-bg-surface-container">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <h4 className="font-bold m3-text-on-surface">Revenue</h4>
                            </div>
                            <div className="text-lg font-bold text-green-700 dark:text-green-400 tracking-tight">
                                {formatCurrency(pnlData.totalRevenue, storeSettings)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-1">
                            {pnlData.revenueAccounts.map(acc => (
                                <div key={acc.name} className="flex justify-between items-center p-2 hover:m3-bg-surface-container rounded-lg transition-colors">
                                    <span className="text-sm font-medium m3-text-on-surface">{acc.name}</span>
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400 tracking-tight">
                                        {formatCurrency(acc.balance, storeSettings)}
                                    </span>
                                </div>
                            ))}
                            {pnlData.revenueAccounts.length === 0 && (
                                <div className="text-center py-8 m3-text-on-surface-variant text-sm">No revenue entries</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b m3-border-outline-variant m3-bg-surface-container">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowTrendingDownIcon className="w-5 h-5 m3-text-error" />
                                <h4 className="font-bold m3-text-on-surface">Expenses</h4>
                            </div>
                            <div className="text-lg font-bold m3-text-error tracking-tight">
                                {formatCurrency(pnlData.totalExpenses, storeSettings)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-1">
                            {pnlData.expenseAccounts.map(acc => (
                                <div key={acc.name} className="flex justify-between items-center p-2 hover:m3-bg-surface-container rounded-lg transition-colors">
                                    <span className="text-sm font-medium m3-text-on-surface">{acc.name}</span>
                                    <span className="text-sm font-medium m3-text-error tracking-tight">
                                        ({formatCurrency(acc.balance, storeSettings)})
                                    </span>
                                </div>
                            ))}
                            {pnlData.expenseAccounts.length === 0 && (
                                <div className="text-center py-8 m3-text-on-surface-variant text-sm">No expense entries</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Net Income Summary */}
            <div className="m3-bg-tertiary rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl border" style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.15)' }}>
                            <CalculatorIcon className="w-6 h-6 m3-text-on-tertiary" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold m3-text-on-tertiary">Net Income Result</h4>
                            <p className="text-sm m3-text-on-tertiary mt-1" style={{ opacity: 0.75 }}>Total revenue minus all expenses</p>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className={`text-3xl font-bold tracking-tight ${pnlData.netIncome >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {formatCurrency(pnlData.netIncome, storeSettings)}
                        </div>
                        <div className="flex items-center justify-center md:justify-end gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide ${pnlData.netIncome >= 0 ? 'bg-green-500/25 text-green-200' : 'bg-red-500/25 text-red-200'
                                }`}>
                                {pnlData.netIncome >= 0 ? 'Profit' : 'Loss'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBalanceSheet = () => (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold m3-text-on-surface">Balance Sheet</h3>
                <div className="text-xs font-medium m3-text-on-surface-variant m3-bg-surface-container px-3 py-1.5 rounded-lg border m3-border-outline-variant">
                    As of {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Assets */}
                <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b m3-border-outline-variant m3-bg-surface-container">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowTrendingUpIcon className="w-5 h-5 m3-text-primary" />
                                <h4 className="font-bold m3-text-on-surface">Assets</h4>
                            </div>
                            <div className="text-lg font-bold m3-text-primary tracking-tight">
                                {formatCurrency(balanceSheetData.totalAssets, storeSettings)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-1">
                            {balanceSheetData.assets.map(acc => (
                                <div key={acc.id} className="flex justify-between items-center p-2 hover:m3-bg-surface-container rounded-lg transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--m3-primary)' }}></div>
                                        <span className="text-sm font-medium m3-text-on-surface">{acc.name}</span>
                                    </div>
                                    <span className="text-sm font-medium m3-text-primary tracking-tight">
                                        {formatCurrency(acc.balance, storeSettings)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                    {/* Liabilities */}
                    <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b m3-border-outline-variant m3-bg-surface-container">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowTrendingDownIcon className="w-5 h-5 m3-text-error" />
                                    <h4 className="font-bold m3-text-on-surface">Liabilities</h4>
                                </div>
                                <div className="text-lg font-bold m3-text-error tracking-tight">
                                    {formatCurrency(balanceSheetData.totalLiabilities, storeSettings)}
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="space-y-1">
                                {balanceSheetData.liabilities.map(acc => (
                                    <div key={acc.id} className="flex justify-between items-center p-2 hover:m3-bg-surface-container rounded-lg transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--m3-error)' }}></div>
                                            <span className="text-sm font-medium m3-text-on-surface">{acc.name}</span>
                                        </div>
                                        <span className="text-sm font-medium m3-text-error tracking-tight">
                                            {formatCurrency(acc.balance, storeSettings)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Equity */}
                    <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b m3-border-outline-variant m3-bg-surface-container">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ChartBarIcon className="w-5 h-5 m3-text-tertiary" />
                                    <h4 className="font-bold m3-text-on-surface">Equity</h4>
                                </div>
                                <div className="text-lg font-bold m3-text-tertiary tracking-tight">
                                    {formatCurrency(balanceSheetData.totalEquity, storeSettings)}
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="space-y-1">
                                {balanceSheetData.equity.map(acc => (
                                    <div key={acc.id} className="flex justify-between items-center p-2 hover:m3-bg-surface-container rounded-lg transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--m3-tertiary)' }}></div>
                                            <span className="text-sm font-medium m3-text-on-surface">{acc.name}</span>
                                        </div>
                                        <span className="text-sm font-medium m3-text-tertiary tracking-tight">
                                            {formatCurrency(acc.balance, storeSettings)}
                                        </span>
                                    </div>
                                ))}
                                {/* Current-period earnings carried into equity (books not yet closed). */}
                                <div className="flex justify-between items-center p-2 hover:m3-bg-surface-container rounded-lg transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--m3-tertiary)' }}></div>
                                        <span className="text-sm font-medium m3-text-on-surface">Retained Earnings <span className="m3-text-on-surface-variant">(current)</span></span>
                                    </div>
                                    <span className="text-sm font-medium m3-text-tertiary tracking-tight">
                                        {formatCurrency(balanceSheetData.retainedEarnings, storeSettings)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Balance Sheet Summary */}
            <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                        <div className="text-xs font-medium m3-text-on-surface-variant uppercase tracking-widest mb-1">Total Assets</div>
                        <div className="text-xl font-bold m3-text-primary">
                            {formatCurrency(balanceSheetData.totalAssets, storeSettings)}
                        </div>
                    </div>
                    <div className="text-center p-4">
                        <div className="text-xs font-medium m3-text-on-surface-variant uppercase tracking-widest mb-1">Total Liabilities</div>
                        <div className="text-xl font-bold m3-text-error">
                            {formatCurrency(balanceSheetData.totalLiabilities, storeSettings)}
                        </div>
                    </div>
                    <div className="text-center p-4">
                        <div className="text-xs font-medium m3-text-on-surface-variant uppercase tracking-widest mb-1">Total Equity</div>
                        <div className="text-xl font-bold m3-text-tertiary">
                            {formatCurrency(balanceSheetData.totalEquity, storeSettings)}
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t m3-border-outline-variant text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border m3-bg-surface-container m3-border-outline-variant m3-text-on-surface">
                        Assets = Liabilities + Equity: {
                            Math.abs(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)) < 0.01
                                ? '✓ Balanced'
                                : '✗ Imbalanced'
                        }
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold m3-text-on-surface tracking-tight">Financial Statements</h3>
                    <p className="text-sm m3-text-on-surface-variant mt-1">View and analyze your business health</p>
                </div>
                <div className="flex m3-bg-surface-container p-1 rounded-lg border m3-border-outline-variant self-start lg:self-auto">
                    <button
                        onClick={() => setActiveReport('pnl')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-300 ${activeReport === 'pnl'
                            ? 'm3-bg-surface-lowest m3-text-on-surface shadow-sm'
                            : 'm3-text-on-surface-variant hover:m3-text-on-surface'
                            }`}
                    >
                        Profit &amp; Loss
                    </button>
                    <button
                        onClick={() => setActiveReport('balance_sheet')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-300 ${activeReport === 'balance_sheet'
                            ? 'm3-bg-surface-lowest m3-text-on-surface shadow-sm'
                            : 'm3-text-on-surface-variant hover:m3-text-on-surface'
                            }`}
                    >
                        Balance Sheet
                    </button>
                </div>
            </div>
            <div className="sp-fade-in">
                {activeReport === 'pnl' ? renderPNL() : renderBalanceSheet()}
            </div>
        </div>
    );
};

export default FinancialStatementsView;
