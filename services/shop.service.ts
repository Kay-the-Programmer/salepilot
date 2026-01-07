import axios from 'axios';
import { Product, Category } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    };
}

export const shopService = {
    getShopInfo: async (storeId: string): Promise<ShopInfo> => {
        const response = await axios.get(`${API_URL}/shop/${storeId}/info`);
        return response.data;
    },

    getProducts: async (storeId: string, categoryId?: string, search?: string): Promise<Product[]> => {
        const params: any = {};
        if (categoryId) params.categoryId = categoryId;
        if (search) params.search = search;

        const response = await axios.get(`${API_URL}/shop/${storeId}/products`, { params });
        return response.data;
    },

    getProductById: async (storeId: string, productId: string): Promise<Product> => {
        const response = await axios.get(`${API_URL}/shop/${storeId}/products/${productId}`);
        return response.data;
    },

    getCategories: async (storeId: string): Promise<Category[]> => {
        const response = await axios.get(`${API_URL}/shop/${storeId}/categories`);
        return response.data;
    },

    createOrder: async (storeId: string, orderData: { cart: any[], customerDetails: any }) => {
        const response = await axios.post(`${API_URL}/shop/${storeId}/orders`, orderData);
        return response.data;
    }
};
