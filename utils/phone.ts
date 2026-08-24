/**
 * Phone number entry rules, shared by the forms that collect one.
 *
 * A phone number is digits. `sanitizePhone` is meant to run on every change
 * rather than on submit, so typing, pasting and browser autofill all go through
 * it and a letter never reaches the field's value at all. The only non-digit
 * kept is a leading "+", because these fields accept international numbers.
 *
 * The bounds match what the server enforces on the same values.
 */

/** E.164 caps a number at 15 digits; below 7 nothing dialable exists. */
export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;

/**
 * Reduce anything typed into a phone field to digits, keeping a single leading
 * "+". Separators (spaces, dashes, brackets) are dropped so the stored value is
 * canonical rather than however it happened to be typed.
 */
export const sanitizePhone = (raw: string): string => {
    const plus = raw.trimStart().startsWith('+') ? '+' : '';
    return plus + raw.replace(/\D/g, '');
};

/** Just the digits, which is what the length rules apply to. */
export const phoneDigitCount = (value: string): number => value.replace(/\D/g, '').length;

/**
 * Why this number won't do, or null if it's fine. An empty value is fine —
 * callers that require a number should check for emptiness themselves.
 */
export const phoneError = (value: string): string | null => {
    const digits = phoneDigitCount(value);
    if (digits === 0) return null;
    if (digits < PHONE_MIN_DIGITS) return `Enter at least ${PHONE_MIN_DIGITS} digits, or leave this blank.`;
    if (digits > PHONE_MAX_DIGITS) return `A phone number cannot be longer than ${PHONE_MAX_DIGITS} digits.`;
    return null;
};
