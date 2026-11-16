import { Sale, StoreSettings } from '../types';
import { formatCurrency } from './currency';
import { receiptCode } from './receiptEscPos';
import { waChatLink } from './whatsapp';

/** The receipt as a short WhatsApp message: items, totals, how it was paid. */
export const receiptWhatsAppText = (sale: Sale, settings: StoreSettings): string => {
    const m = (n: number | undefined) => formatCurrency(Number(n) || 0, settings);
    const when = new Date(sale.timestamp).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const lines: string[] = [
        `*${settings?.name || 'Receipt'}*`,
        `Receipt ${receiptCode(sale.transactionId)} · ${when}`,
        '',
        ...(sale.cart || []).map(i => `${i.quantity} × ${i.name} — ${m(i.price * i.quantity)}`),
        '',
    ];
    if (Number(sale.discount) > 0) lines.push(`Discount: −${m(sale.discount)}`);
    if (Number(sale.tax) > 0) lines.push(`VAT: ${m(sale.tax)}`);
    lines.push(`*Total: ${m(sale.total)}*`);
    const paid = (sale.payments || []).map(p => `${p.method} ${m(p.amount)}`).join(', ');
    if (paid) lines.push(`Paid: ${paid}`);
    if (Number(sale.changeDue) > 0) lines.push(`Change: ${m(sale.changeDue)}`);
    if (sale.paymentStatus !== 'paid') lines.push(`Balance due: ${m(Number(sale.total) - Number(sale.amountPaid || 0))}`);
    if (sale.attendedBy) lines.push(`Served by ${sale.attendedBy}`);
    lines.push('', 'Thank you for shopping with us!');
    return lines.join('\n');
};

/** wa.me link with the receipt, or null when the sale has no usable phone. */
export const receiptWhatsAppLink = (sale: Sale, settings: StoreSettings, phone = sale.customerPhone): string | null =>
    waChatLink(phone, receiptWhatsAppText(sale, settings));
