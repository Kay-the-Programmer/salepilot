import React, { useState } from 'react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import LencoPayButton from '../shop/LencoPayButton';
import PosIcon from './PosIcon';

interface ConfirmPaymentPanelProps {
    storeSettings: StoreSettings;
    totalAmount: number;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    reference?: string;
    merchantPublicKey?: string;
    /** Whether the store has the premium Payment Gateway module/add-on. */
    isGatewayUnlocked: boolean;
    /** The tender the cashier picked, e.g. "MTN" or "AIRTEL" — shown in the copy. */
    paymentMethodLabel?: string;
    onLencoSuccess: (response: any) => void;
    onConfirmationPending?: (response: any) => void;
    /** Records the sale as paid; the optional string is the operator's transaction ID. */
    onManualConfirm: (manualReference?: string) => void;
    onUpgrade: () => void;
    onBack: () => void;
    onCloseMobile: () => void;
}

/**
 * Confirm Payment step for mobile-money sales — rendered inline in the right
 * section (not a modal).
 *
 * Every store can take MTN/Airtel money here: the customer sends it straight to
 * the store's own mobile-money till and the cashier records it with the SMS
 * transaction ID. Automated collection (an in-app prompt to the customer's
 * phone) is the extra on top — it needs both the premium Payment Gateway add-on
 * and the store's own Lenco keys, because funds settle to the MERCHANT and are
 * never routed through the platform account. Neither requirement may block the
 * sale, so manual confirmation is always offered.
 */
export const ConfirmPaymentPanel: React.FC<ConfirmPaymentPanelProps> = ({
    storeSettings,
    totalAmount,
    customerEmail,
    customerName,
    customerPhone,
    reference,
    merchantPublicKey,
    isGatewayUnlocked,
    paymentMethodLabel,
    onLencoSuccess,
    onConfirmationPending,
    onManualConfirm,
    onUpgrade,
    onBack,
    onCloseMobile,
}) => {
    const [manualReference, setManualReference] = useState('');

    const provider = (paymentMethodLabel || 'Mobile money').trim();
    // The automated prompt needs the add-on AND the merchant's own Lenco keys.
    const isAutomatedReady = isGatewayUnlocked && !!merchantPublicKey;

    return (
        <div className="pay">
            <div className="pay__head">
                <button type="button" className="pay__back" onClick={onBack}>
                    <PosIcon name="arrow_back" size={20} />
                    Back to Payment
                </button>
                <button type="button" className="cart__close" aria-label="Close" onClick={onCloseMobile}>
                    <PosIcon name="close" size={20} />
                </button>
            </div>

            <div className="pay__body">
                <div className="pay__total">
                    <span>Amount Due</span>
                    <strong className="tnum">{formatCurrency(totalAmount, storeSettings)}</strong>
                </div>

                <p className="confirm__lead">
                    Collecting {provider}. Record the payment once it lands in your till, or send
                    an automatic prompt to the customer&rsquo;s phone.
                </p>

                {/* Option 1 — Record the payment. Always available, no setup at all. */}
                <div className="payopt">
                    <div className="payopt__head">
                        <span className="payopt__icon payopt__icon--primary">
                            <PosIcon name="task_alt" size={22} fill={1} />
                        </span>
                        <div className="payopt__copy">
                            <h4>Record {provider} payment</h4>
                            <p>
                                The customer sends {formatCurrency(totalAmount, storeSettings)} to your{' '}
                                {provider} number{customerPhone ? ` from ${customerPhone}` : ''}. Confirm
                                once you get the SMS.
                            </p>
                        </div>
                    </div>

                    <div className="cart__field">
                        <label className="cart__field-label" htmlFor="confirm-manual-ref">
                            Transaction ID (optional)
                        </label>
                        <input
                            id="confirm-manual-ref"
                            type="text"
                            className="cart__input"
                            placeholder="e.g. MP240518.1423.A12345"
                            value={manualReference}
                            onChange={e => setManualReference(e.target.value)}
                            autoComplete="off"
                        />
                        <p className="cart__hint">
                            From the {provider} confirmation SMS — saved on the sale so the payment can
                            be matched later. Leave blank to record without one.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="cart__charge payopt__cta"
                        onClick={() => onManualConfirm(manualReference)}
                    >
                        <span className="cart__charge-label">
                            <PosIcon name="check_circle" size={20} fill={1} />
                            Confirm &amp; Print Receipt
                        </span>
                    </button>
                </div>

                <div className="confirm__or"><span>or</span></div>

                {/* Option 2 — Automated gateway (premium add-on + the store's own Lenco keys) */}
                <div className={`payopt${isAutomatedReady ? '' : ' payopt--locked'}`}>
                    <div className="payopt__head">
                        <span className="payopt__icon payopt__icon--muted">
                            <PosIcon name="bolt" size={22} fill={1} />
                        </span>
                        <div className="payopt__copy">
                            <h4>
                                Send payment prompt
                                {!isGatewayUnlocked && (
                                    <span className="premium-badge"><PosIcon name="lock" size={12} fill={1} /> Premium</span>
                                )}
                            </h4>
                            <p>Push a prompt to the customer&rsquo;s phone and confirm the sale automatically.</p>
                        </div>
                    </div>

                    {isAutomatedReady ? (
                        <LencoPayButton
                            amount={totalAmount}
                            email={customerEmail}
                            currency={storeSettings?.currency?.code || 'ZMW'}
                            reference={reference}
                            merchantPublicKey={merchantPublicKey}
                            paymentChannel="mobile-money"
                            customerDetails={{
                                firstName: customerName.split(' ')[0],
                                lastName: customerName.split(' ').slice(1).join(' ') || '',
                                phone: customerPhone,
                            }}
                            onSuccess={onLencoSuccess}
                            onConfirmationPending={onConfirmationPending}
                            className="v2-btn v2-btn--secondary payopt__cta"
                        >
                            <span className="cart__charge-label">
                                <PosIcon name="send" size={20} />
                                Send Payment Prompt
                            </span>
                        </LencoPayButton>
                    ) : !isGatewayUnlocked ? (
                        <div className="payopt__locked-cta">
                            <p className="payopt__locked-note">
                                Automated collection is a premium add-on. Get it with a plan upgrade, or
                                buy it on its own — recording payments above stays free.
                            </p>
                            <div className="payopt__locked-actions">
                                <button type="button" className="v2-btn v2-btn--secondary" onClick={onUpgrade}>
                                    <PosIcon name="workspace_premium" size={18} /> Upgrade plan
                                </button>
                                <button type="button" className="v2-btn v2-btn--ghost" onClick={onUpgrade}>
                                    <PosIcon name="add_shopping_cart" size={18} /> Buy add-on
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="payopt__locked-cta">
                            <p className="payopt__locked-note">
                                Add your Lenco keys in Settings → Financial to switch this on. Money from
                                prompts settles straight to your own account, so we can&rsquo;t send one
                                until it is connected.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="pay__foot">
                <button type="button" className="cart__invoice" onClick={onBack}>
                    <PosIcon name="close" size={18} /> Cancel
                </button>
            </div>
        </div>
    );
};

export default ConfirmPaymentPanel;
