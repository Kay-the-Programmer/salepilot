import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';
import { getCurrentUser } from '../../services/authService';
import StandaloneTopBar from '../../components/standalone/StandaloneTopBar';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { formatLongDate as formatDate } from '../../utils/date';
import type { BackendPlan, SubscriptionHistoryItem } from '../../types/subscription';
import { logEvent } from '../../src/utils/analytics';
import { upsellService } from '../../services/upsellService';
import { discounted } from '../../components/upsell/offer';
import '../assistant/assistant.css';
import './subscription.css';

/** Net add-on price after any live campaign offer — the checkout charges the
 *  same (the server independently applies the discount; this only mirrors it). */
const netAddonPrice = (a: { id: string; price: number }): number =>
  discounted(a.price, upsellService.getModuleOffer(a.id)?.discountPct);

const CustomPaymentModal = React.lazy(() => import('../../components/subscription/CustomPaymentModal'));

declare global {
  interface Window { LencoPay: any; }
}

type View = 'manage' | 'plans' | 'addons';

interface PurchasableAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  owned: boolean;
  activeUntil: string | null;
  autoRenew: boolean;
}

interface AddonCheckout {
  amount: number;
  currency: string;
  moduleIds: string[];
  label: string;
}

const currencySymbol = (code = 'ZMW') =>
  code === 'USD' ? '$' : code === 'ZMW' ? 'K' : code === 'GBP' ? '£' : code === 'EUR' ? '€' : '';

const money = (amount: number, code = 'ZMW') => {
  const sym = currencySymbol(code);
  const n = (isFinite(amount) ? amount : 0).toLocaleString();
  return sym ? `${sym}${n}` : `${code} ${n}`;
};


const tierLabel = (index: number, total: number) =>
  index === 0 ? 'Basic' : index === total - 1 ? 'Maximum' : 'Advanced';

