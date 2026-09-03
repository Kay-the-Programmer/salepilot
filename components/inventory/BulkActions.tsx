import React, { useMemo, useState } from 'react';
import { Category, Product, StoreSettings } from '../../types';
import { formatCurrency } from '@/utils/currency';
import { Modal } from '../ui/Modal';

const INPUT_CLS =
    'w-full rounded-lg border border-brand-border bg-surface px-3 py-2 text-sm text-brand-text outline-none focus:border-primary';

/** How a bulk price change is expressed. */
export type PriceMode = 'percent' | 'amount' | 'set';

/** Which money field the change lands on. */
export type PriceField = 'price' | 'costPrice' | 'both';

export interface PriceChange {
    mode: PriceMode;
    field: PriceField;
    /** Signed: negative lowers. Ignored for `set`, which uses `value` directly. */
    value: number;
}

/**
 * Apply a bulk price change to one product, rounded to whole cents.
 *
 * Exported so the preview in the dialog and the write that follows can never
 * disagree — a preview computed by different code than the update is a preview
 * that will eventually lie.
 */
export const applyPriceChange = (product: Product, change: PriceChange): Partial<Product> => {
    const round = (n: number) => Math.max(0, Math.round(n * 100) / 100);

    const next = (current: unknown): number => {
        const base = Number(current) || 0;
        switch (change.mode) {
            case 'percent': return round(base * (1 + change.value / 100));
            case 'amount': return round(base + change.value);
            case 'set': return round(change.value);
        }
    };

    const patch: Partial<Product> = {};
    if (change.field === 'price' || change.field === 'both') patch.price = next(product.price);
    if (change.field === 'costPrice' || change.field === 'both') patch.costPrice = next(product.costPrice);
    return patch;
};

/**
 * Sticky bar that appears once products are ticked.
 *
 * Inventory had no multi-select at all, so a supplier price increase across
 * forty lines meant forty trips through the full product form. The CSV
 * export/re-import round trip could do it, but nobody finds that when what
 * they want is "put these up 10%".
 */
export const BulkActionBar: React.FC<{
    count: number;
    onClear: () => void;
    onChangePrice: () => void;
    onChangeCategory: () => void;
    onArchive: () => void;
    busy?: boolean;
}> = ({ count, onClear, onChangePrice, onChangeCategory, onArchive, busy }) => {
    if (count === 0) return null;

    const btn = 'rounded-lg border border-brand-border px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-surface-variant disabled:opacity-50';

    return (
        <div
            className="sticky bottom-0 z-20 flex flex-wrap items-center gap-2 border-t border-brand-border bg-surface px-4 py-3 shadow-lg"
            role="region"
            aria-label="Bulk actions"
        >
            <span className="text-sm font-bold text-brand-text">
                {count} selected
            </span>
            <button type="button" onClick={onClear} className="text-xs font-bold text-brand-text-muted hover:text-brand-text">
                Clear
            </button>
            <div className="ml-auto flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={onChangePrice} className={btn}>Change price</button>
                <button type="button" disabled={busy} onClick={onChangeCategory} className={btn}>Change category</button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={onArchive}
                    className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                    Archive
                </button>
            </div>
        </div>
    );
};

/**
 * Bulk price change, with a worked preview of the first few products.
 *
 * Prices are the one field where a bulk write is genuinely frightening — it is
 * money, it touches every till, and the CSV path at least let you eyeball the
 * numbers first. The preview is what replaces that reassurance.
 */
