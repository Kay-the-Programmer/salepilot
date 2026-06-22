/**
 * Shared date formatting helpers.
 *
 * Centralises the date-formatting logic that was previously re-implemented as
 * local `formatDate` functions across many pages/components. Each helper is
 * null/invalid-safe and returns a caller-chosen fallback so it can drop into
 * existing call sites unchanged.
 */

const toDate = (input?: string | number | Date | null): Date | null => {
    if (input === null || input === undefined || input === '') return null;
    const d = input instanceof Date ? input : new Date(input);
    return isNaN(d.getTime()) ? null : d;
};

/** Short date, e.g. "Jun 23, 2026". */
export const formatDate = (input?: string | number | Date | null, fallback = '—'): string => {
    const d = toDate(input);
    return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : fallback;
};

/** Long date, e.g. "June 23, 2026". */
export const formatLongDate = (input?: string | number | Date | null, fallback = '—'): string => {
    const d = toDate(input);
    return d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : fallback;
};

/** Date + time, e.g. "Jun 23, 2026, 2:30 PM". */
export const formatDateTime = (input?: string | number | Date | null, fallback = '—'): string => {
    const d = toDate(input);
    return d ? d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : fallback;
};

/**
 * Relative time for recent activity ("5m ago" / "3h ago" / "2d ago"), falling
 * back to a short date older than a week (year omitted when it's the current year).
 */
export const formatRelativeDate = (input?: string | number | Date | null, fallback = '—'): string => {
    const date = toDate(input);
    if (!date) return fallback;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
};
