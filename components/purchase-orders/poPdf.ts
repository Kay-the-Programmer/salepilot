import jsPDF from 'jspdf';
import { PurchaseOrder, StoreSettings, Supplier } from '../../types';
import {
    PDF_MARGIN, PDF_NAVY, PdfLogo, createPdf, drawCompanyMasthead, drawPdfFooterAsync, drawPdfHeader, drawPdfTable,
    loadStoreLogo, pdfDate, pdfFileName, pdfMoney, pdfNumber, savePdf,
} from '../../utils/pdfDocument';
import { num, parseApiDate } from '../crm/crmModel';
import { purchaseOrderMeta } from './poModel';

/**
 * Purchase orders as PDFs, in the same document family as quotations and
 * invoices (utils/pdfDocument): one order on the company letterhead, or a
 * report of many orders — a summary list, or every order in full.
 */

type Settings = StoreSettings | null;

const statusLabel = (s: PurchaseOrder['status']) => purchaseOrderMeta(s).label || s;
const qty = (n: unknown) => pdfNumber(num(n));
const money = (n: unknown, settings: Settings) => pdfMoney(num(n), settings);
/** Digits only, as on a pre-printed pad: "PO-853631" → "853631". */
const serialOf = (po: PurchaseOrder) => (po.poNumber || '').replace(/^[A-Z]+-/i, '');
const orderDate = (po: PurchaseOrder) => po.orderedAt || po.createdAt;

const sectionLabel = (pdf: jsPDF, text: string, x: number, y: number) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(text, x, y);
};

/**
 * Draw one purchase order onto `pdf`, starting on the current page.
 * Used alone (one order per file) and by the "every order in full" report.
 */