export const BulkPriceModal: React.FC<{
    open: boolean;
    onClose: () => void;
    products: Product[];
    storeSettings: StoreSettings;
    onApply: (change: PriceChange) => void;
    busy?: boolean;
}> = ({ open, onClose, products, storeSettings, onApply, busy }) => {
    const [mode, setMode] = useState<PriceMode>('percent');
    const [field, setField] = useState<PriceField>('price');
    const [raw, setRaw] = useState('');
    const [direction, setDirection] = useState<1 | -1>(1);

    const magnitude = Number(raw) || 0;
    // `set` writes an absolute figure, so a direction would be meaningless.
    const value = mode === 'set' ? magnitude : magnitude * direction;
    const change: PriceChange = { mode, field, value };
    const valid = raw.trim() !== '' && magnitude > 0;

    const preview = useMemo(
        () => products.slice(0, 4).map(p => ({ product: p, patch: applyPriceChange(p, change) })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [products, mode, field, value],
    );

    const money = (v: unknown) => formatCurrency(Number(v) || 0, storeSettings);
    const shownField: keyof Product = field === 'costPrice' ? 'costPrice' : 'price';

    return (
        <Modal open={open} onClose={onClose} title="Change price" size="lg" disabled={busy}>
            <div className="space-y-4 p-5">
                <p className="text-sm text-brand-text-muted">
                    Applies to the {products.length} selected product{products.length === 1 ? '' : 's'}.
                </p>

                <div>
                    <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-brand-text-muted">Change</p>
                    <div className="flex flex-wrap gap-2">
                        {([
                            { v: 'percent' as const, label: 'By percentage' },
                            { v: 'amount' as const, label: 'By amount' },
                            { v: 'set' as const, label: 'Set to' },
                        ]).map(o => (
                            <button
                                key={o.v}
                                type="button"
                                onClick={() => setMode(o.v)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${mode === o.v ? 'border-primary bg-primary/10 text-primary' : 'border-brand-border text-brand-text'}`}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                    {mode !== 'set' && (
                        <div className="flex gap-1">
                            {([
                                { v: 1 as const, label: 'Increase' },
                                { v: -1 as const, label: 'Decrease' },
                            ]).map(o => (
                                <button
                                    key={o.label}
                                    type="button"
                                    onClick={() => setDirection(o.v)}
                                    className={`rounded-lg border px-3 py-2 text-xs font-bold ${direction === o.v ? 'border-primary bg-primary/10 text-primary' : 'border-brand-border text-brand-text'}`}
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="min-w-[8rem] flex-1">
                        <label htmlFor="bulk-price-value" className="mb-1 block text-[11px] font-black uppercase tracking-wider text-brand-text-muted">
                            {mode === 'percent' ? 'Percent' : 'Amount'}
                        </label>
                        <input
                            id="bulk-price-value"
                            data-autofocus
                            type="text"
                            inputMode="decimal"
                            value={raw}
                            onChange={e => setRaw(e.target.value.replace(/[^\d.]/g, ''))}
                            placeholder={mode === 'percent' ? '10' : '0.00'}
                            className={INPUT_CLS}
                        />
                    </div>
                </div>

                <div>
                    <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-brand-text-muted">Apply to</p>
                    <div className="flex flex-wrap gap-2">
                        {([
                            { v: 'price' as const, label: 'Selling price' },
                            { v: 'costPrice' as const, label: 'Cost price' },
                            { v: 'both' as const, label: 'Both' },
                        ]).map(o => (
                            <button
                                key={o.v}
                                type="button"
                                onClick={() => setField(o.v)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${field === o.v ? 'border-primary bg-primary/10 text-primary' : 'border-brand-border text-brand-text'}`}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>

                {valid && (
                    <div className="rounded-lg border border-brand-border p-3">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-brand-text-muted">Preview</p>
                        <ul className="space-y-1">
                            {preview.map(({ product, patch }) => (
                                <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="truncate text-brand-text">{product.name}</span>
                                    <span className="shrink-0 tabular-nums text-brand-text-muted">
                                        {money(product[shownField])} → <strong className="text-brand-text">{money(patch[shownField])}</strong>
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {products.length > preview.length && (
                            <p className="mt-2 text-[11px] text-brand-text-muted">
                                …and {products.length - preview.length} more.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 border-t border-brand-border bg-surface-variant/40 px-5 py-4">
                <button type="button" onClick={onClose} disabled={busy} className="rounded-lg px-3 py-2 text-sm font-bold text-brand-text-muted hover:text-brand-text">
                    Cancel
                </button>
                <button
                    type="button"
                    disabled={!valid || busy}
                    onClick={() => onApply(change)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                    {busy ? 'Updating…' : `Update ${products.length}`}
                </button>
            </div>
        </Modal>
    );
};

/** Bulk category reassignment. */
export const BulkCategoryModal: React.FC<{
    open: boolean;
    onClose: () => void;
    count: number;
    categories: Category[];
    onApply: (categoryId: string) => void;
    busy?: boolean;
}> = ({ open, onClose, count, categories, onApply, busy }) => {
    const [categoryId, setCategoryId] = useState('');

    return (
        <Modal open={open} onClose={onClose} title="Change category" size="md" disabled={busy}>
            <div className="space-y-3 p-5">
                <p className="text-sm text-brand-text-muted">
                    Moves the {count} selected product{count === 1 ? '' : 's'} into one category.
                </p>
                <label htmlFor="bulk-category" className="block text-[11px] font-black uppercase tracking-wider text-brand-text-muted">
                    Category
                </label>
                <select
                    id="bulk-category"
                    data-autofocus
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className={INPUT_CLS}
                >
                    <option value="">Choose a category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-brand-border bg-surface-variant/40 px-5 py-4">
                <button type="button" onClick={onClose} disabled={busy} className="rounded-lg px-3 py-2 text-sm font-bold text-brand-text-muted hover:text-brand-text">
                    Cancel
                </button>
                <button
                    type="button"
                    disabled={!categoryId || busy}
                    onClick={() => onApply(categoryId)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                    {busy ? 'Updating…' : `Move ${count}`}
                </button>
            </div>
        </Modal>
    );
};
