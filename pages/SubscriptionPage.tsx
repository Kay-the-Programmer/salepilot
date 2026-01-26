import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import { getCurrentUser } from '../services/authService';
import { NotificationProvider } from '../contexts/NotificationContext';

// Mock plans (should fetch from API ideally, but hardcoding for consistent UI first)
const PLANS = [
    {
        id: 'plan_basic',
        name: 'Basic',
        price: 'K99',
        amount: 99,
        interval: '/month',
        description: 'Essential features for small businesses',
        features: [
            'Up to 100 Products',
            'Basic Sales Reports',
            '1 User Account',
            'Email Support'
        ],
        highlight: false
    },
    {
        id: 'plan_pro',
        name: 'Pro',
        price: 'K249',
        amount: 249,
        interval: '/month',
        description: 'Advanced tools for growing stores',
        features: [
            'Unlimited Products',
            'Advanced Analytics',
            'Up to 5 User Accounts',
            'Inventory Alerts',
            'Priority Support'
        ],
        highlight: true
    },
    {
        id: 'plan_enterprise',
        name: 'Enterprise',
        price: 'K599',
        amount: 599,
        interval: '/month',
        description: 'Complete solution for large operations',
        features: [
            'Unlimited Everything',
            'Custom Reports',
            'Dedicated Account Manager',
            'API Access',
            'Multi-store Management'
        ],
        highlight: false
    }
];

declare global {
    interface Window {
        LencoPay: any;
    }
}

const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setStoreId(user.currentStoreId || null);
            setUserEmail(user.email || null);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
        const plan = PLANS.find(p => p.id === planId);
        if (!plan) return;

        handlePayment(plan);
    };

    const handlePayment = async (plan: any) => {
        if (!storeId || !userEmail) {
            alert('Store ID or User Email missing');
            return;
        }

        setLoading(true);
        try {
            // 1. Initiate payment on backend to get reference
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/subscriptions/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    storeId,
                    planId: plan.id,
                    method: 'mobile-money'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to initiate payment');
            }

            const { reference } = await response.json();

            // 2. Open Lenco Popup
            const lencoKey = import.meta.env.VITE_LENCO_PUBLIC_KEY;

            if (!window.LencoPay) {
                throw new Error('Lenco SDK not loaded');
            }

            window.LencoPay.getPaid({
                key: lencoKey,
                reference: reference,
                email: userEmail,
                amount: plan.amount,
                currency: "ZMW",
                channels: ["mobile-money", "card"],
                onSuccess: async (response: any) => {
                    console.log('Lenco Success:', response);
                    await verifyPayment(reference);
                },
                onClose: () => {
                    setLoading(false);
                },
                onConfirmationPending: () => {
                    alert('Your payment is being confirmed. Please wait.');
                },
            });

        } catch (error: any) {
            console.error('Payment Error:', error);
            alert(error.message || 'Failed to process payment. Please try again.');
            setLoading(false);
        }
    };

    const verifyPayment = async (reference: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/subscriptions/verify/${reference}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Verification failed');
            }

            const data = await response.json();
            if (data.success) {
                alert('Payment Successful! Your subscription is now active.');
                navigate('/settings');
            } else {
                alert(data.message || 'Verification pending. Please check your settings later.');
            }
        } catch (error) {
            console.error('Verification Error:', error);
            alert('Failed to verify payment. If you were charged, please contact support.');
        } finally {
            setLoading(false);
        }
    };

    const user = getCurrentUser(); // For provider

    return (
        <NotificationProvider user={user}>
            <div className="flex h-screen bg-slate-50">
                <Sidebar
                    user={JSON.parse(localStorage.getItem('user') || '{}')}
                    onLogout={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        navigate('/login');
                    }}
                    isOnline={navigator.onLine}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="Subscription Plans" />

                    <main className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="max-w-6xl mx-auto">
                            <button
                                onClick={() => navigate('/settings')}
                                className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Settings
                            </button>

                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                                    Choose the plan that fits your business
                                </h2>
                                <p className="mt-4 text-lg text-slate-600">
                                    Simple pricing, no hidden fees. Upgrade or cancel anytime.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {PLANS.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`relative rounded-3xl p-8 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${plan.highlight
                                            ? 'bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl ring-4 ring-blue-500/20'
                                            : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                                            }`}
                                    >
                                        {plan.highlight && (
                                            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md">
                                                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                                                    Most Popular
                                                </span>
                                            </div>
                                        )}

                                        <div className="mb-6">
                                            <h3 className={`text-xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                                                {plan.name}
                                            </h3>
                                            <p className={`mt-2 text-sm ${plan.highlight ? 'text-blue-200' : 'text-slate-500'}`}>
                                                {plan.description}
                                            </p>
                                        </div>

                                        <div className="flex items-baseline mb-6">
                                            <span className={`text-4xl font-extrabold tracking-tight ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                                                {plan.price}
                                            </span>
                                            <span className={`ml-1 text-sm font-semibold ${plan.highlight ? 'text-blue-200' : 'text-slate-500'}`}>
                                                {plan.interval}
                                            </span>
                                        </div>

                                        <ul className="mb-8 space-y-4">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-start">
                                                    <div className={`p-1 rounded-full mr-3 ${plan.highlight ? 'bg-blue-700/50' : 'bg-blue-50'}`}>
                                                        <CheckCircleIcon className={`w-4 h-4 ${plan.highlight ? 'text-blue-300' : 'text-blue-600'}`} />
                                                    </div>
                                                    <span className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-slate-600'}`}>
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => handleSelectPlan(plan.id)}
                                            disabled={loading}
                                            className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold transition-all duration-300 text-center flex items-center justify-center gap-2 ${plan.highlight
                                                ? 'bg-white text-blue-900 hover:bg-blue-50 shadow-lg'
                                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {loading && selectedPlan === plan.id ? 'Processing...' : 'Get Started'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </NotificationProvider>
    );
};

export default SubscriptionPage;
