import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, THEME_PREFERENCE_ICON, THEME_PREFERENCE_LABEL } from '../../contexts/ThemeContext';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';
import type { Sale, StoreSettings } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { parseApiDate } from '../../components/crm/crmModel';
import StandaloneTopBar from '../../components/standalone/StandaloneTopBar';
import '../assistant/assistant.css';
import './hustle.css';

/** Parse a backend timestamp as UTC (naive strings are server-local = UTC on Render). */
const tsOf = (v?: string): number => parseApiDate(v ?? null)?.getTime() ?? 0;

const SKU = { sale: 'HUSTLE-QUICK', service: 'HUSTLE-SVC' } as const;
const isHustleSku = (sku?: string) => !!sku && sku.startsWith('HUSTLE');
const PAYMENT_METHODS = ['Cash', 'Mobile Money', 'Card'];
type View = 'hustle' | 'dashboard' | 'reports';
type HType = 'sale' | 'service';

interface HustleLine { id: string; name: string; amount: number; type: HType }
interface Entry { date: string; name: string; amount: number; type: HType }

interface HustleAppProps {
  sales: Sale[];
  storeSettings: StoreSettings;
  showSnackbar?: (message: string, type?: any) => void;
  /**
   * Embedded as the POS "Quick" mode: hide the app's own chrome (desktop
   * sidebar + mobile top bar) and render only the keypad, with an optional
   * mode switcher rendered on top so the user can flip back to Standard.
   */
  embedded?: boolean;
  modeSwitch?: React.ReactNode;
}

const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const DAY = 86400000;

