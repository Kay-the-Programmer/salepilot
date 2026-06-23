import React, { useEffect, useMemo, useState } from 'react';
import { Supplier, Product, PurchaseOrder, POItem, StoreSettings } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import { num, formatMoney, formatDate, parseApiDate } from '../crm/crmModel';
import { poStatus, OPEN_STATUSES, generateReorderDrafts, ReorderDraft } from './procureModel';
import ProcureOrderForm from './ProcureOrderForm';
import ProcureOrderReceive from './ProcureOrderReceive';
import ProcureOrderDetail from './ProcureOrderDetail';
import { useConfirm } from '../ui/useConfirm';

interface ProcureOrdersProps {
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
    storeSettings: StoreSettings;
    onSave: (po: PurchaseOrder) => void;
    onDelete: (poId: string) => void;
    onReceiveItems: (poId: string, items: { productId: string; quantity: number }[]) => void;
    showSnackbar: (message: string, type?: any) => void;
    /** Supplier id to pre-open the create form with (from "Place Order"). */
    draftSupplierId?: string | null;
    onConsumeDraft?: () => void;
    /** Signal from the dashboard to auto-generate reorder drafts. */
    autoGenerate?: boolean;
    onConsumeAutoGenerate?: () => void;
    /** Auto-reorder is a premium add-on. */
    autoReorderEntitled?: boolean;
    onRequireUpgrade?: () => void;
}

type Filter = 'all' | 'open' | 'received' | 'canceled';
const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'received', label: 'Received' },
    { id: 'canceled', label: 'Canceled' },
];

