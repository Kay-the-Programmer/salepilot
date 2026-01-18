import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Account, Expense } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import PencilIcon from '../icons/PencilIcon';
import InformationCircleIcon from '../icons/InformationCircleIcon';

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'>) => void;
    expenseToEdit?: Expense | null;
    accounts: Account[];
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave, expenseToEdit, accounts }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        expenseAccountId: '',
        paymentAccountId: '',
        category: '',
        reference: ''
    });

    // Filter accounts for dropdowns
    const expenseAccounts = accounts.filter(a => a.type === 'expense');
    const paymentAccounts = accounts.filter(a =>
        a.subType === 'cash' || a.subType === 'accounts_payable'
    );

    useEffect(() => {
        if (isOpen) {
            if (expenseToEdit) {
                setFormData({
                    date: expenseToEdit.date.split('T')[0],
                    description: expenseToEdit.description,
                    amount: expenseToEdit.amount.toString(),
                    expenseAccountId: expenseToEdit.expenseAccountId,
                    paymentAccountId: expenseToEdit.paymentAccountId,
                    category: expenseToEdit.category || '',
                    reference: expenseToEdit.reference || ''
                });
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    amount: '',
                    expenseAccountId: '',
                    paymentAccountId: paymentAccounts[0]?.id || '',
                    category: '',
                    reference: ''
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
            date: formData.date,
            description: formData.description,
            amount: parseFloat(formData.amount),
            expenseAccountId: formData.expenseAccountId,
            expenseAccountName: expenseAccount.name,
            paymentAccountId: formData.paymentAccountId,
            paymentAccountName: paymentAccount.name,
            category: formData.category || undefined,
            reference: formData.reference || undefined
        });

        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up max-h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="px-6 py-5 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                                    <PencilIcon className="w-5 h-5 text-red-600" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    {expenseToEdit ? 'Edit Expense' : 'Record New Expense'}
                                </h3>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <XMarkIcon className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-sm font-medium"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-sm font-medium"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-sm font-medium"
                                placeholder="e.g., Office rent for January"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Expense Account</label>
                                <select
                                    value={formData.expenseAccountId}
                                    onChange={e => setFormData({ ...formData, expenseAccountId: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-sm font-medium appearance-none"
                                >
                                    <option value="">Select expense type...</option>
                                    {expenseAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Payment Method</label>
                                <select
                                    value={formData.paymentAccountId}
                                    onChange={e => setFormData({ ...formData, paymentAccountId: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-sm font-medium appearance-none"
                                >
                                    <option value="">Select payment source...</option>
                                    {paymentAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Category (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-sm font-medium"
                                    placeholder="e.g., Utilities, Supplies"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Reference # (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-sm font-medium"
                                    placeholder="e.g., Invoice #12345"
                                />
                            </div>
                        </div>

                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                            <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5" />
                            <p className="text-[10px] sm:text-xs font-medium text-blue-700">
                                This expense will be recorded via a journal entry. The expense account will be debited and the payment account will be credited.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-6 py-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200"
                        >
                            {expenseToEdit ? 'Update Expense' : 'Record Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ExpenseFormModal;
