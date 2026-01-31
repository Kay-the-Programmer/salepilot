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
    const [currentReference, setCurrentReference] = useState<string | null>(null);
    const stopPollingRef = React.useRef(false);

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
            setCurrentReference(reference);
            stopPollingRef.current = false;

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
        if (stopPollingRef.current) {
            console.log('Verification stopped by user');
            return;
        }

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

    const handleCancelSubscription = async () => {
        if (!currentReference) return;

        try {
            stopPollingRef.current = true;
            setLoading(false);
            showToast('Cancelling transaction...', 'info');

            const response = await api.post<any>(`/subscriptions/cancel/${currentReference}`);
            if (response.success || response.status) {
                showToast('Transaction cancelled successfully. If a USSD prompt appears on your phone, please decline it manually.', 'success');
            } else {
                showToast(response.message || response.error || 'Error notifying backend of cancellation', 'warning');
            }
            setIsPaymentModalOpen(false);
        } catch (err: any) {
            console.error('Error cancelling subscription verification:', err);
            showToast('Failed to cancel. Please check if you have already been charged.', 'error');
            setLoading(false);
            setIsPaymentModalOpen(false);
        }
    };

    return (
        <NotificationProvider user={user}>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
                <Sidebar
                    user={user || {}}
                    onLogout={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        navigate('/login');
                    }}
                    isOnline={navigator.onLine}
                />
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/5 blur-[120px] rounded-full -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-500/5 blur-[100px] rounded-full -z-10"></div>

                    <Header title="Subscription Plans" />

                    <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
                        <div className="max-w-6xl mx-auto">
                            <button
                                onClick={() => navigate(-1)}
                                className="mb-8 flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mr-3 shadow-sm group-hover:scale-110 transition-transform">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </div>
                                Back
                            </button>

                            {user?.subscriptionStatus && (
                                <div className="mb-12 p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-blue-100 dark:border-blue-500/20 shadow-sm flex items-center justify-between glass-effect" glass-effect="true">
                                    <div className="flex items-center gap-5">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                                            <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Subscription</h3>
                                            <div className="mt-1.5 flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.subscriptionStatus === 'active'
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30'
                                                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30'
                                                    }`}>
                                                    {user.subscriptionStatus}
                                                </span>
                                                {user.subscriptionPlan && (
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                        {user.subscriptionPlan.replace('plan_', '')} Plan
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {user.subscriptionEndsAt && (
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Renews On</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {new Date(user.subscriptionEndsAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white sm:text-5xl tracking-tight mb-4">
                                    Power your business with <span className="text-indigo-600 dark:text-indigo-500">SalePilot</span>
                                </h2>
                                <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 font-medium">
                                    Choose the perfect plan for your business needs. Simple pricing with zero hidden costs.
                                </p>
                            </div>

                            {fetchingPlans ? (
                                <div className="flex flex-col justify-center items-center h-64 gap-4">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 border-4 border-indigo-100 dark:border-slate-800 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Loading Premium Plans...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className={`relative rounded-[32px] p-8 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl flex flex-col ${plan.id === 'plan_pro'
                                                ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-indigo-600 dark:via-blue-600 dark:to-indigo-700 text-white shadow-2xl shadow-blue-500/20'
                                                : 'bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm glass-effect'
                                                }`}
                                            glass-effect={plan.id !== 'plan_pro' ? "true" : undefined}
                                        >
                                            {plan.id === 'plan_pro' && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-1.5 text-[10px] font-black text-white shadow-xl uppercase tracking-widest ring-4 ring-white dark:ring-slate-900">
                                                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                                                        The Best Choice
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mb-8">
                                                <h3 className={`text-2xl font-black tracking-tight ${plan.id === 'plan_pro' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                    {plan.name}
                                                </h3>
                                                <p className={`mt-2 text-sm font-medium ${plan.id === 'plan_pro' ? 'text-blue-100/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {plan.description}
                                                </p>
                                            </div>

                                            <div className="flex items-baseline mb-8">
                                                <span className={`text-4xl font-black tracking-tight ${plan.id === 'plan_pro' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                    {plan.currency} {plan.price}
                                                </span>
                                                <span className={`ml-2 text-xs font-bold uppercase tracking-widest ${plan.id === 'plan_pro' ? 'text-blue-100/60' : 'text-slate-400'}`}>
                                                    / {plan.interval}
                                                </span>
                                            </div>

                                            <div className="flex-1">
                                                <ul className="space-y-4 mb-10">
                                                    {plan.features.map((feature, index) => (
                                                        <li key={index} className="flex items-start group">
                                                            <div className={`p-1 rounded-lg mr-4 transition-colors ${plan.id === 'plan_pro'
                                                                ? 'bg-white/20 text-white'
                                                                : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                                }`}>
                                                                <CheckCircleIcon className="w-4 h-4" />
                                                            </div>
                                                            <span className={`text-sm font-medium leading-relaxed ${plan.id === 'plan_pro' ? 'text-blue-50' : 'text-slate-600 dark:text-slate-300'}`}>
                                                                {feature}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <button
                                                onClick={() => handleSelectPlan(plan.id)}
                                                disabled={loading || user?.subscriptionPlan === plan.id}
                                                className={`w-full py-4 px-6 rounded-2xl text-sm font-black transition-all duration-300 text-center flex items-center justify-center gap-2 group ${plan.id === 'plan_pro'
                                                    ? 'bg-white text-blue-900 hover:bg-blue-50 shadow-xl'
                                                    : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-lg'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest overflow-hidden relative`}
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[25deg]"></div>
                                                <span className="relative">
                                                    {loading && selectedPlan === plan.id ? 'Processing...' :
                                                        user?.subscriptionPlan === plan.id ? 'Active Plan' : 'Select Plan'}
                                                </span>
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
                onClose={() => {
                    stopPollingRef.current = true;
                    setIsPaymentModalOpen(false);
                }}
                onConfirm={({ method, phoneNumber }) => handlePayment(method, phoneNumber)}
                planName={planToPay?.name || ''}
                amount={planToPay?.price || 0}
                currency={planToPay?.currency || 'ZMW'}
                loading={loading}
                onCancelTransaction={handleCancelSubscription}
            />
        </NotificationProvider>
    );
};

export default SubscriptionPage;
