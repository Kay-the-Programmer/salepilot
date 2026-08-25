import { describe, it, expect } from 'vitest';
import { computeTax, rateFor, toTaxClass } from './tax';

/**
 * This engine is a mirror of `src/services/tax.ts` in s-back, and the numbers
 * below are the same ones its suite pins. That is the point of the file: the
 * till quotes a customer a total before the server has seen the sale, and the
 * server then recomputes it as the authority. If the two drift apart a shopper
 * is quoted one figure and charged another — which is not an error either side
 * can detect on its own.
 */

const EXCLUSIVE = { standardRatePct: 16, pricesIncludeTax: false };
const INCLUSIVE = { standardRatePct: 16, pricesIncludeTax: true };
const line = (price: number, quantity: number, taxClass: any = 'standard') =>
    ({ price, quantity, taxClass });

describe('tax classes', () => {
    it('charges the store rate on standard goods and nothing on the rest', () => {
        expect(rateFor('standard', 16)).toBe(0.16);
        expect(rateFor('zero', 16)).toBe(0);
        expect(rateFor('exempt', 16)).toBe(0);
    });

    it('treats an unknown class as taxable rather than exempt', () => {
        // Over-collecting is a complaint at the counter the same day;
        // under-collecting is a debt discovered at audit.
        expect(toTaxClass(undefined)).toBe('standard');
        expect(toTaxClass('nonsense')).toBe('standard');
    });
});

describe('prices excluding tax', () => {
    it('reproduces the old flat-rate maths for a single-rate store', () => {
        const r = computeTax([line(100, 2), line(50, 1)], 0, EXCLUSIVE);
        expect([r.subtotal, r.tax, r.total]).toEqual([250, 40, 290]);
    });

    it('taxes only the taxable half of a mixed basket', () => {
        // The bug this replaces: one rate on the subtotal charged tax on the
        // zero-rated mealie meal as well as the soap.
        const r = computeTax([line(200, 1, 'zero'), line(100, 1)], 0, EXCLUSIVE);
        expect([r.subtotal, r.tax, r.total]).toEqual([300, 16, 316]);
    });

    it('spreads a discount across the basket in proportion', () => {
        const r = computeTax([line(200, 1, 'zero'), line(100, 1)], 30, EXCLUSIVE);
        expect([r.subtotal, r.discount, r.tax, r.total]).toEqual([300, 30, 14.4, 284.4]);
    });
});

describe('prices including tax', () => {
    it('extracts the tax instead of adding it, so the marked price stands', () => {
        const r = computeTax([line(116, 1)], 0, INCLUSIVE);
        expect([r.subtotal, r.tax, r.total]).toEqual([100, 16, 116]);
    });

    it('leaves a zero-rated inclusive price whole', () => {
        const r = computeTax([line(116, 1, 'zero')], 0, INCLUSIVE);
        expect([r.subtotal, r.tax, r.total]).toEqual([116, 0, 116]);
    });

    it('takes a discount off what the customer sees', () => {
        const r = computeTax([line(116, 1)], 16, INCLUSIVE);
        expect(r.total).toBe(100);
        expect(r.tax).toBeLessThan(16);
    });
});

describe('invariants every sale depends on', () => {
    const baskets = [
        { lines: [line(100, 3), line(45.5, 2, 'zero')], discount: 0 },
        { lines: [line(19.99, 7), line(3.33, 11, 'exempt')], discount: 25 },
        { lines: [line(0.05, 3), line(1234.56, 1)], discount: 1000 },
        { lines: [line(12.5, 2, 'zero'), line(12.5, 2), line(12.5, 2, 'exempt')], discount: 7.77 },
    ];

    for (const config of [EXCLUSIVE, INCLUSIVE]) {
        const mode = config.pricesIncludeTax ? 'inclusive' : 'exclusive';
        baskets.forEach((b, i) => {
            it(`${mode} basket ${i + 1} holds total = subtotal − discount + tax`, () => {
                // The sales row, the ledger and the dashboard all assume this.
                // A cent of drift unbalances the journal entry and the sale is
                // rejected outright.
                const r = computeTax(b.lines, b.discount, config);
                expect(r.total).toBe(Number((r.subtotal - r.discount + r.tax).toFixed(2)));
            });

            it(`${mode} basket ${i + 1} breakdown sums to the tax charged`, () => {
                const r = computeTax(b.lines, b.discount, config);
                expect(Number(r.byClass.reduce((a, c) => a + c.tax, 0).toFixed(2))).toBe(r.tax);
                expect(Number(r.byClass.reduce((a, c) => a + c.net, 0).toFixed(2)))
                    .toBe(Number((r.subtotal - r.discount).toFixed(2)));
            });
        });
    }
});

describe('edges', () => {
    it('returns zeros for an empty basket rather than NaN', () => {
        const r = computeTax([], 0, EXCLUSIVE);
        expect([r.subtotal, r.discount, r.tax, r.total]).toEqual([0, 0, 0, 0]);
    });

    it('cannot be discounted below nothing', () => {
        expect(computeTax([line(50, 1)], 9999, EXCLUSIVE).total).toBe(0);
    });

    it('ignores a line whose price is rubbish', () => {
        const r = computeTax(
            [{ price: 'abc' as any, quantity: 2, taxClass: 'standard' as any }, line(100, 1)],
            0,
            EXCLUSIVE,
        );
        expect([r.subtotal, r.tax]).toEqual([100, 16]);
    });
});
