import { Sale, StoreSettings } from '../types';
import { formatCurrency } from './currency';
import { COLUMNS, EscPosBuilder, wrap } from './escpos';

/** Roll widths a micro-printer comes in. Nothing on the wire announces which
 *  is loaded, so the till has to be told — see `thermalPrinter`. */
export type PaperWidth = 58 | 80;

const shortDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Render a completed sale as an ESC/POS byte stream.
 *
 * Deliberately the same information, in the same order, as the on-screen
 * receipt — a customer handed the printed copy and a customer shown the modal
 * must not be looking at two different documents.
 */
export const buildReceiptBytes = (
    sale: Sale,
    settings: StoreSettings,
    options: { paperWidth: PaperWidth; openDrawer?: boolean },
): Uint8Array => {
    const columns = COLUMNS[options.paperWidth];
    const b = new EscPosBuilder(columns);
    const money = (n: number) => formatCurrency(n, settings);

    b.init();

    // ── Header ──
    b.align('center').bold(true).size(true);
    b.line(settings.name || 'Receipt');
    b.size(false).bold(false);
    if (settings.address) wrap(settings.address, columns).forEach(l => b.line(l));
    if (settings.phone) b.line(settings.phone);
    if (settings.tpin) b.line(`TPIN: ${settings.tpin}`);
    b.align('left').feed(1).rule();

    // ── Sale identity ──
    const receiptNo = sale.transactionId.length > 8
        ? sale.transactionId.slice(0, 8).toUpperCase()
        : sale.transactionId;
    b.columnsRow('Receipt', receiptNo);
    b.columnsRow('Date', shortDate(sale.timestamp));
    if (sale.customerName) b.columnsRow('Customer', sale.customerName.slice(0, columns - 10));
    if (sale.attendedBy) b.columnsRow('Attended by', sale.attendedBy.slice(0, columns - 13));
    b.rule();

    // ── Items ──
    // Name on its own line, then qty × price and the line total — a single row
    // cannot hold all four on a 58mm roll without truncating the name.
    for (const item of sale.cart ?? []) {
        wrap(item.name, columns).forEach(l => b.line(l));
        b.columnsRow(`  ${item.quantity} x ${money(item.price)}`, money(item.price * item.quantity));
    }
    b.rule();

    // ── Money ──
    b.columnsRow('Subtotal', money(sale.subtotal));
    if (sale.discount > 0) b.columnsRow('Discount', `-${money(sale.discount)}`);
    if (sale.storeCreditUsed && sale.storeCreditUsed > 0) {
        b.columnsRow('Store credit', `-${money(sale.storeCreditUsed)}`);
    }
    if (sale.tax > 0) b.columnsRow(`Tax (${settings.taxRate}%)`, money(sale.tax));

    b.bold(true).size(true);
    // Double-width halves the usable columns, so the total is laid out against
    // that narrower grid or it wraps.
    const wide = new EscPosBuilder(Math.floor(columns / 2));
    b.text(wideRow(wide, 'TOTAL', money(sale.total)));
    b.feed(1).size(false).bold(false);

    for (const payment of sale.payments ?? []) {
        b.columnsRow(payment.method, money(payment.amount));
        if (payment.reference) b.line(`  Ref: ${payment.reference}`);
    }
    if (typeof sale.cashReceived === 'number' && sale.cashReceived > 0) {
        b.columnsRow('Cash', money(sale.cashReceived));
        b.columnsRow('Change', money(sale.changeDue ?? 0));
    }

    // ── Footer ──
    b.feed(1).align('center');
    if (settings.receiptMessage) wrap(settings.receiptMessage, columns).forEach(l => b.line(l));
    b.line(receiptNo);
    b.align('left');

    if (options.openDrawer) b.openDrawer();
    b.cut();

    return b.build();
};

/** Lay a label/value row out against the double-width grid. */
const wideRow = (builder: EscPosBuilder, left: string, right: string): string => {
    const gap = Math.max(1, builder.columns - left.length - right.length);
    return left + ' '.repeat(gap) + right;
};

/**
 * A short alignment sheet, so a printer can be proved from settings instead of
 * discovered to be wrong mid-sale. The ruler is the point: on the correct roll
 * it reaches the paper's edge without wrapping.
 */
export const buildTestBytes = (paperWidth: PaperWidth, printerLabel: string): Uint8Array => {
    const columns = COLUMNS[paperWidth];
    const b = new EscPosBuilder(columns);
    b.init();
    b.align('center').bold(true).size(true).line('SalePilot');
    b.size(false).line('Printer test').bold(false).align('left');
    b.feed(1);
    b.columnsRow('Printer', printerLabel.slice(0, columns - 9));
    b.columnsRow('Paper', `${paperWidth}mm`);
    b.columnsRow('Columns', String(columns));
    b.feed(1).rule();
    b.columnsRow('Left', 'Right');
    b.rule('=');
    b.feed(1);
    b.line('If the lines above reach both edges');
    b.line('without wrapping, this printer is');
    b.line('ready to use.');
    b.cut();
    return b.build();
};
