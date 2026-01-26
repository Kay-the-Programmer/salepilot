import React, { useEffect, useState } from 'react';

interface LencoPayProps {
    amount: number;
    email: string;
    currency?: string;
    customerDetails?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
    };
    onSuccess: (response: any) => void;
    onClose?: () => void;
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
    currency, // Remove hardcoded default here to let parent or store settings decide
    customerDetails,
    onSuccess,
    onClose,
    children,
    className,
}) => {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    useEffect(() => {
        const scriptId = 'lenco-script';

        const checkAndEnable = () => {
            if (window.LencoPay) {
                console.log('window.LencoPay is available:', Object.keys(window.LencoPay));
                setIsScriptLoaded(true);
                return true;
            }
            return false;
        };

        // Check if script is already present
        if (document.getElementById(scriptId)) {
            console.log('Lenco script already in DOM');
            if (!checkAndEnable()) {
                console.log('waiting for window.LencoPay...');
                const interval = setInterval(() => {
                    if (checkAndEnable()) clearInterval(interval);
                }, 500);

                // Timeout after 5s
                setTimeout(() => clearInterval(interval), 5000);
            }
            return;
        }

        console.log('Loading Lenco script...');
        const script = document.createElement('script');
        script.id = scriptId;
        const isProd = import.meta.env.PROD;
        script.src = isProd
            ? 'https://pay.lenco.co/js/v1/inline.js'
            : 'https://pay.sandbox.lenco.co/js/v1/inline.js';
        script.async = true;
        script.onload = () => {
            console.log('Lenco script loaded successfully');
            // Give it a moment to initialize the global object
            setTimeout(checkAndEnable, 100);
        };
        script.onerror = (e) => {
            console.error('Failed to load Lenco script', e);
        };
        document.body.appendChild(script);

        return () => { };
    }, []);

    const handlePayment = () => {
        console.log('Proceed with Lenco clicked');

        if (!isScriptLoaded) {
            console.error('Lenco script state is NOT loaded');
            // Try one last check
            if (window.LencoPay) setIsScriptLoaded(true);
            else return;
        }

        if (!window.LencoPay) {
            console.error('window.LencoPay is undefined');
            return;
        }

        const publicKey = import.meta.env.VITE_LENCO_PUBLIC_KEY;
        console.log('Using Public Key:', publicKey ? '***Present***' : 'MISSING');

        if (!publicKey) {
            console.error('VITE_LENCO_PUBLIC_KEY is missing in environment variables');
            alert('Payment configuration error: Public key missing');
            return;
        }

        const reference = 'ref-' + Date.now();

        // Ensure constraints are met (some gateways reject empty strings)
        const safeCustomer = {
            firstName: customerDetails?.firstName || 'Guest',
            lastName: (customerDetails?.lastName && customerDetails.lastName.trim() !== '')
                ? customerDetails.lastName
                : (customerDetails?.firstName || 'User'), // Fallback to firstname or generic
            phone: customerDetails?.phone || '',
        };

        const payload = {
            key: publicKey,
            reference: reference,
            email: email,
            amount: amount,
            currency: currency,
            channels: ['card', 'mobile-money'],
            customer: safeCustomer,
        };
        console.log('Initializing Lenco payment with payload:', payload);

        try {
            window.LencoPay.getPaid({
                ...payload,
                onSuccess: (response: any) => {
                    console.log('Lenco success:', response);
                    onSuccess(response);
                },
                onClose: () => {
                    console.log('Lenco modal closed');
                    if (onClose) onClose();
                },
                onConfirmationPending: () => {
                    console.log('Lenco confirmation pending');
                    alert('Your purchase will be completed when the payment is confirmed');
                },
            });
        } catch (err) {
            console.error('Error invoking window.LencoPay.getPaid:', err);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={!isScriptLoaded}
            className={className || "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}
        >
            {children || "Pay with Lenco"}
        </button>
    );
};

export default LencoPayButton;
