import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';
import type { User, Product, Sale, Customer, StoreSettings } from '../../types';
import {
  computeInsights,
  fetchBusinessInsights,
  greetingWord,
  type BusinessInsights,
  type InsightCard,
} from './insights';
import AssistantChat from './AssistantChat';
import StandaloneTopBar from '../../components/standalone/StandaloneTopBar';
import './assistant.css';

type View = 'dashboard' | 'chat';

interface AssistantAppProps {
  /** Provided by the Dashboard shell (authenticated session). */
  user?: User | null;
  /** When true, the AI add-on isn't on the plan — show an upgrade gate. */
  locked?: boolean;
  /** Active section, derived from the route (/assistant vs /assistant/chat). */
  section?: View;
  /** Shared, already-loaded data from the host (Dashboard) — no extra fetch. */
  products?: Product[];
  sales?: Sale[];
  customers?: Customer[];
  storeSettings?: StoreSettings | null;
  onNavigate?: (section: View) => void;
  onExit?: () => void;
  onLogout?: () => void;
}

const toneClasses: Record<InsightCard['badgeTone'], { icon: string; badge: string; cta: string }> = {
  primary: { icon: 'm3-bg-primary-fixed m3-text-primary', badge: 'm3-text-primary', cta: 'm3-bg-primary m3-text-on-primary' },
  secondary: { icon: 'm3-bg-secondary-fixed m3-text-secondary', badge: 'm3-text-secondary', cta: 'border-2 m3-border-secondary m3-text-secondary' },
  tertiary: { icon: 'm3-bg-tertiary-fixed m3-text-tertiary', badge: 'm3-text-tertiary', cta: 'm3-bg-tertiary m3-text-on-tertiary' },
};

const cardIcon: Record<string, string> = {
  'Sales Alert': 'trending_up',
  'Inventory Tip': 'inventory_2',
  'Customer Note': 'stars',
};

