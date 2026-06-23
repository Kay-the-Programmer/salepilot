import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Customer, StoreSettings } from '../../types';
import { Icon, Avatar } from './CrmBits';
import { useConfirm } from '../ui/useConfirm';
import CrmInbox from './CrmInbox';
import CrmWhatsAppConnect from './CrmWhatsAppConnect';
import { whatsappService, WhatsAppStatus } from '../../services/whatsappService';
import whatsappTemplates, { WaTemplate, applyTemplate } from './whatsappTemplates';

interface CrmWhatsAppProps {
    status: WhatsAppStatus | null;
    statusLoading: boolean;
    customers: Customer[];
    storeSettings?: StoreSettings | null;
    storeName?: string;
    storeId?: string | null;
    canManage?: boolean;
    onUpgrade: () => void;
    onNotify: (msg: string) => void;
    /** Re-fetch the connection status (called after saving credentials). */
    onRefreshStatus?: () => void;
}

type WaTool = 'chats' | 'compose' | 'broadcast' | 'templates' | 'connect';

const TOOLS: { id: WaTool; label: string; icon: string }[] = [
    { id: 'chats', label: 'Chats', icon: 'forum' },
    { id: 'compose', label: 'Compose', icon: 'edit_note' },
    { id: 'broadcast', label: 'Broadcast', icon: 'campaign' },
    { id: 'templates', label: 'Templates', icon: 'description' },
    { id: 'connect', label: 'Connect', icon: 'settings' },
];

const firstName = (n: string) => n.trim().split(/\s+/)[0] || n;

/**
 * The CRM WhatsApp workspace: one nav tab bundling every messaging tool —
 * live two-way Chats (the inbox), 1:1 New Message, multi-recipient Broadcast,
 * and reusable Templates. All sends go through {@link whatsappService} (premium
 * gating + the 24h-window rules are enforced by the backend).
 */
