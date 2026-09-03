import { Align } from './escpos';

/**
 * Turns a finished ESC/POS stream back into something a screen can draw.
 *
 * The point is not decoration — it is that a shopkeeper setting up their
 * receipt should be looking at the receipt, not at a drawing of one. The
 * obvious way to build a preview is to lay out the fields again in HTML, and
 * that is the way that goes wrong: the moment anyone touches `buildReceiptBytes`
 * the preview and the paper start disagreeing, and nothing tells you. The
 * disagreement surfaces in a shop, on a roll, in front of a customer.
 *
 * So the preview is decoded from the very bytes the printer is sent. If the
 * paper is wrong, the preview is wrong in exactly the same way, which is the
 * property worth having. It also means every layout rule — the 32-column grid,
 * the wrapping, the double-width total — is honoured for free rather than
 * reimplemented and kept in step by hand.
 *
 * Only the commands `EscPosBuilder` actually emits are understood. That is
 * deliberate: an unknown command is skipped rather than guessed at, because a
 * preview that invents content is worse than one that omits it.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

/** CODE128 code-set B selector, which `code128Data` prefixes every payload with. */
const CODE_SET_B = [0x7b, 0x42];

export type PreviewLine =
    | { kind: 'text'; text: string; align: Align; bold: boolean; double: boolean }
    /** The printer draws the bars and prints the digits underneath from one payload. */
    | { kind: 'barcode'; value: string; align: Align };

export interface PreviewReceipt {
    lines: PreviewLine[];
    /** True once the stream asks for a cut, which is how the roll ends. */
    cut: boolean;
    /** True if this receipt would also kick the cash drawer. */
    drawer: boolean;
}

/** Strip the code-set selector and undouble `{`, recovering what was encoded. */
const readBarcode = (data: number[]): string => {
    let body = data;
    if (body[0] === CODE_SET_B[0] && body[1] === CODE_SET_B[1]) body = body.slice(2);
    let out = '';
    for (let i = 0; i < body.length; i++) {
        // A literal '{' was doubled on the way in, so it collapses on the way out.
        if (body[i] === 0x7b && body[i + 1] === 0x7b) {
            out += '{';
            i++;
            continue;
        }
        out += String.fromCharCode(body[i]);
    }
    return out;
};

export const decodeReceipt = (bytes: Uint8Array): PreviewReceipt => {
    const lines: PreviewLine[] = [];
    let align: Align = 'left';
    let bold = false;
    let double = false;
    let cut = false;
    let drawer = false;
    let buffer = '';

    // A line only exists once something ends it. Holding the text until then is
    // what lets a run of styling commands mid-line take effect on the whole line
    // the way the printer applies them.
    const flush = () => {
        lines.push({ kind: 'text', text: buffer, align, bold, double });
        buffer = '';
    };

    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];

        if (byte === LF) {
            flush();
            continue;
        }

        if (byte === ESC) {
            const cmd = bytes[i + 1];
            if (cmd === 0x40) { i += 1; continue; }                       // ESC @  init
            if (cmd === 0x74) { i += 2; continue; }                       // ESC t  code page
            if (cmd === 0x61) {                                            // ESC a  align
                const n = bytes[i + 2];
                align = n === 1 ? 'center' : n === 2 ? 'right' : 'left';
                i += 2;
                continue;
            }
            if (cmd === 0x45) { bold = bytes[i + 2] !== 0; i += 2; continue; }  // ESC E  bold
            if (cmd === 0x70) { drawer = true; i += 4; continue; }         // ESC p  drawer pulse
            i += 1;
            continue;
        }

        if (byte === GS) {
            const cmd = bytes[i + 1];
            if (cmd === 0x21) { double = bytes[i + 2] !== 0; i += 2; continue; }   // GS !  size
            if (cmd === 0x56) { cut = true; i += 3; continue; }                     // GS V  cut
            if (cmd === 0x6b) {                                                     // GS k  barcode
                const length = bytes[i + 3];
                const data = Array.from(bytes.slice(i + 4, i + 4 + length));
                // Anything already typed belongs on its own line above the bars.
                if (buffer) flush();
                lines.push({ kind: 'barcode', value: readBarcode(data), align });
                i += 3 + length;
                continue;
            }
            // GS h / w / H / f — barcode geometry, which changes nothing on screen.
            if (cmd === 0x68 || cmd === 0x77 || cmd === 0x48 || cmd === 0x66) { i += 2; continue; }
            i += 1;
            continue;
        }

        // Printable ASCII is all `encode` ever emits; anything else was already
        // dropped before it reached the printer, so it cannot appear here.
        if (byte >= 0x20 && byte <= 0x7e) buffer += String.fromCharCode(byte);
    }

    if (buffer) flush();

    return { lines, cut, drawer };
};

/**
 * Drop the blank lines the cut leaves behind.
 *
 * `cut()` feeds four lines so the blade clears the print head. On paper that is
 * margin nobody notices; on screen it is a stretch of emptiness that makes the
 * preview look broken, so it comes off the end.
 */
export const trimTrailingBlanks = (lines: PreviewLine[]): PreviewLine[] => {
    let end = lines.length;
    while (end > 0) {
        const last = lines[end - 1];
        if (last.kind === 'text' && last.text.trim() === '') end--;
        else break;
    }
    return lines.slice(0, end);
};
