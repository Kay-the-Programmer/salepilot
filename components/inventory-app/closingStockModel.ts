import { Product, Category, StoreSettings } from '../../types';
import { num } from '../crm/crmModel';
import { thresholdFor } from './inventoryModel';

export type ClosingStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'negative';

export interface ClosingStockItem {
    id: string;
    name: string;
    sku: string;
    barcode: string;
    categoryId: string;
    categoryName: string;
    unitOfMeasure: string;
    stock: number;
    reorderPoint: number;
    costPrice: number;
    retailPrice: number;
    totalCostValue: number;
    totalRetailValue: number;
    potentialProfit: number;
    marginPct: number;
    status: ClosingStockStatus;
    hasCostPrice: boolean;
    imageUrl?: string;
}

export interface ClosingCategorySummary {
    id: string;
    name: string;
    skuCount: number;
    totalUnits: number;
    totalCostValue: number;
    totalRetailValue: number;
    potentialProfit: number;
    costSharePct: number;
}

export interface ClosingStockSummary {
    generatedAt: Date;
    totalSkus: number;
    totalUnits: number;
    totalCostValue: number;
    totalRetailValue: number;
    potentialProfit: number;
    overallMarginPct: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    negativeStockCount: number;
    missingCostCount: number;
    categories: ClosingCategorySummary[];
    items: ClosingStockItem[];
}

/**
 * Builds the complete closing stock audit and valuation report.
 * Evaluates active inventory items, calculates balance sheet cost carrying value,
 * retail potential value, category distribution, and margin metrics.
 */
export const buildClosingStockReport = (
    products: Product[],
    categories: Category[],
    storeSettings?: StoreSettings | null,
): ClosingStockSummary => {
    const active = products.filter(p => p.status !== 'archived');
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    let totalUnits = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let negativeStockCount = 0;
    let missingCostCount = 0;

    const items: ClosingStockItem[] = [];
    const catAgg = new Map<string, { skuCount: number; totalUnits: number; totalCostValue: number; totalRetailValue: number }>();

    for (const p of active) {
        const stock = num(p.stock);
        const costPrice = num(p.costPrice);
        const retailPrice = num(p.price);
        const hasCostPrice = costPrice > 0;
        const reorderPoint = thresholdFor(p, storeSettings);

        if (!hasCostPrice) missingCostCount++;

        let status: ClosingStockStatus;
        if (stock < 0) {
            status = 'negative';
            negativeStockCount++;
        } else if (stock === 0) {
            status = 'out_of_stock';
            outOfStockCount++;
        } else if (stock <= reorderPoint) {
            status = 'low_stock';
            lowStockCount++;
        } else {
            status = 'in_stock';
            inStockCount++;
        }

        // Inventory assets are valued based on positive stock units on hand.
        // If stock is negative, it's flagged as an anomaly.
        const positiveUnits = Math.max(0, stock);
        const lineCostValue = positiveUnits * costPrice;
        const lineRetailValue = positiveUnits * retailPrice;
        const lineProfit = lineRetailValue - lineCostValue;
        const lineMarginPct = lineRetailValue > 0 ? (lineProfit / lineRetailValue) * 100 : 0;

        totalUnits += stock;
        totalCostValue += lineCostValue;
        totalRetailValue += lineRetailValue;

        const catId = p.categoryId || '__none';
        const catName = catId === '__none' ? 'Uncategorized' : (categoryMap.get(catId) || 'Uncategorized');

        items.push({
            id: p.id,
            name: p.name || 'Unnamed Product',
            sku: p.sku || 'N/A',
            barcode: p.barcode || '',
            categoryId: catId,
            categoryName: catName,
            unitOfMeasure: p.unitOfMeasure === 'kg' ? 'kg' : 'units',
            stock,
            reorderPoint,
            costPrice,
            retailPrice,
            totalCostValue: lineCostValue,
            totalRetailValue: lineRetailValue,
            potentialProfit: lineProfit,
            marginPct: lineMarginPct,
            status,
            hasCostPrice,
            imageUrl: p.imageUrls?.[0],
        });

        // Tally category
        const catEntry = catAgg.get(catId) || { skuCount: 0, totalUnits: 0, totalCostValue: 0, totalRetailValue: 0 };
        catEntry.skuCount += 1;
        catEntry.totalUnits += stock;
        catEntry.totalCostValue += lineCostValue;
        catEntry.totalRetailValue += lineRetailValue;
        catAgg.set(catId, catEntry);
    }

    // Sort items by total cost value descending by default
    items.sort((a, b) => b.totalCostValue - a.totalCostValue);

    const categoriesSummary: ClosingCategorySummary[] = Array.from(catAgg.entries())
        .map(([id, stats]) => {
            const name = id === '__none' ? 'Uncategorized' : (categoryMap.get(id) || 'Uncategorized');
            const potentialProfit = stats.totalRetailValue - stats.totalCostValue;
            const costSharePct = totalCostValue > 0 ? (stats.totalCostValue / totalCostValue) * 100 : 0;
            return {
                id,
                name,
                skuCount: stats.skuCount,
                totalUnits: stats.totalUnits,
                totalCostValue: stats.totalCostValue,
                totalRetailValue: stats.totalRetailValue,
                potentialProfit,
                costSharePct,
            };
        })
        .sort((a, b) => b.totalCostValue - a.totalCostValue);

    const potentialProfit = totalRetailValue - totalCostValue;
    const overallMarginPct = totalRetailValue > 0 ? (potentialProfit / totalRetailValue) * 100 : 0;

    return {
        generatedAt: new Date(),
        totalSkus: active.length,
        totalUnits,
        totalCostValue,
        totalRetailValue,
        potentialProfit,
        overallMarginPct,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        negativeStockCount,
        missingCostCount,
        categories: categoriesSummary,
        items,
    };
};

