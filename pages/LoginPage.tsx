import { useState, FormEvent, useEffect } from 'react';
import { User } from '../types';
import { SnackbarType } from '../App';
import { login, register, registerCustomer, loginWithGoogle } from '../services/authService';
import { signInWithGoogle } from '../services/firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    HiOutlineEnvelope,
    HiOutlineLockClosed,
    HiOutlineUser,
    HiOutlineEye,
    HiOutlineEyeSlash
} from 'react-icons/hi2';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../assets/logo.png';
import GoogleRoleSelectionModal from '../components/GoogleRoleSelectionModal';

interface LoginPageProps {
    onLogin: (user: User) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
}

export default function LoginPage({ onLogin, showSnackbar }: LoginPageProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine initial view from URL
    const initialView = location.pathname.endsWith('/register') ? 'register' : 'login';
    const [view, setView] = useState<'login' | 'register'>(initialView);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [accountType] = useState<'business' | 'customer'>('business');
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Google role selection state
    const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false);
    const [pendingGoogleUser, setPendingGoogleUser] = useState<{ firebaseUser: any; token: string; userName: string } | null>(null);

    // Sync state with URL changes
    useEffect(() => {
        if (location.pathname.endsWith('/register')) setView('register');
        else if (location.pathname.endsWith('/login')) setView('login');
    }, [location.pathname]);

    const switchView = (v: 'login' | 'register') => {
        setView(v);
        setError(null);
        navigate(v === 'register' ? '/register' : '/login', { replace: true });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (view === 'login') {
                const user = await login(email, password);
                onLogin(user!);
                showSnackbar(`Welcome back, ${user!.name}!`, 'success');
            } else {
                if (password.length < 8) throw new Error('Password must be at least 8 characters long.');

                const newUser = accountType === 'customer'
                    ? await registerCustomer(name, email, password)
                    : await register(name, email, password);

                try { localStorage.setItem('salePilotUser', JSON.stringify(newUser)); } catch { }
                showSnackbar('Account created successfully!', 'success');
                onLogin(newUser);
            }
        } catch (err: any) {
            const msg = err?.message ?? 'An unexpected error occurred.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Google Sign-In ────────────────────────────────────────────────────────
    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError(null);
        try {
            const firebaseUser = await signInWithGoogle();
            const token = await firebaseUser.getIdToken();
            const userName = firebaseUser.displayName || firebaseUser.email || 'User';

            // Auto-select 'business' role (modal can be re-enabled if needed)
            await handleGoogleRoleSelection('business', { firebaseUser, token, userName });
        } catch (err: any) {
            // Ignore the "popup closed by user" error — it's not really an error
            if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
                setIsGoogleLoading(false);
                return;
            }
            const msg = err?.message ?? 'Google Sign-In failed. Please try again.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleRoleSelection = async (
        role: 'business' | 'customer',
        googleUser?: { firebaseUser: any; token: string; userName: string }
    ) => {
        const userToProcess = googleUser || pendingGoogleUser;
        if (!userToProcess) return;

        setIsGoogleLoading(true);
        setShowGoogleRoleModal(false);

        try {
            const user = await loginWithGoogle(userToProcess.token, role);
            onLogin(user);
            showSnackbar(`Welcome, ${user.name}! 🎉`, 'success');
            if (!googleUser) setPendingGoogleUser(null);
        } catch (err: any) {
            const msg = err?.message ?? 'Google Sign-In failed.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleRoleCancel = () => {
        setShowGoogleRoleModal(false);
        setPendingGoogleUser(null);
        setError(null);
    };

    // Unified loading state for disabling inputs
    const anyLoading = isLoading || isGoogleLoading;

    return (
        <div className="min-h-screen bg-mesh-light dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-500 font-google">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/40 dark:bg-blue-900/10 blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-100/40 dark:bg-indigo-900/10 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-[400px] relative z-10 animate-in fade-in zoom-in duration-500">
                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <img src={Logo} alt="SalePilot" className="h-12 object-contain drop-shadow-sm opacity-90 hover:opacity-100 transition-opacity dark:invert dark:brightness-200" />
                </div>

                {/* Main Card */}
                <div className="liquid-glass-card rounded-[2.5rem] p-8 pt-10 border border-white/50 dark:border-slate-800/50 backdrop-blur-xl dark:bg-slate-900/80">

                    {/* Segmented Tab Control */}
                    <div className="relative flex bg-slate-100/80 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8">
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-700 rounded-xl shadow-sm transition-all duration-300 ease-out ${view === 'login' ? 'left-1.5 translate-x-0' : 'left-1.5 translate-x-full'}`}
                        />
                        <button
                            type="button"
                            onClick={() => switchView('login')}
                            className={`flex-1 relative z-10 py-3 text-[11px] font-black uppercase tracking-widest text-center transition-colors duration-300 ${view === 'login' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => switchView('register')}
                            className={`flex-1 relative z-10 py-3 text-[11px] font-black uppercase tracking-widest text-center transition-colors duration-300 ${view === 'register' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                        >
                            Register
                        </button>
                    </div>

                    {/* ── Google Sign-In (One-Tap Style Button) ── */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={anyLoading}
                        id="google-signin-btn"
                        className="w-full flex items-center justify-center gap-3 py-3.5 mb-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 text-[13px] font-bold shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-750 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isGoogleLoading ? (
                            <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                            <FcGoogle className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span>{isGoogleLoading ? 'Signing in…' : 'Continue with Google'}</span>
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center mb-6">
                        <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                        <span className="mx-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">or</span>
                        <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                    </div>

                    {/* ── Email / Password Form ── */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-center animate-in slide-in-from-top-2">
                                <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wide">{error}</p>
                            </div>
                        )}

                        {view === 'register' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <HiOutlineUser className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-bold"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={anyLoading}
                                        autoComplete="name"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <HiOutlineEnvelope className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-bold"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={anyLoading}
                                autoComplete="username"
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <HiOutlineLockClosed className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                className="block w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-bold"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={anyLoading}
                                autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between px-1 pt-1">
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wider transition-colors"
                            >
                                Forgot password?
                            </button>
                            {view === 'login' ? (
                                <button
                                    type="button"
                                    onClick={() => switchView('register')}
                                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 uppercase tracking-wider transition-colors"
                                >
                                    Create account
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => switchView('login')}
                                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 uppercase tracking-wider transition-colors"
                                >
                                    Sign in
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            id="email-submit-btn"
                            disabled={anyLoading}
                            className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-slate-900/20 dark:shadow-white/10 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:translate-y-[-2px] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                            ) : (
                                view === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'
                            )}
                        </button>
                    </form>

                    {/* Security note */}
                    <p className="mt-6 text-center text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed">
                        Secured by <span className="font-bold text-slate-500 dark:text-slate-500">Firebase Auth</span> &amp; end-to-end encryption
                    </p>
                </div>
            </div>

            {/* Google Role Selection Modal */}
            <GoogleRoleSelectionModal
                isOpen={showGoogleRoleModal}
                userName={pendingGoogleUser?.userName || 'User'}
                onSelectRole={handleGoogleRoleSelection}
                onCancel={handleGoogleRoleCancel}
            />
        </div>
    );
}