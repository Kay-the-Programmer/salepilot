import React, { useEffect, useState } from 'react';

export interface DateRange {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const startOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
const iso = (d: Date) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().split('T')[0];
};

const PRESETS: { key: string; label: string; range: () => { start: Date; end: Date } }[] = [
  { key: 'this_month', label: 'This month', range: () => { const n = new Date(); return { start: startOfMonth(n), end: n }; } },
  { key: 'last_month', label: 'Last month', range: () => { const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth() - 1, 1); return { start: s, end: endOfMonth(s) }; } },
  { key: 'this_quarter', label: 'This quarter', range: () => { const n = new Date(); return { start: startOfQuarter(n), end: n }; } },
  { key: 'this_year', label: 'This year', range: () => { const n = new Date(); return { start: new Date(n.getFullYear(), 0, 1), end: n }; } },
  { key: 'all', label: 'All time', range: () => ({ start: new Date(2000, 0, 1), end: new Date() }) },
];

export const defaultDateRange = (): DateRange => {
  const p = PRESETS[0];
  return { key: p.key, label: p.label, ...p.range() };
};

/**
 * Encapsulated date-range picker: a compact chip that opens a popover with
 * quick presets and a custom from/to range. Renders inline within the
 * `.sp-assistant` scope so the m3 tokens resolve.
 */
const AccountingDatePicker: React.FC<{ value: DateRange; onChange: (r: DateRange) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(iso(value.start));
  const [customEnd, setCustomEnd] = useState(iso(value.end));

  useEffect(() => {
    setCustomStart(iso(value.start));
    setCustomEnd(iso(value.end));
  }, [value]);

  const pickPreset = (p: typeof PRESETS[number]) => {
    onChange({ key: p.key, label: p.label, ...p.range() });
    setOpen(false);
  };

  const applyCustom = () => {
    const s = new Date(customStart);
    const e = new Date(customEnd);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return;
    onChange({ key: 'custom', label: `${s.toLocaleDateString()} – ${e.toLocaleDateString()}`, start: s, end: e });
    setOpen(false);
  };

  const dateInput = 'w-full px-2.5 py-2 rounded-lg text-xs font-medium m3-bg-surface-container m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] transition';

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold m3-bg-surface-lowest m3-text-on-surface border m3-border-outline-variant hover:m3-bg-surface-container transition active:scale-95"
      >
        <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 18 }}>calendar_month</span>
        <span className="whitespace-nowrap">{value.label}</span>
        <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 18, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }}>expand_more</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 z-30 m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-lg p-2 sp-fade-in">
            {PRESETS.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => pickPreset(p)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${value.key === p.key ? 'm3-bg-primary-fixed m3-text-primary' : 'm3-text-on-surface hover:m3-bg-surface-container'}`}
              >
                {p.label}
              </button>
            ))}

            <div className="border-t m3-border-outline-variant my-2" />

            <div className="px-1 pb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider m3-text-on-surface-variant mb-1.5">Custom range</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={customStart} max={customEnd} onChange={e => setCustomStart(e.target.value)} className={dateInput} />
                <input type="date" value={customEnd} min={customStart} onChange={e => setCustomEnd(e.target.value)} className={dateInput} />
              </div>
              <button
                type="button"
                onClick={applyCustom}
                className="w-full mt-2 py-2 rounded-lg text-xs font-bold m3-bg-primary m3-text-on-primary active:scale-95 transition"
              >
                Apply range
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountingDatePicker;
