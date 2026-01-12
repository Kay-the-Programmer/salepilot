import { api } from './api';
import { Product, Category } from '../types';

export interface ShopInfo {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    settings: {
        name?: string;
        address?: string;
        phone?: string;
        email?: string;
        website?: string;
        isOnlineStoreEnabled?: boolean;
        currency?: any;
        taxRate?: number;
        receiptMessage?: string;
    };
}

export const shopService = {
    getShopInfo: async (storeId: string): Promise<ShopInfo> => {
        return api.get<ShopInfo>(`/shop/${storeId}/info`);
    },

    getProducts: async (storeId: string, categoryId?: string, search?: string): Promise<Product[]> => {
        const params = new URLSearchParams();
        if (categoryId) params.append('categoryId', categoryId);
        if (search) params.append('search', search);

        const queryString = params.toString();
        const endpoint = `/shop/${storeId}/products${queryString ? `?${queryString}` : ''}`;

        return api.get<Product[]>(endpoint);
    },

    getProductById: async (storeId: string, productId: string): Promise<Product> => {
        return api.get<Product>(`/shop/${storeId}/products/${productId}`);
    },

    getCategories: async (storeId: string): Promise<Category[]> => {
        return api.get<Category[]>(`/shop/${storeId}/categories`);
    },

    createOrder: async (storeId: string, orderData: { cart: any[], customerDetails: any }) => {
        return api.post(`/shop/${storeId}/orders`, orderData);
    }
};
