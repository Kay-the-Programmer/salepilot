import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMegaphone, HiOutlineInboxArrowDown, HiOutlineCheck, HiOutlineXMark, HiOutlineChevronDown } from 'react-icons/hi2';
import { shopService } from '../../../services/shop.service';
import { getCurrentUser } from '../../../services/authService';
import { formatCurrency } from '../../../utils/currency';

const K = { currency: { code: 'ZMW', symbol: 'K', position: 'before' } } as any;
const money = (v: any) => formatCurrency(Number(v) || 0, K);

const REQ_STATUS: Record<string, string> = {
    open: 'bg-amber-100 text-amber-800',
    matched: 'bg-sp-navy/10 text-sp-navy',
    completed: 'bg-success/15 text-success',
};

/**
 * RFQ ("request for quote"): buyers post what they need, suppliers with
 * matching stock get notified one at a time and quote; the buyer accepts or
 * declines each quote. Runs on the long-dormant marketplace_requests backend
 * (now fixed to actually advance matches).
 */
const RequestsRfqView: React.FC = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const hasStore = !!user?.currentStoreId;

    // Post-a-request form
    const [query, setQuery] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [posting, setPosting] = useState(false);
    const [postMsg, setPostMsg] = useState('');

    // My requests (buyer) + expanded offers
    const [myRequests, setMyRequests] = useState<any[] | null>(null);
    const [openRequest, setOpenRequest] = useState<string | null>(null);
    const [details, setDetails] = useState<Record<string, any>>({});
    const [responding, setResponding] = useState('');

    // Supplier inbox
    const [matches, setMatches] = useState<any[] | null>(null);
    const [quoting, setQuoting] = useState<string | null>(null);
    const [quotePrice, setQuotePrice] = useState('');

    const refresh = useCallback(() => {
        if (!user) return;
        shopService.getMyRequests().then(setMyRequests).catch(() => setMyRequests([]));
        if (hasStore) {
            shopService.getStoreMatches(user.currentStoreId!).then(setMatches).catch(() => setMatches([]));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { refresh(); }, [refresh]);

    const post = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setPosting(true);
        setPostMsg('');
        try {
            await shopService.createRequest({
                customerName: user?.name || 'Buyer',
                customerEmail: user?.email || undefined,
                customerPhone: (user as any)?.phone || undefined,
                query: query.trim(),
                targetPrice: Number(targetPrice) || 0,
            });
            setQuery('');
            setTargetPrice('');
            setPostMsg('Request posted — suppliers with matching stock are being notified.');
            refresh();
        } catch (err: any) {
            setPostMsg(err?.message || 'Could not post your request.');
        } finally { setPosting(false); }
    };

    const toggleDetails = async (id: string) => {
        if (openRequest === id) { setOpenRequest(null); return; }
        setOpenRequest(id);
        if (!details[id]) {
            try {
                const d = await shopService.getRequestDetails(id);
                setDetails(prev => ({ ...prev, [id]: d }));
            } catch { /* leave empty */ }
        }
    };

    const respond = async (requestId: string, offerId: string, action: 'accept' | 'decline') => {
        setResponding(offerId);
        try {
            await shopService.respondToOffer(offerId, action);
            const d = await shopService.getRequestDetails(requestId).catch(() => null);
            if (d) setDetails(prev => ({ ...prev, [requestId]: d }));
            refresh();
        } finally { setResponding(''); }
    };

    const sendQuote = async (requestId: string) => {
        const price = Number(quotePrice);
        if (!(price > 0)) return;
        setQuoting(requestId);
        try {
            await shopService.submitOffer({ requestId, sellerPrice: price });
            setQuotePrice('');
            refresh();
        } finally { setQuoting(null); }
    };

    if (!user) {
        return (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-sp-navy/5 flex items-center justify-center mx-auto mb-4">
                    <HiOutlineMegaphone className="w-8 h-8 text-sp-navy" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-brand-text mb-2">Request a quote</h1>
                <p className="text-brand-text-muted mb-8 max-w-md mx-auto">
                    Can't find what you need? Post a request and suppliers with matching stock will send you quotes. Sign in to get started.
                </p>
                <button onClick={() => navigate('/login')} className="inline-flex items-center h-12 px-7 rounded-lg bg-sp-navy text-white font-semibold text-sm hover:bg-sp-navy-light transition-colors active:scale-[0.98]">
                    Sign in
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
            {/* ── Post a request ── */}
            <section className="bg-surface border border-brand-border rounded-lg p-5 sm:p-6">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-brand-text mb-1">Request a quote</h1>
                <p className="text-sm text-brand-text-muted mb-4">Describe what you're sourcing — suppliers with matching stock get notified and quote you directly.</p>
                <form onSubmit={post} className="flex flex-col sm:flex-row gap-3">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="e.g. 50 crates of 500ml soft drinks"
                        maxLength={200}
                        className="flex-1 h-12 px-4 rounded-lg bg-surface border border-brand-border text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-sp-navy"
                    />
                    <input
                        value={targetPrice}
                        onChange={e => setTargetPrice(e.target.value)}
                        type="number" min="0" step="0.01"
                        placeholder="Target price (K)"
                        className="sm:w-44 h-12 px-4 rounded-lg bg-surface border border-brand-border text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-sp-navy"
                    />
                    <button
                        type="submit"
                        disabled={posting || !query.trim()}
                        className="h-12 px-6 rounded-lg bg-sp-amber text-white font-bold text-sm hover:brightness-95 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {posting ? 'Posting…' : 'Post request'}
                    </button>
                </form>
                {postMsg && <p className="mt-3 text-sm font-semibold text-brand-text" role="status">{postMsg}</p>}
            </section>

            {/* ── Supplier inbox ── */}
            {hasStore && (
                <section>
                    <h2 className="text-lg font-semibold tracking-tight text-brand-text mb-1 flex items-center gap-2">
                        <HiOutlineInboxArrowDown className="w-5 h-5 text-sp-navy" /> Quote requests for your store
                    </h2>
                    <p className="text-sm text-brand-text-muted mb-4">Buyers looking for things you stock. Send a price to make an offer.</p>
                    {matches === null ? (
                        <div className="h-24 rounded-lg border border-brand-border bg-surface animate-pulse" />
                    ) : matches.length === 0 ? (
                        <p className="text-sm text-brand-text-muted bg-surface border border-brand-border rounded-lg p-4">No open requests match your catalog right now.</p>
                    ) : (
                        <ul className="space-y-3">
                            {matches.map(m => (
                                <li key={m.id} className="bg-surface border border-brand-border rounded-lg p-4">
                                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                                        <p className="text-sm font-bold text-brand-text">“{m.query}”</p>
                                        <p className="text-xs text-brand-text-muted">
                                            {m.customerName || 'Buyer'} · target {money(m.targetPrice)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number" min="0.01" step="0.01"
                                            placeholder="Your price (K)"
                                            value={quoting === m.requestId ? quotePrice : quotePrice}
                                            onChange={e => setQuotePrice(e.target.value)}
                                            className="w-40 h-11 px-3.5 rounded-lg bg-surface border border-brand-border text-sm focus:outline-none focus:border-sp-navy"
                                        />
                                        <button
                                            onClick={() => sendQuote(m.requestId)}
                                            disabled={quoting === m.requestId || !(Number(quotePrice) > 0)}
                                            className="h-11 px-5 rounded-lg bg-sp-navy text-white text-sm font-semibold hover:bg-sp-navy-light transition-colors active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {quoting === m.requestId ? 'Sending…' : 'Send quote'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {/* ── My requests ── */}
            <section>
                <h2 className="text-lg font-semibold tracking-tight text-brand-text mb-4">My requests</h2>
                {myRequests === null ? (
                    <div className="space-y-3">{[0, 1].map(i => <div key={i} className="h-20 rounded-lg border border-brand-border bg-surface animate-pulse" />)}</div>
                ) : myRequests.length === 0 ? (
                    <p className="text-sm text-brand-text-muted bg-surface border border-brand-border rounded-lg p-4">Nothing yet — post your first request above.</p>
                ) : (
                    <ul className="space-y-3">
                        {myRequests.map(r => (
                            <li key={r.id} className="bg-surface border border-brand-border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleDetails(r.id)}
                                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-surface-variant/50 transition-colors"
                                    aria-expanded={openRequest === r.id}
                                >
                                    <span className="min-w-0">
                                        <span className="block text-sm font-bold text-brand-text truncate">“{r.query}”</span>
                                        <span className="block text-xs text-brand-text-muted mt-0.5">
                                            {new Date(r.createdAt).toLocaleDateString()} · target {money(r.targetPrice)} · {r.offerCount} offer{Number(r.offerCount) === 1 ? '' : 's'}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-2 flex-none">
                                        <span className={`inline-flex h-6 px-2.5 items-center rounded-full text-[11px] font-bold uppercase ${REQ_STATUS[r.status] || 'bg-surface-variant text-brand-text-muted'}`}>{r.status}</span>
                                        <HiOutlineChevronDown className={`w-4 h-4 text-brand-text-muted transition-transform ${openRequest === r.id ? 'rotate-180' : ''}`} />
                                    </span>
                                </button>
                                {openRequest === r.id && (
                                    <div className="border-t border-brand-border px-4 py-3.5">
                                        {!details[r.id] ? (
                                            <p className="text-sm text-brand-text-muted">Loading offers…</p>
                                        ) : (details[r.id].offers || []).length === 0 ? (
                                            <p className="text-sm text-brand-text-muted">No offers yet — matching suppliers have been notified.</p>
                                        ) : (
                                            <ul className="space-y-2.5">
                                                {details[r.id].offers.map((o: any) => (
                                                    <li key={o.id} className="flex items-center justify-between gap-3 flex-wrap">
                                                        <span className="min-w-0 text-sm">
                                                            <span className="font-bold text-brand-text">{o.storeName}</span>
                                                            <span className="text-brand-text-muted"> quotes </span>
                                                            <span className="font-bold text-sp-navy">{money(o.sellerPrice)}</span>
                                                            {o.status !== 'pending' && (
                                                                <span className={`ml-2 text-[11px] font-bold uppercase ${o.status === 'accepted' ? 'text-success' : 'text-brand-text-muted'}`}>{o.status}</span>
                                                            )}
                                                        </span>
                                                        {o.status === 'pending' && r.status !== 'completed' && (
                                                            <span className="flex gap-1.5 flex-none">
                                                                <button
                                                                    onClick={() => respond(r.id, o.id, 'accept')}
                                                                    disabled={responding === o.id}
                                                                    className="inline-flex items-center gap-1 h-9 px-3.5 rounded-lg bg-success text-white text-xs font-bold hover:brightness-95 transition-all active:scale-95 disabled:opacity-50"
                                                                >
                                                                    <HiOutlineCheck className="w-4 h-4" /> Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => respond(r.id, o.id, 'decline')}
                                                                    disabled={responding === o.id}
                                                                    className="inline-flex items-center gap-1 h-9 px-3.5 rounded-lg border border-brand-border text-brand-text-muted text-xs font-bold hover:text-danger hover:border-danger/40 transition-colors active:scale-95 disabled:opacity-50"
                                                                >
                                                                    <HiOutlineXMark className="w-4 h-4" /> Decline
                                                                </button>
                                                            </span>
                                                        )}
                                                        {o.status === 'accepted' && (o.storePhone || o.storeEmail) && (
                                                            <span className="text-xs text-brand-text-muted flex-none">Contact: {o.storePhone || o.storeEmail}</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default RequestsRfqView;