const SubscriptionApp: React.FC = () => {
  const navigate = useNavigate();
  const { openAppSwitcher } = useAppSwitcher();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<View>('manage');
  const [plans, setPlans] = useState<BackendPlan[]>([]);
  const [fetchingPlans, setFetchingPlans] = useState(true);
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [isAnnual, setIsAnnual] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [planToPay, setPlanToPay] = useState<BackendPlan | null>(null);
  const [currentReference, setCurrentReference] = useState<string | null>(null);
  const stopPollingRef = useRef(false);
  const historyRef = useRef<HTMLDivElement>(null);

  // Add-ons (à-la-carte modules)
  const [addons, setAddons] = useState<PurchasableAddon[]>([]);
  const [fetchingAddons, setFetchingAddons] = useState(true);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [addonCheckout, setAddonCheckout] = useState<AddonCheckout | null>(null);
  const [planAutoRenew, setPlanAutoRenew] = useState<boolean>(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login', { replace: true }); return; }
    setUser(u);
  }, [navigate]);

  // Deep-link from the soft paywall: /subscription?view=addons&module=<id>
  useEffect(() => {
    if (searchParams.get('view') === 'addons') setView('addons');
    const m = searchParams.get('module');
    if (m) setSelectedAddons((prev) => new Set(prev).add(m));
  }, [searchParams]);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await api.get<BackendPlan[]>('/subscriptions/plans');
      setPlans(data || []);
    } catch (e) {
      console.error('Error fetching plans:', e);
      showToast('Failed to load subscription plans', 'error');
    } finally {
      setFetchingPlans(false);
    }
  }, [showToast]);

  const fetchHistory = useCallback(async (storeId: string) => {
    try {
      const data = await api.get<SubscriptionHistoryItem[]>(`/subscriptions/history/${storeId}`);
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Could not load billing history', e);
      setHistory([]);
    }
  }, []);

  const fetchAddons = useCallback(async () => {
    try {
      const data = await api.get<PurchasableAddon[]>('/subscriptions/addons');
      setAddons(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Could not load add-ons', e);
      setAddons([]);
    } finally {
      setFetchingAddons(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchPlans();
    fetchAddons();
    if (user.currentStoreId) {
      fetchHistory(user.currentStoreId);
      api.get<{ autoRenew: boolean }>('/subscriptions/auto-renew')
        .then((d) => setPlanAutoRenew(!!d?.autoRenew))
        .catch(() => { /* default on */ });
    }
  }, [user, fetchPlans, fetchAddons, fetchHistory]);

  const handleTogglePlanAutoRenew = useCallback(async () => {
    const next = !planAutoRenew;
    setPlanAutoRenew(next); // optimistic
    try {
      await api.patch('/subscriptions/auto-renew', { autoRenew: next });
      showToast(next ? 'Auto-renew turned on.' : 'Auto-renew turned off.', 'success');
    } catch (e: any) {
      setPlanAutoRenew(!next);
      showToast(e?.message || 'Could not update auto-renew.', 'error');
    }
  }, [planAutoRenew, showToast]);

  // ---- Payment flow (ported from the existing SubscriptionPage) ----
  const pollVerification = useCallback(async (reference: string, retries = 0) => {
    if (stopPollingRef.current) return;
    try {
      const data = await api.get<any>(`/subscriptions/verify/${reference}`);
      if (data.success) {
        const wasAddon = !!addonCheckout;
        showToast(wasAddon ? 'Payment successful! Your add-on is now active.' : 'Payment successful! Your subscription is now active.', 'success');
        logEvent('Subscription', wasAddon ? 'BuyAddon' : 'Subscribe', wasAddon ? addonCheckout?.label : planToPay?.name);
        // Attribute an upsell conversion if any purchased module was clicked from
        // an upsell earlier this session (emits upsell_convert).
        if (wasAddon) upsellService.notePurchaseCompleted(addonCheckout?.moduleIds);
        setLoading(false);
        setIsPaymentModalOpen(false);
        setSelectedAddons(new Set());
        setAddonCheckout(null);
        const u = getCurrentUser();
        setUser(u);
        if (u?.currentStoreId) fetchHistory(u.currentStoreId);
        fetchAddons();
        setView(wasAddon ? 'addons' : 'manage');
      } else if (data.pending) {
        if (retries < 20) setTimeout(() => pollVerification(reference, retries + 1), 3000);
        else { showToast('Payment confirmation is taking longer than expected. Please check back later.', 'warning'); setLoading(false); setIsPaymentModalOpen(false); }
      } else {
        showToast(data.message || 'Payment verification failed', 'error');
        setLoading(false); setIsPaymentModalOpen(false);
      }
    } catch (e) {
      if (retries < 20) setTimeout(() => pollVerification(reference, retries + 1), 3000);
      else { showToast('Failed to verify payment. If you were charged, please contact support.', 'error'); setLoading(false); setIsPaymentModalOpen(false); }
    }
  }, [planToPay, addonCheckout, showToast, fetchHistory, fetchAddons]);

  const handlePayment = useCallback(async (method: 'card' | 'mobile-money', phoneNumber?: string) => {
    const isAddon = !!addonCheckout;
    if (!isAddon && !planToPay) return;
    if (!user?.currentStoreId) { showToast('Store context missing. Please re-login.', 'error'); return; }
    setLoading(true);
    try {
      const response = isAddon
        ? await api.post<any>('/subscriptions/addons/pay', { moduleIds: addonCheckout!.moduleIds, method, phoneNumber })
        : await api.post<any>('/subscriptions/pay', { storeId: user.currentStoreId, planId: planToPay!.id, method, phoneNumber, billingCycle: isAnnual ? 'annual' : 'monthly' });
      const { reference, lencoResult } = response;
      // Use the backend-computed amount (authoritative for annual pricing + discounts).
      const amount = (typeof response.amount === 'number' && response.amount > 0)
        ? response.amount
        : (isAddon ? addonCheckout!.amount : planToPay!.price);
      const currency = isAddon ? addonCheckout!.currency : (planToPay!.currency || 'ZMW');
      setCurrentReference(reference);
      stopPollingRef.current = false;

      if (method === 'mobile-money' && lencoResult?.status) {
        showToast('Payment prompt sent to your phone. Waiting for confirmation...', 'info');
        await pollVerification(reference);
        return;
      }
      if (!window.LencoPay) throw new Error('Lenco SDK not loaded. Please refresh the page.');
      window.LencoPay.getPaid({
        key: import.meta.env.VITE_LENCO_PUBLIC_KEY,
        reference, email: user.email, amount, currency,
        channels: [method], customer: { phone: phoneNumber },
        onSuccess: async () => { await pollVerification(reference); },
        onClose: () => { setLoading(false); setIsPaymentModalOpen(false); },
        onConfirmationPending: () => { showToast('Payment prompt sent to your phone. Waiting for confirmation...', 'info'); pollVerification(reference); },
      });
    } catch (e: any) {
      console.error('Payment Error:', e);
      showToast(e.message || 'Failed to process payment. Please try again.', 'error');
      setLoading(false);
    }
  }, [planToPay, addonCheckout, isAnnual, user, showToast, pollVerification]);

  const handleSelectPlan = useCallback((planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    setSelectedPlan(planId);
    setAddonCheckout(null);
    setPlanToPay(plan);
    setIsPaymentModalOpen(true);
  }, [plans]);

  const toggleAddon = useCallback((id: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleToggleAutoRenew = useCallback(async (moduleId: string, autoRenew: boolean) => {
    // Optimistic update, then persist.
    setAddons((prev) => prev.map((a) => (a.id === moduleId ? { ...a, autoRenew } : a)));
    try {
      await api.patch(`/subscriptions/addons/${moduleId}/auto-renew`, { autoRenew });
      showToast(autoRenew ? 'Auto-renew turned on.' : 'Auto-renew turned off.', 'success');
    } catch (e: any) {
      setAddons((prev) => prev.map((a) => (a.id === moduleId ? { ...a, autoRenew: !autoRenew } : a)));
      showToast(e?.message || 'Could not update auto-renew.', 'error');
    }
  }, [showToast]);

  const handleBuyAddons = useCallback(() => {
    const chosen = addons.filter((a) => selectedAddons.has(a.id) && !a.owned);
    if (chosen.length === 0) { showToast('Select at least one add-on to continue.', 'info'); return; }
    const amount = chosen.reduce((s, a) => s + netAddonPrice(a), 0);
    const currency = chosen[0].currency || 'ZMW';
    setPlanToPay(null);
    setAddonCheckout({ amount, currency, moduleIds: chosen.map((a) => a.id), label: chosen.length === 1 ? chosen[0].name : `${chosen.length} add-ons` });
    setIsPaymentModalOpen(true);
  }, [addons, selectedAddons, showToast]);

  const handleCancelTransaction = useCallback(async () => {
    if (!currentReference) return;
    try {
      stopPollingRef.current = true;
      setLoading(false);
      const response = await api.post<any>(`/subscriptions/cancel/${currentReference}`);
      if (response.success || response.status) showToast('Transaction cancelled. Decline any USSD prompt on your phone.', 'success');
      else showToast(response.message || 'Could not confirm cancellation', 'warning');
      setIsPaymentModalOpen(false);
    } catch (e) {
      showToast('Failed to cancel. Please check if you were already charged.', 'error');
      setIsPaymentModalOpen(false);
    }
  }, [currentReference, showToast]);

  // ---- Derived ----
  const firstName = useMemo(() => user?.name?.split(' ')[0] || '', [user]);
  const initial = (user?.name?.trim()?.[0] || 'S').toUpperCase();
  const activePlan = useMemo(() => plans.find((p) => p.id === user?.subscriptionPlan) || null, [plans, user]);
  // Per-month display price (annual shows the discounted monthly-equivalent).
  const planPrice = (p: BackendPlan) => (isAnnual ? Math.round(p.price * 0.8) : p.price);
  // Actual amount charged now (annual = 12 months at 20% off). Mirrors backend
  // ANNUAL_DISCOUNT_PERCENT default; the backend amount is authoritative at charge time.
  const planChargeAmount = (p: BackendPlan) => (isAnnual ? Math.round(p.price * 12 * 0.8) : p.price);

  const goPlans = () => setView('plans');
  const goManage = () => setView('manage');
  const goAddons = () => setView('addons');
  const goBilling = () => { setView('manage'); requestAnimationFrame(() => historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); };

  if (!user) return null;

  const navItems: { id: string; icon: string; label: string; onClick: () => void; active: boolean }[] = [
    { id: 'manage', icon: 'card_membership', label: 'My Subscription', onClick: goManage, active: view === 'manage' },
    { id: 'plans', icon: 'upgrade', label: 'Plans', onClick: goPlans, active: view === 'plans' },
    { id: 'addons', icon: 'extension', label: 'Add-ons', onClick: goAddons, active: view === 'addons' },
    { id: 'billing', icon: 'receipt_long', label: 'Billing History', onClick: goBilling, active: false },
  ];

  return (
    <div className="sp-assistant sp-subscription h-full flex flex-col overflow-hidden">
      {/* Top app bar */}
      <StandaloneTopBar
        className="relative flex-shrink-0 h-16 bg-surface border-b border-brand-border shadow-sm flex items-center justify-between px-4 md:px-8 z-20"
        currentRoute="subscription"
        navItems={[
          { icon: 'card_membership', label: 'Plan', active: view === 'manage', onClick: goManage },
          { icon: 'upgrade', label: 'Plans', active: view === 'plans', onClick: goPlans },
          { icon: 'extension', label: 'Add-ons', active: view === 'addons', onClick: goAddons },
          { icon: 'receipt_long', label: 'Billing', active: false, onClick: goBilling },
        ]}
        onExit={() => navigate('/')}
        rightExtra={
          <button onClick={() => navigate('/account')} className="w-10 h-10 rounded-full overflow-hidden border-2 m3-border-primary flex items-center justify-center m3-bg-primary-fixed m3-text-primary font-bold" title="Profile">
            {user.profilePicture ? <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" /> : <span>{initial}</span>}
          </button>
        }
      />

      <div className="flex-1 min-h-0 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 m3-bg-surface-low border-r m3-border-outline-variant">
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 m3-bg-surface-container rounded-xl">
              <span className="w-10 h-10 rounded-lg m3-bg-primary-container m3-text-on-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>shield_person</span>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold m3-text-on-surface truncate">{user.name || 'Your account'}</p>
                <p className="text-[11px] m3-text-on-surface-variant capitalize">{user.role || 'merchant'}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto sp-scroll">
            {navItems.map((n) => (
              <button key={n.id} onClick={n.onClick} className={`sub-navitem${n.active ? ' sub-navitem--active' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>
          <div className="px-3 py-3 space-y-1 border-t m3-border-outline-variant">
            <button onClick={openAppSwitcher} className="sub-navitem">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>apps</span>
              SalePilot Apps
            </button>
            <button onClick={() => navigate('/')} className="sub-navitem">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>grid_view</span>
              Full App
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-0 overflow-y-auto sp-scroll px-4 md:px-8 py-6 pb-28 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {view === 'manage' && (
              <ManageView
                user={user} firstName={firstName} activePlan={activePlan} history={history}
                historyRef={historyRef} onChangePlan={goPlans} onBrowseAddons={goAddons}
                planAutoRenew={planAutoRenew} onTogglePlanAutoRenew={handleTogglePlanAutoRenew}
              />
            )}
            {view === 'plans' && (
              <PlansView
                plans={plans} fetchingPlans={fetchingPlans} isAnnual={isAnnual} setIsAnnual={setIsAnnual}
                activePlanId={user?.subscriptionPlan} loading={loading} selectedPlan={selectedPlan}
                onSelect={handleSelectPlan} planPrice={planPrice}
              />
            )}
            {view === 'addons' && (
              <AddonsView
                addons={addons} fetching={fetchingAddons} selected={selectedAddons}
                onToggle={toggleAddon} onBuy={handleBuyAddons} loading={loading}
                onToggleAutoRenew={handleToggleAutoRenew}
              />
            )}
          </div>
        </main>
      </div>


      {isPaymentModalOpen && (
        <Suspense fallback={null}>
          <CustomPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => { stopPollingRef.current = true; setIsPaymentModalOpen(false); setAddonCheckout(null); }}
            onConfirm={({ method, phoneNumber }) => handlePayment(method, phoneNumber)}
            planName={addonCheckout ? addonCheckout.label : `${planToPay?.name || ''}${planToPay && isAnnual ? ' — billed yearly' : ''}`}
            amount={addonCheckout ? addonCheckout.amount : (planToPay ? planChargeAmount(planToPay) : 0)}
            currency={addonCheckout ? addonCheckout.currency : (planToPay?.currency || 'ZMW')}
            loading={loading}
            onCancelTransaction={handleCancelTransaction}
          />
        </Suspense>
      )}
    </div>
  );
};

/* ------------------------------- Manage view ------------------------------- */
const ManageView: React.FC<{
  user: any; firstName: string; activePlan: BackendPlan | null;
  history: SubscriptionHistoryItem[]; historyRef: React.RefObject<HTMLDivElement | null>;
  onChangePlan: () => void; onBrowseAddons: () => void;
  planAutoRenew: boolean; onTogglePlanAutoRenew: () => void;
}> = ({ user, activePlan, history, historyRef, onChangePlan, onBrowseAddons, planAutoRenew, onTogglePlanAutoRenew }) => {
  const lastMethod = history.find((h) => h.paymentMethod)?.paymentMethod;
  const statusActive = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial';
  const isPaidActive = user?.subscriptionStatus === 'active' && !!activePlan;
  const planName = activePlan?.name || (user?.subscriptionPlan ? user.subscriptionPlan : 'Free / Trial');
  const cur = activePlan?.currency || 'ZMW';

  return (
    <div className="sp-fade-in">
      {/* Header row */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-[32px] font-bold m3-text-on-surface">My Subscription</h2>
          <p className="text-sm m3-text-on-surface-variant mt-1">Manage your billing preferences and view your invoice history.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBrowseAddons} className="px-5 py-2.5 rounded-xl text-sm font-semibold m3-bg-surface-high m3-text-on-surface active:scale-95 transition hover:opacity-90">Browse add-ons</button>
          <button onClick={onChangePlan} className="px-5 py-2.5 rounded-xl text-sm font-semibold m3-bg-primary m3-text-on-primary shadow active:scale-95 transition hover:opacity-90">Change plan</button>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Active plan */}
        <div className="md:col-span-8 bento-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusActive ? 'm3-bg-primary-container m3-text-on-primary-container' : 'm3-bg-surface-high m3-text-on-surface-variant'}`}>
                {statusActive ? 'Active plan' : (user?.subscriptionStatus || 'No active plan')}
              </span>
              {activePlan && <span className="text-sm m3-text-on-surface-variant capitalize">{activePlan.interval || 'monthly'} billing</span>}
            </div>
            <h3 className="text-4xl font-bold m3-text-on-surface mb-2">{planName}</h3>
            <p className="text-base m3-text-on-surface-variant max-w-md mb-6">
              {activePlan?.description || 'You are not on a paid plan yet. Choose a plan to unlock advanced features.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t m3-border-outline-variant pt-5">
            <div>
              <p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant">{planAutoRenew && isPaidActive ? 'Renews on' : 'Expires on'}</p>
              <p className="text-lg font-semibold m3-text-on-surface">{formatDate(user?.subscriptionEndsAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant">Amount</p>
              <p className="text-2xl font-bold m3-text-primary">{activePlan ? money(activePlan.price, cur) : '—'}<span className="text-sm font-medium">{activePlan ? `/${activePlan.interval || 'mo'}` : ''}</span></p>
            </div>
          </div>
          {isPaidActive && (
            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t m3-border-outline-variant">
              <div className="min-w-0">
                <p className="text-sm font-semibold m3-text-on-surface">Auto-renew</p>
                <p className="text-xs m3-text-on-surface-variant">{planAutoRenew ? "We'll renew your plan automatically before it expires." : 'Your plan will expire unless you renew it manually.'}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={planAutoRenew}
                onClick={onTogglePlanAutoRenew}
                title={planAutoRenew ? 'Auto-renew is on' : 'Auto-renew is off'}
                className={`shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors ${planAutoRenew ? 'm3-bg-primary' : 'm3-bg-surface-high'}`}
              >
                <span className="block w-6 h-6 bg-white rounded-full shadow transition-transform" style={{ transform: planAutoRenew ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="md:col-span-4 payment-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-10">
              <span className="material-symbols-outlined" style={{ fontSize: 34 }}>contactless</span>
              <span className="text-sm opacity-70">Primary</span>
            </div>
            <p className="text-xl font-bold mb-1 capitalize">{lastMethod ? lastMethod.replace(/[-_]/g, ' ') : 'Mobile money / Card'}</p>
            <p className="text-sm opacity-70">Paid securely via Lenco</p>
          </div>
          <button onClick={onChangePlan} className="mt-6 w-full py-2.5 rounded-xl text-sm font-semibold border border-white/25 hover:bg-white/10 transition active:scale-95">Manage payment</button>
        </div>

        {/* What's included */}
        <div className="md:col-span-4 bento-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4 m3-text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>workspace_premium</span>
            <h4 className="text-sm font-bold">What's included</h4>
          </div>
          <ul className="space-y-2.5">
            {(activePlan?.features?.length ? activePlan.features.slice(0, 5) : ['Core POS & sales', 'Inventory & products', 'Dashboard & reports']).map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-sm m3-text-on-surface-variant">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Billing history */}
        <div ref={historyRef} className="md:col-span-8 bento-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b m3-border-outline-variant">
            <h4 className="text-lg font-bold m3-text-on-surface">Billing history</h4>
          </div>
          <div className="overflow-x-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center text-sm m3-text-on-surface-variant">No invoices yet. Your payments will appear here.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="m3-bg-surface-low">
                  <tr className="m3-text-on-surface-variant">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Plan</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const ok = h.status === 'active' || h.status === 'succeeded';
                    return (
                      <tr key={h.id} className="border-t m3-border-outline-variant hover:m3-bg-surface-low transition-colors">
                        <td className="px-5 py-3.5 m3-text-on-surface">{formatDate(h.createdAt || h.startDate)}</td>
                        <td className="px-5 py-3.5 m3-text-on-surface-variant">{h.planName}</td>
                        <td className="px-5 py-3.5 font-semibold m3-text-on-surface">{money(h.amount, h.currency)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ok ? 'm3-bg-primary-container m3-text-on-primary-container' : 'm3-bg-surface-high m3-text-on-surface-variant'}`}>{h.status}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {h.invoiceUrl ? (
                            <a href={h.invoiceUrl} target="_blank" rel="noreferrer" className="m3-text-on-surface-variant hover:m3-text-primary transition inline-flex">
                              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
                            </a>
                          ) : <span className="m3-text-outline">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------- Plans view ------------------------------- */
const PlansView: React.FC<{
  plans: BackendPlan[]; fetchingPlans: boolean; isAnnual: boolean; setIsAnnual: (b: boolean) => void;
  activePlanId?: string; loading: boolean; selectedPlan: string | null;
  onSelect: (id: string) => void; planPrice: (p: BackendPlan) => number;
}> = ({ plans, fetchingPlans, isAnnual, setIsAnnual, activePlanId, loading, selectedPlan, onSelect, planPrice }) => (
  <div className="sp-fade-in">
    {/* Hero */}
    <div className="text-center mb-8">
      <h2 className="text-2xl md:text-[32px] font-bold m3-text-on-surface mb-2">Scale your business with SalePilot</h2>
      <p className="text-base md:text-lg m3-text-on-surface-variant max-w-2xl mx-auto">Choose a plan that matches your business velocity. Upgrade or downgrade anytime as you grow.</p>
    </div>

    {/* Billing toggle */}
    <div className="flex items-center justify-center gap-4 mb-10">
      <span className={`text-sm font-bold ${!isAnnual ? 'm3-text-primary' : 'm3-text-on-surface-variant'}`}>Monthly</span>
      <button onClick={() => setIsAnnual(!isAnnual)} className={`relative w-14 h-8 rounded-full p-1 transition-colors ${isAnnual ? 'm3-bg-primary-container' : 'm3-bg-surface-high'}`} aria-label="Toggle billing period">
        <span className="toggle-knob block w-6 h-6 m3-bg-primary rounded-full shadow-md" style={{ transform: isAnnual ? 'translateX(24px)' : 'translateX(0)' }} />
      </button>
      <span className={`text-sm font-bold ${isAnnual ? 'm3-text-primary' : 'm3-text-on-surface-variant'}`}>Yearly <span className="m3-text-secondary">(Save 20%)</span></span>
    </div>

    {/* Pricing grid */}
    {fetchingPlans ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => <div key={i} className="pricing-card rounded-xl p-8 h-[420px] animate-pulse" />)}
      </div>
    ) : plans.length === 0 ? (
      <div className="text-center py-16 m3-text-on-surface-variant">No plans available right now. Please check back later.</div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan, i) => {
          const featured = plan.id === 'plan_pro';
          const isActive = activePlanId === plan.id;
          const cur = plan.currency || 'ZMW';
          return (
            <div key={plan.id} className={`pricing-card rounded-xl p-6 flex flex-col relative ${featured ? 'pricing-card--active md:scale-105 z-10' : 'hover:shadow-lg transition-shadow'}`}>
              {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 m3-bg-primary m3-text-on-primary text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow">Most popular</div>
              )}
              <div className="mb-4">
                <span className={`text-xs font-semibold uppercase tracking-wider ${featured ? 'm3-text-primary' : 'm3-text-on-surface-variant'}`}>{tierLabel(i, plans.length)}</span>
                <h3 className="text-2xl font-semibold m3-text-on-surface mt-1">{plan.name}</h3>
              </div>
              <div className={isAnnual ? 'mb-2' : 'mb-6'}>
                <span className="text-4xl font-bold m3-text-on-surface">{money(planPrice(plan), cur)}</span>
                <span className="m3-text-on-surface-variant"> /{isAnnual ? 'mo, billed yearly' : (plan.interval || 'month')}</span>
              </div>
              {isAnnual && plan.price > 0 && (
                <p className="text-xs m3-text-secondary font-medium mb-6">
                  {money(Math.round(plan.price * 12 * 0.8), cur)} billed today · save {money(Math.round(plan.price * 12 * 0.2), cur)}/yr
                </p>
              )}
              <ul className="flex-1 space-y-3 mb-8">
                {(plan.features || []).map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-sm m3-text-on-surface">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled={isActive || loading}
                onClick={() => onSelect(plan.id)}
                className={`w-full py-3 px-5 rounded-xl text-sm font-semibold transition active:scale-95 ${
                  isActive
                    ? 'border-2 m3-border-outline-variant m3-text-on-surface-variant cursor-default'
                    : featured
                      ? 'm3-bg-primary-container m3-text-on-primary-container font-bold shadow hover:shadow-lg'
                      : 'border-2 m3-border-primary m3-text-primary hover:opacity-80'
                } ${loading && selectedPlan === plan.id ? 'opacity-60' : ''}`}
              >
                {isActive ? 'Current plan' : loading && selectedPlan === plan.id ? 'Processing…' : featured ? `Upgrade to ${plan.name}` : 'Choose plan'}
              </button>
            </div>
          );
        })}
      </div>
    )}

    {/* Why upgrade */}
    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center m3-bg-surface-container rounded-3xl p-6">
      <div className="relative h-56 md:h-full min-h-[220px] rounded-2xl overflow-hidden m3-bg-primary-container flex items-center justify-center">
        <span className="material-symbols-outlined m3-text-on-primary-container" style={{ fontSize: 96, opacity: 0.9 }}>rocket_launch</span>
      </div>
      <div>
        <h3 className="text-xl font-bold m3-text-on-surface mb-4">Unlock full growth potential</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 shrink-0 rounded-xl m3-bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 24 }}>bolt</span>
            </div>
            <div>
              <p className="text-sm font-semibold m3-text-on-surface">Instant activation</p>
              <p className="text-sm m3-text-on-surface-variant">New features unlock immediately after you confirm your upgrade. No downtime.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 shrink-0 rounded-xl m3-bg-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined m3-text-secondary" style={{ fontSize: 24 }}>lock_open</span>
            </div>
            <div>
              <p className="text-sm font-semibold m3-text-on-surface">No hidden fees</p>
              <p className="text-sm m3-text-on-surface-variant">Transparent pricing with local taxes included in every quote.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* -------------------------------- Add-ons view ----------------------------- */
const AddonsView: React.FC<{
  addons: PurchasableAddon[]; fetching: boolean; selected: Set<string>;
  onToggle: (id: string) => void; onBuy: () => void; loading: boolean;
  onToggleAutoRenew: (id: string, v: boolean) => void;
}> = ({ addons, fetching, selected, onToggle, onBuy, loading, onToggleAutoRenew }) => {
  const chosen = addons.filter((a) => !a.owned && selected.has(a.id));
  const total = chosen.reduce((s, a) => s + netAddonPrice(a), 0);
  const cur = chosen[0]?.currency || addons[0]?.currency || 'ZMW';

  return (
    <div className="sp-fade-in pb-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-[32px] font-bold m3-text-on-surface mb-2">Add-ons — pay only for what you need</h2>
        <p className="text-base md:text-lg m3-text-on-surface-variant max-w-2xl mx-auto">Unlock individual features à la carte, without jumping to a bigger plan.</p>
      </div>

      {fetching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl m3-bg-surface-container animate-pulse" />)}
        </div>
      ) : addons.length === 0 ? (
        <div className="text-center py-16 m3-text-on-surface-variant">No add-ons available right now.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addons.map((a) => {
            const isSel = selected.has(a.id);
            const offer = upsellService.getModuleOffer(a.id);
            if (a.owned) {
              // Owned add-ons are not selectable; they show status + an auto-renew switch.
              return (
                <div key={a.id} className="bento-card rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="font-bold m3-text-on-surface">{a.name}</h3>
                    <span className="text-lg font-bold m3-text-primary whitespace-nowrap">{money(a.price, a.currency)}<span className="text-xs m3-text-on-surface-variant font-medium">/mo</span></span>
                  </div>
                  <p className="text-sm m3-text-on-surface-variant mb-3">{a.description}</p>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full m3-bg-primary-container m3-text-on-primary-container">
                      <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Active{a.activeUntil ? ` · until ${formatDate(a.activeUntil)}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleAutoRenew(a.id, !a.autoRenew)}
                      className="inline-flex items-center gap-2 text-xs font-semibold m3-text-on-surface-variant active:scale-95 transition"
                      title={a.autoRenew ? 'Auto-renew is on' : 'Auto-renew is off'}
                    >
                      Auto-renew
                      <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${a.autoRenew ? 'm3-bg-primary' : 'm3-bg-surface-high'}`}>
                        <span className="block w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ transform: a.autoRenew ? 'translateX(16px)' : 'translateX(0)' }} />
                      </span>
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onToggle(a.id)}
                className={`text-left bento-card rounded-2xl p-5 transition relative ${isSel ? 'ring-2 ring-[var(--c-primary)]' : 'hover:shadow-md'}`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="min-w-0">
                    <h3 className="font-bold m3-text-on-surface">{a.name}</h3>
                    {offer?.discountPct ? <span className="inline-block mt-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-sp-amber text-white">{offer.discountPct}% OFF</span> : null}
                  </div>
                  <span className="text-lg font-bold m3-text-primary whitespace-nowrap text-right">
                    {offer?.discountPct ? <span className="block text-xs m3-text-on-surface-variant line-through font-medium">{money(a.price, a.currency)}</span> : null}
                    {money(netAddonPrice(a), a.currency)}<span className="text-xs m3-text-on-surface-variant font-medium">/mo</span>
                  </span>
                </div>
                <p className="text-sm m3-text-on-surface-variant mb-3">{a.description}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isSel ? 'm3-bg-primary m3-text-on-primary' : 'm3-bg-surface-high m3-text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{isSel ? 'check' : 'add'}</span>
                  {isSel ? 'Selected' : 'Add'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {chosen.length > 0 && (
        <div className="fixed bottom-[84px] lg:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-md">
          <div className="m3-bg-surface-container shadow-xl rounded-2xl p-4 flex items-center justify-between gap-4 border m3-border-outline-variant">
            <div>
              <p className="text-xs m3-text-on-surface-variant">{chosen.length} add-on{chosen.length === 1 ? '' : 's'} selected</p>
              <p className="text-xl font-bold m3-text-on-surface">{money(total, cur)}<span className="text-sm font-medium m3-text-on-surface-variant">/mo</span></p>
            </div>
            <button onClick={onBuy} disabled={loading} className="px-6 py-3 rounded-xl text-sm font-bold m3-bg-primary m3-text-on-primary shadow active:scale-95 transition disabled:opacity-60">
              {loading ? 'Processing…' : 'Unlock now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionApp;
