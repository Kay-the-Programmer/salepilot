import React, { useState } from 'react';
import { setupRecaptcha, sendPhoneOtp } from '../../services/firebase/auth';
import { api } from '../../services/api';
import '../../pages/assistant/assistant.css';

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

const Badge: React.FC<{ verified: boolean }> = ({ verified }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${verified ? 'm3-bg-primary-container m3-text-on-primary-container' : 'm3-bg-secondary-fixed m3-text-secondary'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'm3-bg-primary' : 'm3-bg-secondary'}`} />
        {verified ? 'Verified' : 'Not verified'}
    </span>
);

const AccountVerificationSection: React.FC<AccountVerificationSectionProps> = ({ status, onRefresh }) => {
    const [phoneStep, setPhoneStep] = useState<PhoneStep>('idle');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleStartPhoneVerification = async () => { setError(null); setPhoneStep('enter_phone'); };

    const handleSendSMS = async () => {
        if (!phone || phone.length < 8) { setError('Please enter a valid phone number with country code (e.g. +1234567890).'); return; }
        setError(null); setPhoneStep('loading');
        try {
            const verifier = setupRecaptcha('sms-recaptcha-container');
            if (!verifier) throw new Error('reCAPTCHA failed to initialize.');
            const result = await sendPhoneOtp(phone, verifier);
            setConfirmationResult(result); setPhoneStep('enter_otp');
        } catch (err: any) {
            setError(err?.message ?? 'Failed to send SMS. Check the number and try again.'); setPhoneStep('enter_phone');
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) { setError('Please enter the 6-digit SMS code.'); return; }
        setError(null); setPhoneStep('loading');
        try {
            const cred = await confirmationResult.confirm(otp);
            const idToken = await cred.user.getIdToken();
            await api.post('/auth/verify-phone', { phoneIdToken: idToken, phoneNumber: phone });
            setPhoneStep('done'); onRefresh();
        } catch (err: any) {
            setError(err?.message ?? 'Invalid code. Please try again.'); setPhoneStep('enter_otp');
        }
    };

    const resetPhone = () => { setPhoneStep('idle'); setPhone(''); setOtp(''); setError(null); setConfirmationResult(null); };

    const inputCls = 'w-full px-4 py-3 m3-bg-surface-container border m3-border-outline-variant rounded-xl text-sm font-medium m3-text-on-surface m3-placeholder outline-none focus:m3-border-primary transition';

    return (
        <div className="sp-assistant space-y-3">
            {/* Email */}
            <div className="flex items-center justify-between p-4 m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status?.isEmailVerified ? 'm3-bg-primary-fixed m3-text-primary' : 'm3-bg-surface-high m3-text-on-surface-variant'}`}><span className="material-symbols-outlined" style={{ fontSize: 22 }}>mail</span></span>
                    <div className="min-w-0"><p className="font-bold m3-text-on-surface text-sm">Email address</p><p className="text-xs m3-text-on-surface-variant mt-0.5">Verified at registration</p></div>
                </div>
                <Badge verified={!!status?.isEmailVerified} />
            </div>

            {/* Phone */}
            <div className="p-4 m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status?.isPhoneVerified ? 'm3-bg-primary-fixed m3-text-primary' : 'm3-bg-surface-high m3-text-on-surface-variant'}`}><span className="material-symbols-outlined" style={{ fontSize: 22 }}>call</span></span>
                        <div className="min-w-0"><p className="font-bold m3-text-on-surface text-sm">Phone number</p><p className="text-xs m3-text-on-surface-variant mt-0.5 truncate">{status?.isPhoneVerified && status.phoneNumber ? status.phoneNumber : 'Not yet verified'}</p></div>
                    </div>
                    <Badge verified={!!status?.isPhoneVerified} />
                </div>

                {/* reCAPTCHA container (invisible) */}
                <div id="sms-recaptcha-container" />

                {!status?.isPhoneVerified && phoneStep === 'idle' && (
                    <button onClick={handleStartPhoneVerification} className="w-full py-3 text-sm font-bold m3-text-primary m3-bg-primary-fixed rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-1.5"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span>Verify phone number</button>
                )}

                {!status?.isPhoneVerified && phoneStep === 'enter_phone' && (
                    <div className="space-y-3 sp-fade-in">
                        <input type="tel" autoFocus placeholder="Mobile number with country code (+260…)" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                        {error && <p className="text-xs font-bold m3-text-error">{error}</p>}
                        <div className="flex gap-2">
                            <button onClick={resetPhone} className="flex-1 py-2.5 text-xs font-bold m3-text-on-surface-variant border m3-border-outline-variant rounded-xl active:scale-95 transition">Cancel</button>
                            <button onClick={handleSendSMS} className="flex-[2] py-2.5 text-xs font-bold m3-text-on-primary m3-bg-primary rounded-xl active:scale-95 transition">Send SMS code</button>
                        </div>
                    </div>
                )}

                {!status?.isPhoneVerified && phoneStep === 'enter_otp' && (
                    <div className="space-y-3 sp-fade-in">
                        <p className="text-xs m3-text-on-surface-variant">Enter the 6-digit code sent to <strong className="m3-text-on-surface">{phone}</strong></p>
                        <input type="text" inputMode="numeric" maxLength={6} autoFocus placeholder="––––––" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className={`${inputCls} text-xl font-bold text-center tracking-[0.4em]`} />
                        {error && <p className="text-xs font-bold m3-text-error">{error}</p>}
                        <div className="flex gap-2">
                            <button onClick={resetPhone} className="flex-1 py-2.5 text-xs font-bold m3-text-on-surface-variant border m3-border-outline-variant rounded-xl active:scale-95 transition">Cancel</button>
                            <button onClick={handleVerifyOtp} className="flex-[2] py-2.5 text-xs font-bold m3-text-on-primary m3-bg-primary rounded-xl active:scale-95 transition">Confirm code</button>
                        </div>
                    </div>
                )}

                {phoneStep === 'loading' && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm font-bold m3-text-on-surface-variant"><span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>progress_activity</span>Please wait…</div>
                )}

                {phoneStep === 'done' && (
                    <div className="flex items-center gap-2 py-3 px-4 m3-bg-primary-container rounded-xl sp-fade-in"><span className="material-symbols-outlined m3-text-on-primary-container" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span><p className="text-sm font-bold m3-text-on-primary-container">Phone verified successfully!</p></div>
                )}
            </div>
        </div>
    );
};

export default AccountVerificationSection;
