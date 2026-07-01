import { useEffect, useState } from 'react';

/**
 * Shared presentation helpers for the limited-time *offer* layer that campaigns
 * can attach (discount / coupon / countdown). Used by the inline UpsellCard and
 * the PaywallHost so the two render offers identically.
 */

/** Live countdown label for an offer expiry, or null if absent/elapsed. Ticks ~1/s. */
export function useCountdown(endsAt?: number): string | null {
    const [, force] = useState(0);
    useEffect(() => {
        if (!endsAt) return;
        const t = setInterval(() => force(n => n + 1), 1000);
        return () => clearInterval(t);
    }, [endsAt]);
    if (!endsAt) return null;
    const ms = endsAt - Date.now();
    if (ms <= 0) return null;
    const total = Math.floor(ms / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return d > 0 ? `${d}d ${h}h left` : `${pad(h)}:${pad(m)}:${pad(s)} left`;
}

export const money = (n: number, currency: string): string => {
    const sym = currency === 'USD' ? '$' : currency === 'ZMW' ? 'K' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '';
    const v = (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
    return sym ? `${sym}${v}` : `${currency} ${v}`;
};

/** Catalogue price after a percentage discount (server applies the same maths). */
export const discounted = (price: number, pct?: number): number =>
    pct ? Math.round(price * (100 - pct)) / 100 : price;
