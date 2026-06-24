import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    selectEligible,
    isEligible,
    getPaywallMoment,
    currentStage,
    UPSELL_MOMENTS,
    UpsellContextData,
    EligibilityState,
    cooldownUntil,
} from './upsell';

const NOW = Date.UTC(2026, 5, 24); // fixed clock for deterministic cooldown maths
const DAY = 24 * 60 * 60 * 1000;

/** Eligible-by-default admin context; override per test. */
function ctx(overrides: Partial<UpsellContextData> = {}): UpsellContextData {
    return {
        role: 'admin',
        isMidSale: false,
        daysActive: 30,
        hasModule: () => false,
        productCount: 50,
        productCap: 100,
        manualAddsThisSession: 0,
        customerCount: 10,
        dormantCustomerCount: 0,
        recentStockoutCount: 0,
        userCount: 1,
        storeCount: 1,
        ...overrides,
    };
}

function state(overrides: Partial<EligibilityState> = {}): EligibilityState {
    return { persist: {}, sessionShownId: null, now: NOW, ...overrides };
}

describe('currentStage', () => {
    it('is onboarding until the first product (first value)', () => {
        expect(currentStage(ctx({ productCount: 0, daysActive: 99 }))).toBe('onboarding');
    });
    it('progresses activation → engagement → expansion by tenure', () => {
        expect(currentStage(ctx({ productCount: 5, daysActive: 1 }))).toBe('activation');
        expect(currentStage(ctx({ productCount: 5, daysActive: 5 }))).toBe('engagement');
        expect(currentStage(ctx({ productCount: 5, daysActive: 20 }))).toBe('expansion');
    });
});

describe('role guardrail — only owners/admins', () => {
    it.each(['staff', 'inventory_manager', 'customer', ''])('suppresses everything for role "%s"', (role) => {
        const c = ctx({ role, dormantCustomerCount: 9, recentStockoutCount: 5 });
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, state())).toBeNull();
        expect(selectEligible(UPSELL_MOMENTS, 'paywall', c, state())).toBeNull();
        expect(selectEligible(UPSELL_MOMENTS, 'push', c, state())).toBeNull();
    });
    it('allows admin and superadmin', () => {
        const c = ctx({ dormantCustomerCount: 5 });
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, state())?.id).toBe('dormant_customers');
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', ctx({ role: 'superadmin', dormantCustomerCount: 5 }), state())?.id)
            .toBe('dormant_customers');
    });
});

describe('mid-sale guardrail', () => {
    it('suppresses every surface while a sale is in progress', () => {
        const c = ctx({ isMidSale: true, dormantCustomerCount: 9, recentStockoutCount: 5 });
        for (const surface of ['inline_card', 'paywall', 'discover_card', 'daily_summary', 'push'] as const) {
            expect(selectEligible(UPSELL_MOMENTS, surface, c, state())).toBeNull();
        }
    });
});

describe('owned-module guardrail', () => {
    it('never upsells a module the store already owns', () => {
        const owns = (m: string) => m === 'whatsapp_messaging';
        const c = ctx({ dormantCustomerCount: 9, hasModule: owns as any });
        // the owned dormant_customers moment must never be selected…
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, state())?.module).not.toBe('whatsapp_messaging');
        // …and scoping to just that owned moment yields nothing.
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, state(), ['dormant_customers'])).toBeNull();
    });
});

describe('stage guardrail', () => {
    it('shows no proactive upsell before first value (onboarding)', () => {
        const c = ctx({ productCount: 0, daysActive: 99, dormantCustomerCount: 9, recentStockoutCount: 9 });
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, state())).toBeNull();
    });
    it('gates an engagement moment until the engagement stage', () => {
        // activation stage (day 1): dormant (engagement) is suppressed…
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', ctx({ daysActive: 1, dormantCustomerCount: 9 }), state())).toBeNull();
        // …but available once engaged (day 5)
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', ctx({ daysActive: 5, dormantCustomerCount: 9 }), state())?.id)
            .toBe('dormant_customers');
    });
});

describe('data triggers', () => {
    it('product_cap_near fires only in the 80%–<100% band', () => {
        const at = (productCount: number) =>
            isEligible(UPSELL_MOMENTS.find(m => m.id === 'product_cap_near')!, ctx({ productCount, daysActive: 1 }), state());
        expect(at(79)).toBe(false);
        expect(at(80)).toBe(true);
        expect(at(99)).toBe(true);
        expect(at(100)).toBe(false);
    });
    it('bulk_manual_adds needs ≥5 manual adds', () => {
        const moment = UPSELL_MOMENTS.find(m => m.id === 'bulk_manual_adds')!;
        expect(isEligible(moment, ctx({ manualAddsThisSession: 4, daysActive: 1 }), state())).toBe(false);
        expect(isEligible(moment, ctx({ manualAddsThisSession: 5, daysActive: 1 }), state())).toBe(true);
    });
});

