import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import '../assistant/assistant.css';

interface TrackResult {
  tracking_number: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  method: 'courier' | 'bus';
  destination?: string;
  recipient_name?: string;
  created_at?: string;
  updated_at?: string;
  courier_name?: string;
  bus_driver_name?: string;
  bus_number_plate?: string;
  store_name?: string;
}

const STEPS: { id: TrackResult['status']; label: string; icon: string }[] = [
  { id: 'pending', label: 'Order placed', icon: 'receipt_long' },
  { id: 'confirmed', label: 'Confirmed', icon: 'task_alt' },
  { id: 'shipped', label: 'Shipped', icon: 'inventory_2' },
  { id: 'in_transit', label: 'In transit', icon: 'local_shipping' },
  { id: 'delivered', label: 'Delivered', icon: 'home' },
];
const stepIndex = (s: TrackResult['status']) => Math.max(0, STEPS.findIndex((x) => x.id === s));
const isFailed = (s: TrackResult['status']) => s === 'failed' || s === 'returned';

const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const TrackShipmentPage: React.FC = () => {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState(trackingNumber || '');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'notfound' | 'error'>('idle');

  const track = useCallback(async (num: string) => {
    const n = num.trim();
    if (!n) return;
    setStatus('loading'); setResult(null);
    try {
      const data = await api.get<TrackResult>(`/logistics/track/${encodeURIComponent(n)}`);
      if (data && data.tracking_number) { setResult(data); setStatus('idle'); }
      else setStatus('notfound');
    } catch (e: any) {
      setStatus(e?.status === 404 ? 'notfound' : 'error');
    }
  }, []);

  useEffect(() => { if (trackingNumber) track(trackingNumber); }, [trackingNumber, track]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { navigate(`/track/${encodeURIComponent(query.trim())}`); track(query); }
  };

  const idx = result ? stepIndex(result.status) : -1;
  const failed = result ? isFailed(result.status) : false;

  return (
    <div className="sp-assistant min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-16 flex-shrink-0 m3-bg-surface shadow-sm flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 26 }}>local_shipping</span>
          <h1 className="text-lg md:text-xl font-bold m3-text-primary tracking-tight">Track Shipment</h1>
        </div>
        <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high transition active:scale-90" title="Toggle theme">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </header>

      <main className="flex-1 px-4 md:px-8 py-8 w-full max-w-2xl mx-auto">
        {/* Hero + search */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-[32px] font-bold m3-text-on-surface mb-1">Where's my delivery?</h2>
          <p className="text-sm md:text-base m3-text-on-surface-variant">Enter your tracking number to see the latest status.</p>
        </div>
        <form onSubmit={onSubmit} className="flex gap-2 mb-8">
          <div className="flex-1 flex items-center gap-2 m3-bg-surface-lowest border m3-border-outline-variant rounded-full px-4 h-14 shadow-sm focus-within:m3-border-primary transition">
            <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 22 }}>search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. TRK-1042"
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-base m3-text-on-surface m3-placeholder"
            />
          </div>
          <button type="submit" className="px-5 md:px-7 rounded-full m3-bg-primary m3-text-on-primary font-semibold active:scale-95 transition hover:opacity-90">Track</button>
        </form>

        {/* States */}
        {status === 'loading' && (
          <div className="text-center py-16 m3-text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin m3-text-primary" style={{ fontSize: 36 }}>progress_activity</span>
            <p className="mt-3 text-sm">Looking up your shipment…</p>
          </div>
        )}

        {status === 'notfound' && (
          <div className="text-center py-16 sp-fade-in">
            <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 44 }}>search_off</span>
            <h3 className="mt-3 font-bold m3-text-on-surface">No shipment found</h3>
            <p className="text-sm m3-text-on-surface-variant mt-1">Double-check the tracking number and try again.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-16 sp-fade-in">
            <span className="material-symbols-outlined m3-text-error" style={{ fontSize: 44 }}>error</span>
            <h3 className="mt-3 font-bold m3-text-on-surface">Something went wrong</h3>
            <p className="text-sm m3-text-on-surface-variant mt-1">Please check your connection and try again.</p>
          </div>
        )}

        {result && status === 'idle' && (
          <div className="sp-fade-in space-y-4">
            {/* Status header card */}
            <div className={`rounded-2xl p-6 text-center ${failed ? 'm3-bg-error-container' : 'm3-bg-primary-container'}`}>
              <span className={`material-symbols-outlined ${failed ? 'm3-text-error' : 'm3-text-on-primary-container'}`} style={{ fontSize: 44, fontVariationSettings: "'FILL' 1" }}>
                {failed ? 'cancel' : result.status === 'delivered' ? 'check_circle' : 'local_shipping'}
              </span>
              <p className={`text-xs uppercase tracking-wide mt-2 ${failed ? 'm3-text-error' : 'm3-text-on-primary-container'}`} style={{ opacity: 0.85 }}>Status</p>
              <p className={`text-2xl font-bold capitalize ${failed ? 'm3-text-error' : 'm3-text-on-primary-container'}`}>{result.status.replace('_', ' ')}</p>
              <p className={`text-sm mt-1 ${failed ? 'm3-text-error' : 'm3-text-on-primary-container'}`} style={{ opacity: 0.85 }}>Tracking #{result.tracking_number}</p>
            </div>

            {/* Timeline */}
            {!failed && (
              <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm p-5">
                <ol className="space-y-0">
                  {STEPS.map((step, i) => {
                    const done = i <= idx;
                    const current = i === idx;
                    return (
                      <li key={step.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${done ? 'm3-bg-primary m3-text-on-primary' : 'm3-bg-surface-high m3-text-on-surface-variant'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: done ? "'FILL' 1" : undefined }}>{done ? 'check' : step.icon}</span>
                          </span>
                          {i < STEPS.length - 1 && <span className="w-0.5 flex-1 my-1" style={{ minHeight: 24, background: i < idx ? 'var(--m3-primary)' : 'var(--m3-outline-variant)' }} />}
                        </div>
                        <div className={`pb-6 ${current ? '' : ''}`}>
                          <p className={`text-sm font-semibold ${done ? 'm3-text-on-surface' : 'm3-text-on-surface-variant'}`}>{step.label}</p>
                          {current && <p className="text-[11px] m3-text-primary font-medium">Current status · {fmtDate(result.updated_at)}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Details */}
            <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm divide-y" style={{ borderColor: 'var(--m3-outline-variant)' }}>
              <Detail icon="storefront" label="Shipped by" value={result.store_name} />
              <Detail icon="place" label="Destination" value={result.destination} />
              <Detail icon="person" label="Recipient" value={result.recipient_name} />
              <Detail icon={result.method === 'bus' ? 'directions_bus' : 'two_wheeler'} label={result.method === 'bus' ? 'Bus' : 'Courier'} value={result.method === 'bus' ? [result.bus_driver_name, result.bus_number_plate].filter(Boolean).join(' · ') : result.courier_name} />
              <Detail icon="schedule" label="Last updated" value={fmtDate(result.updated_at)} />
            </div>
          </div>
        )}

        {status === 'idle' && !result && (
          <div className="text-center py-12 m3-text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: 44, opacity: 0.6 }}>local_shipping</span>
            <p className="mt-3 text-sm">Your tracking details will appear here.</p>
          </div>
        )}

        <p className="text-center text-[11px] m3-text-outline mt-10">Powered by SalePilot</p>
      </main>
    </div>
  );
};

const Detail: React.FC<{ icon: string; label: string; value?: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-4">
    <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 22 }}>{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant">{label}</p>
      <p className="text-sm font-medium m3-text-on-surface truncate">{value || '—'}</p>
    </div>
  </div>
);

export default TrackShipmentPage;
