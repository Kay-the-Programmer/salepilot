import { api } from './api';

export interface WaCampaign {
    id: string;
    store_id: string;
    name: string;
    type: 'one_off' | 'recurring' | 'trigger';
    status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
    segment: string;
    segment_params: any;
    message_mode: 'text' | 'template';
    message_text: string | null;
    template_name: string | null;
    template_lang: string | null;
    template_params: any;
    scheduled_at: string | null;
    recurrence: string | null;
    trigger_event: string | null;
    trigger_params: any;
    last_run_at: string | null;
    next_run_at: string | null;
    sent_count: number;
    created_at: string;
}

export interface CreateCampaignInput {
    name: string;
    type: 'one_off' | 'recurring' | 'trigger';
    segment?: string;
    segmentParams?: Record<string, any>;
    messageMode: 'text' | 'template';
    messageText?: string;
    templateName?: string;
    templateLang?: string;
    templateParams?: string[];
    scheduledAt?: string | null;
    recurrence?: 'daily' | 'weekly' | 'monthly' | null;
    triggerEvent?: 'welcome' | 'winback' | 'post_purchase' | null;
    triggerParams?: Record<string, any>;
}

/** Frontend wrapper around the backend WhatsApp campaign/automation endpoints. */
export const whatsappCampaignService = {
    list: () => api.get<WaCampaign[]>('/whatsapp/campaigns'),
    create: (body: CreateCampaignInput) => api.post<WaCampaign>('/whatsapp/campaigns', body, { skipQueue: true }),
    setStatus: (id: string, status: 'active' | 'paused' | 'scheduled' | 'cancelled') =>
        api.post<WaCampaign>(`/whatsapp/campaigns/${id}/status`, { status }, { skipQueue: true }),
    run: (id: string) => api.post<{ success: boolean; sent: number; failed: number }>(`/whatsapp/campaigns/${id}/run`, {}, { skipQueue: true }),
    remove: (id: string) => api.delete<{ success: boolean }>(`/whatsapp/campaigns/${id}`),
};

export default whatsappCampaignService;
