/**
 * Amount in words, for the "The sum of (In words)" line a receipt carries.
 *
 * Written out rather than pulled from a library because the phrasing is
 * currency-specific: Zambian receipts read "One Thousand Two Hundred Kwacha and
 * Fifty Ngwee Only", and the minor unit's name comes from the store's currency
 * settings rather than being hard-coded.
 */

const ONES = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES: [number, string][] = [
    [1_000_000_000, 'Billion'],
    [1_000_000, 'Million'],
    [1_000, 'Thousand'],
];

/** 0–999 in words. */
const underThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ONES[n];
    if (n < 100) {
        const tens = TENS[Math.floor(n / 10)];
        const rest = n % 10;
        return rest ? `${tens}-${ONES[rest]}` : tens;
    }
    const hundreds = `${ONES[Math.floor(n / 100)]} Hundred`;
    const rest = n % 100;
    return rest ? `${hundreds} and ${underThousand(rest)}` : hundreds;
};

/** Whole number in words. Returns 'Zero' for 0. */
export const numberToWords = (value: number): string => {
    let n = Math.floor(Math.abs(value));
    if (n === 0) return 'Zero';

    const parts: string[] = [];
    for (const [scale, label] of SCALES) {
        if (n >= scale) {
            parts.push(`${underThousand(Math.floor(n / scale))} ${label}`);
            n %= scale;
        }
    }
    if (n > 0) parts.push(underThousand(n));
    return parts.join(' ').replace(/\s+/g, ' ').trim();
};

/**
 * Full receipt phrasing, e.g.
 *   "One Thousand Two Hundred Kwacha and Fifty Ngwee Only"
 *
 * `major`/`minor` name the currency units; they default to the Kwacha/Ngwee
 * pair these receipts use.
 */
export const amountInWords = (
    value: number,
    major = 'Kwacha',
    minor = 'Ngwee',
): string => {
    const safe = Number.isFinite(value) ? Math.abs(value) : 0;
    const whole = Math.floor(safe);
    // Rounded, not truncated: 10.999 is ten kwacha and one hundred ngwee
    // nowhere — it's eleven kwacha.
    const cents = Math.round((safe - whole) * 100);
    if (cents === 100) return amountInWords(whole + 1, major, minor);

    const head = `${numberToWords(whole)} ${major}`;
    if (cents === 0) return `${head} Only`;
    return `${head} and ${numberToWords(cents)} ${minor} Only`;
};

/** Currency unit names for a store's configured currency. */
export const currencyUnits = (code?: string | null): { major: string; minor: string } => {
    switch ((code || 'ZMW').toUpperCase()) {
        case 'ZMW': return { major: 'Kwacha', minor: 'Ngwee' };
        case 'USD': return { major: 'Dollars', minor: 'Cents' };
        case 'GBP': return { major: 'Pounds', minor: 'Pence' };
        case 'EUR': return { major: 'Euros', minor: 'Cents' };
        case 'ZAR': return { major: 'Rand', minor: 'Cents' };
        case 'KES': return { major: 'Shillings', minor: 'Cents' };
        case 'TZS': return { major: 'Shillings', minor: 'Cents' };
        case 'MWK': return { major: 'Kwacha', minor: 'Tambala' };
        default: return { major: (code || '').toUpperCase() || 'Units', minor: 'Cents' };
    }
};
