import React, { useMemo, useState } from 'react';
import { Category, Product, StoreSettings, User } from '../../types';
import { MenuShell, MenuSection } from './MenuShell';
import MenuImport from './MenuImport';
import { buildMenu, makeSkuMinter, sortSections } from './menuModel';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../ui/useConfirm';
import { Icon } from '../crm/CrmBits';
import '../crm/crm.css';
import './menu.css';

interface MenuAppProps {
    section: MenuSection;
    user: User;
    products: Product[];
    categories: Category[];
    storeSettings: StoreSettings | null;
    /** Reconciles local state for an already-saved product. */
    onSaveProduct: (product: Product | Omit<Product, 'id'>) => Promise<Product>;
    /** Resolves false when the save was refused. */
    onSaveCategory: (category: Category | Omit<Category, 'id'>) => Promise<boolean> | void;
    onDeleteCategory: (categoryId: string) => void;
    onRefresh?: () => void;
    onNavigate: (section: MenuSection) => void;
    onExit: () => void;
    onLogout: () => void;
}

const inputCls =
    'w-full bg-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder-brand-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition';

/**
 * The Menu app: sections and the dishes and drinks in them.
 *
 * It is a restaurant-shaped view of the ordinary catalog, not a second one.
 * Sections ARE categories and items ARE products, which is why every report,
 * every revenue account mapping and the whole stock system keep working
 * untouched — a menu that lived in its own tables would have needed all of that
 * rebuilt, and would have drifted from it within a month.
 *
 * What a venue actually needs that a shop does not is here: a deliberate order
 * (Starters before Desserts), prices editable in one tap on the row, and items
 * that do not count stock.
 */
