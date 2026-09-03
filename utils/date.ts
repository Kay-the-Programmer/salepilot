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

/**
 * A calendar day as `YYYY-MM-DD`, in the viewer's own timezone.
 *
 * The tempting one-liner — `new Date().toISOString().slice(0, 10)` — is wrong,
 * and wrong in a way that only shows up early in the morning. `toISOString`
 * reports UTC, so anywhere ahead of it (Zambia is UTC+2) that expression
 * returns *yesterday* until 2am: a form defaulting to "today" opens on the
 * wrong day and the expense is filed against it.
 *
 * It is worse for a constructed date. `new Date(y, m, 1)` is local midnight on
 * the 1st, which in UTC is the 30th or 31st at 22:00 — so a "this month" range
 * built that way starts in the previous month.
 *
 * Reading the local components avoids both. Use this anywhere a date feeds an
 * `<input type="date">` or a date-only query parameter.
 */
export const toDateInputValue = (input?: string | number | Date | null): string => {
    const d = toDate(input) ?? new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
