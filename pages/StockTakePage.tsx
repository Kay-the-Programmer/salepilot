import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { Product, StockTakeSession } from '../types';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import QrCodeIcon from '../components/icons/QrCodeIcon';
import ConfirmationModal from '../components/ConfirmationModal';
// Lazy-loaded: the @zxing scanner bundle (~424 kB) loads only on first scan.
const UnifiedScannerModal = lazy(() => import('../components/UnifiedScannerModal'));
import { HiOutlineXMark } from 'react-icons/hi2';

interface StockTakePageProps {
    session: StockTakeSession | null;
    /** Live products — used to resolve each item's unit of measure (unit vs kg). */
    products?: Product[];
    onStart: () => void;
    onUpdateItem: (productId: string, count: number | null) => void;
    onCancel: () => void;
    onFinalize: () => void;
}

/**
 * Quantity rules (Velocity):
 *  - `unit` products count in whole numbers only — no decimal places.
 *  - `kg` products count with strictly two decimal places.
 * All discrepancy math is rounded to the same precision so floating-point
 * noise (0.1 + 0.2 …) never shows up as a phantom discrepancy.
 */
const UNIT_INPUT_RE = /^\d*$/;
const KG_INPUT_RE = /^\d*(\.\d{0,2})?$/;

/* API numerics can arrive as strings (Postgres numeric) — always coerce. */
const roundQty = (value: number | string, isKg: boolean): number => {
    const n = Number(value) || 0;
    return isKg ? Math.round(n * 100) / 100 : Math.round(n);
};

const fmtQty = (value: number | string, isKg: boolean): string => {
    const n = Number(value) || 0;
    return isKg ? n.toFixed(2) : String(Math.round(n));
};

