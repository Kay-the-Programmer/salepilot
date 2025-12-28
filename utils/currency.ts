import { StoreSettings } from '../types';

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