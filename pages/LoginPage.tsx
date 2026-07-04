import { useState, FormEvent } from 'react';
import { User } from '../types';
import { SnackbarType } from '../App';
import { login, loginWithGoogle } from '../services/authService';
import { signInWithGoogle } from '../services/firebase/auth';
import { useNavigate } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
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

    const inputClass =
        'block w-full rounded-xl border border-brand-border bg-surface px-3.5 py-3 text-sm font-medium text-brand-text placeholder:text-brand-text-muted/50 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="flex items-center justify-between h-16 px-5 md:px-8">
                <img src={Logo} alt="SalePilot" className="h-8 object-contain" />
                <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-sm font-semibold text-brand-text-muted hover:text-primary transition-colors"
                >
                    Create account
                </button>
            </header>

            <main className="flex-1 flex items-center justify-center px-5 py-10">
                <div className="w-full max-w-[400px] animate-fade-in">
                    <div className="rounded-2xl border border-brand-border bg-surface p-7 shadow-sm sm:p-8">
                        <div className="mb-7">
                            <h1 className="text-[22px] font-bold tracking-tight text-brand-text">Welcome back</h1>
                            <p className="mt-1.5 text-sm text-brand-text-muted">
                                Log in to manage your store.
                            </p>
                        </div>

                        {/* Google */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={anyLoading}
                            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-brand-border bg-surface py-3 text-sm font-semibold text-brand-text transition-colors hover:bg-surface-variant disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isGoogleLoading
                                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-border border-t-primary" />
                                : <FcGoogle className="h-5 w-5" />}
                            <span>{isGoogleLoading ? 'Signing in…' : 'Continue with Google'}</span>
                        </button>

                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-brand-border" />
                            <span className="text-xs font-medium text-brand-text-muted">or</span>
                            <div className="h-px flex-1 bg-brand-border" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-xl border border-danger/20 bg-danger-muted px-3.5 py-2.5">
                                    <p className="text-xs font-medium text-danger">{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-brand-text-muted">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    className={inputClass}
                                    placeholder="you@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={anyLoading}
                                    autoComplete="username"
                                />
                            </div>

                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label htmlFor="password" className="block text-xs font-semibold text-brand-text-muted">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/forgot-password')}
                                        className="text-xs font-medium text-brand-text-muted hover:text-primary transition-colors"
                                    >
                                        Forgot?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className={`${inputClass} pr-11`}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={anyLoading}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-brand-text-muted hover:text-brand-text transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={anyLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : 'Log in'}
                            </button>
                        </form>
                    </div>

                    <div className="mt-6 flex justify-center gap-5">
                        <a href="/privacy" className="text-xs text-brand-text-muted hover:text-primary transition-colors">Privacy</a>
                        <a href="#" className="text-xs text-brand-text-muted hover:text-primary transition-colors">Terms</a>
                        <a href="#" className="text-xs text-brand-text-muted hover:text-primary transition-colors">Support</a>
                    </div>
                </div>
            </main>
        </div>
    );
}
