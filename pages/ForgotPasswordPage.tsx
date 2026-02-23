import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import { HiOutlineEnvelope } from 'react-icons/hi2';
import Logo from '../assets/logo.png';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';

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
        <div className="min-h-screen bg-mesh-light flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans font-google">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none animate-pulse" />

            <div className="w-full max-w-[400px] relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-8">
                    <img src={Logo} alt="SalePilot" className="h-10 object-contain drop-shadow-sm" />
                </div>

                <div className="liquid-glass-card rounded-[2rem] rounded-[2.5rem] -slate-200/50 p-8 pt-10 border border-white/50 backdrop-blur-sm">
                    <button
                        onClick={() => navigate('/login')}
                        className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Login
                    </button>

                    <h2 className="text-xl font-bold text-slate-900 mb-2">Forgot Password?</h2>
                    <p className="text-slate-500 text-sm mb-6">Enter your email address and we'll send you a link to reset your password.</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {message && (
                            <div className={`p-4 rounded-2xl text-center text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                {message.text}
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
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-slate-900/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 active:scale-95 transition-all duration-300"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "SEND RESET LINK"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
