import { Product, StoreSettings, Category, User } from '../types';
import {
    PDF_MARGIN, PDF_NAVY, createPdf, drawPdfFooterAsync, drawPdfHeader, drawPdfTable,
    loadStoreLogo, pdfFileName, pdfMoney, pdfNumber, savePdf,
} from './pdfDocument';
import { ClosingStockSummary } from '../components/inventory-app/closingStockModel';

/**
 * Low-stock report.
 *
 * Layout, colours, number formatting and the filename all come from
 * utils/pdfDocument, so this prints as the same document family as the sales
 * report and a quotation.
 */
export const generateLowStockPDF = async (
    products: Product[],
    categories: Category[],
    storeSettings: StoreSettings
) => {
    const doc = createPdf();
    const logo = await loadStoreLogo(storeSettings);

    const startY = drawPdfHeader(doc, {
        title: 'Low Stock Report',
        settings: storeSettings,
        logo,
        meta: [`Items to restock: ${pdfNumber(products.length)}`],
    });

    if (products.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(90);
        doc.text('No products are currently low on stock.', PDF_MARGIN, startY);
        await drawPdfFooterAsync(doc, storeSettings);
        savePdf(doc, pdfFileName('Low Stock Report', storeSettings));
        return;
    }

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    drawPdfTable(doc, {
        startY,
        head: [['SKU', 'Product Name', 'Category', 'Current Stock', 'Reorder Pt', 'Supplier Price']],
        body: products.map(product => [
            product.sku || 'N/A',
            product.name,
            (product.categoryId ? categoryMap.get(product.categoryId) : null) || 'Uncategorized',
            `${pdfNumber(product.stock)} ${product.unitOfMeasure === 'kg' ? 'kg' : 'units'}`,
            pdfNumber(product.reorderPoint ?? storeSettings.lowStockThreshold),
            product.costPrice ? pdfMoney(product.costPrice, storeSettings) : 'N/A',
        ]),
        columnStyles: {
            0: { cellWidth: 70 },
            2: { cellWidth: 90 },
            3: { cellWidth: 75, halign: 'right' },
            4: { cellWidth: 65, halign: 'right' },
            5: { cellWidth: 80, halign: 'right' },
        },
    });

    await drawPdfFooterAsync(doc, storeSettings);
    savePdf(doc, pdfFileName('Low Stock Report', storeSettings));
};

/**
 * Closing Stock Audit & Inventory Valuation Report.
 *
 * Provides a formal valuation of closing inventory on hand at cost and expected
 * retail prices, category-level allocations, itemized stock status, and an
 * audit sign-off section for store inventory reconciliations.
 */
