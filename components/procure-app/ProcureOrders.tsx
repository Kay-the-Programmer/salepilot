import React, { useEffect, useMemo, useState } from 'react';
import { Supplier, Product, PurchaseOrder, POItem, StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { num, formatMoney, formatDate, parseApiDate } from '../crm/crmModel';
import { OPEN_STATUSES } from './procureModel';
import PoStatusChip from '../purchase-orders/PoStatusChip';
import ProcureOrderForm from './ProcureOrderForm';
import ProcureOrderReceive from './ProcureOrderReceive';
import ProcureOrderDetail from './ProcureOrderDetail';
import ProcureBuyStock from './ProcureBuyStock';
import ProcureExportPdf from './ProcureExportPdf';
import { downloadPurchaseOrderPdf } from '../purchase-orders/poPdf';
import { useConfirm } from '../ui/useConfirm';
import { useToast } from '../../contexts/ToastContext';

interface ProcureOrdersProps {
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
    storeSettings: StoreSettings;
    /** Resolves false when the save was refused, so the form stays open. */
    onSave: (po: PurchaseOrder) => void | Promise<unknown>;
    onDelete: (poId: string) => void;
    onReceiveItems: (poId: string, items: { productId: string; quantity: number }[]) => Promise<unknown> | void;
    /** Supplier id to pre-open the create form with (from "Place Order"). */
    draftSupplierId?: string | null;
    onConsumeDraft?: () => void;
    /** Signal from the dashboard to auto-generate reorder drafts. */
    autoGenerate?: boolean;
    onConsumeAutoGenerate?: () => void;
    /** Auto-reorder is a premium add-on. */
    /** A PO drafted from an order list — opened in the form so the user assigns
     *  a supplier (required by the backend) before it is first saved. */
    importedDraft?: PurchaseOrder | null;
    onConsumeImportedDraft?: () => void;
    /** Reload orders/products after orders are placed outside onSave. */
    onRefresh?: () => void;
    /** Syncs a product edited from Buy stock (its remembered supplier). */
    onSaveProduct?: (product: Product) => Promise<unknown> | void;
}

type Filter = 'all' | 'drafts' | 'open' | 'received' | 'canceled';
const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'open', label: 'Open' },
    { id: 'received', label: 'Received' },
    { id: 'canceled', label: 'Canceled' },
];

