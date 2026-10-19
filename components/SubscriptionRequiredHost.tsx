import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Takes over the screen when the shop's trial or subscription has lapsed past
 * its grace days, and offers the smaller nudge when they hit a plan ceiling.
 *
 * SalePilot is a paid product: there is no free tier behind the trial, so a
 * lapsed store genuinely cannot trade until it pays. That deserves a plain
 * explanation and one button, not a toast on every failed request — the API
 * layer fires `salepilot:subscription-required` for exactly this, and billing
 * stays reachable from inside the lock so the button always works.
 *
 * `salepilot:plan-limit` is the softer case: they are paid up but at a
 * ceiling (shops, staff logins, products), so the app keeps working and this
 * only explains what ran out.
 */

interface LapseDetail {
    message?: string;
    subscriptionStatus?: string;
    endedAt?: string | null;
}

interface LimitDetail {
    limit?: string;
    allowed?: number;
    used?: number;
    message?: string;
}

const LIMIT_LABELS: Record<string, string> = {
    stores: 'shops',
    seats: 'staff logins',
    products: 'products',
};

const SubscriptionRequiredHost: React.FC = () => {
    const navigate = useNavigate();
    const [lapse, setLapse] = useState<LapseDetail | null>(null);
    const [limit, setLimit] = useState<LimitDetail | null>(null);

    useEffect(() => {
        const onLapse = (e: Event) => setLapse((e as CustomEvent).detail || {});
        const onLimit = (e: Event) => setLimit((e as CustomEvent).detail || {});
        window.addEventListener('salepilot:subscription-required', onLapse as EventListener);
        window.addEventListener('salepilot:plan-limit', onLimit as EventListener);
        return () => {
            window.removeEventListener('salepilot:subscription-required', onLapse as EventListener);
            window.removeEventListener('salepilot:plan-limit', onLimit as EventListener);
        };
    }, []);

    const toBilling = useCallback(() => {
        setLapse(null);
        setLimit(null);
        navigate('/subscription');
    }, [navigate]);

    if (lapse) {
        const wasTrial = lapse.subscriptionStatus === 'trial';
        return (
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="sub-required-title"
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <div className="w-full max-w-md rounded-2xl bg-surface border border-brand-border shadow-xl p-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-sp-orange" aria-hidden="true">
                        lock_clock
                    </span>
                    <h2 id="sub-required-title" className="mt-3 text-xl font-bold text-brand-text">
                        {wasTrial ? 'Your free trial has ended' : 'Your subscription has expired'}
                    </h2>
                    <p className="mt-2 text-sm text-brand-text-muted">
                        {lapse.message
                            || (wasTrial
                                ? 'Choose a plan to carry on using SalePilot.'
                                : 'Renew to carry on using SalePilot.')}
                    </p>
                    <p className="mt-3 text-xs text-brand-text-muted">
                        Your shop’s data is safe and waiting — sales, stock and customers are all still there.
                    </p>
                    <button
                        onClick={toBilling}
                        className="mt-5 w-full py-3 rounded-xl font-semibold bg-sp-navy text-white active:scale-[0.98] transition"
                    >
                        {wasTrial ? 'Choose a plan' : 'Renew now'}
                    </button>
                </div>
            </div>
        );
    }

    if (limit) {
        const what = LIMIT_LABELS[limit.limit || ''] || 'capacity';
        return (
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="plan-limit-title"
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
            >
                <div className="w-full max-w-md rounded-2xl bg-surface border border-brand-border shadow-xl p-6">
                    <h2 id="plan-limit-title" className="text-lg font-bold text-brand-text">
                        You’ve used all your {what}
                    </h2>
                    <p className="mt-2 text-sm text-brand-text-muted">
                        {limit.message || `Your plan includes ${limit.allowed} ${what}.`}
                        {' '}Every feature is included on every plan — a larger plan simply raises this ceiling.
                    </p>
                    <div className="mt-5 flex gap-2">
                        <button
                            onClick={() => setLimit(null)}
                            className="flex-1 py-3 rounded-xl font-semibold border border-brand-border text-brand-text"
                        >
                            Not now
                        </button>
                        <button
                            onClick={toBilling}
                            className="flex-1 py-3 rounded-xl font-semibold bg-sp-navy text-white active:scale-[0.98] transition"
                        >
                            See plans
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default SubscriptionRequiredHost;
