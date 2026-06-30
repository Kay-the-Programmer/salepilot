import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import { HiOutlineEnvelope, HiArrowLeft } from 'react-icons/hi2';
import Logo from '../assets/logo.png';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            await forgotPassword(email);
            setMessage({
                type: 'success',
                text: 'If an account exists, a password reset link has been sent to your email.'
            });
            setEmail('');
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.message || 'Failed to send reset link.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh-light flex flex-col overflow-hidden">
            {/* Warm ambient glows */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-[-15%] left-[-8%] w-[55%] h-[55%] rounded-full bg-primary/8 blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-8%] w-[50%] h-[50%] rounded-full bg-warning/10 blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center h-20 px-6 md:px-10">
                <img
                    src={Logo}
                    alt="SalePilot"
                    className="h-9 object-contain opacity-90 hover:opacity-100 transition-opacity"
                />
            </header>

            {/* Main */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-[440px] animate-fade-in">

                    {/* Glass card */}
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-warm-200 dark:border-white/8 rounded-3xl p-8 shadow-xl shadow-warm-900/6">

                        {/* Back button */}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="mb-7 flex items-center gap-2 text-sm font-bold text-brand-text-muted hover:text-primary transition-colors group"
                        >
                            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back to Login
                        </button>

                        {/* Icon + heading */}
                        <div className="mb-8">
                            <div className="w-14 h-14 bg-success-muted dark:bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
                                <HiOutlineEnvelope className="w-7 h-7 text-primary" />
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-brand-text">
                                Reset Password
                            </h1>
                            <p className="mt-2 text-sm text-brand-text-muted leading-relaxed">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Message banner */}
                            {message && (
                                <div className={`p-3.5 rounded-2xl animate-in slide-in-from-top-2 ${
                                    message.type === 'success'
                                        ? 'bg-success-muted dark:bg-primary/10 border border-primary/20'
                                        : 'bg-danger-muted dark:bg-danger/10 border border-danger/20'
                                }`}>
                                    <p className={`text-xs font-bold text-center uppercase tracking-wide ${
                                        message.type === 'success' ? 'text-primary' : 'text-danger'
                                    }`}>
                                        {message.text}
                                    </p>
                                </div>
                            )}

                            {/* Email input */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <HiOutlineEnvelope className="h-5 w-5 text-brand-text-muted group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-11 pr-4 py-4 bg-warm-100 dark:bg-white/[0.06] border-0 rounded-2xl text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-white/[0.09] transition-all text-sm font-semibold outline-none"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>

                            {/* Submit CTA */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-secondary hover:bg-[#e86d12] text-white rounded-2xl font-extrabold uppercase tracking-[0.15em] text-[11px] shadow-lg shadow-primary/25 transform transition-all active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-2"
                            >
                                {isLoading
                                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : 'Send Reset Link'
                                }
                            </button>
                        </form>

                        {/* Security note */}
                        <p className="mt-6 text-center text-[10px] text-brand-text-muted leading-relaxed">
                            Secured by <span className="font-bold">Firebase Auth</span> &amp; end-to-end encryption
                        </p>
                    </div>

                    {/* Footer links */}
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
