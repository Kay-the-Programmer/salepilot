import jsPDF from 'jspdf';
import { StoreSettings } from '../../types';
import { SalesDocument } from './types';
import {
    PDF_MARGIN, PDF_NAVY, PdfLogo, createPdf, drawPdfFooter, drawPdfLogo, drawPdfTable,
    loadStoreLogo, pdfDate, pdfFileName, pdfMoney, pdfNumber, printPdf, savePdf,
} from '../../utils/pdfDocument';

/**
 * Quotations and invoices share the app-wide PDF look (utils/pdfDocument) but
 * keep their own header: a customer-facing document leads with the document
 * number and dates, not a report title.
 */
const money = (n: number, settings: StoreSettings | null) => pdfMoney(n, settings);
const qty = (n: number) => pdfNumber(n);
const dateLabel = (d?: string | null) => pdfDate(d);

export type DocumentLogo = PdfLogo;
export const loadDocumentLogo = loadStoreLogo;

/**
 * The company stamp.
 *
 * Customers here expect a stamped quotation, so we draw one rather than asking
 * the owner to upload a scan: a double-ruled box carrying the store name, what
 * the document is, and the date it was issued. Colour follows the status, so an
 * accepted quote is visibly different from a declined one.
 */
const drawStamp = (pdf: jsPDF, doc: SalesDocument, settings: StoreSettings | null, x: number, y: number) => {
    const w = 170;
    const h = 62;
    const tone: [number, number, number] =
        doc.status === 'accepted' || doc.status === 'converted' ? [21, 128, 61]
            : doc.status === 'declined' || doc.status === 'cancelled' || doc.status === 'expired' ? [185, 28, 28]
                : PDF_NAVY;

    pdf.setDrawColor(tone[0], tone[1], tone[2]);
    pdf.setLineWidth(1.6);
    pdf.roundedRect(x, y, w, h, 6, 6);
    pdf.setLineWidth(0.6);
    pdf.roundedRect(x + 4, y + 4, w - 8, h - 8, 4, 4);

    pdf.setTextColor(tone[0], tone[1], tone[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    const name = (settings?.name || 'SalePilot').toUpperCase();
    pdf.text(pdf.splitTextToSize(name, w - 20)[0], x + w / 2, y + 20, { align: 'center' });

    pdf.setFontSize(12);
    pdf.text(doc.docType === 'quotation' ? 'QUOTATION' : 'INVOICE', x + w / 2, y + 37, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text(`ISSUED ${dateLabel(doc.issueDate).toUpperCase()}`, x + w / 2, y + 50, { align: 'center' });
};

/**
 * Renders a quotation or invoice as an A4 PDF.
 *
 * Built with jsPDF (already used for the app's reports) rather than printing
 * the DOM, so the output is identical regardless of the browser, screen size or
 * theme the document happened to be viewed in.
 */
export const buildDocumentPdf = (
    doc: SalesDocument,
    settings: StoreSettings | null,
    logo: DocumentLogo | null = null,
): jsPDF => {
    const pdf = createPdf();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const marginX = PDF_MARGIN;
    const isQuote = doc.docType === 'quotation';

    // ── Header: store on the left, document identity on the right ──
    const { textX, bottom } = drawPdfLogo(pdf, logo);
    let headerBottom = Math.max(bottom, 74);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    pdf.text(settings?.name || 'SalePilot', textX, 56);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(110);
    const storeLines = [settings?.address, settings?.phone, settings?.email].filter(Boolean) as string[];
    storeLines.forEach((line, i) => pdf.text(line, textX, 74 + i * 12));
    headerBottom = Math.max(headerBottom, 74 + storeLines.length * 12);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(30);
    pdf.text(isQuote ? 'QUOTATION' : 'INVOICE', pageWidth - marginX, 56, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(90);
    pdf.text(doc.number, pageWidth - marginX, 74, { align: 'right' });
    pdf.text(`Issued: ${dateLabel(doc.issueDate)}`, pageWidth - marginX, 88, { align: 'right' });
    if (doc.validUntil) {
        pdf.text(
            `${isQuote ? 'Valid until' : 'Due'}: ${dateLabel(doc.validUntil)}`,
            pageWidth - marginX, 102, { align: 'right' },
        );
        headerBottom = Math.max(headerBottom, 102);
    }

    // ── Bill to ──
    let y = headerBottom + 24;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(isQuote ? 'PREPARED FOR' : 'BILL TO', marginX, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(30);
    pdf.text(doc.customerName, marginX, y + 16);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(110);
    const customerLines = [doc.customerPhone, doc.customerEmail, doc.customerAddress].filter(Boolean) as string[];
    customerLines.forEach((line, i) => pdf.text(line, marginX, y + 30 + i * 12));
    y = y + 30 + customerLines.length * 12 + 14;

    // ── Line items ──
    // Navy header and banded rows come from the shared table style.
    const tableBottom = drawPdfTable(pdf, {
        startY: y,
        head: [['Description', 'Qty', 'Unit price', 'Amount']],
        body: (doc.items || []).map(item => [
            item.sku ? `${item.name}\n${item.sku}` : item.name,
            qty(Number(item.quantity)),
            money(Number(item.unitPrice), settings),
            money(Number(item.lineTotal), settings),
        ]),
        columnStyles: {
            1: { halign: 'right', cellWidth: 50 },
            2: { halign: 'right', cellWidth: 90 },
            3: { halign: 'right', cellWidth: 90 },
        },
    });

    // ── Totals ──
    let cursor = tableBottom + 18;
    const labelX = pageWidth - marginX - 150;
    const valueX = pageWidth - marginX;
    const row = (label: string, value: string, bold = false) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(bold ? 11 : 9.5);
        pdf.setTextColor(bold ? 20 : 90);
        pdf.text(label, labelX, cursor);
        pdf.text(value, valueX, cursor, { align: 'right' });
        cursor += bold ? 20 : 15;
    };

    row('Subtotal', money(Number(doc.subtotal), settings));
    if (Number(doc.discount) > 0) row('Discount', `- ${money(Number(doc.discount), settings)}`);
    if (Number(doc.tax) > 0) row(`Tax (${Number(doc.taxRate)}%)`, money(Number(doc.tax), settings));
    pdf.setDrawColor(220);
    pdf.line(labelX, cursor - 8, valueX, cursor - 8);
    cursor += 4;
    row('Total', money(Number(doc.total), settings), true);

    const totalsBottom = cursor;

    // ── Notes & terms ──
    if (doc.notes || doc.terms) {
        cursor += 12;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        if (doc.notes) {
            pdf.text('NOTES', marginX, cursor);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(70);
            const lines = pdf.splitTextToSize(doc.notes, pageWidth - marginX * 2);
            pdf.text(lines, marginX, cursor + 14);
            cursor += 14 + lines.length * 12 + 10;
        }
        if (doc.terms) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(120);
            pdf.text('TERMS', marginX, cursor);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(70);
            const lines = pdf.splitTextToSize(doc.terms, pageWidth - marginX * 2);
            pdf.text(lines, marginX, cursor + 14);
            cursor += 14 + lines.length * 12;
        }
    }

    // ── Stamp ──
    // Sits below the totals on the right; if the notes ran long it drops under
    // them instead of overprinting, and onto a new page if there's no room.
    const stampY = Math.max(totalsBottom + 10, cursor + 18);
    if (stampY + 62 > pdf.internal.pageSize.getHeight() - 40) {
        pdf.addPage();
        drawStamp(pdf, doc, settings, pageWidth - marginX - 170, 60);
    } else {
        drawStamp(pdf, doc, settings, pageWidth - marginX - 170, stampY);
    }

    drawPdfFooter(pdf, settings);
    return pdf;
};

/** Loads the logo first so the rendered document always carries the branding. */
const buildWithLogo = async (doc: SalesDocument, settings: StoreSettings | null) =>
    buildDocumentPdf(doc, settings, await loadDocumentLogo(settings));

export const downloadDocumentPdf = async (doc: SalesDocument, settings: StoreSettings | null) => {
    // The document number is the suffix here — a customer filing QUO-0042
    // wants that in the filename, not the date it happened to be downloaded.
    savePdf(await buildWithLogo(doc, settings),
        pdfFileName(doc.docType === 'quotation' ? 'Quotation' : 'Invoice', settings, doc.number));
};

export const printDocumentPdf = async (doc: SalesDocument, settings: StoreSettings | null) => {
    printPdf(await buildWithLogo(doc, settings));
};