export const generateClosingStockPDF = async (
    summary: ClosingStockSummary,
    storeSettings: StoreSettings,
    user?: User | null,
) => {
    const doc = createPdf();
    const logo = await loadStoreLogo(storeSettings);
    const dateStr = new Date(summary.generatedAt).toLocaleDateString();
    const timeStr = new Date(summary.generatedAt).toLocaleTimeString();

    const startY = drawPdfHeader(doc, {
        title: 'Closing Stock Report',
        settings: storeSettings,
        logo,
        meta: [
            `Valuation Date: ${dateStr} ${timeStr}`,
            user ? `Prepared by: ${user.name} (${user.role})` : `Total SKUs: ${pdfNumber(summary.totalSkus)}`,
            `Total Asset Cost: ${pdfMoney(summary.totalCostValue, storeSettings)}`,
        ],
    });

    // 1. Executive Summary Table
    let currentY = drawPdfTable(doc, {
        startY,
        head: [['Total SKUs', 'Units on Hand', 'Valuation (at Cost)', 'Expected Retail Value', 'Gross Margin']],
        body: [[
            pdfNumber(summary.totalSkus),
            pdfNumber(summary.totalUnits),
            pdfMoney(summary.totalCostValue, storeSettings),
            pdfMoney(summary.totalRetailValue, storeSettings),
            `${pdfMoney(summary.potentialProfit, storeSettings)} (${summary.overallMarginPct.toFixed(1)}%)`,
        ]],
        headStyles: { fillColor: PDF_NAVY, halign: 'center' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 65 },
            1: { halign: 'center', cellWidth: 75 },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
        },
    });

    // 2. Category Breakdown (if categories exist)
    if (summary.categories.length > 0) {
        currentY += 12;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
        doc.text('Valuation by Category', PDF_MARGIN, currentY);
        currentY += 6;

        currentY = drawPdfTable(doc, {
            startY: currentY,
            head: [['Category', 'SKUs', 'Units', 'Cost Value', 'Retail Value', 'Margin', 'Share']],
            body: summary.categories.slice(0, 10).map(cat => [
                cat.name,
                pdfNumber(cat.skuCount),
                pdfNumber(cat.totalUnits),
                pdfMoney(cat.totalCostValue, storeSettings),
                pdfMoney(cat.totalRetailValue, storeSettings),
                pdfMoney(cat.potentialProfit, storeSettings),
                `${cat.costSharePct.toFixed(1)}%`,
            ]),
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 45, halign: 'center' },
                2: { cellWidth: 50, halign: 'center' },
                3: { cellWidth: 80, halign: 'right' },
                4: { cellWidth: 80, halign: 'right' },
                5: { cellWidth: 80, halign: 'right' },
                6: { cellWidth: 60, halign: 'right' },
            },
        });
    }

    // 3. Itemized Closing Stock Table
    currentY += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    doc.text('Itemized Closing Stock Valuation', PDF_MARGIN, currentY);
    currentY += 6;

    if (summary.items.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(110);
        doc.text('No active products found in inventory.', PDF_MARGIN, currentY + 12);
        currentY += 24;
    } else {
        currentY = drawPdfTable(doc, {
            startY: currentY,
            head: [['Product Name', 'Stock', 'Cost Price', 'Total Cost', 'Retail Price', 'Gross Margin', 'Status']],
            body: summary.items.map(item => [
                item.name,
                `${pdfNumber(item.stock)} ${item.unitOfMeasure}`,
                item.hasCostPrice ? pdfMoney(item.costPrice, storeSettings) : 'MISSING',
                pdfMoney(item.totalCostValue, storeSettings),
                pdfMoney(item.retailPrice, storeSettings),
                `${pdfMoney(item.potentialProfit, storeSettings)} (${item.marginPct.toFixed(0)}%)`,
                item.status === 'in_stock'
                    ? 'In Stock'
                    : item.status === 'low_stock'
                        ? 'Low'
                        : item.status === 'negative'
                            ? 'Negative'
                            : 'Out',
            ]),
            columnStyles: {
                0: { cellWidth: 165 },
                1: { cellWidth: 55, halign: 'right' },
                2: { cellWidth: 60, halign: 'right' },
                3: { cellWidth: 65, halign: 'right' },
                4: { cellWidth: 60, halign: 'right' },
                5: { cellWidth: 60, halign: 'right' },
                6: { cellWidth: 50, halign: 'center' },
            },
        });
    }

    // 4. Audit & Verification Signatures Block
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    if (currentY + 70 > pageHeight - 50) {
        doc.addPage();
        currentY = 60;
    } else {
        currentY += 28;
    }

    doc.setDrawColor(200, 205, 215);
    doc.setLineWidth(0.8);
    doc.line(PDF_MARGIN, currentY, pageWidth - PDF_MARGIN, currentY);
    currentY += 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    doc.text('AUDIT & VERIFICATION SIGN-OFF', PDF_MARGIN, currentY);

    currentY += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80);

    const col1X = PDF_MARGIN;
    const col2X = pageWidth / 2 + 10;

    doc.text('Physical Count Verified By: ___________________________', col1X, currentY);
    doc.text('Store Manager / Owner: ___________________________', col2X, currentY);

    currentY += 16;
    doc.text('Signature & Date: ____________________________________', col1X, currentY);
    doc.text('Approval Signature & Date: _______________________', col2X, currentY);

    await drawPdfFooterAsync(doc, storeSettings);
    savePdf(doc, pdfFileName('Closing Stock Report', storeSettings));
};
