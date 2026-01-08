import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sale, Payment, StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import CalendarIcon from '../icons/CalendarIcon';
import BanknotesIcon from '../icons/BanknotesIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import { formatCurrency } from '../../utils/currency';
import { InputField } from '../ui/InputField';

interface RecordOrderPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Sale;
    onSave: (order: Sale, payment: Omit<Payment, 'id'>) => void;
    storeSettings: StoreSettings;
    showSnackbar: (message: string, type: 'success' | 'error' | 'info' | 'sync') => void;
}

const RecordOrderPaymentModal: React.FC<RecordOrderPaymentModalProps> = ({ isOpen, onClose, order, onSave, storeSettings, showSnackbar }) => {
    const balanceDue = Number(order.total) - Number(order.amountPaid || 0);
    const [amount, setAmount] = useState(balanceDue.toFixed(2));
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('');
    const [reference, setReference] = useState('');

    useEffect(() => {
        if (isOpen) {
            const remaining = Number(order.total) - Number(order.amountPaid || 0);
            setAmount(remaining.toFixed(2));
            setDate(new Date().toISOString().split('T')[0]);
            setMethod(storeSettings.paymentMethods?.[0]?.name || 'Card');
            setReference('');
        }
    }, [order, isOpen, storeSettings.paymentMethods]);

    if (!isOpen) return null;

    const isInvalid = isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || parseFloat(amount) > balanceDue + 0.01;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isInvalid) {
            showSnackbar("Invalid payment amount.", "error");
            return;
        }
        const paymentAmount = parseFloat(amount);
        onSave(order, { date, amount: paymentAmount, method, reference });
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            <div className="relative bg-white w-full sm:max-w-lg max-h-[96vh] sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up bg-gradient-to-b from-white to-slate-50/50">
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-6 sm:px-8 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Record Payment
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Order #{order.transactionId.slice(-6)}
                                </p>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <p className="text-sm font-bold text-emerald-600">
                                    {formatCurrency(balanceDue, storeSettings)} due
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-slate-100 shadow-sm"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                                label="Payment Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                max={balanceDue.toFixed(2)}
                                step="0.01"
                                required
                                icon={<CurrencyDollarIcon className="w-4 h-4" />}
                                className="!font-black text-slate-900 border-slate-200 rounded-2xl bg-white focus:ring-blue-500/20 shadow-sm"
                            />
                            <InputField
                                label="Payment Date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                icon={<CalendarIcon className="w-4 h-4" />}
                                className="!font-black text-slate-900 border-slate-200 rounded-2xl bg-white focus:ring-blue-500/20 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                            <div className="relative">
                                <BanknotesIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={method}
                                    onChange={e => setMethod(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-900 font-bold shadow-sm"
                                >
                                    {(storeSettings.paymentMethods || []).map(pm => (
                                        <option key={pm.id} value={pm.name}>{pm.name}</option>
                                    ))}
                                    {(storeSettings.paymentMethods || []).length === 0 && <option value="Card">Card</option>}
                                    {(storeSettings.paymentMethods || []).length === 0 && <option value="Cash">Cash</option>}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <InputField
                            label="Reference / Receipt #"
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Optional reference details"
                            icon={<ClipboardDocumentListIcon className="w-4 h-4" />}
                            className="!font-black text-slate-900 border-slate-200 rounded-2xl bg-white focus:ring-blue-500/20 shadow-sm"
                        />
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-6 sm:px-8 border-t border-slate-100 bg-white sm:flex sm:flex-row-reverse gap-4">
                        <button
                            type="submit"
                            disabled={isInvalid}
                            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-bold text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/10 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <CurrencyDollarIcon className="w-5 h-5" />
                            Record Payment
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto mt-3 sm:mt-0 px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-[1.5rem] font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center"
                        >
                            Discard
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default RecordOrderPaymentModal;
