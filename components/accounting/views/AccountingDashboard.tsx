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
        <div className="space-y-8">
            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-effect !bg-blue-50/50 dark:!bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Revenue</div>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-50">{formatCurrency(totalRevenue, storeSettings)}</div>
                    <div className="text-xs text-blue-600/80 dark:text-blue-400 mt-2">Total income this period</div>
                </div>

                <div className="glass-effect !bg-red-50/50 dark:!bg-red-900/20 border-red-200/50 dark:border-red-800/50 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-600 dark:bg-red-500 rounded-xl shadow-lg shadow-red-600/20">
                            <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-red-700 dark:text-red-300">Expenses</div>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-red-900 dark:text-red-50">{formatCurrency(totalExpenses, storeSettings)}</div>
                    <div className="text-xs text-red-600/80 dark:text-red-400 mt-2">Total costs this period</div>
                </div>

                <div className="glass-effect !bg-emerald-50/50 dark:!bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-600 dark:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20">
                            <CalculatorIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Net Income</div>
                        </div>
                    </div>
                    <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-emerald-900 dark:text-emerald-50' : 'text-red-900 dark:text-red-50'}`}>
                        {formatCurrency(netIncome, storeSettings)}
                    </div>
                    <div className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-2">Profit after expenses</div>
                </div>

                <div className="glass-effect !bg-purple-50/50 dark:!bg-purple-900/20 border-purple-200/50 dark:border-purple-800/50 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-600 dark:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/20">
                            <BanknotesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Assets</div>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-50">{formatCurrency(totalAssets, storeSettings)}</div>
                    <div className="text-xs text-purple-600/80 dark:text-purple-400 mt-2">Total company assets</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="glass-effect rounded-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Journal Entries</h3>
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                                    {recentTransactions.length} entries
                                </span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentTransactions.map(entry => (
                                <div key={entry.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {entry.description}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {new Date(entry.date).toLocaleDateString()} • {entry.reference || 'No reference'}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {entry.lines.map((line, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${line.type === 'debit' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                                    <span className="text-slate-700 dark:text-slate-300">{line.accountName}</span>
                                                </div>
                                                <span className={`font-mono ${line.type === 'debit' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {line.type === 'debit' ? formatCurrency(line.amount, storeSettings) : `(${formatCurrency(line.amount, storeSettings)})`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {recentTransactions.length === 0 && (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <BookOpenIcon className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-slate-600">No journal entries yet</p>
                                    <p className="text-sm text-slate-500 mt-1">Transactions will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="glass-effect rounded-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                    <CalculatorIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account Balances</h3>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {accounts.filter(a => a.subType).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 8).map(account => (
                                <div key={account.id} className="px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${account.type === 'asset' ? 'bg-blue-500' :
                                                    account.type === 'liability' ? 'bg-red-500' :
                                                        account.type === 'equity' ? 'bg-purple-500' :
                                                            account.type === 'revenue' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`}></div>
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{account.name}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{account.number}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${account.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {formatCurrency(account.balance, storeSettings)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingDashboard;
