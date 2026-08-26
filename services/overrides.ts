import { api } from './api';

/**
 * Manager approvals.
 *
 * The till never decides whether an approval is needed — the server refuses the
 * action and says so, and this is how the answer is fetched. Duplicating the
 * limits here would mean a till could be talked out of enforcing them, and two
 * places to change when a shop moves its threshold.
 */

export type OverrideAction = 'discount' | 'refund' | 'pay_out' | 'no_sale';

export interface OverrideSettings {
    discountPercent: number | null;
    refundAmount: number | null;
    payOutAmount: number | null;
    noSale: boolean | null;
    /** This user may do these things unaided, so they are never prompted. */
    selfAuthorizes: boolean;
}

export interface GrantedOverride {
    id: string;
    authorizedBy: string;
    expiresAt: string;
}

/** What this store asks a manager about. */
export const getOverrideSettings = (): Promise<OverrideSettings> =>
    api.get<OverrideSettings>('/overrides');

/**
 * Ask a manager to allow one thing.
 *
 * The amount is sent so it can be bound into the approval: a manager allowing
 * 20% off has not allowed 90%, and the server rechecks the ceiling when the
 * code is spent.
 */
export const authorizeOverride = (params: {
    action: OverrideAction;
    amount?: number | null;
    pin: string;
    reason?: string;
}): Promise<GrantedOverride> => api.post<GrantedOverride>('/overrides', params);

/** Set or clear your own approval PIN. Confirms your account password. */
export const setManagerPin = (password: string, pin: string | null): Promise<{ hasPin: boolean }> =>
    api.put<{ hasPin: boolean }>('/overrides/pin', { password, pin });

/**
 * What the server was refusing, when it refuses for want of an approval.
 * Returns null for every other kind of failure, so callers can tell "fetch a
 * manager" apart from "something broke".
 */
export const overrideRequestFrom = (
    error: unknown,
): { action: OverrideAction; amount: number } | null => {
    const body = (error as any)?.body;
    if ((error as any)?.status !== 403 || !body?.requiresOverride) return null;
    return {
        action: body.requiresOverride as OverrideAction,
        amount: Number(body.amount) || 0,
    };
};
