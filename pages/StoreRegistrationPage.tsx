import React, { useMemo, useState, useEffect } from 'react';
import { SnackbarType } from '../App';
import { registerStoreAndRefreshUser, checkStoreNameAvailability } from '../services/storesService';
import { login, register, verifyRegistration } from '../services/authService';
import { User } from '../types';
import Logo from '../assets/salepilot.png';
import LocationPicker from '../components/ui/LocationPicker';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineBuildingStorefront,
    HiOutlinePhone,
    HiOutlineShieldCheck,
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiCheckCircle,
    HiOutlineCheckCircle,
    HiOutlineEnvelope,
    HiOutlineLockClosed,
    HiOutlineUser,
    HiOutlineEye,
    HiOutlineEyeSlash,
} from 'react-icons/hi2';

/**
 * The single registration surface (rendered at /register by Dashboard).
 *
 * Two entry points, one component:
 *   • Unauthenticated "Create Account" (requireAccount) — collects account
 *     details, verifies the email via OTP, logs in, THEN creates the store.
 *   • Authenticated but store-less (e.g. first Google sign-in) — the account
 *     already exists and its email is verified, so it goes straight to store
 *     creation (the account step is skipped).
 */
interface StoreRegistrationPageProps {
    onCompleted: (user: User) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    /** True when the visitor is not yet authenticated (create the account first). */
    requireAccount?: boolean;
}

const MIN_LEN = 2;

// Mirrors s-back/src/utils/initial-data.ts BUSINESS_TYPES — the ids drive
// which category templates the backend seeds for the new store.
export const BUSINESS_TYPES = [
    { id: 'retail_grocery',     label: 'Grocery & Supermarket', icon: '🛒' },
    { id: 'retail_fashion',     label: 'Fashion & Apparel',     icon: '👗' },
    { id: 'retail_electronics', label: 'Electronics & Gadgets', icon: '📱' },
    { id: 'food_beverage',      label: 'Restaurant / Cafe',     icon: '☕' },
    { id: 'pharmacy',           label: 'Pharmacy & Health',     icon: '💊' },
    { id: 'hardware',           label: 'Hardware & Auto',       icon: '🔧' },
    { id: 'other',              label: 'Other',                 icon: '✨' },
];

type StepKey = 'account' | 'store' | 'type' | 'location';

const STORE_STEPS: { key: StepKey; label: string }[] = [
    { key: 'store',    label: 'Store Info' },
    { key: 'type',     label: 'Business Type' },
    { key: 'location', label: 'Location' },
];

const ASIDE_FEATURES = [
    'Cloud-synced inventory across all devices',
    'Instant hardware integration (Printers & Scanners)',
    '24/7 dedicated support for shop owners',
];

const emailIsValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const StoreRegistrationPage: React.FC<StoreRegistrationPageProps> = ({ onCompleted, showSnackbar, requireAccount = false }) => {
    const navigate = useNavigate();

    // The step list gains a leading "Create Account" step only when the visitor
    // is not yet authenticated.
    const steps = useMemo(
        () => (requireAccount ? [{ key: 'account' as StepKey, label: 'Create Account' }, ...STORE_STEPS] : STORE_STEPS),
        [requireAccount],
    );

    const [currentStep, setCurrentStep] = useState(0); // 0-based index into `steps`

    // Account state (unauthenticated flow only)
    const [ownerName, setOwnerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPendingOtp, setIsPendingOtp] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');

    // Store state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Capture a referral code from the invite link (?ref=CODE / ?referral=CODE).
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref') || params.get('referral');
        if (ref) setReferralCode(ref.toUpperCase());
    }, []);

    const trimmedName = useMemo(() => name.replace(/\s+/g, ' ').trim(), [name]);

    const isAccountValid = emailIsValid(email) && password.length >= 8 && password === confirmPassword;
    const isStoreValid = trimmedName.length >= MIN_LEN && !nameError && !isCheckingName;
    const isTypeValid = selectedTypes.length > 0;
    const isLocationValid = address.trim().length > 0;

    // Real-time store name availability
    useEffect(() => {
        if (trimmedName.length < MIN_LEN) {
            setNameError(null);
            setIsCheckingName(false);
            return;
        }
        setIsCheckingName(true);
        setNameError(null);
        const timer = setTimeout(async () => {
            try {
                const isAvailable = await checkStoreNameAvailability(trimmedName);
                if (!isAvailable) setNameError('This store name is already taken. Please choose another.');
                else setNameError(null);
            } catch (err) {
                console.error('Check failed', err);
            } finally {
                setIsCheckingName(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [trimmedName]);

    const toggleType = (id: string) => {
        setSelectedTypes(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]));
    };

    // ── Account step: create the account and send the verification code ──
    const submitAccount = async () => {
        setError(null);
        if (!emailIsValid(email)) { setError('Please enter a valid email address.'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match — please check and try again.'); return; }
        setIsLoading(true);
        try {
            const accountName = ownerName.trim() || email.trim().split('@')[0];
            await register(accountName, email.trim(), password, referralCode.trim() || undefined);
            setIsPendingOtp(true);
            showSnackbar('We sent a 6-digit code to your email.', 'info');
        } catch (err: any) {
            const msg = err?.message ?? 'Could not create your account.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Account step: verify the code, log in, advance to store creation ──
    const verifyOtp = async () => {
        setError(null);
        if (emailOtp.length < 4) { setError('Please enter the verification code from your email.'); return; }
        setIsLoading(true);
        try {
            await verifyRegistration(email.trim(), emailOtp);
            await login(email.trim(), password); // now authenticated for the store call
            setIsPendingOtp(false);
            setEmailOtp('');
            setCurrentStep(s => s + 1); // move on to the first store step
        } catch (err: any) {
            const msg = err?.message ?? 'Verification failed. Please try again.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateStore = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { store, user } = await registerStoreAndRefreshUser(trimmedName, selectedTypes, phone, address);
            showSnackbar(`Store "${store.name}" created — welcome aboard! 🎉`, 'success');
            onCompleted(user);
        } catch (err: any) {
            const msg = err?.message || 'Failed to register store';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const currentKey = steps[currentStep].key;

    const handleNext = () => {
        setError(null);
        if (currentKey === 'account') {
            if (isPendingOtp) return verifyOtp();
            return submitAccount();
        }
        if (currentKey === 'store' && isStoreValid) return setCurrentStep(s => s + 1);
        if (currentKey === 'type' && isTypeValid) return setCurrentStep(s => s + 1);
        if (currentKey === 'location' && isLocationValid) return handleCreateStore();
    };

    const handleBack = () => {
        setError(null);
        if (currentKey === 'account' && isPendingOtp) {
            setIsPendingOtp(false);
            setEmailOtp('');
            return;
        }
        if (currentStep > 0) setCurrentStep(s => s - 1);
    };

    const progress = ((currentStep + 1) / steps.length) * 100;

    const isCurrentActionable = (() => {
        if (currentKey === 'account') return isPendingOtp ? emailOtp.length >= 4 : isAccountValid;
        if (currentKey === 'store') return isStoreValid;
        if (currentKey === 'type') return isTypeValid;
        return isLocationValid;
    })();

    const nextLabel = (() => {
        if (currentKey === 'account') return isPendingOtp ? 'Verify & Continue' : `Next: ${steps[currentStep + 1]?.label ?? 'Store Info'}`;
        if (currentKey === 'location') return 'Create Store';
        return `Next: ${steps[currentStep + 1]?.label ?? ''}`;
    })();

    const heading = isPendingOtp ? 'Verify your email' : steps[currentStep].label;

    return (
        <div className="min-h-screen bg-mesh-light flex flex-col">
            {/* Ambient glows */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-primary/8 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-warning/10 blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 sticky top-0 bg-background/80 dark:bg-background/90 backdrop-blur-md border-b border-brand-border/50 flex items-center justify-between h-20 px-6 md:px-10">
                <img src={Logo} alt="SalePilot" className="h-8 object-contain" />
                <div className="flex items-center gap-5">
                    <span className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-brand-text-muted">
                        <HiOutlineShieldCheck className="w-4 h-4 text-primary" />
                        Secure Onboarding
                    </span>
                    {requireAccount && (
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="px-5 py-2 rounded-full bg-surface border border-brand-border text-sm font-bold text-primary hover:bg-surface-variant transition-all duration-200 active:scale-95"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </header>

            {/* Main */}
            <main className="relative z-10 flex-1 w-full max-w-[1080px] mx-auto px-4 md:px-8 py-10">

                {/* Progress section */}
                <div className="mb-10">
                    <div className="flex items-end justify-between gap-4 mb-4">
                        <div>
                            <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-primary mb-1">
                                Step {currentStep + 1} of {steps.length}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-text">
                                {heading}
                            </h2>
                        </div>
                        {currentStep < steps.length - 1 && !isPendingOtp && (
                            <p className="hidden sm:block text-sm text-brand-text-muted pb-1">
                                Next: {steps[currentStep + 1].label}
                            </p>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-warm-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Step dots */}
                    <div className="flex gap-2 mt-3">
                        {steps.map((s, i) => (
                            <div key={s.key} className={`flex items-center gap-2 ${i < steps.length - 1 ? 'flex-1' : ''}`}>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 ${i <= currentStep ? 'bg-primary' : 'bg-warm-300 dark:bg-white/20'}`} />
                                {i < steps.length - 1 && (
                                    <div className={`flex-1 h-px transition-all duration-500 ${i < currentStep ? 'bg-primary' : 'bg-warm-200 dark:bg-white/10'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Two-column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-8 lg:gap-12 items-start">

                    {/* ── Form canvas ── */}
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-warm-200 dark:border-white/8 rounded-3xl p-7 md:p-9 shadow-xl shadow-warm-900/6">

                        {/* Error banner */}
                        {error && (
                            <div className="mb-6 p-3.5 bg-danger-muted dark:bg-danger/10 border border-danger/20 rounded-2xl animate-in slide-in-from-top-2">
                                <p className="text-xs font-bold text-danger text-center uppercase tracking-wide">{error}</p>
                            </div>
                        )}

                        {/* ── Account step ── */}
                        {currentKey === 'account' && !isPendingOtp && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Owner name */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">
                                        Your Name <span className="normal-case font-semibold text-brand-text-muted/60 tracking-normal">(optional)</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlineUser className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="text" autoFocus
                                            className="block w-full pl-11 pr-4 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                            placeholder="e.g. Jane Banda"
                                            value={ownerName}
                                            onChange={(e) => setOwnerName(e.target.value)}
                                            autoComplete="name"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-xs text-brand-text-muted pl-1">Shown on your account. Defaults to your email name if left blank.</p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">Your Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlineEnvelope className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="email" required
                                            className="block w-full pl-11 pr-4 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                            placeholder="example@gmail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlineLockClosed className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'} required
                                            className="block w-full pl-11 pr-12 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                            placeholder="Create a strong password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-text-muted hover:text-brand-text transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <p className="mt-1.5 text-xs text-brand-text-muted pl-1">At least 8 characters.</p>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">Confirm Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlineLockClosed className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'} required
                                            className="block w-full pl-11 pr-12 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                            placeholder="Re-enter password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-text-muted hover:text-brand-text transition-colors"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="mt-1.5 text-xs text-danger font-bold pl-1">Passwords do not match.</p>
                                    )}
                                </div>

                                {/* Referral Code */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">
                                        Referral Code <span className="normal-case font-semibold text-brand-text-muted/60 tracking-normal">(optional)</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlineUser className="h-5 w-5 text-brand-text-muted/50 group-focus-within:text-primary/60 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-11 pr-4 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                            placeholder="Enter referral code"
                                            value={referralCode}
                                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Account step: OTP ── */}
                        {currentKey === 'account' && isPendingOtp && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="text-center mb-2">
                                    <div className="w-16 h-16 bg-success-muted dark:bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <HiOutlineEnvelope className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="text-sm text-brand-text-muted leading-relaxed">
                                        We sent a 6-digit code to<br />
                                        <strong className="font-bold text-brand-text">{email}</strong>
                                    </p>
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    autoFocus
                                    className="block w-full px-4 py-5 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-2xl font-extrabold text-center tracking-[0.5em] outline-none"
                                    placeholder="──────"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {/* ── Step: Store Info ── */}
                        {currentKey === 'store' && (
                            <div className="space-y-5 animate-fade-in">
                                {/* Store Name */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">
                                        Store Name <span className="text-danger normal-case font-bold tracking-normal">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlineBuildingStorefront className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            minLength={MIN_LEN}
                                            autoFocus
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={`block w-full pl-11 pr-10 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 transition-all text-sm font-semibold outline-none ${
                                                nameError
                                                    ? 'ring-2 ring-danger/30 bg-danger-muted/40 dark:bg-danger/5'
                                                    : 'focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09]'
                                            }`}
                                            placeholder="e.g., Downtown Minimart"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                            {isCheckingName ? (
                                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            ) : nameError ? (
                                                <span className="text-danger text-lg">✕</span>
                                            ) : isStoreValid ? (
                                                <HiOutlineCheckCircle className="w-5 h-5 text-primary" />
                                            ) : null}
                                        </div>
                                    </div>
                                    {nameError && (
                                        <p className="mt-1.5 text-xs text-danger font-bold pl-1">{nameError}</p>
                                    )}
                                    {!nameError && (
                                        <p className="mt-1.5 text-xs text-brand-text-muted pl-1">This is what your customers and staff will see.</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">
                                        Store Phone <span className="normal-case font-semibold text-brand-text-muted/60 tracking-normal">(optional)</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlinePhone className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                            placeholder="e.g., +260 971 234 567"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-xs text-brand-text-muted pl-1">Used for customer receipts and official communication.</p>
                                </div>
                            </div>
                        )}

                        {/* ── Step: Business Type ── */}
                        {currentKey === 'type' && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="mb-2">
                                    <p className="text-sm text-brand-text-muted">Select all categories that best describe your store.</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {BUSINESS_TYPES.map((type) => {
                                        const active = selectedTypes.includes(type.id);
                                        return (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => toggleType(type.id)}
                                                className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                                                    active
                                                        ? 'border-primary bg-success-muted dark:bg-primary/10 shadow-md shadow-primary/10'
                                                        : 'border-warm-200 dark:border-white/10 bg-warm-100 dark:bg-white/[0.04] hover:border-warm-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <span className="text-3xl">{type.icon}</span>
                                                <span className={`text-xs font-bold text-center leading-tight ${active ? 'text-primary' : 'text-brand-text-muted'}`}>
                                                    {type.label}
                                                </span>
                                                {active && (
                                                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedTypes.length === 0 && (
                                    <div className="flex items-center gap-2 p-3 bg-warning/8 border border-warning/20 rounded-xl">
                                        <span className="text-warning text-sm">⚠</span>
                                        <p className="text-xs font-bold text-brand-text-muted">Please select at least one category to continue.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step: Location ── */}
                        {currentKey === 'location' && (
                            <div className="space-y-5 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">
                                        Store Location <span className="text-danger normal-case font-bold tracking-normal">*</span>
                                    </label>
                                    <LocationPicker
                                        onLocationSelect={(loc) => setAddress(loc.address)}
                                        initialAddress={address}
                                    />
                                    {!address && (
                                        <div className="mt-3 flex items-center gap-2 p-3 bg-warning/8 border border-warning/20 rounded-xl">
                                            <span className="text-warning text-sm">⚠</span>
                                            <p className="text-xs font-bold text-brand-text-muted">Please set your store location to continue.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Summary of previous steps */}
                                <div className="mt-2 p-5 bg-warm-100 dark:bg-white/[0.04] border border-warm-200 dark:border-white/8 rounded-2xl space-y-3">
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-text-muted mb-3">Summary so far</p>
                                    <div className="flex items-center gap-3">
                                        <HiOutlineBuildingStorefront className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span className="text-sm font-semibold text-brand-text truncate">{name || '—'}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <HiOutlineCheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                        <span className="text-sm font-semibold text-brand-text">
                                            {selectedTypes.length > 0
                                                ? selectedTypes.map(id => BUSINESS_TYPES.find(t => t.id === id)?.label).join(', ')
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Action buttons ── */}
                        <div className="flex items-center gap-3 mt-8">
                            {(currentStep > 0 || isPendingOtp) && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-5 py-4 bg-surface border border-brand-border rounded-2xl text-sm font-bold text-brand-text hover:bg-surface-variant transition-all duration-200 active:scale-95 disabled:opacity-50"
                                >
                                    <HiOutlineArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={!isCurrentActionable || isLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-secondary hover:bg-[#e86d12] disabled:bg-warm-300 dark:disabled:bg-white/10 text-white rounded-2xl font-extrabold uppercase tracking-[0.12em] text-[11px] shadow-lg shadow-primary/25 disabled:shadow-none transition-all active:scale-[0.98] hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <>
                                        {nextLabel}
                                        <HiOutlineArrowRight className="w-4 h-4" />
                                    </>
                                }
                            </button>
                        </div>

                        <p className="mt-4 text-center text-xs text-brand-text-muted">
                            Step {currentStep + 1} of {steps.length} — You can edit these details later in Settings.
                        </p>
                    </div>

                    {/* ── Visual aside ── */}
                    <aside className="hidden lg:flex flex-col gap-5 lg:sticky lg:top-[104px]">
                        {/* Bento card */}
                        <div className="relative rounded-3xl overflow-hidden min-h-[420px] shadow-2xl shadow-sp-green/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#001944] via-[#1a428a] to-[#002b6b]" />
                            {/* Decorative orbs */}
                            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
                            <div className="absolute top-8 right-8 w-24 h-24 rounded-full bg-sp-amber/20 blur-sm" />
                            <div className="absolute bottom-24 left-4 w-16 h-16 rounded-full bg-white/5" />
                            {/* Grid pattern */}
                            <div
                                className="absolute inset-0 opacity-[0.04]"
                                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                            />

                            {/* Mock stat cards */}
                            <div className="absolute top-8 left-6 right-6 grid grid-cols-2 gap-3">
                                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3.5">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Revenue</p>
                                    <p className="text-white text-xl font-extrabold tracking-tight">K2.4M</p>
                                    <p className="text-sp-amber-light text-[10px] font-bold mt-1">↑ 18% this month</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3.5">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Products</p>
                                    <p className="text-white text-xl font-extrabold tracking-tight">1,240</p>
                                    <p className="text-white/50 text-[10px] font-bold mt-1">Across 8 categories</p>
                                </div>
                            </div>

                            {/* Bottom content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-7">
                                <span className="self-start bg-primary/70 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                                    Trusted by 5k+ stores
                                </span>
                                <h3 className="text-white text-2xl font-extrabold tracking-tight leading-tight mb-5">
                                    Your retail journey<br />starts here.
                                </h3>
                                <ul className="space-y-3">
                                    {ASIDE_FEATURES.map(f => (
                                        <li key={f} className="flex items-start gap-3 text-sm text-white/90">
                                            <HiCheckCircle className="w-5 h-5 text-sp-amber flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Step checklist */}
                        <div className="p-5 bg-white/80 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-warm-200 dark:border-white/8">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-text-muted mb-3">Your progress</p>
                            <ul className="space-y-2.5">
                                {steps.map((step, i) => {
                                    const done = i < currentStep;
                                    const active = i === currentStep;
                                    return (
                                        <li key={step.key} className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                done ? 'bg-primary' : active ? 'border-2 border-primary bg-transparent' : 'border-2 border-warm-300 dark:border-white/20 bg-transparent'
                                            }`}>
                                                {done && (
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                                {active && <div className="w-2 h-2 rounded-full bg-primary" />}
                                            </div>
                                            <span className={`text-sm font-semibold ${done ? 'text-primary' : active ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                                                {step.label}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 mt-auto border-t border-brand-border bg-surface/80 dark:bg-surface/40 backdrop-blur-sm px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-brand-text-muted">© 2026 SalePilot Inc. All rights reserved.</p>
                <div className="flex gap-5">
                    <a href="#" className="text-xs text-brand-text-muted hover:text-primary transition-colors font-semibold">Help Center</a>
                    <a href="/privacy" className="text-xs text-brand-text-muted hover:text-primary transition-colors font-semibold">Privacy Policy</a>
                    <a href="#" className="text-xs text-brand-text-muted hover:text-primary transition-colors font-semibold">Terms of Service</a>
                </div>
            </footer>
        </div>
    );
};

export default StoreRegistrationPage;
