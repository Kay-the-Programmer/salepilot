import { describe, it, expect } from 'vitest';
import { sanitizePhone, phoneError, PHONE_MAX_DIGITS } from './phone';

/**
 * The store registration phone field takes digits and nothing else. Sanitising
 * runs on every change rather than on submit, so typing, pasting and browser
 * autofill all go through it — a letter never reaches the field's value at all.
 */
describe('sanitizePhone', () => {
    it('keeps a plain digit string untouched', () => {
        expect(sanitizePhone('0971234567')).toBe('0971234567');
    });

    it('strips letters', () => {
        expect(sanitizePhone('call me')).toBe('');
        expect(sanitizePhone('097abc1234')).toBe('0971234');
    });

    it('strips the separators people type', () => {
        expect(sanitizePhone('+260 971 234 567')).toBe('+260971234567');
        expect(sanitizePhone('(097) 123-4567')).toBe('0971234567');
    });

    it('keeps a leading + for the country code', () => {
        expect(sanitizePhone('+260971234567')).toBe('+260971234567');
    });

    it('keeps only ONE plus, and only at the front', () => {
        expect(sanitizePhone('++260971234567')).toBe('+260971234567');
        expect(sanitizePhone('260+971234567')).toBe('260971234567');
    });

    it('drops every other symbol', () => {
        expect(sanitizePhone('097#123*4567')).toBe('0971234567');
        expect(sanitizePhone("097'123\"456")).toBe('097123456');
    });

    it('is idempotent — re-running it changes nothing', () => {
        const once = sanitizePhone('+260 (971) 234-567');
        expect(sanitizePhone(once)).toBe(once);
    });

    it('leaves an empty field empty, since the number is optional', () => {
        expect(sanitizePhone('')).toBe('');
        expect(sanitizePhone('   ')).toBe('');
    });
});

/**
 * Sanitising alone would accept "1" or a 40-digit run, so length is checked too
 * — the same bounds the server enforces on the registration request.
 */
describe('phoneError', () => {
    it('matches E.164 — at most 15 digits', () => {
        expect(PHONE_MAX_DIGITS).toBe(15);
    });

    it('rejects a half-typed number', () => {
        expect(phoneError(sanitizePhone('0971'))).toMatch(/at least 7 digits/);
    });

    it('rejects a run longer than any real number', () => {
        expect(phoneError(sanitizePhone('1'.repeat(16)))).toMatch(/longer than 15 digits/);
    });

    it('accepts a real Zambian mobile number in either form', () => {
        for (const value of ['0971234567', '+260971234567']) {
            expect(phoneError(sanitizePhone(value))).toBeNull();
        }
    });

    it('treats an empty field as valid — the number is optional', () => {
        expect(phoneError('')).toBeNull();
    });
});
