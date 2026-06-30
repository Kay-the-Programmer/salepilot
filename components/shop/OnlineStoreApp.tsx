import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
    Link2, Copy, ExternalLink, Send, CalendarClock, Check, Megaphone,
} from 'lucide-react';
import { StoreSettings, User } from '../../types';
import { whatsappService, WhatsAppStatus } from '../../services/whatsappService';
import { whatsappCampaignService } from '../../services/whatsappCampaignService';
import StandaloneTopBar from '../standalone/StandaloneTopBar';

interface OnlineStoreAppProps {
    user: User;
    storeSettings: StoreSettings | null;
    onDiscover: () => void;
    onLogout: () => void;
    showSnackbar: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const card = 'bg-surface border border-brand-border rounded-2xl shadow-sm';
const btn = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
const btnPrimary = `${btn} bg-sp-amber text-white hover:bg-sp-green-dark`;
const btnGhost = `${btn} bg-surface-variant text-brand-text hover:brightness-95`;
const input = 'w-full px-4 py-2.5 rounded-xl border border-brand-border bg-surface-container-lowest text-brand-text focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none';

const SEGMENTS = [
    { id: 'all', label: 'All customers' },
    { id: 'inactive', label: 'Inactive customers' },
    { id: 'new', label: 'New customers' },
    { id: 'vip', label: 'VIP spenders' },
];

export const OnlineStoreApp: React.FC<OnlineStoreAppProps> = ({ user, storeSettings, onLogout, showSnackbar }) => {
    const storeId = user?.currentStoreId || '';
    const storeName = storeSettings?.name || 'Your store';
    const enabled = (storeSettings as any)?.isOnlineStoreEnabled !== false;
    const link = useMemo(() => (typeof window !== 'undefined' && storeId ? `${window.location.origin}/shop/${storeId}` : ''), [storeId]);

    const [qr, setQr] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [wa, setWa] = useState<WhatsAppStatus | null>(null);

    // Catalog-share scheduler state
    const [segment, setSegment] = useState('all');
    const [timing, setTiming] = useState<'now' | 'scheduled' | 'weekly'>('now');
    const [when, setWhen] = useState('');
    const [message, setMessage] = useState(`Hi [Name]! 🛍️ Browse our latest catalog and order online here: ${link}`);
    const [sending, setSending] = useState(false);

    useEffect(() => { setMessage(`Hi [Name]! 🛍️ Browse our latest catalog and order online here: ${link}`); }, [link]);
    useEffect(() => { if (link) QRCode.toDataURL(link, { width: 320, margin: 1 }).then(setQr).catch(() => setQr(null)); }, [link]);
    useEffect(() => { whatsappService.getStatus().then(setWa).catch(() => setWa(null)); }, []);

    const waReady = !!wa?.entitled && !!wa?.configured && !!wa?.enabled;

    const copy = () => {
        navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); showSnackbar('Store link copied.', 'success'); });
    };
    const share = async () => {
        if (navigator.share) { try { await navigator.share({ title: storeName, text: `Shop ${storeName} online`, url: link }); } catch { /* cancelled */ } }
        else { window.open(`https://wa.me/?text=${encodeURIComponent(`Shop ${storeName} online: ${link}`)}`, '_blank'); }
    };

    const shareCatalog = async () => {
        if (!waReady) { showSnackbar('Connect WhatsApp first (CRM → WhatsApp → Connect) to send catalogs.', 'info'); return; }
        if (!message.trim()) { showSnackbar('Add a message.', 'error'); return; }
        if (timing === 'scheduled' && !when) { showSnackbar('Pick a date & time.', 'error'); return; }
        setSending(true);
        try {
            const created: any = await whatsappCampaignService.create({
                name: `Catalog share — ${storeName}`.slice(0, 100),
                type: timing === 'weekly' ? 'recurring' : 'one_off',
                segment,
                messageMode: 'text',
                messageText: message.trim(),
                scheduledAt: timing === 'scheduled' ? new Date(when).toISOString() : (timing === 'weekly' && when ? new Date(when).toISOString() : null),
                recurrence: timing === 'weekly' ? 'weekly' : null,
            });
            if (timing === 'now' && created?.id) {
                const r: any = await whatsappCampaignService.run(created.id);
                showSnackbar(`Catalog sent to ${r.sent ?? 0} customer${(r.sent ?? 0) === 1 ? '' : 's'}.`, 'success');
            } else {
                showSnackbar(timing === 'weekly' ? 'Weekly catalog share scheduled.' : 'Catalog share scheduled.', 'success');
            }
        } catch (e: any) {
            showSnackbar(e?.message || 'Could not schedule catalog share.', 'error');
        } finally { setSending(false); }
    };

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden">
            <StandaloneTopBar
                className="relative flex-shrink-0 flex items-center justify-between border-b border-brand-border bg-surface px-3 h-16 z-20"
                currentRoute="store"
                onLogout={onLogout}
                rightExtra={
                    <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${enabled ? 'bg-success-muted text-success' : 'bg-surface-variant text-brand-text-muted'}`}>
                        <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-sp-green' : 'bg-brand-text-muted'}`} /> {enabled ? 'Live' : 'Offline'}
                    </span>
                }
            />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-3xl mx-auto grid grid-cols-1 gap-5">
                    {/* Store link + QR */}
                    <div className={`${card} p-6`}>
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-extrabold text-brand-text mb-1">Your storefront</h2>
                                <p className="text-sm text-brand-text-muted mb-4">Share this link with customers — they can browse your catalog and order online.</p>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-brand-border bg-surface-variant">
                                        <Link2 className="w-4 h-4 text-brand-text-muted shrink-0" />
                                        <span className="text-sm text-brand-text truncate">{link}</span>
                                    </div>
                                    <button className={btnGhost} onClick={copy} title="Copy link">{copied ? <Check className="w-4 h-4 text-sp-green" /> : <Copy className="w-4 h-4" />}</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <a className={btnPrimary} href={link} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> Preview store</a>
                                    <button className={btnGhost} onClick={share}><Send className="w-4 h-4" /> Share</button>
                                </div>
                                {!enabled && <p className="mt-3 text-xs text-sp-amber font-semibold">Your store is currently offline — enable it in Settings so customers can shop.</p>}
                            </div>
                            {qr && (
                                <div className="shrink-0 text-center">
                                    <img src={qr} alt="Store QR code" className="w-32 h-32 rounded-xl border border-brand-border bg-white p-1.5" />
                                    <p className="text-[11px] text-brand-text-muted mt-1.5">Scan to shop</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Catalog sharing / scheduling */}
                    <div className={`${card} p-6`}>
                        <div className="flex items-center gap-2 mb-1">
                            <Megaphone className="w-5 h-5 text-sp-green" />
                            <h2 className="text-base font-extrabold text-brand-text">Share your catalog on WhatsApp</h2>
                        </div>
                        <p className="text-sm text-brand-text-muted mb-4">Send your catalog link to customers now, schedule it, or send it automatically every week.</p>

                        {!waReady && (
                            <div className="mb-4 px-3 py-2.5 rounded-xl bg-sp-amber-soft text-sp-amber text-sm font-medium">
                                Connect WhatsApp in CRM → WhatsApp → Connect to send catalogs to customers.
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <label className="block">
                                <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Send to</span>
                                <select className={input} value={segment} onChange={e => setSegment(e.target.value)}>
                                    {SEGMENTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                            </label>
                            <label className="block">
                                <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">When</span>
                                <select className={input} value={timing} onChange={e => setTiming(e.target.value as any)}>
                                    <option value="now">Send now</option>
                                    <option value="scheduled">Schedule once</option>
                                    <option value="weekly">Every week</option>
                                </select>
                            </label>
                        </div>
                        {(timing === 'scheduled' || timing === 'weekly') && (
                            <label className="block mb-3">
                                <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">{timing === 'weekly' ? 'First send (optional)' : 'Date & time'}</span>
                                <input className={input} type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
                            </label>
                        )}
                        <label className="block mb-4">
                            <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Message</span>
                            <textarea className={`${input} min-h-[90px] resize-y`} value={message} onChange={e => setMessage(e.target.value)} />
                            <span className="text-xs text-brand-text-muted">[Name] is filled per customer. Free-form text reaches customers active in the last 24h; use a template campaign in the CRM for cold sends.</span>
                        </label>
                        <button className={`${btnPrimary} w-full py-3`} onClick={shareCatalog} disabled={sending || !waReady}>
                            {timing === 'now' ? <Send className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
                            {sending ? 'Working…' : timing === 'now' ? 'Share catalog now' : timing === 'weekly' ? 'Schedule weekly share' : 'Schedule catalog share'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OnlineStoreApp;
