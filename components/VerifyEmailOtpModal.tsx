import React, { useState, useRef } from 'react';
import { verifyRegistration, resendVerificationEmail } from '../services/authService';
import { HiCheckCircle, HiEnvelope, HiXMark } from 'react-icons/hi2';

interface VerifyEmailOtpModalProps {
    isOpen: boolean;
    email: string;
    onClose: () => void;
    onVerified: () => void;
}

const VerifyEmailOtpModal: React.FC<VerifyEmailOtpModalProps> = ({ isOpen, email, onClose, onVerified }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    if (!isOpen) return null;

    const handleChange = (index: number, value: string) => {
        // Accept only digits
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        // Handle pasting a full 6-digit code
        if (value.length > 1) {
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const merged = [...otp];
            digits.forEach((d, i) => { if (index + i < 6) merged[index + i] = d; });
            setOtp(merged);
            inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
            return;
        }

        newOtp[index] = value;
        setOtp(newOtp);
        setError('');
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 6) {
            setError('Please enter all 6 digits.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await verifyRegistration(email, code);
            setSuccess(true);
            // Give user a moment to see the success state, then notify parent
            setTimeout(() => {
                onVerified();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Invalid or expired code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setError('');
        try {
            await resendVerificationEmail(email);
            setError(''); // Clear any previous errors
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            // Show temporary inline success
            setError('✓ New code sent! Check your inbox.');
            setTimeout(() => setError(''), 4000);
        } catch (err: any) {
            setError(err.message || 'Failed to resend code.');
        } finally {
            setIsResending(false);
        }
    };

    const isResendSuccess = error.startsWith('✓');

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="otp-modal-title"
        >
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="relative p-6 pb-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close"
                    >
                        <HiXMark className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center text-center gap-3 pb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${success ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                            {success
                                ? <HiCheckCircle className="w-8 h-8 text-emerald-500" />
                                : <HiEnvelope className="w-8 h-8 text-amber-500" />
                            }
                        </div>
                        <div>
                            <h2 id="otp-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                                {success ? 'Email Verified!' : 'Verify Your Email'}
                            </h2>
                            {!success && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Enter the 6-digit code sent to<br />
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
                                </p>
                            )}
                            {success && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                                    Your account is now fully verified.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                {!success && (
                    <div className="px-6 pb-6 space-y-5">
                        {/* OTP Input Boxes */}
                        <div className="flex items-center justify-center gap-2" role="group" aria-label="OTP input">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    id={`otp-digit-${i}`}
                                    ref={(el) => (inputRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={digit}
                                    onChange={(e) => handleChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    aria-label={`Digit ${i + 1}`}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        {/* Error / Success feedback */}
                        {error && (
                            <p className={`text-center text-xs font-medium ${isResendSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {error}
                            </p>
                        )}

                        {/* Verify Button */}
                        <button
                            id="otp-verify-btn"
                            onClick={handleVerify}
                            disabled={isLoading || otp.join('').length < 6}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-600/20 disabled:shadow-none"
                        >
                            {isLoading
                                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</span>
                                : 'Verify Email'
                            }
                        </button>

                        {/* Resend */}
                        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                            Didn't receive it?{' '}
                            <button
                                id="otp-resend-btn"
                                onClick={handleResend}
                                disabled={isResending}
                                className="font-semibold text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
                            >
                                {isResending ? 'Sending...' : 'Resend code'}
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailOtpModal;
