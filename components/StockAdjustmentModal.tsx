import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import AdjustmentsIcon from './icons/AdjustmentsIcon';
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
    const isIncrease = newStock > product.stock;
    const isDecrease = newStock < product.stock;
    const isValid = reason && (reason !== 'Other' || customReason.trim()) &&
        !isNaN(newStock) &&
        (isStockCount ? newStock >= 0 : true);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <form
                onSubmit={handleSave}
                className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS-style drag handle for mobile */}
                <div className="sm:hidden pt-3 pb-1 flex justify-center">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="sticky top-0 bg-white px-4 pt-4 pb-3 sm:px-6 border-b border-gray-200 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <AdjustmentsIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
                                    Adjust Stock
                                </h3>
                                <p className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-none">
                                    {product.name}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 -m-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Form content - scrollable */}
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-6">
                    {/* Current stock display */}
                    <div className="bg-gray-50 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Current Stock</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{product.stock}</p>
                                <p className="text-xs text-gray-500 mt-1">{product.unitOfMeasure}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-600">After Adjustment</p>
                                <p className={`text-3xl font-bold mt-1 ${isIncrease ? 'text-green-600' :
                                    isDecrease ? 'text-red-600' :
                                        'text-gray-900'
                                    }`}>
                                    {isNaN(newStock) ? '--' : newStock}
                                </p>
                                {!isNaN(newStock) && newStock !== product.stock && (
                                    <p className={`text-sm font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {isIncrease ? '+' : ''}{newStock - product.stock}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quantity input */}
                    <div>
                        <InputField
                            label={inputLabel}
                            type="number"
                            name="newQuantity"
                            id="newQuantity"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(e.target.value)}
                            min={isStockCount ? 0 : undefined}
                            step={product.unitOfMeasure === 'kg' ? '0.001' : '1'}
                            required
                            placeholder={isStockCount ? "Enter count" : "Enter amount"}
                            rightElement={<span className="text-gray-500">{product.unitOfMeasure}</span>}
                            helperText={`${helper}${!isStockCount ? ' Use negative numbers to subtract.' : ''}`}
                        />
                    </div>

                    {/* Reason selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Reason for Adjustment
                        </label>

                        {/* Quick reason chips */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                            {adjustmentReasons.map(({ value, icon, color }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setReason(value)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${reason === value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-lg">{icon}</span>
                                    <span className="text-sm font-medium text-gray-700 truncate">{value}</span>
                                </button>
                            ))}
                        </div>

                        {/* Custom reason input */}
                        {showCustomReason && (
                            <div className="mt-4">
                                <InputField
                                    label="Specify Reason"
                                    id="customReason"
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder="Enter reason for adjustment..."
                                    required={reason === 'Other'}
                                />
                            </div>
                        )}

                        {/* Selected reason display */}
                        {reason && !showCustomReason && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                            {adjustmentReasons.find(r => r.value === reason)?.icon}
                                        </span>
                                        <span className="font-medium text-gray-900">{reason}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReason('')}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed action buttons */}
                <div className="sticky bottom-0 bg-white px-4 py-4 sm:px-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!isValid}
                        >
                            Update Stock
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default StockAdjustmentModal;