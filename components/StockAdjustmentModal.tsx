import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { InputField } from './ui/InputField';
import { Button } from './ui/Button';

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productId: string, newQuantity: number, reason: string) => void;
    product: Product | null;
    initialReason?: string;
}

/**
 * Each reason knows which way it moves stock, so the operator never has to think
 * about signs:
 *   in    → adds to stock (goods arriving / coming back)
 *   out   → removes from stock (write-offs, withdrawals)
 *   set   → sets the absolute level (physical count)
 *   either→ direction is genuinely unknown; the operator picks Add or Remove
 */
type Direction = 'in' | 'out' | 'set' | 'either';
const adjustmentReasons: { value: string; icon: string; hint: string; direction: Direction }[] = [
    { value: 'Receiving Stock', icon: '📦', hint: 'New goods arrived — by units or whole cartons', direction: 'in' },
    { value: 'Return', icon: '↩️', hint: 'Items coming back into stock', direction: 'in' },
    { value: 'Stock Count', icon: '📊', hint: 'Set stock to the exact counted amount', direction: 'set' },
    { value: 'Damaged Goods', icon: '⚠️', hint: 'Write off broken or expired items', direction: 'out' },
    { value: 'Theft', icon: '🚫', hint: 'Write off stolen or missing items', direction: 'out' },
    { value: 'Personal Use', icon: '👤', hint: 'Taken by the owner — booked to drawings', direction: 'out' },
    { value: 'Other', icon: '📝', hint: 'Any other correction — you choose add or remove', direction: 'either' },
];

/**
 * Quantity rules (Velocity): whole numbers for `unit` products, strictly two
 * decimals for `kg`. The operator always types a positive amount; the reason's
 * direction decides whether it's added or removed (backend clamps at 0).
 * "Receiving Stock" can be entered per unit or per carton.
 */
const roundQty = (value: number, isKg: boolean): number =>
    isKg ? Math.round(value * 100) / 100 : Math.round(value);

