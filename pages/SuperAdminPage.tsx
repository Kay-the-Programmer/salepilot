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
  const topRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const revenueRef = useRef<HTMLDivElement>(null);
  const storesRef = useRef<HTMLDivElement>(null);

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

  // Icons
  const Icons = {
    Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Bell: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    Dollar: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Users: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
    ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
    SortUp: () => <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
    SortDown: () => <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Send: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-medium animate-pulse">Loading dashboard...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600 font-medium">Error: {error}</div>;

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 text-gray-800 font-sans pb-12" ref={topRef}>
      {/* Top Header / Banner */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Icons.Users />
              <span className="sr-only">Admin Icon</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Super Admin Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 hidden sm:block">Logged in as Super Admin</div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-white shadow-sm ring-1 ring-gray-100"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Summary Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl shadow-lg text-white p-6 relative overflow-hidden" ref={revenueRef}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <svg className="w-32 h-32 text-indigo-200" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="relative z-10">
              <h2 className="text-indigo-200 text-sm uppercase tracking-wider font-semibold mb-1">Total Revenue</h2>
              <div className="text-4xl font-bold mb-4 flex items-baseline gap-2">
                {revSummary ? revSummary.totalAmount.toFixed(2) : '0.00'}
                <span className="text-lg text-indigo-300 font-normal">USD</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {revSummary?.byMonth.slice(0, 4).map(m => (
                  <div key={m.month} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <div className="text-xs text-indigo-200 mb-1">{m.month}</div>
                    <div className="font-semibold text-lg">{Number(m.amount).toFixed(0)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={recordSubscriptionPayment}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-900 rounded-lg font-medium hover:bg-indigo-50 transition-colors shadow-sm text-sm"
                >
                  <Icons.Plus /> Record Payment
                </button>
              </div>
            </div>
          </div>

          {/* Notification Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col" ref={notifRef}>
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Icons.Bell />
              </div>
              <h2 className="font-bold text-lg">Broadcast</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Send a system-wide notification to all active stores.</p>

            <div className="space-y-3 flex-1">
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Notification Title"
                value={notifTitle}
                onChange={e => setNotifTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none h-24 resize-none"
                placeholder="Message content..."
                value={notifMessage}
                onChange={e => setNotifMessage(e.target.value)}
              />
            </div>
            <button
              onClick={sendNotification}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Icons.Send /> Send Broadcast
            </button>
          </div>
        </div>

        {/* Stores Section - Modern data table layout */}
        <div className="space-y-4" ref={storesRef}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">Registered Stores</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-900">{totalItems}</span> Total Stores
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Filters Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Icons.Search />
                </div>
                <input
                  className="pl-10 w-full border border-gray-300 rounded-lg py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                  placeholder="Search stores..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>

              <div className="md:col-span-3">
                <select
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                  value={subFilter}
                  onChange={(e) => { setSubFilter(e.target.value as any); setPage(1); }}
                >
                  <option value="all">All Subscriptions</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white text-gray-600"
                  value={pageSize}
                  onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
                >
                  <option value={10}>10 rows</option>
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'name', label: 'Store Name' },
                      { key: 'status', label: 'Status' },
                      { key: 'subscriptionStatus', label: 'Sub. Status' },
                      { key: 'subscriptionEndsAt', label: 'Renews' },
                      { key: 'createdAt', label: 'Joined' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                        onClick={() => toggleSort(col.key as keyof StoreRow)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          <span className="text-gray-400 group-hover:text-gray-600">
                            {sortKey === col.key ? (sortDir === 'asc' ? <Icons.SortUp /> : <Icons.SortDown />) : <div className="w-3 h-3" />}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pageItems.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5 opacity-60">ID: {s.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          s.status === 'inactive' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.status === 'active' ? 'bg-emerald-500' :
                            s.status === 'inactive' ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`}></span>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${s.subscriptionStatus === 'active' ? 'bg-blue-50 text-blue-700' :
                          s.subscriptionStatus === 'trial' ? 'bg-purple-50 text-purple-700' :
                            s.subscriptionStatus === 'past_due' ? 'bg-orange-50 text-orange-700' :
                              'bg-gray-100 text-gray-600'
                          }`}>
                          {s.subscriptionStatus === 'active' && '✨ '}
                          {s.subscriptionStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.subscriptionEndsAt ? new Date(s.subscriptionEndsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {s.status !== 'active' ? (
                            <button
                              className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-md transition-colors text-xs"
                              onClick={() => updateStore(s.id, { status: 'active' })}
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              className="text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors text-xs"
                              onClick={() => updateStore(s.id, { status: 'inactive' })}
                            >
                              Deactivate
                            </button>
                          )}
                          <button
                            className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                            title="Manage Subscription"
                            onClick={() => {
                              const next = prompt('Enter subscription status (trial|active|past_due|canceled):', s.subscriptionStatus);
                              if (!next) return;
                              updateStore(s.id, { subscriptionStatus: next as any });
                            }}
                          >
                            <Icons.Dollar />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-gray-100 rounded-full">
                            <Icons.Search />
                          </div>
                          <p className="text-base font-medium text-gray-900">No stores found</p>
                          <p className="text-sm">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{Math.min(totalItems, start + 1)}</span> to <span className="font-medium">{Math.min(totalItems, start + pageSize)}</span> of <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">First</span>
                      {'<<'}
                    </button>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <Icons.ChevronLeft />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {currentPage}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <Icons.ChevronRight />
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={currentPage >= totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Last</span>
                      {'>>'}
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminPage;
