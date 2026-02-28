import React, { useState } from 'react';
import { setupRecaptcha, sendPhoneOtp } from '../../services/firebase/auth';
import { api } from '../../services/api';

interface AccountVerificationStatus {
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    phoneNumber?: string;
}

interface AccountVerificationSectionProps {
    status: AccountVerificationStatus | null;
    onRefresh: () => void;
}

type PhoneStep = 'idle' | 'enter_phone' | 'enter_otp' | 'loading' | 'done';

const VerificationBadge: React.FC<{ verified: boolean; label?: string }> = ({ verified, label }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide ${verified
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'
            : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50'
        }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {label ?? (verified ? 'Verified' : 'Not Verified')}
    </span>
);

const CheckIcon = () => (
    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

const AccountVerificationSection: React.FC<AccountVerificationSectionProps> = ({ status, onRefresh }) => {
    const [phoneStep, setPhoneStep] = useState<PhoneStep>('idle');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleStartPhoneVerification = async () => {
        setError(null);
        setPhoneStep('enter_phone');
    };

    const handleSendSMS = async () => {
        if (!phone || phone.length < 8) {
            setError('Please enter a valid phone number with country code (e.g. +1234567890).');
            return;
        }
        setError(null);
        setPhoneStep('loading');
        try {
            const verifier = setupRecaptcha('sms-recaptcha-container');
            if (!verifier) throw new Error('reCAPTCHA failed to initialize.');
            const result = await sendPhoneOtp(phone, verifier);
            setConfirmationResult(result);
            setPhoneStep('enter_otp');
        } catch (err: any) {
            setError(err?.message ?? 'Failed to send SMS. Check the number and try again.');
            setPhoneStep('enter_phone');
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setError('Please enter the 6-digit SMS code.');
            return;
        }
        setError(null);
        setPhoneStep('loading');
        try {
            const cred = await confirmationResult.confirm(otp);
            const idToken = await cred.user.getIdToken();
            await api.post('/auth/verify-phone', { phoneIdToken: idToken, phoneNumber: phone });
            setPhoneStep('done');
            onRefresh();
        } catch (err: any) {
            setError(err?.message ?? 'Invalid code. Please try again.');
            setPhoneStep('enter_otp');
        }
    };

    const resetPhone = () => {
        setPhoneStep('idle');
        setPhone('');
        setOtp('');
        setError(null);
        setConfirmationResult(null);
    };

    return (
        <div className="space-y-4">
            {/* ── Email Verification ─────────────────────────────────── */}
            <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${status?.isEmailVerified ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">Email Address</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Verified at registration</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {status?.isEmailVerified
                        ? <CheckIcon />
                        : null
                    }
                    <VerificationBadge verified={!!status?.isEmailVerified} />
                </div>
            </div>

            {/* ── Phone Verification ─────────────────────────────────── */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${status?.isPhoneVerified ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">Phone Number</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {status?.isPhoneVerified && status.phoneNumber
                                    ? status.phoneNumber
                                    : 'Not yet verified'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {status?.isPhoneVerified && <CheckIcon />}
                        <VerificationBadge verified={!!status?.isPhoneVerified} />
                    </div>
                </div>

                {/* reCAPTCHA container (invisible) */}
                <div id="sms-recaptcha-container" />

                {/* Phone verification flow */}
                {!status?.isPhoneVerified && phoneStep === 'idle' && (
                    <button
                        onClick={handleStartPhoneVerification}
                        className="w-full py-3 px-4 text-sm font-bold text-blue-600 dark:text-blue-400 border-2 border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all active:scale-[0.98]"
                    >
                        Verify Phone Number →
                    </button>
                )}

                {!status?.isPhoneVerified && phoneStep === 'enter_phone' && (
                    <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <input
                            type="tel"
                            autoFocus
                            placeholder="Mobile number with country code (+1234567890)"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                        {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
                        <div className="flex gap-2">
                            <button onClick={resetPhone} className="flex-1 py-2.5 text-xs font-black text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                            <button onClick={handleSendSMS} className="flex-[2] py-2.5 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all active:scale-95">Send SMS Code</button>
                        </div>
                    </div>
                )}

                {!status?.isPhoneVerified && phoneStep === 'enter_otp' && (
                    <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enter the 6-digit code sent to <strong className="text-slate-700 dark:text-slate-300">{phone}</strong>
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            autoFocus
                            placeholder="──────"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xl font-black text-center tracking-[0.4em] text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                        {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
                        <div className="flex gap-2">
                            <button onClick={resetPhone} className="flex-1 py-2.5 text-xs font-black text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                            <button onClick={handleVerifyOtp} className="flex-[2] py-2.5 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all active:scale-95">Confirm Code</button>
                        </div>
                    </div>
                )}

                {phoneStep === 'loading' && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm font-bold text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                        Please wait…
                    </div>
                )}

                {phoneStep === 'done' && (
                    <div className="flex items-center gap-2 py-3 px-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in duration-300">
                        <CheckIcon />
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Phone verified successfully!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountVerificationSection;