const HustleApp: React.FC<HustleAppProps> = ({ sales, storeSettings, showSnackbar, embedded = false, modeSwitch }) => {
  const navigate = useNavigate();
  const { preference, cycleTheme } = useTheme();
  const { openAppSwitcher } = useAppSwitcher();
  const symbol = storeSettings?.currency?.symbol || '$';
  const fmt = (n: number) => formatCurrency(n, storeSettings);

  const [view, setView] = useState<View>('hustle');
  const [digits, setDigits] = useState('0');
  const [purpose, setPurpose] = useState('');
  const [type, setType] = useState<HType>('sale');
  const [cart, setCart] = useState<HustleLine[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [method, setMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);
  const [pulse, setPulse] = useState(false);
  // Hide the mobile top bar in the Hustle view to maximise keypad space.
  const [barHidden, setBarHidden] = useState(false);
  // Just-completed sales, merged into the dashboard/reports until the next data refresh.
  const [localEntries, setLocalEntries] = useState<Entry[]>([]);

  const value = parseInt(digits || '0', 10) / 100;
  const cartTotal = useMemo(() => cart.reduce((a, l) => a + l.amount, 0), [cart]);

  /* ----------------------------- hustle history ----------------------------- */
  const entries = useMemo<Entry[]>(() => {
    const fromSales = (sales || []).flatMap((s) =>
      (s.cart || []).filter((i) => isHustleSku(i.sku)).map((i) => ({
        date: s.timestamp,
        name: i.name,
        amount: (i.price || 0) * (i.quantity || 1),
        type: (i.sku === SKU.service ? 'service' : 'sale') as HType,
      })),
    );
    return [...localEntries, ...fromSales].sort((a, b) => tsOf(b.date) - tsOf(a.date));
  }, [sales, localEntries]);

  // Clear optimistic entries once the refreshed `sales` prop reflects them,
  // so a completed hustle sale isn't counted twice (local + server copy).
  useEffect(() => { setLocalEntries([]); }, [sales]);

  const metrics = useMemo(() => {
    const today = startOfDay().getTime();
    const weekAgo = today - 6 * DAY;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const sum = (arr: Entry[]) => arr.reduce((a, e) => a + e.amount, 0);
    const todayE = entries.filter((e) => tsOf(e.date) >= today);
    return {
      today: sum(todayE), todayCount: todayE.length,
      week: sum(entries.filter((e) => tsOf(e.date) >= weekAgo)),
      month: sum(entries.filter((e) => tsOf(e.date) >= monthStart.getTime())),
      all: sum(entries), allCount: entries.length,
      sales: sum(entries.filter((e) => e.type === 'sale')),
      services: sum(entries.filter((e) => e.type === 'service')),
    };
  }, [entries]);

  const last7 = useMemo(() => {
    const out: { label: string; total: number }[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = startOfDay(new Date(Date.now() - i * DAY));
      const total = entries.filter((e) => { const pd = parseApiDate(e.date); return !!pd && startOfDay(pd).getTime() === d.getTime(); }).reduce((a, e) => a + e.amount, 0);
      out.push({ label: days[d.getDay()], total });
    }
    return out;
  }, [entries]);
  const last7Max = Math.max(1, ...last7.map((d) => d.total));

  const topPurposes = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => m.set(e.name, (m.get(e.name) || 0) + e.amount));
    return [...m.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [entries]);

  /* ------------------------------- keypad ------------------------------- */
  const buzz = (p: number | number[]) => { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(p as any); };
  const append = (n: string) => { setDigits((d) => (d.length >= 9 ? d : d === '0' ? n : d + n)); setPulse(true); setTimeout(() => setPulse(false), 100); };
  const clearPad = () => setDigits('0');
  const backspace = () => setDigits((d) => (d.length <= 1 ? '0' : d.slice(0, -1)));
  const addToSale = () => {
    if (value <= 0) { showSnackbar?.('Enter an amount first.', 'warning'); return; }
    setCart((c) => [...c, { id: `h_${Date.now()}`, name: purpose.trim() || (type === 'service' ? 'Service' : 'Quick sale'), amount: value, type }]);
    buzz([20, 10, 20]); setDigits('0'); setPurpose('');
  };
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.id !== id));

  const completeSale = async () => {
    if (cart.length === 0 || processing) return;
    setProcessing(true);
    try {
      const payload = {
        items: cart.map((l) => ({ name: l.name, amount: l.amount, type: l.type, quantity: 1 })),
        paymentMethod: method,
      };
      const res: any = await api.post('/sales/quick', payload);
      const queued = !!(res && res.offline);
      // Reflect immediately in the dashboard/reports.
      const now = new Date().toISOString();
      setLocalEntries((prev) => [...cart.map((l) => ({ date: now, name: l.name, amount: l.amount, type: l.type })), ...prev]);
      showSnackbar?.(`${queued ? 'Sale queued' : 'Sale recorded'} · ${fmt(cartTotal)}`, 'success');
      setCart([]); setShowCart(false); buzz([20, 10, 30]);
    } catch (e) {
      showSnackbar?.('Could not record the sale. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const NAV: { id: View; icon: string; label: string }[] = [
    { id: 'hustle', icon: 'bolt', label: 'Hustle' },
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'reports', icon: 'bar_chart', label: 'Reports' },
  ];

  return (
    <div className="sp-assistant sp-hustle h-full flex overflow-hidden">
      {/* Desktop sidebar — hidden when embedded as the POS Quick mode (the POS
          shell already provides the navigation chrome). */}
      {!embedded && (
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 m3-bg-surface border-r m3-border-outline-variant">
        <div className="h-16 flex items-center gap-2 px-5 flex-shrink-0">
          <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 26 }}>bolt</span>
          <div className="leading-tight"><p className="font-bold m3-text-primary">Hustle POS</p><p className="text-[11px] m3-text-on-surface-variant">Fast sales</p></div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setView(n.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${view === n.id ? 'm3-bg-primary-fixed m3-text-primary' : 'm3-text-on-surface-variant hover:m3-bg-surface-high'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: view === n.id ? "'FILL' 1" : undefined }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-3 space-y-1 border-t m3-border-outline-variant">
          <button onClick={openAppSwitcher} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold m3-text-on-surface-variant hover:m3-bg-surface-high transition"><span className="material-symbols-outlined" style={{ fontSize: 22 }}>apps</span>SalePilot Apps</button>
          <button onClick={cycleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold m3-text-on-surface-variant hover:m3-bg-surface-high transition"><span className="material-symbols-outlined" style={{ fontSize: 22 }}>{THEME_PREFERENCE_ICON[preference]}</span>{THEME_PREFERENCE_LABEL[preference]}</button>
        </div>
      </aside>
      )}

      {/* Main column */}
      <div className="flex-1 min-h-0 flex flex-col">
        {embedded ? (
          modeSwitch && (
            <div className="flex-shrink-0 flex justify-center py-2 border-b m3-border-outline-variant">{modeSwitch}</div>
          )
        ) : (
          /* Mobile top bar — collapsible in the Hustle view to free up space */
          (view !== 'hustle' || !barHidden) && (
            <StandaloneTopBar
              currentRoute="hustle"
              navItems={NAV.map(n => ({ icon: n.icon, label: n.label, active: view === n.id, onClick: () => setView(n.id) }))}
              onExit={() => navigate('/')}
            />
          )
        )}

        {/* Body */}
        <div className={`flex-1 min-h-0 flex flex-col${view === 'hustle' ? ' md:items-center md:justify-center md:overflow-y-auto md:py-8' : ''}`}>
          {view === 'hustle' && (
            <div className="flex-1 min-h-0 flex flex-col justify-center w-full max-w-md mx-auto px-4 pb-3 md:flex-none md:max-w-sm md:px-6 md:pt-6 md:pb-6 md:m3-bg-surface-lowest md:border md:m3-border-outline-variant md:rounded-3xl md:shadow-lg">
              {/* Show / hide the top bar to maximise space (mobile only) —
                  irrelevant when embedded in the POS (no own top bar). */}
              {!embedded && (
                <button
                  type="button"
                  onClick={() => setBarHidden((h) => !h)}
                  className="md:hidden min-h-0 flex-shrink-0 self-center mt-1 mb-1 inline-flex items-center gap-1 h-6 px-3 rounded-full m3-bg-surface-container m3-text-on-surface-variant text-[11px] font-semibold active:scale-95 transition"
                  aria-label={barHidden ? 'Show menu bar' : 'Hide menu bar to free up space'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{barHidden ? 'expand_more' : 'expand_less'}</span>
                  {barHidden ? 'Show menu' : 'More space'}
                </button>
              )}

              {/* Current entry */}
              <div className="flex-shrink-0 flex flex-col items-center text-center">
                <label className="text-[10px] font-semibold uppercase tracking-wider m3-text-on-surface-variant">Current entry</label>
                <div className={`flex items-baseline m3-text-primary amount-pulse ${pulse ? 'scale-105' : ''}`}>
                  <span className="text-xl mr-1 font-semibold opacity-50">{symbol}</span>
                  <span className="font-bold text-[clamp(34px,11vw,48px)]" style={{ lineHeight: 1.05 }}>{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Purpose */}
              <input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose (optional) — e.g. Custom bouquet" className="flex-shrink-0 mt-2 w-full m3-bg-surface-lowest border m3-border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:ring-0 focus:m3-border-primary text-sm m3-text-on-surface m3-placeholder shadow-sm" />

              {/* Sale / service toggle */}
              <div className="flex-shrink-0 grid grid-cols-2 gap-2 mt-2">
                {(['sale', 'service'] as HType[]).map((t) => (
                  <button key={t} onClick={() => { setType(t); buzz(10); }} className={`tactile rounded-xl px-3 py-2.5 flex items-center justify-center gap-2 ${type === t ? 'selected' : ''}`}>
                    <span className="material-symbols-outlined tactile-icon m3-text-on-surface-variant" style={{ fontSize: 22, fontVariationSettings: type === t ? "'FILL' 1" : undefined }}>{t === 'service' ? 'settings_accessibility' : 'shopping_bag'}</span>
                    <span className="tactile-label text-sm font-semibold m3-text-on-surface">{t === 'service' ? 'Service' : 'Sold something'}</span>
                  </button>
                ))}
              </div>

              {/* Keypad — grows to fill remaining height (so nothing scrolls) but
                  is capped so the keys don't become elongated on tall screens.
                  The column's justify-center keeps the stack balanced once capped. */}
              <div className="grid grid-cols-3 grid-rows-4 gap-2 flex-1 min-h-0 max-h-[22rem] my-2 md:flex-none md:max-h-none md:my-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => <button key={n} onClick={() => append(n)} className="keypad-btn flex items-center justify-center text-2xl font-semibold m3-text-on-surface md:h-16">{n}</button>)}
                <button onClick={clearPad} className="keypad-btn flex items-center justify-center text-xl font-semibold m3-text-error md:h-16" style={{ background: 'var(--m3-surface-low)' }}>C</button>
                <button onClick={() => append('0')} className="keypad-btn flex items-center justify-center text-2xl font-semibold m3-text-on-surface md:h-16">0</button>
                <button onClick={backspace} className="keypad-btn flex items-center justify-center m3-text-on-surface-variant md:h-16" style={{ background: 'var(--m3-surface-low)' }}><span className="material-symbols-outlined">backspace</span></button>
              </div>

              {/* Action bar — always visible, no scroll needed */}
              <div className="flex-shrink-0">
                {cart.length > 0 && (
                  <button onClick={() => setShowCart(true)} className="w-full mb-2 flex items-center justify-between px-4 py-2 rounded-xl m3-bg-surface-container active:scale-[0.99] transition">
                    <span className="flex items-center gap-2 text-sm font-semibold m3-text-on-surface"><span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 20 }}>receipt_long</span>{cart.length} item{cart.length === 1 ? '' : 's'}</span>
                    <span className="text-sm font-bold m3-text-primary">{fmt(cartTotal)} · Review</span>
                  </button>
                )}
                <button onClick={addToSale} className="big-green-button w-full py-3 m3-bg-primary m3-text-on-primary rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition"><span className="material-symbols-outlined">add_circle</span>Add to sale</button>
              </div>
            </div>
          )}

          {view === 'dashboard' && (
            <div className="flex-1 min-h-0 overflow-y-auto sp-scroll px-4 md:px-8 py-6">
              <div className="max-w-3xl mx-auto w-full">
                <h2 className="text-2xl md:text-[28px] font-bold m3-text-on-surface mb-1">Hustle dashboard</h2>
                <p className="text-sm m3-text-on-surface-variant mb-5">Your quick-sale activity at a glance.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <Kpi icon="today" label="Today" value={fmt(metrics.today)} sub={`${metrics.todayCount} entr${metrics.todayCount === 1 ? 'y' : 'ies'}`} tone="primary" />
                  <Kpi icon="date_range" label="This week" value={fmt(metrics.week)} tone="primary" />
                  <Kpi icon="calendar_month" label="This month" value={fmt(metrics.month)} tone="primary" />
                  <Kpi icon="savings" label="All time" value={fmt(metrics.all)} sub={`${metrics.allCount} total`} tone="tertiary" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm flex items-center justify-between">
                    <div><p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant">Products sold</p><p className="text-lg font-bold m3-text-on-surface">{fmt(metrics.sales)}</p></div>
                    <span className="material-symbols-outlined m3-text-primary">shopping_bag</span>
                  </div>
                  <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm flex items-center justify-between">
                    <div><p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant">Services</p><p className="text-lg font-bold m3-text-on-surface">{fmt(metrics.services)}</p></div>
                    <span className="material-symbols-outlined m3-text-secondary">settings_accessibility</span>
                  </div>
                </div>
                <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden">
                  <div className="p-4 border-b m3-border-outline-variant flex items-center justify-between">
                    <h3 className="text-lg font-bold m3-text-on-surface">Recent entries</h3>
                    <button onClick={() => setView('hustle')} className="text-sm font-semibold m3-text-primary">New +</button>
                  </div>
                  {entries.length === 0 ? <p className="p-6 text-center text-sm m3-text-on-surface-variant">No hustle sales yet. Tap “Hustle” to record your first.</p> : (
                    <div className="divide-y" style={{ borderColor: 'var(--m3-outline-variant)' }}>
                      {entries.slice(0, 10).map((e, i) => (
                        <div key={i} className="flex items-center gap-3 p-4">
                          <span className="w-9 h-9 rounded-lg m3-bg-surface-high flex items-center justify-center shrink-0"><span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 18 }}>{e.type === 'service' ? 'settings_accessibility' : 'shopping_bag'}</span></span>
                          <div className="min-w-0 flex-1"><p className="text-sm font-medium m3-text-on-surface truncate">{e.name}</p><p className="text-[11px] m3-text-on-surface-variant">{parseApiDate(e.date)?.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) ?? ''}</p></div>
                          <span className="text-sm font-bold m3-text-on-surface">{fmt(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'reports' && (
            <div className="flex-1 min-h-0 overflow-y-auto sp-scroll px-4 md:px-8 py-6">
              <div className="max-w-3xl mx-auto w-full">
                <h2 className="text-2xl md:text-[28px] font-bold m3-text-on-surface mb-1">Hustle reports</h2>
                <p className="text-sm m3-text-on-surface-variant mb-5">Trends across your quick sales.</p>

                {/* 7-day chart */}
                <div className="m3-bg-surface-lowest rounded-2xl p-5 border m3-border-outline-variant shadow-sm mb-4">
                  <h3 className="text-lg font-bold m3-text-on-surface mb-4">Last 7 days</h3>
                  <div className="flex items-end justify-between gap-2 h-40">
                    {last7.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end justify-center" style={{ height: 120 }}>
                          <div className="bar w-6 md:w-8" style={{ height: `${Math.max(4, (d.total / last7Max) * 120)}px`, background: 'var(--m3-primary)' }} title={fmt(d.total)} />
                        </div>
                        <span className="text-[11px] m3-text-on-surface-variant">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* type split */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <SplitCard label="Products" amount={metrics.sales} total={metrics.sales + metrics.services} fmt={fmt} color="var(--m3-primary)" />
                  <SplitCard label="Services" amount={metrics.services} total={metrics.sales + metrics.services} fmt={fmt} color="var(--m3-secondary)" />
                </div>

                {/* top purposes */}
                <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden">
                  <div className="p-4 border-b m3-border-outline-variant"><h3 className="text-lg font-bold m3-text-on-surface">Top items</h3></div>
                  {topPurposes.length === 0 ? <p className="p-6 text-center text-sm m3-text-on-surface-variant">No data yet.</p> : (
                    <div className="divide-y" style={{ borderColor: 'var(--m3-outline-variant)' }}>
                      {topPurposes.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 p-4">
                          <span className="w-6 text-center text-sm font-bold m3-text-on-surface-variant">{i + 1}</span>
                          <span className="flex-1 text-sm font-medium m3-text-on-surface truncate">{p.name}</span>
                          <span className="text-sm font-bold m3-text-on-surface">{fmt(p.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Cart / checkout sheet */}
      {showCart && (
        <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 sp-fade-in" onClick={() => setShowCart(false)} />
          <div className="relative w-full md:max-w-md m3-bg-surface rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col sp-fade-in">
            <div className="flex items-center justify-between px-5 h-14 border-b m3-border-outline-variant flex-shrink-0">
              <h3 className="font-bold m3-text-on-surface">Current sale</h3>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto sp-scroll p-3">
              {cart.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl">
                  <span className="w-9 h-9 rounded-lg m3-bg-surface-high flex items-center justify-center shrink-0"><span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 18 }}>{l.type === 'service' ? 'settings_accessibility' : 'shopping_bag'}</span></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium m3-text-on-surface truncate">{l.name}</p><p className="text-[11px] m3-text-on-surface-variant capitalize">{l.type}</p></div>
                  <span className="text-sm font-bold m3-text-on-surface">{fmt(l.amount)}</span>
                  <button onClick={() => removeLine(l.id)} className="m3-text-on-surface-variant hover:m3-text-error"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span></button>
                </div>
              ))}
            </div>
            <div className="flex-shrink-0 p-4 border-t m3-border-outline-variant">
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide m3-text-on-surface-variant mb-1.5">Payment</p>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map((m) => <button key={m} onClick={() => setMethod(m)} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${method === m ? 'm3-bg-primary m3-text-on-primary' : 'm3-bg-surface-container m3-text-on-surface-variant'}`}>{m}</button>)}
                </div>
              </div>
              <div className="flex items-center justify-between mb-3"><span className="text-sm m3-text-on-surface-variant">Total</span><span className="text-2xl font-bold m3-text-on-surface">{fmt(cartTotal)}</span></div>
              <button onClick={completeSale} disabled={processing} className="big-green-button w-full h-14 m3-bg-primary m3-text-on-primary rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"><span className="material-symbols-outlined">{processing ? 'progress_activity' : 'check_circle'}</span>{processing ? 'Recording…' : 'Complete sale'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Kpi: React.FC<{ icon: string; label: string; value: string; sub?: string; tone: 'primary' | 'tertiary' }> = ({ icon, label, value, sub, tone }) => (
  <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
    <span className={`material-symbols-outlined ${tone === 'tertiary' ? 'm3-text-tertiary' : 'm3-text-primary'}`} style={{ fontSize: 24 }}>{icon}</span>
    <p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant mt-1.5">{label}</p>
    <p className="text-xl font-bold m3-text-on-surface">{value}</p>
    {sub && <p className="text-[11px] m3-text-on-surface-variant">{sub}</p>}
  </div>
);

const SplitCard: React.FC<{ label: string; amount: number; total: number; fmt: (n: number) => string; color: string }> = ({ label, amount, total, fmt, color }) => {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
      <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold m3-text-on-surface">{label}</span><span className="text-sm font-bold m3-text-on-surface">{fmt(amount)}</span></div>
      <div className="h-2 w-full rounded-full overflow-hidden m3-bg-surface-high"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
      <p className="text-[11px] m3-text-on-surface-variant mt-1">{pct}% of hustle revenue</p>
    </div>
  );
};

export default HustleApp;
