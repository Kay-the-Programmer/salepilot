import React, { useMemo, useState } from 'react';
import { Product, PurchaseOrder, Supplier } from '../../types';
import { orderMessage, orderWhatsAppLink } from './placeOrders';
import { useToast } from '../../contexts/ToastContext';

/**
 * Send a purchase order to its supplier: one tap opens WhatsApp with the order
 * written out. A supplier with no usable phone number gets "Copy order"
 * instead, to paste wherever they are reached.
 */
const SendOrderButtons: React.FC<{
    po: PurchaseOrder;
    suppliers: Supplier[];
    products?: Product[];
    storeName?: string;
    compact?: boolean;
}> = ({ po, suppliers, products, storeName, compact }) => {
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    const supplier = suppliers.find(s => s.id === po.supplierId);
    const units = useMemo(() => {
        const m: Record<string, 'unit' | 'kg'> = {};
        (products || []).forEach(p => { m[p.id] = p.unitOfMeasure === 'kg' ? 'kg' : 'unit'; });
        return m;
    }, [products]);
    const link = orderWhatsAppLink(po, supplier, storeName, units);

    const copy = async () => {
        const text = orderMessage(po, storeName, units);
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('Could not copy — select the order and copy it by hand.', 'error');
        }
    };

    const pad = compact ? '8px 14px' : '12px 18px';
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {link && (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="crm-btn crm-btn--primary"
                    style={{ padding: pad, background: '#1f9d55', borderColor: '#1f9d55', textDecoration: 'none' }}
                    aria-label={`Send ${po.poNumber} to ${po.supplierName || 'the supplier'} on WhatsApp`}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z" /></svg>
                    Send on WhatsApp
                </a>
            )}
            <button
                type="button"
                className={link ? 'crm-btn crm-btn--ghost' : 'crm-btn crm-btn--outline'}
                style={{ padding: pad }}
                onClick={copy}
                title={link ? 'Copy the order text' : `${po.supplierName || 'This supplier'} has no phone number on file`}
            >
                {copied ? 'Copied ✓' : 'Copy order'}
            </button>
        </div>
    );
};

export default SendOrderButtons;
