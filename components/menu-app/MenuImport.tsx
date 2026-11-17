import React, { useMemo, useRef, useState } from 'react';
import { Category, Product, StoreSettings } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Icon } from '../crm/CrmBits';
import {
    MENU_CSV_TEMPLATE,
    MenuImportResult,
    makeSkuMinter,
    parseMenuCsv,
    sectionsIn,
} from './menuModel';

interface MenuImportProps {
    products: Product[];
    categories: Category[];
    storeSettings: StoreSettings | null;
    onDone: () => void;
}

const inputCls =
    'w-full bg-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder-brand-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition';

/**
 * Upload a menu from a spreadsheet.
 *
 * Typing eighty dishes into a form is the reason a venue gives up on new till
 * software, so the menu it already has — almost always in a spreadsheet or a
 * Word table — has to be enough to start.
 *
 * Nothing is written until the owner has SEEN what we read. The parse is shown
 * back as sections and items, with every line we could not use listed by number
 * and reason. A menu importer that silently drops three dishes is worse than
 * one that refuses the file, because the shop finds out when a customer orders
 * something that isn't on the till.
 */
export const MenuImport: React.FC<MenuImportProps> = ({ products, categories, storeSettings, onDone }) => {
    const { showToast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);

    const [text, setText] = useState('');
    const [fileName, setFileName] = useState('');
    const [saving, setSaving] = useState(false);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

    const parsed: MenuImportResult | null = useMemo(
        () => (text.trim() ? parseMenuCsv(text) : null),
        [text],
    );

    const sections = useMemo(() => (parsed ? sectionsIn(parsed.rows) : []), [parsed]);
    const existingNames = useMemo(
        () => new Set(categories.map(c => c.name.trim().toLowerCase())),
        [categories],
    );
    const newSections = sections.filter(s => !existingNames.has(s.trim().toLowerCase()));

    const readFile = async (file: File) => {
        // A .csv or .txt is read as text. A real .xlsx is a zip, so the only
        // honest thing to do is say so rather than show the owner mojibake.
        if (/\.(xlsx|xls|ods|numbers)$/i.test(file.name)) {
            showToast('Save the sheet as CSV first (File → Save as → CSV), then upload it.', 'warning');
            return;
        }
        try {
            setFileName(file.name);
            setText(await file.text());
        } catch {
            showToast('Could not read that file.', 'error');
        }
    };

    const downloadTemplate = () => {
        const blob = new Blob([MENU_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'salepilot-menu-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    /**
     * Create the sections first, then the items.
     *
     * Sequential on purpose. Firing eighty creates at once would race the
     * find-or-create on section names and leave a store with three "Starters",
     * and it would make a partial failure impossible to read. Slower, and you
     * can see exactly where it stopped.
     */
    const save = async () => {
        if (!parsed || parsed.rows.length === 0) return;
        setSaving(true);
        setProgress({ done: 0, total: parsed.rows.length });

        try {
            const sectionIdByName = new Map<string, string>();
            for (const c of categories) sectionIdByName.set(c.name.trim().toLowerCase(), c.id);

            for (const name of newSections) {
                const created = await api.post<Category>('/categories', { name, parentId: null, attributes: [] });
                if ((created as any)?.id) sectionIdByName.set(name.trim().toLowerCase(), (created as any).id);
            }

            const nextSku = makeSkuMinter(storeSettings?.skuPrefix || 'SKU-', products.map(p => p.sku));
            let saved = 0;
            const failures: string[] = [];

            for (const row of parsed.rows) {
                try {
                    await api.post<Product>('/products', {
                        name: row.name,
                        description: row.description,
                        sku: nextSku(),
                        categoryId: sectionIdByName.get(row.section.trim().toLowerCase()),
                        price: row.price,
                        stock: 0,
                        // Food is made to order, so counting is off unless the
                        // sheet said otherwise. See menuModel.
                        trackStock: row.trackStock,
                        imageUrls: [],
                        status: 'active',
                        unitOfMeasure: 'unit',
                    });
                    saved += 1;
                } catch (err: any) {
                    failures.push(`${row.name}: ${err?.body?.message || err?.message || 'could not be saved'}`);
                }
                setProgress({ done: saved + failures.length, total: parsed.rows.length });
            }

            if (saved > 0) {
                showToast(`Added ${saved} item${saved === 1 ? '' : 's'} to your menu.`, 'success');
            }
            if (failures.length > 0) {
                // Named, not counted: "3 failed" tells the owner nothing they
                // can act on.
                showToast(`${failures.length} item${failures.length === 1 ? '' : 's'} didn’t save — ${failures[0]}`, 'error');
            }
            if (saved > 0) onDone();
        } catch (err: any) {
            showToast(err?.body?.message || err?.message || 'Could not upload the menu.', 'error');
        } finally {
            setSaving(false);
            setProgress(null);
        }
    };

    return (
        <div className="menu-app">
            <header className="menu-head">
                <div>
                    <h1 className="text-xl font-extrabold text-brand-text">Upload your menu</h1>
                    <p className="text-sm text-brand-text-muted mt-0.5">
                        From a spreadsheet, or pasted straight in. Nothing is saved until you’ve checked it.
                    </p>
                </div>
                <button type="button" className="menu-btn-ghost" onClick={downloadTemplate}>
                    <Icon name="download" size={18} /> Example file
                </button>
            </header>

            <div className="menu-card">
                <div className="menu-upload-row">
                    <button type="button" className="menu-btn-ghost" onClick={() => fileRef.current?.click()}>
                        <Icon name="upload_file" size={18} /> Choose a CSV file
                    </button>
                    {fileName && <span className="text-sm text-brand-text-muted truncate">{fileName}</span>}
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv,.txt,text/csv,text/plain"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ''; }}
                    />
                </div>

                <p className="text-xs text-brand-text-muted mt-3 mb-1.5">
                    Or paste it here. Columns like <strong>Section, Item, Price</strong> are understood, and so is a
                    menu typed the way it’s printed — a section name on its own line, then the dishes and prices
                    under it.
                </p>
                <textarea
                    className={`${inputCls} font-mono`}
                    rows={10}
                    placeholder={'Starters\nChicken Wings, 65\nSoup of the day, 40\n\nMain Courses\nBeef Stew & Nshima, 95'}
                    value={text}
                    onChange={e => { setText(e.target.value); setFileName(''); }}
                />
            </div>

            {parsed && (
                <div className="menu-card">
                    <h2 className="text-base font-bold text-brand-text">
                        {parsed.rows.length} item{parsed.rows.length === 1 ? '' : 's'} read
                        {sections.length > 0 && ` in ${sections.length} section${sections.length === 1 ? '' : 's'}`}
                    </h2>

                    {newSections.length > 0 && (
                        <p className="text-sm text-brand-text-muted mt-1">
                            New sections to be created: {newSections.join(', ')}
                        </p>
                    )}

                    {parsed.unknownHeaders.length > 0 && (
                        <p className="text-sm text-warning mt-1">
                            Ignored columns: {parsed.unknownHeaders.join(', ')}
                        </p>
                    )}

                    {parsed.rows.length > 0 && (
                        <div className="menu-preview">
                            <table>
                                <thead>
                                    <tr><th>Section</th><th>Item</th><th className="num">Price</th><th>Stock</th></tr>
                                </thead>
                                <tbody>
                                    {parsed.rows.slice(0, 50).map(r => (
                                        <tr key={`${r.line}-${r.name}`}>
                                            <td>{r.section || <span className="text-brand-text-muted">—</span>}</td>
                                            <td>{r.name}</td>
                                            <td className="num">{r.price.toFixed(2)}</td>
                                            <td>{r.trackStock ? 'Counted' : 'Made to order'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parsed.rows.length > 50 && (
                                <p className="text-xs text-brand-text-muted mt-2">
                                    …and {parsed.rows.length - 50} more.
                                </p>
                            )}
                        </div>
                    )}

                    {parsed.rejected.length > 0 && (
                        <div className="menu-rejected">
                            <p className="text-sm font-bold text-brand-text">
                                {parsed.rejected.length} line{parsed.rejected.length === 1 ? '' : 's'} couldn’t be used
                            </p>
                            <ul>
                                {parsed.rejected.slice(0, 10).map(r => (
                                    <li key={r.line}>Line {r.line}: {r.reason} <span className="text-brand-text-muted">({r.raw})</span></li>
                                ))}
                            </ul>
                            {parsed.rejected.length > 10 && (
                                <p className="text-xs text-brand-text-muted">…and {parsed.rejected.length - 10} more.</p>
                            )}
                        </div>
                    )}

                    <div className="menu-upload-actions">
                        <button
                            type="button"
                            className="menu-btn"
                            disabled={saving || parsed.rows.length === 0}
                            onClick={save}
                        >
                            {saving
                                ? `Adding… ${progress ? `${progress.done}/${progress.total}` : ''}`
                                : `Add ${parsed.rows.length} item${parsed.rows.length === 1 ? '' : 's'} to the menu`}
                        </button>
                        <button type="button" className="menu-btn-ghost" disabled={saving} onClick={() => { setText(''); setFileName(''); }}>
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuImport;
