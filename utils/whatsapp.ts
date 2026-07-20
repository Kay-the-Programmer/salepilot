/**
 * Build a wa.me click-to-chat link from a store's displayed phone number.
 * Normalizes local Zambian formats (09…/07… → 260…); returns null when the
 * number can't plausibly be dialed internationally.
 */
export const waChatLink = (phone: string | undefined | null, text?: string): string | null => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 9) return null;
    let intl = digits;
    if (digits.startsWith('0') && digits.length === 10) intl = `260${digits.slice(1)}`;
    else if (digits.length === 9) intl = `260${digits}`;
    return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
