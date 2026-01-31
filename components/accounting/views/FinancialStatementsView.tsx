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
        const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

        return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
    }, [accounts]);

    const renderPNL = () => (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profit & Loss Statement</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={pnlStartDate}
                            onChange={e => setPnlStartDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <span className="hidden sm:block text-slate-400 dark:text-slate-600 px-1">-</span>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={pnlEndDate}
                            onChange={e => setPnlEndDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Revenue Section */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <h4 className="font-bold text-slate-900 dark:text-slate-100">Revenue</h4>
                            </div>
                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
                                {formatCurrency(pnlData.totalRevenue, storeSettings)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-1">
                            {pnlData.revenueAccounts.map(acc => (
                                <div key={acc.name} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{acc.name}</span>
                                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 tracking-tight">
                                        {formatCurrency(acc.balance, storeSettings)}
                                    </span>
                                </div>
                            ))}
                            {pnlData.revenueAccounts.length === 0 && (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm">No revenue entries</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowTrendingDownIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <h4 className="font-bold text-slate-900 dark:text-slate-100">Expenses</h4>
                            </div>
                            <div className="text-lg font-bold text-red-700 dark:text-red-400 tracking-tight">
                                {formatCurrency(pnlData.totalExpenses, storeSettings)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-1">
                            {pnlData.expenseAccounts.map(acc => (
                                <div key={acc.name} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{acc.name}</span>
                                    <span className="text-sm font-medium text-red-700 dark:text-red-400 tracking-tight">
                                        ({formatCurrency(acc.balance, storeSettings)})
                                    </span>
                                </div>
                            ))}
                            {pnlData.expenseAccounts.length === 0 && (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm">No expense entries</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Net Income Summary */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/10 dark:bg-slate-700/50 rounded-xl backdrop-blur-md border border-white/10 dark:border-slate-600/50">
                            <CalculatorIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-100">Net Income Result</h4>
                            <p className="text-sm text-slate-400 mt-1">Total revenue minus all expenses</p>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className={`text-3xl font-bold tracking-tight ${pnlData.netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(pnlData.netIncome, storeSettings)}
                        </div>
                        <div className="flex items-center justify-center md:justify-end gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide ${pnlData.netIncome >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Balance Sheet</h3>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    As of {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Assets */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h4 className="font-bold text-slate-900 dark:text-slate-100">Assets</h4>
                            </div>
                            <div className="text-lg font-bold text-blue-700 dark:text-blue-400 tracking-tight">
                                {formatCurrency(balanceSheetData.totalAssets, storeSettings)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-1">
                            {balanceSheetData.assets.map(acc => (
                                <div key={acc.id} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{acc.name}</span>
                                    </div>
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400 tracking-tight">
                                        {formatCurrency(acc.balance, storeSettings)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                    {/* Liabilities */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Liabilities</h4>
                                </div>
                                <div className="text-lg font-bold text-red-700 dark:text-red-400 tracking-tight">
                                    {formatCurrency(balanceSheetData.totalLiabilities, storeSettings)}
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="space-y-1">
                                {balanceSheetData.liabilities.map(acc => (
                                    <div key={acc.id} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400"></div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{acc.name}</span>
                                        </div>
                                        <span className="text-sm font-medium text-red-700 dark:text-red-400 tracking-tight">
                                            {formatCurrency(acc.balance, storeSettings)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Equity */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ChartBarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Equity</h4>
                                </div>
                                <div className="text-lg font-bold text-purple-700 dark:text-purple-400 tracking-tight">
                                    {formatCurrency(balanceSheetData.totalEquity, storeSettings)}
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="space-y-1">
                                {balanceSheetData.equity.map(acc => (
                                    <div key={acc.id} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400"></div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{acc.name}</span>
                                        </div>
                                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400 tracking-tight">
                                            {formatCurrency(acc.balance, storeSettings)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Balance Sheet Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Assets</div>
                        <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
                            {formatCurrency(balanceSheetData.totalAssets, storeSettings)}
                        </div>
                    </div>
                    <div className="text-center p-4">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Liabilities</div>
                        <div className="text-xl font-bold text-red-700 dark:text-red-400">
                            {formatCurrency(balanceSheetData.totalLiabilities, storeSettings)}
                        </div>
                    </div>
                    <div className="text-center p-4">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Equity</div>
                        <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
                            {formatCurrency(balanceSheetData.totalEquity, storeSettings)}
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
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
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Financial Statements</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and analyze your business health</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 self-start lg:self-auto">
                    <button
                        onClick={() => setActiveReport('pnl')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-300 ${activeReport === 'pnl'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Profit & Loss
                    </button>
                    <button
                        onClick={() => setActiveReport('balance_sheet')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-300 ${activeReport === 'balance_sheet'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Balance Sheet
                    </button>
                </div>
            </div>
            <div className="animate-fade-in">
                {activeReport === 'pnl' ? renderPNL() : renderBalanceSheet()}
            </div>
        </div>
    );
};

export default FinancialStatementsView;
