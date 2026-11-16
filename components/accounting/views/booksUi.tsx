import React, { useState } from 'react';
import { PERIOD_PRESETS, PeriodPreset, presetDates } from '../booksApi';

/** Shared bits for the Books report screens. */

export const usePeriod = (initial: PeriodPreset = 'this_month') => {
    const [preset, setPreset] = useState<PeriodPreset>(initial);
    const [range, setRange] = useState(() => presetDates(initial)!);
    const choose = (p: PeriodPreset) => {
        setPreset(p);
        const d = presetDates(p);
        if (d) setRange(d);
    };
    return { preset, from: range.from, to: range.to, choose, setRange: (r: { from: string; to: string }) => { setPreset('custom'); setRange(r); } };
};

const dateInput = 'px-3 py-2 text-sm rounded-xl border m3-border-outline-variant m3-bg-surface-lowest m3-text-on-surface focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)]';

export const PeriodPicker: React.FC<{ period: ReturnType<typeof usePeriod> }> = ({ period }) => (
    <div className="flex flex-wrap items-center gap-2">
        <select
            aria-label="Period"
            value={period.preset}
            onChange={e => period.choose(e.target.value as PeriodPreset)}
            className={dateInput}
        >
            {PERIOD_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {period.preset === 'custom' && (
            <>
                <input type="date" aria-label="From" value={period.from} max={period.to}
                    onChange={e => period.setRange({ from: e.target.value, to: period.to })} className={dateInput} />
                <span className="text-sm m3-text-on-surface-variant">to</span>
                <input type="date" aria-label="To" value={period.to} min={period.from}
                    onChange={e => period.setRange({ from: period.from, to: e.target.value })} className={dateInput} />
            </>
        )}
    </div>
);

export const DateField: React.FC<{ label: string; value: string; onChange: (v: string) => void; max?: string }> = ({ label, value, onChange, max }) => (
    <label className="flex items-center gap-2 text-sm m3-text-on-surface-variant">
        {label}
        <input type="date" value={value} max={max} onChange={e => onChange(e.target.value)} className={dateInput} />
    </label>
);

export const Card: React.FC<{ title?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, right, children, className = '' }) => (
    <section className={`m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant overflow-hidden ${className}`}>
        {(title || right) && (
            <header className="px-4 py-3 border-b m3-border-outline-variant flex items-center justify-between gap-3">
                <h4 className="font-bold m3-text-on-surface text-sm">{title}</h4>
                {right && <div className="text-sm font-bold m3-text-on-surface tabular-nums">{right}</div>}
            </header>
        )}
        {children}
    </section>
);

export const Row: React.FC<{ label: React.ReactNode; value: React.ReactNode; strong?: boolean; muted?: boolean; hint?: string }> = ({ label, value, strong, muted, hint }) => (
    <div className={`flex items-baseline justify-between gap-4 px-4 py-2 ${strong ? 'border-t m3-border-outline-variant' : ''}`}>
        <span className={`text-sm ${strong ? 'font-bold m3-text-on-surface' : muted ? 'm3-text-on-surface-variant' : 'm3-text-on-surface'}`}>
            {label}
            {hint && <span className="block text-xs font-normal m3-text-on-surface-variant">{hint}</span>}
        </span>
        <span className={`text-sm tabular-nums whitespace-nowrap ${strong ? 'font-bold m3-text-on-surface' : 'm3-text-on-surface'}`}>{value}</span>
    </div>
);

export const Segmented = <T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) => (
    <div role="tablist" className="inline-flex flex-wrap gap-1 p-1 rounded-xl m3-bg-surface-container">
        {options.map(o => (
            <button
                key={o.id}
                role="tab"
                aria-selected={value === o.id}
                onClick={() => onChange(o.id)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${value === o.id ? 'm3-bg-surface-lowest m3-text-primary shadow-sm' : 'm3-text-on-surface-variant hover:m3-text-on-surface'}`}
            >
                {o.label}
            </button>
        ))}
    </div>
);

export const ExportButton: React.FC<{ onClick: () => void; disabled?: boolean }> = ({ onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="px-3 py-2 text-sm font-semibold rounded-xl border m3-border-outline-variant m3-text-on-surface hover:m3-bg-surface-container disabled:opacity-50"
    >
        Export CSV
    </button>
);

export const LoadState: React.FC<{ loading: boolean; error: string | null; onRetry: () => void }> = ({ loading, error, onRetry }) => {
    if (error) return (
        <div className="p-6 text-center text-sm m3-text-error">
            {error} <button className="underline font-semibold ml-1" onClick={onRetry}>Try again</button>
        </div>
    );
    if (loading) return <div className="p-6 text-center text-sm m3-text-on-surface-variant">Loading…</div>;
    return null;
};
