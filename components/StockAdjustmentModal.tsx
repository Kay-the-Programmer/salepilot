import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import { InputField } from './ui/InputField';
import { Button } from './ui/Button';

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productId: string, newQuantity: number, reason: string) => void;
    product: Product | null;
    initialReason?: string;
}

const adjustmentReasons = [
    { value: "Receiving Stock", icon: "📦", color: "bg-green-100 text-green-800" },
    { value: "Stock Count", icon: "📊", color: "bg-blue-100 text-blue-800" },
    { value: "Damaged Goods", icon: "⚠️", color: "bg-red-100 text-red-800" },
    { value: "Theft", icon: "🚫", color: "bg-red-50 text-red-700" },
    { value: "Return", icon: "↩️", color: "bg-orange-100 text-orange-800" },
    { value: "Personal Use", icon: "👤", color: "bg-purple-100 text-purple-800" },
    { value: "Other", icon: "📝", color: "bg-gray-100 text-gray-800" },
];

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ isOpen, onClose, onSave, product, initialReason }) => {
    const [newQuantity, setNewQuantity] = useState<number | string>('');
    const [reason, setReason] = useState<string>('');
    const [showCustomReason, setShowCustomReason] = useState(false);
    const [customReason, setCustomReason] = useState('');

    useEffect(() => {
        if (product) {
            const initReason = initialReason && adjustmentReasons.some(r => r.value === initialReason) ? initialReason : '';
            setReason(initReason);
            // Default input: if reason is Stock Count use product stock, else set 1 as sensible default
            setNewQuantity(initReason === 'Stock Count' ? product.stock : 1);
        }
        setCustomReason('');
        setShowCustomReason(false);
    }, [product, initialReason]);

    useEffect(() => {
        if (!product) return;
        // Update input default if user switches reason
        if (reason === 'Stock Count') {
            setNewQuantity(product.stock);
        } else if (newQuantity === '' || Number(newQuantity) === product.stock) {
            // If it currently matches the absolute count, switch to a sensible default for delta
            setNewQuantity(1);
        }

        // Show custom reason input when "Other" is selected
        setShowCustomReason(reason === 'Other');
        if (reason !== 'Other') {
            setCustomReason('');
        }
    }, [reason, product, newQuantity]);

    if (!isOpen || !product) return null;

    const isStockCount = reason === 'Stock Count';
    const finalReason = reason === 'Other' && customReason.trim() ? customReason.trim() : reason;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason || (reason === 'Other' && !customReason.trim())) return;

        const quantity = typeof newQuantity === 'string' ? parseFloat(newQuantity) : newQuantity;
        if (!isNaN(quantity as number) && (isStockCount ? (quantity as number) >= 0 : true)) {
            onSave(product.id, quantity as number, finalReason);
            onClose();
        }
    };

    const inputLabel = isStockCount ? 'New Stock Count' : 'Adjustment Amount';
    const helper = isStockCount
        ? 'Enter the actual counted stock. This will set stock to this exact number.'
        : 'Positive numbers add stock, negative numbers remove stock.';

    const calculateNewStock = () => {
        const quantity = typeof newQuantity === 'string' ? parseFloat(newQuantity) : newQuantity;
        if (isNaN(quantity)) return product.stock;

        if (isStockCount) {
            return quantity;
        } else {
            return product.stock + quantity;
        }
    };

    const newStock = calculateNewStock();
    const isValid = reason && (reason !== 'Other' || customReason.trim()) &&
        !isNaN(newStock) &&
        (isStockCount ? newStock >= 0 : true);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <form
                onSubmit={handleSave}
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
                                Adjust Stock
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {product.name}
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
                    {/* Quantity & Current Stock Integrated */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <label className="font-medium text-gray-700 dark:text-slate-300">
                                {inputLabel}
                            </label>
                            <span className="text-gray-500 dark:text-slate-500">
                                Current: <span className="font-bold text-gray-900 dark:text-slate-200">{product.stock} {product.unitOfMeasure}</span>
                            </span>
                        </div>

                        <div className="relative">
                            <input
                                type="number"
                                value={newQuantity}
                                onChange={(e) => setNewQuantity(e.target.value)}
                                className="w-full text-3xl font-bold px-0 py-2 bg-transparent border-b-2 border-gray-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-gray-900 dark:text-slate-100 placeholder-gray-300 dark:placeholder-slate-700"
                                placeholder="0"
                                autoFocus
                                step={product.unitOfMeasure === 'kg' ? '0.001' : '1'}
                            />
                            <div className="absolute right-0 bottom-3 text-lg font-medium text-gray-400 pointer-events-none">
                                {product.unitOfMeasure}
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                            {helper}{!isStockCount ? ' Use minus (-) to remove.' : ''}
                        </p>
                    </div>

                    {/* Reasons - Minimalist Row/Chip layout */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Reason</p>
                        <div className="flex flex-wrap gap-2">
                            {adjustmentReasons.map(({ value, icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setReason(value)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${reason === value
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    <span className="mr-1.5">{icon}</span>
                                    {value}
                                </button>
                            ))}
                        </div>

                        {showCustomReason && (
                            <div className="pt-2 animate-fade-in">
                                <InputField
                                    placeholder="Type reason..."
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    required={reason === 'Other'}
                                    className="!mb-0"
                                />
                            </div>
                        )}
                    </div>
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
                        type="submit"
                        variant="primary"
                        disabled={!isValid}
                        className="flex-1"
                    >
                        Confirm
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default StockAdjustmentModal;