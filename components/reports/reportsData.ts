import { api } from '../../services/api';

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; promise: Promise<any> }>();

/**
 * Shared, de-duplicated fetch for /reports/dashboard. The Reports overview
 * renders many cards whose default time filter resolves to the same date
 * range; without this each card issued its own identical request (8+ per
 * page view). Concurrent callers share one in-flight promise; results are
 * reused for a short TTL, and failures are evicted so a retry refetches.
 */
export const fetchDashboardRange = (startDate: string, endDate: string): Promise<any> => {
    const key = `${startDate}|${endDate}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;
    const promise = api.get<any>(`/reports/dashboard?startDate=${startDate}&endDate=${endDate}`)
        .catch((err) => { cache.delete(key); throw err; });
    cache.set(key, { at: Date.now(), promise });
    return promise;
};

/**
 * Drop every cached range. Call after something moves a figure between periods
 * — correcting a sale's date is the case this exists for: without it the cards
 * would keep showing the sale on its old day for up to the TTL.
 */
export const invalidateDashboardCache = (): void => {
    cache.clear();
};
