import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Account, Expense, RecurringExpense, StoreSettings } from '../../types';
import {
    XMarkIcon,
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
    ChevronRightIcon,
    RefreshIcon,
} from '../icons';

type Mode = 'one-time' | 'recurring';

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
    storeSettings?: StoreSettings;
    /** Save a one-time expense. */
    onSave: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt'> & { id?: string }) => void;
    /** Save a recurring expense. */
    onSaveRecurring: (expense: Omit<RecurringExpense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'nextRunDate' | 'status'> & { id?: string; status?: string }) => void;
    expenseToEdit?: Expense | null;
    recurringToEdit?: RecurringExpense | null;
    /** Which mode a brand-new entry opens in. Ignored when editing. */
    initialMode?: Mode;
}

const QUICK_CATEGORIES = [
    { id: 'rent', name: 'Rent', icon: BuildingOfficeIcon },
    { id: 'utilities', name: 'Utilities', icon: BoltIcon },
    { id: 'supplies', name: 'Supplies', icon: ShoppingBagIcon },
    { id: 'salaries', name: 'Salaries', icon: UsersIcon },
    { id: 'transport', name: 'Transport', icon: TruckIcon },
    { id: 'marketing', name: 'Marketing', icon: SparklesIcon },
    { id: 'taxes', name: 'Taxes', icon: CurrencyDollarIcon },
    { id: 'other', name: 'Other', icon: EllipsisVerticalIcon },
];

