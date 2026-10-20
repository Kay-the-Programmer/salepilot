import React, { useEffect, useState } from 'react';
import { Product, Sale, StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { dismissHelper, getOnboardingState } from '../../services/onboardingService';

/**
 * What a brand-new shop should do first.
 *
 * A new owner used to land on the dashboard, which on an empty shop is a wall
 * of K0 and a chart with nothing in it. That answers a question they have not
 * asked yet — how is business? — while saying nothing about the one they do
 * have, which is "right, what now?". An empty report is the least useful
 * screen in the product and it was the first one they saw.
 *
 * So: three steps, in the order a shop actually does them, each a single tap
 * to the place it happens.
 *
 * The ticks are derived from the shop's own data rather than from a flag we
 * set when the user visits a screen. Someone who added products by importing
 * a spreadsheet, or whose shop was set up for them, should not be told to go
 * and do it again — and if a step is somehow undone, the list says so instead
 * of quietly staying ticked. It disappears on its own once everything is done,
 * so it costs an established shop nothing.
 */

const HELPER_ID = 'helper_setup_checklist';

export interface SetupStep {
    id: string;
    title: string;
    detail: string;
    icon: string;
    done: boolean;
    cta: string;
    onGo: () => void;
}

interface SetupChecklistProps {
    products: Product[];
    sales: Sale[];
    storeSettings: StoreSettings | null;
    onAddProduct: () => void;
    onSell: () => void;
    onSettings: () => void;
}

/** A shop is "set up" once it can sell something and the receipt says who sold it. */
export const buildSetupSteps = (
    products: Product[],
    sales: Sale[],
    storeSettings: StoreSettings | null,
    go: { addProduct: () => void; sell: () => void; settings: () => void },
): SetupStep[] => [
    {
        id: 'products',
        title: 'Add what you sell',
        detail: 'Put your items in, with their prices. You can scan barcodes or import a list.',
        icon: 'inventory_2',
        done: products.length > 0,
        cta: 'Add items',
        onGo: go.addProduct,
    },
    {
        id: 'receipt',
        title: 'Put your shop on the receipt',
        detail: 'Your shop name and phone number, so customers know who served them.',
        icon: 'receipt_long',
        // Name alone is not enough — a receipt with no way to reach the shop is
        // the thing customers complain about, so the step wants a contact too.
        done: !!(storeSettings?.name?.trim() && (storeSettings?.phone?.trim() || storeSettings?.address?.trim())),
        cta: 'Set up receipt',
        onGo: go.settings,
    },
    {
        id: 'sale',
        title: 'Make your first sale',
        detail: 'Ring something up to see how the till works. You can refund it afterwards.',
        icon: 'point_of_sale',
        done: sales.length > 0,
        cta: 'Open the till',
        onGo: go.sell,
    },
];

export const SetupChecklist: React.FC<SetupChecklistProps> = ({
    products, sales, storeSettings, onAddProduct, onSell, onSettings,
}) => {
    const [dismissed, setDismissed] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        getOnboardingState()
            .then(s => { if (!cancelled) setDismissed(s.dismissedHelpers.includes(HELPER_ID)); })
            // If we cannot tell, show it: a new shop being helped twice is a far
            // smaller problem than a new shop being helped not at all.
            .catch(() => { if (!cancelled) setDismissed(false); });
        return () => { cancelled = true; };
    }, []);

    const steps = buildSetupSteps(products, sales, storeSettings, {
        addProduct: onAddProduct, sell: onSell, settings: onSettings,
    });
    const doneCount = steps.filter(s => s.done).length;

    // Nothing left to do, or the owner has put it away. Also hidden until we
    // know which, so it never flashes up at an established shop on every load.
    if (dismissed !== false || doneCount === steps.length) return null;

    const hide = () => {
        setDismissed(true);
        void dismissHelper(HELPER_ID).catch(() => { /* a local hide is enough */ });
    };

    // The first thing not yet done — the one step worth emphasising.
    const next = steps.find(s => !s.done);

    return (
        <section className="crm-card crm-card--pad" style={{ marginBottom: 20 }} aria-labelledby="setup-checklist-heading">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div style={{ minWidth: 0 }}>
                    <h3 id="setup-checklist-heading" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                        Get your shop ready
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--c-on-surface-variant)' }}>
                        {doneCount} of {steps.length} done — about five minutes in total.
                    </p>
                </div>
                <button
                    type="button"
                    className="crm-btn crm-btn--ghost"
                    onClick={hide}
                    aria-label="Hide the setup checklist"
                >
                    Hide
                </button>
            </div>

            {/* Progress, so the end is visible from the start. */}
            <div
                role="progressbar"
                aria-valuenow={doneCount}
                aria-valuemin={0}
                aria-valuemax={steps.length}
                aria-label="Setup progress"
                style={{ height: 6, borderRadius: 999, background: 'var(--c-surface-high)', overflow: 'hidden', marginBottom: 16 }}
            >
                <div style={{ width: `${(doneCount / steps.length) * 100}%`, height: '100%', background: 'var(--c-primary)', transition: 'width .3s ease' }} />
            </div>

            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {steps.map(step => {
                    const isNext = step.id === next?.id;
                    return (
                        <li
                            key={step.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                                borderRadius: 'var(--c-radius-lg)',
                                background: isNext ? 'rgba(0, 43, 107, 0.06)' : 'transparent',
                                border: `1px solid ${isNext ? 'var(--c-primary)' : 'transparent'}`,
                                opacity: step.done ? 0.6 : 1,
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    background: step.done ? 'var(--c-primary)' : 'var(--c-surface-high)',
                                    color: step.done ? '#fff' : 'var(--c-on-surface-variant)',
                                }}
                            >
                                <Icon name={step.done ? 'check' : step.icon} size={20} fill={step.done ? 1 : 0} />
                            </span>

                            <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{
                                    display: 'block', fontSize: 14, fontWeight: 600,
                                    textDecoration: step.done ? 'line-through' : 'none',
                                }}>
                                    {step.title}
                                </span>
                                {!step.done && (
                                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--c-on-surface-variant)', marginTop: 2 }}>
                                        {step.detail}
                                    </span>
                                )}
                            </span>

                            {step.done ? (
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-on-surface-variant)' }}>Done</span>
                            ) : (
                                <button type="button" className={`crm-btn ${isNext ? 'crm-btn--primary' : 'crm-btn--tonal'}`} onClick={step.onGo}>
                                    {step.cta}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
};

export default SetupChecklist;
