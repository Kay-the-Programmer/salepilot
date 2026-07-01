import React, { useMemo, useState } from 'react';
import { Supplier, Product, PurchaseOrder, SupplierInvoice, StoreSettings } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import { num, formatMoney } from '../crm/crmModel';
import ProcureSupplierForm from './ProcureSupplierForm';
import ProcureSupplierProfile from './ProcureSupplierProfile';
import { OPEN_STATUSES } from './procureModel';
import { useConfirm } from '../ui/useConfirm';

interface ProcureSuppliersProps {
    suppliers: Supplier[];
    products: Product[];
    purchaseOrders: PurchaseOrder[];
    supplierInvoices: SupplierInvoice[];
    storeSettings?: StoreSettings | null;
    onSaveSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (supplierId: string) => void;
    onPlaceOrder: (supplierId?: string) => void;
}

/**
 * Supplier directory + profile — redesigned in the M3 design while preserving
 * the original logic: search by name/email/contact, a profile detail view,
 * add/edit through the M3 ProcureSupplierForm, and delete.
 */
export const ProcureSuppliers: React.FC<ProcureSuppliersProps> = ({
    suppliers, products, purchaseOrders, supplierInvoices, storeSettings, onSaveSupplier, onDeleteSupplier, onPlaceOrder,
}) => {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Supplier | null>(null);
    const { confirm, confirmDialog } = useConfirm();

    const statsById = useMemo(() => {
        const map = new Map<string, { orders: number; openOrders: number; spend: number; products: number }>();
        for (const s of suppliers) map.set(s.id, { orders: 0, openOrders: 0, spend: 0, products: 0 });
        for (const po of purchaseOrders) {
            const e = po.supplierId && map.get(po.supplierId);
            if (!e) continue;
            e.orders += 1;
            e.spend += num(po.total);
            if (OPEN_STATUSES.includes(po.status)) e.openOrders += 1;
        }
        for (const p of products) {
            const e = p.supplierId && map.get(p.supplierId);
            if (e) e.products += 1;
        }
        return map;
    }, [suppliers, purchaseOrders, products]);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        const list = !term ? suppliers : suppliers.filter(s =>
            s.name.toLowerCase().includes(term)
            || (s.email?.toLowerCase().includes(term) ?? false)
            || (s.contactPerson?.toLowerCase().includes(term) ?? false));
        return [...list].sort((a, b) => (statsById.get(b.id)?.spend ?? 0) - (statsById.get(a.id)?.spend ?? 0));
    }, [suppliers, search, statsById]);

    const selected = useMemo(() => suppliers.find(s => s.id === selectedId) || null, [suppliers, selectedId]);

    const openAdd = () => { setEditing(null); setFormOpen(true); };
    const openEdit = (s: Supplier) => { setEditing(s); setFormOpen(true); };
    const handleSave = (s: Supplier) => { onSaveSupplier(s); setFormOpen(false); setEditing(null); };
    const handleDelete = async (s: Supplier) => {
        const ok = await confirm({
            title: `Delete ${s.name}?`,
            message: 'This permanently removes the supplier from your directory. This cannot be undone.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        onDeleteSupplier(s.id);
        if (selectedId === s.id) setSelectedId(null);
    };

    // ── Profile detail ──
    if (selected) {
        return (
            <>
                <ProcureSupplierProfile
                    supplier={selected}
                    products={products}
                    purchaseOrders={purchaseOrders}
                    supplierInvoices={supplierInvoices}
                    storeSettings={storeSettings}
                    onBack={() => setSelectedId(null)}
                    onEdit={() => openEdit(selected)}
                    onDelete={() => handleDelete(selected)}
                    onPlaceOrder={() => onPlaceOrder(selected.id)}
                />
                <ProcureSupplierForm
                    isOpen={formOpen}
                    onClose={() => { setFormOpen(false); setEditing(null); }}
                    onSave={handleSave}
                    supplierToEdit={editing}
                />
                {confirmDialog}
            </>
        );
    }

    // ── Directory ──
    return (
        <main className="crm-main crm-section-fade">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
                <div>
                    <h2 className="crm-pagehead__title" style={{ margin: 0 }}>Suppliers</h2>
                    <p className="crm-pagehead__sub">{suppliers.length} supplier{suppliers.length === 1 ? '' : 's'} in your directory.</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="crm-search" style={{ maxWidth: 360, flex: 1, minWidth: 200 }}>
                        <Icon name="search" size={22} />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, contact or email..." />
                    </div>
                    <button className="crm-btn crm-btn--primary" type="button" onClick={openAdd}>
                        <Icon name="add_business" size={20} /> Add Supplier
                    </button>
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="crm-empty">
                    <Icon name="local_shipping" size={44} />
                    <p className="crm-empty__title">No suppliers found</p>
                    <p className="crm-empty__text">{search ? `Nothing matches "${search}".` : 'Add your first supplier to start procurement.'}</p>
                    {!search && (
                        <button className="crm-btn crm-btn--primary" type="button" onClick={openAdd} style={{ marginTop: 8 }}>
                            <Icon name="add_business" size={20} /> Add Supplier
                        </button>
                    )}
                </div>
            ) : (
                <div className="crm-custgrid">
                    {visible.map(s => {
                        const st = statsById.get(s.id) || { orders: 0, openOrders: 0, spend: 0, products: 0 };
                        return (
                            <div key={s.id} className="crm-custcard" role="button" tabIndex={0} onClick={() => setSelectedId(s.id)}
                                onKeyDown={e => { if (e.key === 'Enter') setSelectedId(s.id); }}>
                                <div className="crm-custcard__top">
                                    <div className="crm-custcard__id">
                                        <Avatar name={s.name} size={56} square />
                                        <div style={{ minWidth: 0 }}>
                                            <h3 className="crm-custcard__name">{s.name}</h3>
                                            <p className="crm-custcard__since">{s.contactPerson || 'No contact person'}</p>
                                        </div>
                                    </div>
                                    {s.paymentTerms ? <span className="crm-badge crm-badge--silver">{s.paymentTerms}</span> : null}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                    <span className="proc-contact"><Icon name="call" size={18} /> {s.phone || '—'}</span>
                                    <span className="proc-contact"><Icon name="mail" size={18} /> {s.email || '—'}</span>
                                </div>

                                <div className="crm-custcard__foot">
                                    <div>
                                        <p className="crm-custcard__spendlabel">Total Ordered</p>
                                        <p className="crm-custcard__spend" style={{ fontSize: 22 }}>{formatMoney(st.spend, storeSettings)}</p>
                                        <p className="proc-substat">{st.orders} order{st.orders === 1 ? '' : 's'}{st.openOrders > 0 ? ` · ${st.openOrders} open` : ''}{st.products > 0 ? ` · ${st.products} product${st.products === 1 ? '' : 's'}` : ''}</p>
                                    </div>
                                    <div className="proc-card-actions">
                                        <button type="button" className="crm-iconbtn" aria-label="Edit supplier" title="Edit" onClick={e => { e.stopPropagation(); openEdit(s); }}>
                                            <Icon name="edit" size={20} />
                                        </button>
                                        <button type="button" className="crm-iconbtn" aria-label="Delete supplier" title="Delete" style={{ color: 'var(--c-error)' }} onClick={e => { e.stopPropagation(); handleDelete(s); }}>
                                            <Icon name="delete" size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ProcureSupplierForm
                isOpen={formOpen}
                onClose={() => { setFormOpen(false); setEditing(null); }}
                onSave={handleSave}
                supplierToEdit={editing}
            />

            {confirmDialog}
        </main>
    );
};

export default ProcureSuppliers;
