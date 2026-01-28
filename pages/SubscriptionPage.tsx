import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import { getCurrentUser } from '../services/authService';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useToast } from '../contexts/ToastContext';
import CustomPaymentModal from '../components/subscription/CustomPaymentModal';

import { api } from '../services/api';

interface BackendPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    description: string;
    features: string[];
}

declare global {
    interface Window {
        LencoPay: any;
    }
}

const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [plans, setPlans] = useState<BackendPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingPlans, setFetchingPlans] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [planToPay, setPlanToPay] = useState<BackendPlan | null>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            fetchPlans();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchPlans = async () => {
        try {
            const data = await api.get<BackendPlan[]>('/subscriptions/plans');
            setPlans(data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            showToast('Failed to load subscription plans', 'error');
        } finally {
            setFetchingPlans(false);
        }
    };

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        setPlanToPay(plan);
        setIsPaymentModalOpen(true);
    };

    const handlePayment = async (method: 'card' | 'mobile-money', phoneNumber?: string) => {
        if (!planToPay) return;
        if (!user?.currentStoreId) {
            showToast('Store context missing. Please re-login.', 'error');
            return;
        }

        setLoading(true);
        try {
            // 1. Initiate payment on backend to get reference
            const response = await api.post<any>('/subscriptions/pay', {
                storeId: user.currentStoreId,
                planId: planToPay.id,
                method: method,
                phoneNumber: phoneNumber
            }) as any;

            const { reference, lencoResult } = response;

            // 2. If it's mobile money and the backend already initiated the charge (lencoResult), 
            // we don't open the popup, we just start polling.
            if (method === 'mobile-money' && lencoResult && lencoResult.status) {
                console.log('Mobile money charge initiated by backend:', lencoResult);
                showToast('Payment prompt sent to your phone. Waiting for confirmation...', 'info');
                await pollVerification(reference);
                return;
            }

            // 3. Otherwise (Card payment or mobile-money charge failed to initiate), open Lenco Popup
            const lencoKey = import.meta.env.VITE_LENCO_PUBLIC_KEY;

            if (!window.LencoPay) {
                throw new Error('Lenco SDK not loaded. Please refresh the page.');
            }

            window.LencoPay.getPaid({
                key: lencoKey,
                reference: reference,
                email: user.email,
                amount: planToPay.price,
                currency: planToPay.currency || "ZMW",
                channels: [method], // Use only the selected method
                customer: {
                    phone: phoneNumber
                },
                onSuccess: async (response: any) => {
                    console.log('Lenco Success:', response);
                    await pollVerification(reference);
                },
                onClose: () => {
                    setLoading(false);
                    setIsPaymentModalOpen(false);
                },
                onConfirmationPending: () => {
                    console.log('Lenco Confirmation Pending');
                    showToast('Payment prompt sent to your phone. Waiting for confirmation...', 'info');
                    pollVerification(reference);
                },
            });

        } catch (error: any) {
            console.error('Payment Error:', error);
            showToast(error.message || 'Failed to process payment. Please try again.', 'error');
            setLoading(false);
        }
    };

    const pollVerification = async (reference: string, retries: number = 0) => {
        try {
            console.log(`Verifying subscription payment (attempt ${retries + 1}):`, reference);
            const data = await api.get<any>(`/subscriptions/verify/${reference}`);

            if (data.success) {
                showToast('Payment Successful! Your subscription is now active.', 'success');
                setLoading(false);
                setIsPaymentModalOpen(false);
                // Delay navigation slightly to let the user see the success message
                setTimeout(() => navigate('/reports'), 2000);
            } else if (data.pending) {
                if (retries < 20) { // Poll for ~1 minute
                    console.log('Subscription payment still pending, retrying in 3s...');
                    setTimeout(() => pollVerification(reference, retries + 1), 3000);
                } else {
                    showToast('Payment confirmation is taking longer than expected. Please check back later.', 'warning');
                    setLoading(false);
                    setIsPaymentModalOpen(false);
                }
            } else {
                showToast(data.message || 'Payment verification failed', 'error');
                setLoading(false);
                setIsPaymentModalOpen(false);
            }
        } catch (error: any) {
            console.error('Verification Error:', error);
            // Don't stop polling on network error, just retry
            if (retries < 20) {
                setTimeout(() => pollVerification(reference, retries + 1), 3000);
            } else {
                showToast('Failed to verify payment. If you were charged, please contact support.', 'error');
                setLoading(false);
                setIsPaymentModalOpen(false);
            }
        }
    };

    return (
        <NotificationProvider user={user}>
            <div className="flex h-screen bg-slate-50">
                <Sidebar
                    user={user || {}}
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
                                onClick={() => navigate(-1)}
                                className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>

                            {user?.subscriptionStatus && (
                                <div className="mb-8 p-6 bg-white rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Current Subscription</h3>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {user.subscriptionStatus}
                                            </span>
                                            {user.subscriptionPlan && (
                                                <span className="text-sm font-medium text-slate-600">
                                                    Plan: <span className="capitalize">{user.subscriptionPlan.replace('plan_', '')}</span>
                                                </span>
                                            )}
                                        </div>
                                        {user.subscriptionEndsAt && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                Expires on {new Date(user.subscriptionEndsAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <ShieldCheckIcon className="w-10 h-10 text-blue-500 opacity-20" />
                                </div>
                            )}

                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                                    Choose the plan that fits your business
                                </h2>
                                <p className="mt-4 text-lg text-slate-600">
                                    Simple pricing, no hidden fees. Upgrade or cancel anytime.
                                </p>
                            </div>

                            {fetchingPlans ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className={`relative rounded-3xl p-8 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${plan.id === 'plan_pro'
                                                ? 'bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl ring-4 ring-blue-500/20'
                                                : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                                                }`}
                                        >
                                            {plan.id === 'plan_pro' && (
                                                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md">
                                                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                                                        Most Popular
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mb-6">
                                                <h3 className={`text-xl font-bold ${plan.id === 'plan_pro' ? 'text-white' : 'text-slate-900'}`}>
                                                    {plan.name}
                                                </h3>
                                                <p className={`mt-2 text-sm ${plan.id === 'plan_pro' ? 'text-blue-200' : 'text-slate-500'}`}>
                                                    {plan.description}
                                                </p>
                                            </div>

                                            <div className="flex items-baseline mb-6">
                                                <span className={`text-4xl font-extrabold tracking-tight ${plan.id === 'plan_pro' ? 'text-white' : 'text-slate-900'}`}>
                                                    {plan.currency} {plan.price}
                                                </span>
                                                <span className={`ml-1 text-sm font-semibold ${plan.id === 'plan_pro' ? 'text-blue-200' : 'text-slate-500'}`}>
                                                    /{plan.interval}
                                                </span>
                                            </div>

                                            <ul className="mb-8 space-y-4">
                                                {plan.features.map((feature, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <div className={`p-1 rounded-full mr-3 ${plan.id === 'plan_pro' ? 'bg-blue-700/50' : 'bg-blue-50'}`}>
                                                            <CheckCircleIcon className={`w-4 h-4 ${plan.id === 'plan_pro' ? 'text-blue-300' : 'text-blue-600'}`} />
                                                        </div>
                                                        <span className={`text-sm ${plan.id === 'plan_pro' ? 'text-blue-100' : 'text-slate-600'}`}>
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                onClick={() => handleSelectPlan(plan.id)}
                                                disabled={loading || user?.subscriptionPlan === plan.id}
                                                className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold transition-all duration-300 text-center flex items-center justify-center gap-2 ${plan.id === 'plan_pro'
                                                    ? 'bg-white text-blue-900 hover:bg-blue-50 shadow-lg'
                                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {loading && selectedPlan === plan.id ? 'Processing...' :
                                                    user?.subscriptionPlan === plan.id ? 'Current Plan' : 'Get Started'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            <CustomPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onConfirm={({ method, phoneNumber }) => handlePayment(method, phoneNumber)}
                planName={planToPay?.name || ''}
                amount={planToPay?.price || 0}
                currency={planToPay?.currency || 'ZMW'}
                loading={loading}
            />
        </NotificationProvider>
    );
};

export default SubscriptionPage;
