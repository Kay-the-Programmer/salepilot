import React from 'react';
import { Product, PurchaseOrder } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import PlusIcon from './icons/PlusIcon';
import { Button } from './ui/Button';

interface LinkToPOModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    purchaseOrders: PurchaseOrder[];
    onLink: (po: PurchaseOrder) => void;
    onCreateNew: () => void;
    onSkip: () => void;
}

const LinkToPOModal: React.FC<LinkToPOModalProps> = ({
    isOpen,
    onClose,
    product,
    purchaseOrders,
    onLink,
    onCreateNew,
    onSkip
}) => {
    if (!isOpen) return null;

    // Filter POs that contain this product and are in a state to receive items
    const relevantPOs = purchaseOrders.filter(po =>
        (po.status === 'ordered' || po.status === 'partially_received') &&
        po.items.some(item => item.productId === product.id)
    );

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div
                glass-effect=""
                className="w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-md dark:bg-slate-900/80 dark:border-slate-700/50"
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS-style drag handle for mobile */}
                <div className="sm:hidden pt-2 pb-0 flex justify-center">
                    <div className="w-10 h-1 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
                </div>

                {/* Header - Minimal */}
                <div className="px-6 pt-5 pb-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100" id="modal-title">
                                Link to Purchase Order
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                Link <strong>{product.name}</strong> to an active order.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-full transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                    {relevantPOs.length > 0 ? (
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                Active Orders for this Item
                            </h4>
                            <div className="space-y-2">
                                {relevantPOs.map(po => {
                                    const item = po.items.find(i => i.productId === product.id);
                                    if (!item) return null;
                                    const remaining = item.quantity - item.receivedQuantity;

                                    return (
                                        <button
                                            key={po.id}
                                            onClick={() => onLink(po)}
                                            className="w-full text-left p-4 bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {po.poNumber}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
                                                        {po.supplierName}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${po.status === 'ordered'
                                                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                                    : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                                                    }`}>
                                                    {po.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between text-xs">
                                                <div className="flex gap-4">
                                                    <span className="text-gray-500 dark:text-slate-400">
                                                        Total: <span className="font-medium text-gray-700 dark:text-slate-300">{item.quantity}</span>
                                                    </span>
                                                    <span className="text-gray-500 dark:text-slate-400">
                                                        Got: <span className="font-medium text-gray-700 dark:text-slate-300">{item.receivedQuantity}</span>
                                                    </span>
                                                </div>
                                                <span className={`font-bold ${remaining > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    Need: {remaining}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 px-4 text-center">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <XMarkIcon className="w-6 h-6 text-gray-300 dark:text-slate-700" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                No active orders found for this specifically product.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={onCreateNew}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl text-gray-400 dark:text-slate-500 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-sm font-medium"
                    >
                        <PlusIcon className="w-5 h-5" />
                        New Purchase Order
                    </button>
                </div>

                {/* Footer - Minimal integrated */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 dark:bg-slate-800/50"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={onSkip}
                        className="flex-1"
                    >
                        Quick Adjust
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LinkToPOModal;
