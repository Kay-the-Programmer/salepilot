import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeDate, toDateInputValue } from './date';

/**
 * Clocks and calendars, which the app got wrong in two separate ways.
 *
 * The API used to send `"Aug 11, 2026, 11:24:50 AM"` — no timezone — so a UTC
 * instant was read as local and a sale rung up seconds ago displayed as two
 * hours old in Zambia. That is fixed at the source; these pin the client half:
 * that ISO in gives honest elapsed time out, and that "today" means the
 * viewer's today rather than UTC's.
 */
describe('formatRelativeDate', () => {
    it('calls a fresh ISO timestamp just now, whatever the local offset', () => {
        expect(formatRelativeDate(new Date().toISOString())).toBe('just now');
    });

    it('measures from the instant, not from the wall clock', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        expect(formatRelativeDate(twoHoursAgo.toISOString())).toBe('2h ago');
    });

    it('reads an offset timestamp as the same instant as its UTC form', () => {
        const utc = '2026-08-11T09:11:37.758Z';
        const plusTwo = '2026-08-11T11:11:37.758+02:00';
        expect(formatRelativeDate(utc)).toBe(formatRelativeDate(plusTwo));
    });

    it('says so plainly when there is no date rather than inventing one', () => {
        expect(formatRelativeDate(null)).toBe('—');
        expect(formatRelativeDate('not a date')).toBe('—');
    });
});

describe('toDateInputValue', () => {
    afterEach(() => vi.useRealTimers());

    it('gives the local calendar day, not UTC’s', () => {
        // 00:30 on the 12th in Zambia (UTC+2) is still the 11th in UTC. The old
        // `toISOString().slice(0,10)` returned the 11th here, so a form
        // defaulting to "today" opened on yesterday until 2am.
        const localMidnightish = new Date(2026, 7, 12, 0, 30);
        expect(toDateInputValue(localMidnightish)).toBe('2026-08-12');
    });

    it('keeps the first of the month on the first of the month', () => {
        // `new Date(y, m, 1)` is local midnight, which in UTC is the previous
        // month — so a "this month" range used to start in the month before.
        expect(toDateInputValue(new Date(2026, 7, 1))).toBe('2026-08-01');
    });

    it('pads so the value is what an <input type="date"> accepts', () => {
        expect(toDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('defaults to today when handed nothing', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 7, 31, 15, 0, 0));
        expect(toDateInputValue()).toBe('2026-08-31');
    });

    it('passes a plain date string through as the same day', () => {
        // What the API now sends for a DATE column. It must survive a round
        // trip into a date input unchanged.
        expect(toDateInputValue('2026-08-11')).toBe('2026-08-11');
    });
});
