import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getPaywallMoment } from '../utils/upsell';
import { upsellService } from '../services/upsellService';

/**
 * Global soft-paywall host. Listens for the `salepilot:paywall` event the API
 * layer fires on a 402 ("module locked"), and offers an in-context upgrade that
 * deep-links into the à-la-carte add-on checkout. Mounted once at the app root.
 */

interface AddonInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  owned: boolean;
}

const money = (n: number, c = 'ZMW') => {
  const sym = c === 'USD' ? '$' : c === 'ZMW' ? 'K' : c === 'GBP' ? '£' : c === 'EUR' ? '€' : '';
  const v = (Number.isFinite(n) ? n : 0).toLocaleString();
  return sym ? `${sym}${v}` : `${c} ${v}`;
};

// Friendly names for the brief moment before the catalog lookup resolves.
const FALLBACK_NAMES: Record<string, string> = {
  ai_assistant: 'AI Assistant',
  sms_messaging: 'SMS Messaging',
  team_members: 'Team Members',
  auto_reorder: 'Auto Reorder & POs',
  quick_import: 'Quick Import',
  advanced_reports: 'Advanced Reports',
  public_tracking: 'Public Shipment Tracking',
};

const PaywallHost: React.FC = () => {
  const navigate = useNavigate();
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [addon, setAddon] = useState<AddonInfo | null>(null);

  // Matching upsell moment for this locked module (outcome-framed copy + bundle).
  // The 402 itself is the trigger, so this lookup ignores ctx/session gates.
  const moment = useMemo(() => (moduleId ? getPaywallMoment(moduleId) : null), [moduleId]);

  // Count an impression once the enriched prompt is on screen.
  useEffect(() => {
    if (open && moment) upsellService.recordShown(moment);
  }, [open, moment]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (!detail.module || openRef.current) return; // ignore repeats while one is open
      openRef.current = true;
      setModuleId(detail.module);
      setMessage(detail.message || 'This feature is a premium add-on.');
      setAddon(null);
      setOpen(true);
    };
    window.addEventListener('salepilot:paywall', handler as EventListener);
    return () => window.removeEventListener('salepilot:paywall', handler as EventListener);
  }, []);

  // Resolve the add-on's price/name once the dialog is open.
  useEffect(() => {
    if (!open || !moduleId) return;
    let cancelled = false;
    api.get<AddonInfo[]>('/subscriptions/addons')
      .then((list) => { if (!cancelled) setAddon((list || []).find((a) => a.id === moduleId) || null); })
      .catch(() => { /* keep fallback name, no price */ });
    return () => { cancelled = true; };
  }, [open, moduleId]);

  const close = useCallback(() => {
    if (moment) upsellService.recordDismissed(moment); // analytics + cooldown (no effect on the hard 402 gate)
    openRef.current = false;
    setOpen(false);
    setModuleId(null);
    setAddon(null);
  }, [moment]);

  const goUnlock = useCallback(() => {
    const id = moduleId;
    if (moment) upsellService.recordClick(moment);
    close();
    navigate(`/subscription?view=addons${id ? `&module=${encodeURIComponent(id)}` : ''}`);
  }, [moduleId, moment, navigate, close]);

  // Secondary "recommended bundle" path — opens the full plans view.
  const goPlans = useCallback(() => {
    if (moment) upsellService.recordClick(moment);
    close();
    navigate('/subscription?view=plans');
  }, [moment, navigate, close]);

  if (!open) return null;

  const name = addon?.name || (moduleId ? FALLBACK_NAMES[moduleId] : '') || 'this feature';
  const priceLabel = addon ? `${money(addon.price, addon.currency)}/mo` : null;
  const alreadyOwned = !!addon?.owned;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-warm-900/50 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface border border-brand-border rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sp-amber-soft flex items-center justify-center">
            <span className="material-symbols-rounded text-sp-amber text-[30px]">lock</span>
          </div>
          <h3 className="text-lg font-extrabold tracking-tight text-brand-text mb-1.5">{moment ? moment.headline : `Unlock ${name}`}</h3>
          <p className="text-sm text-brand-text-muted">{moment?.body || message}</p>
          {priceLabel && !alreadyOwned && (
            <p className="text-2xl font-extrabold text-sp-green mt-3">{priceLabel}</p>
          )}
        </div>
        <div className="p-4 pt-0 flex flex-col gap-2">
          <button
            onClick={goUnlock}
            className="w-full py-3 rounded-xl text-sm font-bold bg-sp-green text-white hover:bg-sp-green-dark transition active:scale-95"
          >
            {alreadyOwned
              ? 'Manage add-on'
              : moment && !priceLabel
                ? moment.ctaLabel
                : moment && priceLabel
                  ? `${moment.ctaLabel} · ${priceLabel}`
                  : priceLabel
                    ? `Unlock for ${priceLabel}`
                    : 'See add-ons'}
          </button>
          {moment && !alreadyOwned && (
            <button
              onClick={goPlans}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-sp-green hover:bg-sp-green-soft transition active:scale-95"
            >
              See all plans
            </button>
          )}
          <button
            onClick={close}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-brand-text-muted hover:bg-surface-variant transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaywallHost;