export const CrmWhatsApp: React.FC<CrmWhatsAppProps> = ({
    status, statusLoading, customers, storeName, storeId, canManage = false, onUpgrade, onNotify, onRefreshStatus,
}) => {
    const [tool, setTool] = useState<WaTool>('chats');
    // Carries a template body from the Templates tool into the Compose tool.
    const [prefill, setPrefill] = useState<{ body: string; n: number } | null>(null);
    const { confirm, confirmDialog } = useConfirm();

    const ready = !!status?.entitled && !!status?.configured && !!status?.enabled;
    const phoneCustomers = useMemo(
        () => customers.filter(c => c.phone && c.phone.trim()).sort((a, b) => a.name.localeCompare(b.name)),
        [customers],
    );

    const goConnect = () => setTool('connect');

    // ── Why a tool can't send right now (null = good to go) ───────────────────
    const blockReason: { tone: 'info' | 'warn'; text: string; cta?: () => void; ctaLabel?: string } | null = (() => {
        if (statusLoading && !status) return { tone: 'info', text: 'Checking your WhatsApp connection…' };
        if (status && !status.entitled) return { tone: 'warn', text: 'WhatsApp messaging is a premium add-on. Unlock it to message customers.', cta: onUpgrade, ctaLabel: 'Unlock' };
        if (status?.entitled && !status?.configured) return canManage
            ? { tone: 'warn', text: 'WhatsApp isn\'t connected yet. Add your Meta Cloud API credentials to start messaging.', cta: goConnect, ctaLabel: 'Connect' }
            : { tone: 'warn', text: 'WhatsApp isn\'t connected yet. Ask a store admin to connect it.' };
        if (status?.configured && !status?.enabled) return canManage
            ? { tone: 'warn', text: 'WhatsApp is connected but switched off. Turn it on to start messaging.', cta: goConnect, ctaLabel: 'Settings' }
            : { tone: 'warn', text: 'WhatsApp is connected but switched off. Ask a store admin to turn it on.' };
        return null;
    })();

    return (
        <main className="crm-main crm-section-fade crm-wa">
            <div className="crm-pagehead crm-wa-head">
                <div className="crm-wa-head__text">
                    <p className="crm-pagehead__eyebrow">WhatsApp Business</p>
                    <h1 className="crm-pagehead__title">Messaging</h1>
                    <p className="crm-pagehead__sub">Chat, send and broadcast to your customers on WhatsApp{status?.displayPhoneNumber ? ` · ${status.displayPhoneNumber}` : ''}.</p>
                </div>
                <span className={`crm-wa-status crm-wa-status--${ready ? 'on' : status?.entitled === false ? 'lock' : 'off'}`}>
                    <Icon name={ready ? 'check_circle' : status?.entitled === false ? 'lock' : 'error'} size={16} fill={1} />
                    <span className="crm-wa-status__label">{ready ? 'Connected' : status?.entitled === false ? 'Premium' : 'Not connected'}</span>
                </span>
            </div>

            {/* Tool switcher — iOS-style segmented control */}
            <div className="crm-wa-tabs" role="tablist" aria-label="WhatsApp tools">
                {TOOLS.map(t => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tool === t.id}
                        className={`crm-wa-tab${tool === t.id ? ' is-active' : ''}`}
                        onClick={() => setTool(t.id)}
                    >
                        <Icon name={t.icon} size={20} fill={tool === t.id ? 1 : 0} />
                        <span className="crm-wa-tab__label">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Block banner (hidden on Chats — it shows its own state — and on Connect, which is where you fix it) */}
            {blockReason && tool !== 'chats' && tool !== 'connect' && (
                <div className={`crm-channel-note crm-channel-note--${blockReason.tone} crm-wa-banner`}>
                    <Icon name={blockReason.tone === 'warn' ? 'warning' : 'info'} size={16} fill={1} />
                    <span>{blockReason.text}</span>
                    {blockReason.cta && <button type="button" className="crm-link" onClick={blockReason.cta}>{blockReason.ctaLabel}</button>}
                </div>
            )}

            {tool === 'chats' && (
                <CrmInbox
                    status={status}
                    statusLoading={statusLoading}
                    onUpgrade={onUpgrade}
                    onNotify={onNotify}
                    onConnect={canManage ? goConnect : undefined}
                    embedded
                />
            )}

            {tool === 'compose' && (
                <ComposeTool
                    customers={phoneCustomers}
                    storeId={storeId}
                    storeName={storeName}
                    canSend={ready}
                    prefill={prefill}
                    onNotify={onNotify}
                />
            )}

            {tool === 'broadcast' && (
                <BroadcastTool
                    customers={phoneCustomers}
                    storeId={storeId}
                    storeName={storeName}
                    canSend={ready}
                    confirm={confirm}
                    onNotify={onNotify}
                />
            )}

            {tool === 'templates' && (
                <TemplatesTool
                    storeId={storeId}
                    confirm={confirm}
                    onUse={(t) => { setPrefill(p => ({ body: t.body, n: (p?.n || 0) + 1 })); setTool('compose'); }}
                    onNotify={onNotify}
                />
            )}

            {tool === 'connect' && (
                <CrmWhatsAppConnect
                    status={status}
                    canManage={canManage}
                    onNotify={onNotify}
                    onSaved={onRefreshStatus}
                />
            )}

            {confirmDialog}
        </main>
    );
};

// ── Shared composer (template chips + textarea + [Name] insert) ───────────────

const Composer: React.FC<{
    value: string;
    onChange: (v: string) => void;
    templates: WaTemplate[];
    placeholder?: string;
}> = ({ value, onChange, templates, placeholder }) => {
    const ref = useRef<HTMLTextAreaElement>(null);

    const insertToken = (token: string) => {
        const el = ref.current;
        if (!el) { onChange(value + token); return; }
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        onChange(value.slice(0, start) + token + value.slice(end));
        requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + token.length; });
    };

    return (
        <div>
            {templates.length > 0 && (
                <div className="crm-templates" style={{ marginBottom: 12 }}>
                    {templates.map(t => (
                        <button key={t.id} type="button" onClick={() => onChange(t.body)} title="Insert this template">{t.label}</button>
                    ))}
                </div>
            )}
            <div className="crm-composer">
                <div className="crm-composer__head">
                    <span className="crm-composer__cap">Message</span>
                    <button type="button" className="crm-link" onClick={() => insertToken('[Name]')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="add_circle" size={18} /> Personalize with [Name]
                    </button>
                </div>
                <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Type your message…'} />
                <div className="crm-composer__foot">
                    <span className="crm-composer__cap">[Name] and [Store] are filled in for each recipient.</span>
                </div>
            </div>
        </div>
    );
};

