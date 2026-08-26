import { describe, it, expect } from 'vitest';
import { CartItem, cartSubtotal, cartTotals } from './cartStore';

/**
 * What the storefront quotes has to be what the server charges. The cart page
 * and the checkout page both show a total before any order exists; the server
 * then recomputes it as the authority. A shopper quoted one figure and charged
 * another is the failure this covers.
 */

const item = (over: Partial<CartItem>): CartItem => ({
    id: 'p1', name: 'Item', price: 100, quantity: 1, stock: 10, ...over,
});

const SETTINGS = { taxRate: 16, pricesIncludeTax: false };

describe('cartTotals', () => {
    it('adds tax to a standard-rated basket', () => {
        const t = cartTotals([item({ price: 100, quantity: 2 })], SETTINGS);
        expect([t.subtotal, t.tax, t.total]).toEqual([200, 32, 232]);
    });

    it('charges nothing on zero-rated goods', () => {
        const t = cartTotals([item({ price: 80, taxClass: 'zero' })], SETTINGS);
        expect([t.subtotal, t.tax, t.total]).toEqual([80, 0, 80]);
    });

    it('taxes only the taxable part of a mixed basket', () => {
        // The whole reason this stopped being one rate on the subtotal.
        const t = cartTotals(
            [item({ id: 'a', price: 200, taxClass: 'zero' }), item({ id: 'b', price: 100 })],
            SETTINGS,
        );
        expect([t.subtotal, t.tax, t.total]).toEqual([300, 16, 316]);
    });

    it('extracts tax from the price when the store quotes it inclusive', () => {
        // A marked price of 116 stays 116 — that is the point of the mode.
        const t = cartTotals([item({ price: 116 })], { taxRate: 16, pricesIncludeTax: true });
        expect([t.subtotal, t.tax, t.total]).toEqual([100, 16, 116]);
    });

    it('treats a cart saved before tax classes existed as standard rated', () => {
        // Carts live in localStorage. An old one has no taxClass on its items,
        // and must keep behaving exactly as it did.
        const t = cartTotals([item({ price: 100, taxClass: undefined })], SETTINGS);
        expect(t.tax).toBe(16);
    });

    it('survives a store with no tax configured at all', () => {
        const t = cartTotals([item({ price: 100 })], undefined);
        expect([t.subtotal, t.tax, t.total]).toEqual([100, 0, 100]);
    });

    it('still reports the plain sum of the lines for display', () => {
        // cartSubtotal is what the drawer shows; it stays gross-of-nothing.
        expect(cartSubtotal([item({ price: 100, quantity: 3 })])).toBe(300);
    });
});
