import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Account, RecurringExpense } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import InformationCircleIcon from '../icons/InformationCircleIcon';
import CalendarDaysIcon from '../icons/CalendarDaysIcon';

interface RecurringExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Omit<RecurringExpense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'nextRunDate' | 'status'> & { id?: string, status?: string }) => void;
    expenseToEdit?: RecurringExpense | null;
    accounts: Account[];
}

const RecurringExpenseFormModal: React.FC<RecurringExpenseFormModalProps> = ({ isOpen, onClose, onSave, expenseToEdit, accounts }) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expenseAccountId: '',
        paymentAccountId: '',
        category: '',
        reference: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active'
    });

    // Filter accounts for dropdowns
    const expenseAccounts = React.useMemo(() => accounts.filter(a => a.type === 'expense'), [accounts]);
    const paymentAccounts = React.useMemo(() => accounts.filter(a =>
        a.subType === 'cash' || a.subType === 'accounts_payable'
    ), [accounts]);

    useEffect(() => {
        if (isOpen) {
            if (expenseToEdit) {
                setFormData({
                    description: expenseToEdit.description,
                    amount: expenseToEdit.amount.toString(),
                    expenseAccountId: expenseToEdit.expenseAccountId,
                    paymentAccountId: expenseToEdit.paymentAccountId,
                    category: expenseToEdit.category || '',
                    reference: expenseToEdit.reference || '',
                    frequency: expenseToEdit.frequency,
                    startDate: expenseToEdit.startDate.split('T')[0],
                    status: expenseToEdit.status
                });
            } else {
                setFormData({
                    description: '',
                    amount: '',
                    expenseAccountId: '',
                    paymentAccountId: paymentAccounts[0]?.id || '',
                    category: '',
                    reference: '',
                    frequency: 'monthly',
                    startDate: new Date().toISOString().split('T')[0],
                    status: 'active'
                });
            }
        }
    }, [expenseToEdit, isOpen, paymentAccounts]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.expenseAccountId || !formData.paymentAccountId) {
            alert('Please select both expense and payment accounts');
            return;
        }

        const expenseAccount = accounts.find(a => a.id === formData.expenseAccountId);
        const paymentAccount = accounts.find(a => a.id === formData.paymentAccountId);

        if (!expenseAccount || !paymentAccount) {
            alert('Invalid account selection');
            return;
        }

        onSave({
            ...(expenseToEdit?.id ? { id: expenseToEdit.id } : {}),
            description: formData.description,
            amount: parseFloat(formData.amount),
            expenseAccountId: formData.expenseAccountId,
            expenseAccountName: expenseAccount.name,
            paymentAccountId: formData.paymentAccountId,
            paymentAccountName: paymentAccount.name,
            category: formData.category || undefined,
            reference: formData.reference || undefined,
            frequency: formData.frequency as any,
            startDate: formData.startDate,
            status: formData.status as any
        });

        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity -z-10" />

            <div className="liquid-glass-card rounded-[2rem] relative z-10 glass-effect !/95 dark:!bg-slate-900/95 w-full max-w-2xl overflow-hidden flex flex-col animate-scale-up max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/40 rounded-lg">
                                    <CalendarDaysIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    {expenseToEdit ? 'Edit Recurring Expense' : 'Create Recurring Expense'}
                                </h3>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-95 transition-all duration-300">
                                <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 text-left">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100"
                                placeholder="e.g., Monthly Office Rent"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Frequency</label>
                                <select
                                    value={formData.frequency}
                                    onChange={e => setFormData({ ...formData, frequency: e.target.value as any })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="daily" className="dark:bg-slate-900">Daily</option>
                                    <option value="weekly" className="dark:bg-slate-900">Weekly</option>
                                    <option value="monthly" className="dark:bg-slate-900">Monthly</option>
                                    <option value="quarterly" className="dark:bg-slate-900">Quarterly</option>
                                    <option value="yearly" className="dark:bg-slate-900">Yearly</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="active" className="dark:bg-slate-900">Active</option>
                                    <option value="paused" className="dark:bg-slate-900">Paused</option>
                                    <option value="cancelled" className="dark:bg-slate-900">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        drum
                        drum

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Expense Account</label>
                                <select
                                    value={formData.expenseAccountId}
                                    onChange={e => setFormData({ ...formData, expenseAccountId: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="" className="dark:bg-slate-900">Select expense type...</option>
                                    {expenseAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="dark:bg-slate-900">{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Payment Method</label>
                                <select
                                    value={formData.paymentAccountId}
                                    onChange={e => setFormData({ ...formData, paymentAccountId: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="" className="dark:bg-slate-900">Select payment source...</option>
                                    {paymentAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="dark:bg-slate-900">{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        drum
                        drum

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Category (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100"
                                    placeholder="e.g., Utilities, Rent"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Reference # (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100"
                                    placeholder="e.g., Rental Agreement"
                                />
                            </div>
                        </div>
                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
                            <InformationCircleIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                            <p className="text-[10px] sm:text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                This recurring expense will automatically create a new expense entry and journal entry on each scheduled date.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-5 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 active:scale-95 transition-all duration-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                        >
                            {expenseToEdit ? 'Update Recurring Expense' : 'Create Recurring Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default RecurringExpenseFormModal;
