


export interface VerificationDocument {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
}

export interface ProductVariant {
    name?: string; // e.g., size/color label
    sku: string;
    price: number;
    stock: number;
    unitOfMeasure?: 'unit' | 'kg';
}

export interface Product {
    id: string;
    name: string;
    description: string;
    sku: string;
    barcode?: string;
    // DEPRECATED: category: string;
    categoryId?: string;
    price: number; // Retail Price
    costPrice?: number;
    stock: number;
    unitOfMeasure?: 'unit' | 'kg';
    imageUrls: string[];
    supplierId?: string;
    brand?: string;
    reorderPoint?: number;
    safetyStock?: number;
    weight?: number; // kg
    dimensions?: string; // e.g., "W x H x D cm"
    variants?: ProductVariant[];
    status: 'active' | 'archived';
    customAttributes?: { [attributeId: string]: string };
    createdAt?: string;
    updatedAt?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'superadmin' | 'admin' | 'staff' | 'inventory_manager' | 'customer' | 'supplier';
    phone?: string;
    token?: string; // JWT returned on login (stored client-side)
    currentStoreId?: string; // Multi-tenant: currently selected store
    profilePicture?: string;
    onboardingState?: {
        completedActions: string[];
        dismissedHelpers: string[];
        lastUpdated?: string;
    };
    isVerified?: boolean;
    subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled';
    subscriptionEndsAt?: string;
    subscriptionPlan?: string;
}

export interface CartItem {
    productId: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    stock: number; // To check against when increasing quantity
    unitOfMeasure?: 'unit' | 'kg';
    returnedQuantity?: number;
    costPrice?: number; // Cost of the item at the time of sale
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    notes?: string;
    createdAt: string;
    storeCredit: number;
    accountBalance: number; // A/R Balance
}

export interface Payment {
    id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string;
}

export interface Sale {
    transactionId: string;
    timestamp: string;
    cart: CartItem[];
    total: number;
    subtotal: number;
    tax: number;
    discount: number;
    storeCreditUsed?: number;
    refundStatus: 'none' | 'partially_refunded' | 'fully_refunded' | 'returned' | 'partially_returned';
    customerId?: string;
    customerName?: string;
    totalRefunded?: number;
    originalTotal?: number;
    // New fields for invoicing
    paymentStatus: 'paid' | 'unpaid' | 'partially_paid';
    fulfillmentStatus?: 'pending' | 'fulfilled' | 'shipped' | 'cancelled';
    channel?: 'pos' | 'online';
    customerDetails?: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    amountPaid: number;
    cashReceived?: number;
    changeDue?: number;
    dueDate?: string;
    payments?: Payment[];
    // UI helper fields
    itemsCount?: number;
    paymentMethod?: string;
}

export interface Return {
    id: string;
    originalSaleId: string;
    timestamp: string;
    returnedItems: {
        productId: string;
        productName: string;
        quantity: number;
        reason: string;
        addToStock: boolean;
    }[];
    refundAmount: number;
    taxAmount: number;
    subtotalAmount: number;
    refundMethod: string;
}


export interface CustomAttribute {
    id: string;
    name: string;
}

export interface Category {
    id: string;
    name: string;
    parentId: string | null;
    attributes: CustomAttribute[];
    revenueAccountId?: string;
    cogsAccountId?: string;
}

export interface CountedItem {
    productId: string;
    name: string;
    sku: string;
    expected: number;
    counted: number | null; // null means not yet counted
}

export interface StockTakeSession {
    id: string;
    startTime: string;
    endTime?: string;
    status: 'active' | 'completed';
    items: CountedItem[];
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    paymentTerms?: string;
    bankingDetails?: string;
    notes?: string;
    linkedStoreId?: string; // If this supplier is a registered store in the system
}

export interface POItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    costPrice: number; // Cost at time of order
    receivedQuantity: number;
}

export interface ReceptionEvent {
    date: string;
    items: {
        productId: string;
        productName: string;
        quantityReceived: number;
    }[];
}

export interface PurchaseOrder {
    id: string;
    poNumber: string; // e.g., PO-2024-001
    supplierId: string;
    supplierName: string; // denormalized for easy display
    status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'canceled';
    items: POItem[];
    createdAt: string;
    orderedAt?: string;
    expectedAt?: string;
    receivedAt?: string;
    notes?: string;
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    receptions?: ReceptionEvent[];
    isMarketplaceOrder?: boolean;
    marketplaceOrderId?: string; // ID of the Sale in the supplier's store
}

export interface StoreSettings {
    storeId: string;
    // Store Information
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    isOnlineStoreEnabled: boolean;

    // Financial
    taxRate: number; // as a percentage, e.g., 10 for 10%
    currency: {
        symbol: string; // e.g., '$'
        code: string; // e.g., 'USD'
        position: 'before' | 'after';
    };

    // Receipt
    receiptMessage: string; // "Thank you for your purchase!"

    // Inventory
    lowStockThreshold: number; // Default reorder point if not set on product
    skuPrefix: string; // e.g., 'SP-'

    // POS
    enableStoreCredit: boolean;
    paymentMethods: { id: string; name: string; }[];
    supplierPaymentMethods: { id: string; name: string; }[];

    // Accounting Mappings
    taxAccountId?: string;
    revenueAccountId?: string;
    cogsAccountId?: string;
    inventoryAccountId?: string;
    cashAccountId?: string;
    arAccountId?: string;
    apAccountId?: string;

    // Integrations
    lencoPublicKey?: string; // Merchant's own public key for direct settlement
}

