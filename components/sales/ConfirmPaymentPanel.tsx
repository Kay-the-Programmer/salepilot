import React from 'react';
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
    onLencoSuccess: (response: any) => void;
    onConfirmationPending?: (response: any) => void;
    onManualConfirm: () => void;
    onUpgrade: () => void;
    onBack: () => void;
    onCloseMobile: () => void;
}

/**
 * Confirm Payment step for mobile-money sales — rendered inline in the right
 * section (not a modal). Automated gateway collection is gated behind the
 * premium Payment Gateway add-on; manual confirmation is always available.
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
    onLencoSuccess,
    onConfirmationPending,
    onManualConfirm,
    onUpgrade,
    onBack,
    onCloseMobile,
}) => {
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
                    You selected a mobile money provider. How would you like to collect this payment?
                </p>

                {/* Option 1 — Automated gateway (premium) */}
                <div className={`payopt${isGatewayUnlocked ? '' : ' payopt--locked'}`}>
                    <div className="payopt__head">
                        <span className="payopt__icon payopt__icon--primary">
                            <PosIcon name="bolt" size={22} fill={1} />
                        </span>
                        <div className="payopt__copy">
                            <h4>
                                Process via Payment Gateway
                                {!isGatewayUnlocked && (
                                    <span className="premium-badge"><PosIcon name="lock" size={12} fill={1} /> Premium</span>
                                )}
                            </h4>
                            <p>Send an automatic prompt to the customer's phone and confirm instantly.</p>
                        </div>
                    </div>

                    {isGatewayUnlocked ? (
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
                            className="cart__charge payopt__cta"
                        >
                            <span className="cart__charge-label">
                                <PosIcon name="send" size={20} />
                                Send Payment Prompt
                            </span>
                        </LencoPayButton>
                    ) : (
                        <div className="payopt__locked-cta">
                            <p className="payopt__locked-note">
                                Automated collection is a premium add-on. Get it with a plan upgrade,
                                or buy it on its own.
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
                    )}
                </div>

                <div className="confirm__or"><span>or</span></div>

                {/* Option 2 — Manual confirmation (always available) */}
                <div className="payopt">
                    <div className="payopt__head">
                        <span className="payopt__icon payopt__icon--muted">
                            <PosIcon name="task_alt" size={22} fill={1} />
                        </span>
                        <div className="payopt__copy">
                            <h4>Manual Confirmation</h4>
                            <p>I've already received this payment on my own device.</p>
                        </div>
                    </div>
                    <button type="button" className="v2-btn v2-btn--secondary payopt__cta" onClick={onManualConfirm}>
                        <PosIcon name="check_circle" size={18} fill={1} />
                        Confirm &amp; Print Receipt
                    </button>
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
