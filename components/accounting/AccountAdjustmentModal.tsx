import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Account } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import ScaleIcon from '../icons/Scale';
import InformationCircleIcon from '../icons/InformationCircleIcon';

interface AccountAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (adjustmentAmount: number, offsetAccountId: string, offsetAccountName: string, description: string) => void;
    account: Account;
    accounts: Account[];
}

const AccountAdjustmentModal: React.FC<AccountAdjustmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    account,
    accounts
}) => {
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [offsetAccountId, setOffsetAccountId] = useState('');
    const [description, setDescription] = useState('');

    // Filter out the account being adjusted from offset account options
    const availableOffsetAccounts = accounts.filter(a => a.id !== account.id);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!offsetAccountId) {
            alert('Please select an offset account');
            return;
        }

        const offsetAccount = accounts.find(a => a.id === offsetAccountId);
        if (!offsetAccount) {
            alert('Invalid offset account');
            return;
        }

        const amount = parseFloat(adjustmentAmount);
        if (isNaN(amount) || amount === 0) {
            alert('Please enter a valid non-zero adjustment amount');
            return;
        }

        onSave(amount, offsetAccountId, offsetAccount.name, description);

        // Reset form
        setAdjustmentAmount('');
        setOffsetAccountId('');
        setDescription('');
        onClose();
    };

    const newBalance = Number(account.balance) + parseFloat(adjustmentAmount || '0');

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                                    <ScaleIcon className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    Adjust Account Balance
                                </h3>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <XMarkIcon className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        {/* Account Info */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Adjusting Account</div>
                            <div className="text-lg font-black text-slate-900">{account.name}</div>
                            <div className="text-sm text-slate-600 mt-1">
                                Current Balance: <span className="font-bold">${Number(account.balance).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Adjustment Amount */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">
                                Adjustment Amount
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={adjustmentAmount}
                                onChange={e => setAdjustmentAmount(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-sm font-medium"
                                placeholder="Enter positive or negative amount"
                            />
                            <p className="text-xs text-slate-500 px-1">
                                Positive to increase, negative to decrease
                            </p>
                        </div>

                        {/* New Balance Preview */}
                        {adjustmentAmount && (
                            <div className={`p-3 rounded-xl border ${parseFloat(adjustmentAmount) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: parseFloat(adjustmentAmount) >= 0 ? '#059669' : '#DC2626' }}>
                                    New Balance
                                </div>
                                <div className="text-xl font-black" style={{ color: parseFloat(adjustmentAmount) >= 0 ? '#059669' : '#DC2626' }}>
                                    ${newBalance.toFixed(2)}
                                </div>
                            </div>
                        )}

                        {/* Offset Account */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">
                                Offset Account
                            </label>
                            <select
                                value={offsetAccountId}
                                onChange={e => setOffsetAccountId(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-sm font-medium appearance-none"
                            >
                                <option value="">Select offsetting account...</option>
                                {availableOffsetAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">
                                Reason for Adjustment
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-sm font-medium resize-none"
                                placeholder="e.g., Initial owner investment, correction of error, etc."
                            />
                        </div>

                        {/* Info Box */}
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                            <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] sm:text-xs font-medium text-blue-700">
                                This will create a journal entry to adjust the account balance while maintaining double-entry bookkeeping.
                                The adjustment will be recorded with a full audit trail.
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
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                        >
                            Apply Adjustment
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default AccountAdjustmentModal;
