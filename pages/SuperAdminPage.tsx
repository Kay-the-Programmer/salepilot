import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';

interface StoreRow {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
  subscriptionEndsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RevenueSummary {
  totalAmount: number;
  count: number;
  byMonth: { month: string; amount: number; count: number; }[];
}

const SuperAdminPage: React.FC = () => {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [revSummary, setRevSummary] = useState<RevenueSummary | null>(null);

  // Table UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StoreRow['status']>('all');
  const [subFilter, setSubFilter] = useState<'all' | StoreRow['subscriptionStatus']>('all');
  const [sortKey, setSortKey] = useState<keyof StoreRow>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Section refs for sidebar quick links
  const topRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const revenueRef = useRef<HTMLDivElement | null>(null);
  const storesRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storesResp, revResp] = await Promise.all([
        api.get<{ stores: StoreRow[] }>("/superadmin/stores"),
        api.get<{ summary: RevenueSummary }>("/superadmin/revenue/summary")
      ]);
      setStores(storesResp.stores || []);
      setRevSummary(revResp.summary);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Listen for sidebar quick-link navigation events
  useEffect(() => {
    const handler = (e: any) => {
      const section = e?.detail?.section as string | undefined;
      const map: Record<string, React.RefObject<HTMLDivElement>> = {
        top: topRef,
        notifications: notifRef,
        revenue: revenueRef,
        stores: storesRef,
      };
      const target = section ? map[section] : topRef;
      if (target?.current) {
        target.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('superadmin:navigate', handler as any);
    return () => window.removeEventListener('superadmin:navigate', handler as any);
  }, []);

  const updateStore = async (id: string, patch: Partial<StoreRow>) => {
    try {
      const resp = await api.patch<{ store: StoreRow }>(`/superadmin/stores/${id}`, patch);
      setStores(prev => prev.map(s => s.id === id ? resp.store : s));
    } catch (e: any) {
      alert(e.message || 'Update failed');
    }
  };

  const sendNotification = async () => {
    try {
      if (!notifTitle || !notifMessage) return alert('Please enter title and message');
      await api.post('/superadmin/notifications', { title: notifTitle, message: notifMessage });
      alert('Notification sent');
      setNotifTitle('');
      setNotifMessage('');
    } catch (e: any) {
      alert(e.message || 'Failed to send notification');
    }
  };

  const recordSubscriptionPayment = async () => {
    try {
      const storeId = prompt('Enter Store ID to record payment for:');
      if (!storeId) return;
      const amountStr = prompt('Enter amount (e.g., 29.99):');
      if (!amountStr) return;
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) return alert('Invalid amount');
      const currency = prompt('Enter currency (e.g., USD):', 'USD') || 'USD';
      const periodStart = prompt('Period start (YYYY-MM-DD), optional:') || undefined;
      const periodEnd = prompt('Period end (YYYY-MM-DD), optional:') || undefined;
      await api.post('/superadmin/revenue/payments', { storeId, amount, currency, periodStart, periodEnd });
      alert('Subscription payment recorded');
      // refresh summary
      const revResp = await api.get<{ summary: RevenueSummary }>("/superadmin/revenue/summary");
      setRevSummary(revResp.summary);
    } catch (e: any) {
      alert(e.message || 'Failed to record payment');
    }
  };

  // Derived collections for filtering/sorting/pagination
  const normalized = (v: any) => (v ?? '').toString().toLowerCase();
  const filtered = stores.filter(s => {
    const matchesSearch = !search || normalized(s.name).includes(normalized(search)) || normalized(s.id).includes(normalized(search));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesSub = subFilter === 'all' || s.subscriptionStatus === subFilter;
    return matchesSearch && matchesStatus && matchesSub;
  });
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    let av: any = (a as any)[sortKey];
    let bv: any = (b as any)[sortKey];
    // Handle dates
    if (sortKey === 'createdAt' || sortKey === 'updatedAt' || sortKey === 'subscriptionEndsAt') {
      av = av ? Date.parse(av as any) : 0;
      bv = bv ? Date.parse(bv as any) : 0;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  const toggleSort = (key: keyof StoreRow) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6" ref={topRef}>
      <h1 className="text-2xl font-bold">Superadmin</h1>

      {/* System-wide notification composer */}
      <div className="bg-white border rounded p-4" ref={notifRef}>
        <h2 className="text-lg font-semibold mb-2">Send System-wide Notification</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border p-2 rounded" placeholder="Title" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
          <input className="border p-2 rounded md:col-span-2" placeholder="Message" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} />
        </div>
        <div className="mt-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={sendNotification}>Send</button>
        </div>
      </div>

      {/* Revenue summary */}
      <div className="bg-white border rounded p-4" ref={revenueRef}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Subscription Revenue</h2>
          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={recordSubscriptionPayment}>Record Payment</button>
        </div>
        {revSummary ? (
          <div className="mt-2 text-sm text-gray-700">
            <div>Total received: <span className="font-semibold">{revSummary.totalAmount.toFixed(2)}</span> across {revSummary.count} payments</div>
            <div className="mt-2">
              <div className="font-semibold">Last 12 months</div>
              <ul className="list-disc ml-5">
                {revSummary.byMonth.map(m => (
                  <li key={m.month}>{m.month}: {Number(m.amount).toFixed(2)} ({m.count})</li>
                ))}
              </ul>
            </div>
          </div>
        ) : <div className="text-sm text-gray-500">No revenue yet.</div>}
      </div>

      {/* Stores table */}
      <div ref={storesRef}>
        <h2 className="text-lg font-semibold mb-2">System Stores</h2>
        {/* Controls */}
        <div className="bg-white border rounded p-3 mb-2 grid gap-2 md:grid-cols-5">
          <input
            className="border rounded px-2 py-1 md:col-span-2"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="border rounded px-2 py-1"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={subFilter}
            onChange={(e) => { setSubFilter(e.target.value as any); setPage(1); }}
          >
            <option value="all">All Subscriptions</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Page size</label>
            <select
              className="border rounded px-2 py-1"
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-600">
                <th className="p-3 border-b cursor-pointer select-none" onClick={() => toggleSort('name')}>Name {sortKey==='name' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="p-3 border-b cursor-pointer select-none" onClick={() => toggleSort('status')}>Status {sortKey==='status' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="p-3 border-b cursor-pointer select-none" onClick={() => toggleSort('subscriptionStatus')}>Subscription {sortKey==='subscriptionStatus' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="p-3 border-b cursor-pointer select-none" onClick={() => toggleSort('subscriptionEndsAt')}>Ends {sortKey==='subscriptionEndsAt' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="p-3 border-b cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>Created {sortKey==='createdAt' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(s => (
                <tr key={s.id} className="border-b text-sm">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${s.status === 'active' ? 'bg-green-100 text-green-700' : s.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                  </td>
                  <td className="p-3">{s.subscriptionStatus}</td>
                  <td className="p-3">{s.subscriptionEndsAt ? new Date(s.subscriptionEndsAt).toLocaleDateString() : '-'}</td>
                  <td className="p-3">{s.createdAt}</td>
                  <td className="p-3 space-x-2">
                    {s.status !== 'active' && (
                      <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => updateStore(s.id, { status: 'active' })}>Activate</button>
                    )}
                    {s.status === 'active' && (
                      <button className="px-3 py-1 bg-gray-600 text-white rounded" onClick={() => updateStore(s.id, { status: 'inactive' })}>Deactivate</button>
                    )}
                    <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => {
                      const next = prompt('Enter subscription status (trial|active|past_due|canceled):', s.subscriptionStatus);
                      if (!next) return;
                      updateStore(s.id, { subscriptionStatus: next as any });
                    }}>Set Subscription</button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-sm text-gray-500">No stores match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between mt-2 text-sm text-gray-700">
          <div>
            Showing {Math.min(totalItems, start + 1)}–{Math.min(totalItems, start + pageSize)} of {totalItems}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage <= 1} onClick={() => setPage(1)}>{'<<'}</button>
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{'<'}</button>
            <span>Page {currentPage} / {totalPages}</span>
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>{'>'}</button>
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>{'>>'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
