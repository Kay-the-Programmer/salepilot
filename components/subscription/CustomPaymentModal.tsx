import React, { useState } from 'react';
import { Button } from '../ui/Button';
import CreditCardIcon from '../icons/CreditCardIcon';
import DevicePhoneMobileIcon from '../icons/DevicePhoneMobileIcon';
import XMarkIcon from '../icons/XMarkIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';

interface CustomPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { method: 'card' | 'mobile-money', phoneNumber?: string }) => void;
    planName: string;
    amount: number;
    currency: string;
    loading: boolean;
    onCancelTransaction?: () => void;
}

const CustomPaymentModal: React.FC<CustomPaymentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    planName,
    amount,
    currency,
    loading,
    onCancelTransaction
}) => {
    const [method, setMethod] = useState<'card' | 'mobile-money'>('mobile-money');
    const [phoneNumber, setPhoneNumber] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({ method, phoneNumber: method === 'mobile-money' ? phoneNumber : undefined });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 dark:border-slate-800 glass-effect" glass-effect="true">
                {/* Header */}
                <div className="relative p-7 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-white/5">
                    <button
                        onClick={onClose}
                        className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 dark:bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none">
                            <ShieldCheckIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Secure Payment</h3>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                                {planName} Plan • <span className="text-indigo-600 dark:text-indigo-400">{currency} {amount}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-7 space-y-8">
                    <div>
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 block">Select Payment Method</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMethod('mobile-money')}
                                className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 gap-3 group ${method === 'mobile-money'
                                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className={`p-3 rounded-xl transition-colors ${method === 'mobile-money' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600'}`}>
                                    <DevicePhoneMobileIcon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Mobile Money</span>
                            </button>
                            <button
                                onClick={() => setMethod('card')}
                                className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 gap-3 group ${method === 'card'
                                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className={`p-3 rounded-xl transition-colors ${method === 'card' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600'}`}>
                                    <CreditCardIcon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Credit Card</span>
                            </button>
                        </div>
                    </div>

                    {method === 'mobile-money' && (
                        <div className="animate-fade-in space-y-4">
                            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Phone Number</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <span className="text-slate-400 dark:text-slate-500 text-sm font-black">+260</span>
                                </div>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="970000000"
                                    className="w-full pl-16 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-0 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none"
                                />
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
                                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">i</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                                    A secure payment prompt will be sent to your device. Please keep it nearby for confirmation.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-7 bg-slate-50/50 dark:bg-white/5 border-t border-slate-50 dark:border-slate-800/50">
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || (method === 'mobile-money' && !phoneNumber)}
                        className="w-full py-4.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 dark:shadow-none bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white transition-all transform hover:-translate-y-0.5"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Verifying...</span>
                            </div>
                        ) : (
                            `Complete Purchase`
                        )}
                    </Button>

                    {loading && onCancelTransaction && (
                        <button
                            onClick={onCancelTransaction}
                            className="w-full mt-4 py-2 text-center text-xs font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest"
                        >
                            Abrupt Transaction
                        </button>
                    )}

                    <div className="mt-6 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-full border border-emerald-100 dark:border-emerald-900/20">
                            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">256-bit SSL Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-4 opacity-40 grayscale contrast-125 dark:invert">
                            {/* Simple placeholders for payment provider logos if needed, or just text */}
                            <span className="text-[10px] font-black text-slate-400 tracking-tighter italic">LENCO</span>
                            <span className="text-[10px] font-black text-slate-400 tracking-tighter italic">VISA</span>
                            <span className="text-[10px] font-black text-slate-400 tracking-tighter italic">MASTERCARD</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomPaymentModal;
