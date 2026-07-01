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
                    <h2 className="text-2xl font-bold m3-text-on-surface tracking-tight">Recurring Expenses</h2>
                    <p className="text-sm m3-text-on-surface-variant mt-1">Manage automated business outflows</p>
                </div>
                <button
                    onClick={onOpenForm}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 m3-bg-primary m3-text-on-primary font-bold text-sm rounded-xl transition-all duration-300 active:scale-95 shadow-sm"
                >
                    <PlusIcon className="w-4 h-4" />
                    Set Recurring Expense
                </button>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium m3-text-tertiary uppercase tracking-widest">Monthly Commitment</div>
                        <BanknotesIcon className="w-5 h-5 m3-text-tertiary opacity-70" />
                    </div>
                    <div className="text-2xl font-bold m3-text-on-surface tracking-tight">{formatCurrency(totalRecurringAmount, storeSettings)}</div>
                    <p className="text-xs m3-text-on-surface-variant mt-1">From {filteredExpenses.filter(e => e.status === 'active').length} active commitments</p>
                </div>
            </div>

            {/* Filters */}
            <div>
                <div className="relative group max-w-md">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 m3-text-on-surface-variant">
                        <MagnifyingGlassIcon className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search description, category, reference..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm font-medium m3-bg-surface-container m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Recurring Table */}
            <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="m3-bg-surface-container border-b m3-border-outline-variant">
                                <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant text-right">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant">Schedule</th>
                                <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant">Next Run</th>
                                <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--m3-outline-variant)]">
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="hover:m3-bg-surface-container transition-colors group">
                                    <td className="px-6 py-4 m3-text-on-surface">
                                        <div className="text-sm font-medium">{exp.description}</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {exp.category && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium m3-bg-primary-fixed m3-text-primary">
                                                    {exp.category}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium m3-bg-surface-container m3-text-on-surface-variant">
                                                {exp.expenseAccountName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right m3-text-on-surface">
                                        <div className="text-sm font-bold tracking-tight">{formatCurrency(exp.amount, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4 m3-text-on-surface-variant">
                                        <div className="text-xs font-medium capitalize">{exp.frequency}</div>
                                        <div className="text-[10px] opacity-70">Started: {new Date(exp.startDate).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap m3-text-on-surface">
                                        <div className="text-xs font-medium">{new Date(exp.nextRunDate).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${exp.status === 'active' ? 'bg-green-500/15 text-green-600 dark:text-green-400' :
                                            exp.status === 'paused' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                                                'bg-red-500/15 text-red-600 dark:text-red-400'
                                            }`}>
                                            {exp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end items-center gap-2">
                                            <button
                                                onClick={() => onEdit(exp)}
                                                className="p-1.5 m3-text-on-surface-variant hover:m3-text-primary rounded-lg transition-colors"
                                                title="Edit Commitment"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(exp.id)}
                                                className="p-1.5 m3-text-on-surface-variant hover:m3-text-error rounded-lg transition-colors"
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
                        <div className="text-center py-12">
                            <div className="w-12 h-12 m3-bg-surface-container rounded-xl flex items-center justify-center mx-auto mb-3">
                                <CalendarDaysIcon className="w-6 h-6 m3-text-on-surface-variant" />
                            </div>
                            <p className="m3-text-on-surface font-medium">No recurring expenses found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecurringExpensesView;
