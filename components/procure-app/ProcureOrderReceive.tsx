import React, { useEffect, useState } from 'react';
import { PurchaseOrder, StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { num } from '../crm/crmModel';

interface ProcureOrderReceiveProps {
    isOpen: boolean;
    onClose: () => void;
    po: PurchaseOrder;
    onReceive: (receivedItems: { productId: string; quantity: number }[]) => void;
    storeSettings?: StoreSettings | null;
}

/** Receive stock against a PO — M3 styling. */
export const ProcureOrderReceive: React.FC<ProcureOrderReceiveProps> = ({ isOpen, onClose, po, onReceive }) => {
    const [received, setReceived] = useState<{ [key: string]: string }>({});

    useEffect(() => { if (isOpen) setReceived({}); }, [isOpen]);
    if (!isOpen) return null;

    const itemsToReceive = po.items.filter(it => num(it.receivedQuantity) < num(it.quantity));

    const change = (productId: string, value: string, max: number) => {
        const n = parseInt(value, 10);
        if (value === '' || (n >= 0 && n <= max)) setReceived(prev => ({ ...prev, [productId]: value }));
    };
    const receiveAll = () => {
        setReceived(itemsToReceive.reduce((acc, it) => {
            acc[it.productId] = String(num(it.quantity) - num(it.receivedQuantity));
            return acc;
        }, {} as { [key: string]: string }));
    };
    const submit = () => {
        const items = Object.entries(received)
            .map(([productId, q]) => ({ productId, quantity: parseInt(q, 10) }))
            .filter(it => !isNaN(it.quantity) && it.quantity > 0);
        if (items.length > 0) onReceive(items);
        onClose();
    };

    return (
        <div className="crm-modal-backdrop" onClick={onClose}>
            <div className="crm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Receive stock">
                <div className="crm-modal__bar">
                    <button type="button" className="crm-iconbtn" aria-label="Close" onClick={onClose}><Icon name="arrow_back" /></button>
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
                                <button type="button" className="crm-link" onClick={receiveAll}>Receive all remaining</button>
                            </div>
                            {itemsToReceive.map(it => {
                                const remaining = num(it.quantity) - num(it.receivedQuantity);
                                return (
                                    <div key={it.productId} className="po-item" style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <div className="po-item__id">
                                            <span className="po-item__thumb"><Icon name="inventory_2" size={22} /></span>
                                            <div style={{ minWidth: 0 }}>
                                                <p className="po-item__name">{it.productName}</p>
                                                <p className="po-item__sku">{num(it.receivedQuantity)} / {num(it.quantity)} received · {remaining} remaining</p>
                                            </div>
                                        </div>
                                        <label className="po-field">
                                            <span>Receive now</span>
                                            <input
                                                type="number" min={0} max={remaining}
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
                    <button type="button" className="crm-btn crm-btn--ghost" style={{ color: 'var(--c-on-surface-variant)', padding: '12px 22px' }} onClick={onClose}>Cancel</button>
                    {itemsToReceive.length > 0 && (
                        <button type="button" className="crm-btn crm-btn--primary" style={{ padding: '12px 26px' }} onClick={submit}>
                            <Icon name="inventory" size={20} /> Confirm receipt
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcureOrderReceive;
