import { api } from './api';

/**
 * The till — a cashier's shift at one cash drawer.
 *
 * Deliberately thin. Everything that decides a number lives on the server:
 * the expected cash, the variance, and which sales belong to which session are
 * all computed there, so an offline till, the desktop app and this one cannot
 * disagree about how much money should be in the drawer.
 */

export interface CashMovement {
    id: string;
    type: 'pay_in' | 'pay_out';
    amount: number;
    reason: string;
    createdAt: string;
    createdBy: string | null;
}

export interface CashSession {
    id: string;
    openedBy: string;
    openedAt: string;
    openingFloat: number;
    closedBy: string | null;
    closedAt: string | null;
    countedCash: number | null;
    /**
     * What the drawer should hold.
     *
     * Null while the session is open and the caller is the cashier running it:
     * a count made against a figure you have just been shown is not a check on
     * anything. It arrives with the close, alongside the variance.
     */
    expectedCash: number | null;
    variance: number | null;
    status: 'open' | 'closed';
    notes: string | null;
    movements?: CashMovement[];
    sales?: number;
    returns?: number;
    grossSales?: number;
    tenders?: Array<{ method: string; amount: number; count: number }>;
}

/** The caller's open till, or null when they have none. */
export const getCurrentSession = (): Promise<CashSession | null> =>
    api.get<CashSession | null>('/cash-sessions/current');

export const openSession = (openingFloat: number): Promise<CashSession> =>
    api.post<CashSession>('/cash-sessions', { openingFloat });

export const addMovement = (
    sessionId: string,
    movement: { type: 'pay_in' | 'pay_out'; amount: number; reason: string },
): Promise<{ movements: CashMovement[] }> =>
    api.post<{ movements: CashMovement[] }>(`/cash-sessions/${sessionId}/movements`, movement);

/** Close the till against a counted drawer. The variance comes back with it. */
export const closeSession = (
    sessionId: string,
    countedCash: number,
    notes?: string,
): Promise<CashSession> =>
    api.post<CashSession>(`/cash-sessions/${sessionId}/close`, { countedCash, notes });

/** Past shifts. Own sessions only unless the caller can manage cash. */
export const listSessions = (limit = 50): Promise<CashSession[]> =>
    api.get<CashSession[]>(`/cash-sessions?limit=${limit}`);