const drawPurchaseOrder = async (
    pdf: jsPDF,
    po: PurchaseOrder,
    supplier: Supplier | undefined,
    settings: Settings,
    logo: PdfLogo | null,
) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = PDF_MARGIN;
    const right = pageWidth - marginX;

    let y = drawCompanyMasthead(pdf, { settings, logo, title: 'PURCHASE ORDER', serial: serialOf(po) });

    // ── Supplier on the left, dates and status on the right ──
    sectionLabel(pdf, 'SUPPLIER', marginX, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(30);
    pdf.text(po.supplierName || supplier?.name || 'Supplier not named yet', marginX, y + 16);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(110);
    const supplierLines = [
        supplier?.contactPerson ? `Attn: ${supplier.contactPerson}` : '',
        supplier?.phone, supplier?.email, supplier?.address,
    ].filter(Boolean) as string[];
    supplierLines.forEach((line, i) => pdf.text(pdf.splitTextToSize(line, pageWidth / 2 - marginX)[0], marginX, y + 30 + i * 12));

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(90);
    const facts: [string, string][] = [
        ['Order no.', po.poNumber],
        ['Order date', pdfDate(orderDate(po))],
        ...(po.expectedAt ? [['Expected delivery', pdfDate(po.expectedAt)] as [string, string]] : []),
        ...(po.receivedAt && (po.status === 'received' || po.status === 'partially_received')
            ? [['Last received', pdfDate(po.receivedAt)] as [string, string]] : []),
        ['Status', statusLabel(po.status)],
        ...(supplier?.paymentTerms ? [['Payment terms', supplier.paymentTerms] as [string, string]] : []),
    ];
    facts.forEach(([label, value], i) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120);
        pdf.text(`${label}:`, right - 130, y + i * 14, { align: 'right' });
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(40);
        pdf.text(value || '—', right, y + i * 14, { align: 'right' });
    });

    y = Math.max(y + 30 + supplierLines.length * 12, y + facts.length * 14) + 14;

    // ── Lines: ordered vs received, so a partly delivered order reads at a glance ──
    const items = po.items || [];
    const showReceived = po.status === 'partially_received' || po.status === 'received'
        || items.some(it => num(it.receivedQuantity) > 0);
    const tableBottom = drawPdfTable(pdf, {
        startY: y,
        head: [showReceived
            ? ['#', 'Product', 'Ordered', 'Received', 'Unit cost', 'Amount']
            : ['#', 'Product', 'Quantity', 'Unit cost', 'Amount']],
        body: items.map((it, i) => {
            const name = it.sku ? `${it.productName}\n${it.sku}` : it.productName;
            const line = money(num(it.quantity) * num(it.costPrice), settings);
            return showReceived
                ? [String(i + 1), name, qty(it.quantity), qty(it.receivedQuantity), money(it.costPrice, settings), line]
                : [String(i + 1), name, qty(it.quantity), money(it.costPrice, settings), line];
        }),
        columnStyles: showReceived
            ? {
                0: { cellWidth: 24, halign: 'right' },
                2: { cellWidth: 55, halign: 'right' },
                3: { cellWidth: 60, halign: 'right' },
                4: { cellWidth: 75, halign: 'right' },
                5: { cellWidth: 85, halign: 'right' },
            }
            : {
                0: { cellWidth: 24, halign: 'right' },
                2: { cellWidth: 60, halign: 'right' },
                3: { cellWidth: 80, halign: 'right' },
                4: { cellWidth: 90, halign: 'right' },
            },
    });

    // ── Totals ──
    let cursor = tableBottom + 18;
    if (cursor + 90 > pageHeight - 60) { pdf.addPage(); cursor = 60; }
    const labelX = right - 160;
    const row = (label: string, value: string, bold = false) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(bold ? 11 : 9.5);
        pdf.setTextColor(bold ? 20 : 90);
        pdf.text(label, labelX, cursor);
        pdf.text(value, right, cursor, { align: 'right' });
        cursor += bold ? 20 : 15;
    };
    const units = items.reduce((s, it) => s + num(it.quantity), 0);
    row('Items', `${pdfNumber(items.length)} (${pdfNumber(units)} units)`);
    row('Subtotal', money(po.subtotal, settings));
    if (num(po.shippingCost) > 0) row('Delivery', money(po.shippingCost, settings));
    if (num(po.tax) > 0) row('Tax', money(po.tax, settings));
    pdf.setDrawColor(220);
    pdf.line(labelX, cursor - 8, right, cursor - 8);
    cursor += 4;
    row('Total', money(po.total, settings), true);

    // ── Notes ──
    if (po.notes) {
        cursor += 6;
        sectionLabel(pdf, 'NOTES', marginX, cursor);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(70);
        const lines = pdf.splitTextToSize(po.notes, pageWidth - marginX * 2);
        pdf.text(lines, marginX, cursor + 14);
        cursor += 14 + lines.length * 12;
    }

    // ── Receipt history, when there is one ──
    const receptions = po.receptions || [];
    if (receptions.length > 0) {
        cursor += 14;
        if (cursor + 60 > pageHeight - 60) { pdf.addPage(); cursor = 60; }
        sectionLabel(pdf, 'DELIVERIES RECEIVED', marginX, cursor);
        cursor = drawPdfTable(pdf, {
            startY: cursor + 6,
            head: [['Date', 'Items', 'Units']],
            body: receptions.map(r => [
                pdfDate(r.date),
                pdfNumber((r.items || []).length),
                pdfNumber((r.items || []).reduce((s, it) => s + num(it.quantityReceived), 0)),
            ]),
            columnStyles: { 1: { halign: 'right', cellWidth: 70 }, 2: { halign: 'right', cellWidth: 70 } },
        });
    }

    // ── Sign-off ──
    cursor += 34;
    if (cursor + 40 > pageHeight - 50) { pdf.addPage(); cursor = 80; }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(80);
    pdf.text('Ordered by: ______________________________', marginX, cursor);
    pdf.text('Received by: _____________________________', pageWidth / 2 + 10, cursor);
    pdf.text('Date: ____________________', marginX, cursor + 18);
    pdf.text('Date: ____________________', pageWidth / 2 + 10, cursor + 18);
};

/** One purchase order, on the letterhead. Filename carries the order number. */
export async function downloadPurchaseOrderPdf(po: PurchaseOrder, suppliers: Supplier[], settings: Settings) {
    const pdf = createPdf();
    const logo = await loadStoreLogo(settings);
    await drawPurchaseOrder(pdf, po, suppliers.find(s => s.id === po.supplierId), settings, logo);
    await drawPdfFooterAsync(pdf, settings);
    savePdf(pdf, pdfFileName('Purchase Order', settings, po.poNumber));
}

export interface PoReportOptions {
    /** Shown under the title, e.g. "1 Jan 2026 – 31 Mar 2026". */
    rangeLabel: string;
    /** Shown under the title, e.g. "All statuses". */
    statusLabel: string;
    /** true: every order printed in full after the summary. */
    full: boolean;
}

/**
 * Many purchase orders in one file: a summary (count, value, by status and by
 * supplier, then one row per order), optionally followed by each order in
 * full on its own pages.
 */
