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
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center animate-fade-in p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="liquid-glass-card rounded-[2rem] w-full max-w-md overflow-hidden flex flex-col animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-amber-600" />
                        Held Sales
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors active:scale-95 transition-all duration-300"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto bg-slate-50/50">
                    {heldSales.length === 0 ? (
                        <div className="text-center py-8">
                            <ClockIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-600 font-medium">No held sales</p>
                            <p className="text-xs text-slate-400 mt-1">Held transactions will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {heldSales.map((heldCart, index) => {
                                const total = heldCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                                const itemCount = heldCart.reduce((sum, item) => sum + item.quantity, 0);

                                return (
                                    <div key={index} className="liquid-glass-card rounded-[2rem] p-3 border border-slate-200 hover:border-blue-300 transition-colors group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm font-medium text-slate-700">
                                                    Held Sale #{index + 1}
                                                </span>
                                            </div>
                                            <span className="text-base font-bold text-slate-900">
                                                {formatCurrency(total, storeSettings)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-slate-500">
                                                <span className="font-medium text-slate-700">{itemCount}</span> items • <span className="text-slate-500">{heldCart.length}</span> products
                                            </div>
                                            <button
                                                onClick={() => {
                                                    onRecallSale(index);
                                                    onClose();
                                                }}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors active:scale-95 transition-all duration-300"
                                            >
                                                Recall
                                            </button>
                                        </div>

                                        {/* Preview of first few items */}
                                        <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-2 overflow-x-auto pb-1">
                                            {heldCart.slice(0, 3).map((item, i) => (
                                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded whitespace-nowrap">
                                                    {item.quantity}x {item.name}
                                                </span>
                                            ))}
                                            {heldCart.length > 3 && (
                                                <span className="text-[10px] text-slate-400">+{heldCart.length - 3} more</span>
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