// One field language for the whole form.
const FIELD = 'w-full px-4 py-3 rounded-xl text-sm font-semibold bg-surface-variant text-brand-text border border-brand-border focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';
const LABEL = 'block text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5';

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
        <select {...props} className={FIELD + ' appearance-none pr-10'} />
        <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
    </div>
);

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
    isOpen, onClose, accounts, storeSettings, onSave, onSaveRecurring, expenseToEdit, recurringToEdit, initialMode,
}) => {
    const [mode, setMode] = useState<Mode>('one-time');
    const [showOptional, setShowOptional] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        expenseAccountId: '',
        paymentAccountId: '',
        category: '',
        reference: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
    });

    const symbol = storeSettings?.currency?.symbol ?? '';
    const isEditing = !!(expenseToEdit || recurringToEdit);

    const expenseAccounts = React.useMemo(() => accounts.filter(a => a.type === 'expense'), [accounts]);
    const paymentAccounts = React.useMemo(() => accounts.filter(a =>
        a.subType === 'cash' || a.subType === 'accounts_payable'
    ), [accounts]);

    useEffect(() => {
        if (!isOpen) return;
        const today = new Date().toISOString().split('T')[0];
        if (recurringToEdit) {
            setMode('recurring');
            setFormData({
                date: today,
                description: recurringToEdit.description,
                amount: recurringToEdit.amount.toString(),
                expenseAccountId: recurringToEdit.expenseAccountId,
                paymentAccountId: recurringToEdit.paymentAccountId,
                category: recurringToEdit.category || '',
                reference: recurringToEdit.reference || '',
                frequency: recurringToEdit.frequency,
                startDate: recurringToEdit.startDate.split('T')[0],
                status: recurringToEdit.status,
            });
            setShowOptional(!!(recurringToEdit.category || recurringToEdit.reference));
        } else if (expenseToEdit) {
            setMode('one-time');
            setFormData({
                date: expenseToEdit.date.split('T')[0],
                description: expenseToEdit.description,
                amount: expenseToEdit.amount.toString(),
                expenseAccountId: expenseToEdit.expenseAccountId,
                paymentAccountId: expenseToEdit.paymentAccountId,
                category: expenseToEdit.category || '',
                reference: expenseToEdit.reference || '',
                frequency: 'monthly',
                startDate: today,
                status: 'active',
            });
            setShowOptional(!!(expenseToEdit.category || expenseToEdit.reference));
        } else {
            setMode(initialMode ?? 'one-time');
            setFormData({
                date: today, description: '', amount: '', expenseAccountId: '',
                paymentAccountId: paymentAccounts[0]?.id || '', category: '', reference: '',
                frequency: 'monthly', startDate: today, status: 'active',
            });
            setShowOptional(false);
        }
    }, [isOpen, expenseToEdit, recurringToEdit, initialMode]);

    if (!isOpen) return null;

    const set = (patch: Partial<typeof formData>) => setFormData(prev => ({ ...prev, ...patch }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || parseFloat(formData.amount) <= 0) { alert('Please enter a valid amount'); return; }
        if (!formData.expenseAccountId || !formData.paymentAccountId) { alert('Please select both expense and payment accounts'); return; }

        const expenseAccount = accounts.find(a => a.id === formData.expenseAccountId);
        const paymentAccount = accounts.find(a => a.id === formData.paymentAccountId);
        if (!expenseAccount || !paymentAccount) { alert('Invalid account selection'); return; }

        const common = {
            amount: parseFloat(formData.amount),
            expenseAccountId: formData.expenseAccountId,
            expenseAccountName: expenseAccount.name,
            paymentAccountId: formData.paymentAccountId,
            paymentAccountName: paymentAccount.name,
            category: formData.category || undefined,
            reference: formData.reference || undefined,
        };

        if (mode === 'recurring') {
            onSaveRecurring({
                ...(recurringToEdit?.id ? { id: recurringToEdit.id } : {}),
                ...common,
                description: formData.description || (expenseAccount.name + ' (Recurring)'),
                frequency: formData.frequency as any,
                startDate: formData.startDate,
                status: formData.status as any,
            });
        } else {
            onSave({
                ...(expenseToEdit?.id ? { id: expenseToEdit.id } : {}),
                ...common,
                date: formData.date,
                description: formData.description || (expenseAccount.name + ' - ' + new Date(formData.date).toLocaleDateString()),
            });
        }
        onClose();
    };

    const handleQuickCategorySelect = (catName: string) => {
        const match = expenseAccounts.find(acc => acc.name.toLowerCase().includes(catName.toLowerCase()));
        set(match ? { expenseAccountId: match.id, category: catName } : { category: catName });
    };

    const recurring = mode === 'recurring';
    const HeaderIcon = recurring ? RefreshIcon : BanknotesIcon;
    const title = recurring
        ? (recurringToEdit ? 'Edit Recurring Expense' : 'New Recurring Expense')
        : (expenseToEdit ? 'Edit Expense' : 'Record Expense');
    const submitLabel = recurring
        ? (recurringToEdit ? 'Update Recurring' : 'Create Recurring')
        : (expenseToEdit ? 'Update Expense' : 'Record Expense');
    const expenseName = accounts.find(a => a.id === formData.expenseAccountId)?.name || 'Expense';
    const paymentName = accounts.find(a => a.id === formData.paymentAccountId)?.name || 'Payment';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-warm-900/50 backdrop-blur-sm animate-fade-in" />

            <div
                className="relative bg-surface w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:animate-scale-up max-h-[95vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-brand-border">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <HeaderIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-brand-text tracking-tight leading-tight">{title}</h3>
                                <p className="text-xs text-brand-text-muted">{recurring ? 'Schedule an automatic outflow' : 'Log a business outflow'}</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg text-brand-text-muted hover:bg-surface-variant transition-colors flex-shrink-0">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Mode toggle (new entries only) */}
                        {!isEditing && (
                            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-variant">
                                {(['one-time', 'recurring'] as Mode[]).map(m => {
                                    const on = mode === m;
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMode(m)}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${on ? 'bg-surface text-brand-text shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                                        >
                                            {m === 'one-time' ? <BanknotesIcon className="w-4 h-4" /> : <RefreshIcon className="w-4 h-4" />}
                                            {m === 'one-time' ? 'One-time' : 'Recurring'}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Amount */}
                        <div className="rounded-2xl bg-surface-variant border border-brand-border px-5 py-5 text-center">
                            <label className={LABEL + ' mb-2'}>Amount</label>
                            <div className="flex items-center justify-center gap-1.5">
                                {symbol && <span className="text-3xl font-black text-brand-text-muted">{symbol}</span>}
                                <input
                                    type="number"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={formData.amount}
                                    onChange={e => set({ amount: e.target.value })}
                                    required
                                    className="w-full max-w-[220px] text-center text-5xl font-black bg-transparent border-none focus:ring-0 text-brand-text placeholder:text-brand-text-muted/40 p-0 outline-none"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className={LABEL}>Category</label>
                            <div className="grid grid-cols-4 gap-2">
                                {QUICK_CATEGORIES.map(cat => {
                                    const Icon = cat.icon;
                                    const on = formData.category === cat.name;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleQuickCategorySelect(cat.name)}
                                            className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border transition-all active:scale-95 ${on ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-variant border-transparent text-brand-text-muted hover:border-brand-border'}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-[10px] font-bold leading-none">{cat.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Accounts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Expense Account</label>
                                <Select value={formData.expenseAccountId} onChange={e => set({ expenseAccountId: e.target.value })} required>
                                    <option value="">Select account…</option>
                                    {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <label className={LABEL}>Payment Method</label>
                                <Select value={formData.paymentAccountId} onChange={e => set({ paymentAccountId: e.target.value })} required>
                                    <option value="">Select method…</option>
                                    {paymentAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </Select>
                            </div>
                        </div>

                        {/* Timing — the only part that differs by mode */}
                        {recurring ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={LABEL}>Frequency</label>
                                        <Select value={formData.frequency} onChange={e => set({ frequency: e.target.value })} required>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="yearly">Yearly</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className={LABEL}>Start Date</label>
                                        <input type="date" value={formData.startDate} onChange={e => set({ startDate: e.target.value })} required className={FIELD} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={LABEL}>Description</label>
                                        <input type="text" value={formData.description} onChange={e => set({ description: e.target.value })} placeholder="e.g. Monthly office rent" className={FIELD} />
                                    </div>
                                    {recurringToEdit && (
                                        <div>
                                            <label className={LABEL}>Status</label>
                                            <Select value={formData.status} onChange={e => set({ status: e.target.value })}>
                                                <option value="active">Active</option>
                                                <option value="paused">Paused</option>
                                                <option value="cancelled">Cancelled</option>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={LABEL}>Date</label>
                                    <input type="date" value={formData.date} onChange={e => set({ date: e.target.value })} required className={FIELD} />
                                </div>
                                <div>
                                    <label className={LABEL}>Description</label>
                                    <input type="text" value={formData.description} onChange={e => set({ description: e.target.value })} placeholder="e.g. Office supplies" className={FIELD} />
                                </div>
                            </div>
                        )}

                        {/* Optional */}
                        <div>
                            <button type="button" onClick={() => setShowOptional(!showOptional)} className="flex items-center gap-2 group">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${showOptional ? 'bg-primary/10 text-primary rotate-90' : 'bg-surface-variant text-brand-text-muted'}`}>
                                    <ChevronRightIcon className="w-3.5 h-3.5" />
                                </span>
                                <span className="text-xs font-bold text-brand-text-muted group-hover:text-brand-text transition-colors">
                                    {showOptional ? 'Hide additional details' : 'Add reference & category'}
                                </span>
                            </button>

                            {showOptional && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-fade-in">
                                    <div>
                                        <label className={LABEL}>Category Override</label>
                                        <input type="text" value={formData.category} onChange={e => set({ category: e.target.value })} placeholder="e.g. Fixed cost" className={FIELD} />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Reference / Note</label>
                                        <input type="text" value={formData.reference} onChange={e => set({ reference: e.target.value })} placeholder="e.g. INV-2024-001" className={FIELD} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Journal hint */}
                        <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
                            <InformationCircleIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-brand-text-muted leading-relaxed">
                                {recurring
                                    ? <>Auto-posts a journal entry every <span className="font-bold text-brand-text lowercase">{formData.frequency}</span> — debit <span className="font-bold text-brand-text">{expenseName}</span>, credit <span className="font-bold text-brand-text">{paymentName}</span>.</>
                                    : <>Posts a journal entry — debit <span className="font-bold text-brand-text">{expenseName}</span>, credit <span className="font-bold text-brand-text">{paymentName}</span>.</>}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-border bg-surface">
                        <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-brand-text-muted hover:text-brand-text transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-all">
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ExpenseFormModal;
