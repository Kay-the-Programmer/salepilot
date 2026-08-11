import React, { useMemo, useRef, useState } from 'react';
import { api } from '../../services/api';
import {
    buildTemplateCsv, FIELD_LABELS, ImportField, IMPORT_FIELDS,
    canonicalField, parseCsvGrid, parseProductCsv,
} from './csv';
// Carries the `.sp-assistant` scope this modal's m3-* classes and --m3-*
// variables live in; without it the panel renders with no background.
import '../../pages/assistant/assistant.css';

interface ImportOutcome {
    row: number;
    name: string;
    action: 'create' | 'update' | 'skip' | 'error';
    message?: string;
}

interface ImportResult {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    outcomes: ImportOutcome[];
    dryRun?: boolean;
}

interface ProductImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called after a successful import so the caller can refresh its catalogue. */
    onImported: (result: ImportResult) => void;
}

const FIELD = 'w-full px-3 py-2 rounded-lg text-sm m3-bg-surface-container m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)]';

const ACTION_TONE: Record<ImportOutcome['action'], string> = {
    create: 'text-emerald-600',
    update: 'text-blue-500',
    skip: 'text-amber-600',
    error: 'text-red-500',
};

const ACTION_LABEL: Record<ImportOutcome['action'], string> = {
    create: 'New',
    update: 'Update',
    skip: 'Skipped',
    error: 'Rejected',
};

/**
 * Bulk product import from a CSV file.
 *
 * Three steps, deliberately: pick the file, check the mapping and preview what
 * will happen, then commit. The preview is a real server-side dry run rather
 * than a guess in the browser, so what it reports is what the import will do —
 * including duplicates it will skip and rows it will reject.
 */
