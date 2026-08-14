import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { StoreSettings } from '../types';
import { api, buildAssetUrl } from '../services/api';
import SalePilotMarkUrl from '../assets/salepilot.png';

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
/** Serial numbers, red like the pre-printed pads. */
export const PDF_SERIAL_RED: [number, number, number] = [200, 30, 30];

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

let cachedSettings: PdfSettings | undefined;

/**
 * Store settings straight from the server, cached for the session.
 *
 * Two jobs: it gives surfaces that don't hold settings (the AI assistants) a
 * masthead, and it's the authority on the logo — see `loadStoreLogo`.
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

/**
 * Announce a freshly uploaded logo.
 *
 * Drops the cached settings so the next export re-reads them, and tells the rest
 * of the app (Dashboard holds the `storeSettings` every screen is handed) so the
 * new logo shows up without a page reload.
 */
export const STORE_LOGO_UPDATED_EVENT = 'salepilot:logo-updated';

export const announceLogoUpdate = (logoUrl: string) => {
    cachedSettings = undefined;
    window.dispatchEvent(new CustomEvent(STORE_LOGO_UPDATED_EVENT, { detail: { logoUrl } }));
};

/**
 * Fetch the store logo and turn it into a data URL.
 *
 * The caller's `settings` can be stale: most screens receive them once when the
 * app loads, so a logo uploaded during the session isn't in that copy and every
 * document printed afterwards came out unbranded until the page was reloaded.
 * When the passed settings carry no logo we therefore ask the server rather than
 * concluding there isn't one.
 *
 * jsPDF rasterises images through a canvas, and a canvas painted with a
 * cross-origin `<img>` is tainted — reading it back throws. Fetching the bytes
 * ourselves sidesteps that. Any failure (offline, missing file, CORS) resolves
 * to null so the document still exports, just without the logo — but it says so
 * in the console, because a silently missing logo is exactly the bug above.
 */
export const loadStoreLogo = async (settings: PdfSettings): Promise<PdfLogo | null> => {
    const raw = settings?.logoUrl || (await loadPdfStoreSettings())?.logoUrl;
    if (!raw) return null;
    try {
        const res = await fetch(buildAssetUrl(raw), { mode: 'cors' });
        if (!res.ok) throw new Error(`logo request failed (${res.status})`);
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) throw new Error(`logo is not an image (${blob.type})`);
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
    } catch (err) {
        console.warn('[pdf] Could not load the store logo; exporting without it.', raw, err);
        return null;
    }
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
    } catch (err) {
        // A format jsPDF can't decode shouldn't cost the user their export —
        // but it must not disappear quietly either.
        console.warn('[pdf] The store logo could not be drawn into the document.', err);
        return { textX: x, bottom: y };
    }
};

export interface CompanyMastheadOptions {
    settings: PdfSettings;
    logo?: PdfLogo | null;
    /** Document name, centred: QUOTATION, INVOICE, RECEIPT, DELIVERY NOTE. */
    title: string;
    /** Serial printed in red on the right, as on a pre-printed pad. */
    serial?: string | null;
}

/**
 * The company letterhead every customer-facing document carries.
 *
 * Modelled on the printed pads a shop already issues: logo and business name
 * across the top, the trading line under it, the address block on the left and
 * the contacts on the right, then the document title with the TPIN beneath it
 * and the serial number in red. Customers compare these against the old book,
 * so the familiar arrangement matters more than novelty.
 *
 * Returns the y coordinate the document body should start at.
 */
export const drawCompanyMasthead = (pdf: jsPDF, options: CompanyMastheadOptions): number => {
    const { settings, logo = null, title, serial } = options;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const right = pageWidth - PDF_MARGIN;

    const { textX } = drawPdfLogo(pdf, logo, PDF_MARGIN, 30, 58);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    pdf.text((settings?.name || 'SalePilot').toUpperCase(), textX, 52);

    const tagline = settings?.businessTagline;
    if (tagline) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8.5);
        pdf.setTextColor(110);
        pdf.text(String(tagline), textX, 66);
    }

    // Address on the left, contacts on the right — as on the pads.
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(110);
    const addressLines = String(settings?.address || '').split(/\s*,\s*|\n/).filter(Boolean);
    addressLines.slice(0, 4).forEach((line, i) => pdf.text(line, PDF_MARGIN, 88 + i * 10));

    const contacts = [settings?.phone, settings?.email, settings?.website].filter(Boolean) as string[];
    contacts.slice(0, 4).forEach((line, i) => pdf.text(String(line), right, 88 + i * 10, { align: 'right' }));

    // Title + TPIN, centred between the two blocks.
    const titleY = 112 + Math.max(addressLines.length, contacts.length, 2) * 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.setTextColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    pdf.text(title, pageWidth / 2, titleY, { align: 'center' });

    const tpin = settings?.tpin;
    if (tpin) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(30);
        pdf.text(`TPIN No. ${tpin}`, pageWidth / 2, titleY + 13, { align: 'center' });
    }

    if (serial) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(110);
        pdf.text('No.', right - 78, titleY);
        pdf.setTextColor(PDF_SERIAL_RED[0], PDF_SERIAL_RED[1], PDF_SERIAL_RED[2]);
        pdf.setFontSize(13);
        pdf.text(serial, right - 56, titleY);
    }

    pdf.setDrawColor(PDF_NAVY[0], PDF_NAVY[1], PDF_NAVY[2]);
    pdf.setLineWidth(1.2);
    const ruleY = titleY + (tpin ? 22 : 12);
    pdf.line(PDF_MARGIN, ruleY, right, ruleY);
    return ruleY + 24;
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
 *
 * Header cells take their column's alignment, so "Amount" sits over the right
 * edge of the figures beneath it. autoTable applies `headStyles` after
 * `columnStyles`, so a column declared `halign: 'right'` still drew its heading
 * hard left — the numeric headings floated at the wrong end of their columns.
 * The hook below re-applies the column's alignment to the head row.
 */
