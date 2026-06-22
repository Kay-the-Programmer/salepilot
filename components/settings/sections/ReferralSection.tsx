import React from 'react';
import { User } from '../../../types';
import '../../../pages/assistant/assistant.css';

interface ReferralSectionProps {
    user: User;
    showSnackbar: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ReferralSection: React.FC<ReferralSectionProps> = ({ user, showSnackbar }) => {
    const referralCode = user.referralCode || 'NOT_FOUND';
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    const copyToClipboard = (text: string, message: string) => {
        navigator.clipboard.writeText(text);
        showSnackbar(message, 'success');
    };

    const steps = [
        'Share your code or link with other business owners.',
        'They sign up to SalePilot using your referral details.',
        'Once they verify their email, you get a ZMW 20 discount.',
        'Your discount is applied automatically on your next billing date.',
    ];

    return (
        <div className="sp-assistant space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="m3-bg-surface-lowest p-5 rounded-2xl border m3-border-outline-variant shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="w-11 h-11 rounded-xl m3-bg-primary-fixed m3-text-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined">paid</span></span>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider m3-text-on-surface-variant">Discount balance</p>
                            <h3 className="text-2xl font-bold m3-text-on-surface">ZMW {user.discountBalance || 0}</h3>
                        </div>
                    </div>
                    <p className="text-[13px] m3-text-on-surface-variant leading-relaxed">Automatically applied to your next monthly subscription payment.</p>
                </div>
                <div className="m3-bg-surface-lowest p-5 rounded-2xl border m3-border-outline-variant shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="w-11 h-11 rounded-xl m3-bg-secondary-fixed m3-text-secondary flex items-center justify-center shrink-0"><span className="material-symbols-outlined">group</span></span>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider m3-text-on-surface-variant">Refer friends</p>
                            <h3 className="text-2xl font-bold m3-text-on-surface">Earn rewards</h3>
                        </div>
                    </div>
                    <p className="text-[13px] m3-text-on-surface-variant leading-relaxed">Get ZMW 20 for every business that signs up and verifies their email with your code.</p>
                </div>
            </div>

            {/* Code + link */}
            <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden">
                <div className="p-5 border-b m3-border-outline-variant">
                    <h4 className="text-[15px] font-bold m3-text-on-surface">Your referral details</h4>
                    <p className="text-[13px] m3-text-on-surface-variant mt-0.5">Share these to start earning.</p>
                </div>
                <div className="p-5 space-y-5">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider m3-text-on-surface-variant mb-2">Referral code</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 m3-bg-surface-container rounded-xl font-bold text-lg m3-text-on-surface text-center tracking-widest uppercase">{referralCode}</div>
                            <button onClick={() => copyToClipboard(referralCode, 'Referral code copied!')} className="w-12 h-12 flex items-center justify-center m3-bg-primary m3-text-on-primary rounded-xl active:scale-95 transition shrink-0"><span className="material-symbols-outlined">content_copy</span></button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider m3-text-on-surface-variant mb-2">Referral link</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 m3-bg-surface-container rounded-xl text-sm m3-text-on-surface-variant truncate">{referralLink}</div>
                            <button onClick={() => copyToClipboard(referralLink, 'Referral link copied!')} className="w-12 h-12 flex items-center justify-center m3-bg-surface-high m3-text-on-surface rounded-xl active:scale-95 transition shrink-0"><span className="material-symbols-outlined">link</span></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="p-5 rounded-2xl m3-bg-surface-container">
                <h4 className="text-[15px] font-bold m3-text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 20 }}>help</span>How it works</h4>
                <div className="space-y-3">
                    {steps.map((text, idx) => (
                        <div key={idx} className="flex gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-lg m3-bg-primary m3-text-on-primary flex items-center justify-center text-[11px] font-bold">{idx + 1}</span>
                            <p className="text-[13px] m3-text-on-surface-variant leading-relaxed">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReferralSection;
