import React, { useState } from 'react';
import { CartItem, Customer, StoreSettings } from '../../types';
import { formatCurrency, isCashMethod, isMobileMoneyMethod, paymentMethodsOf } from '../../utils/currency';
import PosIcon from './PosIcon';

type Tender = { method: string; cashReceived?: number };

interface PaymentPanelProps {
    cart: CartItem[];
    storeSettings: StoreSettings;
    total: number;
    subtotal: number;
    taxAmount: number;
    finalAppliedCredit: number;
    selectedCustomer: Customer | null;
    onApplyStoreCredit: () => void;
    cashReceived: string;
    setCashReceived: (val: string) => void;
    cashInputRef: React.RefObject<HTMLInputElement>;
    changeDue: number;
    mobileMoneyNumber: string;
    setMobileMoneyNumber: (val: string) => void;
    mobileMoneyTxnId: string;
    setMobileMoneyTxnId: (val: string) => void;
    /** Opens the automated Lenco prompt step for this mobile-money tender. */
    onOpenPaymentPrompt: (method: string) => void;
    processTransaction: (type: 'paid' | 'invoice', reference?: string, tender?: Tender) => void;
    isProcessing: boolean;
    onBack: () => void;
    onCloseMobile: () => void;
    /** Sale date as YYYY-MM-DD; today unless the cashier is entering old books. */
    saleDate: string;
    setSaleDate: (val: string) => void;
    /** Today as YYYY-MM-DD — the latest date a sale may carry. */
    today: string;
}

const getPaymentIcon = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('cash')) return 'payments';
    if (lower.includes('card') || lower.includes('credit') || lower.includes('debit')) return 'credit_card';
    if (isMobileMoneyMethod(lower)) return 'smartphone';
    return 'account_balance_wallet';
};

/**
 * Payment step — the second and last tap of a sale.
 *
 * "Pay" in the cart opens it; tapping how the customer paid records the sale.
 * Cash is exact cash, the note tiles are cash with change, and mobile money is
 * recorded against the store's own till. Everything that is not needed on
 * most sales (sale date, store credit, mobile-money details, the automated
 * prompt) sits under More options so it never pushes the tiles down.
 */
