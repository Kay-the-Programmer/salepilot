import { api } from './api';

export interface Offer {
    id: string;
    user_id: string;
    user_name: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    status: 'open' | 'accepted' | 'completed' | 'cancelled';
    accepted_by?: string;
    accepted_by_name?: string;
    created_at: string;
    store_id?: string;
}

export const offersService = {
    getAll: async () => {
        return api.get<Offer[]>('/offers');
    },

    getById: async (id: string) => {
        return api.get<Offer>(`/offers/${id}`);
    },

    create: async (data: { title: string; description: string; latitude: number; longitude: number; store_id?: string }) => {
        return api.post<Offer>('/offers', data);
    },

    accept: async (id: string) => {
        return api.post<Offer>(`/offers/${id}/accept`);
    }
};
