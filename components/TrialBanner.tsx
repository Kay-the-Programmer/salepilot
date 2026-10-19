import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';

/**
 * A quiet strip warning that the trial or subscription is about to run out,
 * and a louder one once it has and the shop is inside its grace days.
 *
 * SalePilot is paid-only, so lapsing stops the till. A shop should never be
 * surprised by that: the 7-day trial is short, and in this market a
 * mobile-money payment can take a day to clear, so the warning has to start
 * before the date and keep going through the grace period.
 *
 * Deliberately not a modal — it must not interrupt someone serving a customer.
 * The hard stop is `SubscriptionRequiredHost`, and only after grace.
 */

/** Grace days the server allows after expiry; mirrors SUBSCRIPTION_GRACE_DAYS. */
const GRACE_DAYS = 3;
/** Start warning this many days before the end date. */
const WARN_WITHIN_DAYS = 3;

const dayDiff = (from: number, to: number) => Math.ceil((to - from) / 86400000);

const TrialBanner: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [dismissed, setDismissed] = useState(false);
    const user = getCurrentUser();

    const state = useMemo(() => {
        const status = user?.subscriptionStatus;
        const endsAt = user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt).getTime() : NaN;
        if (!status || !Number.isFinite(endsAt)) return null;
        if (status !== 'trial' && status !== 'active' && status !== 'past_due') return null;

        const now = Date.now();
        const daysLeft = dayDiff(now, endsAt);
        const daysOver = -daysLeft;

        // Already lapsed, inside grace: the app still works, but not for long.
        if (daysLeft <= 0) {
            const graceLeft = GRACE_DAYS - daysOver;
            if (graceLeft <= 0) return null; // past grace — the takeover handles it
            return {
                tone: 'urgent' as const,
                text: status === 'trial'
                    ? `Your free trial ended. ${graceLeft} day${graceLeft === 1 ? '' : 's'} left before your till stops.`
                    : `Your subscription expired. ${graceLeft} day${graceLeft === 1 ? '' : 's'} left before your till stops.`,
                cta: status === 'trial' ? 'Choose a plan' : 'Renew now',
            };
        }

        // Running out soon.
        if (daysLeft <= WARN_WITHIN_DAYS) {
            return {
                tone: 'warn' as const,
                text: status === 'trial'
                    ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left of your free trial.`
                    : `Your subscription renews in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
                cta: status === 'trial' ? 'Choose a plan' : 'Manage billing',
            };
        }
        return null;
    }, [user?.subscriptionStatus, user?.subscriptionEndsAt]);

    // Never in the way of the billing page itself, the storefront, or sign-in.
    const path = location.pathname;
    const hidden = dismissed
        || path.startsWith('/subscription')
        || path.startsWith('/shop/')
        || path.startsWith('/login')
        || path.startsWith('/register');

    if (!state || hidden) return null;

    const urgent = state.tone === 'urgent';
    return (
        <div
            role="status"
            className={`w-full flex items-center justify-center gap-3 px-4 py-2 text-xs font-semibold ${
                urgent ? 'bg-sp-orange text-white' : 'bg-warm-100 text-brand-text'
            }`}
        >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
                {urgent ? 'warning' : 'schedule'}
            </span>
            <span>{state.text}</span>
            <button
                onClick={() => navigate('/subscription')}
                className={`px-3 py-1 rounded-lg font-bold ${urgent ? 'bg-white text-sp-orange' : 'bg-sp-navy text-white'}`}
            >
                {state.cta}
            </button>
            {!urgent && (
                <button
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss"
                    className="ml-1 opacity-70 hover:opacity-100"
                >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
                </button>
            )}
        </div>
    );
};

export default TrialBanner;
