import React, { useEffect, useRef, useState } from 'react';
import { PurchaseOrder, StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { num } from '../crm/crmModel';

interface ProcureOrderReceiveProps {
    isOpen: boolean;
    onClose: () => void;
    po: PurchaseOrder;
    /** May return a promise; the dialog stays open, locked, until it settles. */
    onReceive: (receivedItems: { productId: string; quantity: number }[]) => Promise<unknown> | void;
    storeSettings?: StoreSettings | null;
}

/** Receive stock against a PO — M3 styling. */
export const ProcureOrderReceive: React.FC<ProcureOrderReceiveProps> = ({ isOpen, onClose, po, onReceive }) => {
    const [received, setReceived] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState(false);
    // A ref, not just state: two taps inside one frame both see submitting=false.
    const submittingRef = useRef(false);

    const itemsToReceive = po.items.filter(it => num(it.receivedQuantity) < num(it.quantity));
    // Remaining amounts, at two decimals so weighed goods (2.5 kg) survive.
    const remainingOf = (it: { quantity: unknown; receivedQuantity?: unknown }) =>
        Math.round((num(it.quantity) - num(it.receivedQuantity)) * 100) / 100;
    const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

    const receiveAll = () => {
        setReceived(itemsToReceive.reduce((acc, it) => {
            acc[it.productId] = fmt(remainingOf(it));
            return acc;
        }, {} as { [key: string]: string }));
    };

    // Opens already filled with everything still to come — a full delivery is
    // just Confirm; only a short one needs a number changed.
    useEffect(() => {
        if (isOpen) { receiveAll(); submittingRef.current = false; setSubmitting(false); }
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [isOpen, po.id]);
    if (!isOpen) return null;

    const change = (productId: string, value: string, max: number) => {
        if (!/^\d*(\.\d{0,2})?$/.test(value)) return;
        const n = parseFloat(value);
        if (value === '' || (n >= 0 && n <= max)) setReceived(prev => ({ ...prev, [productId]: value }));
    };
    const submit = async () => {
        if (submittingRef.current) return;
        const items = Object.entries(received)
            .map(([productId, q]) => ({ productId, quantity: Math.round(parseFloat(q) * 100) / 100 }))
            .filter(it => !isNaN(it.quantity) && it.quantity > 0);
        if (items.length === 0) { onClose(); return; }
        submittingRef.current = true;
        setSubmitting(true);
        try {
            await onReceive(items);
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
            onClose();
        }
    };

    return (
        <div className="crm-modal-backdrop" onClick={() => { if (!submitting) onClose(); }}>
            <div className="crm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Receive stock">
                <div className="crm-modal__bar">
                    <button type="button" className="crm-iconbtn" aria-label="Close" disabled={submitting} onClick={onClose}><Icon name="arrow_back" /></button>
                    <div>
                        <h2 className="crm-modal__title">Receive Stock</h2>
                        <p style={{ fontSize: 12, color: 'var(--c-on-surface-variant)', margin: 0 }}>{po.poNumber} · {po.supplierName}</p>
                    </div>
                </div>

                <div className="crm-modal__body">
                    {itemsToReceive.length === 0 ? (
                        <div className="crm-empty" style={{ padding: '32px 16px' }}>
                            <Icon name="task_alt" size={40} />
                            <p className="crm-empty__title">Fully received</p>
                            <p className="crm-empty__text">All items on this order have been received.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" className="crm-link" onClick={receiveAll}>Reset to all remaining</button>
                            </div>
                            {itemsToReceive.map(it => {
                                const remaining = remainingOf(it);
                                return (
                                    <div key={it.productId} className="po-item" style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <div className="po-item__id">
                                            <span className="po-item__thumb"><Icon name="inventory_2" size={22} /></span>
                                            <div style={{ minWidth: 0 }}>
                                                <p className="po-item__name">{it.productName}</p>
                                                <p className="po-item__sku">{fmt(num(it.receivedQuantity))} / {fmt(num(it.quantity))} received · {fmt(remaining)} remaining</p>
                                            </div>
                                        </div>
                                        <label className="po-field">
                                            <span>Receive now</span>
                                            <input
                                                type="text" inputMode="decimal"
                                                value={received[it.productId] ?? ''}
                                                placeholder="0"
                                                onChange={e => change(it.productId, e.target.value, remaining)}
                                            />
                                        </label>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                <div className="crm-modal__foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" className="crm-btn crm-btn--ghost" style={{ color: 'var(--c-on-surface-variant)', padding: '12px 22px' }} disabled={submitting} onClick={onClose}>Cancel</button>
                    {itemsToReceive.length > 0 && (
                        <button type="button" className="crm-btn crm-btn--primary" style={{ padding: '12px 26px', opacity: submitting ? 0.6 : 1 }} disabled={submitting} aria-busy={submitting} onClick={submit}>
                            <Icon name={submitting ? 'hourglass_top' : 'inventory'} size={20} /> {submitting ? 'Receiving…' : 'Confirm receipt'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcureOrderReceive;
