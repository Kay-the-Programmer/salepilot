import React, { useMemo } from 'react';
import { Account, JournalEntry, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import ArrowTrendingUpIcon from '../../icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from '../../icons/ArrowTrendingDownIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import BookOpenIcon from '../../icons/BookOpenIcon';

interface AccountingDashboardProps {
    accounts: Account[];
    journalEntries: JournalEntry[];
    storeSettings: StoreSettings;
}

const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ accounts, journalEntries, storeSettings }) => {
    const recentTransactions = useMemo(() => {
        return [...journalEntries]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [journalEntries]);

    // Calculate key metrics
    const totalRevenue = useMemo(() =>
        accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0),
        [accounts]
    );
    const totalExpenses = useMemo(() =>
        accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0),
        [accounts]
    );
    const netIncome = totalRevenue - totalExpenses;
    const totalAssets = useMemo(() =>
        accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0),
        [accounts]
    );

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Financial Overview</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time business performance metrics</p>
                </div>
                <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 inline-flex items-center gap-2 self-start shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Live Data</span>
                </div>
            </div>

            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Revenue</span>
                        <ArrowTrendingUpIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(totalRevenue, storeSettings)}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Total sales income</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expenses</span>
                        <ArrowTrendingDownIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(totalExpenses, storeSettings)}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Total operational costs</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Income</span>
                        <CalculatorIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className={`text-2xl font-bold tracking-tight ${netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(netIncome, storeSettings)}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Gross Profitability</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Assets</span>
                        <BanknotesIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(totalAssets, storeSettings)}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Current valuation</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent Activity</h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{recentTransactions.length} items</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentTransactions.map(entry => (
                                <div key={entry.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {entry.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                <span>{new Date(entry.date).toLocaleDateString()}</span>
                                                {entry.reference && <span>• REF: {entry.reference}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {entry.lines.map((line, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1 h-1 rounded-full ${line.type === 'debit' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                                    <span className="text-slate-600 dark:text-slate-400">{line.accountName}</span>
                                                </div>
                                                <span className={`font-medium ${line.type === 'debit' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">Key Balances</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto custom-scrollbar">
                            {accounts.filter(a => a.subType).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 8).map(account => (
                                <div key={account.id} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${account.type === 'asset' ? 'bg-blue-500' :
                                                    account.type === 'liability' ? 'bg-red-500' :
                                                        account.type === 'equity' ? 'bg-purple-500' :
                                                            account.type === 'revenue' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`}></div>
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{account.name}</span>
                                            </div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-3.5">{account.number}</div>
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

                    <div className="p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 mb-2">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Growth Vector</h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Total assets currently exceed liabilities by <span className="font-semibold text-slate-900 dark:text-slate-200">{formatCurrency(totalAssets - accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0), storeSettings)}</span>. Maintain this ratio to ensure liquidity.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingDashboard;
