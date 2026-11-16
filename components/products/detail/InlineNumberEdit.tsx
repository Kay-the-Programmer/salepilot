import React, { useEffect, useRef, useState } from 'react';

/**
 * A number shown as text that turns into an input on tap.
 *
 * Tap the value, type, press Enter (or tap away) — saved. Escape cancels.
 * Used for the handful of fields people change all the time (price, cost,
 * reorder level) so they never have to open the full edit form for them.
 */
const InlineNumberEdit: React.FC<{
    /** Accessible name, e.g. "Retail price". */
    label: string;
    value: number;
    /** How the value reads when not editing. */
    display: React.ReactNode;
    onSave: (next: number) => Promise<void>;
    /** Decimal places allowed; 0 for whole numbers. */
    decimals?: number;
    min?: number;
    disabled?: boolean;
    className?: string;
}> = ({ label, value, display, onSave, decimals = 2, min = 0, disabled, className = '' }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.select(); });
    }, [editing]);

    const start = () => {
        if (disabled) return;
        setDraft(value ? String(value) : '');
        setError(null);
        setEditing(true);
    };

    const commit = async () => {
        const n = parseFloat(draft);
        if (draft.trim() === '' || !Number.isFinite(n) || n < min) {
            setError(`Enter ${min > 0 ? `at least ${min}` : 'a number'}`);
            return;
        }
        const rounded = decimals === 0 ? Math.round(n) : Math.round(n * 10 ** decimals) / 10 ** decimals;
        if (rounded === value) { setEditing(false); return; }
        setSaving(true);
        try {
            await onSave(rounded);
            setEditing(false);
        } catch {
            setError('Could not save — try again');
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <button
                type="button"
                onClick={start}
                disabled={disabled}
                aria-label={`${label}: tap to change`}
                className={`group/edit inline-flex items-center gap-1.5 text-left rounded-md -mx-1 px-1 hover:bg-surface/70 disabled:cursor-default ${className}`}
            >
                {display}
                {!disabled && (
                    <svg aria-hidden className="w-3.5 h-3.5 text-brand-text-muted opacity-60 group-hover/edit:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                )}
            </button>
        );
    }

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); void commit(); }}
            className="flex flex-col gap-1"
        >
            <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                step={decimals === 0 ? 1 : 1 / 10 ** decimals}
                min={min}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setEditing(false); } }}
                onBlur={() => { if (!saving) void commit(); }}
                disabled={saving}
                aria-label={label}
                aria-invalid={!!error}
                className="w-full h-9 px-2 text-lg font-bold tabular-nums rounded-md border border-secondary bg-surface text-brand-text outline-none focus:ring-2 focus:ring-secondary/20"
            />
            {error && <span role="alert" className="text-[11px] font-medium text-danger">{error}</span>}
        </form>
    );
};

export default InlineNumberEdit;
