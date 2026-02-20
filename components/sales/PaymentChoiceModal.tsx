import React from 'react';

import LencoPayButton from '../shop/LencoPayButton';
import CreditCardIcon from '../icons/CreditCardIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

// Simple types for props since we don't want to over-engineer dependency injection here
interface PaymentChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    onLencoSuccess: (response: any) => void;
    onConfirmationPending?: (response: any) => void;
    onManualConfirm: () => void;
    storeSettings: any;
    reference?: string; // New prop
    merchantPublicKey?: string; // New prop
}

const PaymentChoiceModal: React.FC<PaymentChoiceModalProps> = ({
    isOpen,
    onClose,
    totalAmount,
    customerEmail,
    customerName,
    customerPhone,
    onLencoSuccess,
    onConfirmationPending,
    onManualConfirm,
    storeSettings,
    reference,
    merchantPublicKey
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="payment-choice-modal" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* Modal Panel */}
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                                    Confirm Payment Method
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        You have selected a mobile money payment provider. How would you like to process this payment?
                                    </p>
                                </div>

                                <div className="mt-6 flex flex-col gap-3">
                                    {/* Option 1: Pay with Lenco */}
                                    <div className="rounded-md border border-gray-200 p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                                <CreditCardIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">Process via Payment Gateway</h4>
                                                <p className="text-xs text-gray-500">Send a payment prompt to the customer's phone.</p>
                                            </div>
                                        </div>
                                        <LencoPayButton
                                            amount={totalAmount}
                                            email={customerEmail}
                                            currency={storeSettings?.currencySymbol || 'ZMW'}
                                            reference={reference}
                                            merchantPublicKey={merchantPublicKey}
                                            paymentChannel="mobile-money"
                                            customerDetails={{
                                                firstName: customerName.split(' ')[0],
                                                lastName: customerName.split(' ').slice(1).join(' ') || '',
                                                phone: customerPhone
                                            }}
                                            onSuccess={onLencoSuccess}
                                            onConfirmationPending={onConfirmationPending}
                                            className="w-full inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
                                        >
                                            Proceed with Lenco
                                        </LencoPayButton>
                                    </div>

                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-gray-300"></div>
                                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Or</span>
                                        <div className="flex-grow border-t border-gray-300"></div>
                                    </div>

                                    {/* Option 2: Manual Confirmation */}
                                    <div className="rounded-md border border-gray-200 p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                                <CheckCircleIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">Manual Confirmation</h4>
                                                <p className="text-xs text-gray-500">I have already confirmed the payment externally.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={onManualConfirm}
                                            className="w-full inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        >
                                            Just Confirm & Print Receipt
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentChoiceModal;
