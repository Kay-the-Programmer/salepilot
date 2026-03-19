// pages/RegisterPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    features: string[];
    isPopular?: boolean;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'plan_basic',
        name: 'Basic',
        price: 99,
        currency: 'ZMW',
        description: 'Essential features for small businesses',
        features: [
            'Up to 100 Products',
            'Basic Sales Reports',
            '1 User Account',
            '50 AI Requests/month',
            'Email Support'
        ]
    },
    {
        id: 'plan_pro',
        name: 'Pro',
        price: 249,
        currency: 'ZMW',
        description: 'Advanced tools for growing stores',
        features: [
            'Unlimited Products',
            'Advanced Analytics',
            'Up to 5 User Accounts',
            '500 AI Requests/month',
            'Inventory Alerts',
            'Priority Support'
        ],
        isPopular: true
    },
    {
        id: 'plan_enterprise',
        name: 'Enterprise',
        price: 599,
        currency: 'ZMW',
        description: 'Complete solution for large operations',
        features: [
            'Unlimited Everything',
            'Custom Reports',
            'Unlimited AI Requests',
            'Dedicated Account Manager',
            'API Access',
            'Multi-store Management'
        ]
    }
];

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        storeName: '',
        subdomain: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        verificationOtp: ''
    });
    const [selectedPlanId, setSelectedPlanId] = useState('plan_basic');
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'MOBILE_MONEY' | 'LENCO'>('LENCO');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Load Lenco Script
        const scriptId = 'lenco-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://js.lenco.co/v1/inline.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const nextStep = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2) setStep(3);
        else if (step === 3) setStep(4);
    };

    const prevStep = () => setStep(step - 1);

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.storeName.trim()) newErrors.storeName = 'Store name is required';
        if (!formData.subdomain.trim()) newErrors.subdomain = 'Subdomain is required';
        else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) newErrors.subdomain = 'Lowercase letters, numbers, hyphens only';
        if (!formData.ownerName.trim()) newErrors.ownerName = 'Your name is required';
        if (!formData.ownerEmail.trim()) {
            newErrors.ownerEmail = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
            newErrors.ownerEmail = 'Email is invalid';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'At least 8 characters';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLencoPayment = (paymentInfo: any, plan: SubscriptionPlan) => {
        if (!(window as any).LencoPay) {
            setErrors({ submit: 'Payment service not loaded. Please refresh.' });
            return;
        }

        (window as any).LencoPay.getPaid({
            key: import.meta.env.VITE_LENCO_PUBLIC_KEY,
            reference: paymentInfo.reference,
            email: formData.ownerEmail,
            amount: plan.price,
            currency: plan.currency,
            channels: [paymentMethod.toLowerCase() === 'mobile_money' ? 'mobile-money' : 'card'],
            customer: { phone: formData.phone },
            onSuccess: (res: any) => {
                console.log('Payment success', res);
                window.location.href = `https://${paymentInfo.store.subdomain}.salepilot.app/dashboard`;
            },
            onClose: () => {
                setIsLoading(false);
                // Even if payment is closed, we should probably allow them to verify email if they haven't
                setStep(4);
                setErrors({ submit: 'Payment window closed. Please complete payment to activate your store, but first verify your email.' });
            }
        });
    };

    const handleVerifyOtp = async () => {
        setIsLoading(true);
        try {
            await api.post('/auth/verify-registration', {
                email: formData.ownerEmail,
                emailOtp: formData.verificationOtp
            });

            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                localStorage.setItem('user', JSON.stringify({ ...user, isVerified: true }));
            }

            // After verification, redirect to the store subdomain
            const storeSubdomain = formData.subdomain;
            window.location.href = `https://${storeSubdomain}.salepilot.app/dashboard`;
        } catch (error: any) {
            setErrors({ submit: error.message || 'Verification failed.' });
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await api.post('/auth/resend-verification', { email: formData.ownerEmail });
            alert('Verification code resent to your email.');
        } catch (error: any) {
            setErrors({ submit: error.message || 'Failed to resend code.' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) return nextStep();
        if (step === 4) return handleVerifyOtp();

        setIsLoading(true);
        try {
            const response = await api.post<any>('/stores/register', {
                name: formData.storeName,
                subdomain: formData.subdomain,
                ownerName: formData.ownerName,
                ownerEmail: formData.ownerEmail,
                password: formData.password,
                phone: formData.phone,
                address: formData.address,
                planId: selectedPlanId,
                paymentMethod: paymentMethod
            });

            // Store token/user
            localStorage.setItem('user', JSON.stringify(response.user));
            if (response.user.token) localStorage.setItem('token', response.user.token);

            if (response.payment && response.payment.reference) {
                const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId)!;
                handleLencoPayment(response, plan);
            } else {
                // Free plan or already activated -> Go to verification
                setStep(4);
            }
        } catch (error: any) {
            setErrors({ submit: error.message || 'Registration failed.' });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-google transition-colors duration-500 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto w-full relative z-10">
                {/* Steps Header */}
                <div className="flex justify-between items-center mb-12 max-w-lg mx-auto relative px-4">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex flex-col items-center relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                {s}
                            </div>
                            <span className={`mt-2 text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                {s === 1 ? 'Store' : s === 2 ? 'Plan' : s === 3 ? 'Confirm' : 'Verify'}
                            </span>
                        </div>
                    ))}
                    <div className="absolute top-5 left-8 right-8 h-[2px] bg-slate-200 dark:bg-slate-800 -z-1" />
                    <div className="absolute top-5 left-8 h-[2px] bg-slate-900 dark:bg-white transition-all duration-500 -z-1" style={{ width: `${(step - 1) * 33.33}%` }} />
                </div>

                <div className="liquid-glass-card rounded-[2.5rem] bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800/50 p-8 md:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none animate-in fade-in zoom-in duration-500">
                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tell us about your store</h2>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">Setup your basic details to get started</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Store Name" name="storeName" value={formData.storeName} onChange={handleChange} error={errors.storeName} placeholder="Apple Store Lusaka" />
                                    <InputField label="Subdomain" name="subdomain" value={formData.subdomain} onChange={handleChange} error={errors.subdomain} placeholder="apple-lusaka" suffix=".salepilot.app" />
                                    <InputField label="Your Full Name" name="ownerName" value={formData.ownerName} onChange={handleChange} error={errors.ownerName} placeholder="John Doe" />
                                    <InputField label="Email Address" name="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleChange} error={errors.ownerEmail} placeholder="john@example.com" />
                                    <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="••••••••" />
                                    <InputField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="••••••••" />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in slide-in-from-right-8 duration-500">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Select your plan</h2>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">Scale your business with the right tools</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {SUBSCRIPTION_PLANS.map(plan => (
                                        <PlanCard key={plan.id} plan={plan} isSelected={selectedPlanId === plan.id} onSelect={() => setSelectedPlanId(plan.id)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in slide-in-from-right-8 duration-500 max-w-md mx-auto">
                                <div className="text-center mb-10">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">One last thing</h2>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">Confirm your details and activate store</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 mb-8 border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formData.storeName}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId)?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Today</span>
                                        <span className="text-xl font-black text-slate-900 dark:text-white">{SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId)?.currency} {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId)?.price}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <InputField label="Phone Number (for billing)" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="097..." />
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-2">Payment Method</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <MethodButton active={paymentMethod === 'MOBILE_MONEY'} onClick={() => setPaymentMethod('MOBILE_MONEY')} label="Mobile Money" icon="📱" />
                                            <MethodButton active={paymentMethod === 'CARD'} onClick={() => setPaymentMethod('CARD')} label="Card" icon="💳" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-in slide-in-from-right-8 duration-500 max-w-md mx-auto">
                                <div className="text-center mb-10">
                                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Verify your email</h2>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">We sent a 6-digit code to {formData.ownerEmail}</p>
                                </div>

                                <div className="space-y-6">
                                    <InputField
                                        label="Verification Code"
                                        name="verificationOtp"
                                        value={formData.verificationOtp}
                                        onChange={handleChange}
                                        error={errors.verificationOtp}
                                        placeholder="123456"
                                        className="text-center text-2xl tracking-[0.5em] font-black"
                                    />
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
                                        >
                                            Didn't receive code? Resend
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-12 flex flex-col md:flex-row gap-4">
                            {step > 1 && (
                                <button type="button" onClick={prevStep} className="w-full md:w-1/3 py-5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                    Back
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`flex-1 py-5 px-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transform transition-all active:scale-[0.98] hover:translate-y-[-2px] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin mx-auto" /> : (step === 3 ? 'ACTIVATE & PAY' : step === 4 ? 'VERIFY & FINISH' : 'CONTINUE')}
                            </button>
                        </div>
                        {errors.submit && <p className="mt-6 text-center text-[10px] font-bold text-rose-500 uppercase tracking-widest">{errors.submit}</p>}
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Already joined?{' '}
                        <button onClick={() => navigate('/login')} className="text-blue-600 dark:text-blue-400 hover:underline">Sign In</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

const InputField: React.FC<any> = ({ label, error, suffix, ...props }) => (
    <div>
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-2">{label}</label>
        <div className="relative group">
            <div className={`flex items-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 transition-all ${error ? 'border-rose-500/50' : 'border-transparent focus-within:border-blue-500/20 focus-within:bg-white dark:focus-within:bg-slate-800'}`}>
                <input {...props} className="block w-full px-5 py-4 bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0 text-sm font-bold" />
                {suffix && <span className="pr-5 text-xs font-bold text-slate-400">{suffix}</span>}
            </div>
            {error && <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-wider px-2">{error}</p>}
        </div>
    </div>
);

const PlanCard: React.FC<any> = ({ plan, isSelected, onSelect }) => (
    <div onClick={onSelect} className={`relative p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 h-full flex flex-col ${isSelected ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/5 scale-[1.02] shadow-xl' : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'}`}>
        {plan.isPopular && <div className="absolute top-0 right-8 transform translate-y-[-50%] bg-blue-600 text-[9px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest">Best Value</div>}
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">{plan.name}</h3>
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-6">{plan.description}</p>
        <div className="mb-6">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{plan.currency} {plan.price}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">/mo</span>
        </div>
        <ul className="space-y-3 mb-8 flex-1">
            {plan.features.map((f: string, i: number) => (
                <li key={i} className="flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    <svg className="w-3 h-3 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    {f}
                </li>
            ))}
        </ul>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center self-end transition-all ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
        </div>
    </div>
);

const MethodButton: React.FC<any> = ({ active, onClick, label, icon }) => (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${active ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/5' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50'}`}>
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{label}</span>
    </button>
);

export default RegisterPage;
