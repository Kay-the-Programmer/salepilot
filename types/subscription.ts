export interface BackendPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    description: string;
    features: string[];
}
