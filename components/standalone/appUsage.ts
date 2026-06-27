/**
 * Lightweight, on-device app-usage tracking that powers the "Suggested" row in
 * the app switcher. Stored in localStorage (no backend) — every time the user
 * opens an app or launches one from the switcher we bump a recency-weighted
 * counter, and the switcher surfaces the highest-scoring apps first.
 */
const KEY = 'sp_app_usage_v1';
const DAY = 86400000;

interface UsageEntry { count: number; last: number }
type UsageMap = Record<string, UsageEntry>;

const read = (): UsageMap => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch { return {}; }
};

const write = (u: UsageMap) => {
    try { localStorage.setItem(KEY, JSON.stringify(u)); } catch { /* ignore */ }
};

/** Record that the user opened/used an app (by its route, e.g. 'crm'). */
export const recordAppUse = (route?: string | null) => {
    if (!route) return;
    const u = read();
    const cur = u[route] || { count: 0, last: 0 };
    u[route] = { count: cur.count + 1, last: Date.now() };
    write(u);
};

/**
 * The user's most-used apps, recency-weighted, restricted to `routes` they can
 * open. Returns at most `limit` routes; empty until there's a real signal so the
 * switcher only shows suggestions once they mean something.
 */
export const getSuggestedRoutes = (routes: string[], limit = 4): string[] => {
    const u = read();
    const now = Date.now();
    return routes
        .filter(r => u[r])
        .map(r => {
            const { count, last } = u[r];
            const recency = Math.exp(-((now - last) / DAY) / 14); // ~2-week decay
            return { r, score: count * (0.5 + 0.5 * recency) };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.r);
};
