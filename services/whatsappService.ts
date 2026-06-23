import { api } from './api';
import { WhatsAppConfig, WhatsAppConversation, WhatsAppMessage } from '../types';

/**
 * Lightweight, CRM-friendly view of the store's WhatsApp connection.
 * Analogous to {@link SmsConfig} — returns no secrets, just whether the
 * channel is usable. Backed by `GET /whatsapp/status`.
 */
export interface WhatsAppStatus {
    /** Server has Meta Cloud API credentials (access token + phone number id). */
    configured: boolean;
    /** Store owner has switched the integration on. */
    enabled: boolean;
    /** Store has the premium WhatsApp module unlocked. */
    entitled: boolean;
    /** The business number shown to customers (E.164), if known. */
    displayPhoneNumber?: string | null;
}

/** Result of an outbound WhatsApp send (mirrors the Meta Cloud API response shape). */
export interface WhatsAppSendResponse {
    success: boolean;
    /** Conversation the message was filed under (created if it didn't exist). */
    conversationId?: string;
    /** WhatsApp's message id (`wamid.*`). */
    messageId?: string | null;
    status?: string;
    /** Present when the send was rejected (e.g. outside the 24h session window). */
    message?: string;
    code?: string;
}

/**
 * Frontend wrapper around the backend WhatsApp Business Cloud API endpoints.
 *
 * The backend mirrors the Meta "Jasper's Market" reference: it owns the access
 * token + webhook, sends via `POST /{phone_number_id}/messages`, and persists
 * conversations/messages so the CRM can show a two-way inbox. This service only
 * speaks to our own `/api/whatsapp/*` routes — credentials never reach the client.
 */
export const whatsappService = {
    /** Whether WhatsApp is connected, enabled and entitled for this store. */
    getStatus: () => api.get<WhatsAppStatus>('/whatsapp/status'),

    /** Full integration config (Settings screen). The access token is masked;
     *  a boolean `access_token_set` says whether one is already stored. */
    getConfig: () => api.get<WhatsAppConfig & { access_token_set?: boolean }>('/whatsapp/config'),

    /** Save the store's Cloud API credentials (PUT). Requires `messaging:manage`.
     *  A blank `access_token` keeps the stored one (write-only secret). */
    saveConfig: (config: Partial<WhatsAppConfig>) => api.put('/whatsapp/config', config),

    /**
     * Send a WhatsApp message to a customer by phone number. The backend locates
     * (or opens) the conversation, sends via the Cloud API and records it.
     * `skipQueue` makes an offline attempt fail fast rather than silently
     * queueing a time-sensitive message for later replay.
     */
    send: (payload: { to: string; message: string; customerId?: string }) =>
        api.post<WhatsAppSendResponse>('/whatsapp/send', payload, { skipQueue: true }),

    /** Conversations for the current store, most-recent first. */
    getConversations: () => api.get<WhatsAppConversation[]>('/whatsapp/conversations'),

    /** Messages within a conversation, oldest first. */
    getMessages: (conversationId: string) =>
        api.get<WhatsAppMessage[]>(`/whatsapp/conversations/${conversationId}/messages`),

    /** Reply inside an existing conversation (used by the inbox chat window). */
    reply: (payload: { conversationId: string; content: string }) =>
        api.post<WhatsAppSendResponse>('/whatsapp/send', payload, { skipQueue: true }),

    /** Recent WhatsApp messages for one customer (profile timeline). */
    getHistory: (customerId: string) =>
        api.get<WhatsAppMessage[]>(`/whatsapp/messages?customerId=${encodeURIComponent(customerId)}`),
};

export default whatsappService;
