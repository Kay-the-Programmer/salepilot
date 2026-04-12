import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, StoreSettings, Category } from '../types';
import { formatCurrency } from './currency';

export const generateLowStockPDF = (
    products: Product[],
    categories: Category[],
    storeSettings: StoreSettings
) => {
    // 1. Initialize jsPDF instance ('p' for portrait, 'pt' for points, 'a4' for size)
    const doc = new jsPDF('p', 'pt', 'a4');

    // 2. Report Header Data
    const title = 'Low Stock Report';
    const storeName = storeSettings.name || 'Store Name';
    const dateStr = new Date().toLocaleString();

    // 3. Set up fonts and write headers
    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175); // Blue-800
    doc.text(title, 40, 50);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Store: ${storeName}`, 40, 70);
    doc.text(`Generated on: ${dateStr}`, 40, 85);
    doc.text(`Total Items to Restock: ${products.length}`, 40, 100);

    if (products.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42); 
        doc.text("No products are currently low on stock.", 40, 140);
        doc.save(`Low_Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        return;
    }

    // 4. Map the category IDs to Names
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    // 5. Prepare Table Data
    const tableColumns = ["SKU", "Product Name", "Category", "Current Stock", "Reorder Pt", "Supplier Price"];
    const tableRows = products.map(product => {
        const catName = product.categoryId ? categoryMap.get(product.categoryId) || 'Uncategorized' : 'Uncategorized';
        const costPriceStr = product.costPrice ? formatCurrency(product.costPrice, storeSettings) : 'N/A';
        const stockStr = `${product.stock} ${product.unitOfMeasure === 'kg' ? 'kg' : 'units'}`;
        const reorderStr = `${product.reorderPoint ?? storeSettings.lowStockThreshold}`;

        return [
            product.sku || 'N/A',
            product.name,
            catName,
            stockStr,
            reorderStr,
            costPriceStr
        ];
    });

    // 6. Draw Table using autoTable
    autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 120, // Start below the header
        theme: 'striped',
        headStyles: {
            fillColor: [37, 99, 235], // Blue-600
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 9,
            cellPadding: 6,
        },
        columnStyles: {
            0: { cellWidth: 70 }, // SKU
             // auto for product name
            2: { cellWidth: 90 }, // Category
            3: { cellWidth: 75, halign: 'right' }, // Stock
            4: { cellWidth: 65, halign: 'right' }, // Reorder Pt
            5: { cellWidth: 80, halign: 'right' }, // Supplier Price
        },
    });

    // 7. Save the Document
    const fileName = `Low_Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
