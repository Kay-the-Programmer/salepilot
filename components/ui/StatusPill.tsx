import React from 'react';

export type PillTone = 'primary' | 'success' | 'amber' | 'danger' | 'neutral';

const TONE_CLASS: Record<PillTone, string> = {
    primary: 'bg-sp-green-soft text-sp-green-dark',
    success: 'bg-success-muted text-success',
    amber: 'bg-sp-amber-soft text-sp-amber',
    danger: 'bg-danger-muted text-danger',
    neutral: 'bg-surface-variant text-brand-text-muted',
};

/** Store lifecycle status → pill tone + label. */
export const storeStatusMeta: Record<string, { tone: PillTone; label: string }> = {
    active: { tone: 'success', label: 'Active' },
    inactive: { tone: 'neutral', label: 'Inactive' },
    suspended: { tone: 'danger', label: 'Suspended' },
};

/** Subscription status → pill tone + label. */
export const subscriptionStatusMeta: Record<string, { tone: PillTone; label: string }> = {
    trial: { tone: 'amber', label: 'Trial' },
    active: { tone: 'success', label: 'Active' },
    past_due: { tone: 'danger', label: 'Past Due' },
    canceled: { tone: 'neutral', label: 'Canceled' },
};

/** Order fulfillment status → pill tone + label. */
export const fulfillmentStatusMeta: Record<string, { tone: PillTone; label: string }> = {
    pending: { tone: 'amber', label: 'Pending' },
    processing: { tone: 'amber', label: 'Processing' },
    shipped: { tone: 'primary', label: 'Shipped' },
    fulfilled: { tone: 'success', label: 'Fulfilled' },
    delivered: { tone: 'success', label: 'Delivered' },
    completed: { tone: 'success', label: 'Completed' },
    cancelled: { tone: 'danger', label: 'Cancelled' },
    returned: { tone: 'danger', label: 'Returned' },
    refunded: { tone: 'danger', label: 'Refunded' },
};

/** Payment status → pill tone + label. */
export const paymentStatusMeta: Record<string, { tone: PillTone; label: string }> = {
    paid: { tone: 'success', label: 'Paid' },
    partially_paid: { tone: 'primary', label: 'Partially Paid' },
    pending: { tone: 'amber', label: 'Pending' },
    overdue: { tone: 'danger', label: 'Overdue' },
    unpaid: { tone: 'danger', label: 'Unpaid' },
};

/** Purchase-order status → pill tone + label. */
export const purchaseOrderStatusMeta: Record<string, { tone: PillTone; label: string }> = {
    draft: { tone: 'neutral', label: 'Draft' },
    ordered: { tone: 'primary', label: 'Ordered' },
    partially_received: { tone: 'amber', label: 'Partially Received' },
    received: { tone: 'success', label: 'Received' },
    canceled: { tone: 'danger', label: 'Canceled' },
};

/** Solid dot colour per tone (for badges with a status dot indicator). */
const TONE_DOT: Record<PillTone, string> = {
    primary: 'bg-sp-green',
    success: 'bg-success',
    amber: 'bg-sp-amber',
    danger: 'bg-danger',
    neutral: 'bg-brand-text-muted',
};
export const toneDot = (tone: PillTone) => TONE_DOT[tone];

/** Lookup helpers with a graceful fallback for unknown values. */
export const storeMeta = (s?: string) => storeStatusMeta[s ?? ''] ?? { tone: 'neutral' as PillTone, label: s ?? '—' };
export const subscriptionMeta = (s?: string) => subscriptionStatusMeta[s ?? ''] ?? { tone: 'neutral' as PillTone, label: s ?? '—' };
export const fulfillmentMeta = (s?: string) => fulfillmentStatusMeta[s ?? ''] ?? { tone: 'neutral' as PillTone, label: s ?? '—' };
export const paymentMeta = (s?: string) => paymentStatusMeta[s ?? ''] ?? { tone: 'neutral' as PillTone, label: s ?? '—' };
export const purchaseOrderMeta = (s?: string) => purchaseOrderStatusMeta[s ?? ''] ?? { tone: 'neutral' as PillTone, label: s ?? '—' };

/** Warm bg+text classes for a tone — for badges that keep their own markup/sizing. */
export const toneClass = (tone: PillTone) => TONE_CLASS[tone];

/**
 * Warm "Modern Tactile" status pill — replaces the per-page `getStatusStyle` /
 * `getStatusConfig` / `getStatusColor` colour-map functions that were copied
 * across the admin/orders/customers pages.
 */
export function StatusPill({ tone, children, icon, className = '' }: {
    tone: PillTone;
    children?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${TONE_CLASS[tone]} ${className}`}>
            {icon}
            {children}
        </span>
    );
}

export default StatusPill;
