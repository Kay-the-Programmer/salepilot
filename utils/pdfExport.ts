import { Product, StoreSettings, Category } from '../types';
import {
    PDF_MARGIN, createPdf, drawPdfFooter, drawPdfHeader, drawPdfTable,
    loadStoreLogo, pdfFileName, pdfMoney, pdfNumber, savePdf,
} from './pdfDocument';

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
        drawPdfFooter(doc, storeSettings);
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

    drawPdfFooter(doc, storeSettings);
    savePdf(doc, pdfFileName('Low Stock Report', storeSettings));
};
