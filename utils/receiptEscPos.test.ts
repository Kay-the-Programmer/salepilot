import { describe, it, expect } from 'vitest';
import { Sale, StoreSettings } from '../types';
import { buildReceiptBytes, buildTestBytes, receiptCode, taxLabel } from './receiptEscPos';
import { COLUMNS } from './escpos';

const settings = {
    name: 'Kay Mart',
    address: '12 Cairo Road, Lusaka',
    phone: '+260971234567',
    taxRate: 16,
    receiptMessage: 'Thank you for your purchase!',
    currency: { symbol: 'K', code: 'ZMW', position: 'before' as const },
} as unknown as StoreSettings;

const sale = {
    transactionId: 'SALE-1787044297768-i5f0wxz',
    timestamp: '2026-08-22T10:30:00.000Z',
    cart: [
        { productId: 'p1', name: 'Test Soda 500ml', quantity: 2, price: 25, sku: 'MM-1' },
    ],
    subtotal: 50,
    tax: 8,
    discount: 0,
    total: 58,
    amountPaid: 58,
    paymentStatus: 'paid',
    customerName: 'Walk-in',
    attendedBy: 'Docs Owner',
    payments: [{ id: '1', amount: 58, method: 'MTN', date: '', reference: 'MP240518.A1' }],
} as unknown as Sale;

/** The printed stream as readable text, for asserting on content. */
const asText = (bytes: Uint8Array): string => String.fromCharCode(...bytes);

/**
 * The stream with its control codes removed, leaving only what lands on paper.
 * Measuring the raw bytes would count command sequences as printed characters
 * and report lines wider than they really are.
 */
const printedLines = (bytes: Uint8Array): string[] => {
    // Byte length of each command, keyed by its opcode.
    const ESC_LEN: Record<number, number> = {
        0x40: 2, // ESC @        initialise
        0x74: 3, // ESC t n      code page
        0x61: 3, // ESC a n      align
        0x45: 3, // ESC E n      bold
        0x70: 5, // ESC p m t1 t2  drawer pulse
    };
    const GS_LEN: Record<number, number> = {
        0x21: 3, // GS ! n       character size
        0x56: 4, // GS V m n     cut
        0x68: 3, // GS h n       barcode height
        0x77: 3, // GS w n       barcode module width
        0x48: 3, // GS H n       barcode number position
        0x66: 3, // GS f n       barcode number font
    };
    // GS k is the one command whose length is carried in the stream rather than
    // fixed. Skipping it by a guessed width would spill its payload into the
    // text and report barcode data as printed lines.
    const gsBarcodeLength = (at: number): number => 4 + bytes[at + 3];

    const out: string[] = [];
    let line = '';
    for (let i = 0; i < bytes.length; ) {
        const b = bytes[i];
        if (b === 0x1b) { i += ESC_LEN[bytes[i + 1]] ?? 2; continue; }
        if (b === 0x1d) {
            i += bytes[i + 1] === 0x6b ? gsBarcodeLength(i) : GS_LEN[bytes[i + 1]] ?? 3;
            continue;
        }
        if (b === 0x0a) { out.push(line); line = ''; i += 1; continue; }
        line += String.fromCharCode(b);
        i += 1;
    }
    if (line) out.push(line);
    return out;
};

describe('buildReceiptBytes', () => {
    const bytes = buildReceiptBytes(sale, settings, { paperWidth: 80 });
    const text = asText(bytes);

    it('opens with the printer reset', () => {
        expect(Array.from(bytes.slice(0, 2))).toEqual([0x1b, 0x40]);
    });

    it('prints the store identity', () => {
        expect(text).toContain('Kay Mart');
        expect(text).toContain('12 Cairo Road, Lusaka');
        expect(text).toContain('+260971234567');
    });

    it('prints the same identifying details as the on-screen receipt', () => {
        // The receipt code is the tail of the transaction id. It used to be the
        // first eight characters, which named no particular sale: every sale
        // this system makes for years running starts 'SALE-17'.
        expect(text).toContain(receiptCode(sale.transactionId));
        expect(text).toContain('Docs Owner');
        expect(text).toContain('Walk-in');
    });

    it('prints each line item with its quantity and line total', () => {
        expect(text).toContain('Test Soda 500ml');
        expect(text).toContain('2 x K25.00');
        expect(text).toContain('K50.00');
    });

    it('prints the totals and the tender used', () => {
        expect(text).toContain('Subtotal');
        expect(text).toContain('TOTAL');
        expect(text).toContain('K58.00');
        expect(text).toContain('MTN');
        expect(text).toContain('MP240518.A1');
    });

    it('ends by cutting the paper', () => {
        expect(Array.from(bytes.slice(-4))).toEqual([0x1d, 0x56, 0x42, 0x00]);
    });

    it('does not pulse the drawer unless asked', () => {
        expect(text).not.toContain(String.fromCharCode(0x1b, 0x70));
    });

    it('pulses the drawer when the till is configured for it', () => {
        const withDrawer = buildReceiptBytes(sale, settings, { paperWidth: 80, openDrawer: true });
        expect(asText(withDrawer)).toContain(String.fromCharCode(0x1b, 0x70, 0x00, 0x19, 0xfa));
    });
});

