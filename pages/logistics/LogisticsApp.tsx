import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Shipment, Courier, Bus, StoreSettings } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/currency';
import { hasModule, MODULES } from '../../utils/entitlements';
import StandaloneShell from '../../components/standalone/StandaloneShell';
import PremiumUpgradeModal from '../../components/ui/PremiumUpgradeModal';
import { UpsellInline } from '../../components/upsell/UpsellCard';
import '../accounting/accounting.css';

type Tab = 'shipments' | 'couriers' | 'buses';

const STATUS_TONE: Record<Shipment['status'], string> = {
  pending: 'm3-bg-secondary-fixed m3-text-secondary',
  confirmed: 'm3-bg-tertiary-fixed m3-text-tertiary',
  shipped: 'm3-bg-tertiary-fixed m3-text-tertiary',
  in_transit: 'm3-bg-primary-fixed m3-text-primary',
  delivered: 'm3-bg-primary-container m3-text-on-primary-container',
  failed: 'm3-bg-error-container m3-text-error',
  returned: 'm3-bg-error-container m3-text-error',
};
const STATUSES: Shipment['status'][] = ['pending', 'confirmed', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'];

interface LogisticsAppProps {
  storeSettings: StoreSettings;
}

/* ----------------------------- shared UI bits ----------------------------- */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[11px] font-semibold uppercase tracking-wide m3-text-on-surface-variant">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
const inputCls = 'w-full h-11 px-3 rounded-xl m3-bg-surface-container border m3-border-outline-variant outline-none focus:ring-0 text-sm m3-text-on-surface m3-placeholder';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="sp-assistant fixed inset-0 z-[120] flex items-end md:items-center justify-center">
    <div className="absolute inset-0 bg-black/40 sp-fade-in" onClick={onClose} />
    <div className="relative w-full md:max-w-lg m3-bg-surface rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col sp-fade-in">
      <div className="flex items-center justify-between px-5 h-14 border-b m3-border-outline-variant flex-shrink-0">
        <h3 className="font-bold m3-text-on-surface">{title}</h3>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span></button>
      </div>
      <div className="p-5 overflow-y-auto sp-scroll">{children}</div>
    </div>
  </div>
);

