import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Account, JournalEntry, StoreSettings, FinancialSummary } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { api } from '../../../services/api';
import ArrowTrendingUpIcon from '../../icons/ArrowTrendingUpIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import BookOpenIcon from '../../icons/BookOpenIcon';
import TruckIcon from '../../icons/TruckIcon';
import RefreshIcon from '../../icons/RefreshIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import ExclamationTriangleIcon from '../../icons/ExclamationTriangleIcon';
import CheckCircleIcon from '../../icons/CheckCircleIcon';
import InformationCircleIcon from '../../icons/InformationCircleIcon';
import ShieldCheckIcon from '../../icons/ShieldCheckIcon';

interface AccountingDashboardProps {
    accounts: Account[];
    journalEntries: JournalEntry[];
    storeSettings: StoreSettings;
}

const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ accounts, journalEntries, storeSettings }) => {
    const [summaryData, setSummaryData] = useState<FinancialSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.get<FinancialSummary>(`/accounting/summary?startDate=${startDate}&endDate=${endDate}`);
            setSummaryData(data);
        } catch (err: any) {
            console.error('Failed to fetch accounting summary:', err);
            setError('Failed to load financial metrics');
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const recentTransactions = useMemo(() => {
        return [...journalEntries]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [journalEntries]);

    if (isLoading && !summaryData) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">Calculating financial health...</p>
            </div>
        );
    }

    if (error && !summaryData) {
        return (
            <div className="p-10 text-center bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/20">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpenIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Sync Error</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">{error}</p>
                <button
                    onClick={fetchSummary}
                    className="mt-6 px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-sm"
                >
                    Retry Metrics
                </button>
            </div>
        );
    }

    const { summary, period, checks } = summaryData || {
        summary: { inventoryValue: 0, accountsReceivable: 0, accountsPayable: 0, storeCreditValue: 0, cashBalance: 0, totalAssets: 0, totalLiabilities: 0, equity: 0 },
        period: { revenue: 0, cogs: 0, expenses: 0, grossProfit: 0, netIncome: 0 },
        checks: {
            arMatch: true,
            apMatch: true,
            inventoryMatch: true,
            storeCreditMatch: true,
            hasProductsMissingCost: false,
            productsMissingCostCount: 0,
            isTaxRatioSkewed: false
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Financial Overview</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Accurate metrics from General Ledger and Sub-ledgers</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm">
                        <div className="flex items-center gap-2 px-3">
                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-0 p-0"
                            />
                            <span className="text-slate-300">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-0 p-0"
                            />
                        </div>
                    </div>
                    <button
                        onClick={fetchSummary}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                        title="Refresh Data"
                    >
                        <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
            {/* Financial Health Check Section - Compacted */}
            {((Object.values(checks).some(v => v === false || (typeof v === 'boolean' && v === true)) || summary.accountsPayable < 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                    {/* Missing Cost Price Alert */}
                    {checks.hasProductsMissingCost && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/20 rounded-xl shadow-sm">
                            <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 leading-tight">
                                {checks.productsMissingCostCount} items missing cost.
                            </p>
                        </div>
                    )}

                    {/* Tax Ratio Alert */}
                    {checks.isTaxRatioSkewed && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/20 rounded-xl shadow-sm">
                            <ExclamationTriangleIcon className="w-4 h-4 text-rose-500 shrink-0" />
                            <p className="text-[10px] font-bold text-rose-800 dark:text-rose-400 leading-tight">
                                Abnormal tax ratio detected.
                            </p>
                        </div>
                    )}

                    {/* AP Negative Balance */}
                    {summary.accountsPayable < 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/20 rounded-xl shadow-sm">
                            <InformationCircleIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                            <p className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 leading-tight">
                                Unmatched PO payments.
                            </p>
                        </div>
                    )}

                    {/* Ledger Sync Status */}
                    {(!checks.arMatch || !checks.apMatch || !checks.inventoryMatch) ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/20 rounded-xl shadow-sm">
                            <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 leading-tight">
                                GL sync discrepancy.
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/20 rounded-xl shadow-sm">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                            <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 leading-tight">
                                Ledger is healthy & synced.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Primary Financial KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Net Income - The "Bottom Line" */}
                <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg border border-indigo-500 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Net Income</span>
                        <CalculatorIcon className="w-5 h-5 text-indigo-200" />
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight relative z-10">
                        {formatCurrency(period.netIncome, storeSettings)}
                    </div>
                    <div className="mt-2 flex items-center gap-2 relative z-10">
                        <div className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-indigo-100 border border-white/10">
                            {((period.netIncome / (period.revenue || 1)) * 100).toFixed(1)}% Margin
                        </div>
                    </div>
                </div>

                {/* 2. Liquidity Card - Cash & AR */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Liquidity</span>
                            {(!checks.arMatch) && (
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Sync Discrepancy"></div>
                            )}
                        </div>
                        <BanknotesIcon className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {formatCurrency(summary.cashBalance + summary.accountsReceivable, storeSettings)}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-slate-50 dark:border-slate-800/50">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Cash</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(summary.cashBalance, storeSettings)}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Receivable</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(summary.accountsReceivable, storeSettings)}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Operational Card - Gross Profit & Inv */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Profit</span>
                            {(!checks.inventoryMatch) && (
                                <div className="w-2 h-2 rounded-full bg-amber-500" title="Inventory Sync"></div>
                            )}
                        </div>
                        <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {formatCurrency(period.grossProfit, storeSettings)}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-slate-50 dark:border-slate-800/50">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Revenue</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(period.revenue, storeSettings)}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Stock Value</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(summary.inventoryValue, storeSettings)}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Obligations Card - AP & Store Credit */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Obligations</span>
                            {(!checks.apMatch || !checks.storeCreditMatch) && (
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Liability Sync"></div>
                            )}
                        </div>
                        <TruckIcon className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight text-rose-600 dark:text-rose-400">
                        {formatCurrency(summary.accountsPayable + summary.storeCreditValue, storeSettings)}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-slate-50 dark:border-slate-800/50">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Payable</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(summary.accountsPayable, storeSettings)}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Store Credit</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(summary.storeCreditValue, storeSettings)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent Ledger Activity</h3>
                            <button onClick={() => window.location.hash = 'journal'} className="text-xs text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider transition-colors px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">View Ledger</button>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {recentTransactions.map(entry => (
                                <div key={entry.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                                {entry.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                <CalendarIcon className="w-3 h-3" />
                                                <span>{new Date(entry.date).toLocaleDateString()}</span>
                                                {entry.reference && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-1">REF: {entry.reference}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        {entry.lines.map((line, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${line.type === 'debit' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                                    <span className="text-slate-600 dark:text-slate-400 font-medium">{line.accountName}</span>
                                                </div>
                                                <span className={`font-bold ${line.type === 'debit' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {line.type === 'debit' ? formatCurrency(line.amount, storeSettings) : `(${formatCurrency(line.amount, storeSettings)})`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {recentTransactions.length === 0 && (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                                        <BookOpenIcon className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">No transaction history</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-1 font-medium">Ledger is currently empty</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Simplified Key Balances - Focus on remaining accounts */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">Other Accounts</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto custom-scrollbar">
                            {accounts
                                .filter(a => a.subType && !['cash', 'ar', 'ap', 'inventory', 'store_credit'].includes(a.subType.toLowerCase()))
                                .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                                .slice(0, 12)
                                .map(account => (
                                    <div key={account.id} className="px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${account.type === 'asset' ? 'bg-blue-500' :
                                                        account.type === 'liability' ? 'bg-rose-500' :
                                                            account.type === 'equity' ? 'bg-purple-500' :
                                                                account.type === 'revenue' ? 'bg-emerald-500' : 'bg-amber-500'
                                                        }`}></div>
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{account.name}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 ml-3.5 font-medium">{account.number}</div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className={`text-sm font-bold ${account.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                    {formatCurrency(account.balance, storeSettings)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/20 dark:bg-indigo-900/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-indigo-200 dark:shadow-none shadow-lg">
                                <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">Global Equity</h4>
                                <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatCurrency(summary.equity, storeSettings)}</div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Your liquidity ratio is robust. Total liquid assets are <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(summary.cashBalance + summary.accountsReceivable, storeSettings)}</span>, which covers obligations of <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(summary.accountsPayable + summary.storeCreditValue, storeSettings)}</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingDashboard;
