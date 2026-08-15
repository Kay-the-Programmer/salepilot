import { StoreSettings } from '../types';

/**
 * Currency formatter for contexts without per-store `StoreSettings` (platform/admin,
 * customer portal, etc.). Replaces the ad-hoc `new Intl.NumberFormat(...)` blocks that
 * were copied into several pages. Null/NaN-safe.
 */
export const formatMoney = (
    amount: number | string | undefined | null,
    options: { currency?: string; locale?: string; minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string => {
    const { currency = 'ZMW', locale = 'en-ZM', minimumFractionDigits, maximumFractionDigits } = options;
    const n = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
    const safe = Number.isFinite(n as number) ? (n as number) : 0;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(safe);
};

/**
 * Fallback tender list, used only before settings load or for a store with none
 * configured. Identical to what the server seeds a new store with
 * (s-back settings.controller), so the till can never offer a method the
 * store's own Settings page doesn't know about.
 */
export const DEFAULT_PAYMENT_METHODS: { id: string; name: string }[] = [
    { id: 'cash', name: 'CASH' },
    { id: 'airtel', name: 'AIRTEL' },
    { id: 'mtn', name: 'MTN' },
];

/** The store's tenders, falling back to the seeded defaults. */
export const paymentMethodsOf = (
    settings?: { paymentMethods?: { id: string; name: string }[] } | null,
): { id: string; name: string }[] =>
    settings?.paymentMethods?.length ? settings.paymentMethods : DEFAULT_PAYMENT_METHODS;

/**
 * Does this tender take physical cash (and so need an amount and change)?
 * Decided by the configured method's id first, so a store that renames its cash
 * method still gets the cash box; the name is the fallback for older rows.
 */
export const isCashMethod = (
    name: string | undefined | null,
    settings?: { paymentMethods?: { id: string; name: string }[] } | null,
): boolean => {
    if (!name) return false;
    const method = paymentMethodsOf(settings).find(m => m.name.toLowerCase() === name.toLowerCase());
    const id = (method?.id || '').toLowerCase();
    if (id === 'cash' || id === 'pm_cash') return true;
    return (method?.name || name).toLowerCase().includes('cash');
};

export const formatCurrency =(amount: number | string | undefined, settings: StoreSettings): string => {
    // Convert string to number if needed
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (numericAmount === undefined || isNaN(numericAmount)) {
        return settings.currency.position === 'before'
            ? `${settings.currency.symbol}0.00`
            : `0.00${settings.currency.symbol}`;
    }

    const isNegative = numericAmount < 0;
    const absAmount = Math.abs(numericAmount);

    const numberPart = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    }).format(absAmount);

    const combined = settings.currency.position === 'before'
        ? `${settings.currency.symbol}${numberPart}`
        : `${numberPart}${settings.currency.symbol}`;

    return isNegative ? `-${combined}` : combined;
};