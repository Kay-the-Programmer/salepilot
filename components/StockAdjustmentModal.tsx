import React, { useState, useEffect, useRef } from 'react';
import { Product, PurchaseOrder } from '../types';
import { InputField } from './ui/InputField';
import { Button } from './ui/Button';
import { XMarkIcon } from './icons';

/** How a reception is tied to purchasing — chosen inline, never in a second pop-up. */
export type ReceiveLink =
    | { kind: 'none' }
    | { kind: 'po'; po: PurchaseOrder }
    | { kind: 'new-po' };

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productId: string, newQuantity: number, reason: string, link?: ReceiveLink) => void;
    product: Product | null;
    initialReason?: string;
    /** Open purchase orders (ordered / partially received) that include this product. */
    openPurchaseOrders?: PurchaseOrder[];
    /** Supplier a "new PO record" would be raised against; omitted when none exists. */
    newPoSupplierName?: string;
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
const adjustmentReasons: { value: string; short: string; icon: string; direction: Direction }[] = [
    { value: 'Receiving Stock', short: 'Received', icon: '📦', direction: 'in' },
    { value: 'Damaged Goods', short: 'Damaged', icon: '⚠️', direction: 'out' },
    { value: 'Stock Count', short: 'Count', icon: '📊', direction: 'set' },
    { value: 'Return', short: 'Returned', icon: '↩️', direction: 'in' },
    { value: 'Theft', short: 'Theft', icon: '🚫', direction: 'out' },
    { value: 'Personal Use', short: 'Own use', icon: '👤', direction: 'out' },
    { value: 'Other', short: 'Other', icon: '📝', direction: 'either' },
];

const DEFAULT_REASON = 'Receiving Stock';

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

/**
 * Stock change sheet — one screen.
 *
 * Receiving is pre-selected, so a delivery is: open the sheet, type the
 * amount, Save. Any other reason is one chip tap away on the same screen.
 * When the product sits on an open purchase order the reception can be
 * booked against it right here, instead of in a follow-up pop-up.
 */
