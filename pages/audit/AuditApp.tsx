import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuditLog, User } from '../../types';
import StandaloneShell from '../../components/standalone/StandaloneShell';
import './audit.css';

interface AuditAppProps {
  logs: AuditLog[];
  users?: User[];
}

type Category = 'inventory' | 'sales' | 'users' | 'settings' | 'other';

const CATEGORY: Record<Category, { label: string; icon: string; chip: string }> = {
  inventory: { label: 'Inventory', icon: 'inventory_2', chip: 'm3-bg-primary-fixed m3-text-primary' },
  sales: { label: 'Sales', icon: 'payments', chip: 'm3-bg-secondary-fixed m3-text-secondary' },
  users: { label: 'Users', icon: 'manage_accounts', chip: 'm3-bg-tertiary-fixed m3-text-tertiary' },
  settings: { label: 'Settings', icon: 'settings', chip: 'm3-bg-surface-high m3-text-on-surface-variant' },
  other: { label: 'Other', icon: 'history', chip: 'm3-bg-surface-high m3-text-on-surface-variant' },
};

const categorize = (action: string): Category => {
  const a = (action || '').toLowerCase();
  if (/stock|product|inventory|adjust|reorder|category|supplier|purchase/.test(a)) return 'inventory';
  if (/sale|refund|payment|order|return|invoice|checkout/.test(a)) return 'sales';
  if (/user|role|login|permission|staff|account|password/.test(a)) return 'users';
  if (/setting|config|store|tax|currency|preference/.test(a)) return 'settings';
  return 'other';
};

const isCritical = (action: string) =>
  /fail|failed|delete|deleted|remove|unauthor|error|breach|denied|suspicious|lock/i.test(action || '');

const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  if (isNaN(diff)) return '';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(ts).toLocaleDateString();
};

const FILTERS: { id: 'all' | Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
  { id: 'users', label: 'Users' },
  { id: 'settings', label: 'Settings' },
];

const AuditApp: React.FC<AuditAppProps> = ({ logs }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const criticalCount = useMemo(() => logs.filter((l) => isCritical(l.action)).length, [logs]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...logs]
      .filter((l) => (filter === 'all' ? true : categorize(l.action) === filter))
      .filter((l) => !q || `${l.userName} ${l.action} ${l.details}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, filter, search]);

  const navItems = [
    { icon: 'manage_search', label: 'Audit', active: true, onClick: () => { } },
  ];

  const headerActions = (
    <button
      onClick={() => setShowSearch((s) => !s)}
      className={`w-10 h-10 flex opacity-0 items-center justify-center rounded-full transition active:scale-90 ${showSearch ? 'm3-bg-surface-high m3-text-primary' : 'm3-text-on-surface-variant hover:m3-bg-surface-high'}`}
      title="Search"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>search</span>
    </button>
  );

  return (
    <StandaloneShell icon="manage_search" title="Audit Trail" scopeClass="sp-audit" headerActions={headerActions} navItems={navItems}>
      <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto w-full pb-24 md:pb-8">

        {/* Search */}
        {!showSearch && (
          <div className="mb-4 sp-fade-in">
            <div className="flex items-center gap-2 m3-bg-surface-container rounded-xl px-3 h-12">
              <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 20 }}>search</span>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user, action or detail…"
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm m3-text-on-surface m3-placeholder"
              />
              {search && (
                <button onClick={() => setSearch('')} className="m3-text-on-surface-variant"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span></button>
              )}
            </div>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-4 mb-5">
          <div className="m3-bg-surface-low p-4 rounded-xl shadow-sm border m3-border-outline-variant">
            <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 30 }}>history</span>
            <div className="text-[11px] uppercase tracking-wider m3-text-on-surface-variant mt-2 mb-1">Recent Activities</div>
            <div className="text-2xl font-bold m3-text-on-surface">{logs.length}</div>
          </div>
          <div className="m3-bg-error-container p-4 rounded-xl shadow-sm">
            <span className="material-symbols-outlined m3-text-error" style={{ fontSize: 30 }}>warning</span>
            <div className="text-[11px] uppercase tracking-wider m3-text-on-error-container mt-2 mb-1">Critical Alerts</div>
            <div className="text-2xl font-bold m3-text-on-error-container">{String(criticalCount).padStart(2, '0')}</div>
          </div>
        </section>

        {/* Filter chips */}
        <div className="flex overflow-x-auto gap-2 scrollbar-hide py-1 mb-5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap active:scale-95 transition ${filter === f.id ? 'm3-bg-primary m3-text-on-primary' : 'm3-bg-surface-high m3-text-on-surface-variant hover:m3-bg-surface-highest'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {visible.length === 0 ? (
          <div className="text-center py-16 m3-text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: 40 }}>history_toggle_off</span>
            <p className="mt-2 text-sm">No activity{search || filter !== 'all' ? ' matches your filters' : ' recorded yet'}.</p>
          </div>
        ) : (
          <div>
            {visible.map((log) => {
              const critical = isCritical(log.action);
              const cat = categorize(log.action);
              const meta = CATEGORY[cat];
              const open = expanded === log.id;
              const initials = (log.userName || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={log.id} className="timeline-item">
                  <div className="flex gap-4 relative timeline-line pb-4">
                    <div className={`z-10 h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${critical ? 'm3-bg-error-container m3-text-error' : meta.chip}`}>
                      <span className="material-symbols-outlined">{critical ? 'security_update_warning' : meta.icon}</span>
                    </div>
                    <button
                      onClick={() => setExpanded(open ? null : log.id)}
                      className="flex-1 text-left m3-bg-surface-lowest p-4 rounded-xl border m3-border-outline-variant shadow-sm active:scale-[0.99] transition"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-8 h-8 rounded-full m3-bg-primary m3-text-on-primary flex items-center justify-center text-[11px] font-bold shrink-0">{initials}</span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold m3-text-on-surface truncate">{log.userName || 'Unknown'}</h3>
                            <p className="text-[11px] m3-text-on-surface-variant">{timeAgo(log.timestamp)}</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 20, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }}>expand_more</span>
                      </div>
                      <p className={`text-sm font-medium ${critical ? 'm3-text-error' : 'm3-text-on-surface'}`}>{log.action}</p>
                      {open && log.details && (
                        <div className="mt-2 pt-2 border-t m3-border-outline-variant sp-fade-in">
                          <p className="text-[13px] m3-text-on-surface-variant whitespace-pre-wrap break-words">{log.details}</p>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StandaloneShell>
  );
};

export default AuditApp;
