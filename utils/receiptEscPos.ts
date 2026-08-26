import { Sale, StoreSettings, TaxClassTotal } from '../types';
import { formatCurrency } from './currency';
import { COLUMNS, EscPosBuilder, wrap } from './escpos';

/** Roll widths a micro-printer comes in. Nothing on the wire announces which
 *  is loaded, so the till has to be told — see `thermalPrinter`. */
export type PaperWidth = 58 | 80;

/** Characters of the transaction id that become the sale's receipt code. */
const RECEIPT_CODE_LENGTH = 10;

/**
 * The short code that identifies one sale, on paper and on screen.
 *
 * Taken from the END of the transaction id, because that is where every id this
 * system mints carries its entropy: the backend produces
 * `SALE-<timestamp>-<random>` and an offline till produces a UUID. The head
 * does not distinguish anything — every web sale for years running begins
 * `SALE-169`, so a code cut from the front names no particular sale.
 *
 * Kept as a literal tail of the id rather than something cleaner-looking with
 * the separators stripped: sales are searched by substring, so a code that is
 * still a piece of the id is one a scanner can find the sale with.
 */
export const receiptCode = (transactionId: string): string => {
    const id = (transactionId ?? '').trim();
    const tail = id.length > RECEIPT_CODE_LENGTH ? id.slice(-RECEIPT_CODE_LENGTH) : id;
    // Upper case reads far better in a thermal printer's small font, and the
    // sale lookup is case-insensitive, so nothing is lost by it.
    return tail.toUpperCase();
};

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
    const code = receiptCode(sale.transactionId);
    b.columnsRow('Receipt', code);
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
    if (sale.tax > 0) {
        b.columnsRow(taxLabel(sale, settings), money(sale.tax));
        // Split by class when the sale carries one and more than one class was
        // involved. A single-class basket is already fully described by the
        // line above, and repeating it adds a line to the roll for nothing.
        const breakdown = sale.taxBreakdown ?? [];
        if (breakdown.length > 1) {
            for (const part of breakdown) {
                b.columnsRow(`  ${classLabel(part)}`, money(part.tax));
            }
        }
    }

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
    // The receipt's own identity, scannable. A customer bringing this back for
    // a return or a query is found by passing the paper under the scanner
    // instead of reading ten characters off a thermal print.
    b.feed(1).barcode(code);
    b.align('left');

    if (options.openDrawer) b.openDrawer();
    b.cut();

    return b.build();
};

/**
 * How one class reads on a receipt: what it is, and what it was taxed at.
 *
 * Zero-rated and exempt are named separately even though both cost nothing.
 * A customer reclaiming tax, or an inspector reading the roll, needs to see
 * which of the two applied — they are not the same thing on a tax return.
 */
const classLabel = (part: TaxClassTotal): string => {
    if (part.taxClass === 'zero') return `Zero rated (${money0(part.net)})`;
    if (part.taxClass === 'exempt') return `Exempt (${money0(part.net)})`;
    return `Standard ${part.ratePct}% (${money0(part.net)})`;
};

/** Net value beside a class name, unadorned — the roll is 32 columns wide. */
const money0 = (n: number): string => n.toFixed(2);

/**
 * How to name the tax line.
 *
 * A rate is only stated when the whole basket actually carried it. Once
 * products can be zero-rated or exempt, "Tax (16%)" on a mixed basket is a
 * false statement on a document a customer may present to their own
 * accountant — the figure is right, the rate beside it is not.
 *
 * With tax-inclusive prices the wording changes too: nothing was added at the
 * till, so the receipt says what the marked price already contained.
 */
export const taxLabel = (sale: Sale, settings: StoreSettings): string => {
    const rate = Number(settings.taxRate) || 0;
    const taxed = Math.round((sale.subtotal - sale.discount) * rate) / 100;
    const wholeBasketAtStandardRate = Math.abs(taxed - sale.tax) < 0.02;
    const name = settings.pricesIncludeTax ? "Includes tax" : "Tax";
    return wholeBasketAtStandardRate && rate > 0 ? `${name} (${rate}%)` : name;
};

/** Lay a label/value row out against the double-width grid. */
const wideRow = (builder: EscPosBuilder, left: string, right: string): string => {
    const gap = Math.max(1, builder.columns - left.length - right.length);
    return left + ' '.repeat(gap) + right;
};

/**
 * Kick the cash drawer open, printing nothing.
 *
 * The drawer is wired to the printer, not the computer, so opening one means
 * sending the printer a pulse — there is no other way to reach it. This is
 * that pulse with no receipt attached, for the times a cashier needs the
 * drawer without a sale.
 */
export const buildDrawerPulse = (): Uint8Array =>
    new EscPosBuilder().init().openDrawer().build();

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
    // Proves the printer can draw a barcode at all. Not every cheap clone
    // implements the command, and finding that out here beats finding it out
    // from a customer holding a receipt nobody can scan.
    b.feed(1).align('center').barcode('SALEPILOT1').align('left');
    b.cut();
    return b.build();
};