describe('paper width', () => {
    it('lays a 58mm receipt out to 32 columns and an 80mm one to 48', () => {
        const narrow = printedLines(buildReceiptBytes(sale, settings, { paperWidth: 58 }));
        const wide = printedLines(buildReceiptBytes(sale, settings, { paperWidth: 80 }));
        const longest = (lines: string[]) => Math.max(...lines.map(l => l.length));

        expect(longest(narrow)).toBeLessThanOrEqual(COLUMNS[58]);
        expect(longest(wide)).toBeLessThanOrEqual(COLUMNS[80]);
        // The whole point of the setting: a narrow roll really is narrower.
        expect(longest(narrow)).toBeLessThan(longest(wide));
    });

    it('never overflows the roll, whatever the content', () => {
        const longNames = {
            ...sale,
            cart: [{ ...sale.cart[0], name: 'Premium Imported Italian Extra Virgin Olive Oil 1L' }],
        } as unknown as Sale;
        const narrow = printedLines(buildReceiptBytes(longNames, settings, { paperWidth: 58 }));
        for (const line of narrow) {
            expect(line.length).toBeLessThanOrEqual(COLUMNS[58]);
        }
    });
});

describe('buildTestBytes', () => {
    it('names the printer and the paper so a wrong setting is visible', () => {
        const text = asText(buildTestBytes(58, 'XP-58 Thermal'));
        expect(text).toContain('XP-58 Thermal');
        expect(text).toContain('58mm');
        expect(text).toContain('32');
    });

    it('cuts, so the test sheet can be torn off', () => {
        const bytes = buildTestBytes(80, 'Counter');
        expect(Array.from(bytes.slice(-4))).toEqual([0x1d, 0x56, 0x42, 0x00]);
    });
});

/**
 * The receipt code is what ties a piece of paper back to a row in the sales
 * table. It has to identify one sale — the old code, cut from the front of the
 * transaction id, was the same on every receipt the store ever printed — and it
 * has to be something the sale lookup can actually find.
 */
describe('receiptCode', () => {
    it('tells apart two sales made in the same second', () => {
        const a = receiptCode('SALE-1787044297768-i5f0wxz');
        const b = receiptCode('SALE-1787044297768-q9c2mtv');
        expect(a).not.toEqual(b);
    });

    it('is still a piece of the transaction id, so the sale can be found by it', () => {
        // Sales are searched by case-insensitive substring. A code prettied up
        // by stripping the separators would scan into the search box and match
        // nothing at all.
        const id = 'SALE-1787044297768-i5f0wxz';
        expect(id.toLowerCase()).toContain(receiptCode(id).toLowerCase());
    });

    it('identifies an offline sale, whose id is a UUID', () => {
        const id = '3f2a1b9c-4d5e-6f70-8a9b-cdef01234567';
        expect(id.toLowerCase()).toContain(receiptCode(id).toLowerCase());
        expect(receiptCode(id)).toBe('EF01234567');
    });

    it('uses a short id whole rather than padding or truncating it', () => {
        expect(receiptCode('AB12')).toBe('AB12');
    });

    it('survives an id that is missing or blank', () => {
        // A receipt still has to print. A blank code drops the barcode; it must
        // not throw and lose the sale's receipt entirely.
        expect(receiptCode('')).toBe('');
        expect(receiptCode(undefined as unknown as string)).toBe('');
    });
});

