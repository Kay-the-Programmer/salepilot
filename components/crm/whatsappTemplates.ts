/**
 * Reusable WhatsApp message templates for the CRM messaging hub.
 *
 * Stored per store in localStorage (zero backend migrations, like
 * {@link loyaltyService}). Bodies use two placeholders that are substituted at
 * send time: `[Name]` → the recipient's first name, `[Store]` → the store name.
 * Promoting these to Meta-approved message templates (required to start
 * conversations outside the 24h window) is the natural backend next step.
 */

export interface WaTemplate {
    id: string;
    label: string;
    body: string;
}

const KEY = (storeId: string) => `crm.wa.templates.${storeId}`;
const storeKey = (storeId?: string | null) => storeId || 'default';

const DEFAULTS: WaTemplate[] = [
    { id: 'tpl_loyalty', label: 'Loyalty Reward', body: `Hi [Name], as a valued member we've just added 500 bonus loyalty points to your account! Visit us soon to redeem. — [Store]` },
    { id: 'tpl_discount', label: 'Special Discount', body: `Special offer for you, [Name]! Use code PILOT20 for 20% off your next purchase this weekend. Hope to see you! — [Store]` },
    { id: 'tpl_checkin', label: 'Checking In', body: `Hi [Name], we haven't seen you in a while! Just checking in to see if there's anything we can help you find. — [Store]` },
    { id: 'tpl_birthday', label: 'Birthday Gift', body: `Happy Birthday [Name]! 🎂 Stop by today for a free gift with any purchase. Wishing you the best! — [Store]` },
    { id: 'tpl_order_ready', label: 'Order Ready', body: `Hi [Name], your order is ready for pickup. See you soon! — [Store]` },
    { id: 'tpl_thanks', label: 'Thank You', body: `Thank you for your purchase, [Name]! We really appreciate your business. — [Store]` },
];

const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const persist = (storeId: string | null | undefined, list: WaTemplate[]): WaTemplate[] => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY(storeKey(storeId)), JSON.stringify(list));
    return list;
};

export const whatsappTemplates = {
    /** All templates for a store (seeded with sensible defaults on first use). */
    list(storeId?: string | null): WaTemplate[] {
        if (typeof localStorage === 'undefined') return [...DEFAULTS];
        const raw = localStorage.getItem(KEY(storeKey(storeId)));
        if (raw === null) return persist(storeId, [...DEFAULTS]);
        const list = safeParse<WaTemplate[]>(raw, []);
        return Array.isArray(list) ? list : [...DEFAULTS];
    },

    /** Add or update a template; returns the new full list. */
    save(storeId: string | null | undefined, tpl: WaTemplate): WaTemplate[] {
        const list = this.list(storeId);
        const idx = list.findIndex(t => t.id === tpl.id);
        if (idx >= 0) list[idx] = tpl; else list.push(tpl);
        return persist(storeId, [...list]);
    },

    remove(storeId: string | null | undefined, id: string): WaTemplate[] {
        return persist(storeId, this.list(storeId).filter(t => t.id !== id));
    },

    newId: () => `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
};

/** Replace `[Name]` / `[Store]` placeholders for a given recipient. */
export const applyTemplate = (body: string, ctx: { name?: string; store?: string }): string => {
    const first = (ctx.name || '').trim().split(/\s+/)[0] || ctx.name || '';
    return body
        .replace(/\[Name\]/g, first)
        .replace(/\[Store\]/g, ctx.store || 'our shop');
};

export default whatsappTemplates;
