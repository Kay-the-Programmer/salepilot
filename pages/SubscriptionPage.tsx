import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PlanCard from '../components/subscription/PlanCard';
import FAQSection from '../components/subscription/FAQSection';
import SubscriptionHistory from '../components/subscription/SubscriptionHistory';
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

type TabType = 'plans' | 'history';

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
    const [activeTab, setActiveTab] = useState<TabType>('plans');
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



    const PlanSkeleton = () => (
        <div className="relative flex flex-col p-8 rounded-2xl glass-card h-[600px] border border-slate-200 dark:border-slate-800">
            <div className="h-8 bg-slate-200/50 dark:bg-slate-700/50 rounded w-1/2 mb-4 animate-pulse" />
            <div className="h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded w-3/4 mb-12 animate-pulse" />

            <div className="mb-8 flex items-baseline gap-1">
                <div className="h-10 bg-slate-200/50 dark:bg-slate-700/50 rounded w-1/3 animate-pulse" />
            </div>

            <div className="space-y-6 flex-1">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 flex-shrink-0 animate-pulse" />
                        <div className="h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded w-full animate-pulse" />
                    </div>
                ))}
            </div>

            <div className="mt-8 h-12 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl w-full animate-pulse" />
        </div>
    );

    return (
        <NotificationProvider user={user}>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
                <Sidebar
                    user={user || {}}
                    onLogout={handleLogout}
                    isOnline={navigator.onLine}
                />
                <div className="flex-1 flex flex-col relative">
                    <Header title="Subscription" />

                    <main className="flex-1 overflow-y-auto relative scroll-smooth bg-grid-slate-100 dark:bg-grid-slate-900 bg-[size:40px_40px]">

                        {/* Animated Background Blobs */}
                        <div className="fixed inset-0 pointer-events-none overflow-hidden touch-none select-none z-0">
                            <div className="absolute top-0 left-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-200/30 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob" />
                            <div className="absolute top-0 right-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob animation-delay-2000" />
                            <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-pink-200/30 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-60 animate-blob animation-delay-4000" />
                        </div>

                        <div className="relative z-10 p-3 md:p-8 max-w-7xl mx-auto min-h-full flex flex-col">
                            {/* Back button */}
                            <button
                                onClick={() => navigate(-1)}
                                className="mb-6 md:mb-8 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
                            >
                                <div className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm mr-3 group-hover:scale-110 transition-transform">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </div>
                                <span className="opacity-80 group-hover:opacity-100">Back onto Dashboard</span>
                            </button>

                            {/* Main Content Card */}
                            <div className="glass-panel rounded-3xl p-1 md:p-2 flex-1 flex flex-col">

                                {/* Tabs Navigation */}
                                <div className="flex justify-center border-b border-slate-200/50 dark:border-slate-800/50 pt-6 pb-0 px-6">
                                    <div className="flex space-x-8 relative">
                                        <button
                                            onClick={() => setActiveTab('plans')}
                                            className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all uppercase ${activeTab === 'plans'
                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            Plans & Pricing
                                            {activeTab === 'plans' && (
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-full shadow-[0_-2px_6px_rgba(99,102,241,0.4)]" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all uppercase ${activeTab === 'history'
                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            Billing History
                                            {activeTab === 'history' && (
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-full shadow-[0_-2px_6px_rgba(99,102,241,0.4)]" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 md:p-12 lg:p-16 flex-1">
                                    {/* PLANS TAB CONTENT */}
                                    {activeTab === 'plans' && (
                                        <div className="animate-fade-in max-w-6xl mx-auto">
                                            {/* Header Section */}
                                            <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16 animate-slide-down-top">
                                                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 tracking-tight text-gradient-premium">
                                                    Upgrade your business
                                                </h1>
                                                <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-light px-4">
                                                    Unlock powerful tools to manage and grow your store. <br className="hidden md:block" />
                                                    Simple pricing, no hidden fees.
                                                </p>
                                            </div>

                                            {/* Billing Toggle */}
                                            <div className="flex justify-center mb-12 md:mb-20 animate-fade-in animation-delay-500">
                                                <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 md:p-1.5 rounded-full inline-flex relative shadow-inner">
                                                    <div
                                                        className={`absolute inset-y-1 md:inset-y-1.5 rounded-full bg-white dark:bg-slate-700 shadow-sm transition-all duration-300 ease-spring ${isAnnual ? 'left-[calc(50%)] w-[calc(50%-4px)] md:w-[calc(50%-6px)]' : 'left-1 md:left-1.5 w-[calc(50%-4px)] md:w-[calc(50%-6px)]'
                                                            }`}
                                                    />
                                                    <button
                                                        onClick={() => setIsAnnual(false)}
                                                        className={`relative z-10 px-4 py-2 md:px-8 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-colors duration-300 ${!isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                            }`}
                                                    >
                                                        Monthly
                                                    </button>
                                                    <button
                                                        onClick={() => setIsAnnual(true)}
                                                        className={`relative z-10 px-4 py-2 md:px-8 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-colors duration-300 flex items-center gap-2 ${isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                            }`}
                                                    >
                                                        Annual
                                                        <span className="text-[9px] md:text-[10px] font-black bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-1.5 md:px-2 py-0.5 rounded-full shadow-sm">
                                                            -20%
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Plans Grid */}
                                            <div id="plans-grid">
                                                {fetchingPlans ? (
                                                    <div className="grid md:grid-cols-3 gap-8 items-start">
                                                        <PlanSkeleton />
                                                        <PlanSkeleton />
                                                        <PlanSkeleton />
                                                    </div>
                                                ) : (
                                                    <div className="grid md:grid-cols-3 gap-8 items-start relative perspective-1000">
                                                        {plans.map((plan, index) => (
                                                            <div key={plan.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
                                                                <PlanCard
                                                                    plan={plan}
                                                                    isAnnual={isAnnual}
                                                                    isFeatured={plan.id === 'plan_pro'}
                                                                    isActive={user?.subscriptionPlan === plan.id}
                                                                    isLoading={loading}
                                                                    isSelected={selectedPlan === plan.id}
                                                                    onSelect={handleSelectPlan}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* FAQ Section */}
                                            <div className="mt-24 pt-16 border-t border-slate-200/50 dark:border-slate-800/50">
                                                <FAQSection />
                                            </div>
                                        </div>
                                    )}

                                    {/* HISTORY TAB CONTENT */}
                                    {activeTab === 'history' && (
                                        <div className="animate-fade-in max-w-4xl mx-auto">
                                            {user?.currentStoreId ? (
                                                <SubscriptionHistory storeId={user.currentStoreId} />
                                            ) : (
                                                <div className="text-center py-20">
                                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a Store</h3>
                                                    <p className="text-slate-500 max-w-sm mx-auto">Please select a store from the sidebar to view its billing history.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-8" />
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
