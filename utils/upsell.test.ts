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
    withinSchedule,
    compileTrigger,
    resolveCampaigns,
    pickVariant,
    resolveCreative,
    offerLive,
    Campaign,
    CampaignDTO,
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
        salesCount: 0,
        cashSaleCount: 0,
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
    it('accept_mobile_money fires on ≥8 cash sales and not when Lenco is connected', () => {
        const moment = UPSELL_MOMENTS.find(m => m.id === 'accept_mobile_money')!;
        expect(isEligible(moment, ctx({ cashSaleCount: 7 }), state())).toBe(false);
        expect(isEligible(moment, ctx({ cashSaleCount: 8 }), state())).toBe(true);
        // a merchant who already accepts mobile money (owns the module) is excluded
        expect(isEligible(moment, ctx({ cashSaleCount: 20, hasModule: (m) => m === 'payment_gateway' }), state())).toBe(false);
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
    it('defines the nine brief moments (+1 discover_card, +1 payments)', () => {
        const ids = UPSELL_MOMENTS.map(m => m.id).sort();
        expect(ids).toEqual([
            'accept_mobile_money',
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

// ── Marketing layer ──────────────────────────────────────────────────────────

describe('marketing: campaign status + schedule', () => {
    const dormant = UPSELL_MOMENTS.find(m => m.id === 'dormant_customers')!;
    const c = ctx({ dormantCustomerCount: 9 });

    it('a paused campaign is never eligible', () => {
        expect(isEligible({ ...dormant, status: 'paused' }, c, state())).toBe(false);
    });
    it('withinSchedule respects start/end bounds (absent = always live)', () => {
        expect(withinSchedule(dormant, NOW)).toBe(true);
        expect(withinSchedule({ ...dormant, schedule: { startAt: NOW - DAY, endAt: NOW + DAY } }, NOW)).toBe(true);
        expect(withinSchedule({ ...dormant, schedule: { startAt: NOW + DAY } }, NOW)).toBe(false);
        expect(withinSchedule({ ...dormant, schedule: { endAt: NOW - DAY } }, NOW)).toBe(false);
    });
    it('isEligible gates on the live window', () => {
        expect(isEligible({ ...dormant, schedule: { startAt: NOW + DAY } }, c, state())).toBe(false);
        expect(isEligible({ ...dormant, schedule: { startAt: NOW - DAY, endAt: NOW + DAY } }, c, state())).toBe(true);
    });
});

describe('marketing: declarative trigger rules', () => {
    it('compiles comparison ops over the data snapshot', () => {
        const t = compileTrigger({ field: 'dormantCustomerCount', op: '>=', value: 3 });
        expect(t(ctx({ dormantCustomerCount: 2 }))).toBe(false);
        expect(t(ctx({ dormantCustomerCount: 3 }))).toBe(true);
    });
    it('chains an AND clause for a band', () => {
        const t = compileTrigger({
            field: 'productCount', op: '>=', value: 80,
            and: { field: 'productCount', op: '<', value: 100 },
        });
        expect(t(ctx({ productCount: 79 }))).toBe(false);
        expect(t(ctx({ productCount: 80 }))).toBe(true);
        expect(t(ctx({ productCount: 100 }))).toBe(false);
    });
    it('an absent rule is always-true', () => {
        expect(compileTrigger(undefined)(ctx())).toBe(true);
    });
});

describe('marketing: resolveCampaigns (remote over built-in)', () => {
    it('returns built-ins unchanged when there is no remote config', () => {
        const resolved = resolveCampaigns(UPSELL_MOMENTS, null);
        expect(resolved).toHaveLength(UPSELL_MOMENTS.length);
        expect(resolved.every(m => m.source === 'builtin')).toBe(true);
    });
    it('replaces a built-in of the same id and compiles its rule', () => {
        const dto: CampaignDTO = {
            id: 'dormant_customers', module: 'whatsapp_messaging', surface: 'inline_card',
            stage: 'engagement', priority: 99, cooldownDays: 14,
            triggerRule: { field: 'dormantCustomerCount', op: '>=', value: 1 },
            headline: 'NEW', body: 'b', ctaLabel: 'cta',
        };
        const resolved = resolveCampaigns(UPSELL_MOMENTS, [dto]);
        const m = resolved.find(x => x.id === 'dormant_customers')!;
        expect(m.headline).toBe('NEW');
        expect(m.priority).toBe(99);
        expect(m.source).toBe('remote');
        expect(m.trigger(ctx({ dormantCustomerCount: 1 }))).toBe(true);
        expect(resolved).toHaveLength(UPSELL_MOMENTS.length); // replace, not append
    });
    it('overriding a built-in without a rule keeps the built-in trigger', () => {
        // Retune copy/priority but supply NO triggerRule → dormant's ≥3 data
        // trigger must still apply (not become always-true).
        const dto: CampaignDTO = {
            id: 'dormant_customers', module: 'whatsapp_messaging', surface: 'inline_card',
            stage: 'engagement', priority: 99, cooldownDays: 14,
            headline: 'Retuned', body: 'b', ctaLabel: 'cta',
        };
        const m = resolveCampaigns(UPSELL_MOMENTS, [dto]).find(x => x.id === 'dormant_customers')!;
        expect(m.headline).toBe('Retuned');
        expect(m.trigger(ctx({ dormantCustomerCount: 2 }))).toBe(false); // still gated
        expect(m.trigger(ctx({ dormantCustomerCount: 3 }))).toBe(true);
    });
    it('appends a brand-new remote id', () => {
        const dto: CampaignDTO = {
            id: 'flash_sale', module: 'advanced_reports', surface: 'inline_card',
            stage: 'activation', priority: 10, cooldownDays: 7,
            triggerRule: { field: 'salesCount', op: '>=', value: 1 },
            headline: 'h', body: 'b', ctaLabel: 'cta',
        };
        const resolved = resolveCampaigns(UPSELL_MOMENTS, [dto]);
        expect(resolved).toHaveLength(UPSELL_MOMENTS.length + 1);
        expect(resolved.find(x => x.id === 'flash_sale')?.source).toBe('remote');
    });
    it('a paywall DTO always-fires regardless of rule', () => {
        const dto: CampaignDTO = {
            id: 'report_locked', module: 'advanced_reports', surface: 'paywall',
            stage: 'activation', priority: 60, cooldownDays: 30,
            headline: 'h', body: 'b', ctaLabel: 'cta',
        };
        const m = resolveCampaigns(UPSELL_MOMENTS, [dto]).find(x => x.id === 'report_locked')!;
        expect(m.trigger(ctx())).toBe(true);
    });
});

describe('marketing: A/B variant selection', () => {
    const base = UPSELL_MOMENTS.find(m => m.id === 'dormant_customers')!;
    const withVariants: Campaign = {
        ...base,
        variants: [
            { id: 'a', headline: 'A', body: 'ab', ctaLabel: 'ac' },
            { id: 'b', headline: 'B', body: 'bb', ctaLabel: 'bc' },
        ],
    };

    it('returns null with no variants (control copy)', () => {
        expect(pickVariant(base, 'user-1')).toBeNull();
        expect(resolveCreative(base, 'user-1').variantId).toBeNull();
        expect(resolveCreative(base, 'user-1').headline).toBe(base.headline);
    });
    it('is deterministic for a given (seed, campaign)', () => {
        expect(pickVariant(withVariants, 'user-1')?.id).toBe(pickVariant(withVariants, 'user-1')?.id);
    });
    it('resolveCreative applies the chosen variant copy', () => {
        const r = resolveCreative(withVariants, 'user-1');
        expect(['A', 'B']).toContain(r.headline);
        expect(['a', 'b']).toContain(r.variantId);
    });
    it('spreads users across variants', () => {
        const seen = new Set<string>();
        for (let i = 0; i < 50; i++) seen.add(pickVariant(withVariants, `user-${i}`)!.id);
        expect(seen.size).toBe(2);
    });
    it('never picks a zero-weight variant', () => {
        const weighted: Campaign = {
            ...base, variants: [
                { id: 'a', headline: 'A', body: '', ctaLabel: '', weight: 1 },
                { id: 'z', headline: 'Z', body: '', ctaLabel: '', weight: 0 },
            ],
        };
        const seen = new Set<string>();
        for (let i = 0; i < 50; i++) seen.add(pickVariant(weighted, `u${i}`)!.id);
        expect(seen.has('z')).toBe(false);
        expect(seen.has('a')).toBe(true);
    });
});

describe('marketing: offers', () => {
    const base = UPSELL_MOMENTS.find(m => m.id === 'dormant_customers')!;
    it('returns null when there is no offer', () => {
        expect(offerLive(base, NOW)).toBeNull();
    });
    it('returns the offer while live and null once expired', () => {
        const m: Campaign = { ...base, offer: { discountPct: 20, endsAt: NOW + DAY } };
        expect(offerLive(m, NOW)?.discountPct).toBe(20);
        expect(offerLive(m, NOW + 2 * DAY)).toBeNull();
    });
    it('an offer with no expiry is always live', () => {
        const m: Campaign = { ...base, offer: { discountPct: 10 } };
        expect(offerLive(m, NOW + 3650 * DAY)?.discountPct).toBe(10);
    });
});
