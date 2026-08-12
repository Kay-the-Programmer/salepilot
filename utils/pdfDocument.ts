import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { StoreSettings } from '../types';
import { api, buildAssetUrl } from '../services/api';

/**
 * One look for every PDF the app exports.
 *
 * Before this, each surface rolled its own: the sales report used millimetres
 * and no branding, the low-stock report was blue, the assistant's exports were
 * green (and the older chat's header colour was set with a property autoTable
 * doesn't read, so it silently rendered grey). A customer or an accountant
 * receiving two SalePilot PDFs got two different-looking documents.
 *
 * Everything below is the shared contract: A4 portrait in points, the Velocity
 * navy header, banded rows, grouped thousands, the store's logo when it has one,
 * and a page footer on every page.
 */

/** Velocity palette, in RGB for jsPDF. */
export const PDF_NAVY: [number, number, number] = [0, 43, 107];
export const PDF_ORANGE: [number, number, number] = [255, 127, 39];
/** Row banding — white / faint navy tint. */
export const PDF_ZEBRA: [number, number, number] = [240, 244, 250];

/**
 * What the shared helpers need in order to brand a document. A full
 * `StoreSettings` satisfies it, and so does the partial a surface without loaded
 * settings can put together — the AI assistant's exports, for instance.
 */
export type PdfSettings = Partial<StoreSettings> | null;

export interface PdfLogo {
    dataUrl: string;
    width: number;
    height: number;
}

/**
 * Grouped, two-decimal money for PDFs.
 *
 * Deliberately mirrors `formatCurrency` (utils/currency) rather than calling it:
 * that helper requires a non-null `StoreSettings`, and several exporters build
 * documents before settings have loaded.
 */
export const pdfMoney = (n: number | string | null | undefined, settings: PdfSettings): string => {
    const num = typeof n === 'string' ? parseFloat(n) : Number(n ?? 0);
    const safe = Number.isFinite(num) ? num : 0;
    const symbol = settings?.currency?.symbol ?? '';
    const value = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    }).format(Math.abs(safe));
    const combined = settings?.currency?.position === 'after' ? `${value}${symbol}` : `${symbol}${value}`;
    return safe < 0 ? `-${combined}` : combined;
};

/** Grouped plain number — quantities, counts, stock levels. */
export const pdfNumber = (n: number | string | null | undefined): string => {
    const num = typeof n === 'string' ? parseFloat(n) : Number(n ?? 0);
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        useGrouping: true,
    }).format(Number.isFinite(num) ? num : 0);
};

export const pdfDate = (d?: string | number | Date | null): string =>
    d ? new Date(d).toLocaleDateString() : '—';

/**
 * Fetch the store logo and turn it into a data URL.
 *
 * jsPDF rasterises images through a canvas, and a canvas painted with a
 * cross-origin `<img>` is tainted — reading it back throws. Fetching the bytes
 * ourselves sidesteps that. Any failure (offline, missing file, CORS) resolves
 * to null so the document still exports, just without the logo.
 */
export const loadStoreLogo = async (settings: PdfSettings): Promise<PdfLogo | null> => {
    const raw = settings?.logoUrl;
    if (!raw) return null;
    try {
        const res = await fetch(buildAssetUrl(raw), { mode: 'cors' });
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) return null;
        const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
        const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
            img.onerror = () => reject(new Error('logo decode failed'));
            img.src = dataUrl;
        });
        return { dataUrl, ...size };
    } catch {
        return null;
    }
};

let cachedSettings: PdfSettings | undefined;

/**
 * Store settings for surfaces that don't already hold them (the AI assistants).
 *
 * Without this their exports would be the only ones with no store name or logo
 * in the masthead. Cached for the session — one fetch, and an export never fails
 * just because settings couldn't be read.
 */
export const loadPdfStoreSettings = async (): Promise<PdfSettings> => {
    if (cachedSettings !== undefined) return cachedSettings;
    try {
        cachedSettings = await api.get<StoreSettings>('/settings');
    } catch {
        cachedSettings = null;
    }
    return cachedSettings;
};

export const PDF_MARGIN = 40;

/** A4 portrait in points — the one page setup every export shares. */
export const createPdf = (): jsPDF => new jsPDF({ unit: 'pt', format: 'a4' });

/**
 * Draw the store logo at the top-left, returning the x the header text should
 * start at and how far down the logo reaches.
 */
