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
        isWholesaleSupplier?: boolean;
        currency?: any;
        taxRate?: number;
        deliveryFee?: number;
        freeDeliveryAbove?: number | null;
        storeDescription?: string | null;
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
    isWholesaleSupplier?: boolean;
    isVerified?: boolean;
    storeDescription?: string | null;
}

/** Cross-store category facet (aggregated by name across supplier catalogs). */
export interface GlobalCategory {
    name: string;
    productCount: number;
}

/** A notification addressed to the signed-in user (buyer bell). */
export interface MyNotification {
    id: string;
    title: string;
    message: string;
    link?: string | null;
    isRead: boolean;
    createdAt: string;
}

/** One of the signed-in buyer's orders, across every store (B2B "My orders"). */
export interface MyOrder {
    transactionId: string;
    timestamp: string;
    storeId: string;
    storeName: string;
    storeCurrency?: any;
    total: number;
    subtotal: number;
    tax: number;
    deliveryFee?: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    items: { name: string; quantity: number; price: number; productId?: string }[];
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
    deliveryFee?: number;
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

    createOrder: async (storeId: string, orderData: { cart: any[]; customerDetails: any; fulfillment?: 'delivery' | 'pickup' }) => {
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

    /** Marketplace: stores with an enabled online storefront (wholesale=true → suppliers only). */
    getPublicStores: async (opts: { wholesale?: boolean } = {}): Promise<PublicStore[]> => {
        return api.get<PublicStore[]>(`/shop/stores${opts.wholesale ? '?wholesale=1' : ''}`);
    },

    /** Marketplace: paginated cross-store product search (wholesale=true → supplier catalogs only). */
    getGlobalProducts: async (
        opts: { search?: string; sort?: ShopSort; page?: number; limit?: number; wholesale?: boolean; category?: string } = {}
    ): Promise<{ items: GlobalProduct[]; total: number; page: number; pageSize: number }> => {
        const params = new URLSearchParams();
        if (opts.search) params.append('search', opts.search);
        if (opts.sort) params.append('sort', opts.sort);
        if (opts.wholesale) params.append('wholesale', '1');
        if (opts.category) params.append('category', opts.category);
        params.append('page', String(opts.page || 1));
        if (opts.limit) params.append('limit', String(opts.limit));
        return api.get<{ items: GlobalProduct[]; total: number; page: number; pageSize: number }>(
            `/shop/global-products?${params.toString()}`
        );
    },

    /** Signed-in buyer: order history across all stores. */
    getMyOrders: async (): Promise<MyOrder[]> => {
        return api.get<MyOrder[]>('/marketplace/my-orders');
    },

    /** Marketplace: category names aggregated across supplier catalogs. */
    getGlobalCategories: async (opts: { wholesale?: boolean } = {}): Promise<GlobalCategory[]> => {
        return api.get<GlobalCategory[]>(`/shop/global-categories${opts.wholesale ? '?wholesale=1' : ''}`);
    },

    /** Signed-in buyer: own notifications (order updates etc.) for the bell. */
    getMyNotifications: async (): Promise<MyNotification[]> => {
        return api.get<MyNotification[]>('/notifications/mine');
    },

    /** Public: latest reviews + rating summary for a product. */
    getReviews: async (storeId: string, productId: string): Promise<ProductReviews> => {
        return api.get<ProductReviews>(`/shop/${storeId}/products/${productId}/reviews`);
    },

    /** Signed-in verified buyer: create or update their review (403 otherwise). */
    submitReview: async (storeId: string, productId: string, data: { rating: number; comment?: string }) => {
        return api.post(`/shop/${storeId}/products/${productId}/reviews`, data);
    },
};

export interface ProductReview {
    id: string;
    authorName?: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
}

export interface ProductReviews {
    summary: { average: number; count: number };
    reviews: ProductReview[];
}