// --- Accounting Types ---

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
    id: string;
    name: string;
    number: string; // e.g., '1010'
    type: AccountType;
    // Special sub-type for automatic transaction mapping
    subType?: 'cash' | 'accounts_receivable' | 'inventory' | 'accounts_payable' | 'sales_tax_payable' | 'sales_revenue' | 'cogs' | 'store_credit_payable' | 'inventory_adjustment';
    balance: number;
    isDebitNormal: boolean; // true for assets, expenses. false for liability, equity, revenue
    description: string;
}

export interface JournalEntryLine {
    accountId: string;
    type: 'debit' | 'credit';
    amount: number;
    accountName: string; // denormalized for display
}

export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    lines: JournalEntryLine[];
    source: {
        type: 'sale' | 'purchase' | 'manual' | 'payment';
        id?: string; // e.g., sale.transactionId or po.id
    };
    reference?: string;
}

export interface SupplierPayment {
    id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string; // e.g., check number
}

export interface SupplierInvoice {
    id: string;
    invoiceNumber: string; // From the supplier
    supplierId: string;
    supplierName: string;
    purchaseOrderId: string;
    poNumber: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    amountPaid: number;
    status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
    payments: SupplierPayment[];
}

export interface Expense {
    id: string;
    date: string;
    description: string;
    amount: number;
    expenseAccountId: string;
    expenseAccountName: string;
    paymentAccountId: string;
    paymentAccountName: string;
    category?: string;
    reference?: string;
    createdBy: string;
    createdAt: string;
}


export interface RecurringExpense {
    id: string;
    description: string;
    amount: number;
    expenseAccountId: string;
    expenseAccountName: string;
    paymentAccountId: string;
    paymentAccountName: string;
    category?: string;
    reference?: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: string;
    nextRunDate: string;
    status: 'active' | 'paused' | 'cancelled';
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface FinancialSummary {
    summary: {
        inventoryValue: number;
        accountsReceivable: number;
        accountsPayable: number;
        storeCreditValue: number;
        cashBalance: number;
        totalAssets: number;
        totalLiabilities: number;
        equity: number;
    };
    period: {
        revenue: number;
        cogs: number;
        expenses: number;
        grossProfit: number;
        netIncome: number;
    };
    checks: {
        arMatch: boolean;
        apMatch: boolean;
        inventoryMatch: boolean;
        storeCreditMatch: boolean;
        hasProductsMissingCost: boolean;
        productsMissingCostCount: number;
        isTaxRatioSkewed: boolean;
    };
}

export interface Announcement {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    senderName?: string;
    type?: string;
    isRead?: boolean;
    link?: string;
}

export interface MarketplaceRequest {
    id: string;
    customerName: string;
    customerEmail: string;
    query: string;
    targetPrice: number;
    status: 'open' | 'matched' | 'completed' | 'cancelled';
    createdAt: string;
    offers?: MarketplaceOffer[];
}

export interface MarketplaceOffer {
    id: string;
    requestId: string;
    storeId: string;
    storeName: string;
    storePhone?: string;
    storeEmail?: string;
    storeAddress?: string;
    productId?: string;
    sellerPrice: number;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
}

// --- System Types ---

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    details: string; // e.g., "Product: 'Coffee Mug' (SKU: 12345)"
    storeId?: string; // tenant scope
}


export interface Courier {
    id: string;
    company_name: string;
    contact_details?: string;
    receipt_details?: string;
    isActive: boolean;
    created_at?: string;
}

export interface Bus {
    id: string;
    driver_name: string;
    vehicle_name?: string;
    number_plate: string;
    contact_phone?: string;
    isActive: boolean;
    created_at?: string;
}

export interface Shipment {
    id: string;
    tracking_number: string;
    method: 'courier' | 'bus';
    courier_id?: string;
    bus_id?: string;
    sale_id?: string;
    status: 'pending' | 'confirmed' | 'shipped' | 'in_transit' | 'delivered' | 'failed' | 'returned';
    recipient_name?: string;
    recipient_phone?: string;
    recipient_address?: string;
    destination?: string;
    shipping_cost: number;
    image_urls?: string[];
    notes?: string;
    created_at: string;
    updated_at: string;
    store_id: string;
}

// --- WhatsApp Integration ---

export interface WhatsAppConfig {
    store_id: string;
    phone_number_id: string;
    business_account_id?: string;
    webhook_verify_token: string;
    is_enabled: boolean;
    auto_reply_enabled: boolean;
    business_hours?: {
        start: string;
        end: string;
        timezone: string;
        days: number[]; // 0-6 (Sun-Sat)
    };
    away_message?: string;
    display_phone_number?: string;
    greeting_message?: string;
}

export interface WhatsAppConversation {
    id: string;
    store_id: string;
    customer_phone: string;
    customer_name?: string;
    customer_id?: string;
    status: 'active' | 'closed' | 'escalated';
    last_message_at: string;
    created_at: string;
    metadata?: any;
    unreadCount?: number; // UI helper
}

export interface WhatsAppMessage {
    id: string;
    conversation_id: string;
    store_id: string;
    direction: 'inbound' | 'outbound';
    message_type: 'text' | 'image' | 'document' | 'interactive' | 'template';
    content: string;
    media_url?: string;
    whatsapp_message_id?: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    is_ai_generated: boolean;
    created_at: string;
}


// --- Superadmin Dashboard Types ---

export interface RevenueSummary {
    totalAmount: number;
    count: number;
    byMonth: { month: string; amount: number; count: number; }[];
    growthPercentage?: number;
}

export interface StoreStats {
    total: number;
    active: number;
    trial: number;
    inactive: number;
}

export interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: any; // Using any for ReactNode/Component to avoid complex imports here
    action: () => void;
    color: string;
}

// --- Dashboard Customization Types ---

export interface DashboardCardConfig {
    id: string;
    visible: boolean;
    order: number;
    label: string;
}

export interface DashboardConfig {
    cards: DashboardCardConfig[];
}
