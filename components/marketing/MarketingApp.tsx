import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Facebook, Send, MessageCircle, BarChart3, Sparkles, Image as ImageIcon, Link2,
    Trash2, EyeOff, Eye, RefreshCw, CheckCircle2, Lock, LogOut, LayoutGrid, Plug, X, Clock,
} from 'lucide-react';
import { StoreSettings, User } from '../../types';
import { facebookService, FacebookStatus, FacebookPageRef, FacebookPost, FacebookComment, loadFacebookSdk, facebookLogin } from '../../services/facebookService';
import { SOCIAL_FREE, MARKETING_COMING_SOON } from '../../utils/entitlements';
import MarketingPage from '../../pages/MarketingPage';
import LoadingSpinner from '../LoadingSpinner';

interface MarketingAppProps {
    user: User;
    storeSettings: StoreSettings | null;
    onUpgrade: () => void;
    onDiscover: () => void;
    onExit: () => void;
    onLogout: () => void;
    showSnackbar: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type Tab = 'compose' | 'comments' | 'insights' | 'posters' | 'connect';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'comments', label: 'Comments', icon: MessageCircle },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'posters', label: 'Posters', icon: Sparkles },
    { id: 'connect', label: 'Connect', icon: Plug },
];

const card = 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl';
const btn = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
const btnPrimary = `${btn} bg-blue-600 text-white hover:bg-blue-700`;
const btnGhost = `${btn} bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700`;
const input = 'w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';

export const MarketingApp: React.FC<MarketingAppProps> = ({ onUpgrade, onDiscover, onLogout, showSnackbar }) => {
    const [tab, setTab] = useState<Tab>('compose');
    const [status, setStatus] = useState<FacebookStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const entitledFallback = SOCIAL_FREE;

    const loadStatus = useCallback(() => {
        setLoading(true);
        facebookService.getStatus()
            .then(s => setStatus({ ...s, entitled: s?.entitled ?? entitledFallback }))
            .catch(() => setStatus({ configured: false, appId: '', entitled: entitledFallback, connected: false, enabled: false, pageId: null, pageName: null }))
            .finally(() => setLoading(false));
    }, [entitledFallback]);

    useEffect(() => { if (!MARKETING_COMING_SOON) loadStatus(); }, [loadStatus]);

    const connected = !!status?.connected && !!status?.enabled;

    // Product gate: ship as "Coming Soon" until launched (flip MARKETING_COMING_SOON).
    if (MARKETING_COMING_SOON) {
        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-blue-600 rounded-lg text-white shrink-0"><Facebook className="w-5 h-5" /></div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Marketing Suite</h1>
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">Manage your Facebook Page</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className={btnGhost} onClick={onDiscover} title="Discover apps"><LayoutGrid className="w-4 h-4" /></button>
                        <button className={btnGhost} onClick={onLogout} title="Logout"><LogOut className="w-4 h-4" /></button>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className={`${card} p-8 max-w-md text-center`}>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400"><Clock className="w-8 h-8" /></div>
                        <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Coming Soon</span>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Marketing Suite is on the way</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Soon you'll publish posts to your Facebook Page, reply to and moderate comments, and track engagement insights — all from here. We'll let you know the moment it's ready.</p>
                        <button className={btnPrimary} onClick={onDiscover}><LayoutGrid className="w-4 h-4" /> Back to Discover</button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Header */}
            <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-blue-600 rounded-lg text-white shrink-0"><Facebook className="w-5 h-5" /></div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Marketing Suite</h1>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                            {status?.connected ? `Connected · ${status.pageName}` : 'Manage your Facebook Page'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${connected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} /> {connected ? 'Connected' : 'Not connected'}
                    </span>
                    <button className={btnGhost} onClick={onDiscover} title="Discover apps"><LayoutGrid className="w-4 h-4" /></button>
                    <button className={btnGhost} onClick={onLogout} title="Logout"><LogOut className="w-4 h-4" /></button>
                </div>
            </header>

            {/* Tabs */}
            <nav className="px-2 sm:px-4 flex gap-1 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shrink-0">
                {TABS.map(t => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${active ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'}`}>
                            <Icon className="w-4 h-4" /> {t.label}
                        </button>
                    );
                })}
            </nav>

            <main className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>
                ) : !status?.entitled ? (
                    <Gate icon={Lock} title="Social Marketing is a premium add-on"
                        text="Manage your Facebook Page — publish posts, moderate comments and track engagement, all from SalePilot."
                        action={<button className={btnPrimary} onClick={onUpgrade}><Sparkles className="w-4 h-4" /> Unlock Marketing</button>} />
                ) : !status?.configured ? (
                    <Gate icon={Plug} title="Facebook isn't set up on the server"
                        text="Ask your admin to add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to the backend, then reconnect here." />
                ) : tab === 'posters' ? (
                    <div className="h-full"><MarketingPage /></div>
                ) : tab === 'connect' ? (
                    <ConnectTab status={status} onChanged={loadStatus} showSnackbar={showSnackbar} />
                ) : !connected ? (
                    <Gate icon={Facebook} title="Connect your Facebook Page"
                        text="Link a Page you manage to start publishing posts, replying to comments and viewing insights."
                        action={<button className={btnPrimary} onClick={() => setTab('connect')}><Plug className="w-4 h-4" /> Go to Connect</button>} />
                ) : tab === 'compose' ? (
                    <ComposeTab showSnackbar={showSnackbar} onPosted={() => setTab('comments')} />
                ) : tab === 'comments' ? (
                    <CommentsTab showSnackbar={showSnackbar} />
                ) : (
                    <InsightsTab showSnackbar={showSnackbar} />
                )}
            </main>
        </div>
    );
};

