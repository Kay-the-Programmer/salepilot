import { useState, FormEvent, useEffect, useRef } from 'react';
import { User } from '../types';
import { SnackbarType } from '../App';
import { login, register, loginWithGoogle, verifyRegistration, getCurrentUser } from '../services/authService';
import { registerStoreAndRefreshUser, checkStoreNameAvailability } from '../services/storesService';
import { signInWithGoogle } from '../services/firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    HiOutlineEnvelope,
    HiOutlineLockClosed,
    HiOutlineUser,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlineCheckCircle,
    HiOutlineMapPin,
    HiOutlineBuildingStorefront,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
} from 'react-icons/hi2';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../assets/logo.png';
import AsideArt from '../assets/hkj.png';
import { BUSINESS_TYPES } from './StoreRegistrationPage';

interface LoginPageProps {
    onLogin: (user: User) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
}

const WIZARD_STEPS = ['Business Profile', 'Secure Account', 'Confirm & Launch'] as const;

export default function LoginPage({ onLogin, showSnackbar }: LoginPageProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const initialView = location.pathname.endsWith('/register') ? 'register' : 'login';
    const [view, setView] = useState<'login' | 'register'>(initialView);

    // Shared form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // OTP step
    const [isPendingOTP, setIsPendingOTP] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');

    // Loading / error
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Register wizard state
    const [wizardStep, setWizardStep] = useState(0);
    const [ownerName, setOwnerName] = useState('');
    const [category, setCategory] = useState('');
    const [storeLocation, setStoreLocation] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [stepError, setStepError] = useState<string | null>(null);

    // Live business-name availability (same behaviour as the in-app store setup)
    const [nameTaken, setNameTaken] = useState(false);
    const [checkingName, setCheckingName] = useState(false);
    const nameCheckSeq = useRef(0);

    useEffect(() => {
        const trimmed = name.trim();
        if (view !== 'register' || trimmed.length < 2) {
            setNameTaken(false);
            setCheckingName(false);
            return;
        }
        setCheckingName(true);
        const seq = ++nameCheckSeq.current;
        const t = setTimeout(() => {
            checkStoreNameAvailability(trimmed)
                .then(available => { if (seq === nameCheckSeq.current) setNameTaken(!available); })
                .catch(() => { /* soft check; server re-validates on submit */ })
                .finally(() => { if (seq === nameCheckSeq.current) setCheckingName(false); });
        }, 450);
        return () => clearTimeout(t);
    }, [name, view]);

    useEffect(() => {
        setIsPendingOTP(false);
        setEmailOtp('');
        setError(null);
        setStepError(null);
        if (view === 'register') {
            setWizardStep(0);
            setCategory('');
            setStoreLocation('');
            setConfirmPassword('');
        }
    }, [view]);

    useEffect(() => {
        if (location.pathname.endsWith('/register')) setView('register');
        else if (location.pathname.endsWith('/login')) setView('login');

        const params = new URLSearchParams(location.search);
        const ref = params.get('ref') || params.get('referral');
        if (ref) {
            setReferralCode(ref.toUpperCase());
            if (view !== 'register') setView('register');
        }
    }, [location.pathname, location.search]);

    const switchView = (v: 'login' | 'register') => {
        setView(v);
        setError(null);
        setStepError(null);
        navigate(v === 'register' ? '/register' : '/login', { replace: true });
    };

    // Wizard: advance or submit
    const wizardNext = async () => {
        setStepError(null);

        if (wizardStep === 0) {
            if (!name.trim()) { setStepError('Please enter your store or business name.'); return; }
            if (checkingName) { setStepError('Checking name availability — one moment…'); return; }
            if (nameTaken) { setStepError('That business name is already taken. Please choose another.'); return; }
            setWizardStep(1);
            return;
        }

        if (wizardStep === 1) {
            if (!email.trim()) { setStepError('Please enter your email address.'); return; }
            if (password.length < 8) { setStepError('Password must be at least 8 characters.'); return; }
            if (password !== confirmPassword) { setStepError('Passwords do not match — please check and try again.'); return; }
            setWizardStep(2);
            return;
        }

        // Step 2: submit — the account belongs to the person (owner name),
        // the business name belongs to the store created after verification.
        setIsLoading(true);
        try {
            await register((ownerName.trim() || name.trim()), email.trim(), password, referralCode);
            setIsPendingOTP(true);
            showSnackbar('We sent a 6-digit code to your email.', 'info');
        } catch (err: any) {
            const msg = err?.message ?? 'An unexpected error occurred.';
            setStepError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Login form submit (also handles OTP verify)
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (view === 'login') {
                const user = await login(email, password);
                onLogin(user!);
                showSnackbar(`Welcome back, ${user!.name}!`, 'success');
            } else if (isPendingOTP) {
                if (!emailOtp || emailOtp.length < 4) {
                    throw new Error('Please enter the verification code from your email.');
                }
                await verifyRegistration(email, emailOtp);
                const user = await login(email, password);
                // One registration flow: the store from step 1 is created right
                // here (email is now verified, so the store starts verified too).
                try {
                    const { user: withStore } = await registerStoreAndRefreshUser(
                        name.trim(),
                        category ? [category] : [],
                        undefined,
                        storeLocation.trim() || undefined,
                    );
                    const token = getCurrentUser()?.token;
                    const merged = (token ? { ...withStore, token } : withStore) as User;
                    try { localStorage.setItem('salePilotUser', JSON.stringify(merged)); } catch { /* session already valid */ }
                    onLogin(merged);
                    showSnackbar(`Account created and "${name.trim()}" is ready! Welcome to SalePilot 🎉`, 'success');
                } catch (storeErr: any) {
                    // Account exists and is verified — never strand the user here.
                    // Dashboard routes store-less accounts to /register to finish setup.
                    onLogin(user!);
                    showSnackbar(storeErr?.message || 'Account created — one more step to set up your store.', 'info');
                }
            }
        } catch (err: any) {
            const msg = err?.message ?? 'An unexpected error occurred.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError(null);
        try {
            const firebaseUser = await signInWithGoogle();
            const token = await firebaseUser.getIdToken();
            // Sign-ins from this page are business accounts. A first-time Google
            // user has no store yet — Dashboard routes them to /register (the
            // single store-registration surface) right after login.
            const user = await loginWithGoogle(token, 'business');
            onLogin(user);
            showSnackbar(`Welcome, ${user.name}! 🎉`, 'success');
        } catch (err: any) {
            if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return;
            const msg = err?.message ?? 'Google Sign-In failed. Please try again.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const anyLoading = isLoading || isGoogleLoading;

    // ─── OTP / Login view (centered card) ──────────────────────────────────
    if (view === 'login' || isPendingOTP) {
        return (
            <div className="min-h-screen bg-mesh-light flex flex-col overflow-hidden">
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute top-[-15%] left-[-8%] w-[55%] h-[55%] rounded-full bg-primary/8 blur-[120px]" />
                    <div className="absolute bottom-[-15%] right-[-8%] w-[50%] h-[50%] rounded-full bg-warning/10 blur-[120px]" />
                </div>

                <header className="relative z-10 flex items-center justify-between h-20 px-6 md:px-10">
                    <img src={Logo} alt="SalePilot" className="h-9 object-contain opacity-90 hover:opacity-100 transition-opacity" />
                    {!isPendingOTP && (
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:block text-sm font-semibold text-brand-text-muted">New here?</span>
                            <button
                                type="button"
                                onClick={() => switchView('register')}
                                className="px-5 py-2 rounded-full border border-brand-border bg-surface text-sm font-bold text-brand-text hover:bg-surface-variant transition-all duration-200 active:scale-95"
                            >
                                Create Account
                            </button>
                        </div>
                    )}
                </header>

                <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
                    <div className="w-full max-w-[440px] animate-fade-in">
                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-warm-200 dark:border-white/8 rounded-3xl p-8 shadow-xl shadow-warm-900/6">

                            {isPendingOTP ? (
                                /* ── OTP step ── */
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {error && (
                                        <div className="p-3.5 bg-danger-muted dark:bg-danger/10 border border-danger/20 rounded-2xl">
                                            <p className="text-xs font-bold text-danger text-center uppercase tracking-wide">{error}</p>
                                        </div>
                                    )}
                                    <div className="text-center mb-2">
                                        <div className="w-16 h-16 bg-success-muted dark:bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <HiOutlineEnvelope className="w-8 h-8 text-primary" />
                                        </div>
                                        <h2 className="text-xl font-extrabold text-brand-text">Check your inbox</h2>
                                        <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">
                                            We sent a 6-digit code to<br />
                                            <strong className="font-bold text-brand-text">{email}</strong>
                                        </p>
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        autoFocus
                                        required
                                        className="block w-full px-4 py-5 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-2xl font-extrabold text-center tracking-[0.5em] outline-none"
                                        placeholder="──────"
                                        value={emailOtp}
                                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        disabled={anyLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={anyLoading}
                                        className="w-full py-4 bg-secondary hover:bg-[#e86d12] text-white rounded-2xl font-extrabold uppercase tracking-[0.15em] text-[11px] shadow-lg shadow-primary/25 transition-all active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                                    >
                                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Continue'}
                                    </button>
                                    <button
                                        type="button"
                                        className="w-full text-center text-xs font-bold text-brand-text-muted hover:text-primary transition-colors pt-1"
                                        onClick={() => { setIsPendingOTP(false); setEmailOtp(''); setError(null); }}
                                    >
                                        ← Back to registration
                                    </button>
                                </form>
                            ) : (
                                /* ── Login form ── */
                                <>
                                    <div className="text-center mb-8">
                                        <h1 className="text-2xl font-extrabold tracking-tight text-brand-text">Welcome Back</h1>
                                        <p className="mt-2 text-sm text-brand-text-muted leading-relaxed">
                                            {"Log in to manage your store's performance."}
                                        </p>
                                    </div>

                                    {/* Google */}
                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={anyLoading}
                                        className="w-full flex items-center justify-center gap-3 py-3.5 mb-5 bg-surface dark:bg-white/[0.06] border border-brand-border dark:border-white/10 rounded-2xl text-brand-text text-sm font-bold shadow-sm hover:bg-surface-variant transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isGoogleLoading
                                            ? <div className="w-5 h-5 border-2 border-warm-300 dark:border-warm-700 border-t-primary rounded-full animate-spin" />
                                            : <FcGoogle className="w-5 h-5 flex-shrink-0" />}
                                        <span>{isGoogleLoading ? 'Signing in…' : 'Continue with Google'}</span>
                                    </button>

                                    <div className="relative flex items-center mb-5">
                                        <div className="flex-1 border-t border-brand-border dark:border-white/8" />
                                        <span className="mx-4 text-[10px] font-extrabold text-brand-text-muted uppercase tracking-widest">or</span>
                                        <div className="flex-1 border-t border-brand-border dark:border-white/8" />
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {error && (
                                            <div className="p-3.5 bg-danger-muted dark:bg-danger/10 border border-danger/20 rounded-2xl">
                                                <p className="text-xs font-bold text-danger text-center uppercase tracking-wide">{error}</p>
                                            </div>
                                        )}

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <HiOutlineEnvelope className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                            </div>
                                            <input
                                                type="email" required
                                                className="block w-full pl-11 pr-4 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                                placeholder="Email address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={anyLoading}
                                                autoComplete="username"
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <HiOutlineLockClosed className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'} required
                                                className="block w-full pl-11 pr-12 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={anyLoading}
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-text-muted hover:text-brand-text transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                                tabIndex={-1}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between px-1 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => navigate('/forgot-password')}
                                                className="text-xs font-bold text-brand-text-muted hover:text-primary transition-colors uppercase tracking-wider"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={anyLoading}
                                            className="w-full py-4 bg-secondary hover:bg-[#e86d12] text-white rounded-2xl font-extrabold uppercase tracking-[0.15em] text-[11px] shadow-lg shadow-primary/25 transition-all active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-2"
                                        >
                                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Log in to Dashboard'}
                                        </button>
                                    </form>

                                    <p className="mt-6 text-center text-[10px] text-brand-text-muted leading-relaxed">
                                        Secured by <span className="font-bold">Firebase Auth</span> &amp; end-to-end encryption
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex justify-center flex-wrap gap-5 mt-6">
                            <a href="/privacy" className="text-xs text-brand-text-muted hover:text-primary transition-colors font-semibold">Privacy Policy</a>
                            <a href="#" className="text-xs text-brand-text-muted hover:text-primary transition-colors font-semibold">Terms of Service</a>
                            <a href="#" className="text-xs text-brand-text-muted hover:text-primary transition-colors font-semibold">Contact Support</a>
                        </div>
                    </div>
                </main>

            </div>
        );
    }

    // ─── Register Wizard (full-page layout) ────────────────────────────────
    const progress = ((wizardStep + 1) / WIZARD_STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-mesh-light flex flex-col">
            {/* Ambient glows */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-primary/8 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-warning/10 blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-30 sticky top-0 bg-background/80 dark:bg-background/90 backdrop-blur-md border-b border-brand-border/50 flex items-center justify-between h-20 px-6 md:px-10">
                <img src={Logo} alt="SalePilot" className="h-8 object-contain" />
                <div className="flex items-center gap-5">
                    <span className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-brand-text-muted">
                        <HiOutlineShieldCheck className="w-4 h-4 text-primary" />
                        Secure Onboarding
                    </span>
                    <button
                        type="button"
                        onClick={() => switchView('login')}
                        className="px-5 py-2 rounded-full bg-surface border border-brand-border text-sm font-bold text-primary hover:bg-surface-variant transition-all duration-200 active:scale-95"
                    >
                        Sign In
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="relative z-10 flex-1 w-full max-w-[1080px] mx-auto px-4 md:px-8 py-10">

                {/* Progress section */}
                <div className="mb-10">
                    <div className="flex items-end justify-between gap-4 mb-4">
                        <div>
                            <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-primary mb-1">
                                Step {wizardStep + 1} of {WIZARD_STEPS.length}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-text">
                                {WIZARD_STEPS[wizardStep]}
                            </h2>
                        </div>
                        {wizardStep < WIZARD_STEPS.length - 1 && (
                            <p className="hidden sm:block text-sm text-brand-text-muted pb-1">
                                Next: {WIZARD_STEPS[wizardStep + 1]}
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
                    {/* <div className="flex gap-2 mt-3">
                        {WIZARD_STEPS.map((s, i) => (
                            <div
                                key={s}
                                className={`flex items-center gap-2 ${i < WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}
                            >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 ${i <= wizardStep ? 'bg-primary' : 'bg-warm-300 dark:bg-white/20'}`} />
                                {i < WIZARD_STEPS.length - 1 && (
                                    <div className={`flex-1 h-px transition-all duration-500 ${i < wizardStep ? 'bg-primary' : 'bg-warm-200 dark:bg-white/10'}`} />
                                )}
                            </div>
                        ))}
                    </div> */}
                </div>

                {/* Two-column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-8 lg:gap-12 items-start">

                    {/* ── Form canvas ── */}
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-warm-200 dark:border-white/8 rounded-3xl p-7 md:p-9 shadow-xl shadow-warm-900/6">

                        {/* Step error banner */}
                        {stepError && (
                            <div className="mb-6 p-3.5 bg-danger-muted dark:bg-danger/10 border border-danger/20 rounded-2xl animate-in slide-in-from-top-2">
                                <p className="text-xs font-bold text-danger text-center uppercase tracking-wide">{stepError}</p>
                            </div>
                        )}

                        {/* ── Step 0: Business Profile ── */}
                        {wizardStep === 0 && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Store Name */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">Store / Business Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlineBuildingStorefront className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="text" required autoFocus
                                            className={`block w-full pl-11 pr-10 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 transition-all text-sm font-semibold outline-none ${nameTaken ? 'ring-2 ring-danger/30 bg-danger-muted/40 dark:bg-danger/5' : 'focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09]'}`}
                                            placeholder="e.g. The Artisan Corner"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), wizardNext())}
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                            {checkingName ? (
                                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            ) : nameTaken ? (
                                                <span className="text-danger text-lg">✕</span>
                                            ) : name.trim().length >= 2 ? (
                                                <HiOutlineCheckCircle className="w-5 h-5 text-primary" />
                                            ) : null}
                                        </div>
                                    </div>
                                    {nameTaken && (
                                        <p className="mt-1.5 text-xs text-danger font-bold pl-1">This business name is already taken — please choose another.</p>
                                    )}
                                </div>

                                {/* Business Category */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">Business Category</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlineShoppingBag className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <select
                                            className="block w-full pl-11 pr-10 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none appearance-none cursor-pointer"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        >
                                            <option value="">Select your industry</option>
                                            {BUSINESS_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-brand-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Store Location */}
                                <div>
                                    <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-2">
                                        Store Location <span className="normal-case font-semibold text-brand-text-muted/60 tracking-normal">(optional)</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <HiOutlineMapPin className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-11 pr-4 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                            placeholder="City, State or Physical Address"
                                            value={storeLocation}
                                            onChange={(e) => setStoreLocation(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Info callout */}
                                <div className="flex gap-3 p-4 bg-warning/8 dark:bg-warning/5 border border-warning/20 rounded-2xl">
                                    <span className="material-symbols-rounded text-warning text-xl flex-shrink-0 mt-0.5">auto_awesome</span>
                                    <div>
                                        <p className="text-sm font-bold text-brand-text">Personalized Setup</p>
                                        <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
                                            Based on your location and category, we'll automatically pre-configure local tax rules and inventory templates.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 1: Secure Account ── */}
                        {wizardStep === 1 && (
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
                                    <p className="mt-1.5 text-xs text-brand-text-muted pl-1">Shown on your account. Defaults to the business name if left blank.</p>
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

                        {/* ── Step 2: Confirm & Launch ── */}
                        {wizardStep === 2 && (
                            <div className="space-y-5 animate-fade-in">
                                {/* Success callout */}
                                <div className="flex gap-3 p-4 bg-success-muted dark:bg-primary/10 border border-primary/20 rounded-2xl">
                                    <HiOutlineCheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-brand-text">You're all set!</p>
                                        <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
                                            Review your details and create your store. We'll have your dashboard ready in seconds.
                                        </p>
                                    </div>
                                </div>

                                {/* Summary checklist */}
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-4 px-5 py-4 bg-warm-100 dark:bg-white/[0.04] border border-warm-200 dark:border-white/8 rounded-2xl">
                                        <HiOutlineBuildingStorefront className="w-5 h-5 text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-text-muted">Business Name</p>
                                            <p className="text-sm font-bold text-brand-text mt-0.5 truncate">{name || '—'}</p>
                                        </div>
                                    </li>
                                    {category && (
                                        <li className="flex items-center gap-4 px-5 py-4 bg-warm-100 dark:bg-white/[0.04] border border-warm-200 dark:border-white/8 rounded-2xl">
                                            <HiOutlineShoppingBag className="w-5 h-5 text-primary flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-text-muted">Category</p>
                                                <p className="text-sm font-bold text-brand-text mt-0.5">{BUSINESS_TYPES.find(t => t.id === category)?.label || category}</p>
                                            </div>
                                        </li>
                                    )}
                                    <li className="flex items-center gap-4 px-5 py-4 bg-warm-100 dark:bg-white/[0.04] border border-warm-200 dark:border-white/8 rounded-2xl">
                                        <HiOutlineEnvelope className="w-5 h-5 text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-text-muted">Email</p>
                                            <p className="text-sm font-bold text-brand-text mt-0.5 truncate">{email || '—'}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-4 px-5 py-4 bg-warm-100 dark:bg-white/[0.04] border border-warm-200 dark:border-white/8 rounded-2xl">
                                        <HiOutlineLockClosed className="w-5 h-5 text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-text-muted">Account Security</p>
                                            <p className="text-sm font-bold text-brand-text mt-0.5">Password set &amp; secured</p>
                                        </div>
                                    </li>
                                    {referralCode && (
                                        <li className="flex items-center gap-4 px-5 py-4 bg-warning/6 dark:bg-warning/5 border border-warning/20 rounded-2xl">
                                            <HiOutlineUser className="w-5 h-5 text-warning flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-text-muted">Referral Code</p>
                                                <p className="text-sm font-bold text-brand-text mt-0.5">{referralCode}</p>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* ── Wizard action buttons ── */}
                        <div className="flex items-center gap-3 mt-8">
                            {wizardStep > 0 && (
                                <button
                                    type="button"
                                    onClick={() => { setWizardStep(s => s - 1); setStepError(null); }}
                                    disabled={anyLoading}
                                    className="flex items-center gap-2 px-5 py-4 bg-surface border border-brand-border rounded-2xl text-sm font-bold text-brand-text hover:bg-surface-variant transition-all duration-200 active:scale-95 disabled:opacity-50"
                                >
                                    <HiOutlineArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={wizardNext}
                                disabled={anyLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-secondary hover:bg-[#e86d12] text-white rounded-2xl font-extrabold uppercase tracking-[0.12em] text-[11px] shadow-lg shadow-primary/25 transition-all active:scale-[0.98] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                            >
                                {isLoading
                                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <>
                                        {wizardStep === 2 ? 'Create My Store' : `Next: ${WIZARD_STEPS[wizardStep + 1]}`}
                                        {!isLoading && <HiOutlineArrowRight className="w-4 h-4" />}
                                    </>
                                }
                            </button>
                        </div>

                        <p className="mt-4 text-center text-xs text-brand-text-muted">
                            Step {wizardStep + 1} of {WIZARD_STEPS.length} — You can edit these details later in Settings.
                        </p>
                    </div>

                    {/* ── Visual aside ── */}
                    <aside className="hidden lg:flex flex-col gap-5 lg:sticky lg:top-[104px]">
                        {/* Visual — image only, no copy */}
                        <img src={AsideArt} alt="" className="w-full h-auto rounded-3xl shadow-2xl shadow-primary/20" />

                        {/* Testimonial */}
                        <div className="flex items-center gap-4 p-5 bg-white/90 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-warm-200 dark:border-white/8 shadow-sm">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sp-green to-sp-amber flex-shrink-0 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                                M
                            </div>
                            <div>
                                <p className="text-sm text-brand-text-muted italic leading-relaxed">
                                    "Setting up my boutique took less than 2 minutes with SalePilot."
                                </p>
                                <p className="text-xs font-bold text-brand-text mt-1.5">Meryem A. — Store Owner</p>
                            </div>
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
}
