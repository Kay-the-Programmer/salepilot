/**
 * ESC/POS — the command language every thermal receipt printer speaks.
 *
 * A micro-printer is not a page printer. It takes a byte stream of text
 * interleaved with control codes and prints it a line at a time, then cuts.
 * Rendering a page and sending it through a driver works, but it is slow, needs
 * the vendor driver installed, and can never cut the paper or kick the cash
 * drawer — those are commands, not pixels.
 *
 * Reference: Epson ESC/POS, which the entire clone market implements.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

/** Characters that fit across one line, by roll width, at Font A (12 dots wide). */
export const COLUMNS: Record<58 | 80, number> = {
    58: 32,
    80: 48,
};

export type Align = 'left' | 'center' | 'right';

/**
 * Accumulates an ESC/POS byte stream.
 *
 * Text is encoded to a single-byte code page rather than UTF-8: these printers
 * have no Unicode support, and a multi-byte character emerges as mojibake. Any
 * character outside the code page is transliterated where there is an obvious
 * equivalent and dropped otherwise, so a curly quote pasted into a product name
 * cannot corrupt the rest of the line.
 */
export class EscPosBuilder {
    private readonly bytes: number[] = [];

    constructor(readonly columns: number = COLUMNS[80]) {}

    /** Reset the printer to a known state — always the first thing sent. */
    init(): this {
        this.bytes.push(ESC, 0x40);
        // Code page 0 (PC437). The most universally supported page; anything
        // fancier risks a printer that silently ignores the selection.
        this.bytes.push(ESC, 0x74, 0x00);
        return this;
    }

    align(mode: Align): this {
        this.bytes.push(ESC, 0x61, mode === 'left' ? 0 : mode === 'center' ? 1 : 2);
        return this;
    }

    bold(on: boolean): this {
        this.bytes.push(ESC, 0x45, on ? 1 : 0);
        return this;
    }

    /** Double width and/or height, used for the store name and the total. */
    size(double: boolean): this {
        this.bytes.push(GS, 0x21, double ? 0x11 : 0x00);
        return this;
    }

    text(value: string): this {
        this.bytes.push(...encode(value));
        return this;
    }

    line(value = ''): this {
        return this.text(value).feed(1);
    }

    feed(lines = 1): this {
        for (let i = 0; i < lines; i++) this.bytes.push(LF);
        return this;
    }

    /** A full-width horizontal rule. */
    rule(char = '-'): this {
        return this.line(char.repeat(this.columns));
    }

    /**
     * A label on the left and a value hard against the right margin — the shape
     * every money line on a receipt takes. Padding is computed from the roll's
     * column count, which is why the width setting has to be right.
     */
    columnsRow(left: string, right: string): this {
        const l = left.slice(0, Math.max(0, this.columns - right.length - 1));
        const gap = Math.max(1, this.columns - l.length - right.length);
        return this.line(l + ' '.repeat(gap) + right);
    }

    /**
     * Cut the paper. Fed first because the blade sits above the print head — a
     * cut without the feed slices through the last few lines of the receipt.
     */
    cut(): this {
        this.feed(4);
        this.bytes.push(GS, 0x56, 0x42, 0x00);
        return this;
    }

    /**
     * Pulse the cash drawer wired to the printer's RJ11 port. Drawers are
     * driven by the printer, not the computer, which is why this belongs in the
     * receipt stream at all.
     */
    openDrawer(): this {
        this.bytes.push(ESC, 0x70, 0x00, 0x19, 0xfa);
        return this;
    }

    build(): Uint8Array {
        return new Uint8Array(this.bytes);
    }
}

/**
 * Fold text into the printer's single-byte code page.
 *
 * Currency symbols and typographic punctuation are the realistic hazards: a
 * receipt carrying "K1 200.00" with a non-breaking space, or a product name
 * pasted from Word with curly quotes, would otherwise print as garbage.
 */
const TRANSLITERATE: Record<string, string> = {
    '‘': "'", '’': "'", '‚': ',', '‛': "'",
    '“': '"', '”': '"', '„': '"',
    '–': '-', '—': '-', '−': '-',
    '…': '...',
    ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ',
    '·': '.', '•': '*',
    '×': 'x',
};

export const encode = (value: string): number[] => {
    const out: number[] = [];
    for (const char of value) {
        const mapped = TRANSLITERATE[char] ?? char;
        for (const c of mapped) {
            const code = c.charCodeAt(0);
            // Printable ASCII passes through untouched; everything else would
            // be a different glyph on the printer than on screen, so it is
            // dropped rather than printed wrong.
            if (code >= 0x20 && code <= 0x7e) out.push(code);
            else if (code === 0x0a) out.push(LF);
        }
    }
    return out;
};

/** Wrap a long product name onto the roll rather than letting it truncate. */
export const wrap = (value: string, columns: number): string[] => {
    const words = value.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [''];
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        if (current.length === 0) {
            current = word.slice(0, columns);
        } else if (current.length + 1 + word.length <= columns) {
            current += ' ' + word;
        } else {
            lines.push(current);
            current = word.slice(0, columns);
        }
    }
    if (current) lines.push(current);
    return lines;
};
