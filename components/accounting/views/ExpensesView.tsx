import React, { useState, useEffect, useCallback } from 'react';
import { Expense, Account, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { api } from '../../../services/api';
import PlusIcon from '../../icons/PlusIcon';
import PencilIcon from '../../icons/PencilIcon';
import TrashIcon from '../../icons/TrashIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import CalendarDaysIcon from '../../icons/CalendarDaysIcon';
import MagnifyingGlassIcon from '../../icons/MagnifyingGlassIcon';
import LoadingSpinner from '../../LoadingSpinner';

interface ExpensesViewProps {
    expenses: Expense[]; // Still receive from parent for initial/sync
    accounts: Account[];
    storeSettings: StoreSettings;
    onSave: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'> & { id?: string }) => void;
    onDelete: (id: string) => void;
    onEdit: (expense: Expense) => void;
    onOpenForm: () => void;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses: parentExpenses, storeSettings, onDelete, onEdit, onOpenForm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [items, setItems] = useState<Expense[]>(parentExpenses);
    const [totalCount, setTotalCount] = useState(parentExpenses.length);
    const [totalAmount, setTotalAmount] = useState(parentExpenses.reduce((sum, e) => sum + e.amount, 0));
    const [isLoading, setIsLoading] = useState(false);

    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await api.get<{ items: Expense[], totalCount: number, totalAmount: number }>(`/expenses?${params.toString()}`);
            setItems(response.items);
            setTotalCount(response.totalCount);
            setTotalAmount(response.totalAmount);
        } catch (error) {
            console.error('Failed to fetch filtered expenses:', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, startDate, endDate]);

    // Initial load and sync with parent updates (after edit/delete)
    useEffect(() => {
        if (!searchTerm && !startDate && !endDate) {
            setItems(parentExpenses);
            setTotalCount(parentExpenses.length);
            setTotalAmount(parentExpenses.reduce((sum, e) => sum + e.amount, 0));
        } else {
            const timer = setTimeout(fetchExpenses, 300);
            return () => clearTimeout(timer);
        }
    }, [parentExpenses, searchTerm, startDate, endDate, fetchExpenses]);

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Expenses</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track and manage your business outflows</p>
                </div>
                <button
                    onClick={onOpenForm}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors active:scale-95 transition-all duration-300"
                >
                    <PlusIcon className="w-4 h-4" />
                    Record Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest">Total Outflow</div>
                        <BanknotesIcon className="w-5 h-5 text-red-600 dark:text-red-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(totalAmount, storeSettings)}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Based on {totalCount} records</p>
                </div>

                <div className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest">Count</div>
                        <CalculatorIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{totalCount}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total transactions</p>
                </div>

                <div className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-widest">Average</div>
                        <CalendarIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {formatCurrency(totalCount > 0 ? totalAmount / totalCount : 0, storeSettings)}
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
            <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[200px]">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                )}
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
                            {items.map(exp => (
                                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group active:scale-95 transition-all duration-300">
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
                    {items.length === 0 && !isLoading && (
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