export const ProductImportModal: React.FC<ProductImportModalProps> = ({ isOpen, onClose, onImported }) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');
    const [rawText, setRawText] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<number, ImportField | ''>>({});
    const [updateExisting, setUpdateExisting] = useState(false);
    const [preview, setPreview] = useState<ImportResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<ImportResult | null>(null);
    const [dragging, setDragging] = useState(false);

    const reset = () => {
        setFileName(''); setRawText(''); setHeaders([]); setMapping({});
        setPreview(null); setError(null); setDone(null); setUpdateExisting(false);
    };

    const close = () => { reset(); onClose(); };

    const rows = useMemo(() => {
        if (!rawText) return [];
        return parseProductCsv(rawText, mapping).rows;
    }, [rawText, mapping]);

    const mappedFields = useMemo(() => new Set(Object.values(mapping).filter(Boolean)), [mapping]);
    const canProceed = rows.length > 0 && mappedFields.has('name') && mappedFields.has('price');

    const readFile = async (file: File) => {
        setError(null); setPreview(null); setDone(null);
        if (!/\.csv$/i.test(file.name)) {
            setError('That doesn’t look like a .csv file. Export your spreadsheet as CSV and try again.');
            return;
        }
        const text = await file.text();
        const grid = parseCsvGrid(text);
        if (grid.length < 2) {
            setError('The file needs a header row and at least one product row.');
            return;
        }
        const head = grid[0].map(h => h.trim());
        // Auto-map by header name; anything unrecognised is left unset for the
        // operator to assign rather than silently dropped.
        const auto: Record<number, ImportField | ''> = {};
        head.forEach((h, i) => { auto[i] = (canonicalField(h) as ImportField) || ''; });
        setFileName(file.name);
        setRawText(text);
        setHeaders(head);
        setMapping(auto);
    };

    const runPreview = async () => {
        setBusy(true); setError(null);
        try {
            const result = await api.post<ImportResult>('/products/import', { rows, dryRun: true, updateExisting });
            setPreview(result);
        } catch (e: any) {
            setError(e?.message || 'Could not check the file.');
        } finally {
            setBusy(false);
        }
    };

    const runImport = async () => {
        setBusy(true); setError(null);
        try {
            const result = await api.post<ImportResult>('/products/import', { rows, updateExisting });
            setDone(result);
            onImported(result);
        } catch (e: any) {
            setError(e?.message || 'Import failed.');
        } finally {
            setBusy(false);
        }
    };

    const downloadTemplate = () => {
        const blob = new Blob([buildTemplateCsv()], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'salepilot-product-import-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div
            className="sp-assistant fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            onClick={close}
        >
            <div
                className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl m3-bg-surface shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 m3-bg-surface border-b m3-border-outline-variant">
                    <div>
                        <h2 className="text-base font-bold m3-text-on-surface">Import products from CSV</h2>
                        <p className="text-xs m3-text-on-surface-variant">Add many products at once from a spreadsheet</p>
                    </div>
                    <button type="button" onClick={close} aria-label="Close" className="m3-text-on-surface-variant">✕</button>
                </div>

                <div className="p-5">
                    {done ? (
                        <div>
                            <div className="rounded-xl p-4 mb-4 bg-emerald-500/10">
                                <p className="text-sm font-bold text-emerald-600 mb-1">Import complete</p>
                                <p className="text-sm m3-text-on-surface">
                                    {done.created} added · {done.updated} updated · {done.skipped} skipped
                                    {done.errors > 0 ? ` · ${done.errors} rejected` : ''}
                                </p>
                            </div>
                            {done.errors > 0 && <OutcomeList outcomes={done.outcomes} only="error" />}
                            <button
                                type="button"
                                className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-[color:var(--m3-primary)]"
                                onClick={close}
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Step 1 — the file */}
                            {!rawText && (
                                <>
                                    <div
                                        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? 'border-[color:var(--m3-primary)] bg-[color:var(--m3-primary)]/5' : 'm3-border-outline-variant'}`}
                                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={e => {
                                            e.preventDefault();
                                            setDragging(false);
                                            const f = e.dataTransfer.files?.[0];
                                            if (f) readFile(f);
                                        }}
                                    >
                                        <p className="text-sm font-semibold m3-text-on-surface mb-1">Drop a .csv file here</p>
                                        <p className="text-xs m3-text-on-surface-variant mb-4">or</p>
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[color:var(--m3-primary)]"
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            Choose file
                                        </button>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept=".csv,text/csv"
                                            className="hidden"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); }}
                                        />
                                    </div>
                                    <p className="text-xs m3-text-on-surface-variant mt-3">
                                        Needs at least a <strong>name</strong> and a <strong>price</strong> column.
                                        Category names are created automatically.{' '}
                                        <button type="button" className="font-semibold text-[color:var(--m3-primary)] underline" onClick={downloadTemplate}>
                                            Download a template
                                        </button>
                                    </p>
                                </>
                            )}

                            {/* Step 2 — column mapping */}
                            {rawText && (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm m3-text-on-surface">
                                            <span className="font-bold">{fileName}</span>
                                            <span className="m3-text-on-surface-variant"> · {rows.length} row{rows.length === 1 ? '' : 's'}</span>
                                        </p>
                                        <button type="button" className="text-xs font-semibold text-[color:var(--m3-primary)] underline"
                                            onClick={reset}>
                                            Choose a different file
                                        </button>
                                    </div>

                                    <p className="text-xs font-semibold m3-text-on-surface-variant mb-2">
                                        Match your columns to product fields
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                        {headers.map((h, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="text-xs m3-text-on-surface-variant truncate flex-1" title={h}>{h || `Column ${i + 1}`}</span>
                                                <select
                                                    aria-label={`Map column ${h || i + 1}`}
                                                    className={`${FIELD} flex-1`}
                                                    value={mapping[i] || ''}
                                                    onChange={e => setMapping(m => ({ ...m, [i]: e.target.value as ImportField | '' }))}
                                                >
                                                    <option value="">Ignore this column</option>
                                                    {IMPORT_FIELDS.map(f => (
                                                        <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>

                                    {!canProceed && (
                                        <p className="text-xs text-amber-600 mb-3">
                                            Map a column to <strong>Name</strong> and one to <strong>Selling price</strong> to continue.
                                        </p>
                                    )}

                                    <label className="flex items-start gap-2 mb-4 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="mt-0.5"
                                            checked={updateExisting}
                                            onChange={e => { setUpdateExisting(e.target.checked); setPreview(null); }}
                                        />
                                        <span className="text-xs m3-text-on-surface">
                                            Update products that already exist
                                            <span className="block m3-text-on-surface-variant">
                                                Matched by SKU, or by name when the file has no SKU. Off means they're left untouched.
                                            </span>
                                        </span>
                                    </label>

                                    {error && (
                                        <p className="text-sm text-red-500 mb-3">{error}</p>
                                    )}

                                    {preview && (
                                        <div className="rounded-xl m3-bg-surface-low border m3-border-outline-variant p-3 mb-4">
                                            <p className="text-sm font-bold m3-text-on-surface mb-1">This import will:</p>
                                            <p className="text-sm m3-text-on-surface-variant mb-2">
                                                add <strong className="text-emerald-600">{preview.created}</strong> ·
                                                update <strong className="text-blue-500"> {preview.updated}</strong> ·
                                                skip <strong className="text-amber-600"> {preview.skipped}</strong>
                                                {preview.errors > 0 && <> · reject <strong className="text-red-500">{preview.errors}</strong></>}
                                            </p>
                                            <OutcomeList outcomes={preview.outcomes} />
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border m3-border-outline-variant m3-text-on-surface"
                                            onClick={close}
                                        >
                                            Cancel
                                        </button>
                                        {!preview ? (
                                            <button
                                                type="button"
                                                disabled={!canProceed || busy}
                                                className="flex-[2] py-2.5 rounded-lg text-sm font-bold text-white bg-[color:var(--m3-primary)] disabled:opacity-50"
                                                onClick={runPreview}
                                            >
                                                {busy ? 'Checking…' : 'Check file'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={busy || (preview.created + preview.updated) === 0}
                                                className="flex-[2] py-2.5 rounded-lg text-sm font-bold text-white bg-[color:var(--m3-primary)] disabled:opacity-50"
                                                onClick={runImport}
                                            >
                                                {busy
                                                    ? 'Importing…'
                                                    : `Import ${preview.created + preview.updated} product${(preview.created + preview.updated) === 1 ? '' : 's'}`}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

/** Per-row verdicts. Problems first — those are what the operator must act on. */
const OutcomeList: React.FC<{ outcomes: ImportOutcome[]; only?: ImportOutcome['action'] }> = ({ outcomes, only }) => {
    const list = only ? outcomes.filter(o => o.action === only) : outcomes;
    const ordered = [...list].sort((a, b) => {
        const rank = (o: ImportOutcome) => (o.action === 'error' ? 0 : o.action === 'skip' ? 1 : 2);
        return rank(a) - rank(b) || a.row - b.row;
    });
    if (ordered.length === 0) return null;

    return (
        <ul className="max-h-48 overflow-y-auto text-xs space-y-1">
            {ordered.slice(0, 100).map(o => (
                <li key={o.row} className="flex gap-2">
                    <span className="m3-text-on-surface-variant w-12 shrink-0">Row {o.row}</span>
                    <span className={`w-16 shrink-0 font-semibold ${ACTION_TONE[o.action]}`}>{ACTION_LABEL[o.action]}</span>
                    <span className="m3-text-on-surface truncate flex-1">
                        {o.name}
                        {o.message && <span className="m3-text-on-surface-variant"> — {o.message}</span>}
                    </span>
                </li>
            ))}
            {ordered.length > 100 && (
                <li className="m3-text-on-surface-variant">…and {ordered.length - 100} more</li>
            )}
        </ul>
    );
};

export default ProductImportModal;
