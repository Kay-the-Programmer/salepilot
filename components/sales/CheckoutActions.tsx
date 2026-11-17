import React from 'react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import PosIcon from './PosIcon';

interface CheckoutActionsProps {
    storeSettings: StoreSettings;
    total: number;
    subtotal: number;
    taxAmount: number;
    discount: string;
    setDiscount: (val: string) => void;
    discountType: 'amount' | 'percentage';
    setDiscountType: (val: 'amount' | 'percentage') => void;
    finalAppliedCredit: number;
    onProcessPayment: () => void;
    onHoldSale: () => void;
    clearCart: () => void;
    /**
     * Hospitality only. Puts the order on an open bill instead of taking money
     * now — the move a restaurant makes constantly, where Hold Sale (one
     * device, one stack, no name) cannot help: the waiter who took the order is
     * not the only person who will add to the bill or settle it.
     *
     * Undefined for a shop, which renders no such button.
     */
    onSaveToBill?: () => void;
    /** What this venue calls a bill: "Table", "Tab" or "Order". */
    billNoun?: string;
    /** The bill this cart came off, if any — so Save reads as "add to it". */
    activeBillLabel?: string | null;
    savingToBill?: boolean;
}

/**
 * Cart-building foot — progressive disclosure: only the actions needed while
 * assembling an order (discount, totals, then Process Payment / Hold / Clear).
 * The payment-method picker lives in the separate PaymentPanel step.
 */
export const CheckoutActions: React.FC<CheckoutActionsProps> = ({
    storeSettings,
    total,
    subtotal,
    taxAmount,
    discount,
    setDiscount,
    discountType,
    setDiscountType,
    finalAppliedCredit,
    onProcessPayment,
    onHoldSale,
    clearCart,
    onSaveToBill,
    billNoun = 'Table',
    activeBillLabel,
    savingToBill,
}) => {
    return (
        <div className="cart__foot">
            {/* Discount */}
            <div className="cart__discount">
                <PosIcon name="sell" size={18} className="cart__discount-icon" />
                <select
                    className="cart__discount-type"
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as 'amount' | 'percentage')}
                    aria-label="Discount type"
                >
                    <option value="amount">{storeSettings.currency.symbol}</option>
                    <option value="percentage">%</option>
                </select>
                <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    placeholder="Discount"
                    aria-label="Discount amount"
                />
            </div>

            {/* Totals */}
            <dl className="cart__totals">
                <div><dt>Subtotal</dt><dd className="tnum">{formatCurrency(subtotal, storeSettings)}</dd></div>
                {finalAppliedCredit > 0 && (
                    <div className="cart__discount-row"><dt>Store credit</dt><dd className="tnum">−{formatCurrency(finalAppliedCredit, storeSettings)}</dd></div>
                )}
                <div><dt>Tax ({storeSettings.taxRate}%)</dt><dd className="tnum">{formatCurrency(taxAmount, storeSettings)}</dd></div>
            </dl>

            {/* Process payment */}
            <button
                id="pos-process-btn"
                type="button"
                className="cart__charge"
                disabled={total < 0}
                onClick={onProcessPayment}
                aria-label={`Process payment ${formatCurrency(total, storeSettings)}`}
            >
                <span className="cart__charge-label">
                    <PosIcon name="point_of_sale" size={22} fill={1} />
                    Charge
                </span>
                <span className="cart__charge-total tnum">{formatCurrency(total, storeSettings)}</span>
            </button>

            {/* A venue's commonest action after taking an order is NOT taking
                money — it is walking away with the bill left open. So it gets a
                full-width button of its own above the shop's hold/clear pair,
                rather than being squeezed in beside them. */}
            {onSaveToBill && (
                <button
                    type="button"
                    className="cart__savebill"
                    disabled={!!savingToBill}
                    onClick={onSaveToBill}
                >
                    <PosIcon name="table_restaurant" size={20} />
                    {savingToBill
                        ? 'Saving…'
                        : activeBillLabel
                            ? `Add to ${activeBillLabel}`
                            : `Save to ${billNoun.toLowerCase()}`}
                </button>
            )}

            {/* Secondary: hold + clear */}
            <div className="cart__secondary">
                {/* Hold Sale is a shop's tool — one device, one stack, no name.
                    A venue uses open bills instead, so it isn't offered both. */}
                {!onSaveToBill && (
                    <button
                        id="pos-hold-btn"
                        type="button"
                        className="v2-btn v2-btn--secondary"
                        onClick={onHoldSale}
                    >
                        <PosIcon name="pause" size={18} /> Hold Sale
                    </button>
                )}
                <button
                    type="button"
                    className="v2-btn v2-btn--ghost"
                    onClick={clearCart}
                >
                    <PosIcon name="delete" size={18} /> Clear Cart
                </button>
            </div>
        </div>
    );
};
