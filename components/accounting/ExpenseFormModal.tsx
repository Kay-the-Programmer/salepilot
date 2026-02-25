import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Account, Expense } from '../../types';
import {
    XMarkIcon,
    PencilIcon,
    InformationCircleIcon,
    BuildingOfficeIcon,
    BoltIcon,
    ShoppingBagIcon,
    UsersIcon,
    TruckIcon,
    CurrencyDollarIcon,
    SparklesIcon,
    EllipsisVerticalIcon,
    ChevronDownIcon,
    BanknotesIcon,
    CreditCardIcon,
    ChevronRightIcon
} from '../icons';

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'> & { id?: string }) => void;
    expenseToEdit?: Expense | null;
    accounts: Account[];
}

const QUICK_CATEGORIES = [
    { id: 'rent', name: 'Rent', icon: BuildingOfficeIcon, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'utilities', name: 'Utilities', icon: BoltIcon, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { id: 'supplies', name: 'Supplies', icon: ShoppingBagIcon, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'salaries', name: 'Salaries', icon: UsersIcon, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'transport', name: 'Transport', icon: TruckIcon, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { id: 'marketing', name: 'Marketing', icon: SparklesIcon, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { id: 'taxes', name: 'Taxes', icon: CurrencyDollarIcon, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { id: 'other', name: 'Other', icon: EllipsisVerticalIcon, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-900/20' },
];

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

    const [showOptional, setShowOptional] = useState(false);

    // Filter accounts for dropdowns
    const expenseAccounts = React.useMemo(() => accounts.filter(a => a.type === 'expense'), [accounts]);
    const paymentAccounts = React.useMemo(() => accounts.filter(a =>
        a.subType === 'cash' || a.subType === 'accounts_payable'
    ), [accounts]);

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
                setShowOptional(!!(expenseToEdit.category || expenseToEdit.reference));
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
                setShowOptional(false);
            }
        }
    }, [expenseToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

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
            date: formData.date,
            description: formData.description || (expenseAccount.name + ' - ' + new Date(formData.date).toLocaleDateString()),
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

    const handleQuickCategorySelect = (catName: string) => {
        // Try to find a matching expense account
        const matchingAccount = expenseAccounts.find(acc =>
            acc.name.toLowerCase().includes(catName.toLowerCase())
        );

        if (matchingAccount) {
            setFormData(prev => ({
                ...prev,
                expenseAccountId: matchingAccount.id,
                category: catName
            }));
        } else {
            // Fallback: just set the category
            setFormData(prev => ({ ...prev, category: catName }));
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity -z-10 animate-fade-in" />

            <div
                className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:animate-scale-up max-h-[95vh] relative"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                <BanknotesIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                {expenseToEdit ? 'Edit Expense' : 'Record Expense'}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="px-8 pb-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Amount Section */}
                        <div className="text-center space-y-2">
                            <div className="relative inline-block">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300 dark:text-slate-700">
                                    $
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    className="block w-full text-center text-6xl font-black bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-200 dark:placeholder-slate-800 p-0"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Quick Categories */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Quick Select Category</label>
                            <div className="grid grid-cols-4 gap-3">
                                {QUICK_CATEGORIES.map(cat => {
                                    const Icon = cat.icon;
                                    const isSelected = formData.category === cat.name;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleQuickCategorySelect(cat.name)}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 active:scale-90 ${isSelected ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-950 bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center`}>
                                                <Icon className={`w-5 h-5 ${cat.color}`} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{cat.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Account Selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Expense Account</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center pointer-events-none transition-colors group-focus-within:bg-orange-100">
                                        <PencilIcon className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <select
                                        value={formData.expenseAccountId}
                                        onChange={e => setFormData({ ...formData, expenseAccountId: e.target.value })}
                                        required
                                        className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-red-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 transition-all appearance-none outline-none"
                                    >
                                        <option value="">Select Account...</option>
                                        {expenseAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Payment Method</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center pointer-events-none transition-colors group-focus-within:bg-blue-100">
                                        <CreditCardIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <select
                                        value={formData.paymentAccountId}
                                        onChange={e => setFormData({ ...formData, paymentAccountId: e.target.value })}
                                        required
                                        className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-red-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 transition-all appearance-none outline-none"
                                    >
                                        <option value="">Select Method...</option>
                                        {paymentAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-red-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Office Supplies"
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-red-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Optional Fields Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowOptional(!showOptional)}
                            className="flex items-center gap-2 group"
                        >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${showOptional ? 'bg-red-50 text-red-600 rotate-90' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                <ChevronRightIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                                {showOptional ? 'Hide Additional Details' : 'Add More Details (Reference, Category)'}
                            </span>
                        </button>

                        {showOptional && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Category Override</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g., Seasonal Promo"
                                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-red-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Reference / Inv #</label>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                        placeholder="e.g., INV-2024-001"
                                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-red-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-[1.5rem] border border-blue-100/50 dark:border-blue-800/20 flex items-start gap-3">
                            <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] font-bold text-blue-700/80 dark:text-blue-300/80 leading-relaxed uppercase tracking-wider">
                                THIS WILL CREATE A JOURNAL ENTRY: DEBITING {formData.expenseAccountId ? accounts.find(a => a.id === formData.expenseAccountId)?.name || 'EXPENSE' : 'EXPENSE'} AND CREDITING {formData.paymentAccountId ? accounts.find(a => a.id === formData.paymentAccountId)?.name || 'PAYMENT' : 'PAYMENT'}.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 text-sm font-black text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-4 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-[2rem] shadow-xl shadow-red-500/20 active:scale-95 transition-all duration-300"
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