const fmtQty = (value: number, isKg: boolean): string =>
    isKg ? value.toFixed(2) : String(Math.round(value));

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ isOpen, onClose, onSave, product, initialReason }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [reason, setReason] = useState<string>('');
    const [customReason, setCustomReason] = useState('');
    const [quantityInput, setQuantityInput] = useState('');
    // For "Other", the operator chooses the direction explicitly.
    const [otherDirection, setOtherDirection] = useState<'in' | 'out'>('out');
    // Carton entry (Receiving Stock only)
    const [entryMode, setEntryMode] = useState<'units' | 'cartons'>('units');
    const [cartonsInput, setCartonsInput] = useState('');
    const [unitsPerCartonInput, setUnitsPerCartonInput] = useState('');

    const isKg = product?.unitOfMeasure === 'kg';
    const unitLabel = isKg ? 'kg' : 'units';
    const selectedReason = adjustmentReasons.find(r => r.value === reason);
    const isStockCount = selectedReason?.direction === 'set';
    const isReceiving = reason === 'Receiving Stock';
    // Resolve the concrete movement direction for the chosen reason.
    const effectiveDir: 'in' | 'out' | 'set' = selectedReason?.direction === 'either'
        ? otherDirection
        : (selectedReason?.direction as 'in' | 'out' | 'set') || 'in';

    // Amounts are always positive now — the direction is derived from the reason.
    const inputRe = isKg ? /^\d*(\.\d{0,2})?$/ : /^\d*$/;
    const perCartonRe = isKg ? /^\d*(\.\d{0,2})?$/ : /^\d*$/;
    const cartonsRe = /^\d*$/;

    useEffect(() => {
        if (product && isOpen) {
            const initReason = initialReason && adjustmentReasons.some(r => r.value === initialReason) ? initialReason : '';
            const initDef = adjustmentReasons.find(r => r.value === initReason);
            setReason(initReason);
            setStep(initReason ? 2 : 1);
            setQuantityInput(initDef?.direction === 'set' ? fmtQty(Number(product.stock) || 0, product.unitOfMeasure === 'kg') : '');
            setCustomReason('');
            setOtherDirection('out');
            setEntryMode('units');
            setCartonsInput('');
            setUnitsPerCartonInput(product.unitsPerCarton ? String(product.unitsPerCarton) : '');
        }
    }, [product, isOpen, initialReason]);

    if (!isOpen || !product) return null;

    const currentStock = roundQty(Number(product.stock) || 0, isKg);

    const handleReasonSelect = (value: string) => {
        const def = adjustmentReasons.find(r => r.value === value);
        setReason(value);
        setQuantityInput(def?.direction === 'set' ? fmtQty(currentStock, isKg) : '');
        setOtherDirection('out');
        setEntryMode('units');
        if (value !== 'Other') setCustomReason('');
        setStep(2);
    };

    const handleQuantityChange = (value: string) => {
        if (!inputRe.test(value)) return;
        setQuantityInput(value);
    };

    // The positive magnitude the operator entered.
    const cartons = parseInt(cartonsInput, 10);
    const perCarton = parseFloat(unitsPerCartonInput);
    const usingCartons = isReceiving && entryMode === 'cartons';

    const parsedDirect = parseFloat(quantityInput);
    const hasDirect = quantityInput !== '' && quantityInput !== '.' && !isNaN(parsedDirect);
    const hasCartons = !isNaN(cartons) && cartons > 0 && !isNaN(perCarton) && perCarton > 0;

    const hasQuantity = usingCartons ? hasCartons : hasDirect;
    const magnitude = usingCartons
        ? (hasCartons ? roundQty(cartons * perCarton, isKg) : NaN)
        : (hasDirect ? roundQty(parsedDirect, isKg) : NaN);

    // Sign the magnitude by direction: absolute for Stock Count, +/- otherwise.
    const signedQuantity = isStockCount
        ? magnitude
        : (effectiveDir === 'out' ? -magnitude : magnitude);

    // Preview mirrors the backend exactly.
    const newStock = !hasQuantity ? currentStock
        : isStockCount ? magnitude
            : Math.max(0, roundQty(currentStock + signedQuantity, isKg));
    const effectiveDelta = roundQty(newStock - currentStock, isKg);
    const wouldClamp = !isStockCount && hasQuantity && effectiveDir === 'out' && roundQty(currentStock + signedQuantity, isKg) < 0;

    const finalReason = reason === 'Other' && customReason.trim() ? customReason.trim() : reason;
    const isValid = !!reason
        && (reason !== 'Other' || !!customReason.trim())
        && hasQuantity
        && (isStockCount ? magnitude >= 0 : magnitude > 0);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        onSave(product.id, signedQuantity, finalReason);
        onClose();
    };

    const amountLabel = isStockCount ? 'New stock count'
        : effectiveDir === 'in' ? (isReceiving ? 'Amount received' : 'Quantity to add')
            : 'Quantity to remove';

    const helper = isStockCount
        ? `Enter the actual counted stock${isKg ? ' in kilograms (two decimals)' : ' in whole units'}. Stock will be set to this exact number.`
        : effectiveDir === 'in'
            ? `This ${isReceiving ? 'adds the received goods to' : 'adds to'} your stock — just enter how much${isKg ? ' (kilograms, two decimals)' : ' (whole units)'}.`
            : `This removes from your stock — just enter how much${isKg ? ' (kilograms, two decimals)' : ' (whole units)'}. No minus sign needed.`;

    const segBtn = (active: boolean, tone: 'navy' | 'in' | 'out' = 'navy') =>
        `flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${active
            ? (tone === 'in' ? 'bg-success text-white shadow-sm' : tone === 'out' ? 'bg-danger text-white shadow-sm' : 'bg-sp-navy text-white shadow-sm')
            : 'text-brand-text-muted hover:text-brand-text'}`;

    // Small "adds / removes" tag shown on each reason card and in the header.
    const dirTag = (direction: Direction) => {
        if (direction === 'set') return <span className="text-[10px] font-bold uppercase tracking-wider text-sp-navy bg-sp-navy-soft px-1.5 py-0.5 rounded">Sets</span>;
        if (direction === 'in') return <span className="text-[10px] font-bold uppercase tracking-wider text-success bg-success/15 px-1.5 py-0.5 rounded">Adds</span>;
        if (direction === 'out') return <span className="text-[10px] font-bold uppercase tracking-wider text-danger bg-danger/15 px-1.5 py-0.5 rounded">Removes</span>;
        return <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted bg-surface-variant px-1.5 py-0.5 rounded">Add / Remove</span>;
    };

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
                <div className="px-6 pt-5 pb-4 border-b border-brand-border">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 min-w-0">
                            {step === 2 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="p-1.5 -ml-1.5 mt-0.5 text-brand-text-muted hover:text-brand-text rounded-full transition-colors flex-shrink-0"
                                    aria-label="Back to reason"
                                >
                                    <ArrowLeftIcon className="h-5 w-5" />
                                </button>
                            )}
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-brand-text" id="modal-title">
                                    {step === 1 ? 'Adjust Stock' : (selectedReason ? `${selectedReason.icon} ${selectedReason.value}` : 'Adjust Stock')}
                                </h3>
                                <p className="text-sm text-brand-text-muted mt-0.5 line-clamp-1">
                                    {product.name} · <span className="font-bold text-brand-text tnum">{fmtQty(currentStock, isKg)} {unitLabel}</span> in stock
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 -mr-1.5 text-brand-text-muted hover:text-brand-text rounded-full transition-colors flex-shrink-0"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    {/* Step dots */}
                    <div className="mt-3 flex items-center gap-1.5">
                        <span className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-6 bg-sp-navy' : 'w-1.5 bg-sp-navy/40'}`} />
                        <span className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-6 bg-sp-navy' : 'w-1.5 bg-surface-variant'}`} />
                        <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
                            {step === 1 ? 'Step 1 · Reason' : 'Step 2 · Amount'}
                        </span>
                    </div>
                </div>

                {/* ── Step 1: pick the reason ── */}
                {step === 1 && (
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
                        {adjustmentReasons.map(({ value, icon, hint, direction }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => handleReasonSelect(value)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left border transition-all active:scale-[0.99] ${reason === value
                                    ? 'border-2 border-sp-navy bg-sp-navy-soft/40'
                                    : 'border-brand-border bg-surface hover:border-sp-navy/40'}`}
                            >
                                <span className="text-xl flex-shrink-0">{icon}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-brand-text">{value}</span>
                                        {dirTag(direction)}
                                    </span>
                                    <span className="block text-xs text-brand-text-muted truncate">{hint}</span>
                                </span>
                                <svg className="w-4 h-4 text-brand-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Step 2: amount + preview ── */}
                {step === 2 && (
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                        {reason === 'Other' && (
                            <>
                                <InputField
                                    label="Reason"
                                    placeholder="Type reason..."
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    required
                                    className="!mb-0"
                                />
                                {/* Direction is unknown for a free-form reason — the operator chooses. */}
                                <div>
                                    <label className="block text-xs font-medium text-brand-text mb-1.5">Direction</label>
                                    <div className="flex bg-surface-variant border border-brand-border p-1 rounded-lg">
                                        <button type="button" className={segBtn(otherDirection === 'in', 'in')} onClick={() => setOtherDirection('in')}>
                                            Add to stock
                                        </button>
                                        <button type="button" className={segBtn(otherDirection === 'out', 'out')} onClick={() => setOtherDirection('out')}>
                                            Remove from stock
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Receiving: units vs cartons */}
                        {isReceiving && (
                            <div className="flex bg-surface-variant border border-brand-border p-1 rounded-lg">
                                <button type="button" className={segBtn(entryMode === 'units')} onClick={() => setEntryMode('units')}>
                                    By {unitLabel}
                                </button>
                                <button type="button" className={segBtn(entryMode === 'cartons')} onClick={() => setEntryMode('cartons')}>
                                    By carton
                                </button>
                            </div>
                        )}

                        {usingCartons ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-brand-text mb-1.5">Cartons received</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={cartonsInput}
                                            onChange={(e) => { if (cartonsRe.test(e.target.value)) setCartonsInput(e.target.value); }}
                                            className="w-full h-12 px-3 text-lg font-bold bg-surface border border-brand-border rounded-lg text-brand-text text-center focus:outline-none focus:ring-1 focus:ring-sp-orange focus:border-sp-orange transition-all tnum"
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-brand-text mb-1.5">{isKg ? 'Kg' : 'Units'} per carton</label>
                                        <input
                                            type="text"
                                            inputMode={isKg ? 'decimal' : 'numeric'}
                                            value={unitsPerCartonInput}
                                            onChange={(e) => { if (perCartonRe.test(e.target.value)) setUnitsPerCartonInput(e.target.value); }}
                                            className="w-full h-12 px-3 text-lg font-bold bg-surface border border-brand-border rounded-lg text-brand-text text-center focus:outline-none focus:ring-1 focus:ring-sp-orange focus:border-sp-orange transition-all tnum"
                                            placeholder={isKg ? '0.00' : '0'}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-brand-text-muted italic">
                                    {hasCartons
                                        ? <>Receiving <strong className="text-brand-text tnum">{cartons} carton{cartons === 1 ? '' : 's'} × {fmtQty(perCarton, isKg)} {unitLabel}</strong> = <strong className="text-brand-text tnum">{fmtQty(magnitude, isKg)} {unitLabel}</strong></>
                                        : `Enter how many cartons arrived and how ${isKg ? 'many kilograms' : 'many units'} each carton holds.`}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-brand-text">{amountLabel}</label>
                                    {/* Live direction indicator so the movement is unmistakable */}
                                    {!isStockCount && (
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${effectiveDir === 'in' ? 'text-success bg-success/15' : 'text-danger bg-danger/15'}`}>
                                            {effectiveDir === 'in' ? '↑ Adding' : '↓ Removing'}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <span className={`absolute left-0 bottom-3 text-2xl font-bold pointer-events-none ${isStockCount ? 'hidden' : effectiveDir === 'in' ? 'text-success' : 'text-danger'}`}>
                                        {effectiveDir === 'in' ? '+' : '−'}
                                    </span>
                                    <input
                                        type="text"
                                        inputMode={isKg ? 'decimal' : 'numeric'}
                                        value={quantityInput}
                                        onChange={(e) => handleQuantityChange(e.target.value)}
                                        className={`w-full text-3xl font-bold ${isStockCount ? 'px-0' : 'pl-7'} py-2 bg-transparent border-b-2 border-brand-border focus:outline-none focus:border-sp-orange transition-colors text-brand-text placeholder-brand-text-muted/40 tnum`}
                                        placeholder={isKg ? '0.00' : '0'}
                                        autoFocus
                                    />
                                    <div className="absolute right-0 bottom-3 text-lg font-medium text-brand-text-muted pointer-events-none">
                                        {unitLabel}
                                    </div>
                                </div>
                                <p className="text-xs text-brand-text-muted italic">{helper}</p>
                            </div>
                        )}

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
                                    You're removing more than the current stock — the level will stop at 0 (only {fmtQty(currentStock, isKg)} {unitLabel} on hand).
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-brand-border flex items-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={step === 2 && !initialReason ? () => setStep(1) : onClose}
                        className="flex-1"
                    >
                        {step === 2 && !initialReason ? 'Back' : 'Cancel'}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={step === 1 || !isValid}
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