export const drawPdfLogo = (pdf: jsPDF, logo: PdfLogo | null, x = PDF_MARGIN, y = 34, box = 64) => {
    if (!logo) return { textX: x, bottom: y };
    // Fit inside a square box, preserving the aspect ratio so wide wordmarks and
    // square badges both look right.
    const scale = Math.min(box / logo.width, box / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    try {
        pdf.addImage(logo.dataUrl, x, y, w, h, undefined, 'FAST');
        return { textX: x + w + 14, bottom: y + h };
    } catch {
        // A format jsPDF can't decode shouldn't cost the user their export.
        return { textX: x, bottom: y };
    }
};

export interface PdfHeaderOptions {
    /** Big title on the right, e.g. "Sales Report". */
    title: string;
    settings: PdfSettings;
    logo?: PdfLogo | null;
    /** Extra right-aligned lines under the title, e.g. a date range. */
    meta?: string[];
    /** Show the store's address/phone/email under its name. Default true. */
    showStoreContact?: boolean;
}

/**
 * The shared masthead: logo + store identity on the left, document title and
 * metadata on the right, ruled off with a navy line. Returns the y coordinate
 * content should start at.
 */
export const drawPdfHeader = (pdf: jsPDF, options: PdfHeaderOptions): number => {
    const { title, settings, logo = null, meta = [], showStoreContact = true } = options;
    const pageWidth = pdf.internal.pageSize.getWidth();

    const { textX, bottom } = drawPdfLogo(pdf, logo);
    let headerBottom = Math.max(bottom, 74);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    pdf.text(settings?.name || 'SalePilot', textX, 56);

    if (showStoreContact) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(110);
        const lines = [settings?.address, settings?.phone, settings?.email].filter(Boolean) as string[];
        lines.forEach((line, i) => pdf.text(line, textX, 74 + i * 12));
        headerBottom = Math.max(headerBottom, 74 + lines.length * 12);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(30);
    pdf.text(title, pageWidth - PDF_MARGIN, 56, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(90);
    meta.forEach((line, i) => {
        pdf.text(line, pageWidth - PDF_MARGIN, 74 + i * 14, { align: 'right' });
        headerBottom = Math.max(headerBottom, 74 + i * 14);
    });

    const ruleY = headerBottom + 14;
    pdf.setDrawColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    pdf.setLineWidth(1);
    pdf.line(PDF_MARGIN, ruleY, pageWidth - PDF_MARGIN, ruleY);
    return ruleY + 22;
};

/**
 * The shared table: navy header, banded rows, page margins. Callers pass their
 * own head/body/column widths; everything visual comes from here.
 */
export const drawPdfTable = (pdf: jsPDF, options: UserOptions) => {
    autoTable(pdf, {
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 6, textColor: 40 },
        headStyles: { fontStyle: 'bold', fillColor: PDF_NAVY, textColor: 255 },
        alternateRowStyles: { fillColor: PDF_ZEBRA },
        margin: { left: PDF_MARGIN, right: PDF_MARGIN },
        ...options,
    });
    return (pdf as any).lastAutoTable?.finalY ?? options.startY ?? 0;
};

/**
 * Stamp "<store> · generated <date>" and "Page n of m" on every page.
 *
 * Runs last on purpose: the page count isn't known until the content is laid
 * out, so calling this earlier would under-number multi-page exports.
 */
export const drawPdfFooter = (pdf: jsPDF, settings: PdfSettings) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const total = pdf.getNumberOfPages();
    const stamp = `${settings?.name || 'SalePilot'} · Generated ${new Date().toLocaleString()}`;
    for (let page = 1; page <= total; page++) {
        pdf.setPage(page);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(140);
        pdf.text(stamp, PDF_MARGIN, pageHeight - 24);
        pdf.text(`Page ${page} of ${total}`, pageWidth - PDF_MARGIN, pageHeight - 24, { align: 'right' });
    }
};

/**
 * One filename convention: `Store_Title_YYYY-MM-DD.pdf`, so a folder of exports
 * sorts sensibly and says where it came from.
 */
export const pdfFileName = (title: string, settings: PdfSettings, suffix?: string): string => {
    const slug = (s: string) => s.trim().replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const parts = [settings?.name ? slug(settings.name) : '', slug(title), suffix ? slug(suffix) : new Date().toISOString().slice(0, 10)];
    return `${parts.filter(Boolean).join('_')}.pdf`;
};

export const savePdf = (pdf: jsPDF, fileName: string) => pdf.save(fileName);

/**
 * Print a PDF. autoPrint has to be applied to the *same* instance whose blob we
 * open, or the print dialog never fires; opening a blob in a new tab keeps the
 * app's own state untouched.
 */
export const printPdf = (pdf: jsPDF) => {
    pdf.autoPrint();
    window.open(pdf.output('bloburl') as unknown as string, '_blank');
};
