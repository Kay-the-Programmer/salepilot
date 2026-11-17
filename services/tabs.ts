/**
 * Open bills (restaurants, bars, cafes).
 *
 * Every call here passes `skipQueue`. A bill is SHARED STATE: the waiter who
 * opened Table 4 is not the only person who will touch it, so a write that
 * silently sits in the offline queue is worse than one that fails loudly. A
 * queued "add two beers" replayed twenty minutes later lands on a bill that has
 * already been paid, and the till that queued it spent the whole time showing a
 * round nobody in the kitchen ever saw.
 *
 * Ordinary offline SALES are unaffected and still queue as they always have —
 * it is only bills, which other devices read, that insist on a connection.
 */
import { api } from './api';
import type { OpenTab } from '../types';

const BASE = '/hospitality/tabs';

/** Shared writes must not be deferred — see the note at the top of this file. */
const NO_QUEUE = { skipQueue: true } as const;

export interface TabLineInput {
    productId: string;
    quantity: number;
}

/**
 * Bills to show on the till. 'live' is open plus settling: a bill another till
 * is in the middle of paying still belongs on the floor plan, greyed out,
 * rather than vanishing and reappearing.
 */
export const listTabs = async (status: 'live' | 'open' | 'closed' | 'void' | 'all' = 'live'): Promise<OpenTab[]> => {
    const rows = await api.get<OpenTab[]>(`${BASE}?status=${encodeURIComponent(status)}`);
    return Array.isArray(rows) ? rows : [];
};

export const getTab = (id: string): Promise<OpenTab> =>
    api.get<OpenTab>(`${BASE}/${encodeURIComponent(id)}`);

/** Open a bill, optionally with the first round already on it. */
export const openTab = (input: { label: string; items?: TabLineInput[]; customerId?: string; note?: string }) =>
    api.post<OpenTab>(BASE, input, NO_QUEUE) as Promise<OpenTab>;

export const addToTab = (id: string, items: TabLineInput[]) =>
    api.post<OpenTab>(`${BASE}/${encodeURIComponent(id)}/items`, { items }, NO_QUEUE) as Promise<OpenTab>;

/** Zero removes the line, which is what tapping "−" down to nothing means. */
export const setTabItemQuantity = (id: string, itemId: string, quantity: number) =>
    api.patch<OpenTab>(
        `${BASE}/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
        { quantity },
        NO_QUEUE,
    ) as Promise<OpenTab>;

/**
 * Claim a bill before posting its sale.
 *
 * This is what stops two tills charging one table twice: the server hands the
 * claim to exactly one of them and answers the other with a 409. Always pair it
 * with `releaseTab` on failure, or the bill is stranded mid-payment.
 */
export const claimTab = (id: string) =>
    api.post<OpenTab>(`${BASE}/${encodeURIComponent(id)}/claim`, {}, NO_QUEUE) as Promise<OpenTab>;

export const releaseTab = (id: string) =>
    api.post<OpenTab>(`${BASE}/${encodeURIComponent(id)}/release`, {}, NO_QUEUE) as Promise<OpenTab>;

/** The sale went through; file the bill against it. */
export const closeTab = (id: string, saleId: string) =>
    api.post<OpenTab>(`${BASE}/${encodeURIComponent(id)}/close`, { saleId }, NO_QUEUE) as Promise<OpenTab>;

/** Write a bill off unpaid — a walkout, or a mis-keyed order. Manager only. */
export const voidTab = (id: string, reason: string) =>
    api.post<OpenTab>(`${BASE}/${encodeURIComponent(id)}/void`, { reason }, NO_QUEUE) as Promise<OpenTab>;

/**
 * Does this error mean somebody else got there first?
 *
 * The code is read off `HttpError.body`, which is where services/api.ts puts
 * the server's payload.
 */
export const isTabConflict = (err: any): boolean =>
    err?.status === 409 ||
    ['TAB_NOT_OPEN', 'TAB_ALREADY_CLOSED', 'TAB_LABEL_TAKEN', 'TAB_NOT_SETTLING'].includes(err?.body?.code);

/** The server's own wording, which is written for the person at the till. */
export const tabErrorMessage = (err: any, fallback: string): string =>
    (typeof err?.body?.message === 'string' && err.body.message) || err?.message || fallback;
