import React, { useMemo, useState } from 'react';
import { PurchaseOrder, StoreSettings, Supplier } from '../../types';
import { Icon } from '../crm/CrmBits';
import { parseApiDate } from '../crm/crmModel';
import { OPEN_STATUSES } from './procureModel';
import { downloadPurchaseOrdersReportPdf } from '../purchase-orders/poPdf';
import { useToast } from '../../contexts/ToastContext';
import './procure-order-form.css';

type Range = 'all' | 'this_month' | 'last_month' | 'last_90' | 'this_year' | 'custom';
type StatusFilter = 'all' | 'drafts' | 'open' | 'received' | 'canceled';

const RANGES: { id: Range; label: string }[] = [
    { id: 'all', label: 'All time' },
    { id: 'this_month', label: 'This month' },
    { id: 'last_month', label: 'Last month' },
    { id: 'last_90', label: 'Last 90 days' },
    { id: 'this_year', label: 'This year' },
    { id: 'custom', label: 'Choose dates' },
];
const STATUSES: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All statuses' },
    { id: 'open', label: 'Open' },
    { id: 'received', label: 'Received' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'canceled', label: 'Cancelled' },
];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** [from, to) in local time; null = unbounded. */
const boundsFor = (range: Range, from: string, to: string): [Date | null, Date | null] => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    switch (range) {
        case 'this_month': return [new Date(now.getFullYear(), now.getMonth(), 1), null];
        case 'last_month': return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 1)];
        case 'last_90': return [new Date(startOfDay(now).getTime() - 89 * 86400000), null];
        case 'this_year': return [new Date(now.getFullYear(), 0, 1), null];
        case 'custom': {
            const f = from ? new Date(`${from}T00:00:00`) : null;
            const t = to ? new Date(`${to}T00:00:00`) : null;
            return [f, t ? new Date(t.getTime() + 86400000) : null];
        }
        default: return [null, null];
    }
};

/**
 * Export purchase orders — past ones included — as one PDF: pick a period and
 * a status, then a summary list or every order in full.
 */
const ProcureExportPdf: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    storeSettings: StoreSettings;
    /** The list's current status filter, used as the starting choice. */
    initialStatus?: StatusFilter;
}> = ({ isOpen, onClose, purchaseOrders, suppliers, storeSettings, initialStatus = 'all' }) => {
    const { showToast } = useToast();
    const [range, setRange] = useState<Range>('all');
    const [status, setStatus] = useState<StatusFilter>(initialStatus);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState(ymd(new Date()));
    const [full, setFull] = useState(false);
    const [busy, setBusy] = useState(false);

    const [lo, hi] = boundsFor(range, from, to);

    const matching = useMemo(() => purchaseOrders.filter(po => {
        if (status === 'drafts' && po.status !== 'draft') return false;
        if (status === 'open' && !(OPEN_STATUSES.includes(po.status) && po.status !== 'draft')) return false;
        if (status === 'received' && po.status !== 'received') return false;
        if (status === 'canceled' && po.status !== 'canceled') return false;
        const d = parseApiDate(po.orderedAt || po.createdAt);
        if (!d) return range === 'all';
        if (lo && d < lo) return false;
        if (hi && d >= hi) return false;
        return true;
    }), [purchaseOrders, status, range, lo?.getTime(), hi?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isOpen) return null;

    const rangeLabel = range === 'all'
        ? 'All time'
        : `${lo ? fmt(lo) : 'Start'} – ${hi ? fmt(new Date(hi.getTime() - 86400000)) : fmt(new Date())}`;

    const download = async () => {
        if (busy || matching.length === 0) return;
        setBusy(true);
        try {
            await downloadPurchaseOrdersReportPdf(matching, suppliers, storeSettings, {
                rangeLabel,
                statusLabel: STATUSES.find(s => s.id === status)!.label,
                full,
            });
            onClose();
        } catch (err: any) {
            showToast(err?.message || 'Could not build the PDF.', 'error');
        } finally {
            setBusy(false);
        }
    };

    const chip = (on: boolean) => `pof-chip${on ? ' is-on' : ''}`;

    return (
        <div className="crm-modal-backdrop" onClick={() => { if (!busy) onClose(); }}>
            <div className="crm-modal pof" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Export purchase orders as PDF">
                <div className="crm-modal__bar">
                    <button type="button" className="crm-iconbtn" aria-label="Close" disabled={busy} onClick={onClose}><Icon name="close" /></button>
                    <h2 className="crm-modal__title">Export orders as PDF</h2>
                </div>
                <div className="crm-modal__body">
                    <div>
                        <span className="pof-label" style={{ marginBottom: 8 }}>Period</span>
                        <div className="pof-chips" role="radiogroup" aria-label="Period">
                            {RANGES.map(r => (
                                <button key={r.id} type="button" role="radio" aria-checked={range === r.id} className={chip(range === r.id)} onClick={() => setRange(r.id)}>{r.label}</button>
                            ))}
                        </div>
                        {range === 'custom' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span className="pof-label">From</span>
                                    <input type="date" className="crm-input" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span className="pof-label">To</span>
                                    <input type="date" className="crm-input" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} />
                                </label>
                            </div>
                        )}
                    </div>

                    <div>
                        <span className="pof-label" style={{ marginBottom: 8 }}>Orders</span>
                        <div className="pof-chips" role="radiogroup" aria-label="Status">
                            {STATUSES.map(s => (
                                <button key={s.id} type="button" role="radio" aria-checked={status === s.id} className={chip(status === s.id)} onClick={() => setStatus(s.id)}>{s.label}</button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="pof-label" style={{ marginBottom: 8 }}>Layout</span>
                        <div className="pof-export-choice" role="radiogroup" aria-label="Layout">
                            <button type="button" role="radio" aria-checked={!full} className={!full ? 'is-on' : ''} onClick={() => setFull(false)}>
                                <Icon name="list_alt" size={22} />
                                <span><b>Summary</b><small>Totals, suppliers and one line per order</small></span>
                            </button>
                            <button type="button" role="radio" aria-checked={full} className={full ? 'is-on' : ''} onClick={() => setFull(true)}>
                                <Icon name="description" size={22} />
                                <span><b>Every order in full</b><small>The summary, then each order on its own page</small></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="crm-modal__foot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 14, color: 'var(--c-on-surface-variant)' }}>
                        <b style={{ color: 'var(--c-on-bg)' }}>{matching.length}</b> order{matching.length === 1 ? '' : 's'} · {rangeLabel}
                    </span>
                    <button type="button" className="crm-btn crm-btn--primary" style={{ padding: '12px 22px', opacity: busy || matching.length === 0 ? 0.5 : 1 }} disabled={busy || matching.length === 0} onClick={download}>
                        <Icon name={busy ? 'hourglass_top' : 'picture_as_pdf'} size={20} /> {busy ? 'Building…' : 'Download PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProcureExportPdf;
