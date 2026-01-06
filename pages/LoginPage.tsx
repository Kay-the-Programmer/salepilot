import React, { useState, FormEvent, useEffect } from 'react';
import { User } from '../types';
import { SnackbarType } from '../App';
import { login, register, forgotPassword } from '../services/authService';

interface LoginPageProps {
    onLogin: (user: User) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, showSnackbar }) => {
    const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
    const [email, setEmail] = useState('admin@sale-pilot.com');
    const [password, setPassword] = useState('password');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState(0);

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
        setView(v);
        setError(null);
        if (v === 'login') {
            setEmail('admin@sale-pilot.com');
            setPassword('password');
        } else {
            setEmail('');
            setPassword('');
            setName('');
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength < 25) return 'bg-red-500';
        if (passwordStrength < 50) return 'bg-orange-500';
        if (passwordStrength < 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (view === 'login') {
                const user = await login(email, password);
                onLogin(user!);
            } else if (view === 'register') {
                if (password.length < 8) {
                    throw new Error("Password must be at least 8 characters long.");
                }
                const newUser = await register(name, email, password);
                try { localStorage.setItem('salePilotUser', JSON.stringify(newUser)); } catch {}
                showSnackbar('Account created successfully! Let\'s set up your store.', 'success');
                onLogin(newUser);
            } else if (view === 'forgot') {
                await forgotPassword(email);
                showSnackbar(`If an account exists for ${email}, a password reset link has been sent.`, 'info');
                setView('login');
            }
        } catch (err: any) {
            const msg = (err && typeof err.message === 'string') ? err.message : 'An unexpected error occurred.';
            if ((err?.status === 409) || /already exists/i.test(msg)) {
                const friendly = 'An account with this email already exists. Please sign in.';
                setError(friendly);
                showSnackbar(friendly, 'error');
                setView('login');
            } else {
                setError(msg);
                showSnackbar(msg, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const Spinner = () => (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
    );

    const renderForm = () => {
        switch (view) {
            case 'register':
                return (
                    <>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Already have an account?{' '}
                                <button 
                                    type="button"
                                    onClick={() => switchView('login')} 
                                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                    disabled={isLoading}
                                >
                                    Sign in
                                </button>
                            </p>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200" role="alert">
                                <p className="text-red-600 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <input 
                                    id="name" 
                                    name="name" 
                                    type="text" 
                                    required 
                                    value={name} 
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Jane Doe"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label htmlFor="email-address-reg" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input 
                                    id="email-address-reg" 
                                    name="email" 
                                    type="email" 
                                    autoComplete="email" 
                                    required 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label htmlFor="password-reg" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input 
                                    id="password-reg" 
                                    name="password" 
                                    type="password" 
                                    autoComplete="new-password" 
                                    required 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Create a strong password"
                                    disabled={isLoading}
                                />
                                
                                {password.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">Password strength</span>
                                            <span className={`font-medium ${
                                                passwordStrength < 25 ? 'text-red-600' :
                                                passwordStrength < 50 ? 'text-orange-600' :
                                                passwordStrength < 75 ? 'text-yellow-600' : 'text-green-600'
                                            }`}>
                                                {passwordStrength < 25 ? 'Weak' :
                                                 passwordStrength < 50 ? 'Fair' :
                                                 passwordStrength < 75 ? 'Good' : 'Strong'}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${getStrengthColor()} transition-all duration-300`}
                                                style={{ width: `${passwordStrength}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                <ul className="mt-2 text-xs text-gray-500 space-y-1">
                                    <li className="flex items-center">
                                        <svg className={`h-3 w-3 mr-1 ${password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        At least 8 characters
                                    </li>
                                </ul>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {isLoading && <Spinner />}
                                <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
                            </button>
                        </div>
                    </>
                );

            case 'forgot':
                return (
                    <>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Enter your email to receive a reset link
                            </p>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200" role="alert">
                                <p className="text-red-600 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="email-address-forgot" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input 
                                    id="email-address-forgot" 
                                    name="email" 
                                    type="email" 
                                    autoComplete="email" 
                                    required 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                    disabled={isLoading}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {isLoading && <Spinner />}
                                <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
                            </button>

                            <div className="text-center pt-2">
                                <button 
                                    type="button"
                                    onClick={() => switchView('login')} 
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                    disabled={isLoading}
                                >
                                    ← Back to Sign In
                                </button>
                            </div>
                        </div>
                    </>
                );

            case 'login':
            default:
                return (
                    <>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Don't have an account?{' '}
                                <button 
                                    type="button"
                                    onClick={() => switchView('register')} 
                                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                    disabled={isLoading}
                                >
                                    Sign up
                                </button>
                            </p>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200" role="alert">
                                <p className="text-red-600 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input 
                                    id="email-address" 
                                    name="email" 
                                    type="email" 
                                    autoComplete="email" 
                                    required 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={() => switchView('forgot')} 
                                        className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                        disabled={isLoading}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    autoComplete="current-password" 
                                    required 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter your password"
                                    disabled={isLoading}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {isLoading && <Spinner />}
                                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                            </button>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M7 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7zM9 5v2h6V5H9zm0 4v2h6V9H9zm0 4v2h6v-2H9z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            SalePilot
                        </h1>
                    </div>
                    <p className="text-gray-600">Streamline your sales management</p>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    {/* View Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            type="button"
                            onClick={() => switchView('login')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                view === 'login'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            disabled={isLoading}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => switchView('register')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                view === 'register'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            disabled={isLoading}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {renderForm()}
                    </form>
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">Demo credentials:</span>{' '}
                        <span className="font-mono text-gray-600">admin@sale-pilot.com</span> /{' '}
                        <span className="font-mono text-gray-600">password</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;