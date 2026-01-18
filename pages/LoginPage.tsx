import { useState, FormEvent, useEffect } from 'react';
import { User } from '../types';
import { SnackbarType } from '../App';
import { login, register, registerCustomer, forgotPassword, loginWithGoogle } from '../services/authService';
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
    const [accountType, setAccountType] = useState<'business' | 'customer'>('business');
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Google role selection state
    const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false);
    const [pendingGoogleUser, setPendingGoogleUser] = useState<{ firebaseUser: any; token: string; userName: string } | null>(null);

    // Sync state with URL changes if needed
    useEffect(() => {
        if (location.pathname.endsWith('/register')) setView('register');
        else if (location.pathname.endsWith('/login')) setView('login');
    }, [location.pathname]);

    const switchView = (v: 'login' | 'register') => {
        setView(v);
        setError(null);
        const path = v === 'register' ? '/register' : '/login';
        navigate(path, { replace: true });
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
                // Navigation handled by parent or standard redirects
            } else if (view === 'register') {
                if (password.length < 8) {
                    throw new Error("Password must be at least 8 characters long.");
                }

                const newUser = accountType === 'customer'
                    ? await registerCustomer(name, email, password)
                    : await register(name, email, password);

                try { localStorage.setItem('salePilotUser', JSON.stringify(newUser)); } catch { }
                showSnackbar('Account created successfully!', 'success');
                onLogin(newUser);
            }
        } catch (err: any) {
            const msg = (err && typeof err.message === 'string') ? err.message : 'An unexpected error occurred.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const firebaseUser = await signInWithGoogle();
            const token = await firebaseUser.getIdToken();
            const userName = firebaseUser.displayName || firebaseUser.email || 'User';

            // Store pending user data and show role selection modal
            setPendingGoogleUser({ firebaseUser, token, userName });
            setShowGoogleRoleModal(true);
            setIsLoading(false);
        } catch (err: any) {
            console.error("Google Login Error", err);
            const msg = (err && typeof err.message === 'string') ? err.message : 'Google Login failed.';
            setError(msg);
            showSnackbar(msg, 'error');
            setIsLoading(false);
        }
    };

    const handleGoogleRoleSelection = async (role: 'business' | 'customer') => {
        if (!pendingGoogleUser) return;

        setIsLoading(true);
        setShowGoogleRoleModal(false);

        try {
            const user = await loginWithGoogle(pendingGoogleUser.token, role);
            onLogin(user);
            showSnackbar(`Welcome, ${user.name}!`, 'success');
            setPendingGoogleUser(null);
        } catch (err: any) {
            console.error("Google Login Error", err);
            const msg = (err && typeof err.message === 'string') ? err.message : 'Google Login failed.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleRoleCancel = () => {
        setShowGoogleRoleModal(false);
        setPendingGoogleUser(null);
        setError(null);
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address first.');
            return;
        }
        try {
            await forgotPassword(email);
            showSnackbar(`Password reset link sent to ${email}`, 'success');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-100/40 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-[400px] relative z-10 animate-in fade-in zoom-in duration-500">
                {/* Logo Section */}
                <div className="flex justify-center mb-8">
                    <img src={Logo} alt="SalePilot" className="h-10 object-contain drop-shadow-sm opacity-90 hover:opacity-100 transition-opacity" />
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 pt-10 border border-white/50 backdrop-blur-sm">

                    {/* Segmented Control - Tabs */}
                    <div className="relative flex bg-slate-100/80 p-1.5 rounded-2xl mb-8">
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${view === 'login' ? 'left-1.5 transform translate-x-0' : 'left-1.5 transform translate-x-full'}`}
                        />
                        <button
                            type="button"
                            onClick={() => switchView('login')}
                            className={`flex-1 relative z-10 py-3 text-[11px] font-black uppercase tracking-widest text-center transition-colors duration-300 ${view === 'login' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => switchView('register')}
                            className={`flex-1 relative z-10 py-3 text-[11px] font-black uppercase tracking-widest text-center transition-colors duration-300 ${view === 'register' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center animate-in slide-in-from-top-2">
                                <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wide">{error}</p>
                            </div>
                        )}

                        {view === 'register' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Account Type Selector */}
                                <div className="flex justify-center gap-6 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${accountType === 'business' ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                                            {accountType === 'business' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                        </div>
                                        <input type="radio" className="hidden" checked={accountType === 'business'} onChange={() => setAccountType('business')} />
                                        <span className={`text-xs font-bold leading-none ${accountType === 'business' ? 'text-slate-700' : 'text-slate-400'}`}>Business</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${accountType === 'customer' ? 'border-orange-500' : 'border-slate-300 group-hover:border-orange-400'}`}>
                                            {accountType === 'customer' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                        </div>
                                        <input type="radio" className="hidden" checked={accountType === 'customer'} onChange={() => setAccountType('customer')} />
                                        <span className={`text-xs font-bold leading-none ${accountType === 'customer' ? 'text-slate-700' : 'text-slate-400'}`}>Customer</span>
                                    </label>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <HiOutlineUser className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isLoading}
                                        autoComplete="name"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <HiOutlineEnvelope className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <HiOutlineLockClosed className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-12 pr-12 py-4 bg-slate-50 border-0 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2 pt-1">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
                            >
                                Forgot?
                            </button>

                            {view === 'login' && (
                                <button
                                    type="button"
                                    onClick={() => switchView('register')}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider transition-colors"
                                >
                                    Signup
                                </button>
                            )}
                            {view === 'register' && (
                                <button
                                    type="button"
                                    onClick={() => switchView('login')}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider transition-colors"
                                >
                                    Login
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-slate-900/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:translate-y-[-2px]"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                view === 'login' ? "LOGIN" : "REGISTER"
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="bg-white p-3 rounded-full border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300 transform hover:scale-110"
                                aria-label="Login with Google"
                            >
                                <FcGoogle className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

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