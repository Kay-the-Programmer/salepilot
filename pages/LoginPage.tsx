import { useState, FormEvent, useEffect } from 'react';
import { User } from '../types';
import { SnackbarType } from '../App';
import { login, register, registerCustomer, forgotPassword } from '../services/authService';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    HiOutlineEnvelope,
    HiOutlineLockClosed,
    HiOutlineUser,
    HiOutlineArrowRight,
    HiOutlineBuildingStorefront,
    HiOutlineShoppingBag,
    HiOutlineArrowLeft
} from 'react-icons/hi2';

interface LoginPageProps {
    onLogin: (user: User) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
}

export default function LoginPage({ onLogin, showSnackbar }: LoginPageProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine if we are in customer mode based on path
    const isCustomerMode = location.pathname.startsWith('/customer');

    // Determine view from URL
    const view = location.pathname.endsWith('/register') ? 'register' :
        location.pathname.endsWith('/forgot-password') ? 'forgot' : 'login';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Default credentials for dev
    useEffect(() => {
        if (!isCustomerMode && view === 'login') {
            setEmail('admin@sale-pilot.com');
            setPassword('password');
        }
    }, [view, isCustomerMode]);

    // Password strength calculator
    useEffect(() => {
        if (view !== 'register' || password.length === 0) {
            setPasswordStrength(0);
            return;
        }

        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        setPasswordStrength(strength);
    }, [password, view]);

    const switchView = (v: 'login' | 'register' | 'forgot') => {
        const prefix = isCustomerMode ? '/customer' : '';
        if (v === 'login') navigate(`${prefix}/login`);
        else if (v === 'register') navigate(`${prefix}/register`);
        else if (v === 'forgot') navigate(`${prefix}/forgot-password`);

        setError(null);
        if (v === 'login' && !isCustomerMode) {
            setEmail('admin@sale-pilot.com');
            setPassword('password');
        } else {
            setEmail('');
            setPassword('');
            setName('');
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength < 25) return 'bg-rose-500';
        if (passwordStrength < 50) return 'bg-orange-500';
        if (passwordStrength < 75) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (view === 'login') {
                const user = await login(email, password);
                onLogin(user!);
                if (isCustomerMode) {
                    navigate('/customer/dashboard');
                }
            } else if (view === 'register') {
                if (password.length < 8) {
                    throw new Error("Password must be at least 8 characters long.");
                }
                const newUser = isCustomerMode
                    ? await registerCustomer(name, email, password)
                    : await register(name, email, password);

                try { localStorage.setItem('salePilotUser', JSON.stringify(newUser)); } catch { }
                showSnackbar('Account created successfully!', 'success');
                onLogin(newUser);
                if (isCustomerMode) {
                    navigate('/customer/dashboard');
                }
            } else if (view === 'forgot') {
                await forgotPassword(email);
                showSnackbar(`If an account exists for ${email}, a password reset link has been sent.`, 'info');
                switchView('login');
            }
        } catch (err: any) {
            const msg = (err && typeof err.message === 'string') ? err.message : 'An unexpected error occurred.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const theme = isCustomerMode ? {
        primary: 'from-[#FF7F27] to-[#e66a16]',
        secondary: 'indigo-600',
        bg: 'bg-orange-50/30',
        text: 'text-[#FF7F27]',
        icon: <HiOutlineShoppingBag className="h-8 w-8 text-white" />,
        label: 'Marketplace Customer',
        desc: 'Shop across verified stores and track your requests.',
        ring: 'focus:ring-orange-500',
        shadow: 'shadow-orange-500/20'
    } : {
        primary: 'from-[#0A2E5C] to-blue-700',
        secondary: 'blue-600',
        bg: 'bg-blue-50/30',
        text: 'text-[#0A2E5C]',
        icon: <HiOutlineBuildingStorefront className="h-8 w-8 text-white" />,
        label: 'Business Partner',
        desc: 'Manage your inventory, sales, and global reach.',
        ring: 'focus:ring-blue-600',
        shadow: 'shadow-blue-600/20'
    };

    return (
        <div className={`min-h-screen relative overflow-hidden ${theme.bg} flex flex-col justify-center items-center p-4 selection:bg-indigo-100`}>
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse ${isCustomerMode ? 'bg-[#FF7F27]/10' : 'bg-blue-400/10'}`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse ${isCustomerMode ? 'bg-indigo-400/10' : 'bg-indigo-400/10'}`} style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex flex-col items-center gap-4 mb-4">
                        <div className={`p-4 bg-gradient-to-br ${theme.primary} rounded-[2rem] shadow-2xl ${theme.shadow} rotate-3 animate-in zoom-in duration-700`}>
                            {theme.icon}
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">
                            SalePilot<span className={theme.text}>.</span>
                        </h1>
                    </div>
                </div>

                {/* Glassmorphism Container */}
                <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white/50 p-8 md:p-10 relative overflow-hidden">
                    {/* Role Badge */}
                    <div className="absolute top-0 right-0 left-0 pt-2 flex justify-center pointer-events-none">
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-white border border-slate-100 shadow-sm ${theme.text}`}>
                            {theme.label}
                        </div>
                    </div>

                    <div className="text-center mt-4 mb-8">
                        <h2 className="text-xl font-black text-slate-900">{view === 'login' ? 'Welcome Back' : (view === 'register' ? 'Join the Network' : 'Reset Password')}</h2>
                        <p className="text-xs font-bold text-slate-400 mt-2 px-6">{theme.desc}</p>
                    </div>

                    {/* View Tabs */}
                    <div className="flex bg-slate-50/50 border border-slate-100 p-1.5 rounded-2xl mb-8">
                        <button
                            type="button"
                            onClick={() => switchView('login')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${view === 'login'
                                ? `bg-white ${theme.text} shadow-md border border-slate-100`
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                            disabled={isLoading}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => switchView('register')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${view === 'register'
                                ? `bg-white ${theme.text} shadow-md border border-slate-100`
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                            disabled={isLoading}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] font-black text-rose-600 leading-relaxed text-center uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        {view === 'register' && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                                <div className="relative group">
                                    <HiOutlineUser className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:${theme.text} transition-colors`} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className={`w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-transparent transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 text-sm`}
                                        placeholder="John Carter"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
                            <div className="relative group">
                                <HiOutlineEnvelope className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:${theme.text} transition-colors`} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-transparent transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 text-sm`}
                                    placeholder="name@example.com"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Password</label>
                                {view === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => switchView('forgot')}
                                        className={`text-[10px] font-black ${theme.text} hover:underline uppercase tracking-wider transition-colors`}
                                    >
                                        Forgot?
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <HiOutlineLockClosed className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:${theme.text} transition-colors`} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-transparent transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 text-sm`}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                            {view === 'register' && password.length > 0 && (
                                <div className="px-2 pt-1">
                                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${getStrengthColor()} transition-all duration-500`} style={{ width: `${passwordStrength}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 rounded-2xl bg-gradient-to-r ${theme.primary} text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl ${theme.shadow} hover:translate-y-[-2px] transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 group`}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {view === 'login' ? 'Sign In Now' : (view === 'register' ? 'Create Account' : 'Send Reset Link')}
                                    <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Role Switcher Bridge */}
                    <div className="mt-12 pt-8 border-t border-slate-100">
                        <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-100 flex items-center justify-between gap-4 group cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-500"
                            onClick={() => {
                                const targetView = view === 'forgot' ? 'login' : view;
                                const prefix = isCustomerMode ? '' : '/customer';
                                navigate(`${prefix}/${targetView}`);
                            }}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-2xl ${isCustomerMode ? 'bg-[#0A2E5C]' : 'bg-[#FF7F27]'} flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110`}>
                                    {isCustomerMode ? <HiOutlineBuildingStorefront className="w-5 h-5 text-white" /> : <HiOutlineShoppingBag className="w-5 h-5 text-white" />}
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isCustomerMode ? 'Are you a' : 'Looking to'}</p>
                                    <p className="text-xs font-black text-slate-900">{isCustomerMode ? 'Business Partner?' : 'Buy & Marketplace?'}</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <HiOutlineArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate(isCustomerMode ? '/directory' : '/')}
                        className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                    >
                        <HiOutlineArrowLeft className="w-3 h-3" />
                        Back to {isCustomerMode ? 'Marketplace' : 'Home'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.1; }
                    50% { transform: scale(1.1); opacity: 0.15; }
                }
                .animate-pulse {
                    animation: pulse 10s ease-in-out infinite;
                }
                
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.9) rotate(0deg); }
                    to { opacity: 1; transform: scale(1) rotate(3deg); }
                }
                .animate-zoom-in {
                    animation: zoomIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}