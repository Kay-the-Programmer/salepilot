import { OpenTab, StoreSettings } from '../types';
import { formatCurrency } from './currency';
import { COLUMNS, EscPosBuilder, wrap } from './escpos';
import { computeTax, toTaxClass } from './tax';
import type { PaperWidth } from './receiptEscPos';

/**
 * The BILL: what a table owes, printed before any money changes hands.
 *
 * A restaurant has two documents, not one. The table asks for the bill, reads
 * it, argues about it, then pays — and only then is there a receipt. Printing
 * the paid receipt at the asking stage would be a receipt for a payment that
 * has not happened, which is the kind of paper that gets a venue in trouble.
 *
 * So this is deliberately marked as not a receipt, carries no payment lines, no
 * change, no barcode and no drawer pulse. The receipt is still produced the
 * ordinary way once the sale goes through (utils/receiptEscPos.ts).
 *
 * The figures are computed with the SAME tax engine the till and the server
 * use, so the number on the bill is the number that will be charged — a bill
 * that disagrees with the card machine by a kwacha is a bill the venue stops
 * printing.
 */
export const buildBillBytes = (
    tab: OpenTab,
    settings: StoreSettings,
    options: { paperWidth: PaperWidth },
): Uint8Array => {
    const columns = COLUMNS[options.paperWidth];
    const b = new EscPosBuilder(columns);
    const money = (n: number) => formatCurrency(n, settings);

    const totals = computeTax(
        // A line with no class recorded is standard-rated, which is what
        // toTaxClass decides — quoting a bill at zero tax and then charging it
        // at the standard rate is the one outcome a venue cannot have.
        tab.items.map(i => ({ price: i.price, quantity: i.quantity, taxClass: toTaxClass(i.taxClass) })),
        0,
        {
            standardRatePct: Number(settings.taxRate) || 0,
            pricesIncludeTax: !!settings.pricesIncludeTax,
        },
    );

    b.init();

    // ── Header ──
    b.align('center').bold(true).size(true);
    b.line('BILL');
    b.size(false);
    b.line(settings.name || '');
    b.bold(false);
    // Said plainly, in words a customer reads rather than infers from a missing
    // payment line.
    b.line('Not a receipt - not yet paid');
    if (settings.address) wrap(settings.address, columns).forEach(l => b.line(l));
    if (settings.phone) b.line(settings.phone);
    b.align('left').feed(1).rule();

    // ── Which bill ──
    b.bold(true);
    b.line(tab.label);
    b.bold(false);
    b.columnsRow('Opened', shortTime(tab.openedAt));
    if (tab.openedByName) b.columnsRow('Served by', tab.openedByName.slice(0, columns - 11));
    b.rule();

    // ── Items ──
    for (const item of tab.items) {
        wrap(item.name, columns).forEach(l => b.line(l));
        b.columnsRow(`  ${item.quantity} x ${money(item.price)}`, money(item.price * item.quantity));
    }
    b.rule();

    // ── Money ──
    b.columnsRow('Subtotal', money(totals.subtotal));
    if (totals.tax > 0) {
        b.columnsRow(settings.pricesIncludeTax ? 'Tax included' : 'Tax', money(totals.tax));
    }

    b.bold(true).size(true);
    const wide = new EscPosBuilder(Math.floor(columns / 2));
    b.text(wideRow(wide, 'TO PAY', money(totals.total)));
    b.feed(1).size(false).bold(false);

    // ── Footer ──
    b.align('center');
    b.line('Please pay at the till');
    b.align('left');
    // No drawer pulse: nothing has been taken, so the drawer has no business
    // opening.
    b.cut();

    return b.build();
};

const shortTime = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * One double-width row, laid out the same way the receipt lays out its total.
 * Double width halves the usable columns, so the row is measured against that
 * narrower grid or it wraps.
 */
const wideRow = (builder: EscPosBuilder, left: string, right: string): string => {
    const gap = Math.max(1, builder.columns - left.length - right.length);
    return left + ' '.repeat(gap) + right;
};
