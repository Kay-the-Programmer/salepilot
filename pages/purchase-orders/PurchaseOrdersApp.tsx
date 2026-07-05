import React, { useState, useEffect, useRef, Suspense } from 'react';
import type { PurchaseOrder, POItem, Product, Category, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { hasModule, MODULES } from '../../utils/entitlements';
import StandaloneShell from '../../components/standalone/StandaloneShell';
import { computePoTotals, newPoIdentifiers } from '../../components/purchase-orders/poModel';
import { num } from '../../components/crm/crmModel';
import { useConfirm } from '../../components/ui/useConfirm';
import { getOrderLists, saveOrderList, deleteOrderList, type QuickItem, type QuickList } from '../../services/orderListsService';
import { api } from '../../services/api';
import '../accounting/accounting.css';

const PremiumUpgradeModal = React.lazy(() => import('../../components/ui/PremiumUpgradeModal'));

interface PurchaseOrdersAppProps {
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  categories: Category[];
  storeSettings: StoreSettings;
  onSaveProduct: (product: Product | Omit<Product, 'id'>) => Promise<Product>;
  showSnackbar?: (message: string, type?: any) => void;
  /** Rendered inside the Purchase Orders hub (a section of ProcureApp) rather
   *  than as its own standalone app — skip the StandaloneShell chrome. */
  embedded?: boolean;
  /** Create a purchase order from an order list — routed to the hub's single
   *  PO manager (the Orders section), so there is no duplicate PO surface. */
  onCreatePurchaseOrder?: (po: PurchaseOrder) => void;
}

/* ---- localStorage-backed quick lists (no supplier / no product needed) ---- */
const lsKey = (storeId?: string) => `sp_quicklists_${storeId || 'default'}`;
const loadLists = (storeId?: string): QuickList[] => {
  try { return JSON.parse(localStorage.getItem(lsKey(storeId)) || '[]'); } catch { return []; }
};
const saveLists = (storeId: string | undefined, lists: QuickList[]) => {
  try { localStorage.setItem(lsKey(storeId), JSON.stringify(lists)); } catch { /* ignore */ }
};

const PurchaseOrdersApp: React.FC<PurchaseOrdersAppProps> = ({ products, categories, storeSettings, onSaveProduct, showSnackbar, embedded = false, onCreatePurchaseOrder }) => {
  const storeId = storeSettings?.storeId;
  const fmt = (n: number) => formatCurrency(n, storeSettings);
  const importUnlocked = hasModule(storeSettings, MODULES.QUICK_IMPORT);
  const { confirm, confirmDialog } = useConfirm();

  const [lists, setLists] = useState<QuickList[]>(() => loadLists(storeId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // new-item inline form
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  const persist = (next: QuickList[]) => { setLists(next); saveLists(storeId, next); };

  // Debounced per-list upserts so rapid edits (typing a title, ticking items)
  // collapse into one DB write; deletes fire immediately. Offline writes are
  // transparently queued and replayed by the api layer.
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scheduleSave = (list: QuickList) => {
    const timers = saveTimers.current;
    if (timers[list.id]) clearTimeout(timers[list.id]);
    timers[list.id] = setTimeout(() => {
      delete timers[list.id];
      saveOrderList(list).catch(() => { /* offline → already queued */ });
    }, 600);
  };
  const removeRemote = (id: string) => {
    const timers = saveTimers.current;
    if (timers[id]) { clearTimeout(timers[id]); delete timers[id]; }
    deleteOrderList(id).catch(() => { /* offline → already queued */ });
  };

  // Load lists from the database on mount, reconciling with the local cache and
  // migrating any pre-existing local-only lists up to the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const server = await getOrderLists();
        if (cancelled || !Array.isArray(server)) return;
        const local = loadLists(storeId);
        const localById = new Map(local.map((l) => [l.id, l]));
        // The export-to-PO marker is client-side only — overlay it onto server
        // rows so the duplicate-export guard survives reloads even if the
        // backend drops the extra fields.
        const serverKept = server.map((s) => {
          const mine = localById.get(s.id);
          return mine?.exportedPoNumber && !s.exportedPoNumber
            ? { ...s, exportedAt: mine.exportedAt, exportedPoNumber: mine.exportedPoNumber }
            : s;
        });
        const serverIds = new Set(server.map((l) => l.id));
        const localOnly = local.filter((l) => !serverIds.has(l.id));
        localOnly.forEach((l) => { saveOrderList(l).catch(() => { /* queued if offline */ }); });
        const merged = [...localOnly, ...serverKept].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (!cancelled) { setLists(merged); saveLists(storeId, merged); }
      } catch { /* offline / fetch failed → keep the cached lists already in state */ }
    })();
    return () => { cancelled = true; };
  }, [storeId]);

  const selected = lists.find((l) => l.id === selectedId) || null;
  const listTotal = (l: QuickList) => l.items.reduce((a, i) => a + i.price * i.quantity, 0);

  const addList = () => {
    const l: QuickList = { id: `ql_${Date.now()}`, title: `Order list ${lists.length + 1}`, items: [], createdAt: Date.now() };
    persist([l, ...lists]); setSelectedId(l.id);
    saveOrderList(l).catch(() => { /* offline → queued */ });
  };
  const deleteList = (id: string) => {
    persist(lists.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
    removeRemote(id);
  };
  const renameList = (id: string, title: string) => {
    let updated: QuickList | undefined;
    const next = lists.map((l) => { if (l.id !== id) return l; updated = { ...l, title }; return updated; });
    persist(next);
    if (updated) scheduleSave(updated);
  };
  const updateList = (id: string, fn: (l: QuickList) => QuickList) => {
    let updated: QuickList | undefined;
    const next = lists.map((l) => { if (l.id !== id) return l; updated = fn(l); return updated; });
    persist(next);
    if (updated) scheduleSave(updated);
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !itemName.trim()) return;
    const item: QuickItem = { id: `qi_${Date.now()}`, name: itemName.trim(), quantity: Math.max(1, parseInt(itemQty) || 1), price: parseFloat(itemPrice) || 0, checked: false };
    updateList(selected.id, (l) => ({ ...l, items: [...l.items, item] }));
    setItemName(''); setItemQty('1'); setItemPrice('');
  };
  const toggleItem = (iid: string) => selected && updateList(selected.id, (l) => ({ ...l, items: l.items.map((i) => (i.id === iid ? { ...i, checked: !i.checked } : i)) }));
  const deleteItem = (iid: string) => selected && updateList(selected.id, (l) => ({ ...l, items: l.items.filter((i) => i.id !== iid) }));

  // The backend requires a category on every product, but checklist lines are
  // free text — imported items land in "Uncategorized" (found or created on
  // demand) so the user can re-file them later. Deliberately NOT the store's
  // first category: categories can carry revenue/COGS account mappings, and
  // dumping imports into an arbitrary one would mispost their accounting.
  const importCategoryIdRef = useRef<string | null>(null);
  const resolveImportCategoryId = async (): Promise<string | null> => {
    if (importCategoryIdRef.current) return importCategoryIdRef.current;
    const findUncategorized = (list: Category[]) => list.find((c) => c.name.trim().toLowerCase() === 'uncategorized');
    let category = findUncategorized(categories);
    if (!category) {
      // The prop can be stale (a previous import may have created the category
      // without a full refetch) — check the server before creating.
      try {
        const server = await api.get<Category[]>('/categories');
        if (Array.isArray(server)) category = findUncategorized(server);
      } catch { /* offline → fall through */ }
    }
    if (!category) {
      try {
        const created = await api.post<Category & { offline?: boolean }>('/categories', { name: 'Uncategorized', parentId: null, attributes: [] });
        if (created?.id && !created.offline) category = created;
      } catch { /* fall through */ }
    }
    const id = category?.id ?? categories[0]?.id ?? null;
    if (id) importCategoryIdRef.current = id;
    return id;
  };

  const importToInventory = async () => {
    if (!selected || selected.items.length === 0) return;
    if (!importUnlocked) { setUpgradeOpen(true); return; }
    setImporting(true);
    try {
      const categoryId = await resolveImportCategoryId();
      if (!categoryId) {
        showSnackbar?.('Couldn’t prepare a category for the imported items. Check your connection and try again.', 'error');
        return;
      }
      // Skip items already in the catalogue (matched by name) so re-importing a
      // list never creates duplicate products or phantom stock.
      const existingNames = new Set(products.map((p) => p.name.trim().toLowerCase()));
      let count = 0;
      let skipped = 0;
      for (const it of selected.items) {
        const key = it.name.trim().toLowerCase();
        if (existingNames.has(key)) { skipped++; continue; }
        await onSaveProduct({
          name: it.name,
          description: 'Imported from order checklist',
          sku: `QL-${Date.now().toString().slice(-5)}-${count}`,
          categoryId,
          price: it.price,
          costPrice: it.price,
          stock: it.quantity,
          imageUrls: [],
          status: 'active',
        } as Omit<Product, 'id'>);
        existingNames.add(key);
        count++;
      }
      updateList(selected.id, (l) => ({ ...l, importedAt: Date.now() }));
      showSnackbar?.(
        skipped > 0
          ? `${count} item${count === 1 ? '' : 's'} imported · ${skipped} already in inventory (skipped, no duplicates).`
          : `${count} item${count === 1 ? '' : 's'} imported into your inventory.`,
        'success',
      );
    } catch (e) {
      showSnackbar?.('Failed to import some items. Please try again.', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Export an order list into the hub's Purchase Orders (single PO manager). We
  // build a draft PO from the list's free-text lines and hand it to the Orders
  // section — the user assigns a supplier there and places it. Guarded so the
  // same list can't silently spawn duplicate POs.
  const exportToPurchaseOrder = async () => {
    if (!selected || selected.items.length === 0 || !onCreatePurchaseOrder) return;
    if (selected.exportedPoNumber) {
      const again = await confirm({
        title: 'Already exported',
        message: `This list was exported to purchase order ${selected.exportedPoNumber}. Create another one?`,
        confirmLabel: 'Create another',
      });
      if (!again) return;
    }
    // A purchase order can only carry catalogue products (the backend enforces a
    // product foreign key on PO lines). Match list items by name; unmatched ones
    // must be imported to inventory first — exactly the procedure on this page.
    const byName = new Map(products.filter((p) => p.status === 'active').map((p) => [p.name.trim().toLowerCase(), p]));
    const matched: POItem[] = [];
    const unmatched: string[] = [];
    for (const it of selected.items) {
      const match = byName.get(it.name.trim().toLowerCase());
      if (!match) { unmatched.push(it.name); continue; }
      matched.push({
        productId: match.id,
        productName: match.name,
        sku: match.sku,
        quantity: it.quantity,
        // Missing unit cost falls back to the product's recorded cost so PO
        // figures stay accurate.
        costPrice: it.price > 0 ? it.price : num(match.costPrice),
        receivedQuantity: 0,
      });
    }
    if (matched.length === 0) {
      showSnackbar?.('None of these items are in your inventory yet. Use “Import to inventory” first, then create the purchase order.', 'warning');
      return;
    }
    if (unmatched.length > 0) {
      const ok = await confirm({
        title: `${unmatched.length} item${unmatched.length === 1 ? ' is' : 's are'} not in inventory`,
        message: `Purchase orders can only include products from your inventory. ${matched.length} matched item${matched.length === 1 ? '' : 's'} will be exported; import the rest first to include them (${unmatched.slice(0, 3).join(', ')}${unmatched.length > 3 ? '…' : ''}).`,
        confirmLabel: `Export ${matched.length} matched`,
      });
      if (!ok) return;
    }
    const items = matched;
    const { subtotal, tax, total } = computePoTotals(items, 0, storeSettings.taxRate);
    const po: PurchaseOrder = {
      ...newPoIdentifiers(),
      supplierId: '',
      supplierName: '',
      status: 'draft',
      items,
      notes: `Created from order list “${selected.title}”.`,
      subtotal,
      shippingCost: 0,
      tax,
      total,
    };
    onCreatePurchaseOrder(po);
    updateList(selected.id, (l) => ({ ...l, exportedAt: Date.now(), exportedPoNumber: po.poNumber }));
    showSnackbar?.(
      unmatched.length > 0
        ? `${po.poNumber} drafted with ${items.length} of ${selected.items.length} items — choose a supplier and save it.`
        : `${po.poNumber} drafted — choose a supplier and save it.`,
      'success',
    );
  };

  const body = (
    <>
      <div className="px-4 md:px-8 py-5 max-w-3xl mx-auto w-full pb-28 md:pb-10">
        {/* ============================== QUICK LISTS ============================== */}
        {!selected && (
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
        {selected && (
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

            {/* How it works — the list → inventory → purchase order procedure */}
            <div className="m3-bg-surface-container rounded-2xl p-4 mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wide m3-text-on-surface-variant mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>route</span> How it works
              </p>
              <ol className="space-y-1.5 text-[12px] m3-text-on-surface-variant">
                <li><b className="m3-text-on-surface">1 · Build the list</b> — add each item with its quantity and unit cost; the estimated total updates as you type.</li>
                <li><b className="m3-text-on-surface">2 · Import to inventory</b> (optional) — creates the items as products so stock can be tracked. Items you already stock are skipped, never duplicated.</li>
                <li><b className="m3-text-on-surface">3 · Create purchase order</b> — drafts a PO from the items that are in your inventory (import first so every line is included). Choose a supplier under Orders, place it, then Receive on delivery to update stock.</li>
              </ol>
            </div>

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

            {/* Export the list into the hub's Purchase Orders (single manager) */}
            <button
              onClick={exportToPurchaseOrder}
              disabled={selected.items.length === 0}
              className="w-full mt-3 py-3.5 rounded-xl font-semibold active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 border m3-border-primary m3-text-primary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>shopping_cart_checkout</span>
              {selected.exportedPoNumber ? 'Create another purchase order' : 'Create purchase order'}
            </button>
            {selected.exportedPoNumber ? (
              <p className="text-[11px] m3-text-primary text-center mt-2 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                Exported to {selected.exportedPoNumber}
              </p>
            ) : (
              <p className="text-[11px] m3-text-on-surface-variant text-center mt-2">
                Drafts a purchase order from items in your inventory — choose a supplier under Orders and place it.
              </p>
            )}
          </div>
        )}
      </div>

      {confirmDialog}

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
    </>
  );

  // Embedded inside the Purchase Orders hub: the ProcureShell provides the
  // chrome, so render just the content (scoped for the M3 tokens + scroll).
  if (embedded) {
    return <div className="sp-assistant sp-books h-full min-h-0 overflow-y-auto sp-scroll">{body}</div>;
  }

  return (
    <StandaloneShell title="Purchase Orders" scopeClass="sp-books">
      {body}
    </StandaloneShell>
  );
};

export default PurchaseOrdersApp;
