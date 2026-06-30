import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UpsellContextData } from '../utils/upsell';

// Capture analytics emissions without GA. vi.hoisted so the mock factory can see it.
const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock('../src/utils/analytics', () => ({ trackEvent }));

type Service = typeof import('./upsellService')['upsellService'];

/** Fresh singleton per test (module state is otherwise process-global). */
async function freshService(): Promise<Service> {
    vi.resetModules();
    trackEvent.mockClear();
    const mod = await import('./upsellService');
    return mod.upsellService;
}

function makeCtx(overrides: Partial<UpsellContextData> = {}): UpsellContextData {
    return {
        role: 'admin',
        isMidSale: false,
        daysActive: 30,
        hasModule: () => false,
        productCount: 50,
        productCap: 100,
        manualAddsThisSession: 0,
        customerCount: 10,
        dormantCustomerCount: 9,
        recentStockoutCount: 0,
        userCount: 1,
        storeCount: 1,
        salesCount: 0,
        cashSaleCount: 0,
        ...overrides,
    };
}

let svc: Service;
beforeEach(async () => {
    svc = await freshService();
    svc.setContext(makeCtx());
});

describe('one-proactive-per-session budget (integrated with recordShown)', () => {
    it('spends the budget on the first proactive impression and suppresses the rest', () => {
        const inline = svc.getEligible('inline_card');
        expect(inline?.id).toBe('dormant_customers');

        svc.recordShown(inline!);

        // A different proactive surface is now suppressed…
        expect(svc.getEligible('discover_card')).toBeNull();
        // …but the shown moment keeps rendering on its own surface.
        expect(svc.getEligible('inline_card')?.id).toBe('dormant_customers');
    });

    it('does not let the paywall consume or be blocked by the budget', () => {
        svc.recordShown(svc.getEligible('inline_card')!);
        expect(svc.getEligible('paywall')?.id).toBe('report_locked');
    });
});

describe('analytics events fire with { momentId, module, surface }', () => {
    it('emits upsell_impression once per moment per session', () => {
        const m = svc.getEligible('inline_card')!;
        svc.recordShown(m);
        svc.recordShown(m); // idempotent
        const impressions = trackEvent.mock.calls.filter(c => c[0] === 'upsell_impression');
        expect(impressions).toHaveLength(1);
        expect(impressions[0][1]).toEqual({ momentId: 'dormant_customers', module: 'whatsapp_messaging', surface: 'inline_card' });
    });

    it('emits upsell_click and upsell_dismiss with params', () => {
        const m = svc.getEligible('inline_card')!;
        svc.recordClick(m);
        svc.recordDismissed(m);
        expect(trackEvent).toHaveBeenCalledWith('upsell_click', { momentId: 'dormant_customers', module: 'whatsapp_messaging', surface: 'inline_card' });
        expect(trackEvent).toHaveBeenCalledWith('upsell_dismiss', { momentId: 'dormant_customers', module: 'whatsapp_messaging', surface: 'inline_card' });
    });
});

describe('conversion attribution', () => {
    it('emits upsell_convert when a clicked module is later purchased this session', () => {
        const m = svc.getEligible('inline_card')!;
        svc.recordClick(m);
        svc.notePurchaseCompleted(['whatsapp_messaging']);
        expect(trackEvent).toHaveBeenCalledWith('upsell_convert', { momentId: 'dormant_customers', module: 'whatsapp_messaging', surface: 'inline_card' });
    });

    it('does not attribute a purchase that was never clicked', () => {
        svc.notePurchaseCompleted(['whatsapp_messaging']);
        expect(trackEvent.mock.calls.some(c => c[0] === 'upsell_convert')).toBe(false);
    });

    it('attributes each clicked module at most once', () => {
        const m = svc.getEligible('inline_card')!;
        svc.recordClick(m);
        svc.notePurchaseCompleted(['whatsapp_messaging']);
        svc.notePurchaseCompleted(['whatsapp_messaging']); // already consumed
        const converts = trackEvent.mock.calls.filter(c => c[0] === 'upsell_convert');
        expect(converts).toHaveLength(1);
    });
});

describe('dismissal persistence affects selection', () => {
    it('a cooldown dismissal hides the moment for the rest of the session', () => {
        const m = svc.getEligible('inline_card', ['dormant_customers'])!;
        svc.recordDismissed(m);
        expect(svc.getEligible('inline_card', ['dormant_customers'])).toBeNull();
    });

    it('a permanent dismissal hides the moment for good', () => {
        const m = svc.getEligible('inline_card', ['dormant_customers'])!;
        svc.recordDismissed(m, { permanent: true });
        expect(svc.getEligible('inline_card', ['dormant_customers'])).toBeNull();
    });
});

describe('manual-add counting', () => {
    it('increments the session counter', () => {
        expect(svc.getManualAdds()).toBe(0);
        svc.recordManualAdd();
        svc.recordManualAdd();
        expect(svc.getManualAdds()).toBe(2);
    });
});

describe('config-driven pricing', () => {
    it('returns null before the catalogue loads, then the live price', () => {
        expect(svc.getPrice('whatsapp_messaging')).toBeNull();
        svc.setPricing([{ id: 'whatsapp_messaging', price: 110, currency: 'ZMW' }]);
        expect(svc.getPrice('whatsapp_messaging')).toEqual({ price: 110, currency: 'ZMW' });
    });
    it('ignores an empty catalogue (keeps last-known pricing)', () => {
        svc.setPricing([{ id: 'ai_assistant', price: 200, currency: 'ZMW' }]);
        svc.setPricing([]); // e.g. a failed/empty fetch must not wipe prices
        expect(svc.getPrice('ai_assistant')).toEqual({ price: 200, currency: 'ZMW' });
    });
});

describe('no context = no upsell', () => {
    it('returns null before a snapshot is set', async () => {
        const bare = await freshService();
        expect(bare.getEligible('inline_card')).toBeNull();
    });
});
