import React, { Suspense, lazy, useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { StoreSettings } from '../../types';
import { hasModule, MODULES } from '../../utils/entitlements';
import { currencyFromSettings, type CurrencyContext } from './insights';
import './assistant.css';

// Lazy so the heavy chat deps (markdown, xlsx, jspdf) load only when opened —
// keeps the host app's bundle light. This makes the launcher a cheap one-line
// drop-in for ANY app shell (POS, CRM, Inventory, Procurement, …).
const AssistantChat = lazy(() => import('./AssistantChat'));

interface AssistantLauncherProps {
  /** Display name for the greeting (e.g. the signed-in user's first name). */
  userName?: string;
  /** Currency context for AI grounding. If omitted, it's fetched from /settings. */
  currency?: CurrencyContext;
  /**
   * Whether the AI Assistant premium module is unlocked. If omitted, the
   * launcher resolves it from /settings. When locked, NOTHING is rendered
   * (no floating button), so it stays invisible in apps without the add-on.
   */
  unlocked?: boolean;
  /** Where the FAB sits. Defaults to bottom-right. */
  position?: 'bottom-right' | 'bottom-left';
  /** Optional label shown next to the FAB icon on wider screens. */
  label?: string;
}

const DEFAULT_CURRENCY: CurrencyContext = { symbol: '$', code: 'USD', position: 'before' };

/**
 * Floating "Ask AI" launcher + slide-in assistant panel. Self-contained and
 * theme-scoped (.sp-assistant), so it can be mounted inside any app without
 * pulling in that app's styling or data wiring.
 */
const AssistantLauncher: React.FC<AssistantLauncherProps> = ({
  userName,
  currency,
  unlocked: unlockedProp,
  position = 'bottom-right',
  label = 'Ask AI',
}) => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Resolve store settings once for currency + the premium entitlement, unless
  // the host already provided both. Cached by the api/IndexedDB layer.
  useEffect(() => {
    if (currency && unlockedProp !== undefined) return;
    let active = true;
    api.get<StoreSettings>('/settings')
      .then((s) => { if (active && s) setSettings(s); })
      .catch(() => { /* keep defaults */ });
    return () => { active = false; };
  }, [currency, unlockedProp]);

  const resolvedCurrency = currency ?? (settings ? currencyFromSettings(settings) : DEFAULT_CURRENCY);
  // Locked by default until we know otherwise — avoids flashing a button the
  // store can't use.
  const unlocked = unlockedProp ?? (settings ? hasModule(settings, MODULES.AI_ASSISTANT) : false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const side = position === 'bottom-left' ? 'left-4 md:left-6' : 'right-4 md:right-6';

  // Premium gate: no entitlement → no floating button at all.
  if (!unlocked) return null;

  return (
    <div className="sp-assistant">
      {/* Floating action button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open business assistant"
          className={`fixed bottom-20 md:bottom-6 ${side} z-[80] flex items-center gap-2 h-14 px-4 rounded-full m3-bg-primary m3-text-on-primary shadow-lg hover:scale-105 active:scale-95 transition`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>auto_awesome</span>
          <span className="hidden sm:inline font-semibold text-sm pr-1">{label}</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/40 sp-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Business assistant"
            className="fixed z-[95] m3-bg-surface shadow-2xl flex flex-col sp-fade-in
                       inset-x-0 bottom-0 h-[85vh] rounded-t-2xl
                       md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:h-full md:rounded-none md:rounded-l-2xl"
          >
            {/* Panel header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b m3-border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 22 }}>auto_awesome</span>
                <span className="font-bold m3-text-on-surface">Business Assistant</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high transition active:scale-90"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <Suspense
                fallback={
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="material-symbols-outlined m3-text-primary animate-spin" style={{ fontSize: 28 }}>progress_activity</span>
                  </div>
                }
              >
                <AssistantChat userName={userName?.split(' ')[0]} currency={resolvedCurrency} />
              </Suspense>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssistantLauncher;
