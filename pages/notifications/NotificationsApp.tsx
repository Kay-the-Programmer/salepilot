import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import StandaloneShell from '../../components/standalone/StandaloneShell';

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

const iconFor = (type?: string): { icon: string; tone: string } => {
  const t = (type || '').toLowerCase();
  if (/warn|alert|stock|low/.test(t)) return { icon: 'warning', tone: 'm3-bg-error-container m3-text-error' };
  if (/success|paid|complete|approv/.test(t)) return { icon: 'check_circle', tone: 'm3-bg-primary-fixed m3-text-primary' };
  if (/order|sale|purchase|delivery|ship/.test(t)) return { icon: 'shopping_bag', tone: 'm3-bg-secondary-fixed m3-text-secondary' };
  if (/message|chat|whatsapp/.test(t)) return { icon: 'chat', tone: 'm3-bg-tertiary-fixed m3-text-tertiary' };
  return { icon: 'notifications', tone: 'm3-bg-primary-fixed m3-text-primary' };
};

const NotificationsApp: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [busy, setBusy] = useState(false);

  const handleOpen = async (id: string, link?: string, isRead?: boolean) => {
    if (!isRead) { try { await markAsRead(id); } catch { /* ignore */ } }
    if (link) navigate(link);
  };

  const headerActions = unreadCount > 0 ? (
    <button
      onClick={async () => { setBusy(true); try { await markAllAsRead(); } finally { setBusy(false); } }}
      disabled={busy}
      className="h-9 px-3 hidden sm:flex items-center gap-1 rounded-full text-sm font-semibold m3-text-primary hover:m3-bg-surface-high transition active:scale-95 disabled:opacity-50"
      title="Mark all as read"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>done_all</span>
      Mark all read
    </button>
  ) : undefined;

  return (
    <StandaloneShell title="Notifications" headerActions={headerActions}>
      <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto w-full pb-24 md:pb-8">
        {/* Summary */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold m3-text-on-surface">Inbox</h2>
            <p className="text-sm m3-text-on-surface-variant mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={async () => { setBusy(true); try { await markAllAsRead(); } finally { setBusy(false); } }}
              disabled={busy}
              className="sm:hidden h-9 px-3 rounded-full text-sm font-semibold m3-bg-surface-high m3-text-primary active:scale-95 transition disabled:opacity-50"
            >
              Mark all
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20 m3-text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: 44 }}>notifications_off</span>
            <p className="mt-3 text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => {
              const { icon, tone } = iconFor(n.type);
              const unread = !n.isRead;
              return (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n.id, n.link, n.isRead)}
                  className={`w-full text-left flex gap-3 p-4 rounded-xl border shadow-sm active:scale-[0.99] transition sp-fade-in ${unread ? 'm3-bg-surface-lowest m3-border-primary' : 'm3-bg-surface-container m3-border-outline-variant'}`}
                >
                  <span className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm truncate ${unread ? 'font-bold m3-text-on-surface' : 'font-semibold m3-text-on-surface-variant'}`}>{n.title}</h3>
                      <span className="text-[11px] m3-text-on-surface-variant shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-[13px] m3-text-on-surface-variant mt-0.5 line-clamp-2">{n.message}</p>
                    {n.senderName && <p className="text-[11px] m3-text-outline mt-1">{n.senderName}</p>}
                  </div>
                  {unread && <span className="w-2.5 h-2.5 rounded-full m3-bg-primary shrink-0 mt-1.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </StandaloneShell>
  );
};

export default NotificationsApp;
