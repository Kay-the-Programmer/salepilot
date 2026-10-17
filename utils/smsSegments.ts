/**
 * What an SMS actually costs, counted the way the network counts it.
 *
 * Mirrors s-back/src/services/sms-branding.ts. The two must agree: the server
 * prepends the store's name and charges for the result, so a composer showing
 * "140 / 160" while the server sends 154 characters is lying about money.
 *
 * A single SMS carries 160 GSM-7 characters; past that each part loses 7 to the
 * concatenation header, so parts hold 153. One character outside GSM-7 — a
 * curly quote pasted from Word, an emoji — drops the whole message to UCS-2,
 * where the same limits are 70 and 67.
 */

const GSM7_BASIC =
    '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
    '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

/** Sent as an escape plus a code, so each costs two units. */
const GSM7_EXTENDED = '\f^{}\\[~]|€';

const BASIC = new Set(GSM7_BASIC.split(''));
const EXTENDED = new Set(GSM7_EXTENDED.split(''));

export interface SmsSegmentInfo {
    encoding: 'GSM-7' | 'UCS-2';
    /** Billable units, not JS characters. */
    characters: number;
    /** Units allowed in the current shape (single vs concatenated). */
    limit: number;
    perSegment: number;
    /** Messages the network will bill for. */
    segments: number;
    remaining: number;
}

export const smsSegments = (text: string): SmsSegmentInfo => {
    const value = text || '';
    let gsm7 = true;
    let units = 0;

    for (const ch of value) {
        if (BASIC.has(ch)) { units += 1; continue; }
        if (EXTENDED.has(ch)) { units += 2; continue; }
        gsm7 = false;
        break;
    }

    if (!gsm7) {
        units = 0;
        for (const ch of value) units += ch.length; // UTF-16 units; astral emoji cost 2
    }

    const single = gsm7 ? 160 : 70;
    const multi = gsm7 ? 153 : 67;
    const encoding = gsm7 ? 'GSM-7' : 'UCS-2';

    if (units === 0) return { encoding, characters: 0, limit: single, perSegment: multi, segments: 0, remaining: single };
    if (units <= single) return { encoding, characters: units, limit: single, perSegment: multi, segments: 1, remaining: single - units };

    const segments = Math.ceil(units / multi);
    return { encoding, characters: units, limit: segments * multi, perSegment: multi, segments, remaining: segments * multi - units };
};

export const SMS_DISPLAY_NAME_MAX = 20;
export const SMS_SENDER_ID_MAX = 11;

/** Same cleaning the server applies before storing a display name. */
export const sanitizeSmsDisplayName = (raw: string): string =>
    (raw || '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F-\u009F]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trimStart()
        .slice(0, SMS_DISPLAY_NAME_MAX);

/**
 * The text the customer will receive. Prepends the store name unless the
 * message already opens with it — the same no-double rule the server applies,
 * so the preview and the count match what is sent.
 */
export const previewSmsText = (displayName: string | null | undefined, message: string): string => {
    const body = (message || '').trim();
    const name = sanitizeSmsDisplayName(displayName || '').trim();
    if (!name) return body;
    const prefix = `${name}: `;
    const lower = body.toLowerCase();
    if (lower.startsWith(prefix.toLowerCase())) return body;
    if (lower.startsWith(name.toLowerCase())) {
        const rest = body.slice(name.length);
        if (/^\s*[:\-–,]/.test(rest) || rest === '') return body;
    }
    return prefix + body;
};

export default smsSegments;
