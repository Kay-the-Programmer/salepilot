import { useState, FormEvent } from 'react';
import { User } from '../types';
import { SnackbarType } from '../App';
import { login, loginWithGoogle } from '../services/authService';
import { signInWithGoogle } from '../services/firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineEnvelope,
    HiOutlineLockClosed,
    HiOutlineEye,
    HiOutlineEyeSlash,
} from 'react-icons/hi2';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../assets/logo.png';

interface LoginPageProps {
    onLogin: (user: User) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
}

/**
 * Login-only surface. Account creation lives on the single registration
 * surface (StoreRegistrationPage at /register) — "Create Account" navigates
 * there. A first-time Google user has no store yet, so onLogin → Dashboard
 * routes them to /register to finish setting up their store.
 */
export default function LoginPage({ onLogin, showSnackbar }: LoginPageProps) {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const anyLoading = isLoading || isGoogleLoading;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const user = await login(email, password);
            // The welcome toast is owned by Dashboard.handleLogin (the single
            // choke point for every login path) — firing it here too produced a
            // second toast (visible on Google sign-in, where the wording differs).
            onLogin(user!);
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
            // single registration surface) right after login.
            const user = await loginWithGoogle(token, 'business');
            // Single welcome toast is fired by Dashboard.handleLogin (see above).
            onLogin(user);
        } catch (err: any) {
            if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return;
            const msg = err?.message ?? 'Google Sign-In failed. Please try again.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh-light flex flex-col overflow-hidden">
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-[-15%] left-[-8%] w-[55%] h-[55%] rounded-full bg-primary/8 blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-8%] w-[50%] h-[50%] rounded-full bg-warning/10 blur-[120px]" />
            </div>

            <header className="relative z-10 flex items-center justify-between h-20 px-6 md:px-10">
                <img src={Logo} alt="SalePilot" className="h-9 object-contain opacity-90 hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-sm font-semibold text-brand-text-muted">New here?</span>
                    <button
                        type="button"
                        onClick={() => navigate('/register')}
                        className="px-5 py-2 rounded-full border border-brand-border bg-surface text-sm font-bold text-brand-text hover:bg-surface-variant transition-all duration-200 active:scale-95"
                    >
                        Create Account
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-[440px] animate-fade-in">
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-warm-200 dark:border-white/8 rounded-3xl p-8 shadow-xl shadow-warm-900/6">
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