export const ProcureOrders: React.FC<ProcureOrdersProps> = ({
    purchaseOrders, suppliers, products, storeSettings, onSave, onDelete, onReceiveItems, showSnackbar,
    draftSupplierId, onConsumeDraft, autoGenerate, onConsumeAutoGenerate, autoReorderEntitled = false, onRequireUpgrade,
}) => {
    const [view, setView] = useState<'list' | 'form' | 'suggest' | 'detail'>('list');
    const [editing, setEditing] = useState<PurchaseOrder | null>(null);
    const [createSupplierId, setCreateSupplierId] = useState<string | undefined>(undefined);
    const [formItems, setFormItems] = useState<POItem[] | undefined>(undefined);
    const [drafts, setDrafts] = useState<ReorderDraft[]>([]);
    const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
    const [detailPo, setDetailPo] = useState<PurchaseOrder | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const { confirm, confirmDialog } = useConfirm();

    // Keep the open detail in sync with refreshed data (after receive / status change).
    useEffect(() => {
        setDetailPo(prev => (prev ? (purchaseOrders.find(p => p.id === prev.id) ?? null) : prev));
    }, [purchaseOrders]);

    const autoGenerateOrders = () => {
        const generated = generateReorderDrafts(products, suppliers, storeSettings);
        if (generated.length === 0) {
            showSnackbar('All stock is above its reorder point — nothing to reorder.', 'info');
            return;
        }
        if (generated.length === 1) {
            openDraft(generated[0]);
            return;
        }
        setDrafts(generated);
        setView('suggest');
    };

    const openDraft = (d: ReorderDraft) => {
        setEditing(null);
        setCreateSupplierId(d.supplierId);
        setFormItems(d.items);
        setView('form');
    };

    // Pre-open the create form when arriving from a supplier's "Place Order".
    useEffect(() => {
        if (draftSupplierId) {
            setEditing(null);
            setCreateSupplierId(draftSupplierId);
            setFormItems(undefined);
            setView('form');
            onConsumeDraft?.();
        }
    }, [draftSupplierId, onConsumeDraft]);

    // Auto-generate reorder drafts when triggered from the dashboard.
    useEffect(() => {
        if (autoGenerate) {
            if (autoReorderEntitled) autoGenerateOrders(); else onRequireUpgrade?.();
            onConsumeAutoGenerate?.();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoGenerate]);

    const visible = useMemo(() => {
        const list = purchaseOrders.filter(po => {
            if (filter === 'open') return OPEN_STATUSES.includes(po.status);
            if (filter === 'received') return po.status === 'received';
            if (filter === 'canceled') return po.status === 'canceled';
            return true;
        });
        return [...list].sort((a, b) => (parseApiDate(b.createdAt)?.getTime() ?? 0) - (parseApiDate(a.createdAt)?.getTime() ?? 0));
    }, [purchaseOrders, filter]);

    const openCreate = () => { setEditing(null); setCreateSupplierId(undefined); setFormItems(undefined); setView('form'); };
    const openEdit = (po: PurchaseOrder) => {
        if (po.status === 'received') { showSnackbar('A fully received order can no longer be edited.', 'info'); return; }
        setEditing(po); setCreateSupplierId(undefined); setFormItems(undefined); setView('form');
    };
    const openDetail = (po: PurchaseOrder) => { setDetailPo(po); setView('detail'); };
    const handleSave = (po: PurchaseOrder) => { onSave(po); setFormItems(undefined); setView(detailPo ? 'detail' : 'list'); setEditing(null); };
    const handleDelete = async (po: PurchaseOrder) => {
        const ok = await confirm({
            title: `Delete ${po.poNumber}?`,
            message: 'This permanently removes the purchase order. This cannot be undone.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        onDelete(po.id);
        if (detailPo?.id === po.id) { setDetailPo(null); setView('list'); }
    };
    const updateStatus = (status: PurchaseOrder['status']) => {
        if (!detailPo) return;
        const updated: PurchaseOrder = {
            ...detailPo,
            status,
            orderedAt: status === 'ordered' ? (detailPo.orderedAt || new Date().toISOString()) : detailPo.orderedAt,
        };
        setDetailPo(updated); // optimistic; the sync effect refreshes from the server
        onSave(updated);
    };

    if (view === 'detail' && detailPo) {
        return (
            <>
                <ProcureOrderDetail
                    po={detailPo}
                    storeSettings={storeSettings}
                    onBack={() => { setDetailPo(null); setView('list'); }}
                    onEdit={() => openEdit(detailPo)}
                    onReceive={() => setReceivePo(detailPo)}
                    onUpdateStatus={updateStatus}
                    onDelete={() => handleDelete(detailPo)}
                />
                {receivePo && (
                    <ProcureOrderReceive
                        isOpen={!!receivePo}
                        po={receivePo}
                        storeSettings={storeSettings}
                        onClose={() => setReceivePo(null)}
                        onReceive={items => onReceiveItems(receivePo.id, items)}
                    />
                )}
                {confirmDialog}
            </>
        );
    }

    if (view === 'form') {
        return (
            <ProcureOrderForm
                poToEdit={editing}
                suppliers={suppliers}
                products={products}
                storeSettings={storeSettings}
                initialSupplierId={createSupplierId}
                initialItems={formItems}
                onSave={handleSave}
                onCancel={() => { setView(editing && detailPo?.id === editing.id ? 'detail' : (drafts.length > 1 ? 'suggest' : 'list')); setEditing(null); setFormItems(undefined); }}
                showSnackbar={showSnackbar}
            />
        );
    }

    if (view === 'suggest') {
        return (
            <main className="crm-main crm-section-fade">
                <nav className="crm-crumbs">
                    <button type="button" onClick={() => { setDrafts([]); setView('list'); }}>Orders</button>
                    <Icon name="chevron_right" size={18} />
                    <span className="crm-crumbs__current">Suggested reorders</span>
                </nav>
                <div className="crm-pagehead" style={{ marginBottom: 16 }}>
                    <div>
                        <p className="crm-pagehead__eyebrow">Auto-generated</p>
                        <h2 className="crm-pagehead__title">Suggested Reorders</h2>
                        <p className="crm-pagehead__sub">{drafts.length} draft order{drafts.length === 1 ? '' : 's'} from items at or below their reorder point. Review and place each.</p>
                    </div>
                </div>
                <div className="crm-panel">
                    <div className="proc-list">
                        {drafts.map(d => (
                            <div key={d.supplierId} className="proc-po">
                                <Avatar name={d.supplierName} size={44} square />
                                <div className="proc-po__body">
                                    <p className="proc-po__no">{d.supplierName}</p>
                                    <p className="proc-po__meta">{d.items.length} product{d.items.length === 1 ? '' : 's'} · {d.units} unit{d.units === 1 ? '' : 's'} to reorder</p>
                                </div>
                                <div className="proc-po__right">
                                    <p className="proc-po__total">{formatMoney(d.total, storeSettings)}</p>
                                    <span className="proc-status proc-status--s">Draft</span>
                                </div>
                                <button type="button" className="crm-btn crm-btn--primary" style={{ padding: '10px 16px' }} onClick={() => openDraft(d)}>
                                    <Icon name="rate_review" size={18} /> Review &amp; place
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="crm-main crm-section-fade">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
                <div>
                    <h2 className="crm-pagehead__title" style={{ margin: 0 }}>Purchase Orders</h2>
                    <p className="crm-pagehead__sub">{purchaseOrders.length} order{purchaseOrders.length === 1 ? '' : 's'} placed.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        className="crm-btn crm-btn--tonal"
                        type="button"
                        onClick={() => (autoReorderEntitled ? autoGenerateOrders() : onRequireUpgrade?.())}
                        title={autoReorderEntitled ? 'Generate orders from low-stock items' : 'Auto-reorder is a premium add-on'}
                    >
                        <Icon name={autoReorderEntitled ? 'auto_awesome' : 'lock'} size={20} /> Auto-generate
                        {!autoReorderEntitled && <span className="crm-badge crm-badge--gold" style={{ marginLeft: 4, padding: '2px 8px' }}>Premium</span>}
                    </button>
                    <button className="crm-btn crm-btn--primary" type="button" onClick={openCreate}>
                        <Icon name="add" size={20} /> New Purchase Order
                    </button>
                </div>
            </div>

            <div className="crm-chips" style={{ marginBottom: 16 }}>
                {FILTERS.map(f => (
                    <button key={f.id} type="button" className={`crm-chip${filter === f.id ? ' is-active' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
                ))}
            </div>

            <div className="crm-panel">
                {visible.length === 0 ? (
                    <div className="crm-empty" style={{ padding: '48px 16px' }}>
                        <Icon name="receipt_long" size={40} />
                        <p className="crm-empty__title">No purchase orders</p>
                        <p className="crm-empty__text">Create one to start ordering stock from your suppliers.</p>
                        <button className="crm-btn crm-btn--primary" type="button" onClick={openCreate} style={{ marginTop: 8 }}>
                            <Icon name="add" size={20} /> New Purchase Order
                        </button>
                    </div>
                ) : (
                    <div className="proc-list">
                        {visible.map(po => {
                            const st = poStatus(po.status);
                            const itemCount = (po.items || []).reduce((n, it) => n + num(it.quantity), 0);
                            const canReceive = OPEN_STATUSES.includes(po.status) && po.status !== 'draft';
                            return (
                                <div key={po.id} className="proc-po">
                                    <button type="button" className="proc-po__icon" onClick={() => openDetail(po)} aria-label={`View ${po.poNumber}`} style={{ border: 'none', cursor: 'pointer' }}>
                                        <Icon name="inventory_2" size={22} />
                                    </button>
                                    <button type="button" className="proc-po__body" onClick={() => openDetail(po)} style={{ border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                                        <p className="proc-po__no">{po.poNumber}</p>
                                        <p className="proc-po__meta">{po.supplierName || 'Supplier'} · {itemCount} unit{itemCount === 1 ? '' : 's'} · {formatDate(po.createdAt)}</p>
                                    </button>
                                    <div className="proc-po__right">
                                        <p className="proc-po__total">{formatMoney(po.total, storeSettings)}</p>
                                        <span className={`proc-status proc-status--${st.tone}`}>{st.label}</span>
                                    </div>
                                    <div className="proc-card-actions">
                                        {canReceive && (
                                            <button type="button" className="crm-iconbtn" title="Receive stock" aria-label="Receive stock" style={{ color: 'var(--c-primary)' }} onClick={() => setReceivePo(po)}>
                                                <Icon name="inventory" size={20} />
                                            </button>
                                        )}
                                        {po.status !== 'received' && (
                                            <button type="button" className="crm-iconbtn" title="Edit" aria-label="Edit order" onClick={() => openEdit(po)}>
                                                <Icon name="edit" size={20} />
                                            </button>
                                        )}
                                        <button type="button" className="crm-iconbtn" title="Delete" aria-label="Delete order" style={{ color: 'var(--c-error)' }} onClick={() => handleDelete(po)}>
                                            <Icon name="delete" size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <button className="crm-fab" type="button" aria-label="New purchase order" onClick={openCreate}>
                <Icon name="add" size={26} />
            </button>

            {receivePo && (
                <ProcureOrderReceive
                    isOpen={!!receivePo}
                    po={receivePo}
                    storeSettings={storeSettings}
                    onClose={() => setReceivePo(null)}
                    onReceive={items => onReceiveItems(receivePo.id, items)}
                />
            )}

            {confirmDialog}
        </main>
    );
};

export default ProcureOrders;
