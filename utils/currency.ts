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

export const formatCurrency = (amount: number | string | undefined, settings: StoreSettings): string => {
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