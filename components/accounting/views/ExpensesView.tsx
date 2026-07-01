import React, { useState, useEffect, useCallback } from 'react';
import { Expense, RecurringExpense, Account, StoreSettings } from '../../../types';
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
import RefreshIcon from '../../icons/RefreshIcon';
import LoadingSpinner from '../../LoadingSpinner';
import RecurringExpensesView from './RecurringExpensesView';

interface ExpensesViewProps {
    expenses: Expense[]; // Still receive from parent for initial/sync
    recurringExpenses: RecurringExpense[];
    accounts: Account[];
    storeSettings: StoreSettings;
    onSave: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'> & { id?: string }) => void;
    onDelete: (id: string) => void;
    onEdit: (expense: Expense) => void;
    onOpenForm: () => void;
    onSaveRecurring: (expense: Omit<RecurringExpense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'nextRunDate' | 'status'> & { id?: string, status?: string }) => void;
    onDeleteRecurring: (id: string) => void;
    onEditRecurring: (expense: RecurringExpense) => void;
    onOpenRecurringForm: () => void;
}

const FIELD = 'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm font-medium m3-bg-surface-container m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] focus:border-transparent transition-all';

const ExpensesView: React.FC<ExpensesViewProps> = ({
    expenses: parentExpenses,
    recurringExpenses,
    accounts,
    storeSettings,
    onDelete,
    onEdit,
    onOpenForm,
    onSaveRecurring,
    onDeleteRecurring,
    onEditRecurring,
    onOpenRecurringForm,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'regular' | 'recurring'>('regular');

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

    const TABS: { id: 'regular' | 'recurring'; label: string; icon: React.FC<{ className?: string }> }[] = [
        { id: 'regular', label: 'One-time', icon: BanknotesIcon },
        { id: 'recurring', label: 'Recurring', icon: RefreshIcon },
    ];

    return (
        <div className="space-y-6 pb-10">
            {/* Header + segmented switcher — uniform with the other hub sections */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold m3-text-on-surface tracking-tight">Expenses</h2>
                    <p className="text-sm m3-text-on-surface-variant mt-1">Track and manage your business outflows</p>
                </div>
                <div className="flex m3-bg-surface-container p-1 rounded-xl border m3-border-outline-variant self-start sm:self-auto">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        const active = activeSubTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveSubTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'm3-bg-surface-lowest m3-text-on-surface shadow-sm' : 'm3-text-on-surface-variant hover:m3-text-on-surface'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeSubTab === 'regular' ? (
                <div className="sp-fade-in space-y-6">
                    {/* Summary + primary action */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[11px] font-semibold m3-text-error uppercase tracking-widest">Total Outflow</div>
                                <BanknotesIcon className="w-5 h-5 m3-text-error opacity-70" />
                            </div>
                            <div className="text-2xl font-bold m3-text-on-surface tracking-tight">{formatCurrency(totalAmount, storeSettings)}</div>
                            <p className="text-xs m3-text-on-surface-variant mt-1">Based on {totalCount} records</p>
                        </div>
                        <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[11px] font-semibold m3-text-primary uppercase tracking-widest">Records</div>
                                <CalculatorIcon className="w-5 h-5 m3-text-primary opacity-70" />
                            </div>
                            <div className="text-2xl font-bold m3-text-on-surface tracking-tight">{totalCount}</div>
                            <p className="text-xs m3-text-on-surface-variant mt-1">Total transactions</p>
                        </div>
                        <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[11px] font-semibold m3-text-secondary uppercase tracking-widest">Average</div>
                                <CalendarIcon className="w-5 h-5 m3-text-secondary opacity-70" />
                            </div>
                            <div className="text-2xl font-bold m3-text-on-surface tracking-tight">
                                {formatCurrency(totalCount > 0 ? totalAmount / totalCount : 0, storeSettings)}
                            </div>
                            <p className="text-xs m3-text-on-surface-variant mt-1">Per transaction</p>
                        </div>
                    </div>

                    {/* Toolbar: filters + record action */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="relative flex-1 min-w-0">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 m3-text-on-surface-variant" />
                            <input
                                type="text"
                                placeholder="Search description, category, reference…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={FIELD}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 m3-text-on-surface-variant" />
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={FIELD} />
                            </div>
                            <div className="relative flex-1">
                                <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 m3-text-on-surface-variant" />
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={FIELD} />
                            </div>
                        </div>
                        <button
                            onClick={onOpenForm}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 m3-bg-primary m3-text-on-primary font-bold text-sm rounded-lg shadow-sm active:scale-95 transition-all whitespace-nowrap"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Record Expense
                        </button>
                    </div>

                    {/* Expenses table */}
                    <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden relative min-h-[200px]">
                        {isLoading && (
                            <div className="absolute inset-0 backdrop-blur-[2px] z-10 flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--m3-surface) 50%, transparent)' }}>
                                <LoadingSpinner />
                            </div>
                        )}
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="m3-bg-surface-container border-b m3-border-outline-variant">
                                        <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant">Description</th>
                                        <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant text-right">Amount</th>
                                        <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant">Accounts</th>
                                        <th className="px-6 py-4 text-xs font-semibold m3-text-on-surface-variant text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--m3-outline-variant)]">
                                    {items.map(exp => (
                                        <tr key={exp.id} className="hover:m3-bg-surface-container transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium m3-text-on-surface">{new Date(exp.date).toLocaleDateString()}</div>
                                                <div className="text-xs m3-text-on-surface-variant mt-0.5">ID: {exp.id.substring(0, 8)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium m3-text-on-surface">{exp.description}</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {exp.category && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium m3-bg-primary-fixed m3-text-primary">
                                                            {exp.category}
                                                        </span>
                                                    )}
                                                    {exp.reference && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium m3-bg-surface-container m3-text-on-surface-variant">
                                                            Ref: {exp.reference}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-bold m3-text-error tracking-tight">{formatCurrency(exp.amount, storeSettings)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--m3-error)' }}></div>
                                                        <span className="text-xs m3-text-on-surface-variant truncate max-w-[150px]">{exp.expenseAccountName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--m3-primary)' }}></div>
                                                        <span className="text-xs m3-text-on-surface-variant truncate max-w-[150px]">{exp.paymentAccountName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => onEdit(exp)}
                                                        className="p-1.5 m3-text-on-surface-variant hover:m3-text-primary rounded-lg transition-colors"
                                                        title="Edit Expense"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(exp.id)}
                                                        className="p-1.5 m3-text-on-surface-variant hover:m3-text-error rounded-lg transition-colors"
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
                                <div className="text-center py-14">
                                    <div className="w-12 h-12 m3-bg-surface-container rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <BanknotesIcon className="w-6 h-6 m3-text-on-surface-variant" />
                                    </div>
                                    <p className="m3-text-on-surface font-medium">No expenses found</p>
                                    <p className="text-sm m3-text-on-surface-variant mt-1">
                                        {searchTerm || startDate || endDate ? 'Try adjusting your filters' : 'Record your first expense to get started'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="sp-fade-in">
                    <RecurringExpensesView
                        expenses={recurringExpenses}
                        accounts={accounts}
                        storeSettings={storeSettings}
                        onSave={onSaveRecurring}
                        onDelete={onDeleteRecurring}
                        onEdit={onEditRecurring}
                        onOpenForm={onOpenRecurringForm}
                    />
                </div>
            )}
        </div>
    );
};

export default ExpensesView;