// ── New Message (1:1) ─────────────────────────────────────────────────────────

const ComposeTool: React.FC<{
    customers: Customer[];
    storeId?: string | null;
    storeName?: string;
    canSend: boolean;
    prefill?: { body: string; n: number } | null;
    onNotify: (m: string) => void;
}> = ({ customers, storeId, storeName, canSend, prefill, onNotify }) => {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const templates = useMemo(() => whatsappTemplates.list(storeId), [storeId]);

    // Seed the body when a template is sent over from the Templates tool.
    useEffect(() => { if (prefill?.body) setBody(prefill.body); }, [prefill?.n]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q ? customers.filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)) : customers;
    }, [customers, search]);

    const selected = customers.find(c => c.id === selectedId) || null;
    const preview = selected ? applyTemplate(body, { name: firstName(selected.name), store: storeName }) : body;

    const send = async () => {
        if (!selected || !selected.phone || !body.trim() || sending) return;
        setSending(true);
        try {
            const message = applyTemplate(body, { name: firstName(selected.name), store: storeName });
            const res = await whatsappService.send({ to: selected.phone, message, customerId: selected.id });
            if (res.success) { onNotify(`WhatsApp sent to ${selected.name}.`); setBody(''); }
            else onNotify(`Not delivered: ${res.status || res.message || 'failed'}.`);
        } catch (e: any) {
            onNotify(e?.message || 'Failed to send WhatsApp message.');
        } finally {
            setSending(false);
        }
    };

    if (customers.length === 0) {
        return <div className="crm-card crm-card--pad"><div className="crm-inbox__hint">No customers have a phone number on file yet. Add a phone to a customer to message them on WhatsApp.</div></div>;
    }

    return (
        <div className="crm-wa-compose">
            <div className="crm-wa-pickwrap">
                <div className="crm-inbox__search">
                    <Icon name="search" size={20} />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers" aria-label="Search customers" />
                </div>
                <div className="crm-wa-picker">
                    {filtered.length === 0 ? (
                        <div className="crm-inbox__hint">No customers match your search.</div>
                    ) : filtered.map(c => (
                        <button key={c.id} type="button" className={`crm-wa-pick${selectedId === c.id ? ' is-active' : ''}`} onClick={() => setSelectedId(c.id)}>
                            <Avatar name={c.name} size={40} />
                            <span className="crm-wa-pick__main">
                                <span className="crm-wa-pick__name">{c.name}</span>
                                <span className="crm-wa-pick__sub">{c.phone}</span>
                            </span>
                            {selectedId === c.id && <Icon name="check_circle" size={20} fill={1} />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="crm-wa-pane">
                <Composer value={body} onChange={setBody} templates={templates} />
                {selected && body.trim() && (
                    <div className="crm-wa-preview">
                        <span className="crm-wa-preview__cap">Preview to {selected.name}</span>
                        <p>{preview}</p>
                    </div>
                )}
                <button
                    type="button"
                    className="crm-btn crm-btn--filled crm-btn--block"
                    disabled={!selected || !body.trim() || !canSend || sending}
                    style={{ padding: 14, marginTop: 14, opacity: (!selected || !body.trim() || !canSend || sending) ? 0.5 : 1 }}
                    onClick={send}
                >
                    {sending ? 'Sending…' : selected ? `Send to ${selected.name}` : 'Select a customer'} <Icon name="send" size={20} />
                </button>
            </div>
        </div>
    );
};

// ── Broadcast (1:many) ────────────────────────────────────────────────────────

const BroadcastTool: React.FC<{
    customers: Customer[];
    storeId?: string | null;
    storeName?: string;
    canSend: boolean;
    confirm: (o: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
    onNotify: (m: string) => void;
}> = ({ customers, storeId, storeName, canSend, confirm, onNotify }) => {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [body, setBody] = useState('');
    const [progress, setProgress] = useState<{ done: number; sent: number; total: number } | null>(null);
    const templates = useMemo(() => whatsappTemplates.list(storeId), [storeId]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q ? customers.filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)) : customers;
    }, [customers, search]);

    const toggle = (id: string) => setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id));
    const toggleAll = () => setSelected(prev => {
        const next = new Set(prev);
        if (allSelected) filtered.forEach(c => next.delete(c.id));
        else filtered.forEach(c => next.add(c.id));
        return next;
    });

    const recipients = useMemo(() => customers.filter(c => selected.has(c.id)), [customers, selected]);

    const send = async () => {
        if (recipients.length === 0 || !body.trim()) return;
        const ok = await confirm({
            title: `Send to ${recipients.length} customer${recipients.length === 1 ? '' : 's'}?`,
            message: 'Each recipient gets a personalized copy on WhatsApp. WhatsApp only delivers free-form messages to customers who messaged you in the last 24 hours; others need an approved template.',
            confirmLabel: `Send ${recipients.length}`,
        });
        if (!ok) return;

        setProgress({ done: 0, sent: 0, total: recipients.length });
        let done = 0, sent = 0;
        for (const c of recipients) {
            try {
                const message = applyTemplate(body, { name: firstName(c.name), store: storeName });
                const res = await whatsappService.send({ to: c.phone!, message, customerId: c.id });
                if (res.success) sent++;
            } catch { /* counted as failed below */ }
            done++;
            setProgress({ done, sent, total: recipients.length });
        }
        const failed = done - sent;
        onNotify(`Broadcast complete — ${sent} sent${failed ? `, ${failed} failed` : ''}.`);
        setProgress(null);
        setSelected(new Set());
        setBody('');
    };

    if (customers.length === 0) {
        return <div className="crm-card crm-card--pad"><div className="crm-inbox__hint">No customers have a phone number on file yet.</div></div>;
    }

    return (
        <div className="crm-wa-compose">
            <div className="crm-wa-pickwrap">
                <div className="crm-inbox__search">
                    <Icon name="search" size={20} />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers" aria-label="Search customers" />
                </div>
                <div className="crm-wa-pickbar">
                    <button type="button" className="crm-link" onClick={toggleAll}>
                        {allSelected ? 'Clear' : 'Select all'}{filtered.length ? ` (${filtered.length})` : ''}
                    </button>
                    <span className="crm-wa-pickbar__count">{selected.size} selected</span>
                </div>
                <div className="crm-wa-picker">
                    {filtered.length === 0 ? (
                        <div className="crm-inbox__hint">No customers match your search.</div>
                    ) : filtered.map(c => {
                        const on = selected.has(c.id);
                        return (
                            <button key={c.id} type="button" className={`crm-wa-pick${on ? ' is-active' : ''}`} onClick={() => toggle(c.id)}>
                                <span className={`crm-wa-check${on ? ' is-on' : ''}`}>{on && <Icon name="check" size={14} fill={1} />}</span>
                                <Avatar name={c.name} size={36} />
                                <span className="crm-wa-pick__main">
                                    <span className="crm-wa-pick__name">{c.name}</span>
                                    <span className="crm-wa-pick__sub">{c.phone}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="crm-wa-pane">
                <Composer value={body} onChange={setBody} templates={templates} placeholder="Write your broadcast…" />
                {progress && (
                    <div className="crm-wa-progress">
                        <div className="crm-wa-progress__bar"><div className="crm-wa-progress__fill" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} /></div>
                        <span>Sending {progress.done} / {progress.total} · {progress.sent} delivered</span>
                    </div>
                )}
                <button
                    type="button"
                    className="crm-btn crm-btn--filled crm-btn--block"
                    disabled={recipients.length === 0 || !body.trim() || !canSend || !!progress}
                    style={{ padding: 14, marginTop: 14, opacity: (recipients.length === 0 || !body.trim() || !canSend || !!progress) ? 0.5 : 1 }}
                    onClick={send}
                >
                    {progress ? 'Sending…' : `Send to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`} <Icon name="campaign" size={20} fill={1} />
                </button>
            </div>
        </div>
    );
};

// ── Templates manager ─────────────────────────────────────────────────────────

const TemplatesTool: React.FC<{
    storeId?: string | null;
    confirm: (o: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
    onUse: (t: WaTemplate) => void;
    onNotify: (m: string) => void;
}> = ({ storeId, confirm, onUse, onNotify }) => {
    const [templates, setTemplates] = useState<WaTemplate[]>(() => whatsappTemplates.list(storeId));
    const [editing, setEditing] = useState<WaTemplate | null>(null);

    const startAdd = () => setEditing({ id: whatsappTemplates.newId(), label: '', body: '' });
    const startEdit = (t: WaTemplate) => setEditing({ ...t });

    const saveEditing = () => {
        if (!editing) return;
        if (!editing.label.trim() || !editing.body.trim()) { onNotify('Give the template a name and a message.'); return; }
        setTemplates(whatsappTemplates.save(storeId, { ...editing, label: editing.label.trim(), body: editing.body.trim() }));
        setEditing(null);
        onNotify('Template saved.');
    };

    const remove = async (t: WaTemplate) => {
        const ok = await confirm({ title: `Delete "${t.label}"?`, message: 'This removes the template for this store.', confirmLabel: 'Delete', danger: true });
        if (!ok) return;
        setTemplates(whatsappTemplates.remove(storeId, t.id));
        onNotify('Template deleted.');
    };

    return (
        <div>
            <div className="crm-wa-tplbar">
                <p className="crm-panel__sub" style={{ margin: 0 }}>Reusable messages. Use <code>[Name]</code> and <code>[Store]</code> to personalize.</p>
                <button type="button" className="crm-btn crm-btn--filled" onClick={startAdd}><Icon name="add" size={18} /> New template</button>
            </div>

            {editing && (
                <div className="crm-card crm-card--pad crm-wa-tpledit">
                    <div className="crm-field">
                        <span className="crm-field__label">Name</span>
                        <input className="crm-input" type="text" value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} placeholder="e.g. Order ready" />
                    </div>
                    <div className="crm-field">
                        <span className="crm-field__label">Message</span>
                        <textarea className="crm-input" rows={3} value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} placeholder="Hi [Name], …" />
                    </div>
                    <div className="crm-wa-tpledit__foot">
                        <button type="button" className="crm-btn crm-btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
                        <button type="button" className="crm-btn crm-btn--filled" onClick={saveEditing}><Icon name="check" size={18} /> Save</button>
                    </div>
                </div>
            )}

            <div className="crm-wa-tpls">
                {templates.map(t => (
                    <div key={t.id} className="crm-wa-tpl">
                        <div className="crm-wa-tpl__head">
                            <span className="crm-wa-tpl__name">{t.label}</span>
                            <div className="crm-wa-tpl__actions">
                                <button type="button" className="crm-iconbtn" aria-label="Use" title="Use in New Message" onClick={() => onUse(t)}><Icon name="send" size={18} /></button>
                                <button type="button" className="crm-iconbtn" aria-label="Edit" title="Edit" onClick={() => startEdit(t)}><Icon name="edit" size={18} /></button>
                                <button type="button" className="crm-iconbtn" aria-label="Delete" title="Delete" onClick={() => remove(t)}><Icon name="delete" size={18} /></button>
                            </div>
                        </div>
                        <p className="crm-wa-tpl__body">{t.body}</p>
                    </div>
                ))}
                {templates.length === 0 && <div className="crm-inbox__hint">No templates yet. Add one to reuse it when messaging.</div>}
            </div>
        </div>
    );
};

export default CrmWhatsApp;