export const PaymentPanel: React.FC<PaymentPanelProps> = ({
    cart,
    storeSettings,
    total,
    subtotal,
    taxAmount,
    finalAppliedCredit,
    selectedCustomer,
    onApplyStoreCredit,
    cashReceived,
    setCashReceived,
    cashInputRef,
    changeDue,
    mobileMoneyNumber,
    setMobileMoneyNumber,
    mobileMoneyTxnId,
    setMobileMoneyTxnId,
    onOpenPaymentPrompt,
    processTransaction,
    isProcessing,
    onBack,
    onCloseMobile,
    saleDate,
    setSaleDate,
    today,
}) => {
    // Which tile was tapped, so it alone shows the spinner while the sale saves.
    const [pendingKey, setPendingKey] = useState<string | null>(null);

    const isBackdated = !!saleDate && saleDate !== today;
    const hasCredit = !!(selectedCustomer && selectedCustomer.storeCredit > 0 && storeSettings.enableStoreCredit);

    // The store's own tenders — never a list invented here.
    const paymentMethods = paymentMethodsOf(storeSettings);
    const cashMethod = paymentMethods.find(m => isCashMethod(m.name, storeSettings));
    const mobileMethods = paymentMethods.filter(m => isMobileMoneyMethod(m.name));

    const canCharge = cart.length > 0 && total >= 0 && !isProcessing;
    const cashTyped = parseFloat(cashReceived || '0') || 0;

    // Notes a customer is likely to hand over, above the exact amount.
    const noteAmounts = total > 0
        ? [Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500]
            .filter((v, i, a) => v > total && a.indexOf(v) === i)
            .slice(0, 3)
        : [];

    const charge = (key: string, tender: Tender) => {
        if (!canCharge) return;
        setPendingKey(key);
        processTransaction('paid', undefined, tender);
    };

    const tileBusy = (key: string) => isProcessing && pendingKey === key;

    return (
        <div className="pay">
            <div className="pay__head">
                <button type="button" className="pay__back" onClick={onBack}>
                    <PosIcon name="arrow_back" size={20} />
                    Back to Cart
                </button>
                <button type="button" className="cart__close" aria-label="Close" onClick={onCloseMobile}>
                    <PosIcon name="close" size={20} />
                </button>
            </div>

            <div className="pay__body">
                <div className="pay__total">
                    <span>Total Due</span>
                    <strong className="tnum">{formatCurrency(total, storeSettings)}</strong>
                </div>

                <dl className="cart__totals">
                    <div><dt>Subtotal</dt><dd className="tnum">{formatCurrency(subtotal, storeSettings)}</dd></div>
                    {finalAppliedCredit > 0 && (
                        <div className="cart__discount-row"><dt>Store credit</dt><dd className="tnum">−{formatCurrency(finalAppliedCredit, storeSettings)}</dd></div>
                    )}
                    <div><dt>Tax ({storeSettings.taxRate}%)</dt><dd className="tnum">{formatCurrency(taxAmount, storeSettings)}</dd></div>
                </dl>

                {isBackdated && (
                    <p className="cart__hint cart__hint--warn">
                        Recording on {new Date(`${saleDate}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} — change it under More options.
                    </p>
                )}

                <div className="cart__field">
                    <span className="cart__field-label">Tap how they paid</span>
                    <div className="cart__methods">
                        {paymentMethods.map(method => {
                            const isCash = cashMethod?.name === method.name;
                            const key = `m:${method.id}`;
                            return (
                                <button
                                    key={method.id}
                                    type="button"
                                    className="cart__method cart__method--tender"
                                    disabled={!canCharge}
                                    onClick={() => charge(key, { method: method.name })}
                                    aria-label={isCash
                                        ? `Exact cash, ${formatCurrency(total, storeSettings)}`
                                        : `Paid by ${method.name}, ${formatCurrency(total, storeSettings)}`}
                                >
                                    <PosIcon
                                        name={tileBusy(key) ? 'progress_activity' : getPaymentIcon(method.name)}
                                        size={24}
                                        className={tileBusy(key) ? 'cart__charge-spin' : undefined}
                                    />
                                    <span className="cart__method-label">{method.name}</span>
                                    {isCash && <span className="cart__method-sub">Exact</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {cashMethod && (
                    <div className="cart__field">
                        <span className="cart__field-label">Cash given · change shown after</span>
                        {noteAmounts.length > 0 && (
                            <div className="cart__methods">
                                {noteAmounts.map(amt => {
                                    const key = `n:${amt}`;
                                    return (
                                        <button
                                            key={amt}
                                            type="button"
                                            className="cart__method cart__method--tender"
                                            disabled={!canCharge}
                                            onClick={() => charge(key, { method: cashMethod.name, cashReceived: amt })}
                                            aria-label={`Cash ${formatCurrency(amt, storeSettings)}, change ${formatCurrency(amt - total, storeSettings)}`}
                                        >
                                            <span className="cart__method-label tnum">
                                                {tileBusy(key) ? '…' : formatCurrency(amt, storeSettings)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <form
                            className="pay__cashrow"
                            onSubmit={e => {
                                e.preventDefault();
                                charge('typed', { method: cashMethod.name, cashReceived: cashTyped });
                            }}
                        >
                            <input
                                id="pay-cash-input"
                                ref={cashInputRef}
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="any"
                                className="cart__input tnum"
                                value={cashReceived}
                                onChange={e => setCashReceived(e.target.value)}
                                placeholder="Other amount"
                                aria-label="Cash received, other amount"
                            />
                            <button
                                type="submit"
                                className="v2-btn v2-btn--primary"
                                disabled={!canCharge || cashTyped < total}
                            >
                                {changeDue > 0 ? `Change ${formatCurrency(changeDue, storeSettings)}` : 'Charge'}
                            </button>
                        </form>
                    </div>
                )}

                <details className="pay__more">
                    <summary>
                        <PosIcon name="tune" size={18} />
                        More options
                        {(isBackdated || finalAppliedCredit > 0 || mobileMoneyTxnId) && <span className="pay__more-dot" aria-label="changed" />}
                    </summary>

                    <div className="pay__more-body">
                        {hasCredit && (
                            <div className="cart__change" style={{ background: 'var(--v2-color-primary-soft)' }}>
                                <span>Store credit · {formatCurrency(selectedCustomer!.storeCredit, storeSettings)}</span>
                                <button type="button" className="cart__discount-type" onClick={onApplyStoreCredit}>
                                    {finalAppliedCredit > 0 ? 'Remove' : 'Apply'}
                                </button>
                            </div>
                        )}

                        {/* Sale date — lets a store type up sales that were kept on
                            paper. Defaults to today; future dates are not selectable. */}
                        <div className="cart__field">
                            <label className="cart__field-label" htmlFor="pay-sale-date">Sale date</label>
                            <input
                                id="pay-sale-date"
                                type="date"
                                className="cart__input"
                                value={saleDate}
                                max={today}
                                onChange={e => setSaleDate(e.target.value)}
                            />
                            {isBackdated && (
                                <p className="cart__hint cart__hint--warn">
                                    It will appear in that day's reports, not today's.
                                </p>
                            )}
                        </div>

                        {mobileMethods.length > 0 && (
                            <>
                                <div className="cart__field">
                                    <label className="cart__field-label" htmlFor="pay-momo-txn">Mobile-money transaction ID</label>
                                    <input
                                        id="pay-momo-txn"
                                        type="text"
                                        className="cart__input"
                                        style={{ textAlign: 'left' }}
                                        value={mobileMoneyTxnId}
                                        onChange={e => setMobileMoneyTxnId(e.target.value)}
                                        placeholder="Optional — from the SMS"
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="cart__field">
                                    <label className="cart__field-label" htmlFor="pay-mobile-input">Payer mobile number</label>
                                    <input
                                        id="pay-mobile-input"
                                        type="tel"
                                        className="cart__input"
                                        style={{ textAlign: 'left' }}
                                        value={mobileMoneyNumber}
                                        onChange={e => setMobileMoneyNumber(e.target.value)}
                                        placeholder="Optional"
                                    />
                                </div>
                                {mobileMethods.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className="v2-btn v2-btn--secondary"
                                        disabled={!canCharge}
                                        onClick={() => onOpenPaymentPrompt(m.name)}
                                    >
                                        <PosIcon name="bolt" size={18} /> Send {m.name} payment prompt
                                    </button>
                                ))}
                            </>
                        )}

                        <button
                            type="button"
                            className="cart__invoice"
                            disabled={!selectedCustomer || isProcessing || cart.length === 0}
                            onClick={() => processTransaction('invoice')}
                        >
                            <PosIcon name="receipt_long" size={18} />
                            {!selectedCustomer ? 'Select a customer to invoice' : 'Create Invoice instead'}
                        </button>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default PaymentPanel;