describe('priority selection', () => {
    it('returns the highest-priority eligible inline moment', () => {
        // dormant (80) outranks stockout (70) when both trigger
        const c = ctx({ dormantCustomerCount: 9, recentStockoutCount: 9 });
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, state())?.id).toBe('dormant_customers');
    });
});

describe('cooldown after dismissal', () => {
    const dormant = UPSELL_MOMENTS.find(m => m.id === 'dormant_customers')!;
    const c = ctx({ dormantCustomerCount: 9 });

    it('hides the moment during its cooldown window', () => {
        const persist = { dormant_customers: { dismissedUntil: cooldownUntil(dormant, NOW) } };
        // scope to dormant (as the Customers screen does) to isolate the cooldown gate
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, state({ persist }), ['dormant_customers'])).toBeNull();
    });
    it('re-shows the moment after the cooldown expires', () => {
        const dismissedUntil = cooldownUntil(dormant, NOW);
        const persist = { dormant_customers: { dismissedUntil } };
        const later = state({ persist, now: dismissedUntil + DAY });
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, later, ['dormant_customers'])?.id).toBe('dormant_customers');
    });
});

describe('permanent opt-out', () => {
    it('never re-shows a permanently dismissed moment, even far in the future', () => {
        const c = ctx({ dormantCustomerCount: 9 });
        const persist = { dormant_customers: { permanentlyDismissed: true } };
        const farFuture = state({ persist, now: NOW + 3650 * DAY });
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, farFuture, ['dormant_customers'])).toBeNull();
    });
});

describe('one-proactive-per-session budget', () => {
    const c = ctx({ dormantCustomerCount: 9, daysActive: 30 });

    it('lets the already-shown proactive moment keep rendering on its surface', () => {
        const s = state({ sessionShownId: 'dormant_customers' });
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, s)?.id).toBe('dormant_customers');
    });
    it('suppresses other proactive surfaces once one has been shown', () => {
        const s = state({ sessionShownId: 'dormant_customers' });
        // discover moment would otherwise be eligible (day 30, no advanced_reports)
        expect(selectEligible(UPSELL_MOMENTS, 'discover_card', c, s)).toBeNull();
    });
    it('suppresses a surface whose own moment is not the one already shown', () => {
        // budget spent on a moment that is not eligible on this surface → nothing
        const s = state({ sessionShownId: 'daily_summary_ai' });
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, s)).toBeNull();
    });
    it('does NOT apply the budget to the paywall surface (hard 402 gate)', () => {
        const s = state({ sessionShownId: 'dormant_customers' });
        expect(selectEligible(UPSELL_MOMENTS, 'paywall', c, s)?.id).toBe('report_locked');
    });
});

describe('restrictIds (per-screen scoping)', () => {
    it('returns only a moment within the screen\'s id set', () => {
        const c = ctx({ dormantCustomerCount: 9, recentStockoutCount: 9 });
        // Inventory screen only offers stockout/bulk — dormant must not leak in
        const m = selectEligible(UPSELL_MOMENTS, 'inline_card', c, state(), ['stockout_repeat', 'bulk_manual_adds']);
        expect(m?.id).toBe('stockout_repeat');
    });
});

describe('getPaywallMoment', () => {
    it('maps a module to its paywall moment', () => {
        expect(getPaywallMoment('advanced_reports')?.id).toBe('report_locked');
        expect(getPaywallMoment('team_members')?.id).toBe('second_staff');
    });
    it('returns null for a module with no paywall moment', () => {
        expect(getPaywallMoment('unlimited_products')).toBeNull();
        expect(getPaywallMoment('nope')).toBeNull();
    });
});

describe('offline — eligibility makes no network calls', () => {
    afterEach(() => vi.restoreAllMocks());
    it('evaluates without touching fetch', () => {
        const fetchSpy = vi.fn(() => { throw new Error('network used'); });
        vi.stubGlobal('fetch', fetchSpy);
        const c = ctx({ dormantCustomerCount: 9 });
        expect(selectEligible(UPSELL_MOMENTS, 'inline_card', c, state())?.id).toBe('dormant_customers');
        expect(fetchSpy).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });
});

describe('catalogue shape (Definition of Done)', () => {
    it('defines the nine brief moments (+1 discover_card)', () => {
        const ids = UPSELL_MOMENTS.map(m => m.id).sort();
        expect(ids).toEqual([
            'bulk_manual_adds',
            'daily_summary_ai',
            'discover_advanced_reports',
            'dormant_customers',
            'dormant_customers_push',
            'product_cap_near',
            'report_locked',
            'second_staff',
            'stockout_repeat',
            'tracking_requested',
        ]);
    });
    it('covers all five surfaces', () => {
        const surfaces = new Set(UPSELL_MOMENTS.map(m => m.surface));
        expect([...surfaces].sort()).toEqual(['daily_summary', 'discover_card', 'inline_card', 'paywall', 'push']);
    });
});