/**
 * Builds standard RFC 4180 CSV export for the Closing Stock Report.
 */
export const buildClosingStockCsv = (
    summary: ClosingStockSummary,
    _storeSettings?: StoreSettings | null,
): string => {
    const headers = [
        'SKU',
        'Barcode',
        'Product Name',
        'Category',
        'UOM',
        'Closing Stock',
        'Reorder Point',
        'Unit Cost',
        'Unit Retail',
        'Total Cost Value',
        'Total Retail Value',
        'Potential Profit',
        'Margin %',
        'Stock Status',
    ];

    const escapeCsv = (val: unknown): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = summary.items.map(item => [
        escapeCsv(item.sku),
        escapeCsv(item.barcode),
        escapeCsv(item.name),
        escapeCsv(item.categoryName),
        escapeCsv(item.unitOfMeasure),
        escapeCsv(item.stock),
        escapeCsv(item.reorderPoint),
        escapeCsv(item.costPrice.toFixed(2)),
        escapeCsv(item.retailPrice.toFixed(2)),
        escapeCsv(item.totalCostValue.toFixed(2)),
        escapeCsv(item.totalRetailValue.toFixed(2)),
        escapeCsv(item.potentialProfit.toFixed(2)),
        escapeCsv(`${item.marginPct.toFixed(1)}%`),
        escapeCsv(
            item.status === 'in_stock'
                ? 'In Stock'
                : item.status === 'low_stock'
                    ? 'Low Stock'
                    : item.status === 'negative'
                        ? 'Negative Stock'
                        : 'Out of Stock'
        ),
    ]);

    // Add summary footer lines to the CSV
    const summaryRows = [
        [],
        [escapeCsv('--- SUMMARY ---')],
        [escapeCsv('Report Generated:'), escapeCsv(summary.generatedAt.toLocaleString())],
        [escapeCsv('Total SKUs:'), escapeCsv(summary.totalSkus)],
        [escapeCsv('Total Units on Hand:'), escapeCsv(summary.totalUnits)],
        [escapeCsv('Total Closing Stock Valuation (Cost):'), escapeCsv(summary.totalCostValue.toFixed(2))],
        [escapeCsv('Total Expected Retail Value:'), escapeCsv(summary.totalRetailValue.toFixed(2))],
        [escapeCsv('Total Potential Gross Profit:'), escapeCsv(summary.potentialProfit.toFixed(2))],
        [escapeCsv('Overall Gross Margin %:'), escapeCsv(`${summary.overallMarginPct.toFixed(1)}%`)],
        [escapeCsv('Missing Cost Price Count:'), escapeCsv(summary.missingCostCount)],
    ];

    const allLines = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(r => r.join(',')),
        ...summaryRows.map(r => r.join(',')),
    ];

    return allLines.join('\r\n');
};

/**
 * Triggers a browser download of the CSV data.
 */
export const downloadClosingStockCsv = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
