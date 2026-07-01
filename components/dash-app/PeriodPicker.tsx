import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../crm/CrmBits';
import { DashRange, DashPeriod, PERIOD_LABEL, presetRange, rangeLabel } from './dashboardModel';

const DAY = 86400000;
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const PRESETS: DashPeriod[] = ['today', 'week', 'month', 'last_month', 'quarter', 'year', 'all'];

interface PeriodPickerProps {
    range: DashRange;
    onRange: (r: DashRange) => void;
}

/**
 * Single-button reporting-period control: shows the active range and opens a
 * popover with quick presets (Day / Week / Month) plus a month calendar for
 * picking a custom day or date range. Replaces the old segmented control.
 */
export const PeriodPicker: React.FC<PeriodPickerProps> = ({ range, onRange }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    const seed = range.kind === 'custom' ? range.start : Date.now();
    const [viewMonth, setViewMonth] = useState(() => { const d = new Date(seed); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); });
    // Pending custom selection (inclusive start/end days) while picking.
    const [selStart, setSelStart] = useState<number | null>(range.kind === 'custom' ? startOfDay(range.start) : null);
    const [selEnd, setSelEnd] = useState<number | null>(range.kind === 'custom' ? startOfDay(range.end - DAY) : null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);

    const choosePreset = (p: DashPeriod) => { setSelStart(null); setSelEnd(null); onRange(presetRange(p)); setOpen(false); };

    const clickDay = (ts: number) => {
        const d = startOfDay(ts);
        if (selStart === null || selEnd !== null) {
            // Begin a new selection.
            setSelStart(d);
            setSelEnd(null);
        } else {
            // Complete the range (same day twice = a single day).
            let a = selStart, b = d;
            if (b < a) [a, b] = [b, a];
            setSelStart(a);
            setSelEnd(b);
            onRange({ kind: 'custom', start: a, end: b + DAY });
            setOpen(false);
        }
    };

    const { cells, monthLabel, year, month } = useMemo(() => {
        const vm = new Date(viewMonth);
        const y = vm.getFullYear(), m = vm.getMonth();
        const firstDow = new Date(y, m, 1).getDay();
        const days = new Date(y, m + 1, 0).getDate();
        const arr: (number | null)[] = [];
        for (let i = 0; i < firstDow; i++) arr.push(null);
        for (let d = 1; d <= days; d++) arr.push(new Date(y, m, d).getTime());
        return { cells: arr, monthLabel: vm.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), year: y, month: m };
    }, [viewMonth]);

    const todayTs = startOfDay(Date.now());
    const now = Date.now();
    const inSel = (ts: number) => {
        const d = startOfDay(ts);
        if (selStart !== null && selEnd !== null) return d >= selStart && d <= selEnd;
        if (selStart !== null) return d === selStart;
        return false;
    };
    const activePreset = range.kind === 'preset' ? range.preset : null;

    return (
        <div className="dash-period" ref={wrapRef}>
            <button type="button" className={`dash-period__btn${open ? ' is-open' : ''}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(o => !o)}>
                <Icon name="calendar_month" size={18} />
                <span className="dash-period__label">{rangeLabel(range)}</span>
                <Icon name="expand_more" size={18} />
            </button>

            {open && (
                <div className="dash-period__pop" role="dialog" aria-label="Choose reporting period">
                    <div className="dash-period__presets">
                        {PRESETS.map(p => (
                            <button key={p} type="button" className={`dash-period__preset${activePreset === p ? ' is-active' : ''}`} onClick={() => choosePreset(p)}>
                                {PERIOD_LABEL[p]}
                            </button>
                        ))}
                    </div>

                    <div className="dash-period__calhead">
                        <button type="button" className="dash-period__nav" aria-label="Previous month" onClick={() => setViewMonth(new Date(year, month - 1, 1).getTime())}>
                            <Icon name="chevron_left" size={20} />
                        </button>
                        <span className="dash-period__month">{monthLabel}</span>
                        <button type="button" className="dash-period__nav" aria-label="Next month" onClick={() => setViewMonth(new Date(year, month + 1, 1).getTime())}>
                            <Icon name="chevron_right" size={20} />
                        </button>
                    </div>

                    <div className="dash-period__grid dash-period__grid--dow">
                        {WEEKDAYS.map(w => <span key={w} className="dash-period__dow">{w}</span>)}
                    </div>
                    <div className="dash-period__grid">
                        {cells.map((ts, i) => ts === null ? <span key={i} /> : (
                            <button
                                key={i}
                                type="button"
                                disabled={ts > now}
                                className={`dash-period__day${inSel(ts) ? ' is-sel' : ''}${startOfDay(ts) === todayTs ? ' is-today' : ''}`}
                                onClick={() => clickDay(ts)}
                            >
                                {new Date(ts).getDate()}
                            </button>
                        ))}
                    </div>

                    <p className="dash-period__hint">
                        {selStart !== null && selEnd === null
                            ? 'Now pick an end date (or the same day for one day).'
                            : 'Pick a day, or a start then end date.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PeriodPicker;
