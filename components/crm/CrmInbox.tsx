import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StoreSettings, WhatsAppConversation, WhatsAppMessage } from '../../types';
import { Icon, Avatar } from './CrmBits';
import { timeAgo, parseApiDate } from './crmModel';
import { whatsappService, WhatsAppStatus } from '../../services/whatsappService';

interface CrmInboxProps {
    status: WhatsAppStatus | null;
    statusLoading: boolean;
    storeSettings?: StoreSettings | null;
    onUpgrade: () => void;
    onNotify: (msg: string) => void;
    /** Rendered inside the WhatsApp hub — drop the page <main> wrapper + header. */
    embedded?: boolean;
    /** When provided (store admins), the "not connected" card offers a Connect shortcut. */
    onConnect?: () => void;
}

const clock = (iso?: string) => {
    const d = parseApiDate(iso);
    return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
};

/**
 * Two-way WhatsApp inbox living inside the CRM. Mirrors the support-desk
 * ChatWindow/ConversationList, but rebuilt on the CRM design system and wired to
 * the store-scoped {@link whatsappService}. Conversations poll every 10s; the
 * open thread every 4s, so inbound replies (delivered by the backend webhook)
 * surface without a manual refresh.
 */
export const CrmInbox: React.FC<CrmInboxProps> = ({ status, statusLoading, onUpgrade, onNotify, embedded, onConnect }) => {
    const ready = !!status?.entitled && !!status?.configured && !!status?.enabled;

    const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    // ── Conversation polling ──────────────────────────────────────────────────
    useEffect(() => {
        if (!ready) { setLoadingConvos(false); return; }
        let active = true;
        const load = async () => {
            try {
                const data = await whatsappService.getConversations();
                if (active) setConversations(Array.isArray(data) ? data : []);
            } catch {
                /* transient — keep last good list */
            } finally {
                if (active) setLoadingConvos(false);
            }
        };
        load();
        const t = setInterval(load, 10000);
        return () => { active = false; clearInterval(t); };
    }, [ready]);

    // ── Message polling for the open thread ───────────────────────────────────
    useEffect(() => {
        if (!ready || !selectedId) { setMessages([]); return; }
        let active = true;
        setLoadingMsgs(true);
        const load = async () => {
            try {
                const data = await whatsappService.getMessages(selectedId);
                if (active) setMessages(Array.isArray(data) ? data : []);
            } catch {
                /* transient */
            } finally {
                if (active) setLoadingMsgs(false);
            }
        };
        load();
        const t = setInterval(load, 4000);
        return () => { active = false; clearInterval(t); };
    }, [ready, selectedId]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const selected = useMemo(() => conversations.find(c => c.id === selectedId) || null, [conversations, selectedId]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter(c =>
            (c.customer_name?.toLowerCase().includes(q)) || c.customer_phone?.toLowerCase().includes(q));
    }, [conversations, search]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = draft.trim();
        if (!content || !selectedId || sending) return;
        setSending(true);
        // Optimistic echo so the reply appears instantly.
        const optimistic: WhatsAppMessage = {
            id: `temp-${Date.now()}`,
            conversation_id: selectedId,
            store_id: selected?.store_id || '',
            direction: 'outbound',
            message_type: 'text',
            content,
            status: 'sent',
            is_ai_generated: false,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setDraft('');
        try {
            await whatsappService.reply({ conversationId: selectedId, content });
            const data = await whatsappService.getMessages(selectedId);
            setMessages(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setDraft(content);
            onNotify(err?.message || 'Could not send the WhatsApp message.');
        } finally {
            setSending(false);
        }
    };

    // ── Gated / empty states ──────────────────────────────────────────────────
    let body: React.ReactNode;
    if (statusLoading && !status) {
        body = (
            <div className="crm-card crm-card--pad">
                <div className="crm-inbox__hint">Checking your WhatsApp connection…</div>
            </div>
        );
    } else if (!statusLoading && status && !status.entitled) {
        body = (
            <div className="crm-card crm-card--pad">
                <div className="crm-empty" style={{ padding: '48px 16px' }}>
                    <Icon name="lock" size={40} />
                    <p className="crm-empty__title">WhatsApp is a premium add-on</p>
                    <p className="crm-empty__text">Chat with customers on WhatsApp Business — receive their messages and reply right here in the CRM.</p>
                    <button type="button" className="crm-btn crm-btn--primary" onClick={onUpgrade} style={{ marginTop: 8 }}>
                        <Icon name="bolt" size={18} fill={1} /> Unlock WhatsApp
                    </button>
                </div>
            </div>
        );
    } else if (!statusLoading && status?.entitled && !status?.configured) {
        body = (
            <div className="crm-card crm-card--pad">
                <div className="crm-empty" style={{ padding: '48px 16px' }}>
                    <Icon name="link_off" size={40} />
                    <p className="crm-empty__title">WhatsApp isn't connected yet</p>
                    <p className="crm-empty__text">
                        {onConnect
                            ? 'Add your Meta Cloud API credentials to start receiving and replying to customer chats here.'
                            : 'Ask a store admin to add the Meta Cloud API credentials, then your conversations will appear here.'}
                    </p>
                    {onConnect && (
                        <button type="button" className="crm-btn crm-btn--primary" onClick={onConnect} style={{ marginTop: 8 }}>
                            <Icon name="link" size={18} /> Connect WhatsApp
                        </button>
                    )}
                </div>
            </div>
        );
    } else {
        body = (
            <div className={`crm-inbox${selectedId ? ' crm-inbox--chatting' : ''}`}>
                {/* Conversation list */}
                <aside className="crm-inbox__list">
                    <div className="crm-inbox__search">
                        <Icon name="search" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search chats"
                            aria-label="Search conversations"
                        />
                    </div>
                    <div className="crm-inbox__convos">
                        {loadingConvos ? (
                            <div className="crm-inbox__hint">Loading conversations…</div>
                        ) : filtered.length === 0 ? (
                            <div className="crm-inbox__hint">
                                {search ? 'No chats match your search.' : 'No conversations yet. Messages from customers will show up here.'}
                            </div>
                        ) : filtered.map(c => (
                            <button
                                key={c.id}
                                type="button"
                                className={`crm-inbox__convo${selectedId === c.id ? ' is-active' : ''}`}
                                onClick={() => setSelectedId(c.id)}
                            >
                                <Avatar name={c.customer_name || c.customer_phone} size={44} />
                                <span className="crm-inbox__convo-main">
                                    <span className="crm-inbox__convo-top">
                                        <span className="crm-inbox__convo-name">{c.customer_name || c.customer_phone}</span>
                                        <span className="crm-inbox__convo-time">{clock(c.last_message_at)}</span>
                                    </span>
                                    <span className="crm-inbox__convo-sub">
                                        <span>{c.customer_phone}</span>
                                        {c.status === 'active' && <span className="crm-inbox__dot" aria-label="Active" />}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Chat thread */}
                <section className="crm-inbox__chat">
                    {!selected ? (
                        <div className="crm-inbox__placeholder">
                            <span className="crm-inbox__placeholder-icon"><Icon name="forum" size={32} fill={1} /></span>
                            <p>Select a conversation to start chatting</p>
                        </div>
                    ) : (
                        <>
                            <header className="crm-inbox__chat-head">
                                <button type="button" className="crm-iconbtn crm-inbox__back" aria-label="Back to chats" onClick={() => setSelectedId(null)}>
                                    <Icon name="arrow_back" />
                                </button>
                                <Avatar name={selected.customer_name || selected.customer_phone} size={40} />
                                <div className="crm-inbox__chat-id">
                                    <span className="crm-inbox__chat-name">{selected.customer_name || selected.customer_phone}</span>
                                    <span className="crm-inbox__chat-sub">
                                        {selected.customer_phone}
                                        {selected.last_message_at && ` · ${timeAgo(selected.last_message_at)}`}
                                    </span>
                                </div>
                                <span className="crm-inbox__chip"><Icon name="chat" size={14} fill={1} /> WhatsApp</span>
                            </header>

                            <div className="crm-inbox__thread">
                                {loadingMsgs && messages.length === 0 ? (
                                    <div className="crm-inbox__hint">Loading messages…</div>
                                ) : messages.length === 0 ? (
                                    <div className="crm-inbox__hint">No messages in this conversation yet.</div>
                                ) : messages.map(m => (
                                    <div key={m.id} className={`crm-bubble crm-bubble--${m.direction}`}>
                                        <p className="crm-bubble__text">{m.content}</p>
                                        <span className="crm-bubble__meta">
                                            {m.is_ai_generated && <><Icon name="auto_awesome" size={12} fill={1} /> AI · </>}
                                            {clock(m.created_at)}
                                            {m.direction === 'outbound' && (
                                                <Icon name={m.status === 'read' ? 'done_all' : m.status === 'failed' ? 'error' : 'check'} size={14} />
                                            )}
                                        </span>
                                    </div>
                                ))}
                                <div ref={endRef} />
                            </div>

                            <form className="crm-inbox__composer" onSubmit={handleSend}>
                                <input
                                    type="text"
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    placeholder="Type a reply…"
                                    aria-label="Reply"
                                    disabled={sending}
                                />
                                <button type="submit" className="crm-inbox__send" disabled={sending || !draft.trim()} aria-label="Send reply">
                                    <Icon name="send" size={20} fill={1} />
                                </button>
                            </form>
                        </>
                    )}
                </section>
            </div>
        );
    }

    // Embedded inside the WhatsApp hub: the hub owns the page chrome + header.
    if (embedded) return <>{body}</>;

    return (
        <main className="crm-main crm-section-fade">
            <InboxHead connected={status?.enabled} number={status?.displayPhoneNumber} />
            {body}
        </main>
    );
};

const InboxHead: React.FC<{ connected?: boolean; number?: string | null }> = ({ connected, number }) => (
    <div className="crm-pagehead">
        <div>
            <p className="crm-pagehead__eyebrow">WhatsApp Business</p>
            <h1 className="crm-pagehead__title">Inbox</h1>
            <p className="crm-pagehead__sub">
                {connected
                    ? `Chat with customers in real time${number ? ` · ${number}` : ''}.`
                    : 'Chat with customers on WhatsApp, right from the CRM.'}
            </p>
        </div>
    </div>
);

export default CrmInbox;
