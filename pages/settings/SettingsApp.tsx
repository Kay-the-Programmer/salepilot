import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';
import StandaloneTopBar from '../../components/standalone/StandaloneTopBar';
import type { StoreSettings, User } from '../../types';
import type { SnackbarType } from '../../App';
import { api } from '../../services/api';
import '../assistant/assistant.css';

// Reused feature sections (logic unchanged)
import BusinessVerificationSection from '../../components/settings/BusinessVerificationSection';
import AccountVerificationSection from '../../components/settings/AccountVerificationSection';
import NotificationSettingsSection from '../../components/settings/sections/NotificationSettingsSection';
import BarcodeScannerSection from '../../components/settings/sections/BarcodeScannerSection';
import ReferralSection from '../../components/settings/sections/ReferralSection';

type Category = 'store' | 'financial' | 'pos' | 'inventory' | 'notifications' | 'verification' | 'referrals' | 'scanner' | 'billing';

interface SettingsAppProps {
  settings: StoreSettings;
  user: User;
  showSnackbar: (message: string, type?: SnackbarType) => void;
  onSave: (settings: StoreSettings) => void;
}

const CATEGORIES: { id: Category; label: string; icon: string; group: 'Store' | 'System'; editable?: boolean }[] = [
  { id: 'store', label: 'Store details', icon: 'storefront', group: 'Store', editable: true },
  { id: 'financial', label: 'Financials', icon: 'payments', group: 'Store', editable: true },
  { id: 'pos', label: 'POS & checkout', icon: 'point_of_sale', group: 'Store', editable: true },
  { id: 'inventory', label: 'Inventory', icon: 'inventory_2', group: 'Store', editable: true },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', group: 'System' },
  { id: 'verification', label: 'Verification', icon: 'verified_user', group: 'System' },
  { id: 'billing', label: 'Plan & billing', icon: 'card_membership', group: 'System' },
  { id: 'referrals', label: 'Referrals', icon: 'redeem', group: 'System' },
  { id: 'scanner', label: 'Barcode scanner', icon: 'barcode_scanner', group: 'System' },
];

const inputCls = 'w-full h-11 px-3.5 rounded-xl m3-bg-surface-lowest border m3-border-outline-variant outline-none focus:m3-border-primary text-sm m3-text-on-surface m3-placeholder transition';

// Apple-style coloured icon tiles per category.
const tileTone: Record<Category, string> = {
  store: 'm3-bg-primary m3-text-on-primary',
  financial: 'm3-bg-secondary m3-text-on-secondary',
  pos: 'm3-bg-tertiary m3-text-on-tertiary',
  inventory: 'm3-bg-primary-container m3-text-on-primary-container',
  notifications: 'm3-bg-error-container m3-text-error',
  verification: 'm3-bg-primary m3-text-on-primary',
  billing: 'm3-bg-secondary m3-text-on-secondary',
  referrals: 'm3-bg-tertiary m3-text-on-tertiary',
  scanner: 'm3-bg-surface-highest m3-text-on-surface-variant',
};

