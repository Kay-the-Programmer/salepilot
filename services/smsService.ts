import { api } from './api';

export interface SmsConfig {
    configured: boolean;
    sandbox: boolean;
    senderId: string | null;
    /** Whether the current store has the premium SMS module unlocked. */
    entitled?: boolean;
}

export interface SmsSendResponse {
    success: boolean;
    id?: string | null;
    recipient?: string;
    status?: string;
    cost?: string;
    messageId?: string;
    providerMessage?: string;
    message?: string;
    code?: string;
}

export interface SmsLogEntry {
    id: string;
    storeId?: string;
    customerId?: string | null;
    recipient: string;
    message: string;
    status: string;
    provider?: string;
    providerMessageId?: string | null;
    cost?: string | null;
    error?: string | null;
    sentBy?: string | null;
    createdAt: string;
}

/** Frontend wrapper around the backend Africa's Talking SMS endpoints. */
export const smsService = {
    /** Whether the server has SMS credentials (no secrets returned). */
    getConfig: () => api.get<SmsConfig>('/sms/config'),

    /**
     * Send a single SMS. Resolves with delivery status; rejects with a message on
     * failure. `skipQueue` makes an offline attempt fail fast rather than silently
     * queueing a time-sensitive message for later replay.
     */
    send: (payload: { to: string; message: string; customerId?: string }) =>
        api.post<SmsSendResponse>('/sms/send', payload, { skipQueue: true }),

    /** Recent SMS for the current store (optionally filtered by customer). */
    getHistory: (customerId?: string) =>
        api.get<SmsLogEntry[]>(`/sms${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''}`),
};

export default smsService;