const StockTakePage: React.FC<StockTakePageProps> = ({ session, products, onStart, onUpdateItem, onCancel, onFinalize }) => {
    const [filter, setFilter] = useState('all'); // 'all', 'counted', 'uncounted', 'discrepancy'
    const [searchTerm, setSearchTerm] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanNotice, setScanNotice] = useState<string | null>(null);
    // Local keystroke drafts so kg entries like "10." survive typing — the
    // committed numeric value still flows through onUpdateItem on every change.
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    useEffect(() => {
        inputRefs.current = {};
        setDrafts({});
    }, [session?.id]);

    const unitById = useMemo(() => {
        const map = new Map<string, 'unit' | 'kg'>();
        (products || []).forEach(p => map.set(p.id, p.unitOfMeasure === 'kg' ? 'kg' : 'unit'));
        return map;
    }, [products]);

    const isKgItem = (productId: string) => unitById.get(productId) === 'kg';

    const handleCountChange = (productId: string, value: string) => {
        const kg = isKgItem(productId);
        // Reject keystrokes that break the unit's precision rule.
        if (!(kg ? KG_INPUT_RE : UNIT_INPUT_RE).test(value)) return;

        setDrafts(prev => ({ ...prev, [productId]: value }));

        if (value === '' || value === '.') {
            onUpdateItem(productId, null);
            return;
        }
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            onUpdateItem(productId, roundQty(numValue, kg));
        }
    };

    const handleCountBlur = (productId: string) => {
        // Snap the display to the canonical format (e.g. "10.5" → "10.50").
        setDrafts(prev => {
            const next = { ...prev };
            delete next[productId];
            return next;
        });
    };

    const handleCancel = () => {
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = () => {
        setIsCancelModalOpen(false);
        onCancel();
    };

    const handleConfirmFinalize = () => {
        setIsFinalizeModalOpen(false);
        onFinalize();
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && filteredItems.length === 1) {
            e.preventDefault();
            const firstItem = filteredItems[0];
            const inputElement = inputRefs.current[firstItem.productId];
            inputElement?.focus();
            inputElement?.select();
        }
    };

    // Scan-to-count: a scanned barcode (or SKU) jumps straight to that item's
    // count input so the operator can scan → type → scan through the shelf.
    const handleScanSuccess = (code: string) => {
        setIsScannerOpen(false);
        const raw = (code || '').trim();
        if (!raw || !session) return;

        const needle = raw.toLowerCase();
        const matchedProduct = (products || []).find(p =>
            (p.barcode && p.barcode.trim().toLowerCase() === needle) ||
            (p.sku && p.sku.trim().toLowerCase() === needle)
        );
        const item = matchedProduct
            ? session.items.find(i => i.productId === matchedProduct.id)
            : session.items.find(i => i.sku && i.sku.trim().toLowerCase() === needle);

        if (!item) {
            setScanNotice(`No product in this count matches “${raw}”.`);
            return;
        }

        // Clear filters so the row is guaranteed to be rendered, then focus it.
        setScanNotice(null);
        setFilter('all');
        setSearchTerm(item.sku || item.name);
        setTimeout(() => {
            const input = inputRefs.current[item.productId];
            input?.focus();
            input?.select();
            input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 100);
    };

    // Auto-dismiss the scan notice.
    useEffect(() => {
        if (!scanNotice) return;
        const t = setTimeout(() => setScanNotice(null), 4000);
        return () => clearTimeout(t);
    }, [scanNotice]);

    // Discrepancy at the item's own precision — 0 means the count matches.
    const discrepancyOf = (item: { productId: string; expected: number; counted: number | null }): number | null => {
        if (item.counted === null) return null;
        const kg = isKgItem(item.productId);
        return roundQty(roundQty(item.counted, kg) - roundQty(item.expected, kg), kg);
    };

    const { totalItems, countedItems, itemsWithDiscrepancy } = useMemo(() => {
        if (!session) return { totalItems: 0, countedItems: 0, itemsWithDiscrepancy: 0 };
        const total = session.items.length;
        const counted = session.items.filter(i => i.counted !== null).length;
        const discrepancy = session.items.filter(i => {
            const d = discrepancyOf(i);
            return d !== null && d !== 0;
        }).length;
        return { totalItems: total, countedItems: counted, itemsWithDiscrepancy: discrepancy };
    }, [session, unitById]);

    const filteredItems = useMemo(() => {
        if (!session) return [];
        return session.items.filter(item => {
            const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.sku ? item.sku.toLowerCase().includes(searchTerm.toLowerCase()) : false);
            if (!searchMatch) return false;
            const d = discrepancyOf(item);
            switch (filter) {
                case 'counted': return item.counted !== null;
                case 'uncounted': return item.counted === null;
                case 'discrepancy': return d !== null && d !== 0;
                default: return true;
            }
        });
    }, [session, filter, searchTerm, unitById]);

    /* ── Empty state — no active session ── */
    if (!session) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background p-8">
                <div className="max-w-md w-full text-center p-10 rounded-lg bg-surface border border-brand-border shadow-sm">
                    <div className="mx-auto h-16 w-16 rounded-lg bg-sp-navy-soft flex items-center justify-center mb-6">
                        <ClipboardDocumentListIcon className="h-8 w-8 text-sp-navy" />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-text tracking-tight">Stock Counts</h2>
                    <p className="mt-3 text-brand-text-muted font-medium">Verify your inventory by starting a physical stock count.</p>
                    <div className="mt-8">
                        <button
                            type="button"
                            onClick={onStart}
                            className="w-full inline-flex items-center justify-center rounded-lg bg-sp-orange px-6 py-4 text-sm font-bold text-white shadow-sm hover:bg-sp-orange-light transition-all uppercase tracking-widest active:scale-95 duration-300"
                        >
                            Start New Stock Take
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const uncountedCount = totalItems - countedItems;
    const progressPct = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;

    /* Stat cards double as the list filters — click to focus a slice. */
    const STATS: { id: string; label: string; value: number; tone: string }[] = [
        { id: 'all', label: 'All Items', value: totalItems, tone: 'text-sp-navy' },
        { id: 'counted', label: 'Counted', value: countedItems, tone: 'text-success' },
        { id: 'uncounted', label: 'Uncounted', value: uncountedCount, tone: 'text-brand-text-muted' },
        { id: 'discrepancy', label: 'Discrepancies', value: itemsWithDiscrepancy, tone: 'text-danger' },
    ];

    const DiscrepancyChip: React.FC<{ value: number | null; kg: boolean }> = ({ value, kg }) => {
        if (value === null) return <span className="text-brand-text-muted/50 text-sm font-bold">—</span>;
        if (value === 0) {
            return <span className="inline-flex px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-success/15 text-success">Match</span>;
        }
        const over = value > 0;
        return (
            <span className={`inline-flex px-2.5 py-1 rounded-xl text-[11px] font-bold tracking-wider tnum ${over ? 'bg-sp-navy-soft text-sp-navy' : 'bg-danger/15 text-danger'}`}>
                {over ? '+' : '−'}{fmtQty(Math.abs(value), kg)}{kg ? ' kg' : ''}
            </span>
        );
    };

    const countInput = (item: { productId: string; counted: number | null }, kg: boolean) => (
        <div className="inline-flex items-center gap-1.5">
            <input
                ref={el => { inputRefs.current[item.productId] = el; }}
                type="text"
                inputMode={kg ? 'decimal' : 'numeric'}
                value={drafts[item.productId] ?? (item.counted === null ? '' : fmtQty(item.counted, kg))}
                onChange={e => handleCountChange(item.productId, e.target.value)}
                onBlur={() => handleCountBlur(item.productId)}
                placeholder={kg ? '0.00' : '0'}
                className="block w-24 h-12 px-3 bg-surface border border-brand-border rounded-lg text-center font-bold text-brand-text placeholder-brand-text-muted/40 focus:outline-none focus:ring-1 focus:ring-sp-orange focus:border-sp-orange transition-all text-sm tnum"
            />
            <span className="text-[11px] font-bold text-brand-text-muted w-6 text-left">{kg ? 'kg' : ''}</span>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background">
            {/* ── Header: title, progress and session actions ── */}
            <header className="z-10 px-4 md:px-6 pt-6 pb-4 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-[28px] font-bold text-brand-text tracking-tight">Stock Take in Progress</h1>
                        <p className="text-sm font-medium text-brand-text-muted mt-1">Started {new Date(session.startTime).toLocaleString()}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                        <button
                            onClick={handleCancel}
                            type="button"
                            className="inline-flex items-center gap-x-1.5 rounded-lg border border-sp-navy/30 bg-surface px-5 py-3 text-xs font-bold text-sp-navy hover:bg-sp-navy-soft transition-all uppercase tracking-widest active:scale-95 duration-300"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            onClick={() => setIsFinalizeModalOpen(true)}
                            type="button"
                            className="rounded-lg bg-sp-orange px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-sp-orange-light transition-all uppercase tracking-widest active:scale-95 duration-300"
                        >
                            Complete Count
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="bg-surface border border-brand-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-brand-text-muted">Counting progress</span>
                        <span className="text-sm font-bold text-brand-text tnum">{countedItems} / {totalItems} <span className="text-brand-text-muted font-medium">({progressPct}%)</span></span>
                    </div>
                    <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                        <div className="h-full bg-sp-navy rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>

                {/* Stat cards = filters (active card gets the 2px navy border) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STATS.map(s => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setFilter(s.id)}
                            aria-pressed={filter === s.id}
                            className={`text-left bg-surface rounded-lg p-4 transition-all active:scale-[0.98] ${filter === s.id
                                ? 'border-2 border-sp-navy shadow-sm'
                                : 'border border-brand-border hover:shadow-sm'}`}
                        >
                            <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-brand-text-muted mb-1">{s.label}</span>
                            <span className={`block text-2xl font-bold tracking-tight tnum ${s.tone}`}>{s.value}</span>
                        </button>
                    ))}
                </div>

                {/* Search + scan */}
                <div className="flex items-center gap-2 max-w-xl">
                    <div className="relative group flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                            <svg className="w-5 h-5 text-brand-text-muted group-focus-within:text-sp-orange transition-colors" viewBox="0 0 24 24" fill="none">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search products by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="block w-full h-12 pl-12 pr-4 bg-surface border border-brand-border rounded-lg text-brand-text placeholder-brand-text-muted focus:outline-none focus:ring-1 focus:ring-sp-orange focus:border-sp-orange transition-all font-medium text-sm"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="h-12 px-4 inline-flex items-center gap-2 rounded-lg bg-sp-navy text-white text-sm font-bold hover:bg-sp-navy-light transition-all active:scale-95 duration-300 flex-shrink-0"
                        title="Scan a product barcode to jump to its count"
                    >
                        <QrCodeIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Scan</span>
                    </button>
                </div>
                {scanNotice && (
                    <div className="max-w-xl px-4 py-2.5 rounded-lg bg-danger/15 text-danger text-sm font-medium" role="status">
                        {scanNotice}
                    </div>
                )}
            </header>

            {/* ── Count list ── */}
            <main className="flex-1 flex flex-col overflow-hidden px-4 md:px-6 pb-6">
                <div className="flex-1 flex flex-col min-h-0 bg-surface border border-brand-border rounded-lg overflow-hidden">
                    <div className="overflow-auto flex-1 premium-scrollbar">
                        {/* Desktop table */}
                        <table className="min-w-full hidden md:table">
                            <thead className="bg-surface-variant sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="py-4 pl-6 pr-4 text-left text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em] w-2/5">Product</th>
                                    <th scope="col" className="px-4 py-4 text-left text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]">SKU</th>
                                    <th scope="col" className="px-4 py-4 text-center text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Expected</th>
                                    <th scope="col" className="px-4 py-4 text-center text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Counted</th>
                                    <th scope="col" className="px-4 py-4 text-center text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Discrepancy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {filteredItems.length > 0 ? filteredItems.map((item) => {
                                    const kg = isKgItem(item.productId);
                                    const discrepancy = discrepancyOf(item);
                                    const rowTone = discrepancy === null ? '' : discrepancy === 0 ? 'bg-success/5' : 'bg-danger/5';
                                    return (
                                        <tr key={item.productId} className={`group hover:bg-surface-variant/40 transition-colors ${rowTone}`}>
                                            <td className="py-3.5 pl-6 pr-4 text-sm font-bold text-brand-text">
                                                {item.name}
                                                {kg && <span className="ml-2 text-[10px] font-bold text-brand-text-muted uppercase tracking-wider bg-surface-variant px-1.5 py-0.5 rounded">kg</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-brand-text-muted">{item.sku || '—'}</td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-center text-sm font-bold text-brand-text tnum">{fmtQty(item.expected, kg)}</td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-center">{countInput(item, kg)}</td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-center"><DiscrepancyChip value={discrepancy} kg={kg} /></td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-20">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-lg bg-surface-variant flex items-center justify-center mb-4">
                                                    <HiOutlineXMark className="w-8 h-8 text-brand-text-muted/40" />
                                                </div>
                                                <p className="text-sm font-bold text-brand-text-muted uppercase tracking-widest">No products found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-brand-border">
                            {filteredItems.length > 0 ? filteredItems.map((item) => {
                                const kg = isKgItem(item.productId);
                                const discrepancy = discrepancyOf(item);
                                return (
                                    <div key={item.productId} className={`p-4 flex items-center gap-3 ${discrepancy === null ? '' : discrepancy === 0 ? 'bg-success/5' : 'bg-danger/5'}`}>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-brand-text truncate">{item.name}</p>
                                            <p className="text-xs text-brand-text-muted mt-0.5">
                                                {item.sku ? `${item.sku} · ` : ''}Expected <span className="font-bold text-brand-text tnum">{fmtQty(item.expected, kg)}{kg ? ' kg' : ''}</span>
                                            </p>
                                            <div className="mt-1.5"><DiscrepancyChip value={discrepancy} kg={kg} /></div>
                                        </div>
                                        <div className="flex-shrink-0">{countInput(item, kg)}</div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-20">
                                    <p className="text-sm font-bold text-brand-text-muted uppercase tracking-widest">No products found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <ConfirmationModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title="Cancel Stock Take"
                message="Are you sure you want to cancel this stock take? All progress will be lost and this session will be discarded."
                confirmText="Yes, Cancel"
                cancelText="No, Keep It"
                confirmButtonClass="bg-danger hover:bg-danger/90 rounded-lg p-4 font-black uppercase tracking-widest text-[10px]"
                variant="floating"
            />
            {isScannerOpen && (
                <Suspense fallback={null}>
                    <UnifiedScannerModal
                        isOpen={isScannerOpen}
                        onClose={() => setIsScannerOpen(false)}
                        onScanSuccess={handleScanSuccess}
                        title="Scan Product to Count"
                    />
                </Suspense>
            )}
            <ConfirmationModal
                isOpen={isFinalizeModalOpen}
                onClose={() => setIsFinalizeModalOpen(false)}
                onConfirm={handleConfirmFinalize}
                title="Complete Stock Take"
                message={uncountedCount > 0
                    ? `${uncountedCount} item${uncountedCount === 1 ? ' is' : 's are'} still uncounted and will not be adjusted. Completing the count will update inventory levels for the ${countedItems} counted item${countedItems === 1 ? '' : 's'}.`
                    : 'This will update your inventory levels to the counted quantities.'}
                confirmText="Complete Count"
                cancelText="Keep Counting"
                confirmButtonClass="bg-sp-orange hover:bg-sp-orange-light rounded-lg p-4 font-black uppercase tracking-widest text-[10px]"
                variant="floating"
            />
        </div>
    );
};

export default StockTakePage;
