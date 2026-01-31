import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Account, AccountType } from '../../../types';
import PencilIcon from '../../icons/PencilIcon';
import XMarkIcon from '../../icons/XMarkIcon';
import InformationCircleIcon from '../../icons/InformationCircleIcon';

interface AccountFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: Account) => void;
    accountToEdit?: Account | null;
}

const AccountFormModal: React.FC<AccountFormModalProps> = ({ isOpen, onClose, onSave, accountToEdit }) => {
    const [account, setAccount] = useState<Omit<Account, 'id' | 'balance'>>({
        name: '', number: '', type: 'expense', isDebitNormal: true, description: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (accountToEdit) {
                setAccount(accountToEdit);
            } else {
                setAccount({ name: '', number: '', type: 'expense', isDebitNormal: true, description: '' });
            }
        }
    }, [accountToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isDebitNormal = account.type === 'asset' || account.type === 'expense';
        const finalAccount: Account = {
            ...account,
            id: accountToEdit?.id || `acc_${Date.now()}`,
            balance: accountToEdit?.balance || 0,
            isDebitNormal,
        };
        onSave(finalAccount);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in p-4">
            <div className="glass-effect !bg-white/95 dark:!bg-slate-900/95 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                                    <PencilIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    {accountToEdit ? 'Edit Account' : 'Add New Account'}
                                </h3>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Account Name</label>
                            <input
                                type="text"
                                value={account.name}
                                onChange={e => setAccount({ ...account, name: e.target.value })}
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                placeholder="e.g., Cash, Accounts Receivable"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Account Number</label>
                                <input
                                    type="text"
                                    value={account.number}
                                    onChange={e => setAccount({ ...account, number: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="e.g., 1000, 2000"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Account Type</label>
                                <select
                                    value={account.type}
                                    onChange={e => setAccount({ ...account, type: e.target.value as AccountType })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium appearance-none text-slate-900 dark:text-slate-100"
                                >
                                    <option value="asset" className="dark:bg-slate-900">Asset</option>
                                    <option value="liability" className="dark:bg-slate-900">Liability</option>
                                    <option value="equity" className="dark:bg-slate-900">Equity</option>
                                    <option value="revenue" className="dark:bg-slate-900">Revenue</option>
                                    <option value="expense" className="dark:bg-slate-900">Expense</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Description</label>
                            <textarea
                                value={account.description}
                                onChange={e => setAccount({ ...account, description: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none"
                                placeholder="Purpose of this account"
                            />
                        </div>

                        {accountToEdit?.subType && (
                            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                                <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <p className="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300">
                                    System Account: This account is used for automatic bookkeeping. Some core properties are protected.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                        >
                            Save Account
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default AccountFormModal;