const AssistantApp: React.FC<AssistantAppProps> = ({
  user: userProp,
  locked = false,
  section,
  products,
  sales,
  customers,
  storeSettings,
  onNavigate,
  onExit,
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { openAppSwitcher } = useAppSwitcher();

  // When embedded by Dashboard, `user` is provided; otherwise resolve the session.
  const [user, setUser] = useState<User | null>(userProp ?? getCurrentUser());
  // Did the host pass live data? (controlled vs standalone mode)
  const hostProvidedData = products !== undefined || sales !== undefined || customers !== undefined;

  const [insights, setInsights] = useState<BusinessInsights | null>(
    hostProvidedData ? computeInsights(products, sales, customers, storeSettings ?? null) : null,
  );
  const [loading, setLoading] = useState(!hostProvidedData);
  const [view, setView] = useState<View>(section ?? 'dashboard');
  const [dashInput, setDashInput] = useState('');
  const [pendingQuery, setPendingQuery] = useState<string | undefined>();
  const insightsRef = useRef<HTMLDivElement>(null);

  // Standalone fallback: if no session and no host, send to login.
  useEffect(() => {
    if (userProp) { setUser(userProp); return; }
    if (!getCurrentUser()) navigate('/login', { replace: true });
  }, [userProp, navigate]);

  // Recompute from host data whenever it changes; otherwise fetch once.
  useEffect(() => {
    if (hostProvidedData) {
      setInsights(computeInsights(products, sales, customers, storeSettings ?? null));
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchBusinessInsights()
      .then((data) => { if (active) setInsights(data); })
      .catch((e) => console.error('[assistant] insights failed', e))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [hostProvidedData, products, sales, customers, storeSettings]);

  // Keep the view in sync with the route-driven section prop.
  useEffect(() => {
    if (section && section !== view) setView(section);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const firstName = useMemo(() => user?.name?.split(' ')[0] || '', [user]);
  const initial = (user?.name?.trim()?.[0] || 'S').toUpperCase();

  const setSection = (next: View) => {
    setView(next);
    onNavigate?.(next);
  };
  const openChat = (query?: string) => {
    setPendingQuery(query);
    setSection('chat');
  };
  const goHome = () => setSection('dashboard');

  const submitDashInput = (e: React.FormEvent) => {
    e.preventDefault();
    const q = dashInput.trim();
    if (!q) return;
    setDashInput('');
    openChat(q);
  };

  const goInsights = () => {
    setSection('dashboard');
    requestAnimationFrame(() => insightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleExit = () => (onExit ? onExit() : navigate('/'));

  if (!user) return null;

  // Premium gate — the AI Business Assistant is a paid add-on.
  if (locked) {
    return (
      <div className="sp-assistant h-full flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="max-w-md sp-fade-in">
          <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 56 }}>auto_awesome</span>
          <h1 className="text-2xl font-bold m3-text-on-surface mt-3 mb-1">AI Business Assistant</h1>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full m3-bg-secondary-fixed m3-text-secondary mb-4">Premium add-on</span>
          <p className="m3-text-on-surface-variant mb-6 leading-relaxed">
            Unlock a conversational assistant grounded on your store data — sales trends, forecasts,
            low-stock alerts, customer insights and instant reports, on demand.
          </p>
          <button
            onClick={() => navigate('/subscription')}
            className="w-full py-3 rounded-xl m3-bg-primary m3-text-on-primary font-semibold active:scale-95 transition hover:opacity-90"
          >
            Unlock premium
          </button>
          <button
            onClick={handleExit}
            className="w-full py-3 mt-2 rounded-xl m3-text-on-surface-variant hover:m3-bg-surface-high font-semibold transition"
          >
            Back to app
          </button>
        </div>
      </div>
    );
  }

  const cards = insights ? [insights.salesAlert, insights.inventoryTip, insights.customerNote] : [];
  const currency = insights?.currency || { symbol: '$', code: 'USD', position: 'before' as const };

  return (
    <div className="sp-assistant h-full flex overflow-hidden">
      {/* Desktop sidebar rail */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 m3-bg-surface border-r m3-border-outline-variant">
        <div className="h-16 flex items-center gap-2 px-5 flex-shrink-0">
          <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 26 }}>auto_awesome</span>
          <div className="leading-tight min-w-0">
            <p className="font-bold m3-text-primary truncate">Business Assistant</p>
            <p className="text-[11px] m3-text-on-surface-variant">SalePilot AI Suite</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto sp-scroll">
          <RailItem icon="dashboard" label="Dashboard" active={view === 'dashboard'} onClick={goHome} />
          <RailItem icon="forum" label="Assistant" active={view === 'chat'} onClick={() => openChat()} />
          <RailItem icon="insights" label="Insights" onClick={goInsights} />
        </nav>
        <div className="px-3 py-3 space-y-1 border-t m3-border-outline-variant flex-shrink-0">
          <RailItem icon="apps" label="SalePilot Apps" onClick={openAppSwitcher} />
          <RailItem icon={theme === 'dark' ? 'light_mode' : 'dark_mode'} label={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggleTheme} />
          <button
            onClick={() => navigate('/account')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:m3-bg-surface-high transition mt-1"
            title="Profile"
          >
            <span className="w-9 h-9 rounded-full overflow-hidden border-2 m3-border-primary flex items-center justify-center m3-bg-primary-fixed m3-text-primary font-bold flex-shrink-0">
              {user.profilePicture ? <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" /> : <span>{initial}</span>}
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-sm font-semibold m3-text-on-surface truncate">{user.name}</span>
              <span className="block text-[11px] m3-text-on-surface-variant capitalize truncate">{user.role}</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Mobile top app bar */}
        <StandaloneTopBar
          currentRoute="assistant"
          navItems={[
            { icon: 'dashboard', label: 'Home', active: view === 'dashboard', onClick: goHome },
            { icon: 'forum', label: 'Assistant', active: view === 'chat', onClick: () => openChat() },
            { icon: 'insights', label: 'Insights', active: false, onClick: goInsights },
          ]}
          onExit={handleExit}
          rightExtra={
            <button
              onClick={() => navigate('/account')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 m3-border-primary flex items-center justify-center m3-bg-primary-fixed m3-text-primary font-bold"
              title="Profile"
            >
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </button>
          }
        />

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col">
        {view === 'chat' ? (
          <div className="flex-1 min-h-0">
            <AssistantChat
              userName={firstName}
              currency={currency}
              initialQuery={pendingQuery}
              onConsumedInitialQuery={() => setPendingQuery(undefined)}
            />
          </div>
        ) : (
          <>
            <main className="flex-1 overflow-y-auto sp-scroll px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
              {/* Greeting */}
              <section className="mb-6">
                <h2 className="text-2xl md:text-[32px] font-bold m3-text-on-surface mb-1">
                  {greetingWord()}{firstName ? `, ${firstName}` : ''}!
                </h2>
                {loading ? (
                  <div className="h-5 w-3/4 rounded m3-bg-surface-high animate-pulse mt-2" />
                ) : (
                  <p className="text-base md:text-lg m3-text-on-surface-variant max-w-2xl leading-relaxed">
                    {insights?.summary}
                  </p>
                )}
              </section>

              {/* Insight bento grid */}
              <div ref={insightsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {loading
                  ? [0, 1, 2].map((i) => <div key={i} className="glass-card p-6 rounded-2xl h-52 animate-pulse" />)
                  : cards.map((card) => {
                      const tone = toneClasses[card.badgeTone];
                      return (
                        <div
                          key={card.title}
                          className={`glass-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between sp-fade-in ${card.badgeTone === 'secondary' ? 'border-l-4 m3-border-secondary' : ''}`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className={`material-symbols-outlined p-2 rounded-lg ${tone.icon}`}>
                                {cardIcon[card.title] || 'insights'}
                              </span>
                              <span className={`text-xs font-bold ${tone.badge}`}>{card.badge}</span>
                            </div>
                            <h3 className="text-lg font-bold m3-text-on-surface mb-1">{card.title}</h3>
                            <p className="text-sm m3-text-on-surface-variant leading-relaxed">{card.body}</p>
                          </div>
                          <button
                            onClick={() => openChat(card.prompt)}
                            className={`mt-5 w-full py-2.5 font-semibold text-sm rounded-lg active:scale-95 transition hover:opacity-90 ${tone.cta}`}
                          >
                            {card.cta}
                          </button>
                        </div>
                      );
                    })}
              </div>

              {/* Ask AI visualizer */}
              <button
                onClick={() => openChat()}
                className="relative w-full h-44 rounded-2xl overflow-hidden m3-bg-surface-high flex items-center justify-center group active:scale-[0.99] transition"
              >
                <div className="text-center px-6">
                  <p className="text-sm font-semibold m3-text-primary mb-3">Tap to ask SalePilot AI anything</p>
                  <div className="flex gap-1.5 justify-center items-end h-12">
                    {[8, 12, 6, 10, 7, 11].map((h, i) => (
                      <span key={i} className="viz-bar idle group-hover:opacity-100" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </div>
                </div>
              </button>
            </main>

            {/* Floating conversational input */}
            <div className="flex-shrink-0 px-4 md:px-8 pb-2 max-w-4xl mx-auto w-full">
              <form
                onSubmit={submitDashInput}
                className="ai-input-glow flex items-center m3-bg-surface-lowest border m3-border-outline-variant rounded-full p-2 shadow-lg h-14 transition"
              >
                <span className="material-symbols-outlined m3-text-primary pl-3 pr-2" style={{ fontSize: 22 }}>auto_awesome</span>
                <input
                  value={dashInput}
                  onChange={(e) => setDashInput(e.target.value)}
                  placeholder="Ask me anything about your business…"
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-[15px] m3-text-on-surface m3-placeholder"
                />
                <button
                  type="submit"
                  className="w-10 h-10 flex items-center justify-center m3-bg-primary m3-text-on-primary rounded-full mr-0.5 hover:scale-105 transition active:scale-90"
                  title="Ask"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_upward</span>
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      </div>
    </div>
  );
};

const RailItem: React.FC<{ icon: string; label: string; active?: boolean; onClick: () => void }> = ({
  icon,
  label,
  active = false,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${
      active ? 'm3-bg-primary-fixed m3-text-primary' : 'm3-text-on-surface-variant hover:m3-bg-surface-high'
    }`}
  >
    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
    {label}
  </button>
);

export default AssistantApp;