describe('the barcode on a printed receipt', () => {
    const bytes = buildReceiptBytes(sale, settings, { paperWidth: 58 });
    const code = receiptCode(sale.transactionId);

    /** The data carried by the first GS k symbol in the stream. */
    const encoded = (b: Uint8Array): string => {
        for (let i = 0; i < b.length - 3; i++) {
            if (b[i] === 0x1d && b[i + 1] === 0x6b && b[i + 2] === 73) {
                // Past GS k m n and the two-byte code-set selector.
                return String.fromCharCode(...b.subarray(i + 6, i + 4 + b[i + 3]));
            }
        }
        return '';
    };

    it('carries the sale code the receipt prints as text', () => {
        // The bars and the number beside them must name the same sale, or a
        // scanned return finds a different one.
        expect(encoded(bytes)).toBe(code);
        expect(asText(bytes)).toContain(code);
    });

    it('fits the narrow roll', () => {
        // 58mm is 384 dots. CODE128 costs 11 modules a character plus 35, at
        // two dots a module — a code that overruns prints bars no scanner reads.
        const modules = 11 * code.length + 35;
        expect(modules * 2).toBeLessThan(384);
    });

    it('is offered on the test page, so a printer that cannot draw one is caught in settings', () => {
        expect(encoded(buildTestBytes(58, 'POS-58'))).not.toBe('');
    });
});

/**
 * A receipt may be handed to a customer's own accountant. The tax figure is
 * computed elsewhere and tested there; what matters here is that the receipt
 * does not make a claim about it that is untrue.
 */
describe('the tax line on a receipt', () => {
    const withTax = (over: Partial<Sale>): Sale => ({ ...sale, ...over } as Sale);

    it('states the rate when the whole basket really carried it', () => {
        const s = withTax({ subtotal: 100, discount: 0, tax: 16 });
        expect(taxLabel(s, settings)).toBe('Tax (16%)');
    });

    it('drops the rate when the basket was mixed', () => {
        // 100 of goods taxed 8.00 is not 16% of anything on this receipt —
        // some of it was zero-rated. Printing "(16%)" beside it would be false.
        const s = withTax({ subtotal: 100, discount: 0, tax: 8 });
        expect(taxLabel(s, settings)).toBe('Tax');
    });

    it('says the tax was already in the price when prices include it', () => {
        const inclusive = { ...settings, pricesIncludeTax: true } as StoreSettings;
        const s = withTax({ subtotal: 100, discount: 0, tax: 16 });
        expect(taxLabel(s, inclusive)).toBe('Includes tax (16%)');
    });

    it('accounts for the discount before deciding', () => {
        // Tax is charged on what was actually paid for, so a discounted basket
        // at the standard rate must still name its rate.
        const s = withTax({ subtotal: 200, discount: 100, tax: 16 });
        expect(taxLabel(s, settings)).toBe('Tax (16%)');
    });

    it('says nothing about a rate when the store charges none', () => {
        const untaxed = { ...settings, taxRate: 0 } as StoreSettings;
        expect(taxLabel(withTax({ subtotal: 100, discount: 0, tax: 0 }), untaxed)).toBe('Tax');
    });
});

/**
 * A mixed basket is the case the whole tax rework exists for, and the receipt
 * is where a customer or an inspector actually sees it. A breakdown that does
 * not agree with the tax printed above it makes the receipt worthless as a tax
 * document.
 */
describe('the per-class tax breakdown on a receipt', () => {
    const mixed = {
        ...sale,
        subtotal: 300,
        discount: 0,
        tax: 16,
        total: 316,
        taxBreakdown: [
            { taxClass: 'zero' as const, ratePct: 0, net: 200, tax: 0 },
            { taxClass: 'standard' as const, ratePct: 16, net: 100, tax: 16 },
        ],
    } as Sale;

    it('names each class and what it was taxed at', () => {
        const text = asText(buildReceiptBytes(mixed, settings, { paperWidth: 80 }));
        expect(text).toContain('Zero rated');
        expect(text).toContain('Standard 16%');
    });

    it('shows a breakdown that adds up to the tax charged', () => {
        const summed = (mixed.taxBreakdown ?? []).reduce((a, c) => a + c.tax, 0);
        expect(summed).toBe(mixed.tax);
    });

    it('does not repeat itself when only one class was involved', () => {
        // A single-class basket is fully described by the tax line already, and
        // every extra line is paper off a 58mm roll.
        const single = {
            ...mixed,
            taxBreakdown: [{ taxClass: 'standard' as const, ratePct: 16, net: 100, tax: 16 }],
        } as Sale;
        const text = asText(buildReceiptBytes(single, settings, { paperWidth: 58 }));
        expect(text).not.toContain('Standard 16%');
    });

    it('prints normally for a sale that carries no breakdown at all', () => {
        // Every sale made before this existed. The receipt must still print.
        const legacy = { ...mixed, taxBreakdown: undefined } as Sale;
        const text = asText(buildReceiptBytes(legacy, settings, { paperWidth: 80 }));
        expect(text).toContain('TOTAL');
        expect(text).not.toContain('Zero rated');
    });
});
