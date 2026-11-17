import { describe, it, expect } from 'vitest';
import { OpenTab, StoreSettings } from '../types';
import { buildBillBytes } from './billEscPos';

const settings = {
    name: 'The Lusaka Grill',
    address: '12 Cairo Road, Lusaka',
    phone: '+260971234567',
    taxRate: 16,
    pricesIncludeTax: false,
    currency: { symbol: 'K', code: 'ZMW', position: 'before' as const },
} as unknown as StoreSettings;

const tab = {
    id: 'tab-1',
    label: 'Table 4',
    status: 'open',
    openedAt: '2026-08-22T18:30:00.000Z',
    openedByName: 'Chanda',
    items: [
        { id: 'l1', tabId: 'tab-1', productId: 'p1', name: 'Beef Stew & Nshima', price: 95, quantity: 2, taxClass: 'standard' },
        { id: 'l2', tabId: 'tab-1', productId: 'p2', name: 'Mosi Lager 375ml', price: 25, quantity: 4, taxClass: 'standard' },
    ],
    itemCount: 6,
    subtotal: 290,
} as unknown as OpenTab;

const asText = (bytes: Uint8Array): string => String.fromCharCode(...bytes);

/**
 * A bill is the document a table reads before paying, so the two things that
 * must never go wrong are what it says it is and what it says is owed.
 */
describe('buildBillBytes', () => {
    const bytes = buildBillBytes(tab, settings, { paperWidth: 80 });
    const text = asText(bytes);

    it('opens with the printer reset', () => {
        expect(Array.from(bytes.slice(0, 2))).toEqual([0x1b, 0x40]);
    });

    it('says plainly that it is not a receipt', () => {
        expect(text).toContain('BILL');
        // In words a customer reads, not inferred from a missing payment line.
        expect(text).toContain('Not a receipt - not yet paid');
    });

    it('names the bill and who is serving it', () => {
        expect(text).toContain('Table 4');
        expect(text).toContain('Chanda');
    });

    it('prints every line with its quantity and price', () => {
        expect(text).toContain('Beef Stew & Nshima');
        expect(text).toContain('2 x K95.00');
        expect(text).toContain('Mosi Lager 375ml');
        expect(text).toContain('4 x K25.00');
    });

    it('asks for the total including tax', () => {
        // 290 net + 16% = 336.40. A bill that disagrees with the till is a
        // bill the venue stops printing.
        expect(text).toContain('TO PAY');
        expect(text).toContain('K336.40');
        expect(text).toContain('K46.40');
    });

    it('carries no payment, no change and no barcode', () => {
        expect(text).not.toContain('Change');
        expect(text).not.toContain('Cash');
        expect(text).not.toContain('Receipt');
        // GS k — the barcode command. A bill identifies no sale, because no
        // sale has happened yet.
        expect(text).not.toContain('\x1dk');
    });

    it('never pulses the cash drawer', () => {
        // ESC p — nothing has been taken, so the drawer has no business
        // opening.
        expect(text).not.toContain('\x1bp');
    });

    it('ends by cutting the paper', () => {
        // GS V — so the bill can be torn off and carried to the table.
        expect(text).toContain('\x1dV');
    });

    it('extracts tax instead of adding it when shelf prices include it', () => {
        const inclusive = buildBillBytes(
            tab,
            { ...settings, pricesIncludeTax: true } as StoreSettings,
            { paperWidth: 80 },
        );
        const t = asText(inclusive);
        // The menu prices already contain the tax, so the table pays exactly
        // the sum of what the menu says: 290.
        expect(t).toContain('K290.00');
        expect(t).toContain('Tax included');
    });

    it('prints a zero-rated venue with no tax line at all', () => {
        const t = asText(buildBillBytes(tab, { ...settings, taxRate: 0 } as StoreSettings, { paperWidth: 80 }));
        expect(t).not.toContain('Tax');
        expect(t).toContain('K290.00');
    });

    it('fits a 58mm roll without wrapping the total', () => {
        const narrow = asText(buildBillBytes(tab, settings, { paperWidth: 58 }));
        const line = narrow.split('\n').find(l => l.includes('TO PAY'));
        expect(line).toBeDefined();
        // Measured from 'TO PAY' onward: the bytes before it are the bold and
        // double-width commands, whose opcodes ('E', '!') are printable
        // characters that never reach the paper.
        const printed = line!.slice(line!.indexOf('TO PAY'));
        // Double width halves the usable columns on a 32-column roll, so the
        // row has to be laid out against 16 or the total wraps onto its own
        // line and the bill reads as if it has two totals.
        expect(printed.length).toBe(16);
        expect(printed.endsWith('K336.40')).toBe(true);
    });
});
