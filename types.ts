


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
    /**
     * How this product is taxed. Zero-rated and exempt both attract no tax
     * but are reported differently on a VAT return, so they are kept apart.
     * Absent means standard-rated.
     */
    taxClass?: 'standard' | 'zero' | 'exempt';
    costPrice?: number;
    stock: number;
    /**
     * Does this item hold stock?
     *
     * False for made-to-order menu items: a kitchen can keep serving steak
     * without anyone counting steaks, so the till must never refuse the sale
     * and the sale must never decrement anything. Bottled drinks stay tracked.
     *
     * Absent means tracked — which is what every product did before the field
     * existed, and what a shop expects.
     */
    trackStock?: boolean;
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
    // Carton / bulk pricing fields
    cartonPrice?: number;     // Total price of one carton/box
    unitsPerCarton?: number;  // Number of sellable units per carton
    cartonsReceived?: number; // Total cartons received (for reference)
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
    referralCode?: string;
    discountBalance?: number;
}

/**
 * A line on the current sale.
 *
 * `trackStock` is carried on the line, not looked up from the product, because
 * the cart is restored from localStorage with no catalog beside it — and a
 * restored made-to-order line that lost the flag would be clamped to a stock
 * figure of zero and silently vanish.
 */
export interface CartItem {
    productId: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    stock: number; // To check against when increasing quantity
    /** False for a made-to-order item: no stock ceiling, nothing decremented. */
    trackStock?: boolean;
    unitOfMeasure?: 'unit' | 'kg';
    returnedQuantity?: number;
    costPrice?: number; // Cost of the item at the time of sale
    /**
     * Carried from the product so the till taxes the line the way the server
     * will. Without it a mixed basket is quoted at the standard rate and
     * charged at another.
     */
    taxClass?: 'standard' | 'zero' | 'exempt';
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

/**
 * Tax charged on one sale, split by the class it was charged under.
 *
 * Frozen when the sale is made. A receipt is a record of what was charged, so
 * reprinting one must not re-derive it against a rate or a classification that
 * has changed since.
 */
export interface TaxClassTotal {
    taxClass: 'standard' | 'zero' | 'exempt';
    ratePct: number;
    net: number;
    tax: number;
}

export interface Sale {
    transactionId: string;
    timestamp: string;
    cart: CartItem[];
    total: number;
    subtotal: number;
    tax: number;
    /**
     * The tax split by class, as charged. Absent on sales made before this
     * existed, and on any whose tax could not be explained by the current
     * classes — a breakdown that does not sum to the tax on the receipt
     * would be worse than none.
     */
    taxBreakdown?: TaxClassTotal[] | null;
    /**
     * A manager's single-use approval, when the sale needs one — a discount
     * past the store limit, say. Sent with the sale and spent by the server;
     * never stored on it.
     */
    overrideId?: string;
    discount: number;
    storeCreditUsed?: number;
    refundStatus: 'none' | 'partially_refunded' | 'fully_refunded' | 'returned' | 'partially_returned';
    customerId?: string;
    customerName?: string;
    /** Phone number collected at the POS; the backend auto-saves it to the customer record. */
    customerPhone?: string;
    /**
     * The open bill this sale settled ("Table 4"), copied onto the sale so a
     * receipt and the sales history can still name it once the bill row has
     * been closed and forgotten. Descriptive only.
     */
    tabLabel?: string | null;
    /** Cashier who processed the sale — shown on the receipt ("Attended by"). */
    attendedBy?: string;
    attendedById?: string;
    totalRefunded?: number;
    originalTotal?: number;
    // New fields for invoicing
    paymentStatus: 'paid' | 'unpaid' | 'partially_paid';
    fulfillmentStatus?: 'pending' | 'accepted' | 'fulfilled' | 'shipped' | 'cancelled';
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

/**
 * A category doubles as a MENU SECTION in hospitality mode, which is why it
 * carries a display order: a menu reads Starters → Desserts, never
 * alphabetically. Retail stores leave sortOrder at 0 and keep sorting by name.
 */
export interface Category {
    id: string;
    name: string;
    parentId: string | null;
    attributes: CustomAttribute[];
    revenueAccountId?: string;
    cogsAccountId?: string;
    /** Position on the menu. Lower comes first; 0 falls back to name order. */
    sortOrder?: number;
    /** Kept off the till — a seasonal section, or one not being served today. */
    isHidden?: boolean;
}

// --- Open bills (restaurants, bars, cafes) ---

/**
 * A line on an open bill. `name` and `price` are SNAPSHOTS taken when the item
 * was ordered, not a live read of the product — a menu reprice at seven must
 * not rewrite the bill a table has been drinking against since five.
 */
export interface OpenTabItem {
    id: string;
    tabId: string;
    productId: string | null;
    name: string;
    sku?: string | null;
    price: number;
    costPrice?: number;
    quantity: number;
    unitOfMeasure?: 'unit' | 'kg' | null;
    taxClass?: 'standard' | 'zero' | 'exempt' | null;
    trackStock?: boolean;
    addedBy?: string | null;
    createdAt?: string;
}

/**
 * A bill that stays open while a table keeps ordering.
 *
 * `status` carries the concurrency: 'settling' means a till has claimed this
 * bill and is posting its sale, which is what stops two tills charging the same
 * table twice.
 */
export interface OpenTab {
    id: string;
    label: string;
    status: 'open' | 'settling' | 'closed' | 'void';
    customerId?: string | null;
    note?: string | null;
    openedBy?: string | null;
    openedByName?: string | null;
    openedAt: string;
    updatedAt?: string;
    closedAt?: string | null;
    closedBy?: string | null;
    saleId?: string | null;
    voidReason?: string | null;
    items: OpenTabItem[];
    /** Line count, for the bills list. */
    itemCount: number;
    /**
     * Sum of the frozen line prices — a running figure for the list, NOT a
     * quote. Discounts and tax are applied by the sale, server-side.
     */
    subtotal: number;
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
    /** Optional: an order can be raised before the supplier is decided. */
    supplierId?: string | null;
    supplierName: string; // denormalized for easy display ("Unassigned supplier" when none)
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
}

/**
 * A bank account a customer can pay into. Saved once on the store and reused on
 * every invoice, so the details are never retyped.
 */
export interface BankAccount {
    id: string;
    // Printed on invoices in exactly this order.
    bankName: string;
    swiftCode?: string;
    bankAddress?: string;
    accountName: string;
    accountNumber: string;
    branchName?: string;
    branchSortCode?: string;
    /** Off for an account kept on file but not offered to customers. */
    showOnInvoices?: boolean;
}

/** Invoice bank-detail rows, in the order they print. */
export const BANK_ACCOUNT_FIELDS: { key: keyof BankAccount; label: string }[] = [
    { key: 'bankName', label: 'Bank Name' },
    { key: 'swiftCode', label: 'Swift Code' },
    { key: 'bankAddress', label: 'Bank Address' },
    { key: 'accountName', label: 'Account Name' },
    { key: 'accountNumber', label: 'Account Number' },
    { key: 'branchName', label: 'Branch Name' },
    { key: 'branchSortCode', label: 'Branch Sort Code' },
];

export interface StoreSettings {
    storeId: string;
    // Store Information
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    /** Company logo (store_settings.logo_url) — heads quotations and invoices. */
    logoUrl?: string | null;
    /** Taxpayer ID printed on receipts, delivery notes, quotations and invoices. */
    tpin?: string | null;
    /** Trading line under the business name, e.g. "Office Furniture & Stationery". */
    businessTagline?: string | null;
    /**
     * How the store identifies itself in an SMS. Every store shares one
     * Africa's Talking account, so the display name is prepended to every
     * outgoing message server-side — a customer has no other way to tell who
     * texted them.
     */
    smsDisplayName?: string | null;
    /**
     * An approved alphanumeric sender id. Read-only to the store: it has to be
     * registered with MTN/Airtel/Zamtel and is approved by a superadmin, so a
     * shop cannot claim another business's brand. When set, the display-name
     * prefix is dropped — the handset already shows the name.
     */
    smsSenderId?: string | null;
    /** The sender id the store has asked for, waiting on approval. */
    smsSenderIdRequested?: string | null;
    smsSenderIdStatus?: 'none' | 'pending' | 'approved' | 'rejected';