const SettingsApp: React.FC<SettingsAppProps> = ({ settings, user, showSnackbar, onSave }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { openAppSwitcher } = useAppSwitcher();
  const [currentSettings, setCurrentSettings] = useState<StoreSettings>(settings);
  const [active, setActive] = useState<Category>('store');
  const [mobileDetail, setMobileDetail] = useState(false); // Apple-style master→detail push (mobile only)
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const openCategory = (c: Category) => { setActive(c); setEditingFeature(null); setMobileDetail(true); };
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [pmName, setPmName] = useState('');
  const [spmName, setSpmName] = useState('');

  useEffect(() => { setCurrentSettings(settings); }, [settings]);

  const fetchVerificationStatus = async () => {
    try { setVerificationStatus(await api.get<any>('/verification/status')); }
    catch (e) { console.error('Failed to fetch verification status', e); }
  };
  useEffect(() => { fetchVerificationStatus(); }, []);

  const dirty = useMemo(() => JSON.stringify(currentSettings) !== JSON.stringify(settings), [currentSettings, settings]);

  /* --------------------------- logic (unchanged) --------------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'currency.symbol' || name === 'currency.code' || name === 'currency.position') {
      const f = name.split('.')[1];
      setCurrentSettings((prev) => ({ ...prev, currency: { ...prev.currency, [f]: value } }));
    } else if (name === 'enableStoreCredit') {
      setCurrentSettings((prev) => ({ ...prev, enableStoreCredit: (e.target as HTMLInputElement).checked }));
    } else {
      setCurrentSettings((prev) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
  };
  const setPM = (key: 'paymentMethods' | 'supplierPaymentMethods', idx: number, val: string) =>
    setCurrentSettings((prev) => { const m = [...(prev[key] || [])]; m[idx] = { ...m[idx], name: val }; return { ...prev, [key]: m }; });
  const addPM = (key: 'paymentMethods' | 'supplierPaymentMethods', name: string, reset: (s: string) => void) => {
    if (!name.trim()) return;
    setCurrentSettings((prev) => ({ ...prev, [key]: [...(prev[key] || []), { id: `pm_${Date.now()}_${Math.random()}`, name: name.trim() }] }));
    reset('');
  };
  const removePM = (key: 'paymentMethods' | 'supplierPaymentMethods', id: string) =>
    setCurrentSettings((prev) => ({ ...prev, [key]: (prev[key] || []).filter((pm) => pm.id !== id) }));

  const handleSave = () => { onSave(currentSettings); showSnackbar('Settings saved.', 'success'); };
  const handleReset = () => setCurrentSettings(settings);

  const meta = CATEGORIES.find((c) => c.id === active)!;

  return (
    <div className="sp-assistant sp-settings h-full flex overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-72 flex-shrink-0 m3-bg-surface border-r m3-border-outline-variant">
        <div className="h-16 flex items-center gap-2 px-5 flex-shrink-0">
          <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 26 }}>settings</span>
          <div className="leading-tight"><p className="font-bold m3-text-primary">Settings</p><p className="text-[11px] m3-text-on-surface-variant">Store configuration</p></div>
        </div>
        <nav className="flex-1 px-3 py-2 overflow-y-auto sp-scroll">
          {(['Store', 'System'] as const).map((grp) => (
            <div key={grp} className="mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider m3-text-on-surface-variant px-3 py-2">{grp}</p>
              {CATEGORIES.filter((c) => c.group === grp).map((c) => (
                <button key={c.id} onClick={() => { setActive(c.id); setEditingFeature(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${active === c.id ? 'm3-bg-primary-fixed m3-text-primary' : 'm3-text-on-surface-variant hover:m3-bg-surface-high'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: active === c.id ? "'FILL' 1" : undefined }}>{c.icon}</span>{c.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-3 py-3 space-y-1 border-t m3-border-outline-variant">
          <button onClick={openAppSwitcher} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold m3-text-on-surface-variant hover:m3-bg-surface-high transition"><span className="material-symbols-outlined" style={{ fontSize: 22 }}>apps</span>SalePilot Apps</button>
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold m3-text-on-surface-variant hover:m3-bg-surface-high transition"><span className="material-symbols-outlined" style={{ fontSize: 22 }}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold m3-text-on-surface-variant hover:m3-bg-surface-high transition"><span className="material-symbols-outlined" style={{ fontSize: 22 }}>grid_view</span>Full App</button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Mobile master list (Apple Settings style) */}
        <div className={`md:hidden flex-1 min-h-0 overflow-y-auto sp-scroll m3-bg-surface-low ${mobileDetail ? 'hidden' : 'block'}`}>
          <StandaloneTopBar
            className="relative flex-shrink-0 flex items-center justify-between border-b border-brand-border bg-surface px-3 h-16 z-20"
            currentRoute="config"
            onExit={() => navigate('/')}
          />

          {/* Store banner row */}
          <div className="px-4 mb-4">
            <button onClick={() => openCategory('store')} className="w-full flex items-center gap-3 p-3 rounded-2xl m3-bg-surface-lowest shadow-sm active:scale-[0.99] transition">
              <span className="w-14 h-14 rounded-full m3-bg-primary-fixed m3-text-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined" style={{ fontSize: 28 }}>storefront</span></span>
              <span className="min-w-0 flex-1 text-left"><span className="block text-base font-bold m3-text-on-surface truncate">{currentSettings.name || 'Your store'}</span><span className="block text-[13px] m3-text-on-surface-variant">Store profile & configuration</span></span>
              <span className="material-symbols-outlined m3-text-outline" style={{ fontSize: 22 }}>chevron_right</span>
            </button>
          </div>

          {(['Store', 'System'] as const).map((grp) => (
            <div key={grp} className="px-4 mb-5">
              <p className="text-[12px] font-semibold m3-text-on-surface-variant px-3 pb-1.5">{grp}</p>
              <div className="rounded-2xl m3-bg-surface-lowest shadow-sm overflow-hidden">
                {CATEGORIES.filter((c) => c.group === grp).map((c, idx, arr) => (
                  <button key={c.id} onClick={() => openCategory(c.id)} className="w-full flex items-center gap-3 pl-3 active:m3-bg-surface-high transition">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tileTone[c.id]}`}><span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>{c.icon}</span></span>
                    <span className={`flex-1 flex items-center justify-between py-3.5 pr-3 ${idx < arr.length - 1 ? 'border-b m3-border-outline-variant' : ''}`}>
                      <span className="text-[15px] font-medium m3-text-on-surface text-left">{c.label}</span>
                      <span className="material-symbols-outlined m3-text-outline" style={{ fontSize: 22 }}>chevron_right</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* Mobile detail back bar */}
        {mobileDetail && (
          <header className="md:hidden flex-shrink-0 h-14 m3-bg-surface border-b m3-border-outline-variant flex items-center px-2 z-20 relative">
            <button onClick={() => setMobileDetail(false)} className="flex items-center m3-text-primary font-semibold active:scale-95 transition"><span className="material-symbols-outlined" style={{ fontSize: 26 }}>chevron_left</span>Settings</button>
            <span className="absolute left-1/2 -translate-x-1/2 font-bold m3-text-on-surface">{meta.label}</span>
          </header>
        )}

        {/* Content (desktop always; mobile only in detail) */}
        <main className={`${mobileDetail ? 'block' : 'hidden'} md:block flex-1 min-h-0 overflow-y-auto sp-scroll px-4 md:px-8 py-6`}>
          <div className="max-w-2xl mx-auto w-full pb-28">
            <h2 className="text-2xl md:text-[28px] font-bold m3-text-on-surface mb-1">{meta.label}</h2>
            <p className="text-sm m3-text-on-surface-variant mb-5">{descriptions[active]}</p>

            {active === 'store' && (
              <Card>
                <Field label="Store name"><input className={inputCls} name="name" value={currentSettings.name || ''} onChange={handleChange} placeholder="My Store" /></Field>
                <Field label="Contact email"><input className={inputCls} type="email" name="email" value={currentSettings.email || ''} onChange={handleChange} placeholder="store@email.com" /></Field>
                <Field label="Phone number"><input className={inputCls} type="tel" name="phone" value={currentSettings.phone || ''} onChange={handleChange} placeholder="+260…" /></Field>
                <Field label="Website"><input className={inputCls} name="website" value={currentSettings.website || ''} onChange={handleChange} placeholder="https://…" /></Field>
                <Field label="Address"><textarea className={`${inputCls} h-auto py-3`} rows={3} name="address" value={currentSettings.address || ''} onChange={handleChange} placeholder="123 Main Street, City" /></Field>
              </Card>
            )}

            {active === 'financial' && (
              <>
                <Card>
                  <Field label="Tax rate (%)"><input className={inputCls} type="number" name="taxRate" value={currentSettings.taxRate ?? 0} onChange={handleChange} placeholder="0" /></Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Symbol"><input className={inputCls} name="currency.symbol" value={currentSettings.currency?.symbol || ''} onChange={handleChange} placeholder="K" /></Field>
                    <Field label="Code"><input className={inputCls} name="currency.code" value={currentSettings.currency?.code || ''} onChange={handleChange} placeholder="ZMW" /></Field>
                    <Field label="Position">
                      <select className={inputCls} name="currency.position" value={currentSettings.currency?.position || 'before'} onChange={handleChange}>
                        <option value="before">Before (K100)</option>
                        <option value="after">After (100K)</option>
                      </select>
                    </Field>
                  </div>
                </Card>
                <p className="text-xs font-bold uppercase tracking-wide m3-text-on-surface-variant mt-2 mb-2 px-1">Mobile money (Lenco)</p>
                <Card>
                  <Field label="Lenco public key"><input className={inputCls} name="lencoPublicKey" value={currentSettings.lencoPublicKey || ''} onChange={handleChange} placeholder="pk_live_…" /></Field>
                  <Field label="Lenco secret key"><input className={inputCls} type="password" name="lencoSecretKey" value={currentSettings.lencoSecretKey || ''} onChange={handleChange} placeholder="sk_live_…" /></Field>
                </Card>
              </>
            )}

            {active === 'pos' && (
              <>
                <Card>
                  <Field label="Receipt footer message"><textarea className={`${inputCls} h-auto py-3`} rows={2} name="receiptMessage" value={currentSettings.receiptMessage || ''} onChange={handleChange} placeholder="Thank you for shopping with us!" /></Field>
                  <label className="flex items-center justify-between py-1 cursor-pointer">
                    <span className="text-sm font-semibold m3-text-on-surface">Enable store credit</span>
                    <span className={`relative w-12 h-7 rounded-full transition-colors ${currentSettings.enableStoreCredit ? 'm3-bg-primary' : 'm3-bg-surface-high'}`}>
                      <input type="checkbox" name="enableStoreCredit" checked={!!currentSettings.enableStoreCredit} onChange={handleChange} className="sr-only" />
                      <span className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: currentSettings.enableStoreCredit ? 24 : 4 }} />
                    </span>
                  </label>
                </Card>
                <PaymentMethods title="Customer payment methods" items={currentSettings.paymentMethods || []} onEdit={(i, v) => setPM('paymentMethods', i, v)} onRemove={(id) => removePM('paymentMethods', id)} value={pmName} setValue={setPmName} onAdd={() => addPM('paymentMethods', pmName, setPmName)} />
                <PaymentMethods title="Supplier payment methods" items={currentSettings.supplierPaymentMethods || []} onEdit={(i, v) => setPM('supplierPaymentMethods', i, v)} onRemove={(id) => removePM('supplierPaymentMethods', id)} value={spmName} setValue={setSpmName} onAdd={() => addPM('supplierPaymentMethods', spmName, setSpmName)} />
              </>
            )}

            {active === 'inventory' && (
              <Card>
                <Field label="Low stock threshold"><input className={inputCls} type="number" name="lowStockThreshold" value={currentSettings.lowStockThreshold ?? 0} onChange={handleChange} placeholder="10" /></Field>
                <Field label="SKU prefix"><input className={inputCls} name="skuPrefix" value={currentSettings.skuPrefix || ''} onChange={handleChange} placeholder="SP-" /></Field>
              </Card>
            )}

            {active === 'billing' && (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-11 h-11 rounded-xl m3-bg-primary-fixed m3-text-primary flex items-center justify-center"><span className="material-symbols-outlined">card_membership</span></span>
                  <div><p className="font-bold m3-text-on-surface">Subscription & billing</p><p className="text-[12px] m3-text-on-surface-variant">Manage your plan, invoices and payment.</p></div>
                </div>
                <button onClick={() => navigate('/subscription')} className="w-full py-3 rounded-xl m3-bg-primary m3-text-on-primary font-semibold active:scale-95 transition">Open subscription</button>
              </Card>
            )}

            {/* Reused feature sections (logic unchanged) */}
            {active === 'notifications' && (
              <div className="m3-feature">
                <NotificationSettingsSection isEditing={editingFeature === 'notifications'} onEdit={() => setEditingFeature('notifications')} onSave={() => setEditingFeature(null)} onCancel={() => setEditingFeature(null)} />
              </div>
            )}
            {active === 'verification' && (
              <div className="m3-feature space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider m3-text-on-surface-variant mb-2 px-1">Account verification</p>
                  <AccountVerificationSection status={verificationStatus ? { isEmailVerified: verificationStatus.isEmailVerified ?? false, isPhoneVerified: verificationStatus.isPhoneVerified ?? false, phoneNumber: verificationStatus.phoneNumber } : null} onRefresh={fetchVerificationStatus} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider m3-text-on-surface-variant mb-2 px-1">Business verification</p>
                  <BusinessVerificationSection isEditing={true} verificationStatus={verificationStatus} onUploadSuccess={fetchVerificationStatus} />
                </div>
              </div>
            )}
            {active === 'referrals' && <div className="m3-feature"><ReferralSection user={user} showSnackbar={showSnackbar} /></div>}
            {active === 'scanner' && <div className="m3-feature"><BarcodeScannerSection /></div>}
          </div>
        </main>

        {/* Sticky save bar (editable categories only) */}
        {meta.editable && dirty && (
          <div className={`${mobileDetail ? 'flex' : 'hidden'} md:flex flex-shrink-0 px-4 md:px-8 py-3 border-t m3-border-outline-variant m3-bg-surface items-center justify-between gap-3 sp-fade-in`}>
            <span className="text-sm m3-text-on-surface-variant hidden sm:block">You have unsaved changes</span>
            <div className="flex gap-2 ml-auto">
              <button onClick={handleReset} className="px-4 py-2.5 rounded-xl text-sm font-semibold m3-bg-surface-high m3-text-on-surface active:scale-95 transition">Discard</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-sm font-semibold m3-bg-primary m3-text-on-primary active:scale-95 transition flex items-center gap-1.5"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>Save changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const descriptions: Record<Category, string> = {
  store: 'Your business name and contact information.',
  financial: 'Tax rate, currency and mobile-money keys.',
  pos: 'Receipt message, store credit and payment methods.',
  inventory: 'Stock alerts and SKU formatting.',
  notifications: 'Choose what alerts you receive.',
  verification: 'Verify your account and business documents.',
  billing: 'Manage your subscription and invoices.',
  referrals: 'Invite others and earn rewards.',
  scanner: 'Configure barcode scanning.',
};

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm p-5 space-y-4">{children}</div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[13px] font-semibold m3-text-on-surface-variant">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

const PaymentMethods: React.FC<{ title: string; items: { id: string; name: string }[]; onEdit: (i: number, v: string) => void; onRemove: (id: string) => void; value: string; setValue: (s: string) => void; onAdd: () => void }> = ({ title, items, onEdit, onRemove, value, setValue, onAdd }) => (
  <div className="mt-3">
    <p className="text-xs font-bold uppercase tracking-wide m3-text-on-surface-variant mb-2 px-1">{title}</p>
    <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm p-4 space-y-2">
      {items.length === 0 && <p className="text-[13px] m3-text-on-surface-variant">None added yet.</p>}
      {items.map((pm, i) => (
        <div key={pm.id} className="flex items-center gap-2">
          <input className={inputCls} value={pm.name} onChange={(e) => onEdit(i, e.target.value)} />
          <button onClick={() => onRemove(pm.id)} className="w-10 h-10 flex items-center justify-center rounded-xl m3-text-on-surface-variant hover:m3-text-error hover:m3-bg-error-container transition shrink-0"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span></button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }} placeholder="Add a method…" />
        <button onClick={onAdd} className="h-11 px-4 rounded-xl m3-bg-primary m3-text-on-primary font-semibold active:scale-95 transition flex items-center gap-1 shrink-0"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span></button>
      </div>
    </div>
  </div>
);

export default SettingsApp;
