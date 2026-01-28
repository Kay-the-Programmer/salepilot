import React, { useEffect, useState } from 'react';

interface LencoPayProps {
    amount: number;
    email: string;
    currency?: string;
    reference?: string; // New prop
    paymentChannel?: 'card' | 'mobile-money'; // New prop
    customerDetails?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
    };
    onSuccess: (response: any) => void;
    onClose?: () => void;
    onConfirmationPending?: (response?: any) => void;
    children?: React.ReactNode;
    className?: string;
}

declare global {
    interface Window {
        LencoPay: any;
    }
}

const LencoPayButton: React.FC<LencoPayProps> = ({
    amount,
    email,
    currency,
    reference: providedReference,
    paymentChannel = 'mobile-money',
    customerDetails,
    onSuccess,
    onClose,
    onConfirmationPending,
    children,
    className,
}) => {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isInternalProcessing, setIsInternalProcessing] = useState(false);

    useEffect(() => {
        // ... (existing script loading logic remains same)
        const scriptId = 'lenco-script';
        const checkAndEnable = () => {
            if (window.LencoPay) {
                setIsScriptLoaded(true);
                return true;
            }
            return false;
        };
        if (document.getElementById(scriptId)) {
            if (!checkAndEnable()) {
                const interval = setInterval(() => {
                    if (checkAndEnable()) clearInterval(interval);
                }, 500);
                setTimeout(() => clearInterval(interval), 5000);
            }
            return;
        }
        const script = document.createElement('script');
        script.id = scriptId;
        const isProd = import.meta.env.PROD;
        script.src = isProd
            ? 'https://pay.lenco.co/js/v1/inline.js'
            : 'https://pay.sandbox.lenco.co/js/v1/inline.js';
        script.async = true;
        script.onload = () => setTimeout(checkAndEnable, 100);
        document.body.appendChild(script);
    }, []);

    const handlePayment = async () => {
        console.log('Proceed with Lenco clicked', { paymentChannel, providedReference });

        const reference = providedReference || 'ref-' + Date.now();
        const publicKey = import.meta.env.VITE_LENCO_PUBLIC_KEY;

        if (!publicKey) {
            console.error('VITE_LENCO_PUBLIC_KEY is missing');
            alert('Payment configuration error: Public key missing');
            return;
        }

        // 1. If it's Mobile Money and we have a reference, let's try direct charge via backend first
        // This avoids the Lenco popup if a reference was already generated server-side
        if (paymentChannel === 'mobile-money' && providedReference && customerDetails?.phone) {
            setIsInternalProcessing(true);
            try {
                const { api } = await import('@/services/api');

                // Determine operator
                let operator = 'airtel';
                const phone = customerDetails.phone;
                if (phone.startsWith('096') || phone.startsWith('076') || phone.startsWith('26096') || phone.startsWith('26076')) {
                    operator = 'mtn';
                }

                const result = await api.post<any>('/payments/lenco/charge-mobile-money', {
                    amount,
                    reference,
                    phone: customerDetails.phone,
                    operator
                });

                if (result.status) {
                    console.log('Direct mobile money charge successful:', result);
                    if (onConfirmationPending) {
                        onConfirmationPending({ reference });
                    }
                    setIsInternalProcessing(false);
                    return; // Exit early, no need for popup
                } else {
                    console.warn('Direct charge failed, falling back to Lenco popup:', result.message);
                }
            } catch (err) {
                console.error('Failed to trigger direct charge, falling back to popup:', err);
            } finally {
                setIsInternalProcessing(false);
            }
        }

        // 2. Fallback to Lenco Popup (or use it for Card)
        if (!isScriptLoaded || !window.LencoPay) {
            console.error('Lenco SDK not ready');
            return;
        }

        const safeCustomer = {
            firstName: customerDetails?.firstName || 'Guest',
            lastName: customerDetails?.lastName || 'User',
            phone: customerDetails?.phone || '',
        };

        const payload = {
            key: publicKey,
            reference: reference,
            email: email,
            amount: amount,
            currency: currency,
            channels: [paymentChannel],
            customer: safeCustomer,
        };

        try {
            window.LencoPay.getPaid({
                ...payload,
                onSuccess: (response: any) => {
                    console.log('Lenco success:', response);
                    onSuccess(response);
                },
                onClose: () => {
                    if (onClose) onClose();
                },
                onConfirmationPending: () => {
                    if (onConfirmationPending) {
                        onConfirmationPending({ reference });
                    }
                },
            });
        } catch (err) {
            console.error('Error invoking LencoPay:', err);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={!isScriptLoaded || isInternalProcessing}
            className={className || "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}
        >
            {isInternalProcessing ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                </div>
            ) : (
                children || "Pay with Lenco"
            )}
        </button>
    );
};

export default LencoPayButton;
