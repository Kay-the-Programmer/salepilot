/** Shapes returned by /api/sales-documents. */

export type DocType = 'quotation' | 'invoice' | 'delivery_note' | 'receipt';

/** Tab order and labels for the four document types. */
export const DOC_TYPES: DocType[] = ['quotation', 'invoice', 'delivery_note', 'receipt'];

export const DOC_LABEL: Record<DocType, string> = {
    quotation: 'Quotations',
    invoice: 'Invoices',
    delivery_note: 'Delivery Notes',
    receipt: 'Receipts',
};

export const DOC_SINGULAR: Record<DocType, string> = {
    quotation: 'quotation',
    invoice: 'invoice',
    delivery_note: 'delivery note',
    receipt: 'receipt',
};

export const DOC_ICON: Record<DocType, string> = {
    quotation: 'request_quote',
    invoice: 'receipt_long',
    delivery_note: 'local_shipping',
    receipt: 'payments',
};

/** A delivery note lists goods; a receipt records one amount and has no lines. */
export const hasLineItems = (t: DocType) => t !== 'receipt';
/** Only quotations and invoices carry priced lines and tax. */
export const isPriced = (t: DocType) => t === 'quotation' || t === 'invoice';

export type DocStatus =
    | 'draft'
    | 'sent'
    | 'accepted'
    | 'declined'
    | 'expired'
    | 'converted'
    | 'cancelled';

export interface SalesDocumentItem {
    id?: string;
    productId?: string | null;
    name: string;
    sku?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal?: number;
}

export interface SalesDocument {
    id: string;
    docType: DocType;
    number: string;
    status: DocStatus;
    customerId?: string | null;
    customerName: string;
    customerPhone?: string | null;
    customerEmail?: string | null;
    customerAddress?: string | null;
    issueDate: string;
    /** Expiry for a quotation, due date for an invoice. */
    validUntil?: string | null;
    subtotal: number;
    discount: number;
    tax: number;
    taxRate: number;
    total: number;
    notes?: string | null;
    terms?: string | null;
    sourceDocumentId?: string | null;
    convertedSaleId?: string | null;
    /** Receipts: how the money arrived. */
    paymentMethod?: 'cash' | 'cheque' | string | null;
    paymentReference?: string | null;
    /** Delivery notes: who handed the goods over and who signed for them. */
    deliveredBy?: string | null;
    receivedBy?: string | null;
    createdByName?: string | null;
    createdAt?: string;
    items?: SalesDocumentItem[];
}

/** Which status changes the UI should offer, mirroring the backend's matrix. */
export const NEXT_STATUSES: Record<DocStatus, DocStatus[]> = {
    draft: ['sent', 'cancelled'],
    sent: ['accepted', 'declined', 'expired', 'cancelled'],
    accepted: ['cancelled'],
    declined: ['sent'],
    expired: ['sent'],
    converted: [],
    cancelled: [],
};

export const STATUS_LABEL: Record<DocStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired',
    converted: 'Converted',
    cancelled: 'Cancelled',
};