export const ProcureOrders: React.FC<ProcureOrdersProps> = ({
    purchaseOrders, suppliers, products, storeSettings, onSave, onDelete, onReceiveItems, draftSupplierId, onConsumeDraft, autoGenerate, onConsumeAutoGenerate,
    importedDraft, onConsumeImportedDraft, onRefresh, onSaveProduct,
}) => {
    const { showToast } = useToast();
    const [view, setView] = useState<'list' | 'form' | 'buy' | 'detail'>('list');
    // Came back from "Add other products" in Buy stock — return there on cancel.
    const [fromBuy, setFromBuy] = useState(false);
    const [editing, setEditing] = useState<PurchaseOrder | null>(null);
    const [createSupplierId, setCreateSupplierId] = useState<string | undefined>(undefined);
    const [formItems, setFormItems] = useState<POItem[] | undefined>(undefined);
    const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
    // Orders with a receipt in flight. Their Receive buttons stay disabled
    // until the server has answered and the refreshed order is on screen, so
    // the same delivery cannot be booked twice from a stale "open" order.
    const [receivingIds, setReceivingIds] = useState<Set<string>>(new Set());
    const [exportOpen, setExportOpen] = useState(false);
    // One order's PDF at a time; the icon shows it is being built.
    const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
    const downloadPdf = async (po: PurchaseOrder) => {
        if (pdfBusyId) return;
        setPdfBusyId(po.id);
        try { await downloadPurchaseOrderPdf(po, suppliers, storeSettings); }
        catch (err: any) { showToast(err?.message || 'Could not build the PDF.', 'error'); }
        finally { setPdfBusyId(null); }
    };
    const receive = async (poId: string, items: { productId: string; quantity: number }[]) => {
        setReceivingIds(prev => new Set(prev).add(poId));
        try {
            await onReceiveItems(poId, items);
        } finally {
            setReceivingIds(prev => { const next = new Set(prev); next.delete(poId); return next; });
        }
    };
    const [detailPo, setDetailPo] = useState<PurchaseOrder | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const { confirm } = useConfirm();

    // Keep the open detail in sync with refreshed data (after receive / status change).
    useEffect(() => {
        setDetailPo(prev => (prev ? (purchaseOrders.find(p => p.id === prev.id) ?? null) : prev));
    }, [purchaseOrders]);

    // "Buy stock" (and the old Auto-generate entry points) open the one-screen
    // reorder. The quantities come from the server's reorder rule.
    const openBuyStock = () => { setFromBuy(false); setView('buy'); };

    const openInForm = (supplierId: string, items: POItem[]) => {
        setEditing(null);
        setCreateSupplierId(supplierId);
        setFormItems(items);
        setFromBuy(true);
        setView('form');
    };

    // Deep link: /procure/orders?buy=1 (the Inventory low-stock alert).
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('buy')) {
                openBuyStock();
                params.delete('buy');
                const q = params.toString();
                window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : ''));
            }
        } catch { /* no URL access — ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Open a PO drafted from an order list in the form (as an "edit" of the
    // not-yet-saved draft, so its id/number/items/notes carry through). The
    // form requires a supplier before saving — satisfying the backend rule.
    useEffect(() => {
        if (importedDraft) {
            setEditing(importedDraft);
            setCreateSupplierId(undefined);
            setFormItems(undefined);
            setView('form');
            onConsumeImportedDraft?.();
        }
    }, [importedDraft, onConsumeImportedDraft]);

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
            openBuyStock();
            onConsumeAutoGenerate?.();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoGenerate]);

    // Pre-pick whoever the store ordered from most recently on a new order.
    const lastSupplierId = useMemo(() => [...purchaseOrders]
        .filter(po => po.supplierId)
        .sort((a, b) => (parseApiDate(b.createdAt)?.getTime() ?? 0) - (parseApiDate(a.createdAt)?.getTime() ?? 0))[0]?.supplierId,
    [purchaseOrders]);

    const visible = useMemo(() => {
        const list = purchaseOrders.filter(po => {
            if (filter === 'drafts') return po.status === 'draft';
            if (filter === 'open') return OPEN_STATUSES.includes(po.status);
            if (filter === 'received') return po.status === 'received';
            if (filter === 'canceled') return po.status === 'canceled';
            return true;
        });
        return [...list].sort((a, b) => (parseApiDate(b.createdAt)?.getTime() ?? 0) - (parseApiDate(a.createdAt)?.getTime() ?? 0));
    }, [purchaseOrders, filter]);

    const openCreate = () => { setEditing(null); setCreateSupplierId(undefined); setFormItems(undefined); setView('form'); };
    const openEdit = (po: PurchaseOrder) => {
        if (po.status === 'received') { showToast('A fully received order can no longer be edited.', 'info'); return; }
        setEditing(po); setCreateSupplierId(undefined); setFormItems(undefined); setView('form');
    };
    const openDetail = (po: PurchaseOrder) => { setDetailPo(po); setView('detail'); };
    const handleSave = async (po: PurchaseOrder): Promise<boolean> => {
        // Leave the form only once it is saved: a refused save keeps the order as typed.
        const ok = await onSave(po);
        if (ok === false) return false;
        setFormItems(undefined); setFromBuy(false); setView(detailPo ? 'detail' : 'list'); setEditing(null);
        return true;
    };
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
                    receiving={receivingIds.has(detailPo.id)}
                    onDownloadPdf={() => downloadPdf(detailPo)}
                    pdfBusy={pdfBusyId === detailPo.id}
                    onUpdateStatus={updateStatus}
                    onDelete={() => handleDelete(detailPo)}
                    suppliers={suppliers}
                    products={products}
                />
                {receivePo && (
                    <ProcureOrderReceive
                        isOpen={!!receivePo}
                        po={receivePo}
                        storeSettings={storeSettings}
                        onClose={() => setReceivePo(null)}
                        onReceive={items => receive(receivePo.id, items)}
                    />
                )}
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
                lastSupplierId={lastSupplierId ?? undefined}
                onSave={handleSave}
                onCancel={() => { setView(editing && detailPo?.id === editing.id ? 'detail' : (fromBuy ? 'buy' : 'list')); setEditing(null); setFormItems(undefined); setFromBuy(false); }}
            />
        );
    }

    if (view === 'buy') {
        return (
            <ProcureBuyStock
                suppliers={suppliers}
                products={products}
                storeSettings={storeSettings}
                onBack={() => setView('list')}
                onPlaced={() => onRefresh?.()}
                onOpenInForm={openInForm}
                onSaveProduct={onSaveProduct}
            />
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
                        className="crm-btn crm-btn--outline"
                        type="button"
                        onClick={() => setExportOpen(true)}
                        disabled={purchaseOrders.length === 0}
                        title="Download orders, past ones included, as a PDF"
                    >
                        <Icon name="picture_as_pdf" size={20} /> Export PDF
                    </button>
                    <button
                        className="crm-btn crm-btn--tonal"
                        type="button"
                        onClick={openBuyStock}
                        title="Order everything that is running low"
                    >
                        <Icon name="shopping_cart" size={20} /> Buy stock
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
                                        <PoStatusChip status={po.status} />
                                    </div>
                                    <div className="proc-card-actions">
                                        {canReceive && (
                                            <button
                                                type="button"
                                                className="crm-iconbtn"
                                                title={receivingIds.has(po.id) ? 'Receiving…' : 'Receive stock'}
                                                aria-label={receivingIds.has(po.id) ? 'Receiving stock' : 'Receive stock'}
                                                aria-busy={receivingIds.has(po.id)}
                                                disabled={receivingIds.has(po.id)}
                                                style={{ color: 'var(--c-primary)', opacity: receivingIds.has(po.id) ? 0.4 : 1 }}
                                                onClick={() => setReceivePo(po)}
                                            >
                                                <Icon name={receivingIds.has(po.id) ? 'hourglass_top' : 'inventory'} size={20} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="crm-iconbtn"
                                            title="Download PDF"
                                            aria-label={`Download ${po.poNumber} as PDF`}
                                            aria-busy={pdfBusyId === po.id}
                                            disabled={!!pdfBusyId}
                                            style={{ opacity: pdfBusyId && pdfBusyId !== po.id ? 0.4 : 1 }}
                                            onClick={() => downloadPdf(po)}
                                        >
                                            <Icon name={pdfBusyId === po.id ? 'hourglass_top' : 'picture_as_pdf'} size={20} />
                                        </button>
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
                    onReceive={items => receive(receivePo.id, items)}
                />
            )}

            <ProcureExportPdf
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                purchaseOrders={purchaseOrders}
                suppliers={suppliers}
                storeSettings={storeSettings}
                initialStatus={filter}
            />

        </main>
    );
};

export default ProcureOrders;
