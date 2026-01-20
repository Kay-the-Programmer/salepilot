import React from 'react';
import { FiArrowRight, FiMaximize } from 'react-icons/fi';

import ShoppingCartIcon from '../icons/ShoppingCartIcon';

interface ScanActionModalProps {
    isOpen: boolean;
    onContinue: () => void;
    onProceed: () => void;
    productName: string;
}

const ScanActionModal: React.FC<ScanActionModalProps> = ({
    isOpen,
    onContinue,
    onProceed,
    productName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingCartIcon className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">Added to Cart!</h3>
                    <p className="text-slate-600 mb-6 px-4">
                        <span className="font-semibold text-slate-800">"{productName}"</span> has been added to your cart.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onProceed}
                            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                        >
                            <span>Proceed to Payment</span>
                            <FiArrowRight className="w-5 h-5" />
                        </button>

                        <button
                            onClick={onContinue}
                            className="w-full py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <FiMaximize className="w-5 h-5" />
                            <span>Scan Next Item</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanActionModal;
