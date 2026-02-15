import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PlanCard from '../components/subscription/PlanCard';
import FAQSection from '../components/subscription/FAQSection';
import { getCurrentUser } from '../services/authService';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { BackendPlan } from '../types/subscription';

// Lazy-load the payment modal
const CustomPaymentModal = React.lazy(
    () => import('../components/subscription/CustomPaymentModal')
);

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
    const [isAnnual, setIsAnnual] = useState(false);
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

    const handleSelectPlan = useCallback(
        (planId: string) => {
            setSelectedPlan(planId);
            const plan = plans.find((p) => p.id === planId);
            if (!plan) return;
            setPlanToPay(plan);
            setIsPaymentModalOpen(true);
        },
        [plans]
    );

    const pollVerification = useCallback(
        async (reference: string, retries: number = 0) => {
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
                    setTimeout(() => navigate('/reports'), 2000);
                } else if (data.pending) {
                    if (retries < 20) {
                        console.log('Subscription payment still pending, retrying in 3s...');
                        setTimeout(() => pollVerification(reference, retries + 1), 3000);
                    } else {
                        showToast(
                            'Payment confirmation is taking longer than expected. Please check back later.',
                            'warning'
                        );
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
                if (retries < 20) {
                    setTimeout(() => pollVerification(reference, retries + 1), 3000);
                } else {
                    showToast(
                        'Failed to verify payment. If you were charged, please contact support.',
                        'error'
                    );
                    setLoading(false);
                    setIsPaymentModalOpen(false);
                }
            }
        },
        [navigate, showToast]
    );

    const handlePayment = useCallback(
        async (method: 'card' | 'mobile-money', phoneNumber?: string) => {
            if (!planToPay) return;
            if (!user?.currentStoreId) {
                showToast('Store context missing. Please re-login.', 'error');
                return;
            }

            setLoading(true);
            try {
                const response = (await api.post<any>('/subscriptions/pay', {
                    storeId: user.currentStoreId,
                    planId: planToPay.id,
                    method: method,
                    phoneNumber: phoneNumber,
                })) as any;

                const { reference, lencoResult } = response;
                setCurrentReference(reference);
                stopPollingRef.current = false;

                if (method === 'mobile-money' && lencoResult && lencoResult.status) {
                    console.log('Mobile money charge initiated by backend:', lencoResult);
                    showToast('Payment prompt sent to your phone. Waiting for confirmation...', 'info');
                    await pollVerification(reference);
                    return;
                }

                const lencoKey = import.meta.env.VITE_LENCO_PUBLIC_KEY;

                if (!window.LencoPay) {
                    throw new Error('Lenco SDK not loaded. Please refresh the page.');
                }

                window.LencoPay.getPaid({
                    key: lencoKey,
                    reference: reference,
                    email: user.email,
                    amount: planToPay.price,
                    currency: planToPay.currency || 'ZMW',
                    channels: [method],
                    customer: { phone: phoneNumber },
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
        },
        [planToPay, user, showToast, pollVerification]
    );

    const handleCancelSubscription = useCallback(async () => {
        if (!currentReference) return;

        try {
            stopPollingRef.current = true;
            setLoading(false);
            showToast('Cancelling transaction...', 'info');

            const response = await api.post<any>(`/subscriptions/cancel/${currentReference}`);
            if (response.success || response.status) {
                showToast(
                    'Transaction cancelled successfully. If a USSD prompt appears on your phone, please decline it manually.',
                    'success'
                );
            } else {
                showToast(
                    response.message || response.error || 'Error notifying backend of cancellation',
                    'warning'
                );
            }
            setIsPaymentModalOpen(false);
        } catch (err: any) {
            console.error('Error cancelling subscription verification:', err);
            showToast('Failed to cancel. Please check if you have already been charged.', 'error');
            setLoading(false);
            setIsPaymentModalOpen(false);
        }
    }, [currentReference, showToast]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    }, [navigate]);

    const handleModalClose = useCallback(() => {
        stopPollingRef.current = true;
        setIsPaymentModalOpen(false);
    }, []);

    const handleModalConfirm = useCallback(
        ({ method, phoneNumber }: { method: 'card' | 'mobile-money'; phoneNumber?: string }) =>
            handlePayment(method, phoneNumber),
        [handlePayment]
    );

    return (
        <NotificationProvider user={user}>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
                <Sidebar
                    user={user || {}}
                    onLogout={handleLogout}
                    isOnline={navigator.onLine}
                />
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <Header title="Subscription" />

                    <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                        <div className="max-w-5xl mx-auto">
                            {/* Back button */}
                            <button
                                onClick={() => navigate(-1)}
                                className="mb-6 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>

                            {/* Header Section */}
                            <div className="text-center max-w-2xl mx-auto mb-16 mt-8">
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                                    Simple, transparent pricing
                                </h1>
                                <p className="text-lg text-slate-600 dark:text-slate-400">
                                    Choose the plan that's right for your business. No hidden fees.
                                </p>
                            </div>

                            {/* Billing Toggle */}
                            <div className="flex justify-center mb-16">
                                <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl inline-flex relative">
                                    <button
                                        onClick={() => setIsAnnual(false)}
                                        className={`relative z-10 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${!isAnnual ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setIsAnnual(true)}
                                        className={`relative z-10 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${isAnnual ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                    >
                                        Annual
                                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                            -20%
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Plans Grid */}
                            {fetchingPlans ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin dark:border-slate-800 dark:border-t-white" />
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-3 gap-8 items-start">
                                    {plans.map((plan) => (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            isAnnual={isAnnual}
                                            isFeatured={plan.id === 'plan_pro'}
                                            isActive={user?.subscriptionPlan === plan.id}
                                            isLoading={loading}
                                            isSelected={selectedPlan === plan.id}
                                            onSelect={handleSelectPlan}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* FAQ Section */}
                            <FAQSection />

                            {/* Footer Spacer */}
                            <div className="h-20" />
                        </div>
                    </main>
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <Suspense fallback={null}>
                    <CustomPaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={handleModalClose}
                        onConfirm={handleModalConfirm}
                        planName={planToPay?.name || ''}
                        amount={planToPay?.price || 0}
                        currency={planToPay?.currency || 'ZMW'}
                        loading={loading}
                        onCancelTransaction={handleCancelSubscription}
                    />
                </Suspense>
            )}
        </NotificationProvider>
    );
};

export default SubscriptionPage;