export async function downloadPurchaseOrdersReportPdf(
    orders: PurchaseOrder[],
    suppliers: Supplier[],
    settings: Settings,
    options: PoReportOptions,
) {
    const sorted = [...orders].sort((a, b) =>
        (parseApiDate(orderDate(a))?.getTime() ?? 0) - (parseApiDate(orderDate(b))?.getTime() ?? 0));
    const pdf = createPdf();
    const logo = await loadStoreLogo(settings);
    const active = sorted.filter(o => o.status !== 'canceled');
    const totalValue = active.reduce((s, o) => s + num(o.total), 0);

    let y = drawPdfHeader(pdf, {
        title: 'Purchase Orders',
        settings,
        logo,
        meta: [options.rangeLabel, options.statusLabel, `${pdfNumber(sorted.length)} order${sorted.length === 1 ? '' : 's'}`],
    });

    if (sorted.length === 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(90);
        pdf.text('No purchase orders in this period.', PDF_MARGIN, y);
        await drawPdfFooterAsync(pdf, settings);
        savePdf(pdf, pdfFileName('Purchase Orders', settings));
        return;
    }

    // ── Headline figures ──
    const outstanding = sorted.filter(o => o.status === 'ordered' || o.status === 'partially_received');
    y = drawPdfTable(pdf, {
        startY: y,
        head: [['Orders', 'Value (excl. cancelled)', 'Still to arrive', 'Fully received', 'Cancelled']],
        body: [[
            pdfNumber(sorted.length),
            pdfMoney(totalValue, settings),
            `${pdfNumber(outstanding.length)} · ${pdfMoney(outstanding.reduce((s, o) => s + num(o.total), 0), settings)}`,
            pdfNumber(sorted.filter(o => o.status === 'received').length),
            pdfNumber(sorted.filter(o => o.status === 'canceled').length),
        ]],
        headStyles: { fillColor: PDF_NAVY, halign: 'center' },
        columnStyles: { 0: { halign: 'center' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    });

    // ── By supplier ──
    const bySupplier = new Map<string, { orders: number; value: number }>();
    for (const o of active) {
        const k = o.supplierName || 'Supplier not named';
        const e = bySupplier.get(k) || { orders: 0, value: 0 };
        e.orders++; e.value += num(o.total);
        bySupplier.set(k, e);
    }
    if (bySupplier.size > 1) {
        y += 14;
        sectionLabel(pdf, 'BY SUPPLIER', PDF_MARGIN, y);
        y = drawPdfTable(pdf, {
            startY: y + 6,
            head: [['Supplier', 'Orders', 'Value', 'Share']],
            body: [...bySupplier.entries()].sort((a, b) => b[1].value - a[1].value).map(([name, e]) => [
                name, pdfNumber(e.orders), pdfMoney(e.value, settings),
                totalValue > 0 ? `${((e.value / totalValue) * 100).toFixed(1)}%` : '—',
            ]),
            columnStyles: { 1: { halign: 'right', cellWidth: 60 }, 2: { halign: 'right', cellWidth: 100 }, 3: { halign: 'right', cellWidth: 60 } },
        });
    }

    // ── Every order, one row each ──
    y += 14;
    sectionLabel(pdf, 'ORDERS', PDF_MARGIN, y);
    drawPdfTable(pdf, {
        startY: y + 6,
        head: [['Order no.', 'Date', 'Supplier', 'Status', 'Received', 'Total']],
        body: sorted.map(o => {
            const ordered = (o.items || []).reduce((s, it) => s + num(it.quantity), 0);
            const received = (o.items || []).reduce((s, it) => s + num(it.receivedQuantity), 0);
            return [
                o.poNumber,
                pdfDate(orderDate(o)),
                o.supplierName || '—',
                statusLabel(o.status),
                `${pdfNumber(received)} / ${pdfNumber(ordered)}`,
                pdfMoney(num(o.total), settings),
            ];
        }),
        columnStyles: {
            0: { cellWidth: 72 },
            1: { cellWidth: 98 }, // "16 November 2026" on one line
            3: { cellWidth: 80 },
            4: { halign: 'right', cellWidth: 65 },
            5: { halign: 'right', cellWidth: 80 },
        },
    });

    // ── Each order in full ──
    if (options.full) {
        for (const o of sorted) {
            pdf.addPage();
            await drawPurchaseOrder(pdf, o, suppliers.find(s => s.id === o.supplierId), settings, logo);
        }
    }

    await drawPdfFooterAsync(pdf, settings);
    savePdf(pdf, pdfFileName(options.full ? 'Purchase Orders (full)' : 'Purchase Orders', settings));
}
