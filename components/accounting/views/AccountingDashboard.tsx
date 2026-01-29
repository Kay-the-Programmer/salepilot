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
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-blue-700">Revenue</div>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue, storeSettings)}</div>
                    <div className="text-xs text-blue-600 mt-2">Total income this period</div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                            <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-red-700">Expenses</div>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses, storeSettings)}</div>
                    <div className="text-xs text-red-600 mt-2">Total costs this period</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                            <CalculatorIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-emerald-700">Net Income</div>
                        </div>
                    </div>
                    <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                        {formatCurrency(netIncome, storeSettings)}
                    </div>
                    <div className="text-xs text-emerald-600 mt-2">Profit after expenses</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                            <BanknotesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-purple-700">Assets</div>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{formatCurrency(totalAssets, storeSettings)}</div>
                    <div className="text-xs text-purple-600 mt-2">Total company assets</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                        <BookOpenIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">Recent Journal Entries</h3>
                                </div>
                                <span className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-100 rounded-full">
                                    {recentTransactions.length} entries
                                </span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recentTransactions.map(entry => (
                                <div key={entry.id} className="p-5 hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
                                                {entry.description}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(entry.date).toLocaleDateString()} • {entry.reference || 'No reference'}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {entry.lines.map((line, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${line.type === 'debit' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                                    <span className="text-slate-700">{line.accountName}</span>
                                                </div>
                                                <span className={`font-mono ${line.type === 'debit' ? 'text-blue-700' : 'text-green-700'}`}>
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
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                                    <CalculatorIcon className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Account Balances</h3>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                            {accounts.filter(a => a.subType).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 8).map(account => (
                                <div key={account.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${account.type === 'asset' ? 'bg-blue-500' :
                                                    account.type === 'liability' ? 'bg-red-500' :
                                                        account.type === 'equity' ? 'bg-purple-500' :
                                                            account.type === 'revenue' ? 'bg-green-500' : 'bg-amber-500'
                                                    }`}></div>
                                                <span className="text-sm font-medium text-slate-900 truncate">{account.name}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">{account.number}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'
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
