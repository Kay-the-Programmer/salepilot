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
    onSave: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'>) => void;
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
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Expenses</h2>
                    <p className="text-sm text-slate-600 mt-1">Track and manage your business outflows</p>
                </div>
                <button
                    onClick={onOpenForm}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-sm rounded-2xl hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300"
                >
                    <PlusIcon className="w-5 h-5" />
                    Record Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <BanknotesIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-xs font-black text-red-600 uppercase tracking-widest bg-red-200/50 px-2 py-1 rounded-lg">Total Outflow</span>
                    </div>
                    <div className="text-3xl font-black text-red-900 tracking-tight">{formatCurrency(totalExpenseAmount, storeSettings)}</div>
                    <p className="text-sm text-red-700 font-medium mt-1">Based on {filteredExpenses.length} records</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <CalculatorIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-200/50 px-2 py-1 rounded-lg">Count</span>
                    </div>
                    <div className="text-3xl font-black text-blue-900 tracking-tight">{filteredExpenses.length}</div>
                    <p className="text-sm text-blue-700 font-medium mt-1">Total transactions</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <CalendarIcon className="w-6 h-6 text-amber-600" />
                        </div>
                        <span className="text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-200/50 px-2 py-1 rounded-lg">Average</span>
                    </div>
                    <div className="text-3xl font-black text-amber-900 tracking-tight">
                        {formatCurrency(filteredExpenses.length > 0 ? totalExpenseAmount / filteredExpenses.length : 0, storeSettings)}
                    </div>
                    <p className="text-sm text-amber-700 font-medium mt-1">Per transaction average</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search description, category, reference..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <CalendarDaysIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <CalendarDaysIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Accounts</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900">{new Date(exp.date).toLocaleDateString()}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{exp.id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">{exp.description}</div>
                                        {exp.category && (
                                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-black bg-blue-50 text-blue-700 uppercase tracking-tighter mr-2">
                                                {exp.category}
                                            </span>
                                        )}
                                        {exp.reference && (
                                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-black bg-slate-100 text-slate-600 uppercase tracking-tighter">
                                                Ref: {exp.reference}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-black text-red-600 tracking-tight">{formatCurrency(exp.amount, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">{exp.expenseAccountName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">{exp.paymentAccountName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end items-center gap-2">
                                            <button
                                                onClick={() => onEdit(exp)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Edit Expense"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(exp.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
                        <div className="text-center py-20 bg-white">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <BanknotesIcon className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-500 font-bold">No expenses found matching your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpensesView;
