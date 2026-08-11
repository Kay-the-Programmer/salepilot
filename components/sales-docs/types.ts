/** Shapes returned by /api/sales-documents. */

export type DocType = 'quotation' | 'invoice';

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