const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
    isOpen, onClose, onSave, product, initialReason, openPurchaseOrders = [], newPoSupplierName,
}) => {
    const [reason, setReason] = useState<string>(DEFAULT_REASON);
    const [customReason, setCustomReason] = useState('');
    const [quantityInput, setQuantityInput] = useState('');
    // For "Other", the operator chooses the direction explicitly.
    const [otherDirection, setOtherDirection] = useState<'in' | 'out'>('out');
    // Carton entry (Receiving Stock only)
    const [entryMode, setEntryMode] = useState<'units' | 'cartons'>('units');
    const [cartonsInput, setCartonsInput] = useState('');
    const [unitsPerCartonInput, setUnitsPerCartonInput] = useState('');
    // Purchase-order link for receptions: 'none', 'new', or a PO id.
    const [linkChoice, setLinkChoice] = useState<string>('none');
    const amountRef = useRef<HTMLInputElement>(null);

    const isKg = product?.unitOfMeasure === 'kg';
    const unitLabel = isKg ? 'kg' : 'units';
    const selectedReason = adjustmentReasons.find(r => r.value === reason);
    const isStockCount = selectedReason?.direction === 'set';
    const isReceiving = reason === 'Receiving Stock';
    // Resolve the concrete movement direction for the chosen reason.
    const effectiveDir: 'in' | 'out' | 'set' = selectedReason?.direction === 'either'
        ? otherDirection
        : (selectedReason?.direction as 'in' | 'out' | 'set') || 'in';

    const inputRe = isKg ? /^\d*(\.\d{0,2})?$/ : /^\d*$/;
    const cartonsRe = /^\d*$/;

    useEffect(() => {
        if (product && isOpen) {
            const initReason = initialReason && adjustmentReasons.some(r => r.value === initialReason)
                ? initialReason : DEFAULT_REASON;
            const initDef = adjustmentReasons.find(r => r.value === initReason);
            setReason(initReason);
            setQuantityInput(initDef?.direction === 'set' ? fmtQty(Number(product.stock) || 0, product.unitOfMeasure === 'kg') : '');
            setCustomReason('');
            setOtherDirection('out');
            setEntryMode('units');
            setCartonsInput('');
            setUnitsPerCartonInput(product.unitsPerCarton ? String(product.unitsPerCarton) : '');
            // One open PO for this product is almost certainly the delivery
            // that just arrived — pre-pick it; it is a single tap to undo.
            setLinkChoice(openPurchaseOrders.length === 1 ? openPurchaseOrders[0].id : 'none');
        }
        // openPurchaseOrders is derived per render; re-seed only on open/product change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        requestAnimationFrame(() => amountRef.current?.focus());
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

    // −/+ stepper: whole units, or 1 kg for weighed goods.
    const step = (delta: number) => {
        const base = hasDirect ? parsedDirect : 0;
        const next = Math.max(0, roundQty(base + delta, isKg));
        setQuantityInput(fmtQty(next, isKg));
    };

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

    const showLinkChoice = isReceiving && (openPurchaseOrders.length > 0 || !!newPoSupplierName);

    const resolveLink = (): ReceiveLink | undefined => {
        if (!isReceiving) return undefined;
        if (linkChoice === 'new') return { kind: 'new-po' };
        const po = openPurchaseOrders.find(p => p.id === linkChoice);
        return po ? { kind: 'po', po } : { kind: 'none' };
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        onSave(product.id, signedQuantity, finalReason, resolveLink());
        onClose();
    };

    const saveLabel = !hasQuantity ? 'Save'
        : isStockCount ? `Set to ${fmtQty(magnitude, isKg)} ${unitLabel}`
            : effectiveDir === 'in' ? `Add ${fmtQty(magnitude, isKg)} ${unitLabel}`
                : `Remove ${fmtQty(magnitude, isKg)} ${unitLabel}`;

    const segBtn = (active: boolean, tone: 'navy' | 'in' | 'out' = 'navy') =>
        `flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${active
            ? (tone === 'in' ? 'bg-success text-white shadow-sm' : tone === 'out' ? 'bg-danger text-white shadow-sm' : 'bg-sp-navy text-white shadow-sm')
            : 'text-brand-text-muted hover:text-brand-text'}`;

    const chip = (active: boolean) =>
        `inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold border transition-all active:scale-95 ${active
            ? 'bg-sp-navy border-sp-navy text-white'
            : 'bg-surface border-brand-border text-brand-text hover:border-sp-navy/40'}`;

    const inputCls = 'w-full h-12 px-3 text-lg font-bold bg-surface border border-brand-border rounded-lg text-brand-text text-center focus:outline-none focus:ring-1 focus:ring-sp-orange focus:border-sp-orange transition-all tnum';
    const stepBtn = 'w-14 h-14 flex-shrink-0 rounded-xl border border-brand-border bg-surface text-2xl font-bold text-brand-text hover:bg-surface-variant active:scale-95 transition-all';

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
            aria-labelledby="stock-sheet-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <form
                onSubmit={handleSave}
                className="w-full bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl border border-brand-border max-h-[92vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle for mobile */}
                <div className="sm:hidden pt-2 pb-0 flex justify-center">
                    <div className="w-10 h-1 bg-surface-variant rounded-full"></div>
                </div>

                {/* Header */}
                <div className="px-5 pt-4 pb-3 border-b border-brand-border flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-brand-text line-clamp-1" id="stock-sheet-title">{product.name}</h3>
                        <p className="text-sm text-brand-text-muted mt-0.5">
                            <span className="font-bold text-brand-text tnum">{fmtQty(currentStock, isKg)} {unitLabel}</span> in stock
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1.5 -mr-1.5 text-brand-text-muted hover:text-brand-text rounded-full transition-colors flex-shrink-0"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {/* Reason chips — Received is already picked */}
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reason">
                        {adjustmentReasons.map(({ value, short, icon }) => (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={reason === value}
                                onClick={() => handleReasonSelect(value)}
                                className={chip(reason === value)}
                            >
                                <span aria-hidden>{icon}</span>{short}
                            </button>
                        ))}
                    </div>

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
                            <div className="flex bg-surface-variant border border-brand-border p-1 rounded-lg">
                                <button type="button" className={segBtn(otherDirection === 'in', 'in')} onClick={() => setOtherDirection('in')}>
                                    Add to stock
                                </button>
                                <button type="button" className={segBtn(otherDirection === 'out', 'out')} onClick={() => setOtherDirection('out')}>
                                    Remove from stock
                                </button>
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
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-brand-text mb-1.5" htmlFor="stock-cartons">Cartons</label>
                                    <input
                                        id="stock-cartons"
                                        type="text"
                                        inputMode="numeric"
                                        value={cartonsInput}
                                        onChange={(e) => { if (cartonsRe.test(e.target.value)) setCartonsInput(e.target.value); }}
                                        className={inputCls}
                                        placeholder="0"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-brand-text mb-1.5" htmlFor="stock-per-carton">{isKg ? 'Kg' : 'Units'} per carton</label>
                                    <input
                                        id="stock-per-carton"
                                        type="text"
                                        inputMode={isKg ? 'decimal' : 'numeric'}
                                        value={unitsPerCartonInput}
                                        onChange={(e) => { if (inputRe.test(e.target.value)) setUnitsPerCartonInput(e.target.value); }}
                                        className={inputCls}
                                        placeholder={isKg ? '0.00' : '0'}
                                    />
                                </div>
                            </div>
                            {hasCartons && (
                                <p className="text-xs text-brand-text-muted tnum">
                                    {cartons} × {fmtQty(perCarton, isKg)} = <strong className="text-brand-text">{fmtQty(magnitude, isKg)} {unitLabel}</strong>
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button type="button" className={stepBtn} onClick={() => step(-1)} aria-label="Decrease amount">−</button>
                            <div className="relative flex-1">
                                <input
                                    ref={amountRef}
                                    id="stock-amount"
                                    type="text"
                                    inputMode={isKg ? 'decimal' : 'numeric'}
                                    value={quantityInput}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    aria-label={isStockCount ? 'Counted stock' : effectiveDir === 'in' ? 'Amount to add' : 'Amount to remove'}
                                    className="w-full h-14 px-3 text-3xl font-bold bg-surface border-2 border-brand-border rounded-xl text-brand-text text-center focus:outline-none focus:border-sp-orange transition-colors placeholder-brand-text-muted/40 tnum"
                                    placeholder={isKg ? '0.00' : '0'}
                                    autoFocus
                                />
                            </div>
                            <button type="button" className={stepBtn} onClick={() => step(1)} aria-label="Increase amount">+</button>
                        </div>
                    )}

                    {/* Purchase-order link — inline, only when there is something to link to */}
                    {showLinkChoice && (
                        <div>
                            <span className="block text-xs font-medium text-brand-text mb-1.5">Purchase order</span>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" className={chip(linkChoice === 'none')} onClick={() => setLinkChoice('none')}>
                                    None
                                </button>
                                {openPurchaseOrders.map(po => (
                                    <button key={po.id} type="button" className={chip(linkChoice === po.id)} onClick={() => setLinkChoice(po.id)}>
                                        {po.poNumber}{po.supplierName ? ` · ${po.supplierName}` : ''}
                                    </button>
                                ))}
                                {newPoSupplierName && (
                                    <button type="button" className={chip(linkChoice === 'new')} onClick={() => setLinkChoice('new')}>
                                        + Record as purchase from {newPoSupplierName}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Result preview */}
                    <div className="flex items-center justify-between bg-surface-variant/60 border border-brand-border rounded-lg px-4 py-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">New stock</span>
                        <span className="text-xl font-bold text-brand-text tnum">
                            {fmtQty(newStock, isKg)} <span className="text-sm font-medium text-brand-text-muted">{unitLabel}</span>
                            {hasQuantity && effectiveDelta !== 0 && (
                                <span className={`ml-2 text-xs font-bold ${effectiveDelta > 0 ? 'text-success' : 'text-danger'}`}>
                                    ({effectiveDelta > 0 ? '+' : '−'}{fmtQty(Math.abs(effectiveDelta), isKg)})
                                </span>
                            )}
                        </span>
                    </div>
                    {wouldClamp && (
                        <p className="text-xs font-medium text-danger">
                            That's more than the {fmtQty(currentStock, isKg)} {unitLabel} on hand — stock will stop at 0.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-brand-border">
                    <Button type="submit" variant="primary" disabled={!isValid} className="w-full">
                        {saveLabel}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default StockAdjustmentModal;
