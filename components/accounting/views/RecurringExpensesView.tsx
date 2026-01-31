import React, { useState, useMemo } from 'react';
import { RecurringExpense, Account, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import PlusIcon from '../../icons/PlusIcon';
import PencilIcon from '../../icons/PencilIcon';
import TrashIcon from '../../icons/TrashIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import CalendarDaysIcon from '../../icons/CalendarDaysIcon';
import MagnifyingGlassIcon from '../../icons/MagnifyingGlassIcon';

interface RecurringExpensesViewProps {
    expenses: RecurringExpense[];
    accounts: Account[];
    storeSettings: StoreSettings;
    onSave: (expense: Omit<RecurringExpense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
    onDelete: (id: string) => void;
    onEdit: (expense: RecurringExpense) => void;
    onOpenForm: () => void;
}

const RecurringExpensesView: React.FC<RecurringExpensesViewProps> = ({ expenses, storeSettings, onDelete, onEdit, onOpenForm }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.reference?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [expenses, searchTerm]);

    const totalRecurringAmount = useMemo(() =>
        filteredExpenses.filter(e => e.status === 'active').reduce((sum, exp) => sum + exp.amount, 0),
        [filteredExpenses]
    );

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Recurring Expenses</h2>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Manage automated business outflows</p>
                </div>
                <button
                    onClick={onOpenForm}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black text-sm rounded-2xl hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 active:translate-y-0"
                >
                    <PlusIcon className="w-5 h-5" />
                    Set Recurring Expense
                </button>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div glass-effect="" className="rounded-2xl border border-indigo-200/50 dark:border-indigo-500/20 p-6 !bg-indigo-50/50 dark:!bg-indigo-900/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-indigo-900/40 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                            <BanknotesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-100/50 dark:bg-indigo-500/20 px-2 py-1 rounded-lg">Monthly Commitment</span>
                    </div>
                    <div className="text-3xl font-black text-indigo-900 dark:text-indigo-50 tracking-tight">{formatCurrency(totalRecurringAmount, storeSettings)}</div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium mt-1">From {filteredExpenses.filter(e => e.status === 'active').length} active commitments</p>
                </div>
            </div>

            {/* Filters */}
            <div glass-effect="" className="rounded-2xl p-4">
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <MagnifyingGlassIcon className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search description, category, reference..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    />
                </div>
            </div>

            {/* Recurring Table */}
            <div glass-effect="" className="rounded-2xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Schedule</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Next Run</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                                        <div className="text-sm font-bold">{exp.description}</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {exp.category && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 uppercase tracking-tighter">
                                                    {exp.category}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                                                {exp.expenseAccountName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900 dark:text-slate-100">
                                        <div className="text-sm font-black tracking-tight">{formatCurrency(exp.amount, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        <div className="text-xs font-bold capitalize">{exp.frequency}</div>
                                        <div className="text-[10px] opacity-60">Started: {new Date(exp.startDate).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-slate-100">
                                        <div className="text-xs font-bold">{new Date(exp.nextRunDate).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${exp.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                            exp.status === 'paused' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            }`}>
                                            {exp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end items-center gap-2">
                                            <button
                                                onClick={() => onEdit(exp)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                title="Edit Commitment"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(exp.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                title="Delete Commitment"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredExpenses.length === 0 && (
                        <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                                <CalendarDaysIcon className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-bold">No recurring expenses found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecurringExpensesView;
