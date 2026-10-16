import { api } from '../../services/api';

/**
 * Reusable message templates for the CRM messaging hub.
 *
 * Store-scoped on the backend (`/api/crm/templates`) — they used to live in
 * localStorage, so a template written on the counter PC never reached anyone
 * else. The server seeds a new store with sensible defaults on first read.
 *
 * Bodies use two placeholders substituted at send time: `[Name]` → the
 * recipient's first name, `[Store]` → the store name. Promoting these to
 * Meta-approved message templates (required to open a conversation outside the
 * 24h window) is a separate Meta onboarding step.
 */

export interface WaTemplate {
    id: string;
    label: string;
    body: string;
}

const clean = (t: any): WaTemplate => ({ id: String(t.id), label: String(t.label || ''), body: String(t.body || '') });

export const whatsappTemplates = {
    /** All templates for the current store (server seeds defaults on first use). */
    async list(): Promise<WaTemplate[]> {
        try {
            const rows = await api.get<any[]>('/crm/templates');
            return Array.isArray(rows) ? rows.map(clean) : [];
        } catch {
            return [];
        }
    },

    /** Create a template; returns the stored row. */
    async create(label: string, body: string): Promise<WaTemplate> {
        const row = await api.post<any>('/crm/templates', { label, body }, { skipQueue: true });
        return clean(row);
    },

    /** Update an existing template. */
    async update(id: string, label: string, body: string): Promise<WaTemplate> {
        const row = await api.put<any>(`/crm/templates/${id}`, { label, body });
        return clean(row);
    },

    async remove(id: string): Promise<void> {
        await api.delete(`/crm/templates/${id}`, undefined, { skipQueue: true });
    },
};

/** Replace `[Name]` / `[Store]` placeholders for a given recipient. */
export const applyTemplate = (body: string, ctx: { name?: string; store?: string }): string => {
    const first = (ctx.name || '').trim().split(/\s+/)[0] || ctx.name || '';
    return body
        .replace(/\[Name\]/g, first)
        .replace(/\[Store\]/g, ctx.store || 'our shop');
};

export default whatsappTemplates;