const LogisticsApp: React.FC<LogisticsAppProps> = ({ storeSettings }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('shipments');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [modal, setModal] = useState<Tab | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; msg: string; onYes: () => void } | null>(null);
  const fmt = (n: number) => formatCurrency(n, storeSettings);

  // Public tracking page is a premium add-on — locked unless the store unlocked it.
  const trackingUnlocked = hasModule(storeSettings, MODULES.PUBLIC_TRACKING);
  const [showTrackingUpsell, setShowTrackingUpsell] = useState(false);

  const [courierForm, setCourierForm] = useState<Partial<Courier>>({ isActive: true });
  const [busForm, setBusForm] = useState<Partial<Bus>>({ isActive: true });
  const [shipForm, setShipForm] = useState<Partial<Shipment>>({ status: 'pending', shipping_cost: 0, method: 'courier' });

  const fetchData = async () => {
    try {
      const [s, c, b] = await Promise.all([
        api.get<Shipment[]>('/logistics/shipments').catch(() => []),
        api.get<Courier[]>('/logistics/couriers').catch(() => []),
        api.get<Bus[]>('/logistics/buses').catch(() => []),
      ]);
      setShipments(s || []); setCouriers(c || []); setBuses(b || []);
    } catch (e) { console.error('Failed to load logistics', e); }
  };
  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => ({
    total: shipments.length,
    transit: shipments.filter((s) => ['shipped', 'in_transit', 'confirmed'].includes(s.status)).length,
    delivered: shipments.filter((s) => s.status === 'delivered').length,
    pending: shipments.filter((s) => s.status === 'pending').length,
  }), [shipments]);

  const createCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const c = await api.post<Courier>('/logistics/couriers', courierForm); setCouriers((p) => [c, ...p]); setModal(null); setCourierForm({ isActive: true }); }
    catch { showToast('Failed to create courier', 'error'); }
  };
  const createBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const b = await api.post<Bus>('/logistics/buses', busForm); setBuses((p) => [b, ...p]); setModal(null); setBusForm({ isActive: true }); }
    catch { showToast('Failed to create bus', 'error'); }
  };
  const createShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...shipForm, tracking_number: shipForm.tracking_number || `TRK-${Date.now()}` };
      const s = await api.post<Shipment>('/logistics/shipments', payload);
      setShipments((p) => [s, ...p]); setModal(null); setShipForm({ status: 'pending', shipping_cost: 0, method: 'courier' });
    } catch { showToast('Failed to create shipment', 'error'); }
  };
  const removeItem = (type: 'courier' | 'bus', id: string) => {
    setConfirm({
      title: `Delete ${type}`, msg: 'This action cannot be undone.',
      onYes: async () => {
        try { await api.delete(`/logistics/${type}s/${id}`); if (type === 'courier') setCouriers((p) => p.filter((c) => c.id !== id)); else setBuses((p) => p.filter((b) => b.id !== id)); setConfirm(null); }
        catch { showToast('Failed to delete', 'error'); }
      },
    });
  };
  const updateStatus = async (id: string, status: string) => {
    try { const u = await api.patch<Shipment>(`/logistics/shipments/${id}/status`, { status }); setShipments((p) => p.map((s) => (s.id === id ? u : s))); }
    catch { showToast('Failed to update status', 'error'); }
  };

  const navItems = [
    { icon: 'local_shipping', label: 'Shipments', active: tab === 'shipments', onClick: () => setTab('shipments') },
    { icon: 'two_wheeler', label: 'Couriers', active: tab === 'couriers', onClick: () => setTab('couriers') },
    { icon: 'directions_bus', label: 'Buses', active: tab === 'buses', onClick: () => setTab('buses') },
  ];

  const addLabel = tab === 'shipments' ? 'New Shipment' : tab === 'couriers' ? 'Add Courier' : 'Add Bus';

  return (
    <StandaloneShell title="Logistics" scopeClass="sp-books">
      <div className="px-4 md:px-8 py-5 max-w-3xl mx-auto w-full pb-28 md:pb-10">
        {/* Desktop tab switcher */}
        <div className="hidden md:flex justify-center mb-6">
          <div className="seg">
            {navItems.map((n) => (
              <button key={n.label} className={n.active ? 'is-active' : ''} onClick={n.onClick}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-[28px] font-bold m3-text-on-surface capitalize">{tab}</h2>
            <p className="text-sm m3-text-on-surface-variant">Fleet &amp; shipment management</p>
          </div>
          <button onClick={() => setModal(tab)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold m3-bg-primary m3-text-on-primary shadow active:scale-95 transition">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span><span className="hidden sm:inline">{addLabel}</span>
          </button>
        </div>

        {/* SHIPMENTS */}
        {tab === 'shipments' && (
          <div className="sp-fade-in">
            {/* Proactive, dismissible tracking nudge (engine-gated). The button
                below remains the always-on discovery affordance. */}
            <UpsellInline ids={['tracking_requested']} className="mb-4" />
            <button
              onClick={() => (trackingUnlocked ? navigate('/track') : setShowTrackingUpsell(true))}
              title={trackingUnlocked ? undefined : 'Premium add-on — tap to unlock'}
              className="w-full mb-4 flex items-center gap-2 px-4 py-3 rounded-xl m3-bg-surface-container hover:m3-bg-surface-high transition active:scale-[0.99] text-left"
            >
              <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 22 }}>travel_explore</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold m3-text-on-surface">
                  Public tracking page
                  {!trackingUnlocked && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[9px] font-bold uppercase tracking-wide" style={{ background: '#ffe2b8', color: '#8a5a00' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>lock</span>
                      Premium
                    </span>
                  )}
                </span>
                <span className="block text-[11px] m3-text-on-surface-variant">Share with customers to track by number</span>
              </span>
              <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 20 }}>{trackingUnlocked ? 'open_in_new' : 'lock'}</span>
            </button>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <Stat icon="inventory_2" label="Total" value={stats.total} tone="primary" />
              <Stat icon="local_shipping" label="In transit" value={stats.transit} tone="tertiary" />
              <Stat icon="check_circle" label="Delivered" value={stats.delivered} tone="primary" />
              <Stat icon="schedule" label="Pending" value={stats.pending} tone="secondary" />
            </div>
            {shipments.length === 0 ? (
              <Empty icon="local_shipping" text="No shipments yet. Create one to start tracking." />
            ) : (
              <div className="space-y-2.5">
                {shipments.map((s) => (
                  <div key={s.id} className="m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm p-4 sp-fade-in">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-9 h-9 rounded-lg m3-bg-surface-high flex items-center justify-center shrink-0"><span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 20 }}>{s.method === 'bus' ? 'directions_bus' : 'two_wheeler'}</span></span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold m3-text-on-surface truncate">{s.tracking_number}</p>
                          <p className="text-[11px] m3-text-on-surface-variant truncate">{s.recipient_name || 'No recipient'} · {s.destination || s.recipient_address || '—'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${STATUS_TONE[s.status]}`}>{s.status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t m3-border-outline-variant">
                      <span className="text-sm font-semibold m3-text-on-surface">{fmt(s.shipping_cost || 0)}</span>
                      <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)} className="h-9 px-2 rounded-lg m3-bg-surface-container border m3-border-outline-variant text-xs font-medium m3-text-on-surface outline-none">
                        {STATUSES.map((st) => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COURIERS */}
        {tab === 'couriers' && (
          <div className="sp-fade-in">
            {couriers.length === 0 ? <Empty icon="two_wheeler" text="No couriers added yet." /> : (
              <div className="space-y-2.5">
                {couriers.map((c) => (
                  <div key={c.id} className="m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm p-4 flex items-center gap-3 sp-fade-in">
                    <span className="w-11 h-11 rounded-lg m3-bg-primary-fixed m3-text-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined">two_wheeler</span></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold m3-text-on-surface truncate">{c.company_name}</p>
                      <p className="text-[11px] m3-text-on-surface-variant truncate">{c.contact_details || 'No contact'}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${c.isActive ? 'm3-bg-primary-container m3-text-on-primary-container' : 'm3-bg-surface-high m3-text-on-surface-variant'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                    <button onClick={() => removeItem('courier', c.id)} className="w-9 h-9 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-text-error hover:m3-bg-error-container transition"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BUSES */}
        {tab === 'buses' && (
          <div className="sp-fade-in">
            {buses.length === 0 ? <Empty icon="directions_bus" text="No buses added yet." /> : (
              <div className="space-y-2.5">
                {buses.map((b) => (
                  <div key={b.id} className="m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm p-4 flex items-center gap-3 sp-fade-in">
                    <span className="w-11 h-11 rounded-lg m3-bg-tertiary-fixed m3-text-tertiary flex items-center justify-center shrink-0"><span className="material-symbols-outlined">directions_bus</span></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold m3-text-on-surface truncate">{b.driver_name}{b.vehicle_name ? ` · ${b.vehicle_name}` : ''}</p>
                      <p className="text-[11px] m3-text-on-surface-variant truncate">{b.number_plate}{b.contact_phone ? ` · ${b.contact_phone}` : ''}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${b.isActive ? 'm3-bg-primary-container m3-text-on-primary-container' : 'm3-bg-surface-high m3-text-on-surface-variant'}`}>{b.isActive ? 'Active' : 'Inactive'}</span>
                    <button onClick={() => removeItem('bus', b.id)} className="w-9 h-9 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-text-error hover:m3-bg-error-container transition"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Courier modal */}
      {modal === 'couriers' && (
        <Modal title="Add courier" onClose={() => setModal(null)}>
          <form onSubmit={createCourier} className="space-y-4">
            <Field label="Company name"><input className={inputCls} required value={courierForm.company_name || ''} onChange={(e) => setCourierForm({ ...courierForm, company_name: e.target.value })} placeholder="e.g. Swift Couriers" /></Field>
            <Field label="Contact details"><input className={inputCls} value={courierForm.contact_details || ''} onChange={(e) => setCourierForm({ ...courierForm, contact_details: e.target.value })} placeholder="Phone / email" /></Field>
            <Field label="Receipt details"><input className={inputCls} value={courierForm.receipt_details || ''} onChange={(e) => setCourierForm({ ...courierForm, receipt_details: e.target.value })} placeholder="Optional" /></Field>
            <Toggle checked={!!courierForm.isActive} onChange={(v) => setCourierForm({ ...courierForm, isActive: v })} label="Active" />
            <button type="submit" className="w-full py-3 rounded-xl font-semibold m3-bg-primary m3-text-on-primary active:scale-95 transition">Save courier</button>
          </form>
        </Modal>
      )}

      {/* Bus modal */}
      {modal === 'buses' && (
        <Modal title="Add bus" onClose={() => setModal(null)}>
          <form onSubmit={createBus} className="space-y-4">
            <Field label="Driver name"><input className={inputCls} required value={busForm.driver_name || ''} onChange={(e) => setBusForm({ ...busForm, driver_name: e.target.value })} /></Field>
            <Field label="Vehicle name"><input className={inputCls} value={busForm.vehicle_name || ''} onChange={(e) => setBusForm({ ...busForm, vehicle_name: e.target.value })} placeholder="Optional" /></Field>
            <Field label="Number plate"><input className={inputCls} required value={busForm.number_plate || ''} onChange={(e) => setBusForm({ ...busForm, number_plate: e.target.value })} /></Field>
            <Field label="Contact phone"><input className={inputCls} value={busForm.contact_phone || ''} onChange={(e) => setBusForm({ ...busForm, contact_phone: e.target.value })} placeholder="Optional" /></Field>
            <Toggle checked={!!busForm.isActive} onChange={(v) => setBusForm({ ...busForm, isActive: v })} label="Active" />
            <button type="submit" className="w-full py-3 rounded-xl font-semibold m3-bg-primary m3-text-on-primary active:scale-95 transition">Save bus</button>
          </form>
        </Modal>
      )}

      {/* Shipment modal */}
      {modal === 'shipments' && (
        <Modal title="New shipment" onClose={() => setModal(null)}>
          <form onSubmit={createShipment} className="space-y-4">
            <Field label="Method">
              <div className="flex gap-2">
                {(['courier', 'bus'] as const).map((m) => (
                  <button type="button" key={m} onClick={() => setShipForm({ ...shipForm, method: m })} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition ${shipForm.method === m ? 'm3-bg-primary m3-text-on-primary' : 'm3-bg-surface-container m3-text-on-surface-variant'}`}>{m}</button>
                ))}
              </div>
            </Field>
            {shipForm.method === 'courier' ? (
              <Field label="Courier"><select className={inputCls} value={shipForm.courier_id || ''} onChange={(e) => setShipForm({ ...shipForm, courier_id: e.target.value })}><option value="">Select courier</option>{couriers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select></Field>
            ) : (
              <Field label="Bus"><select className={inputCls} value={shipForm.bus_id || ''} onChange={(e) => setShipForm({ ...shipForm, bus_id: e.target.value })}><option value="">Select bus</option>{buses.map((b) => <option key={b.id} value={b.id}>{b.driver_name} · {b.number_plate}</option>)}</select></Field>
            )}
            <Field label="Recipient name"><input className={inputCls} value={shipForm.recipient_name || ''} onChange={(e) => setShipForm({ ...shipForm, recipient_name: e.target.value })} /></Field>
            <Field label="Recipient phone"><input className={inputCls} value={shipForm.recipient_phone || ''} onChange={(e) => setShipForm({ ...shipForm, recipient_phone: e.target.value })} /></Field>
            <Field label="Destination"><input className={inputCls} value={shipForm.destination || ''} onChange={(e) => setShipForm({ ...shipForm, destination: e.target.value })} placeholder="City / address" /></Field>
            <Field label="Shipping cost"><input type="number" min="0" step="0.01" className={inputCls} value={shipForm.shipping_cost ?? 0} onChange={(e) => setShipForm({ ...shipForm, shipping_cost: parseFloat(e.target.value) || 0 })} /></Field>
            <button type="submit" className="w-full py-3 rounded-xl font-semibold m3-bg-primary m3-text-on-primary active:scale-95 transition">Create shipment</button>
          </form>
        </Modal>
      )}

      {/* Confirm delete */}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="text-sm m3-text-on-surface-variant mb-5">{confirm.msg}</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl font-semibold m3-bg-surface-high m3-text-on-surface active:scale-95 transition">Cancel</button>
            <button onClick={confirm.onYes} className="flex-1 py-2.5 rounded-xl font-semibold m3-bg-error-container m3-text-error active:scale-95 transition">Delete</button>
          </div>
        </Modal>
      )}

      <PremiumUpgradeModal
        isOpen={showTrackingUpsell}
        onClose={() => setShowTrackingUpsell(false)}
        title="Unlock Public Tracking"
        description="Give customers a shareable page to track their shipment by number — a premium add-on you can unlock for a small monthly fee."
        bullets={[
          'A branded public page customers open with a tracking number',
          'Live status updates as you move shipments along',
          'Fewer “where’s my order?” messages to answer',
        ]}
      />
    </StandaloneShell>
  );
};

const Stat: React.FC<{ icon: string; label: string; value: number; tone: 'primary' | 'secondary' | 'tertiary' }> = ({ icon, label, value, tone }) => {
  const c = tone === 'secondary' ? 'm3-text-secondary' : tone === 'tertiary' ? 'm3-text-tertiary' : 'm3-text-primary';
  return (
    <div className="m3-bg-surface-lowest rounded-2xl p-4 shadow-sm border m3-border-outline-variant">
      <span className={`material-symbols-outlined ${c}`} style={{ fontSize: 24 }}>{icon}</span>
      <p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant mt-1">{label}</p>
      <p className="text-2xl font-bold m3-text-on-surface">{value}</p>
    </div>
  );
};

const Empty: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="text-center py-16 m3-text-on-surface-variant">
    <span className="material-symbols-outlined" style={{ fontSize: 44 }}>{icon}</span>
    <p className="mt-3 text-sm">{text}</p>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium m3-text-on-surface">{label}</span>
    <button type="button" onClick={() => onChange(!checked)} className={`relative w-12 h-7 rounded-full transition-colors ${checked ? 'm3-bg-primary' : 'm3-bg-surface-high'}`}>
      <span className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: checked ? 24 : 4 }} />
    </button>
  </div>
);

export default LogisticsApp;