export const drawPdfTable = (pdf: jsPDF, options: UserOptions) => {
    const columnStyles = options.columnStyles || {};
    const headAlign = options.headStyles?.halign;

    autoTable(pdf, {
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 6, textColor: 40 },
        headStyles: { fontStyle: 'bold', fillColor: PDF_NAVY, textColor: 255 },
        alternateRowStyles: { fillColor: PDF_ZEBRA },
        margin: { left: PDF_MARGIN, right: PDF_MARGIN },
        ...options,
        didParseCell: (data) => {
            if (data.section === 'head') {
                // An explicit headStyles.halign from the caller wins; otherwise
                // follow the column.
                const column = (columnStyles as Record<string | number, { halign?: string }>)[data.column.index];
                const align = headAlign || column?.halign;
                if (align) data.cell.styles.halign = align as typeof data.cell.styles.halign;
            }
            options.didParseCell?.(data);
        },
    });
    return (pdf as any).lastAutoTable?.finalY ?? options.startY ?? 0;
};

/**
 * The SalePilot wordmark, loaded once per session and reused by every export.
 *
 * These documents get emailed to customers, handed to accountants and shared in
 * WhatsApp groups, so the mark in the footer is the product's quietest and most
 * effective marketing channel. It is deliberately in the FOOTER: the header
 * belongs to the store's own branding, and a customer-facing invoice must look
 * like the shop's document, not ours.
 *
 * Bundled through Vite (same origin), so unlike the store logo there is no CORS
 * or tainted-canvas hazard. A failure resolves to null and the export continues
 * unbranded rather than dying.
 */
let salePilotMark: Promise<PdfLogo | null> | undefined;

export const loadSalePilotMark = (): Promise<PdfLogo | null> => {
    if (salePilotMark) return salePilotMark;
    salePilotMark = (async () => {
        try {
            const res = await fetch(SalePilotMarkUrl);
            if (!res.ok) throw new Error(`mark request failed (${res.status})`);
            const blob = await res.blob();
            const dataUrl: string = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
            });
            const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
                img.onerror = () => reject(new Error('mark could not be decoded'));
                img.src = dataUrl;
            });
            return { dataUrl, ...size };
        } catch (err) {
            console.warn('[pdf] SalePilot mark unavailable; exporting without it.', err);
            return null;
        }
    })();
    return salePilotMark;
};

/**
 * Stamp the SalePilot mark, "<store> · generated <date>" and "Page n of m" on
 * every page.
 *
 * Runs last on purpose: the page count isn't known until the content is laid
 * out, so calling this earlier would under-number multi-page exports. The mark
 * is passed in (already loaded) because this function is synchronous — callers
 * that want it use `drawPdfFooterAsync`, which every export in the app does.
 */
export const drawPdfFooter = (pdf: jsPDF, settings: PdfSettings, mark: PdfLogo | null = null) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const total = pdf.getNumberOfPages();
    const stamp = `${settings?.name || 'SalePilot'} · Generated ${new Date().toLocaleString()}`;
    const baseline = pageHeight - 24;

    // Mark height chosen so the wordmark's cap-height matches the 8pt footer
    // text rather than towering over it.
    const markH = 11;
    const markW = mark ? (mark.width / mark.height) * markH : 0;

    for (let page = 1; page <= total; page++) {
        pdf.setPage(page);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(140);

        let textX = PDF_MARGIN;
        if (mark) {
            try {
                // Sits on the text baseline, left of the stamp.
                pdf.addImage(mark.dataUrl, PDF_MARGIN, baseline - markH + 2.5, markW, markH, undefined, 'FAST');
                textX = PDF_MARGIN + markW + 8;
            } catch (err) {
                console.warn('[pdf] SalePilot mark could not be drawn.', err);
            }
        }

        pdf.text(stamp, textX, baseline);
        pdf.text(`Page ${page} of ${total}`, pageWidth - PDF_MARGIN, baseline, { align: 'right' });
    }
};

/**
 * The footer every export should use: loads the SalePilot mark, then stamps it
 * with the rest of the footer. One await keeps the branding on every document
 * without each caller having to remember it.
 */
export const drawPdfFooterAsync = async (pdf: jsPDF, settings: PdfSettings) => {
    drawPdfFooter(pdf, settings, await loadSalePilotMark());
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
