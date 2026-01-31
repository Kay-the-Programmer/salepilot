import React, { useState, useMemo } from 'react';
import { Expense, Account, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import PlusIcon from '../../icons/PlusIcon';
import PencilIcon from '../../icons/PencilIcon';
import TrashIcon from '../../icons/TrashIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import CalendarDaysIcon from '../../icons/CalendarDaysIcon';
import MagnifyingGlassIcon from '../../icons/MagnifyingGlassIcon';

interface ExpensesViewProps {
    expenses: Expense[];
    accounts: Account[];
    storeSettings: StoreSettings;
    onSave: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'> & { id?: string }) => void;
    onDelete: (id: string) => void;
    onEdit: (expense: Expense) => void;
    onOpenForm: () => void;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, storeSettings, onDelete, onEdit, onOpenForm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.reference?.toLowerCase().includes(searchTerm.toLowerCase());

            const expenseDate = new Date(exp.date);
            const matchesStart = !startDate || expenseDate >= new Date(startDate);
            const matchesEnd = !endDate || expenseDate <= new Date(endDate);

            return matchesSearch && matchesStart && matchesEnd;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, searchTerm, startDate, endDate]);

    const totalExpenseAmount = useMemo(() =>
        filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        [filteredExpenses]
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Expenses</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Track and manage your business outflows</p>
                </div>
                <button
                    onClick={onOpenForm}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 dark:bg-red-500 text-white font-black text-sm rounded-2xl hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-300 shadow-lg shadow-red-600/20 active:scale-95"
                >
                    <PlusIcon className="w-5 h-5" />
                    Record Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 glass-effect !bg-red-50/50 dark:!bg-red-900/20 border-red-200/50 dark:border-red-800/50 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <BanknotesIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-[10px] font-black text-red-600 dark:text-red-300 uppercase tracking-widest bg-red-200/50 dark:bg-red-900/40 px-2.5 py-1 rounded-lg">Total Outflow</span>
                    </div>
                    <div className="text-3xl font-black text-red-900 dark:text-red-50 tracking-tight">{formatCurrency(totalExpenseAmount, storeSettings)}</div>
                    <p className="text-sm text-red-700 dark:text-red-300 font-bold mt-1">Based on {filteredExpenses.length} records</p>
                </div>

                <div className="p-6 glass-effect !bg-blue-50/50 dark:!bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <CalculatorIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-widest bg-blue-200/50 dark:bg-blue-900/40 px-2.5 py-1 rounded-lg">Count</span>
                    </div>
                    <div className="text-3xl font-black text-blue-900 dark:text-blue-50 tracking-tight">{filteredExpenses.length}</div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-bold mt-1">Total transactions</p>
                </div>

                <div className="p-6 glass-effect !bg-amber-50/50 dark:!bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <CalendarIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest bg-amber-200/50 dark:bg-amber-900/40 px-2.5 py-1 rounded-lg">Average</span>
                    </div>
                    <div className="text-3xl font-black text-amber-900 dark:text-amber-50 tracking-tight">
                        {formatCurrency(filteredExpenses.length > 0 ? totalExpenseAmount / filteredExpenses.length : 0, storeSettings)}
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-bold mt-1">Per transaction average</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-effect rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search description, category, reference..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <CalendarDaysIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <CalendarDaysIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
                        />
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="glass-effect rounded-2xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Accounts</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{new Date(exp.date).toLocaleDateString()}</div>
                                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">{exp.id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{exp.description}</div>
                                        {exp.category && (
                                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase tracking-tighter mr-2">
                                                {exp.category}
                                            </span>
                                        )}
                                        {exp.reference && (
                                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                                                Ref: {exp.reference}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-black text-red-600 dark:text-red-400 tracking-tight">{formatCurrency(exp.amount, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"></div>
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{exp.expenseAccountName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{exp.paymentAccountName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end items-center gap-2">
                                            <button
                                                onClick={() => onEdit(exp)}
                                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                title="Edit Expense"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(exp.id)}
                                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                title="Delete Expense"
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
                        <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <BanknotesIcon className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-bold">No expenses found matching your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpensesView;
