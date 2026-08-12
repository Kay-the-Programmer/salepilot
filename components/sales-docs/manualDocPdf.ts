import jsPDF from 'jspdf';
import { StoreSettings } from '../../types';
import { SalesDocument } from './types';
import {
    PDF_MARGIN, PDF_NAVY, PdfLogo, createPdf, drawCompanyMasthead, drawPdfTable,
    loadStoreLogo, pdfDate, pdfMoney, pdfNumber, pdfFileName, printPdf, savePdf,
} from '../../utils/pdfDocument';
import { docSerial } from './documentPdf';
import { amountInWords, currencyUnits } from './amountInWords';

/**
 * Manual receipts and delivery notes — the counter books, issued from the app.
 *
 * Laid out to match the printed pads a shop already uses: the company block and
 * TPIN at the top, a red serial number, then the ruled body and the signature
 * lines people actually sign. Keeping the familiar shape matters here — these
 * are handed to customers who compare them against the old book.
 */

const INK: [number, number, number] = [30, 30, 30];
const MUTED = 110;

/** Dotted fill-in rule, the paper equivalent of a blank line. */
const dottedLine = (pdf: jsPDF, x1: number, x2: number, y: number) => {
    pdf.setLineDashPattern([1, 2], 0);
    pdf.setDrawColor(150);
    pdf.setLineWidth(0.7);
    pdf.line(x1, y, x2, y);
    pdf.setLineDashPattern([], 0);
};

/** A labelled fill-in row: "Label ........ value". */
const fillRow = (
    pdf: jsPDF, label: string, value: string | null | undefined,
    x: number, y: number, endX: number, labelWidth = 90,
) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(MUTED);
    pdf.text(label, x, y);
    dottedLine(pdf, x + labelWidth, endX, y + 2);
    if (value) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(INK[0], INK[1], INK[2]);
        pdf.text(String(value), x + labelWidth + 6, y);
    }
};

/**
 * The letterhead now lives in utils/pdfDocument as `drawCompanyMasthead`, so
 * quotations and invoices print under exactly the same company header as these
 * pads do.
 */
const drawMasthead = (
    pdf: jsPDF,
    doc: SalesDocument,
    settings: StoreSettings | null,
    logo: PdfLogo | null,
    title: string,
): number =>
    drawCompanyMasthead(pdf, { settings, logo, title, serial: docSerial(doc) });

/** Signature block: a label, a dotted rule, and room to sign. */
const signatureRows = (pdf: jsPDF, rows: { label: string; value?: string | null }[], startY: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const right = pageWidth - PDF_MARGIN;
    let y = startY;
    for (const row of rows) {
        fillRow(pdf, row.label, row.value, PDF_MARGIN, y, right - 150, 70);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(MUTED);
        pdf.text('Signature', right - 140, y);
        dottedLine(pdf, right - 90, right, y + 2);
        y += 30;
    }
    return y;
};

/**
 * Delivery note — goods handed over, no money. Quantity and description only,
 * then the delivered-by / received-by signatures that make it a proof of
 * delivery.
 */
export const buildDeliveryNotePdf = (
    doc: SalesDocument,
    settings: StoreSettings | null,
    logo: PdfLogo | null = null,
): jsPDF => {
    const pdf = createPdf();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const right = pageWidth - PDF_MARGIN;

    let y = drawMasthead(pdf, doc, settings, logo, 'DELIVERY NOTE');

    fillRow(pdf, 'To', doc.customerName, PDF_MARGIN, y, right - 190, 26);
    fillRow(pdf, 'Date', pdfDate(doc.issueDate), right - 170, y, right, 30);
    y += 18;
    const address = [doc.customerAddress, doc.customerPhone].filter(Boolean).join(' · ');
    if (address) {
        fillRow(pdf, '', address, PDF_MARGIN, y, right - 190, 26);
        y += 14;
    }
    y += 8;

    // Quantities and descriptions — deliberately no prices on a delivery note.
    drawPdfTable(pdf, {
        startY: y,
        head: [['Qty', 'Description']],
        body: (doc.items || []).map(item => [
            pdfNumber(Number(item.quantity)),
            item.sku ? `${item.name}\n${item.sku}` : item.name,
        ]),
        columnStyles: { 0: { halign: 'center', cellWidth: 60 }, 1: { halign: 'left' } },
        // A shop expects a ruled block it can write into, so the table is drawn
        // with a full grid and padded out to a consistent height.
        theme: 'grid',
        styles: { minCellHeight: 20, fontSize: 10 },
        margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    });

    let cursor = (pdf as any).lastAutoTable.finalY + 26;

    if (doc.notes) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(MUTED);
        pdf.text(pdf.splitTextToSize(doc.notes, right - PDF_MARGIN), PDF_MARGIN, cursor);
        cursor += 24;
    }

    // Keep the signatures on the page they belong to.
    if (cursor + 90 > pdf.internal.pageSize.getHeight() - 60) {
        pdf.addPage();
        cursor = 80;
    }
    signatureRows(pdf, [
        { label: 'Delivered by', value: doc.deliveredBy || doc.createdByName },
        { label: 'Received by', value: doc.receivedBy },
    ], cursor);

    return pdf;
};

