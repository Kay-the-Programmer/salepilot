import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import { getCurrentUser } from '../services/authService';
import { NotificationProvider } from '../contexts/NotificationContext';

// Mock plans (should fetch from API ideally, but hardcoding for consistent UI first)
const PLANS = [
    {
        id: 'plan_basic',
        name: 'Basic',
        price: 'K99',
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

const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setStoreId(user.currentStoreId || null);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
        setIsPaymentModalOpen(true);
    };

    const handlePayment = async () => {
        if (!storeId || !selectedPlan) {
            alert('Store ID or Plan missing');
            return;
        }

        setLoading(true);
        try {
            // Call Backend API
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/subscriptions/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    storeId,
                    planId: selectedPlan,
                    method: 'mobile_money',
                    phoneNumber
                })
            });

            if (!response.ok) {
                throw new Error('Payment failed');
            }

            await response.json();
            alert('Payment Successful! Your subscription is now active.');
            setIsPaymentModalOpen(false);
            navigate('/settings');
        } catch (error) {
            console.error('Payment Error:', error);
            alert('Failed to process payment. Please try again.');
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
                                            className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold transition-all duration-300 text-center flex items-center justify-center gap-2 ${plan.highlight
                                                ? 'bg-white text-blue-900 hover:bg-blue-50 shadow-lg'
                                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
                                                }`}
                                        >
                                            Get Started
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Modal */}
                            {isPaymentModalOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-bold text-slate-900">Confirm Payment</h3>
                                                <button
                                                    onClick={() => setIsPaymentModalOpen(false)}
                                                    className="text-slate-400 hover:text-slate-500"
                                                >
                                                    <span className="sr-only">Close</span>
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-4">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                        <CreditCardIcon className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">Airtel Money</p>
                                                        <p className="text-xs text-slate-500">Secure mobile payment</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Mobile Number
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={phoneNumber}
                                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                                        placeholder="097xxxxxxx"
                                                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div className="pt-4">
                                                    <button
                                                        onClick={handlePayment}
                                                        disabled={loading || !phoneNumber}
                                                        className="w-full py-3.5 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                                                    >
                                                        {loading ? 'Processing...' : `Pay ${PLANS.find(p => p.id === selectedPlan)?.price}`}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </NotificationProvider>
    );
};

export default SubscriptionPage;
