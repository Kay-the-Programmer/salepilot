import { describe, it, expect } from 'vitest';
import { COLUMNS, EscPosBuilder, encode, wrap } from './escpos';

/**
 * These are the bytes a thermal printer actually receives. Getting them wrong
 * does not throw — it prints garbage, or nothing, on a customer's receipt — so
 * the control codes are pinned exactly.
 */
describe('EscPosBuilder', () => {
    it('starts with the reset the printer expects', () => {
        const bytes = new EscPosBuilder().init().build();
        // ESC @ = initialise, then ESC t 0 = code page PC437.
        expect(Array.from(bytes.slice(0, 5))).toEqual([0x1b, 0x40, 0x1b, 0x74, 0x00]);
    });

    it('emits the documented alignment codes', () => {
        const of = (m: 'left' | 'center' | 'right') =>
            Array.from(new EscPosBuilder().align(m).build());
        expect(of('left')).toEqual([0x1b, 0x61, 0]);
        expect(of('center')).toEqual([0x1b, 0x61, 1]);
        expect(of('right')).toEqual([0x1b, 0x61, 2]);
    });

    it('toggles bold on and off', () => {
        expect(Array.from(new EscPosBuilder().bold(true).build())).toEqual([0x1b, 0x45, 1]);
        expect(Array.from(new EscPosBuilder().bold(false).build())).toEqual([0x1b, 0x45, 0]);
    });

    it('feeds before cutting, so the blade misses the last lines', () => {
        const bytes = Array.from(new EscPosBuilder().cut().build());
        // Four line feeds, then GS V B 0 (partial cut).
        expect(bytes).toEqual([0x0a, 0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x42, 0x00]);
    });

    it('pulses the cash drawer on pin 2', () => {
        expect(Array.from(new EscPosBuilder().openDrawer().build()))
            .toEqual([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    });

    it('rules the full width of the roll', () => {
        const narrow = new EscPosBuilder(COLUMNS[58]).rule().build();
        const wide = new EscPosBuilder(COLUMNS[80]).rule().build();
        // One byte per dash, plus the trailing line feed.
        expect(narrow.length).toBe(COLUMNS[58] + 1);
        expect(wide.length).toBe(COLUMNS[80] + 1);
    });
});

describe('columnsRow', () => {
    const rowText = (columns: number, l: string, r: string) =>
        String.fromCharCode(...new EscPosBuilder(columns).columnsRow(l, r).build()).replace('\n', '');

    it('pushes the value hard against the right margin', () => {
        const row = rowText(32, 'Subtotal', '25.00');
        expect(row).toHaveLength(32);
        expect(row.startsWith('Subtotal')).toBe(true);
        expect(row.endsWith('25.00')).toBe(true);
    });

    it('fills the exact roll width on both paper sizes', () => {
        expect(rowText(COLUMNS[58], 'TOTAL', '1,234.00')).toHaveLength(COLUMNS[58]);
        expect(rowText(COLUMNS[80], 'TOTAL', '1,234.00')).toHaveLength(COLUMNS[80]);
    });

    it('truncates an over-long label rather than pushing the value off the paper', () => {
        const row = rowText(32, 'A'.repeat(60), '9.99');
        expect(row.length).toBeLessThanOrEqual(32);
        expect(row.endsWith('9.99')).toBe(true);
    });

    it('always leaves at least one space between label and value', () => {
        const row = rowText(20, 'A'.repeat(18), '9.99');
        expect(row).toContain(' 9.99');
    });
});

describe('encode', () => {
    it('passes printable ASCII straight through', () => {
        expect(encode('Cola 500ml')).toEqual([...'Cola 500ml'].map(c => c.charCodeAt(0)));
    });

    it('transliterates the punctuation that arrives from pasted text', () => {
        // A product name pasted from Word would otherwise print as garbage.
        expect(String.fromCharCode(...encode('Chief’s “Best” – 2'))).toBe('Chief\'s "Best" - 2');
    });

    it('folds a non-breaking space to a real one', () => {
        expect(String.fromCharCode(...encode('K1 200.00'))).toBe('K1 200.00');
    });

    it('drops characters the printer has no glyph for', () => {
        // Dropping beats printing a different character than the screen showed.
        expect(String.fromCharCode(...encode('Café 你好'))).toBe('Caf ');
    });

    it('keeps line feeds', () => {
        expect(encode('a\nb')).toEqual([0x61, 0x0a, 0x62]);
    });
});

describe('wrap', () => {
    it('breaks a long name onto the roll instead of truncating it', () => {
        const lines = wrap('Premium Imported Italian Olive Oil Extra Virgin', 20);
        expect(lines.length).toBeGreaterThan(1);
        for (const l of lines) expect(l.length).toBeLessThanOrEqual(20);
        expect(lines.join(' ')).toBe('Premium Imported Italian Olive Oil Extra Virgin');
    });

    it('hard-splits a single word longer than the roll', () => {
        const lines = wrap('A'.repeat(50), 20);
        for (const l of lines) expect(l.length).toBeLessThanOrEqual(20);
    });

    it('returns one empty line for empty input', () => {
        expect(wrap('', 20)).toEqual(['']);
        expect(wrap('   ', 20)).toEqual(['']);
    });
});

/**
 * A barcode is the one thing on a receipt whose correctness nobody can eyeball:
 * a wrong byte prints bars that look perfectly convincing and scan as nothing,
 * or as the wrong sale. The command bytes are pinned exactly.
 */
describe('barcode', () => {
    const bytes = (value: string) => Array.from(new EscPosBuilder().barcode(value).build());

    it('sets the geometry before emitting the symbol', () => {
        const b = bytes('AB');
        // GS h 64 (height), GS w 2 (module width), GS H 2 (number below the
        // bars), GS f 0 (that number in Font A).
        expect(b.slice(0, 12)).toEqual([
            0x1d, 0x68, 64,
            0x1d, 0x77, 2,
            0x1d, 0x48, 2,
            0x1d, 0x66, 0,
        ]);
    });

    it('emits CODE128 in the length-prefixed form, code set B', () => {
        const b = bytes('AB');
        // GS k 73 n, then '{' 'B' 'A' 'B'. n counts the selector.
        expect(b.slice(12)).toEqual([0x1d, 0x6b, 73, 4, 0x7b, 0x42, 0x41, 0x42]);
    });

    it('counts the code-set selector in the length byte', () => {
        const b = bytes('SALEPILOT1');
        const n = b[15];
        // Without this the printer reads two bytes past the end of the data and
        // prints a symbol that scans as the wrong thing, or not at all.
        expect(n).toBe('SALEPILOT1'.length + 2);
        expect(b.length).toBe(12 + 4 + n);
    });

    it('doubles a literal brace, which would otherwise switch code set', () => {
        expect(bytes('A{B').slice(18)).toEqual([0x41, 0x7b, 0x7b, 0x42]);
    });

    it('drops characters code set B cannot carry, rather than voiding the symbol', () => {
        // One accented character in a code would otherwise abort the whole
        // barcode, and the receipt would print bars for nothing.
        expect(bytes('AB\u00e9C').slice(18)).toEqual([0x41, 0x42, 0x43]);
    });

    it('emits nothing at all when there is nothing to encode', () => {
        // Better a receipt with no barcode than one carrying an empty symbol.
        expect(bytes('')).toEqual([]);
        expect(bytes('\u00e9\u00e8')).toEqual([]);
    });

    it('never exceeds the single length byte the command allows', () => {
        const b = bytes('X'.repeat(400));
        expect(b[15]).toBeLessThanOrEqual(255);
    });
});
