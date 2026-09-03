import { describe, expect, it } from 'vitest';
import { EscPosBuilder, COLUMNS } from './escpos';
import { decodeReceipt, trimTrailingBlanks, PreviewLine } from './receiptPreview';
import { buildReceiptBytes, buildTestBytes } from './receiptEscPos';
import type { Sale, StoreSettings } from '../types';

/**
 * The preview exists to be trusted, and the only way it earns that is by being
 * decoded from the same bytes the printer gets. So these tests are not about
 * the decoder in isolation — they run real receipts through the real builder
 * and check that what comes back out is what went in.
 */

const textLines = (lines: PreviewLine[]): string[] =>
    lines.filter(l => l.kind === 'text').map(l => (l as { text: string }).text);

const settings = {
    storeId: 's1',
    name: 'Kabwata Hardware',
    address: 'Plot 4419 Chilimbulu Road, Lusaka',
    phone: '+260 97 1234567',
    email: '',
    website: '',
    tpin: '1002003004',
    isOnlineStoreEnabled: false,
    taxRate: 16,
    currency: { code: 'ZMW', symbol: 'K', position: 'before' },
    receiptMessage: 'Thank you for shopping with us.',
} as unknown as StoreSettings;

const sale = {
    transactionId: 'SALE-1787999123456-q7zk4mp',
    timestamp: '2026-08-31T13:56:00.000Z',
    cart: [
        { productId: 'p1', name: 'Galvanised Roofing Nails 75mm (5kg bag)', sku: '', price: 189.5, quantity: 2, stock: 0 },
        { productId: 'p2', name: 'Bread', sku: '', price: 12, quantity: 3, stock: 0 },
    ],
    subtotal: 415, discount: 50, tax: 58.4, total: 423.4,
    refundStatus: 'none', paymentStatus: 'paid', channel: 'pos',
    customerName: 'Mwansa Chibuye',
    attendedBy: 'Grace Phiri',
    payments: [{ id: 'x1', saleId: 's', date: '2026-08-31T13:56:00.000Z', amount: 423.4, method: 'CASH' }],
} as unknown as Sale;

describe('reading a receipt back off the wire', () => {
    it('recovers the text of a line', () => {
        const bytes = new EscPosBuilder(32).init().line('Hello counter').build();
        expect(textLines(decodeReceipt(bytes).lines)).toContain('Hello counter');
    });

    it('carries the alignment the printer was given', () => {
        const bytes = new EscPosBuilder(32)
            .init()
            .align('center').line('middle')
            .align('right').line('end')
            .align('left').line('start')
            .build();
        const lines = decodeReceipt(bytes).lines.filter(l => l.kind === 'text') as any[];
        const byText = (t: string) => lines.find(l => l.text === t);
        expect(byText('middle').align).toBe('center');
        expect(byText('end').align).toBe('right');
        expect(byText('start').align).toBe('left');
    });

    it('marks bold and double-size lines, which is how the total reads', () => {
        const bytes = new EscPosBuilder(32)
            .init()
            .bold(true).size(true).line('TOTAL')
            .bold(false).size(false).line('plain')
            .build();
        const lines = decodeReceipt(bytes).lines.filter(l => l.kind === 'text') as any[];
        const total = lines.find(l => l.text === 'TOTAL');
        const plain = lines.find(l => l.text === 'plain');
        expect(total.bold).toBe(true);
        expect(total.double).toBe(true);
        expect(plain.bold).toBe(false);
        expect(plain.double).toBe(false);
    });

    it('pulls the payload back out of a barcode, selector and all', () => {
        const bytes = new EscPosBuilder(32).init().barcode('68-I5F0WXZ').build();
        const barcode = decodeReceipt(bytes).lines.find(l => l.kind === 'barcode') as any;
        // The '{B' code-set selector is machinery, not content — it must not
        // show up under the bars in the preview.
        expect(barcode.value).toBe('68-I5F0WXZ');
    });

    it('undoubles a literal brace, which the encoder had to double', () => {
        const bytes = new EscPosBuilder(32).init().barcode('A{B').build();
        const barcode = decodeReceipt(bytes).lines.find(l => l.kind === 'barcode') as any;
        expect(barcode.value).toBe('A{B');
    });

    it('does not mistake barcode payload bytes for text', () => {
        const bytes = new EscPosBuilder(32).init().line('before').barcode('123456').line('after').build();
        const text = textLines(decodeReceipt(bytes).lines);
        // The digits live in the symbol, not on a line of their own. Letting
        // them leak would put phantom text on the preview.
        expect(text).toContain('before');
        expect(text).toContain('after');
        expect(text.join('\n')).not.toContain('123456');
    });

    it('notices the cut and the drawer pulse', () => {
        const plain = decodeReceipt(new EscPosBuilder(32).init().line('x').build());
        expect(plain.cut).toBe(false);
        expect(plain.drawer).toBe(false);

        const full = decodeReceipt(new EscPosBuilder(32).init().line('x').openDrawer().cut().build());
        expect(full.cut).toBe(true);
        expect(full.drawer).toBe(true);
    });
});

describe('the preview against a real receipt', () => {
    it('shows what the shopkeeper typed, on the paper they will hand over', () => {
        const bytes = buildReceiptBytes(sale, settings, { paperWidth: 58 });
        const text = textLines(decodeReceipt(bytes).lines).join('\n');

        expect(text).toContain('Kabwata Hardware');
        expect(text).toContain('TPIN: 1002003004');
        expect(text).toContain('+260 97 1234567');
        expect(text).toContain('Grace Phiri');
        expect(text).toContain('Mwansa Chibuye');
        expect(text).toContain('Thank you for shopping with us.');
    });

    it('never shows a line wider than the roll, which is the whole point of 58 vs 80', () => {
        for (const paperWidth of [58, 80] as const) {
            const bytes = buildReceiptBytes(sale, settings, { paperWidth });
            const columns = COLUMNS[paperWidth];
            for (const line of decodeReceipt(bytes).lines) {
                if (line.kind !== 'text') continue;
                // Double-width glyphs are twice as wide, so half as many fit.
                const budget = line.double ? Math.floor(columns / 2) : columns;
                expect(line.text.length).toBeLessThanOrEqual(budget);
            }
        }
    });

    it('carries the sale total, so the preview cannot quietly show the wrong money', () => {
        const bytes = buildReceiptBytes(sale, settings, { paperWidth: 58 });
        const text = textLines(decodeReceipt(bytes).lines).join('\n');
        expect(text).toContain('423.40');
        expect(text).toContain('TOTAL');
    });

    it('reads the printer test page too, so setup can preview before connecting', () => {
        const text = textLines(decodeReceipt(buildTestBytes(58, 'micro-printer')).lines).join('\n');
        expect(text).toContain('SalePilot');
        expect(text).toContain('Printer test');
    });
});

describe('trimTrailingBlanks', () => {
    it('drops the feed the cut leaves, which would render as dead space', () => {
        const bytes = buildReceiptBytes(sale, settings, { paperWidth: 58 });
        const lines = decodeReceipt(bytes).lines;
        const trimmed = trimTrailingBlanks(lines);
        expect(trimmed.length).toBeLessThan(lines.length);
        const last = trimmed[trimmed.length - 1];
        expect(last.kind === 'text' ? last.text.trim() !== '' : true).toBe(true);
    });

    it('leaves a receipt that ends in content alone', () => {
        const lines = decodeReceipt(new EscPosBuilder(32).init().line('end').build()).lines;
        expect(trimTrailingBlanks(lines)).toHaveLength(lines.length);
    });
});
