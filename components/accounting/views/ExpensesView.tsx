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
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Expenses</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track and manage your business outflows</p>
                </div>
                <button
                    onClick={onOpenForm}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    Record Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest">Total Outflow</div>
                        <BanknotesIcon className="w-5 h-5 text-red-600 dark:text-red-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(totalExpenseAmount, storeSettings)}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Based on {filteredExpenses.length} records</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest">Count</div>
                        <CalculatorIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{filteredExpenses.length}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total transactions</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-widest">Average</div>
                        <CalendarIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {formatCurrency(filteredExpenses.length > 0 ? totalExpenseAmount / filteredExpenses.length : 0, storeSettings)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Per transaction average</p>
                </div>
            </div>

            {/* Filters */}
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
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
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
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
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
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
                    />
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Accounts</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{new Date(exp.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">ID: {exp.id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{exp.description}</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {exp.category && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                                                    {exp.category}
                                                </span>
                                            )}
                                            {exp.reference && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                    Ref: {exp.reference}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-bold text-red-600 dark:text-red-400 tracking-tight">{formatCurrency(exp.amount, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                                <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{exp.expenseAccountName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{exp.paymentAccountName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end items-center gap-2">
                                            <button
                                                onClick={() => onEdit(exp)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                                                title="Edit Expense"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(exp.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
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
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <BanknotesIcon className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-900 dark:text-slate-100 font-medium">No expenses found</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpensesView;