export const MenuApp: React.FC<MenuAppProps> = ({
    section, user, products, categories, storeSettings,
    onSaveProduct, onSaveCategory, onDeleteCategory, onRefresh,
    onNavigate, onExit, onLogout,
}) => {
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [newSectionName, setNewSectionName] = useState('');
    const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
    const [draft, setDraft] = useState<Record<string, { name: string; price: string }>>({});
    const [busy, setBusy] = useState<string | null>(null);

    const menu = useMemo(() => buildMenu(products, categories), [products, categories]);
    const ordered = useMemo(() => sortSections(categories), [categories]);

    const itemTotal = products.filter(p => p.status !== 'archived').length;

    const fail = (err: any, fallback: string) =>
        showToast(err?.body?.message || err?.message || fallback, 'error');

    // --- sections ---------------------------------------------------------

    const addSection = async () => {
        const name = newSectionName.trim();
        if (!name) return;
        if (categories.some(c => c.name.trim().toLowerCase() === name.toLowerCase())) {
            showToast(`You already have a “${name}” section.`, 'warning');
            return;
        }
        setBusy('new-section');
        try {
            // Appended, not inserted at the top: a menu grows at the end. The
            // server works the position out, so two people adding at once
            // can't land on the same one.
            await onSaveCategory({ name, parentId: null, attributes: [] } as Omit<Category, 'id'>);
            setNewSectionName('');
        } catch (err) {
            fail(err, 'Could not add that section.');
        } finally {
            setBusy(null);
        }
    };

    const saveRename = async () => {
        if (!renaming) return;
        const target = categories.find(c => c.id === renaming.id);
        const name = renaming.name.trim();
        if (!target || !name || name === target.name) { setRenaming(null); return; }
        setBusy(target.id);
        try {
            await onSaveCategory({ ...target, name });
            setRenaming(null);
        } catch (err) {
            fail(err, 'Could not rename that section.');
        } finally {
            setBusy(null);
        }
    };

    /**
     * Move a section one place. Buttons rather than drag-and-drop: this screen
     * is used on a tablet behind a bar, where a long-press drag competes with
     * scrolling and loses.
     *
     * The whole new order is sent in one call, so a reorder is never left
     * half-applied by a dropped connection.
     */
    const move = async (categoryId: string, delta: -1 | 1) => {
        const index = ordered.findIndex(c => c.id === categoryId);
        const to = index + delta;
        if (index < 0 || to < 0 || to >= ordered.length) return;

        const next = [...ordered];
        [next[index], next[to]] = [next[to], next[index]];
        setBusy(categoryId);
        try {
            await api.patch('/categories/reorder', { ids: next.map(c => c.id) }, { skipQueue: true });
            onRefresh?.();
        } catch (err) {
            fail(err, 'Could not save the new order.');
        } finally {
            setBusy(null);
        }
    };

    const toggleHidden = async (category: Category) => {
        setBusy(category.id);
        try {
            await onSaveCategory({ ...category, isHidden: !category.isHidden });
        } catch (err) {
            fail(err, 'Could not change that section.');
        } finally {
            setBusy(null);
        }
    };

    const removeSection = async (category: Category, itemCount: number) => {
        const ok = await confirm({
            title: `Remove “${category.name}”?`,
            message: itemCount > 0
                ? `${itemCount} item${itemCount === 1 ? '' : 's'} will stay on your menu but won’t be in any section until you file them again.`
                : 'This section is empty.',
            confirmLabel: 'Remove section',
            danger: true,
        });
        if (ok) onDeleteCategory(category.id);
    };

    // --- items ------------------------------------------------------------

    const draftFor = (key: string) => draft[key] || { name: '', price: '' };
    const setDraftFor = (key: string, patch: Partial<{ name: string; price: string }>) =>
        setDraft(prev => ({ ...prev, [key]: { ...draftFor(key), ...patch } }));

    /**
     * Add an item from the row at the bottom of a section.
     *
     * New items do NOT count stock. Most of a menu is made to order, and a
     * kitchen that has to stock-count the steaks before it can sell one is a
     * kitchen that stops selling mid-service. Bottled drinks get counting
     * switched on per item.
     */
    const addItem = async (categoryId: string | null) => {
        const key = categoryId ?? 'loose';
        const { name, price } = draftFor(key);
        const trimmed = name.trim();
        const amount = Number.parseFloat(price);
        if (!trimmed) { showToast('Give the item a name.', 'warning'); return; }
        if (!Number.isFinite(amount) || amount <= 0) { showToast('Give the item a price.', 'warning'); return; }

        setBusy(`add-${key}`);
        try {
            const nextSku = makeSkuMinter(storeSettings?.skuPrefix || 'SKU-', products.map(p => p.sku));
            await onSaveProduct({
                name: trimmed,
                description: '',
                sku: nextSku(),
                categoryId: categoryId ?? undefined,
                price: amount,
                stock: 0,
                trackStock: false,
                imageUrls: [],
                status: 'active',
                unitOfMeasure: 'unit',
            } as Omit<Product, 'id'>);
            setDraftFor(key, { name: '', price: '' });
            onRefresh?.();
        } catch (err) {
            fail(err, 'Could not add that item.');
        } finally {
            setBusy(null);
        }
    };

    /**
     * Write a few fields of an item and sync the screen.
     *
     * The server's PUT keeps every column the body leaves out, so sending just
     * `{ price }` is safe — the same approach the Stock app's inline edits use.
     */
    const patchItem = async (product: Product, patch: Partial<Product>) => {
        setBusy(product.id);
        try {
            const res = await api.put<Product>(`/products/${product.id}`, patch);
            const saved: Product = (res as any)?.offline || !(res as any)?.id
                ? { ...product, ...patch }
                : { ...product, ...(res as Product) };
            await onSaveProduct(saved);
        } catch (err) {
            fail(err, 'Could not save that change.');
        } finally {
            setBusy(null);
        }
    };

    const removeItem = async (product: Product) => {
        const ok = await confirm({
            title: `Take “${product.name}” off the menu?`,
            message: 'Past sales of it are kept, so your reports don’t change.',
            confirmLabel: 'Take it off',
            danger: true,
        });
        if (!ok) return;
        setBusy(product.id);
        try {
            // Archived, not deleted: a dish that has been sold is referenced by
            // every sale line that sold it, and deleting the row would mean
            // losing the name off old receipts.
            await api.put(`/products/${product.id}`, { status: 'archived' });
            onRefresh?.();
        } catch (err) {
            fail(err, 'Could not remove that item.');
        } finally {
            setBusy(null);
        }
    };

    // --- render -----------------------------------------------------------

    if (section === 'import') {
        return (
            <MenuShell active="import" user={user} onNavigate={onNavigate} onExit={onExit} onLogout={onLogout}>
                <MenuImport
                    products={products}
                    categories={categories}
                    storeSettings={storeSettings}
                    onDone={() => { onRefresh?.(); onNavigate('menu'); }}
                />
            </MenuShell>
        );
    }

    return (
        <MenuShell active="menu" user={user} onNavigate={onNavigate} onExit={onExit} onLogout={onLogout}>
            <div className="menu-app">
                <header className="menu-head">
                    <div>
                        <h1 className="text-xl font-extrabold text-brand-text">Your menu</h1>
                        <p className="text-sm text-brand-text-muted mt-0.5">
                            {ordered.length} section{ordered.length === 1 ? '' : 's'} · {itemTotal} item{itemTotal === 1 ? '' : 's'}
                            {' · '}shown on the till in this order
                        </p>
                    </div>
                    <button type="button" className="menu-btn-ghost" onClick={() => onNavigate('import')}>
                        <Icon name="upload_file" size={18} /> Upload a menu
                    </button>
                </header>

                <div className="menu-add-section">
                    <input
                        className={inputCls}
                        placeholder="New section, e.g. Starters"
                        value={newSectionName}
                        onChange={e => setNewSectionName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addSection(); }}
                    />
                    <button
                        type="button"
                        className="menu-btn"
                        onClick={addSection}
                        disabled={!newSectionName.trim() || busy === 'new-section'}
                    >
                        Add section
                    </button>
                </div>

                {menu.length === 0 && (
                    <div className="menu-empty">
                        <Icon name="restaurant_menu" size={40} />
                        <h2 className="text-base font-bold text-brand-text mt-3">No menu yet</h2>
                        <p className="text-sm text-brand-text-muted mt-1 max-w-sm">
                            Add a section above and put your dishes in it, or upload the menu you already have
                            as a spreadsheet.
                        </p>
                        <button type="button" className="menu-btn mt-4" onClick={() => onNavigate('import')}>
                            Upload a menu
                        </button>
                    </div>
                )}

                {menu.map(({ category, items }, index) => {
                    const key = category?.id ?? 'loose';
                    const d = draftFor(key);
                    return (
                        <section key={key} className={`menu-section ${category?.isHidden ? 'is-hidden' : ''}`}>
                            <div className="menu-section-head">
                                {renaming && category && renaming.id === category.id ? (
                                    <input
                                        className={inputCls}
                                        autoFocus
                                        value={renaming.name}
                                        onChange={e => setRenaming({ id: category.id, name: e.target.value })}
                                        onBlur={saveRename}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') saveRename();
                                            if (e.key === 'Escape') setRenaming(null);
                                        }}
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        className="menu-section-name"
                                        onClick={() => category && setRenaming({ id: category.id, name: category.name })}
                                        title={category ? 'Rename this section' : undefined}
                                    >
                                        {category ? category.name : 'Not in a section'}
                                        {category?.isHidden && <span className="menu-chip">Hidden from the till</span>}
                                    </button>
                                )}

                                <span className="menu-count">{items.length}</span>

                                {category && (
                                    <div className="menu-section-actions">
                                        <button type="button" title="Move up" aria-label={`Move ${category.name} up`}
                                            disabled={index === 0 || busy === category.id}
                                            onClick={() => move(category.id, -1)}>
                                            <Icon name="arrow_upward" size={18} />
                                        </button>
                                        <button type="button" title="Move down" aria-label={`Move ${category.name} down`}
                                            disabled={index >= ordered.length - 1 || busy === category.id}
                                            onClick={() => move(category.id, 1)}>
                                            <Icon name="arrow_downward" size={18} />
                                        </button>
                                        <button type="button"
                                            title={category.isHidden ? 'Show on the till' : 'Hide from the till'}
                                            aria-label={category.isHidden ? 'Show on the till' : 'Hide from the till'}
                                            disabled={busy === category.id}
                                            onClick={() => toggleHidden(category)}>
                                            <Icon name={category.isHidden ? 'visibility_off' : 'visibility'} size={18} />
                                        </button>
                                        <button type="button" title="Remove section" aria-label={`Remove ${category.name}`}
                                            className="is-danger"
                                            disabled={busy === category.id}
                                            onClick={() => removeSection(category, items.length)}>
                                            <Icon name="delete" size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <ul className="menu-items">
                                {items.map(item => (
                                    <li key={item.id} className="menu-item">
                                        <input
                                            className="menu-item-name"
                                            defaultValue={item.name}
                                            aria-label={`Name of ${item.name}`}
                                            onBlur={e => {
                                                const name = e.target.value.trim();
                                                if (name && name !== item.name) patchItem(item, { name });
                                                else e.target.value = item.name;
                                            }}
                                        />
                                        <input
                                            className="menu-item-price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            inputMode="decimal"
                                            defaultValue={item.price}
                                            aria-label={`Price of ${item.name}`}
                                            onBlur={e => {
                                                const price = Number.parseFloat(e.target.value);
                                                if (Number.isFinite(price) && price >= 0 && price !== item.price) {
                                                    patchItem(item, { price });
                                                } else {
                                                    e.target.value = String(item.price);
                                                }
                                            }}
                                        />
                                        {/* Counting is off for food and on for bottled drinks. Off
                                            means the till never refuses the sale and the sale never
                                            moves a stock figure. */}
                                        <button
                                            type="button"
                                            className={`menu-track ${item.trackStock !== false ? 'is-on' : ''}`}
                                            disabled={busy === item.id}
                                            onClick={() => patchItem(item, { trackStock: item.trackStock === false })}
                                            title={item.trackStock !== false
                                                ? `Counts stock — ${item.stock} left. Tap to stop counting.`
                                                : 'Made to order, never runs out. Tap to count stock.'}
                                        >
                                            <Icon name={item.trackStock !== false ? 'inventory_2' : 'restaurant'} size={16} />
                                            {item.trackStock !== false ? `${item.stock} in stock` : 'Made to order'}
                                        </button>
                                        <button
                                            type="button"
                                            className="menu-item-remove"
                                            aria-label={`Take ${item.name} off the menu`}
                                            disabled={busy === item.id}
                                            onClick={() => removeItem(item)}
                                        >
                                            <Icon name="close" size={18} />
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div className="menu-item-add">
                                <input
                                    className={inputCls}
                                    placeholder={category ? `New item in ${category.name}` : 'New item'}
                                    value={d.name}
                                    onChange={e => setDraftFor(key, { name: e.target.value })}
                                    onKeyDown={e => { if (e.key === 'Enter') addItem(category?.id ?? null); }}
                                />
                                <input
                                    className={inputCls}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    inputMode="decimal"
                                    placeholder="Price"
                                    value={d.price}
                                    onChange={e => setDraftFor(key, { price: e.target.value })}
                                    onKeyDown={e => { if (e.key === 'Enter') addItem(category?.id ?? null); }}
                                />
                                <button
                                    type="button"
                                    className="menu-btn"
                                    disabled={busy === `add-${key}`}
                                    onClick={() => addItem(category?.id ?? null)}
                                >
                                    Add
                                </button>
                            </div>
                        </section>
                    );
                })}

                {menu.length > 0 && (
                    <p className="text-xs text-brand-text-muted mt-6">
                        These prices are what the till charges. Items marked “Made to order” never run out;
                        switch counting on for bottled drinks so you can see what’s left.
                    </p>
                )}
            </div>
        </MenuShell>
    );
};

export default MenuApp;
