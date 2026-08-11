import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StoreSettings } from '../../types';
import { SalesDocument } from './types';

const money = (n: number, settings: StoreSettings | null) => {
    const symbol = settings?.currency?.symbol ?? '';
    const value = (Number(n) || 0).toFixed(2);
    return settings?.currency?.position === 'after' ? `${value}${symbol}` : `${symbol}${value}`;
};

const dateLabel = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');

/**
 * Renders a quotation or invoice as an A4 PDF.
 *
 * Built with jsPDF (already used for the app's reports) rather than printing
 * the DOM, so the output is identical regardless of the browser, screen size or
 * theme the document happened to be viewed in.
 */
export const buildDocumentPdf = (doc: SalesDocument, settings: StoreSettings | null): jsPDF => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const marginX = 40;
    const isQuote = doc.docType === 'quotation';

    // ── Header: store on the left, document identity on the right ──
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(settings?.name || 'SalePilot', marginX, 56);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(110);
    const storeLines = [settings?.address, settings?.phone, settings?.email].filter(Boolean) as string[];
    storeLines.forEach((line, i) => pdf.text(line, marginX, 74 + i * 12));

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
    }

    // ── Bill to ──
    let y = 74 + storeLines.length * 12 + 24;
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
    autoTable(pdf, {
        startY: y,
        head: [['Description', 'Qty', 'Unit price', 'Amount']],
        body: (doc.items || []).map(item => [
            item.sku ? `${item.name}\n${item.sku}` : item.name,
            String(Number(item.quantity)),
            money(Number(item.unitPrice), settings),
            money(Number(item.lineTotal), settings),
        ]),
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 6, textColor: 40 },
        headStyles: { fontStyle: 'bold', fillColor: [243, 244, 246], textColor: 60 },
        columnStyles: {
            1: { halign: 'right', cellWidth: 50 },
            2: { halign: 'right', cellWidth: 90 },
            3: { halign: 'right', cellWidth: 90 },
        },
        margin: { left: marginX, right: marginX },
    });

    // ── Totals ──
    let cursor = (pdf as any).lastAutoTable.finalY + 18;
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
        }
    }

    return pdf;
};

export const downloadDocumentPdf = (doc: SalesDocument, settings: StoreSettings | null) => {
    buildDocumentPdf(doc, settings).save(`${doc.number}.pdf`);
};

export const printDocumentPdf = (doc: SalesDocument, settings: StoreSettings | null) => {
    // One instance: autoPrint has to be applied to the *same* document whose
    // blob we open, or the print dialog never fires.
    const pdf = buildDocumentPdf(doc, settings);
    pdf.autoPrint();
    // Opening the blob in a new tab keeps the app's own state untouched and
    // gives the browser's print dialog a real document to work with.
    window.open(pdf.output('bloburl') as unknown as string, '_blank');
};
