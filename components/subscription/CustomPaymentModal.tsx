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
}

const CustomPaymentModal: React.FC<CustomPaymentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    planName,
    amount,
    currency,
    loading
}) => {
    const [method, setMethod] = useState<'card' | 'mobile-money'>('mobile-money');
    const [phoneNumber, setPhoneNumber] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({ method, phoneNumber: method === 'mobile-money' ? phoneNumber : undefined });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-slate-100">
                {/* Header */}
                <div className="relative p-6 border-b border-slate-50 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <ShieldCheckIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 leading-tight">Secure Payment</h3>
                            <p className="text-sm text-slate-500 font-medium">{planName} Plan • {currency} {amount}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 block">Choose Payment Method</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMethod('mobile-money')}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 gap-2 ${method === 'mobile-money'
                                        ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <DevicePhoneMobileIcon className={`w-8 h-8 ${method === 'mobile-money' ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className="text-xs font-bold uppercase tracking-wider">Mobile Money</span>
                            </button>
                            <button
                                onClick={() => setMethod('card')}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 gap-2 ${method === 'card'
                                        ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <CreditCardIcon className={`w-8 h-8 ${method === 'card' ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className="text-xs font-bold uppercase tracking-wider">Card</span>
                            </button>
                        </div>
                    </div>

                    {method === 'mobile-money' && (
                        <div className="animate-fade-in">
                            <label className="text-sm font-bold text-slate-700 mb-2 block">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-slate-400 text-sm font-bold">+260</span>
                                </div>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="970000000"
                                    className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:ring-0 text-sm font-semibold text-slate-900 transition-all outline-none"
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-400 leading-relaxed font-medium">
                                A payment prompt will be sent to this number. Please ensure it is active.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || (method === 'mobile-money' && !phoneNumber)}
                        className="w-full py-4 rounded-xl text-sm font-bold shadow-lg shadow-blue-200"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            `Pay ${currency} ${amount}`
                        )}
                    </Button>
                    <p className="mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        SSL Encrypted Secure Payment
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CustomPaymentModal;
