import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpsellMoment, UpsellSurface } from '../../utils/upsell';
import { useUpsell } from '../../contexts/UpsellContext';
import { useCountdown, discounted, money } from './offer';

/**
 * Dismissible contextual upsell card, shown at the top of a feature screen.
 * Reuses the warm brand tokens (matches PaywallHost / PremiumUpgradeModal).
 *
 * - Counts an impression on display.
 * - CTA records a click and deep-links into the add-on checkout.
 * - X dismisses for the moment's cooldown; "Don't show again" opts out for good.
 */
/** "From K110/mo" style price label from the live catalogue, or '' if unknown. */
const priceLabel = (price: number, currency: string): string => {
    const sym = currency === 'USD' ? '$' : currency === 'ZMW' ? 'K' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '';
    const v = (Number.isFinite(price) ? price : 0).toLocaleString();
    return `From ${sym ? `${sym}${v}` : `${currency} ${v}`}/mo`;
};

export const UpsellCard: React.FC<{ moment: UpsellMoment; className?: string }> = ({ moment, className = '' }) => {
    const navigate = useNavigate();
    const { recordShown, recordClick, recordDismissed, getPrice, getOffer } = useUpsell();
    const price = getPrice(moment.module);
    const offer = getOffer(moment);
    const countdown = useCountdown(offer?.endsAt);

    useEffect(() => {
        recordShown(moment);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moment.id]);

    const goCheckout = () => {
        recordClick(moment);
        navigate(`/subscription?view=addons&module=${encodeURIComponent(moment.module)}`);
    };

    return (
        <div
            className={`relative flex items-start gap-3 p-4 rounded-2xl border border-brand-border bg-surface shadow-sm ${className}`}
            role="note"
        >
            <span className="mt-0.5 w-10 h-10 shrink-0 rounded-xl bg-sp-amber-soft flex items-center justify-center">
                <span className="material-symbols-rounded text-sp-amber text-[22px]">workspace_premium</span>
            </span>
            <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm font-bold text-brand-text">{moment.headline}</p>
                <p className="text-sm text-brand-text-muted mt-0.5">{moment.body}</p>
                {offer && (offer.discountPct || countdown) && (
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        {offer.discountPct ? <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sp-amber text-white">{offer.discountPct}% OFF</span> : null}
                        {countdown ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger"><span className="material-symbols-rounded text-[14px]">timer</span>{countdown}</span> : null}
                    </div>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                    <button
                        type="button"
                        onClick={goCheckout}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold bg-sp-amber text-white hover:bg-sp-green-dark transition active:scale-95"
                    >
                        {moment.ctaLabel}
                        <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
                    </button>
                    {price && (offer?.discountPct ? (
                        <span className="text-xs font-semibold">
                            <span className="text-brand-text-muted line-through mr-1">{money(price.price, price.currency)}</span>
                            <span className="text-sp-green">{money(discounted(price.price, offer.discountPct), price.currency)}/mo</span>
                        </span>
                    ) : (
                        <span className="text-xs font-semibold text-sp-green">{priceLabel(price.price, price.currency)}</span>
                    ))}
                    <button
                        type="button"
                        onClick={() => recordDismissed(moment, { permanent: true })}
                        className="text-xs font-semibold text-brand-text-muted hover:text-brand-text transition"
                    >
                        Don't show again
                    </button>
                </div>
            </div>
            <button
                type="button"
                aria-label="Dismiss"
                onClick={() => recordDismissed(moment)}
                className="absolute top-2.5 right-2.5 p-1 rounded-lg text-brand-text-muted hover:bg-surface-variant transition active:scale-95"
            >
                <span className="material-symbols-rounded text-[18px]">close</span>
            </button>
        </div>
    );
};

/**
 * Self-contained slot: asks the engine for the single highest-priority eligible
 * inline moment restricted to this screen's `ids`, and renders it (or nothing).
 * Restricting by id keeps the one-proactive-per-session budget intact while
 * letting each screen show its own relevant card.
 */
export const UpsellInline: React.FC<{
    ids?: readonly string[];
    surface?: UpsellSurface;
    /** Slot key so Super-Admin-authored campaigns targeting this placement render
     *  here too (built-ins are matched by `ids`). */
    placement?: string;
    className?: string;
}> = ({ ids, surface = 'inline_card', placement, className }) => {
    const { getEligible } = useUpsell();
    const moment = getEligible(surface, ids, placement);
    if (!moment) return null;
    return <UpsellCard moment={moment} className={className} />;
};

export default UpsellCard;
