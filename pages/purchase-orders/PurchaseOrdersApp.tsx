import React, { useState, Suspense } from 'react';
import type { PurchaseOrder, Product, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { hasModule, MODULES } from '../../utils/entitlements';
import StandaloneShell from '../../components/standalone/StandaloneShell';
import '../accounting/accounting.css';

const PremiumUpgradeModal = React.lazy(() => import('../../components/ui/PremiumUpgradeModal'));

type Tab = 'lists' | 'orders';

interface QuickItem { id: string; name: string; quantity: number; price: number; checked: boolean }
interface QuickList { id: string; title: string; items: QuickItem[]; createdAt: number; importedAt?: number }

interface PurchaseOrdersAppProps {
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  storeSettings: StoreSettings;
  onSaveProduct: (product: Product | Omit<Product, 'id'>) => Promise<Product>;
  showSnackbar?: (message: string, type?: any) => void;
}

/* ---- localStorage-backed quick lists (no supplier / no product needed) ---- */
const lsKey = (storeId?: string) => `sp_quicklists_${storeId || 'default'}`;
const loadLists = (storeId?: string): QuickList[] => {
  try { return JSON.parse(localStorage.getItem(lsKey(storeId)) || '[]'); } catch { return []; }
};
const saveLists = (storeId: string | undefined, lists: QuickList[]) => {
  try { localStorage.setItem(lsKey(storeId), JSON.stringify(lists)); } catch { /* ignore */ }
};

const PO_STATUS_TONE: Record<PurchaseOrder['status'], string> = {
  draft: 'm3-bg-surface-high m3-text-on-surface-variant',
  ordered: 'm3-bg-secondary-fixed m3-text-secondary',
  partially_received: 'm3-bg-tertiary-fixed m3-text-tertiary',
  received: 'm3-bg-primary-container m3-text-on-primary-container',
  canceled: 'm3-bg-error-container m3-text-error',
};

const PurchaseOrdersApp: React.FC<PurchaseOrdersAppProps> = ({ purchaseOrders, storeSettings, onSaveProduct, showSnackbar }) => {
  const storeId = storeSettings?.storeId;
  const fmt = (n: number) => formatCurrency(n, storeSettings);
  const importUnlocked = hasModule(storeSettings, MODULES.QUICK_IMPORT);

  const [tab, setTab] = useState<Tab>('lists');
  const [lists, setLists] = useState<QuickList[]>(() => loadLists(storeId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // new-item inline form
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  const persist = (next: QuickList[]) => { setLists(next); saveLists(storeId, next); };
  const selected = lists.find((l) => l.id === selectedId) || null;
  const listTotal = (l: QuickList) => l.items.reduce((a, i) => a + i.price * i.quantity, 0);

  const addList = () => {
    const l: QuickList = { id: `ql_${Date.now()}`, title: `Order list ${lists.length + 1}`, items: [], createdAt: Date.now() };
    persist([l, ...lists]); setSelectedId(l.id);
  };
  const deleteList = (id: string) => { persist(lists.filter((l) => l.id !== id)); if (selectedId === id) setSelectedId(null); };
  const renameList = (id: string, title: string) => persist(lists.map((l) => (l.id === id ? { ...l, title } : l)));
  const updateList = (id: string, fn: (l: QuickList) => QuickList) => persist(lists.map((l) => (l.id === id ? fn(l) : l)));

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !itemName.trim()) return;
    const item: QuickItem = { id: `qi_${Date.now()}`, name: itemName.trim(), quantity: Math.max(1, parseInt(itemQty) || 1), price: parseFloat(itemPrice) || 0, checked: false };
    updateList(selected.id, (l) => ({ ...l, items: [...l.items, item] }));
    setItemName(''); setItemQty('1'); setItemPrice('');
  };
  const toggleItem = (iid: string) => selected && updateList(selected.id, (l) => ({ ...l, items: l.items.map((i) => (i.id === iid ? { ...i, checked: !i.checked } : i)) }));
  const deleteItem = (iid: string) => selected && updateList(selected.id, (l) => ({ ...l, items: l.items.filter((i) => i.id !== iid) }));

  const importToInventory = async () => {
    if (!selected || selected.items.length === 0) return;
    if (!importUnlocked) { setUpgradeOpen(true); return; }
    setImporting(true);
    try {
      let count = 0;
      for (const it of selected.items) {
        await onSaveProduct({
          name: it.name,
          description: 'Imported from order checklist',
          sku: `QL-${Date.now().toString().slice(-5)}-${count}`,
          price: it.price,
          costPrice: it.price,
          stock: it.quantity,
          imageUrls: [],
          status: 'active',
        } as Omit<Product, 'id'>);
        count++;
      }
      updateList(selected.id, (l) => ({ ...l, importedAt: Date.now() }));
      showSnackbar?.(`${count} item${count === 1 ? '' : 's'} imported into your inventory.`, 'success');
    } catch (e) {
      showSnackbar?.('Failed to import some items. Please try again.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const navItems = [
    { icon: 'checklist', label: 'Quick Lists', active: tab === 'lists', onClick: () => { setTab('lists'); } },
    { icon: 'receipt_long', label: 'Orders', active: tab === 'orders', onClick: () => { setTab('orders'); setSelectedId(null); } },
  ];

  return (
    <StandaloneShell icon="shopping_cart_checkout" title="Purchase Orders" scopeClass="sp-books" navItems={navItems}>
      <div className="px-4 md:px-8 py-5 max-w-3xl mx-auto w-full pb-28 md:pb-10">
        {/* Desktop tabs */}
        <div className="hidden md:flex justify-center mb-6">
          <div className="seg">
            {navItems.map((n) => (
              <button key={n.label} className={n.active ? 'is-active' : ''} onClick={n.onClick}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================== QUICK LISTS ============================== */}
        {tab === 'lists' && !selected && (
          <div className="sp-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl md:text-[28px] font-bold m3-text-on-surface">Quick order lists</h2>
                <p className="text-sm m3-text-on-surface-variant">Jot down what to order — no supplier or catalogue needed.</p>
              </div>
              <button onClick={addList} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold m3-bg-primary m3-text-on-primary shadow active:scale-95 transition">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span><span className="hidden sm:inline">New list</span>
              </button>
            </div>
            {lists.length === 0 ? (
              <div className="text-center py-16 m3-text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: 44 }}>checklist</span>
                <p className="mt-3 text-sm">No lists yet. Create one and start adding items to order.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lists.map((l) => {
                  const done = l.items.filter((i) => i.checked).length;
                  return (
                    <button key={l.id} onClick={() => setSelectedId(l.id)} className="w-full text-left m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm p-4 flex items-center gap-3 active:scale-[0.99] transition sp-fade-in">
                      <span className="w-11 h-11 rounded-lg m3-bg-primary-fixed m3-text-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined">checklist</span></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold m3-text-on-surface truncate">{l.title}</p>
                        <p className="text-[11px] m3-text-on-surface-variant">{l.items.length} item{l.items.length === 1 ? '' : 's'} · {done}/{l.items.length} checked{l.importedAt ? ' · imported' : ''}</p>
                      </div>
                      <span className="text-sm font-bold m3-text-on-surface">{fmt(listTotal(l))}</span>
                      <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 20 }}>chevron_right</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick list detail */}
        {tab === 'lists' && selected && (
          <div className="sp-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setSelectedId(null)} className="w-9 h-9 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span></button>
              <input value={selected.title} onChange={(e) => renameList(selected.id, e.target.value)} className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xl font-bold m3-text-on-surface" />
              <button onClick={() => deleteList(selected.id)} className="w-9 h-9 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-text-error hover:m3-bg-error-container transition"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span></button>
            </div>

            {/* items */}
            <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden mb-4">
              {selected.items.length === 0 ? (
                <p className="p-6 text-center text-sm m3-text-on-surface-variant">No items yet. Add the things you want to order below.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--m3-outline-variant)' }}>
                  {selected.items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3 p-3">
                      <button onClick={() => toggleItem(it.id)} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${it.checked ? 'm3-bg-primary m3-border-primary m3-text-on-primary' : 'm3-border-outline-variant'}`}>
                        {it.checked && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium m3-text-on-surface truncate ${it.checked ? 'line-through opacity-60' : ''}`}>{it.name}</p>
                        <p className="text-[11px] m3-text-on-surface-variant">{it.quantity} × {fmt(it.price)}</p>
                      </div>
                      <span className="text-sm font-semibold m3-text-on-surface">{fmt(it.price * it.quantity)}</span>
                      <button onClick={() => deleteItem(it.id)} className="m3-text-on-surface-variant hover:m3-text-error transition"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* add item */}
            <form onSubmit={addItem} className="m3-bg-surface-container rounded-2xl p-3 mb-4 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px]">
                <label className="text-[11px] font-semibold uppercase tracking-wide m3-text-on-surface-variant">Item</label>
                <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Sugar 1kg" className="mt-1 w-full h-11 px-3 rounded-xl m3-bg-surface-lowest border m3-border-outline-variant outline-none text-sm m3-text-on-surface m3-placeholder" />
              </div>
              <div className="w-16">
                <label className="text-[11px] font-semibold uppercase tracking-wide m3-text-on-surface-variant">Qty</label>
                <input value={itemQty} onChange={(e) => setItemQty(e.target.value)} type="number" min="1" className="mt-1 w-full h-11 px-2 rounded-xl m3-bg-surface-lowest border m3-border-outline-variant outline-none text-sm m3-text-on-surface text-center" />
              </div>
              <div className="w-24">
                <label className="text-[11px] font-semibold uppercase tracking-wide m3-text-on-surface-variant">Price</label>
                <input value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="mt-1 w-full h-11 px-2 rounded-xl m3-bg-surface-lowest border m3-border-outline-variant outline-none text-sm m3-text-on-surface" />
              </div>
              <button type="submit" className="h-11 px-4 rounded-xl m3-bg-primary m3-text-on-primary font-semibold active:scale-95 transition flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>Add</button>
            </form>

            {/* total + import */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm m3-text-on-surface-variant">Estimated total</span>
              <span className="text-xl font-bold m3-text-on-surface">{fmt(listTotal(selected))}</span>
            </div>
            <button
              onClick={importToInventory}
              disabled={importing || selected.items.length === 0}
              className={`w-full py-3.5 rounded-xl font-semibold active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 ${importUnlocked ? 'm3-bg-primary m3-text-on-primary' : 'm3-bg-secondary-fixed m3-text-secondary'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{importUnlocked ? 'inventory' : 'lock'}</span>
              {importing ? 'Importing…' : 'Import to inventory'}
              {!importUnlocked && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full m3-bg-secondary m3-text-on-secondary">Premium</span>}
            </button>
            <p className="text-[11px] m3-text-on-surface-variant text-center mt-2">
              {importUnlocked ? 'Adds every item as a product in your inventory.' : 'Unlock to turn any list into inventory products automatically.'}
            </p>
          </div>
        )}

        {/* ============================== ORDERS ============================== */}
        {tab === 'orders' && (
          <div className="sp-fade-in">
            <h2 className="text-2xl md:text-[28px] font-bold m3-text-on-surface mb-1">Purchase orders</h2>
            <p className="text-sm m3-text-on-surface-variant mb-4">Formal orders raised to your suppliers.</p>
            {purchaseOrders.length === 0 ? (
              <div className="text-center py-16 m3-text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: 44 }}>receipt_long</span>
                <p className="mt-3 text-sm">No purchase orders yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[...purchaseOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((po) => (
                  <button key={po.id} onClick={() => setDetailPO(po)} className="w-full text-left m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm p-4 active:scale-[0.99] transition">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-bold m3-text-on-surface truncate">{po.poNumber}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${PO_STATUS_TONE[po.status]}`}>{po.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[12px] m3-text-on-surface-variant">{po.supplierName || 'No supplier'} · {po.items.length} item{po.items.length === 1 ? '' : 's'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] m3-text-on-surface-variant">{new Date(po.createdAt).toLocaleDateString()}</span>
                      <span className="text-sm font-bold m3-text-on-surface">{fmt(po.total)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PO detail modal */}
      {detailPO && (
        <div className="sp-assistant fixed inset-0 z-[120] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 sp-fade-in" onClick={() => setDetailPO(null)} />
          <div className="relative w-full md:max-w-lg m3-bg-surface rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col sp-fade-in">
            <div className="flex items-center justify-between px-5 h-14 border-b m3-border-outline-variant">
              <h3 className="font-bold m3-text-on-surface">{detailPO.poNumber}</h3>
              <button onClick={() => setDetailPO(null)} className="w-9 h-9 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span></button>
            </div>
            <div className="p-5 overflow-y-auto sp-scroll">
              <p className="text-sm m3-text-on-surface-variant mb-3">{detailPO.supplierName || 'No supplier'} · <span className="capitalize">{detailPO.status.replace('_', ' ')}</span></p>
              <div className="divide-y" style={{ borderColor: 'var(--m3-outline-variant)' }}>
                {detailPO.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0"><p className="text-sm font-medium m3-text-on-surface truncate">{it.productName}</p><p className="text-[11px] m3-text-on-surface-variant">{it.quantity} × {fmt(it.costPrice)}</p></div>
                    <span className="text-sm font-semibold m3-text-on-surface">{fmt(it.quantity * it.costPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t m3-border-outline-variant">
                <span className="font-semibold m3-text-on-surface">Total</span>
                <span className="text-lg font-bold m3-text-primary">{fmt(detailPO.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {upgradeOpen && (
        <Suspense fallback={null}>
          <PremiumUpgradeModal
            isOpen={upgradeOpen}
            onClose={() => setUpgradeOpen(false)}
            title="Unlock Auto-Import to Inventory"
            description="Turn any quick order list into real inventory products in one tap. This is a premium add-on you can unlock for a small monthly fee."
            bullets={[
              'Convert checklist items into products instantly',
              'Carries over quantity and price as cost',
              'Skip manual product entry for bulk restocks',
            ]}
          />
        </Suspense>
      )}
    </StandaloneShell>
  );
};

export default PurchaseOrdersApp;
