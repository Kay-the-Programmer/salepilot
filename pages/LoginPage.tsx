
import React, { useState, FormEvent } from 'react';
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

    const switchView = (v: 'login' | 'register' | 'forgot') => {
        setView(v);
        setError(null);
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
                if(password.length < 8) {
                    throw new Error("Password must be at least 8 characters long.");
                }
                const newUser = await register(name, email, password);
                // Immediately sign the user in and proceed to store setup if needed
                try { localStorage.setItem('salePilotUser', JSON.stringify(newUser)); } catch {}
                showSnackbar('Account created successfully! Let\'s set up your store.', 'success');
                onLogin(newUser);
            } else if (view === 'forgot') {
                await forgotPassword(email);
                showSnackbar(`If an account exists for ${email}, a password reset link has been sent.`, 'info');
                setView('login');
            }
        } catch (err: any) {
            // Handle 409 Conflict (e.g., user already exists) with a friendly UX
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
                        <h2 className="text-2xl font-bold text-center text-gray-800">Create Account</h2>
                        <div className="mt-2 text-sm text-center text-gray-600">
                            Already have an account?{' '}
                            <button onClick={() => switchView('login')} className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </button>
                        </div>
                        {error && <div className="mt-4 text-red-600 text-sm" role="alert">{error}</div>}
                        <div className="mt-6 space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input id="name" name="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Jane Doe" />
                            </div>
                            <div>
                                <label htmlFor="email-address-reg" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                                <input id="email-address-reg" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="you@example.com" />
                            </div>
                            <div>
                                <label htmlFor="password-reg" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input id="password-reg" name="password" type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="At least 8 characters" />
                                <p className="mt-2 text-xs text-gray-500">Use 8+ characters with a mix of letters and numbers.</p>
                            </div>
                            <div>
                                <button type="submit" disabled={isLoading} className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
                                    {isLoading && <Spinner />}
                                    <span>{isLoading ? 'Creating your account…' : 'Create Account'}</span>
                                </button>
                            </div>
                        </div>
                    </>
                );
            case 'forgot':
                 return (
                    <>
                        <h2 className="text-2xl font-bold text-center text-gray-800">Forgot Password</h2>
                        <div className="mt-2 text-sm text-center text-gray-600">
                            Enter your email to receive a reset link.
                        </div>
                        {error && <div className="mt-4 text-red-600 text-sm" role="alert">{error}</div>}
                        <div className="mt-6 space-y-5">
                            <div>
                                <label htmlFor="email-address-forgot" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                                <input id="email-address-forgot" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="you@example.com" />
                            </div>
                             <div>
                                <button type="submit" disabled={isLoading} className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
                                    {isLoading && <Spinner />}
                                    <span>{isLoading ? 'Sending…' : 'Send Reset Link'}</span>
                                </button>
                            </div>
                            <div className="text-center">
                                <button onClick={() => switchView('login')} className="font-medium text-sm text-blue-600 hover:text-blue-500">
                                    Back to Sign In
                                </button>
                            </div>
                        </div>
                    </>
                );
            case 'login':
            default:
                return (
                    <>
                        <h2 className="text-2xl font-bold text-center text-gray-800">Sign in to your account</h2>
                        <div className="mt-2 text-sm text-center text-gray-600">
                            Or{' '}
                            <button onClick={() => { switchView('register'); setEmail(''); setPassword(''); }} className="font-medium text-blue-600 hover:text-blue-500">
                                create a new account
                            </button>
                        </div>
                        {error && <div className="mt-4 text-red-600 text-sm" role="alert">{error}</div>}
                         <div className="mt-6 space-y-5">
                             <input type="hidden" name="remember" defaultValue="true" />
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                                <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="you@example.com" />
                            </div>
                             <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Your password" />
                            </div>

                            <div className="flex items-center justify-end">
                                <div className="text-sm">
                                    <button onClick={() => switchView('forgot')} className="font-medium text-blue-600 hover:text-blue-500">
                                        Forgot your password?
                                    </button>
                                </div>
                            </div>

                             <div>
                                <button type="submit" disabled={isLoading} className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
                                    {isLoading && <Spinner />}
                                    <span>{isLoading ? 'Signing you in…' : 'Sign in'}</span>
                                </button>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
             <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center items-center gap-3">
                    <svg className="h-10 w-auto text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M7 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7zM9 5v2h6V5H9zm0 4v2h6V9H9zm0 4v2h6v-2H9z" />
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-900">SalePilot</h1>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-lg rounded-3xl sm:px-10">
                    <form onSubmit={handleSubmit} aria-live="polite">
                        {renderForm()}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
