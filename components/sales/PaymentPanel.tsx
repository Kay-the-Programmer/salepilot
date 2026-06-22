import React from 'react';
import { CartItem, Customer, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import PosIcon from './PosIcon';

interface PaymentPanelProps {
    cart: CartItem[];
    storeSettings: StoreSettings;
    total: number;
    subtotal: number;
    taxAmount: number;
    finalAppliedCredit: number;
    selectedCustomer: Customer | null;
    onApplyStoreCredit: () => void;
    selectedPaymentMethod: string;
    setSelectedPaymentMethod: (val: string) => void;
    cashReceived: string;
    setCashReceived: (val: string) => void;
    cashInputRef: React.RefObject<HTMLInputElement>;
    changeDue: number;
    mobileMoneyNumber: string;
    setMobileMoneyNumber: (val: string) => void;
    processTransaction: (type: 'paid' | 'invoice') => void;
    isProcessing: boolean;
    onBack: () => void;
    onCloseMobile: () => void;
}

const getPaymentIcon = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('cash')) return 'payments';
    if (lower.includes('card') || lower.includes('credit') || lower.includes('debit')) return 'credit_card';
    if (lower.includes('mobile') || lower.includes('mtn') || lower.includes('airtel') || lower.includes('lenco')) return 'smartphone';
    return 'account_balance_wallet';
};

/**
 * Payment step — shown only after "Process Payment" is pressed. Mirrors the
 * standalone Payment screen from salepilot_web_v2 (back button → method
 * selection → complete), rendered inside the cart aside.
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
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    cashReceived,
    setCashReceived,
    cashInputRef,
    changeDue,
    mobileMoneyNumber,
    setMobileMoneyNumber,
    processTransaction,
    isProcessing,
    onBack,
    onCloseMobile,
}) => {
    const isCashMethod = (selectedPaymentMethod || '').toLowerCase().includes('cash');
    const isMobileMoney = ['mobile', 'lenco', 'mtn', 'airtel'].some(k =>
        (selectedPaymentMethod || '').toLowerCase().includes(k)
    );
    const cashReceivedNumber = parseFloat(cashReceived || '0') || 0;

    const paymentMethods = (storeSettings.paymentMethods && storeSettings.paymentMethods.length > 0)
        ? storeSettings.paymentMethods
        : [{ id: 'pm_cash', name: 'Cash' }, { id: 'pm_card', name: 'Card' }];

    const isPayDisabled = cart.length === 0 || total < 0 || (isCashMethod && cashReceivedNumber < total) || isProcessing;

    const quickAmounts = total > 0
        ? [total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500]
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 4)
        : [];

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

                {selectedCustomer && selectedCustomer.storeCredit > 0 && storeSettings.enableStoreCredit && (
                    <div className="cart__change" style={{ background: 'var(--v2-color-primary-soft)' }}>
                        <span>Store credit · {formatCurrency(selectedCustomer.storeCredit, storeSettings)}</span>
                        <button type="button" className="cart__discount-type" onClick={onApplyStoreCredit}>
                            {finalAppliedCredit > 0 ? 'Remove' : 'Apply'}
                        </button>
                    </div>
                )}

                <div className="cart__field">
                    <span className="cart__field-label">Payment method</span>
                    <div className="cart__methods">
                        {paymentMethods.map(method => (
                            <button
                                key={method.id}
                                type="button"
                                className={`cart__method${selectedPaymentMethod === method.name ? ' cart__method--active' : ''}`}
                                onClick={() => setSelectedPaymentMethod(method.name)}
                            >
                                <PosIcon name={getPaymentIcon(method.name)} size={24} />
                                <span className="cart__method-label">{method.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {isMobileMoney && (
                    <div className="cart__field">
                        <label className="cart__field-label" htmlFor="pay-mobile-input">Payer mobile number</label>
                        <input
                            id="pay-mobile-input"
                            type="text"
                            className="cart__input"
                            style={{ textAlign: 'left' }}
                            value={mobileMoneyNumber}
                            onChange={e => setMobileMoneyNumber(e.target.value)}
                            placeholder="Phone number"
                        />
                    </div>
                )}

                {isCashMethod && (
                    <div className="cart__field">
                        <label className="cart__field-label" htmlFor="pay-cash-input">Cash received</label>
                        <input
                            id="pay-cash-input"
                            ref={cashInputRef}
                            type="number"
                            className="cart__input tnum"
                            value={cashReceived}
                            onChange={e => setCashReceived(e.target.value)}
                            placeholder="0.00"
                        />
                        {quickAmounts.length > 0 && (
                            <div className="cart__methods">
                                {quickAmounts.map((amt, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`cart__method${parseFloat(cashReceived) === amt ? ' cart__method--active' : ''}`}
                                        style={{ padding: 'var(--v2-space-2)' }}
                                        onClick={() => setCashReceived(String(amt))}
                                    >
                                        <span className="cart__method-label tnum">
                                            {i === 0 ? 'Exact' : formatCurrency(amt, storeSettings)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {changeDue > 0 && (
                            <div className="cart__change">
                                <span>Change due</span>
                                <span className="tnum">{formatCurrency(changeDue, storeSettings)}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="pay__foot">
                <button
                    id="pos-pay-btn"
                    type="button"
                    className="cart__charge"
                    disabled={isPayDisabled}
                    onClick={() => processTransaction('paid')}
                    aria-label={`Charge ${formatCurrency(total, storeSettings)}`}
                >
                    <span className="cart__charge-label">
                        <PosIcon
                            name={isProcessing ? 'progress_activity' : 'check_circle'}
                            size={22}
                            fill={1}
                            className={isProcessing ? 'cart__charge-spin' : undefined}
                        />
                        {isProcessing ? 'Processing…' : 'Complete Payment'}
                    </span>
                    <span className="cart__charge-total tnum">{formatCurrency(total, storeSettings)}</span>
                </button>
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
        </div>
    );
};

export default PaymentPanel;
