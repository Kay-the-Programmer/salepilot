import { describe, expect, it } from 'vitest';
import { Product, Category, StoreSettings } from '../../types';
import { buildClosingStockReport, buildClosingStockCsv } from './closingStockModel';

const mockProduct = (over: Partial<Product> = {}): Product => ({
    id: 'p1',
    name: 'Product 1',
    description: '',
    sku: 'SKU-001',
    barcode: '12345678',
    price: 150,
    costPrice: 100,
    stock: 10,
    status: 'active',
    categoryId: 'cat1',
    imageUrls: [],
    reorderPoint: 5,
    ...over,
} as Product);

const mockCategories: Category[] = [
    { id: 'cat1', name: 'Beverages' } as unknown as Category,
    { id: 'cat2', name: 'Snacks' } as unknown as Category,
];

const mockSettings: StoreSettings = {
    name: 'Test Store',
    currency: { code: 'USD', symbol: '$', position: 'before' },
    lowStockThreshold: 5,
} as StoreSettings;

describe('closingStockModel', () => {
    it('calculates total closing stock valuation at cost and retail', () => {
        const products: Product[] = [
            mockProduct({ id: 'p1', stock: 10, costPrice: 100, price: 150 }),
            mockProduct({ id: 'p2', stock: 5, costPrice: 40, price: 60, categoryId: 'cat2' }),
        ];

        const report = buildClosingStockReport(products, mockCategories, mockSettings);

        // p1: 10 * 100 = 1000 cost, 10 * 150 = 1500 retail
        // p2: 5 * 40 = 200 cost, 5 * 60 = 300 retail
        // Totals: 1200 cost, 1800 retail, 600 profit
        expect(report.totalCostValue).toBe(1200);
        expect(report.totalRetailValue).toBe(1800);
        expect(report.potentialProfit).toBe(600);
        expect(report.totalUnits).toBe(15);
        expect(report.totalSkus).toBe(2);
        expect(report.overallMarginPct).toBeCloseTo(33.33, 1);
    });

    it('ignores archived products from closing stock valuation', () => {
        const products: Product[] = [
            mockProduct({ id: 'p1', stock: 10, costPrice: 100, price: 150, status: 'active' }),
            mockProduct({ id: 'p2', stock: 5, costPrice: 40, price: 60, status: 'archived' }),
        ];

        const report = buildClosingStockReport(products, mockCategories, mockSettings);

        expect(report.totalSkus).toBe(1);
        expect(report.totalCostValue).toBe(1000);
        expect(report.totalUnits).toBe(10);
    });

    it('flags items missing cost price and computes conservative valuation', () => {
        const products: Product[] = [
            mockProduct({ id: 'p1', stock: 10, costPrice: 100, price: 150 }),
            mockProduct({ id: 'p2', stock: 5, costPrice: 0, price: 60 }),
            mockProduct({ id: 'p3', stock: 2, costPrice: undefined, price: 40 }),
        ];

        const report = buildClosingStockReport(products, mockCategories, mockSettings);

        expect(report.missingCostCount).toBe(2);
        expect(report.totalCostValue).toBe(1000); // only p1 contributes to cost valuation
    });

    it('categorizes stock status accurately (in_stock, low_stock, out_of_stock, negative)', () => {
        const products: Product[] = [
            mockProduct({ id: 'p1', stock: 20, reorderPoint: 5 }), // in_stock
            mockProduct({ id: 'p2', stock: 4, reorderPoint: 5 }),  // low_stock
            mockProduct({ id: 'p3', stock: 0, reorderPoint: 5 }),  // out_of_stock
            mockProduct({ id: 'p4', stock: -2, reorderPoint: 5 }), // negative
        ];

        const report = buildClosingStockReport(products, mockCategories, mockSettings);

        expect(report.inStockCount).toBe(1);
        expect(report.lowStockCount).toBe(1);
        expect(report.outOfStockCount).toBe(1);
        expect(report.negativeStockCount).toBe(1);
    });

    it('aggregates category valuations and percentage shares correctly', () => {
        const products: Product[] = [
            mockProduct({ id: 'p1', categoryId: 'cat1', stock: 10, costPrice: 100, price: 150 }),
            mockProduct({ id: 'p2', categoryId: 'cat2', stock: 10, costPrice: 100, price: 150 }),
        ];

        const report = buildClosingStockReport(products, mockCategories, mockSettings);

        expect(report.categories.length).toBe(2);
        expect(report.categories[0].costSharePct).toBe(50);
        expect(report.categories[1].costSharePct).toBe(50);
    });

    it('generates valid RFC 4180 CSV export content', () => {
        const products: Product[] = [
            mockProduct({ id: 'p1', name: 'Coffee "Special" Blend', stock: 10, costPrice: 100, price: 150 }),
        ];

        const report = buildClosingStockReport(products, mockCategories, mockSettings);
        const csv = buildClosingStockCsv(report, mockSettings);

        expect(csv).toContain('"SKU","Barcode","Product Name"');
        expect(csv).toContain('"Coffee ""Special"" Blend"');
        expect(csv).toContain('--- SUMMARY ---');
        expect(csv).toContain('"Total Closing Stock Valuation (Cost):"');
    });
});
