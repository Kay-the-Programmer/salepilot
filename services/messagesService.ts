import { api } from './api';

export interface Message {
    id: string;
    offer_id: string;
    sender_id: string;
    sender_name?: string;
    content?: string;
    image_url?: string;
    created_at: string;
}

export const messagesService = {
    getByOfferId: async (offerId: string) => {
        return api.get<Message[]>(`/messages/${offerId}`);
    },

    sendMessage: async (offerId: string, content: string, image?: File) => {
        const formData = new FormData();
        formData.append('offerId', offerId);
        if (content) formData.append('content', content);
        if (image) formData.append('image', image);

        return api.postFormData<Message>('/messages', formData);
    }
};