// ── Generic gate/empty ────────────────────────────────────────────────────────
const Gate: React.FC<{ icon: React.ElementType; title: string; text: string; action?: React.ReactNode }> = ({ icon: Icon, title, text, action }) => (
    <div className="h-full flex items-center justify-center p-6">
        <div className={`${card} p-8 max-w-md text-center`}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400"><Icon className="w-7 h-7" /></div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">{text}</p>
            {action}
        </div>
    </div>
);

// ── Connect tab ───────────────────────────────────────────────────────────────
const ConnectTab: React.FC<{ status: FacebookStatus; onChanged: () => void; showSnackbar: (m: string, t: 'success' | 'error' | 'info') => void }> = ({ status, onChanged, showSnackbar }) => {
    const [busy, setBusy] = useState(false);
    const [pages, setPages] = useState<FacebookPageRef[] | null>(null);

    const startLogin = async () => {
        setBusy(true); setPages(null);
        try {
            await loadFacebookSdk(status.appId);
            const token = await facebookLogin();
            const res = await facebookService.connect(token);
            if ((res as any).connected) { showSnackbar('Facebook Page connected.', 'success'); onChanged(); }
            else if ((res as any).pages?.length) { setPages((res as any).pages); }
            else showSnackbar('No Pages were returned. Make sure you granted Page access.', 'error');
        } catch (e: any) {
            showSnackbar(e?.message || 'Could not connect Facebook.', 'error');
        } finally { setBusy(false); }
    };

    const pick = async (pageId: string) => {
        setBusy(true);
        try { await facebookService.selectPage(pageId); showSnackbar('Page connected.', 'success'); setPages(null); onChanged(); }
        catch (e: any) { showSnackbar(e?.message || 'Could not select the Page.', 'error'); }
        finally { setBusy(false); }
    };

    const disconnect = async () => {
        setBusy(true);
        try { await facebookService.disconnect(); showSnackbar('Disconnected.', 'info'); onChanged(); }
        catch (e: any) { showSnackbar(e?.message || 'Failed to disconnect.', 'error'); }
        finally { setBusy(false); }
    };

    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            <div className={`${card} p-6`}>
                {status.connected ? (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{status.pageName}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Page connected and ready.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className={btnGhost} onClick={startLogin} disabled={busy}><RefreshCw className="w-4 h-4" /> Reconnect / switch Page</button>
                            <button className={`${btn} bg-red-50 dark:bg-red-900/20 text-red-600`} onClick={disconnect} disabled={busy}><X className="w-4 h-4" /> Disconnect</button>
                        </div>
                    </>
                ) : pages ? (
                    <>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Choose a Page</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Pick the Page you want to manage with SalePilot.</p>
                        <div className="space-y-2">
                            {pages.map(p => (
                                <button key={p.id} onClick={() => pick(p.id)} disabled={busy}
                                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left">
                                    <span className="flex items-center gap-3 min-w-0"><Facebook className="w-5 h-5 text-blue-600 shrink-0" /><span className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</span></span>
                                    <span className="text-xs font-bold text-blue-600">Select</span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-600 rounded-lg text-white"><Facebook className="w-5 h-5" /></div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">Connect a Facebook Page</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">You'll log in with Facebook and grant access to a Page you manage.</p>
                            </div>
                        </div>
                        <button className={btnPrimary} onClick={startLogin} disabled={busy}>
                            <Facebook className="w-4 h-4" /> {busy ? 'Connecting…' : 'Continue with Facebook'}
                        </button>
                        <p className="mt-4 text-xs text-gray-400 dark:text-slate-500">
                            Tip: while your Meta app is in development mode, only Page admins/testers can connect. Going Live needs Meta App Review.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

// ── Compose tab ───────────────────────────────────────────────────────────────
const ComposeTab: React.FC<{ showSnackbar: (m: string, t: 'success' | 'error' | 'info') => void; onPosted: () => void }> = ({ showSnackbar, onPosted }) => {
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [busy, setBusy] = useState(false);

    const publish = async () => {
        if (!message.trim() && !imageUrl.trim()) { showSnackbar('Add a message or an image URL.', 'error'); return; }
        setBusy(true);
        try {
            const res = await facebookService.publish({ message: message.trim(), link: link.trim() || undefined, imageUrl: imageUrl.trim() || undefined });
            if ((res as any).success) { showSnackbar('Published to your Page.', 'success'); setMessage(''); setLink(''); setImageUrl(''); onPosted(); }
            else showSnackbar((res as any).message || 'Publish failed.', 'error');
        } catch (e: any) { showSnackbar(e?.message || 'Publish failed.', 'error'); }
        finally { setBusy(false); }
    };

    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            <div className={`${card} p-6 space-y-4`}>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">Post text</label>
                    <textarea className={`${input} min-h-[140px] resize-y`} value={message} onChange={e => setMessage(e.target.value)} placeholder="What's new at your shop?" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5"><Link2 className="w-3 h-3 inline mr-1" />Link (optional)</label>
                    <input className={input} value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5"><ImageIcon className="w-3 h-3 inline mr-1" />Image URL (optional)</label>
                    <input className={input} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Public image URL — posts as a photo" />
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Generate one in the Posters tab, upload it somewhere public, then paste the link.</p>
                </div>
                {imageUrl.trim() && <img src={imageUrl} alt="" className="rounded-xl max-h-60 object-cover border border-gray-200 dark:border-slate-700" onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />}
                <button className={`${btnPrimary} w-full py-3`} onClick={publish} disabled={busy}><Send className="w-4 h-4" /> {busy ? 'Publishing…' : 'Publish to Facebook'}</button>
            </div>
        </div>
    );
};

// ── Comments tab ──────────────────────────────────────────────────────────────
const CommentsTab: React.FC<{ showSnackbar: (m: string, t: 'success' | 'error' | 'info') => void }> = ({ showSnackbar }) => {
    const [posts, setPosts] = useState<FacebookPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [activePost, setActivePost] = useState<string | null>(null);
    const [comments, setComments] = useState<FacebookComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [replyFor, setReplyFor] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        facebookService.getPosts()
            .then(p => { setPosts(p || []); if (p?.length) setActivePost(p[0].id); })
            .catch(e => showSnackbar(e?.message || 'Failed to load posts.', 'error'))
            .finally(() => setLoadingPosts(false));
    }, []);

    const loadComments = useCallback((postId: string) => {
        setLoadingComments(true);
        facebookService.getComments(postId)
            .then(c => setComments(c || []))
            .catch(e => showSnackbar(e?.message || 'Failed to load comments.', 'error'))
            .finally(() => setLoadingComments(false));
    }, []);

    useEffect(() => { if (activePost) loadComments(activePost); }, [activePost, loadComments]);

    const reply = async (commentId: string) => {
        if (!replyText.trim()) return;
        try { await facebookService.replyComment(commentId, replyText.trim()); showSnackbar('Reply posted.', 'success'); setReplyFor(null); setReplyText(''); activePost && loadComments(activePost); }
        catch (e: any) { showSnackbar(e?.message || 'Reply failed.', 'error'); }
    };
    const toggleHide = async (c: FacebookComment) => {
        try { await facebookService.hideComment(c.id, !c.is_hidden); activePost && loadComments(activePost); }
        catch (e: any) { showSnackbar(e?.message || 'Could not update comment.', 'error'); }
    };
    const remove = async (commentId: string) => {
        try { await facebookService.deleteComment(commentId); showSnackbar('Comment deleted.', 'info'); activePost && loadComments(activePost); }
        catch (e: any) { showSnackbar(e?.message || 'Delete failed.', 'error'); }
    };

    if (loadingPosts) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;
    if (posts.length === 0) return <Gate icon={MessageCircle} title="No posts yet" text="Publish a post from the Compose tab, then come back to manage its comments." />;

    return (
        <div className="flex flex-col md:flex-row h-full">
            {/* Posts list */}
            <aside className="md:w-72 md:border-r border-gray-200 dark:border-slate-800 overflow-y-auto bg-white dark:bg-slate-900 shrink-0 max-h-48 md:max-h-none">
                {posts.map(p => (
                    <button key={p.id} onClick={() => setActivePost(p.id)}
                        className={`w-full text-left p-3 border-b border-gray-100 dark:border-slate-800 ${activePost === p.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                        <p className="text-sm text-gray-800 dark:text-slate-200 line-clamp-2">{p.message || p.story || '(no text)'}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(p.created_time).toLocaleDateString()} · {p.comments?.summary?.total_count ?? 0} comments</p>
                    </button>
                ))}
            </aside>

            {/* Comments */}
            <section className="flex-1 overflow-y-auto p-4">
                {loadingComments ? <LoadingSpinner /> : comments.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-12">No comments on this post yet.</p>
                ) : (
                    <div className="space-y-3 max-w-2xl mx-auto">
                        {comments.map(c => (
                            <div key={c.id} className={`${card} p-4 ${c.is_hidden ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{c.from?.name || 'Visitor'} {c.is_hidden && <span className="text-xs font-normal text-gray-400">(hidden)</span>}</p>
                                        <p className="text-sm text-gray-700 dark:text-slate-300 mt-0.5 break-words">{c.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(c.created_time).toLocaleString()} · {c.like_count ?? 0} likes</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button title={c.is_hidden ? 'Unhide' : 'Hide'} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500" onClick={() => toggleHide(c)}>{c.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                                        <button title="Delete" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                {replyFor === c.id ? (
                                    <div className="flex gap-2 mt-3">
                                        <input autoFocus className={input} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply…" onKeyDown={e => e.key === 'Enter' && reply(c.id)} />
                                        <button className={btnPrimary} onClick={() => reply(c.id)}>Send</button>
                                    </div>
                                ) : (
                                    <button className="mt-2 text-xs font-bold text-blue-600 hover:underline" onClick={() => { setReplyFor(c.id); setReplyText(''); }}>Reply</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

// ── Insights tab ──────────────────────────────────────────────────────────────
const METRIC_LABELS: Record<string, string> = {
    page_impressions: 'Impressions (28d)',
    page_post_engagements: 'Post engagements (28d)',
    page_fans: 'Total Page likes',
    page_views_total: 'Page views (28d)',
};

const InsightsTab: React.FC<{ showSnackbar: (m: string, t: 'success' | 'error' | 'info') => void }> = ({ showSnackbar }) => {
    const [data, setData] = useState<any[] | null>(null);

    useEffect(() => {
        facebookService.getInsights()
            .then(d => setData(d || []))
            .catch(e => { showSnackbar(e?.message || 'Failed to load insights.', 'error'); setData([]); });
    }, []);

    const metrics = useMemo(() => (data || []).map(m => {
        const values = m.values || [];
        const latest = values.length ? values[values.length - 1].value : 0;
        return { name: m.name, label: METRIC_LABELS[m.name] || m.title || m.name, value: typeof latest === 'object' ? Object.values(latest).reduce((a: number, b: any) => a + Number(b || 0), 0) : Number(latest || 0) };
    }), [data]);

    if (data === null) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;
    if (metrics.length === 0) return <Gate icon={BarChart3} title="No insights yet" text="Facebook needs a little activity and time before it reports Page insights. Check back after you've posted and gained some engagement." />;

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {metrics.map(m => (
                    <div key={m.name} className={`${card} p-5`}>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">{m.label}</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{m.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketingApp;