    // Financial
    taxRate: number; // as a percentage, e.g., 10 for 10%
    /**
     * Shelf prices already contain tax, so it is extracted from the price
     * rather than added at the till. Off by default, which is the behaviour
     * every store had before the setting existed.
     */
    pricesIncludeTax?: boolean;
    /**
     * When a cashier must fetch a manager. A missing or null entry means that
     * action never needs one, which is how every store behaved before
     * approvals existed.
     */
    overrideThresholds?: {
        discountPercent?: number | null;
        refundAmount?: number | null;
        payOutAmount?: number | null;
        noSale?: boolean | null;
    } | null;
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
    /**
     * Which till this store runs. 'hospitality' (restaurant, bar, cafe) sells
     * from a menu onto open bills; 'retail' is the product-grid till every
     * store had before the field existed, and remains the default. Set from the
     * business type at registration, changeable in Settings.
     *
     * Read it through `isHospitality()` in utils/hospitality.ts rather than
     * comparing here, so the condition lives in exactly one place.
     */
    businessMode?: 'retail' | 'hospitality';
    /**
     * The business types picked at registration (`stores.business_types`),
     * served alongside the settings because this is the store-shaped object
     * every screen already holds. Used for the venue's own wording — a bar's
     * bills are tabs, a restaurant's are tables.
     */
    businessTypes?: string[] | null;
    /** Printed on invoices under "Payment details". */
    bankAccounts?: BankAccount[];

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
    lencoSecretKey?: string; // Merchant's own secret key for direct settlement

    // Subscription entitlements (modular packaging — see MODULAR_PACKAGING_PLAN.md).
    // Runtime source of truth for which add-on modules/features the store has bought.
    // e.g. 'payment_gateway' unlocks automated mobile-money collection at checkout.
    enabledModules?: string[];
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
    /** Write-only Meta Cloud API token; the backend never echoes it back. */
    access_token?: string;
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
    /** Lifetime cash collected (only payments that were actually paid). */
    totalAmount: number;
    count: number;
    byMonth: { month: string; amount: number; count: number; }[];
    growthPercentage?: number;
    /** Cash collected in the current calendar month. */
    thisMonthCollected?: number;
    /** Monthly Recurring Revenue: sum of plan prices for active, plan-based subscriptions. */
    mrr?: number;
    /** Annual Recurring Revenue (mrr × 12). */
    arr?: number;
    /** Active subscriptions counted from a known plan (contribute to MRR). */
    activeSubscriptions?: number;
    /** Active subscriptions with no recognised plan (e.g. manual extensions) — excluded from MRR. */
    activeWithoutPlan?: number;
    trialCount?: number;
    pastDueCount?: number;
    canceledCount?: number;
    currency?: string;
}

export interface StoreStats {
    total: number;
    active: number;
    trial: number;
    inactive: number;
    pastDue?: number;
    canceled?: number;
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
