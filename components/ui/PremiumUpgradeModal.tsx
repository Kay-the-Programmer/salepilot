import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '../icons';

interface PremiumUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    bullets?: string[];
    /** Where the unlock CTA goes. Defaults to the subscription page. */
    upgradeHref?: string;
}

/**
 * Generic "premium add-on" prompt shown when a user taps a locked feature.
 * The unlock CTA routes to the subscription/billing page.
 */
const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
    isOpen, onClose,
    title = 'Unlock SMS Messaging',
    description = 'Send SMS straight to your customers from SalePilot. This is a premium add-on you can unlock for a small monthly fee.',
    bullets = [
        'Text customers one-to-one from their profile',
        'Use quick templates for offers, reminders & thank-yous',
        'Every message logged against the customer',
    ],
    upgradeHref = '/subscription',
}) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-md bg-surface rounded-3xl border border-brand-border shadow-2xl overflow-hidden animate-scale-in">
                <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-xl text-brand-text-muted hover:bg-surface-variant transition-colors active:scale-95">
                    <XMarkIcon className="w-5 h-5" />
                </button>

                {/* Hero */}
                <div className="px-6 pt-8 pb-6 bg-gradient-to-br from-sp-green/10 to-sp-amber/10 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-sp-green text-white flex items-center justify-center shadow-lg mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 3v-3z" /></svg>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sp-amber/20 text-sp-amber text-[11px] font-bold uppercase tracking-wide mb-2">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1l2.5 5.5L18 7l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" /></svg>
                        Premium add-on
                    </div>
                    <h3 className="text-xl font-bold text-brand-text">{title}</h3>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-sm text-brand-text-muted mb-4">{description}</p>
                    <ul className="space-y-2.5 mb-6">
                        {bullets.map(b => (
                            <li key={b} className="flex items-start gap-2.5 text-sm text-brand-text">
                                <svg className="w-5 h-5 text-sp-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                {b}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={() => { onClose(); navigate(upgradeHref); }}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-surface font-semibold rounded-xl shadow-sm hover:opacity-90 transition-all active:scale-95"
                    >
                        Unlock this feature
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full mt-2 px-6 py-2.5 text-sm font-semibold text-brand-text-muted hover:text-brand-text transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumUpgradeModal;
