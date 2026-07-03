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
    { value: "Receiving Stock", icon: "📦" },
    { value: "Stock Count", icon: "📊" },
    { value: "Damaged Goods", icon: "⚠️" },
    { value: "Theft", icon: "🚫" },
    { value: "Return", icon: "↩️" },
    { value: "Personal Use", icon: "👤" },
    { value: "Other", icon: "📝" },
];

/**
 * Quantity rules (Velocity):
 *  - `unit` products adjust in whole numbers only.
 *  - `kg` products adjust with strictly two decimal places.
 * "Stock Count" sets stock to the absolute value entered; every other reason
 * applies a signed delta — mirroring the backend, which clamps the resulting
 * stock at 0. The preview below the input shows exactly what will be saved.
 */
const roundQty = (value: number, isKg: boolean): number =>
    isKg ? Math.round(value * 100) / 100 : Math.round(value);

const fmtQty = (value: number, isKg: boolean): string =>
    isKg ? value.toFixed(2) : String(Math.round(value));

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ isOpen, onClose, onSave, product, initialReason }) => {
    const [quantityInput, setQuantityInput] = useState('');
    const [reason, setReason] = useState<string>('');
    const [customReason, setCustomReason] = useState('');

    const isKg = product?.unitOfMeasure === 'kg';
    const unitLabel = isKg ? 'kg' : 'units';
    const isStockCount = reason === 'Stock Count';

    // Precision guards: integers for unit products, two decimals for kg.
    // Delta reasons additionally allow a leading minus to remove stock.
    const inputRe = (allowNegative: boolean) => isKg
        ? (allowNegative ? /^-?\d*(\.\d{0,2})?$/ : /^\d*(\.\d{0,2})?$/)
        : (allowNegative ? /^-?\d*$/ : /^\d*$/);

    useEffect(() => {
        if (product && isOpen) {
            const initReason = initialReason && adjustmentReasons.some(r => r.value === initialReason) ? initialReason : '';
            setReason(initReason);
            setQuantityInput(initReason === 'Stock Count' ? fmtQty(Number(product.stock) || 0, product.unitOfMeasure === 'kg') : '');
            setCustomReason('');
        }
    }, [product, isOpen, initialReason]);

    if (!isOpen || !product) return null;

    const currentStock = roundQty(Number(product.stock) || 0, isKg);

    const handleReasonSelect = (value: string) => {
        setReason(value);
        // Sensible default per mode: the current count for an absolute set,
        // a blank slate for a delta entry.
        setQuantityInput(value === 'Stock Count' ? fmtQty(currentStock, isKg) : '');
        if (value !== 'Other') setCustomReason('');
    };

    const handleQuantityChange = (value: string) => {
        if (!inputRe(!isStockCount).test(value)) return;
        setQuantityInput(value);
    };

    const parsed = parseFloat(quantityInput);
    const hasQuantity = quantityInput !== '' && quantityInput !== '-' && quantityInput !== '.' && quantityInput !== '-.' && !isNaN(parsed);
    const quantity = hasQuantity ? roundQty(parsed, isKg) : NaN;

    // Preview mirrors the backend exactly: absolute set for Stock Count,
    // 0-clamped delta for everything else.
    const newStock = !hasQuantity ? currentStock
        : isStockCount ? quantity
            : Math.max(0, roundQty(currentStock + quantity, isKg));
    const effectiveDelta = roundQty(newStock - currentStock, isKg);
    const wouldClamp = !isStockCount && hasQuantity && roundQty(currentStock + quantity, isKg) < 0;

    const finalReason = reason === 'Other' && customReason.trim() ? customReason.trim() : reason;
    const isValid = !!reason
        && (reason !== 'Other' || !!customReason.trim())
        && hasQuantity
        && (isStockCount ? quantity >= 0 : quantity !== 0);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        onSave(product.id, quantity, finalReason);
        onClose();
    };

    const inputLabel = isStockCount ? 'New Stock Count' : 'Adjustment Amount';
    const helper = isStockCount
        ? `Enter the actual counted stock${isKg ? ' in kilograms (two decimals)' : ' in whole units'}. Stock will be set to this exact number.`
        : `Positive numbers add stock, negative numbers remove stock${isKg ? ' (kilograms, two decimals)' : ' (whole units)'}.`;

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <form
                onSubmit={handleSave}
                className="w-full bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl border border-brand-border max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle for mobile */}
                <div className="sm:hidden pt-2 pb-0 flex justify-center">
                    <div className="w-10 h-1 bg-surface-variant rounded-full"></div>
                </div>

                {/* Header */}
                <div className="px-6 pt-5 pb-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-brand-text" id="modal-title">
                                Adjust Stock
                            </h3>
                            <p className="text-sm text-brand-text-muted mt-0.5 line-clamp-1">
                                {product.name}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 -mr-1.5 text-brand-text-muted hover:text-brand-text rounded-full transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                    {/* Reasons first — the mode decides what the number means */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-brand-text">Reason</p>
                        <div className="flex flex-wrap gap-2">
                            {adjustmentReasons.map(({ value, icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleReasonSelect(value)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${reason === value
                                        ? 'bg-sp-navy border-sp-navy text-white shadow-sm'
                                        : 'bg-surface border-brand-border text-brand-text-muted hover:border-sp-navy/40 hover:text-brand-text'
                                        }`}
                                >
                                    <span className="mr-1.5">{icon}</span>
                                    {value}
                                </button>
                            ))}
                        </div>

                        {reason === 'Other' && (
                            <div className="pt-2 animate-fade-in">
                                <InputField
                                    placeholder="Type reason..."
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    required
                                    className="!mb-0"
                                />
                            </div>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <label className="font-medium text-brand-text">
                                {inputLabel}
                            </label>
                            <span className="text-brand-text-muted">
                                Current: <span className="font-bold text-brand-text tnum">{fmtQty(currentStock, isKg)} {unitLabel}</span>
                            </span>
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                inputMode={isKg ? 'decimal' : 'numeric'}
                                value={quantityInput}
                                onChange={(e) => handleQuantityChange(e.target.value)}
                                className="w-full text-3xl font-bold px-0 py-2 bg-transparent border-b-2 border-brand-border focus:outline-none focus:border-sp-orange transition-colors text-brand-text placeholder-brand-text-muted/40 tnum"
                                placeholder={isKg ? '0.00' : '0'}
                                autoFocus
                            />
                            <div className="absolute right-0 bottom-3 text-lg font-medium text-brand-text-muted pointer-events-none">
                                {unitLabel}
                            </div>
                        </div>
                        <p className="text-xs text-brand-text-muted italic">
                            {helper}
                        </p>
                    </div>

                    {/* Result preview — exactly what will be saved */}
                    <div className="bg-surface-variant/60 border border-brand-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-brand-text-muted mb-1">New stock level</span>
                                <span className="text-2xl font-bold text-brand-text tnum">{fmtQty(newStock, isKg)} <span className="text-sm font-medium text-brand-text-muted">{unitLabel}</span></span>
                            </div>
                            {hasQuantity && effectiveDelta !== 0 && (
                                <span className={`inline-flex px-2.5 py-1 rounded-xl text-[11px] font-bold tracking-wider tnum ${effectiveDelta > 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                                    {effectiveDelta > 0 ? '+' : '−'}{fmtQty(Math.abs(effectiveDelta), isKg)} {unitLabel}
                                </span>
                            )}
                        </div>
                        {wouldClamp && (
                            <p className="mt-2 text-xs font-medium text-danger">
                                Removing more than the current stock — the level will stop at 0 ({fmtQty(currentStock, isKg)} {unitLabel} removed).
                            </p>
                        )}
                        {!isStockCount && hasQuantity && quantity === 0 && (
                            <p className="mt-2 text-xs font-medium text-brand-text-muted">
                                An adjustment of 0 changes nothing — enter a positive or negative amount.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-brand-border flex items-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
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
