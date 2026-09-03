import { describe, expect, it } from 'vitest';
import { Product } from '../../types';
import { applyPriceChange } from './BulkActions';

const product = (over: Partial<Product> = {}): Product => ({
    id: 'p1',
    name: 'Test',
    sku: 'SKU-1',
    price: 100,
    costPrice: 60,
    stock: 5,
    status: 'active',
    ...over,
} as Product);

describe('applyPriceChange', () => {
    it('raises the selling price by a percentage', () => {
        expect(applyPriceChange(product(), { mode: 'percent', field: 'price', value: 10 }))
            .toEqual({ price: 110 });
    });

    it('lowers it on a negative percentage', () => {
        expect(applyPriceChange(product(), { mode: 'percent', field: 'price', value: -15 }))
            .toEqual({ price: 85 });
    });

    it('adds and subtracts a flat amount', () => {
        expect(applyPriceChange(product(), { mode: 'amount', field: 'price', value: 12.5 }))
            .toEqual({ price: 112.5 });
        expect(applyPriceChange(product(), { mode: 'amount', field: 'price', value: -12.5 }))
            .toEqual({ price: 87.5 });
    });

    it('sets an absolute price, ignoring what was there', () => {
        expect(applyPriceChange(product({ price: 3 }), { mode: 'set', field: 'price', value: 42 }))
            .toEqual({ price: 42 });
    });

    it('touches only the field asked for', () => {
        expect(applyPriceChange(product(), { mode: 'percent', field: 'costPrice', value: 50 }))
            .toEqual({ costPrice: 90 });
        expect(applyPriceChange(product(), { mode: 'percent', field: 'both', value: 100 }))
            .toEqual({ price: 200, costPrice: 120 });
    });

    it('rounds to whole cents rather than leaving float dust', () => {
        // 19.99 * 1.075 = 21.489249999… — a price must not carry that into the till.
        const { price } = applyPriceChange(product({ price: 19.99 }), { mode: 'percent', field: 'price', value: 7.5 });
        expect(price).toBe(21.49);
    });

    it('never produces a negative price', () => {
        expect(applyPriceChange(product({ price: 10 }), { mode: 'amount', field: 'price', value: -50 }))
            .toEqual({ price: 0 });
        expect(applyPriceChange(product({ price: 10 }), { mode: 'percent', field: 'price', value: -300 }))
            .toEqual({ price: 0 });
    });

    it('treats a missing cost price as zero instead of NaN', () => {
        expect(applyPriceChange(product({ costPrice: undefined }), { mode: 'percent', field: 'costPrice', value: 10 }))
            .toEqual({ costPrice: 0 });
        expect(applyPriceChange(product({ costPrice: undefined }), { mode: 'amount', field: 'costPrice', value: 25 }))
            .toEqual({ costPrice: 25 });
    });

    it('handles prices arriving as strings from the API', () => {
        expect(applyPriceChange(product({ price: '250.00' as unknown as number }), { mode: 'percent', field: 'price', value: 10 }))
            .toEqual({ price: 275 });
    });
});
