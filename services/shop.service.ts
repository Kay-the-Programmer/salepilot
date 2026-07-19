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

export interface ProductPage {
    items: Product[];
    total: number;
    page: number;
    pageSize: number;
}

export type ShopSort = 'name' | 'price_asc' | 'price_desc' | 'newest';

/** Storefront category: only ever returned when it has live products. */
export type ShopCategory = Category & { productCount: number };

export interface PublicStore {
    id: string;
    name: string;
    status: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    currency?: any;
}

export interface GlobalProduct extends Product {
    storeName?: string;
    currency?: any;
}

export interface ShopOrderStatus {
    orderId: string;
    timestamp: string;
    total: number;
    subtotal: number;
    tax: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    customerName?: string;
    items: { name: string; quantity: number; price: number }[];
}

export const shopService = {
    getShopInfo: async (storeId: string): Promise<ShopInfo> => {
        return api.get<ShopInfo>(`/shop/${storeId}/info`);
    },

    /** Paginated product listing (server-side search / sort / category / stock filters). */
    getProducts: async (
        storeId: string,
        opts: { categoryId?: string; search?: string; sort?: ShopSort; page?: number; limit?: number; inStock?: boolean } = {}
    ): Promise<ProductPage> => {
        const params = new URLSearchParams();
        if (opts.categoryId) params.append('categoryId', opts.categoryId);
        if (opts.search) params.append('search', opts.search);
        if (opts.sort) params.append('sort', opts.sort);
        if (opts.inStock) params.append('inStock', '1');
        params.append('page', String(opts.page || 1));
        if (opts.limit) params.append('limit', String(opts.limit));
        return api.get<ProductPage>(`/shop/${storeId}/products?${params.toString()}`);
    },

    getProductById: async (storeId: string, productId: string): Promise<Product> => {
        return api.get<Product>(`/shop/${storeId}/products/${productId}`);
    },

    /** Only categories that contain live products, each with a productCount. */
    getCategories: async (storeId: string): Promise<ShopCategory[]> => {
        return api.get<ShopCategory[]>(`/shop/${storeId}/categories`);
    },

    createOrder: async (storeId: string, orderData: { cart: any[]; customerDetails: any }) => {
        return api.post(`/shop/${storeId}/orders`, orderData);
    },

    /** Public order-status lookup — requires the checkout email or phone. */
    getOrderStatus: async (
        storeId: string,
        orderId: string,
        contact: { email?: string; phone?: string }
    ): Promise<ShopOrderStatus> => {
        const params = new URLSearchParams();
        if (contact.email) params.append('email', contact.email);
        if (contact.phone) params.append('phone', contact.phone);
        return api.get<ShopOrderStatus>(`/shop/${storeId}/orders/${orderId}?${params.toString()}`);
    },

    /** Marketplace: all stores with an enabled online storefront. */
    getPublicStores: async (): Promise<PublicStore[]> => {
        return api.get<PublicStore[]>('/shop/stores');
    },

    /** Marketplace: paginated cross-store product search. */
    getGlobalProducts: async (
        opts: { search?: string; sort?: ShopSort; page?: number; limit?: number } = {}
    ): Promise<{ items: GlobalProduct[]; total: number; page: number; pageSize: number }> => {
        const params = new URLSearchParams();
        if (opts.search) params.append('search', opts.search);
        if (opts.sort) params.append('sort', opts.sort);
        params.append('page', String(opts.page || 1));
        if (opts.limit) params.append('limit', String(opts.limit));
        return api.get<{ items: GlobalProduct[]; total: number; page: number; pageSize: number }>(
            `/shop/global-products?${params.toString()}`
        );
    },
};
