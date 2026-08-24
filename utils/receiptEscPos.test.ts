import { describe, it, expect } from 'vitest';
import { Sale, StoreSettings } from '../types';
import { buildReceiptBytes, buildTestBytes } from './receiptEscPos';
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
    };

    const out: string[] = [];
    let line = '';
    for (let i = 0; i < bytes.length; ) {
        const b = bytes[i];
        if (b === 0x1b) { i += ESC_LEN[bytes[i + 1]] ?? 2; continue; }
        if (b === 0x1d) { i += GS_LEN[bytes[i + 1]] ?? 3; continue; }
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
        // Receipt number is the first 8 of the transaction id, as on screen.
        expect(text).toContain('SALE-178');
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