/**
 * Receipt — acknowledges money received. Mirrors the pad: received from, the
 * sum in words, the figure in a box, what it was payment for, and how it was
 * paid (cash or cheque).
 */
export const buildReceiptPdf = (
    doc: SalesDocument,
    settings: StoreSettings | null,
    logo: PdfLogo | null = null,
): jsPDF => {
    const pdf = createPdf();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const right = pageWidth - PDF_MARGIN;

    let y = drawMasthead(pdf, doc, settings, logo, 'RECEIPT');

    fillRow(pdf, 'Date', pdfDate(doc.issueDate), right - 170, y, right, 30);
    y += 26;

    fillRow(pdf, 'Received from', doc.customerName, PDF_MARGIN, y, right, 90);
    y += 30;

    const { major, minor } = currencyUnits(settings?.currency?.code);
    const words = amountInWords(Number(doc.total) || 0, major, minor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(MUTED);
    pdf.text('The sum of (In words)', PDF_MARGIN, y);
    // Long amounts wrap onto a second rule rather than running off the page.
    const wordLines = pdf.splitTextToSize(words, right - PDF_MARGIN - 130) as string[];
    wordLines.slice(0, 2).forEach((line, i) => {
        dottedLine(pdf, PDF_MARGIN + 120, right, y + 2 + i * 18);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(INK[0], INK[1], INK[2]);
        pdf.text(line, PDF_MARGIN + 126, y + i * 18);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(MUTED);
    });
    y += 18 * Math.max(1, Math.min(wordLines.length, 2)) + 16;

    fillRow(pdf, 'Being payment for', doc.notes, PDF_MARGIN, y, right - 170, 100);

    // The figure, boxed — the first thing anyone checks.
    const boxW = 150;
    const boxH = 40;
    const boxX = right - boxW;
    const boxY = y - 26;
    pdf.setDrawColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    pdf.setLineWidth(1.2);
    pdf.roundedRect(boxX, boxY, boxW, boxH, 4, 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    pdf.text(pdfMoney(doc.total, settings), boxX + boxW / 2, boxY + 26, { align: 'center' });
    y += 34;

    // Payment method — ticked boxes, as on the pad, but the boxes are the
    // store's own methods from Settings (Cash, MTN, Airtel…) rather than a
    // hard-coded Cash/Cheque pair. Cash and Cheque remain the fallback for a
    // store that has cleared the list.
    const method = String(doc.paymentMethod || 'cash').toLowerCase();
    const configured = (settings?.paymentMethods || []).map(pm => pm.name).filter(Boolean);
    const methods = (configured.length ? configured : ['Cash', 'Cheque']).slice(0, 4);
    const tick = (label: string, checked: boolean, x: number) => {
        pdf.setDrawColor(120);
        pdf.setLineWidth(0.8);
        pdf.rect(x, y - 9, 11, 11);
        if (checked) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.setTextColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
            pdf.text('X', x + 2.5, y);
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(MUTED);
        pdf.text(label, x + 17, y);
    };
    // Spread the boxes evenly across the width the reference line doesn't need.
    const tickSpan = Math.min(120, (right - PDF_MARGIN - 150) / Math.max(methods.length, 1));
    methods.forEach((name, i) => {
        const checked = name.toLowerCase() === method
            // Legacy receipts stored the method as a lowercase id ('cash'/'cheque').
            || name.toLowerCase().replace(/\s+/g, '_') === method;
        tick(name, checked, PDF_MARGIN + i * tickSpan);
    });

    // Reference line — a cheque number, a mobile-money transaction id, whatever
    // the method needs.
    const refX = PDF_MARGIN + methods.length * tickSpan + 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(MUTED);
    pdf.text('Ref. No.', refX, y);
    dottedLine(pdf, refX + 45, right, y + 2);
    if (doc.paymentReference) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(INK[0], INK[1], INK[2]);
        pdf.text(String(doc.paymentReference), refX + 51, y);
    }
    y += 44;

    signatureRows(pdf, [{ label: 'Prepared by', value: doc.createdByName }], y);

    return pdf;
};

/** Picks the right layout for the document type. */
export const buildManualDocPdf = (
    doc: SalesDocument,
    settings: StoreSettings | null,
    logo: PdfLogo | null = null,
): jsPDF =>
    (doc.docType === 'receipt'
        ? buildReceiptPdf(doc, settings, logo)
        : buildDeliveryNotePdf(doc, settings, logo));

const withLogo = async (doc: SalesDocument, settings: StoreSettings | null) =>
    buildManualDocPdf(doc, settings, await loadStoreLogo(settings));

export const downloadManualDocPdf = async (doc: SalesDocument, settings: StoreSettings | null) => {
    savePdf(
        await withLogo(doc, settings),
        pdfFileName(doc.docType === 'receipt' ? 'Receipt' : 'Delivery Note', settings, doc.number),
    );
};

export const printManualDocPdf = async (doc: SalesDocument, settings: StoreSettings | null) => {
    printPdf(await withLogo(doc, settings));
};
