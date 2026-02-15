export interface BackendPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    description: string;
    features: string[];
}

export interface SubscriptionHistoryItem {
    id: string;
    planName: string;
    amount: number;
    currency: string;
    status: 'active' | 'expired' | 'cancelled' | 'payment_failed' | 'pending' | 'succeeded';
    startDate: string;
    endDate: string;
    paymentMethod: string;
    reference: string;
    createdAt: string;
    invoiceUrl?: string;
    invoiceId?: string;
}
