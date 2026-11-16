import React, { useState } from 'react';
import { Sale, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { waChatLink } from '../../utils/whatsapp';

type Status = NonNullable<Sale['fulfillmentStatus']>;

/**
 * The next step for an online order, one tap each:
 *   New → Accept or Cancel → Ready → Shipped
 * After each step the shop can tell the customer on WhatsApp with the
 * update already written out.
 */

const customerPhone = (o: Sale) => o.customerDetails?.phone || o.customerPhone;
const customerName = (o: Sale) => o.customerDetails?.name || o.customerName || 'there';
const ref = (o: Sale) => o.transactionId.slice(-6).toUpperCase();

export const orderUpdateMessage = (o: Sale, status: Status, settings: StoreSettings): string => {
    const shop = settings?.name || 'our shop';
    const first = customerName(o).split(' ')[0];
    const total = formatCurrency(o.total, settings);
    switch (status) {
        case 'accepted': return `Hello ${first}, ${shop} has received your order #${ref(o)} (${total}). We are getting it ready and will let you know when it is ready.`;
        case 'fulfilled': return `Hello ${first}, your order #${ref(o)} from ${shop} is ready.${o.paymentStatus !== 'paid' ? ` Amount to pay: ${total}.` : ''}`;
        case 'shipped': return `Hello ${first}, your order #${ref(o)} from ${shop} is on its way.`;
        case 'cancelled': return `Hello ${first}, sorry: ${shop} could not complete your order #${ref(o)} and it has been cancelled.${o.amountPaid ? ' We will arrange your refund.' : ''}`;
        default: return `Hello ${first}, an update on your order #${ref(o)} from ${shop}.`;
    }
};

const btn = 'h-11 px-5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50';

const OrderActions: React.FC<{
    order: Sale;
    storeSettings: StoreSettings;
    onUpdateStatus: (orderId: string, status: Status) => Promise<boolean | void> | void;
    vertical?: boolean;
}> = ({ order, storeSettings, onUpdateStatus, vertical }) => {
    const [busy, setBusy] = useState(false);
    const [told, setTold] = useState<Status | null>(null);
    const status = order.fulfillmentStatus || 'pending';
    const phone = customerPhone(order);

    const go = async (s: Status) => {
        setBusy(true);
        try {
            const r = await onUpdateStatus(order.transactionId, s);
            if (r !== false) setTold(s);
        } finally {
            setBusy(false);
        }
    };

    const primary = `${btn} bg-sp-navy hover:bg-sp-navy-light text-white`;
    const ghost = `${btn} border border-red-500/40 text-red-600 dark:text-red-400`;
    const wa = told && phone ? waChatLink(phone, orderUpdateMessage(order, told, storeSettings)) : null;

    return (
        <div className={`flex ${vertical ? 'flex-col' : 'flex-col sm:flex-row'} gap-3`}>
            {status === 'pending' && (
                <>
                    <button disabled={busy} className={primary} onClick={() => go('accepted')}>Accept order</button>
                    <button disabled={busy} className={ghost} onClick={() => go('cancelled')}>Cancel</button>
                </>
            )}
            {status === 'accepted' && (
                <>
                    <button disabled={busy} className={primary} onClick={() => go('fulfilled')}>Mark ready</button>
                    <button disabled={busy} className={ghost} onClick={() => go('cancelled')}>Cancel</button>
                </>
            )}
            {status === 'fulfilled' && (
                <button disabled={busy} className={primary} onClick={() => go('shipped')}>Mark shipped</button>
            )}
            {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                    className={`${btn} bg-[#25D366] hover:brightness-95 text-white`}
                    onClick={() => setTold(null)}>
                    Tell {customerName(order).split(' ')[0]} on WhatsApp
                </a>
            )}
        </div>
    );
};

export default OrderActions;
