import React, { useState } from 'react';
import { OpenTab, StoreSettings } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/currency';
import PosIcon from './PosIcon';

interface OpenTabsViewProps {
    tabs: OpenTab[];
    loading: boolean;
    error: string | null;
    storeSettings: StoreSettings;
    /** What this venue calls a bill — Table, Tab or Order. */
    noun: { one: string; many: string };
    /** Can this user write off an unpaid bill? */
    canVoid: boolean;
    onRefresh: () => void;
    onOpenBill: (tab: OpenTab) => void;
    onPrintBill: (tab: OpenTab) => void;
    onVoidBill: (tab: OpenTab, reason: string) => void;
    onStartSelling: () => void;
}

/** "17 minutes" rather than a timestamp — on a floor, age is what matters. */
const ageOf = (iso: string): string => {
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

/**
 * The open bills on the floor.
 *
 * This is the screen a waiter lives on: which tables are running, how long they
 * have been there, and what they owe so far. Deliberately a list and not a
 * floor plan — a floor plan has to be drawn and maintained before anyone can
 * take an order, and a venue that has just installed a till wants to serve the
 * room tonight.
 */
export const OpenTabsView: React.FC<OpenTabsViewProps> = ({
    tabs, loading, error, storeSettings, noun, canVoid,
    onRefresh, onOpenBill, onPrintBill, onVoidBill, onStartSelling,
}) => {
    const [voiding, setVoiding] = useState<OpenTab | null>(null);
    const [reason, setReason] = useState('');

    const money = (n: number) => formatCurrency(n, storeSettings);
    const total = tabs.reduce((sum, t) => sum + t.subtotal, 0);

    return (
        <div className="tabs-view">
            <div className="tabs-view__head">
                <div>
                    <h2 className="tabs-view__title">
                        {tabs.length} open {tabs.length === 1 ? noun.one.toLowerCase() : noun.many.toLowerCase()}
                    </h2>
                    {tabs.length > 0 && (
                        <p className="tabs-view__sub">{money(total)} on the floor</p>
                    )}
                </div>
                <button type="button" className="tabs-view__refresh" onClick={onRefresh} disabled={loading}>
                    <PosIcon name="refresh" size={18} /> {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div className="tabs-view__error" role="alert">
                    <PosIcon name="cloud_off" size={20} />
                    <div>
                        <p style={{ fontWeight: 700 }}>{error}</p>
                        <p>
                            Bills are shared between your tills, so they need a connection. You can still
                            ring up and take payment for a sale right now.
                        </p>
                    </div>
                </div>
            )}

            {!error && tabs.length === 0 && !loading && (
                <div className="tabs-view__empty">
                    <PosIcon name="receipt_long" size={40} />
                    <p style={{ fontWeight: 700 }}>No open {noun.many.toLowerCase()}</p>
                    <p style={{ marginTop: 4 }}>
                        Ring up an order, then tap “Save to {noun.one.toLowerCase()}” to keep it open and add to
                        it later.
                    </p>
                    <button type="button" className="v2-btn v2-btn--primary" style={{ marginTop: 16, minHeight: 48 }} onClick={onStartSelling}>
                        <PosIcon name="point_of_sale" size={20} /> Take an order
                    </button>
                </div>
            )}

            <ul className="tabs-view__list">
                {tabs.map(tab => {
                    const busy = tab.status === 'settling';
                    return (
                        <li key={tab.id} className={`tabcard${busy ? ' tabcard--busy' : ''}`}>
                            <button
                                type="button"
                                className="tabcard__main"
                                onClick={() => onOpenBill(tab)}
                                disabled={busy}
                                aria-label={`Open ${tab.label}`}
                            >
                                <span className="tabcard__label">{tab.label}</span>
                                <span className="tabcard__meta">
                                    {tab.itemCount} item{tab.itemCount === 1 ? '' : 's'} · {ageOf(tab.openedAt)}
                                    {tab.openedByName ? ` · ${tab.openedByName}` : ''}
                                </span>
                                {busy && <span className="tabcard__flag">Being paid at another till</span>}
                            </button>

                            <span className="tabcard__total">{money(tab.subtotal)}</span>

                            <span className="tabcard__actions">
                                <button
                                    type="button"
                                    title="Print the bill"
                                    aria-label={`Print the bill for ${tab.label}`}
                                    onClick={() => onPrintBill(tab)}
                                >
                                    <PosIcon name="print" size={20} />
                                </button>
                                {canVoid && (
                                    <button
                                        type="button"
                                        className="is-danger"
                                        title="Write this bill off unpaid"
                                        aria-label={`Write off ${tab.label}`}
                                        disabled={busy}
                                        onClick={() => { setVoiding(tab); setReason(''); }}
                                    >
                                        <PosIcon name="block" size={20} />
                                    </button>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {/* A reason is required and recorded: an unpaid bill with items on
                it is revenue the shop has decided not to collect. */}
            <Modal
                open={!!voiding}
                onClose={() => setVoiding(null)}
                size="sm"
                title={voiding ? `Write off ${voiding.label}?` : ''}
                // Same reason as the bill-naming dialog in SalesPage: the POS
                // puts fixed sheets at z-index 80, and the default z-50 would
                // hide this behind one.
                zIndexClass="z-[210]"
                sheet
            >
                <p className="text-sm text-brand-text-muted">
                    {voiding?.itemCount || 0} item{(voiding?.itemCount || 0) === 1 ? '' : 's'} worth{' '}
                    {voiding ? money(voiding.subtotal) : ''} will be written off. This is recorded against your
                    name and shows in the activity log.
                </p>
                <label className="block mt-4 text-sm font-semibold text-brand-text" htmlFor="void-reason">
                    Why?
                </label>
                <input
                    id="void-reason"
                    className="w-full mt-1.5 bg-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text outline-none focus:border-primary"
                    placeholder="Walked out, ordered by mistake…"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    autoFocus
                />
                <div className="flex gap-2 mt-5">
                    <button
                        type="button"
                        className="v2-btn tabs-view__void flex-1"
                        style={{ minHeight: 48 }}
                        disabled={!reason.trim()}
                        onClick={() => {
                            if (!voiding || !reason.trim()) return;
                            onVoidBill(voiding, reason.trim());
                            setVoiding(null);
                        }}
                    >
                        Write it off
                    </button>
                    <button type="button" className="v2-btn" style={{ minHeight: 48 }} onClick={() => setVoiding(null)}>
                        Keep it open
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default OpenTabsView;
