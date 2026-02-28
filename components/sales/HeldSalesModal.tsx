import React from 'react';
import { CartItem, StoreSettings } from '@/types';
import XMarkIcon from '../icons/XMarkIcon';
import ClockIcon from '../icons/ClockIcon';
import { formatCurrency } from '@/utils/currency';

interface HeldSalesModalProps {
    isOpen: boolean;
    onClose: () => void;
    heldSales: CartItem[][];
    onRecallSale: (index: number) => void;
    storeSettings: StoreSettings;
}

const HeldSalesModal: React.FC<HeldSalesModalProps> = ({
    isOpen,
    onClose,
    heldSales,
    onRecallSale,
    storeSettings
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center animate-fade-in sm:p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="liquid-glass-card rounded-[2rem] w-full max-w-md overflow-hidden flex flex-col animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            <ClockIcon className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        Held Sales
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all duration-300 active:scale-95"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[60vh] overflow-y-auto bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl custom-scrollbar">
                    {heldSales.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/5 flex items-center justify-center mx-auto mb-4 shadow-sm rotate-3">
                                <ClockIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-[15px] font-bold text-slate-700 dark:text-slate-300">No held sales</p>
                            <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500 mt-2">Held transactions will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {heldSales.map((heldCart, index) => {
                                const total = heldCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                                const itemCount = heldCart.reduce((sum, item) => sum + item.quantity, 0);

                                return (
                                    <div key={index} className="bg-white dark:bg-slate-800/80 rounded-[20px] p-4 border border-slate-200/60 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all duration-300 group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-bold flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                                <span className="text-[15px] font-bold text-slate-900 dark:text-white">
                                                    Held Sale #{index + 1}
                                                </span>
                                            </div>
                                            <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                                                {formatCurrency(total, storeSettings)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                                                <span className="text-slate-700 dark:text-slate-300 font-semibold">{itemCount}</span> items • <span className="text-slate-500 dark:text-slate-400">{heldCart.length}</span> products
                                            </div>
                                            <button
                                                onClick={() => {
                                                    onRecallSale(index);
                                                    onClose();
                                                }}
                                                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-95 transition-all duration-300 border border-indigo-100 dark:border-indigo-500/20"
                                            >
                                                Recall
                                            </button>
                                        </div>

                                        {/* Preview of first few items */}
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                            {heldCart.slice(0, 3).map((item, i) => (
                                                <span key={i} className="text-[11px] font-medium px-2 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg whitespace-nowrap border border-slate-200 dark:border-white/5">
                                                    {item.quantity}x {item.name}
                                                </span>
                                            ))}
                                            {heldCart.length > 3 && (
                                                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1">+{heldCart.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeldSalesModal;
