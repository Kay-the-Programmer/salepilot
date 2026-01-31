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
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Financial Overview</h3>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Real-time business performance metrics</p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/30 inline-flex items-center gap-2 self-start">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Live Data</span>
                </div>
            </div>

            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div glass-effect="" className="!bg-blue-50/50 dark:!bg-blue-900/20 border-blue-200/50 dark:border-blue-500/10 p-6 rounded-3xl hover:border-blue-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-blue-900/40 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-500/20">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-100/50 dark:bg-blue-500/20 px-2 py-1 rounded-lg">Revenue</span>
                    </div>
                    <div className="text-2xl font-black text-blue-900 dark:text-blue-50 tracking-tight">{formatCurrency(totalRevenue, storeSettings)}</div>
                    <div className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400 mt-2 uppercase tracking-widest">Total sales income</div>
                </div>

                <div glass-effect="" className="!bg-red-50/50 dark:!bg-red-900/20 border-red-200/50 dark:border-red-500/10 p-6 rounded-3xl hover:border-red-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-red-900/40 rounded-2xl shadow-sm border border-red-100 dark:border-red-500/20">
                            <ArrowTrendingDownIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest bg-red-100/50 dark:bg-red-500/20 px-2 py-1 rounded-lg">Expenses</span>
                    </div>
                    <div className="text-2xl font-black text-red-900 dark:text-red-50 tracking-tight">{formatCurrency(totalExpenses, storeSettings)}</div>
                    <div className="text-[10px] font-bold text-red-600/80 dark:text-red-400 mt-2 uppercase tracking-widest">Total operational costs</div>
                </div>

                <div glass-effect="" className="!bg-emerald-50/50 dark:!bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-500/10 p-6 rounded-3xl hover:border-emerald-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-emerald-900/40 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                            <CalculatorIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100/50 dark:bg-emerald-500/20 px-2 py-1 rounded-lg">Net Income</span>
                    </div>
                    <div className={`text-2xl font-black tracking-tight ${netIncome >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-rose-900 dark:text-rose-100'}`}>
                        {formatCurrency(netIncome, storeSettings)}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400 mt-2 uppercase tracking-widest">Gross Profitability</div>
                </div>

                <div glass-effect="" className="!bg-purple-50/50 dark:!bg-purple-900/20 border-purple-200/50 dark:border-purple-500/10 p-6 rounded-3xl hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-purple-900/40 rounded-2xl shadow-sm border border-purple-100 dark:border-purple-500/20">
                            <BanknotesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest bg-purple-100/50 dark:bg-purple-500/20 px-2 py-1 rounded-lg">Assets</span>
                    </div>
                    <div className="text-2xl font-black text-purple-900 dark:text-purple-50 tracking-tight">{formatCurrency(totalAssets, storeSettings)}</div>
                    <div className="text-[10px] font-bold text-purple-600/80 dark:text-purple-400 mt-2 uppercase tracking-widest">Current valuation</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div glass-effect="" className="rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Recent Activity</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full uppercase tracking-widest">
                                    {recentTransactions.length} items
                                </span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {recentTransactions.map(entry => (
                                <div key={entry.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-300 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                                                {entry.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                                                    {new Date(entry.date).toLocaleDateString()}
                                                </span>
                                                <span className="text-slate-200 dark:text-slate-800">•</span>
                                                <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-tighter opacity-80">
                                                    REF: {entry.reference || 'SYSTEM'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-100/50 dark:border-slate-800">
                                            {entry.id.substring(0, 4)}
                                        </div>
                                    </div>
                                    <div className="space-y-2 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-1">
                                        {entry.lines.map((line, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${line.type === 'debit' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}></div>
                                                    <span className="text-slate-700 dark:text-slate-300 font-bold">{line.accountName}</span>
                                                </div>
                                                <span className={`font-black tracking-tight ${line.type === 'debit' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
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
                                    <p className="text-slate-500 dark:text-slate-400 font-black">No transaction history</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-widest font-bold">Ledger is currently empty</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div glass-effect="" className="rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <CalculatorIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Key Balances</h3>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[480px] overflow-y-auto custom-scrollbar">
                            {accounts.filter(a => a.subType).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 8).map(account => (
                                <div key={account.id} className="px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-300 group">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-2 h-2 rounded-full shadow-sm ${account.type === 'asset' ? 'bg-blue-500' :
                                                    account.type === 'liability' ? 'bg-red-500' :
                                                        account.type === 'equity' ? 'bg-purple-500' :
                                                            account.type === 'revenue' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`}></div>
                                                <span className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate tracking-tight">{account.name}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest pl-4.5">{account.number}</div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className={`text-sm font-black tracking-tight ${account.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'
                                                }`}>
                                                {formatCurrency(account.balance, storeSettings)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div glass-effect="" className="p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Growth Vector</h4>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                            Total assets currently exceed liabilities by <span className="text-indigo-600 dark:text-indigo-400 px-1">{formatCurrency(totalAssets - accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0), storeSettings)}</span>. Maintain this ratio to ensure liquidity.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingDashboard;
