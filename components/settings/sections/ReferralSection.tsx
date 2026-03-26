import React from 'react';
import { User } from '../../types';
import { HiOutlineUserGroup, HiOutlineClipboardDocumentCheck, HiOutlineCurrencyDollar } from 'react-icons/hi2';

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

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Referral Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <HiOutlineCurrencyDollar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Discount Balance</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">ZMW {user.discountBalance || 0}</h3>
                        </div>
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        This balance will be automatically applied to your next monthly subscription payment.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                            <HiOutlineUserGroup className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Referring friends</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Earn Rewards</h3>
                        </div>
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Get ZMW 20 for every business that signs up and verifies their email using your code.
                    </p>
                </div>
            </div>

            {/* Referral Code & link */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                    <h4 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1">Your Referral Details</h4>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">Share these with your friends to start earning.</p>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Referral Code */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-1">Referral Code</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono font-bold text-lg text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-center tracking-widest uppercase">
                                {referralCode}
                            </div>
                            <button 
                                onClick={() => copyToClipboard(referralCode, 'Referral code copied!')}
                                className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                            >
                                <HiOutlineClipboardDocumentCheck className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Referral Link */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-1">Referral Link</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate">
                                {referralLink}
                            </div>
                            <button 
                                onClick={() => copyToClipboard(referralLink, 'Referral link copied!')}
                                className="p-3.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all active:scale-95 hover:bg-slate-300 dark:hover:bg-slate-600"
                            >
                                <HiOutlineClipboardDocumentCheck className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="p-6 bg-blue-50/50 dark:bg-blue-500/5 rounded-3xl border border-blue-100 dark:border-blue-500/20">
                <h4 className="text-[15px] font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-400/20 rounded-full text-xs">?</span>
                    How it works
                </h4>
                <div className="space-y-4">
                    {[
                        { step: '1', text: 'Share your code or link with other business owners.' },
                        { step: '2', text: 'They sign up to SalePilot using your referral details.' },
                        { step: '3', text: 'Once they verify their email, you get a ZMW 20 discount.' },
                        { step: '4', text: 'Your discount is applied automatically on your next billing date!' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                            <span className="shrink-0 w-6 h-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-[11px] font-bold text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/50">
                                {item.step}
                            </span>
                            <p className="text-[13px] text-blue-800/80 dark:text-blue-200/60 leading-relaxed font-medium">
                                {item.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReferralSection;
