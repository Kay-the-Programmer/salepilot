import { api } from './api';

/** One entry in a customer's outreach timeline (email / SMS / WhatsApp). */
export interface OutreachEntry {
    id: string;
    channel: 'email' | 'sms' | 'whatsapp';
    to?: string | null;
    subject?: string | null;
    body?: string | null;
    status?: string | null;
    cost?: string | null;
    /** WhatsApp only — inbound entries are the customer's own replies. */
    direction?: 'inbound' | 'outbound';
    createdAt: string;
}

export interface EmailSendResult {
    success: boolean;
    id?: string;
    recipient?: string;
    subject?: string;
    message?: string;
}

/**
 * CRM-specific backend calls that aren't customer CRUD: emailing a customer and
 * reading their outreach history. Loyalty lives in
 * `components/crm/loyaltyService`, templates in `components/crm/whatsappTemplates`.
 */
export const crmService = {
    /**
     * Email a customer. The server resolves the address from the stored customer
     * record (so this can only reach the store's own customers), sends via the
     * platform transport and logs the attempt.
     */
    sendEmail: (payload: { customerId?: string; subject?: string; message: string }) =>
        api.post<EmailSendResult>('/crm/email', payload, { skipQueue: true }),

    /** Email + SMS + WhatsApp history, newest first. */
    getOutreach: (customerId?: string) =>
        api.get<OutreachEntry[]>(`/crm/outreach${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''}`),
};

export default crmService;
