import React, { useEffect, useState } from 'react';
import { Icon } from './CrmBits';
import { WhatsAppStatus } from '../../services/whatsappService';
import { whatsappCampaignService, WaCampaign, CreateCampaignInput } from '../../services/whatsappCampaignService';

interface CrmWhatsAppCampaignsProps {
    status: WhatsAppStatus | null;
    canManage: boolean;
    confirm: (o: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
    onNotify: (msg: string) => void;
}

const SEGMENTS: { id: string; label: string }[] = [
    { id: 'all', label: 'All customers (with phone)' },
    { id: 'inactive', label: 'Inactive customers' },
    { id: 'new', label: 'New customers' },
    { id: 'vip', label: 'VIP spenders' },
];
const TRIGGERS: { id: 'welcome' | 'winback' | 'post_purchase'; label: string; hint: string }[] = [
    { id: 'welcome', label: 'Welcome new customers', hint: 'Greets customers added in the last N days.' },
    { id: 'winback', label: 'Win back inactive', hint: 'Nudges customers with no purchase in N days.' },
    { id: 'post_purchase', label: 'Post-purchase thank-you', hint: 'Thanks customers shortly after they buy.' },
];

const TYPE_LABEL: Record<WaCampaign['type'], string> = { one_off: 'One-off', recurring: 'Recurring', trigger: 'Automation' };
const STATUS_TONE: Record<string, string> = {
    active: 'ok', scheduled: 'ok', paused: 'due', completed: 'muted', cancelled: 'due', draft: 'muted',
};

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');

const blankForm = {
    name: '', type: 'one_off' as WaCampaign['type'],
    segment: 'all', days: 30, minSpend: 1000,
    messageMode: 'text' as 'text' | 'template', messageText: '',
    templateName: '', templateLang: 'en_US', templateParams: '',
    scheduledAt: '', recurrence: 'weekly' as 'daily' | 'weekly' | 'monthly',
    triggerEvent: 'winback' as 'welcome' | 'winback' | 'post_purchase', triggerDays: 30,
};

export const CrmWhatsAppCampaigns: React.FC<CrmWhatsAppCampaignsProps> = ({ status, canManage, confirm, onNotify }) => {
    const [campaigns, setCampaigns] = useState<WaCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState(blankForm);

    const ready = !!status?.entitled && !!status?.configured && !!status?.enabled;

    const load = () => {
        setLoading(true);
        whatsappCampaignService.list()
            .then(c => setCampaigns(Array.isArray(c) ? c : []))
            .catch(() => onNotify('Could not load campaigns.'))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

    const buildInput = (): CreateCampaignInput | null => {
        if (!form.name.trim()) { onNotify('Give the campaign a name.'); return null; }
        if (form.messageMode === 'text' && !form.messageText.trim()) { onNotify('Add a message.'); return null; }
        if (form.messageMode === 'template' && !form.templateName.trim()) { onNotify('Enter the approved template name.'); return null; }

        const input: CreateCampaignInput = {
            name: form.name.trim(),
            type: form.type,
            messageMode: form.messageMode,
            messageText: form.messageMode === 'text' ? form.messageText.trim() : undefined,
            templateName: form.messageMode === 'template' ? form.templateName.trim() : undefined,
            templateLang: form.templateLang,
            templateParams: form.messageMode === 'template' && form.templateParams.trim()
                ? form.templateParams.split('|').map(s => s.trim()).filter(Boolean) : undefined,
        };
        if (form.type === 'trigger') {
            input.triggerEvent = form.triggerEvent;
            input.triggerParams = { days: form.triggerDays };
        } else {
            input.segment = form.segment;
            input.segmentParams = form.segment === 'vip' ? { minSpend: form.minSpend }
                : (form.segment === 'inactive' || form.segment === 'new') ? { days: form.days } : undefined;
            if (form.type === 'one_off') input.scheduledAt = form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null;
            if (form.type === 'recurring') { input.recurrence = form.recurrence; input.scheduledAt = form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null; }
        }
        return input;
    };

    const create = async () => {
        const input = buildInput();
        if (!input) return;
        setBusy(true);
        try {
            await whatsappCampaignService.create(input);
            onNotify('Campaign created.');
            setForm(blankForm); setShowForm(false); load();
        } catch (e: any) { onNotify(e?.message || 'Failed to create campaign.'); }
        finally { setBusy(false); }
    };

    const runNow = async (c: WaCampaign) => {
        const ok = await confirm({ title: `Send "${c.name}" now?`, message: 'This sends to everyone in the audience that qualifies right now.', confirmLabel: 'Send now' });
        if (!ok) return;
        try { const r: any = await whatsappCampaignService.run(c.id); onNotify(`Sent ${r.sent ?? 0}${r.failed ? `, ${r.failed} failed` : ''}.`); load(); }
        catch (e: any) { onNotify(e?.message || 'Failed to run campaign.'); }
    };
    const toggle = async (c: WaCampaign) => {
        const next = c.status === 'paused' ? (c.type === 'one_off' ? 'scheduled' : 'active') : 'paused';
        try { await whatsappCampaignService.setStatus(c.id, next as any); load(); }
        catch (e: any) { onNotify(e?.message || 'Failed to update campaign.'); }
    };
    const remove = async (c: WaCampaign) => {
        const ok = await confirm({ title: `Delete "${c.name}"?`, message: 'This removes the campaign permanently.', confirmLabel: 'Delete', danger: true });
        if (!ok) return;
        try { await whatsappCampaignService.remove(c.id); onNotify('Campaign deleted.'); load(); }
        catch (e: any) { onNotify(e?.message || 'Failed to delete campaign.'); }
    };

    const summary = (c: WaCampaign): string => {
        const audience = c.type === 'trigger'
            ? (TRIGGERS.find(t => t.id === c.trigger_event)?.label || 'Automation')
            : (SEGMENTS.find(s => s.id === c.segment)?.label || c.segment);
        const msg = c.message_mode === 'template' ? `Template: ${c.template_name}` : 'Text message';
        const when = c.type === 'recurring' ? `Every ${c.recurrence}${c.next_run_at ? ` · next ${fmt(c.next_run_at)}` : ''}`
            : c.type === 'trigger' ? 'Runs automatically'
                : c.scheduled_at ? `Scheduled ${fmt(c.scheduled_at)}` : 'On next run';
        return `${audience} · ${msg} · ${when}`;
    };

    return (
        <div className="crm-wa-camp">
            {!ready && (
                <div className="crm-channel-note crm-channel-note--warn" style={{ marginTop: 0 }}>
                    <Icon name="warning" size={16} fill={1} />
                    <span>Connect and enable WhatsApp first — campaigns won't send until then.</span>
                </div>
            )}

            <div className="crm-wa-camp__bar">
                <p className="crm-panel__sub" style={{ margin: 0 }}>
                    Automate marketing: schedule blasts, recurring offers and event triggers. Use <code>[Name]</code>/<code>[Store]</code> to personalize.
                </p>
                {canManage && (
                    <button type="button" className="crm-btn crm-btn--filled" onClick={() => setShowForm(s => !s)}>
                        <Icon name={showForm ? 'close' : 'add'} size={18} /> {showForm ? 'Cancel' : 'New campaign'}
                    </button>
                )}
            </div>

            {showForm && canManage && (
                <div className="crm-card crm-card--pad crm-wa-camp__form">
                    <label className="crm-field">
                        <span className="crm-field__label">Campaign name</span>
                        <input className="crm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Weekend promo" />
                    </label>

                    <div className="crm-field">
                        <span className="crm-field__label">Type</span>
                        <div className="crm-channel crm-channel--3">
                            {(['one_off', 'recurring', 'trigger'] as const).map(t => (
                                <button key={t} type="button" className={form.type === t ? 'is-active' : ''} onClick={() => set('type', t)}>
                                    {TYPE_LABEL[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Audience */}
                    {form.type === 'trigger' ? (
                        <>
                            <label className="crm-field">
                                <span className="crm-field__label">Trigger</span>
                                <select className="crm-input" value={form.triggerEvent} onChange={e => set('triggerEvent', e.target.value as any)}>
                                    {TRIGGERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                                <span className="crm-wa-hint">{TRIGGERS.find(t => t.id === form.triggerEvent)?.hint}</span>
                            </label>
                            <label className="crm-field">
                                <span className="crm-field__label">Days threshold</span>
                                <input className="crm-input" type="number" min={1} value={form.triggerDays} onChange={e => set('triggerDays', Number(e.target.value))} />
                            </label>
                        </>
                    ) : (
                        <>
                            <label className="crm-field">
                                <span className="crm-field__label">Audience</span>
                                <select className="crm-input" value={form.segment} onChange={e => set('segment', e.target.value)}>
                                    {SEGMENTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                            </label>
                            {(form.segment === 'inactive' || form.segment === 'new') && (
                                <label className="crm-field">
                                    <span className="crm-field__label">{form.segment === 'inactive' ? 'No purchase in (days)' : 'Joined within (days)'}</span>
                                    <input className="crm-input" type="number" min={1} value={form.days} onChange={e => set('days', Number(e.target.value))} />
                                </label>
                            )}
                            {form.segment === 'vip' && (
                                <label className="crm-field">
                                    <span className="crm-field__label">Minimum lifetime spend</span>
                                    <input className="crm-input" type="number" min={0} value={form.minSpend} onChange={e => set('minSpend', Number(e.target.value))} />
                                </label>
                            )}
                        </>
                    )}

                    {/* Message */}
                    <div className="crm-field">
                        <span className="crm-field__label">Message</span>
                        <div className="crm-channel">
                            <button type="button" className={form.messageMode === 'text' ? 'is-active' : ''} onClick={() => set('messageMode', 'text')}>Text</button>
                            <button type="button" className={form.messageMode === 'template' ? 'is-active' : ''} onClick={() => set('messageMode', 'template')}>Template</button>
                        </div>
                    </div>
                    {form.messageMode === 'text' ? (
                        <>
                            <textarea className="crm-input" rows={3} value={form.messageText} onChange={e => set('messageText', e.target.value)} placeholder="Hi [Name], this weekend only…" />
                            <span className="crm-wa-hint">Free-form text only reaches customers active in the last 24h. For cold marketing use an approved template.</span>
                        </>
                    ) : (
                        <>
                            <div className="crm-wa-camp__grid">
                                <label className="crm-field">
                                    <span className="crm-field__label">Template name</span>
                                    <input className="crm-input" value={form.templateName} onChange={e => set('templateName', e.target.value)} placeholder="e.g. weekend_promo" />
                                </label>
                                <label className="crm-field">
                                    <span className="crm-field__label">Language</span>
                                    <input className="crm-input" value={form.templateLang} onChange={e => set('templateLang', e.target.value)} placeholder="en_US" />
                                </label>
                            </div>
                            <label className="crm-field">
                                <span className="crm-field__label">Body variables (optional)</span>
                                <input className="crm-input" value={form.templateParams} onChange={e => set('templateParams', e.target.value)} placeholder="[Name] | PROMO20 — separate with |" />
                                <span className="crm-wa-hint">Fills the template's {`{{1}}, {{2}}…`} in order. Must be a template approved in WhatsApp Manager.</span>
                            </label>
                        </>
                    )}

                    {/* Scheduling */}
                    {form.type === 'one_off' && (
                        <label className="crm-field">
                            <span className="crm-field__label">Send at (leave blank = next run)</span>
                            <input className="crm-input" type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
                        </label>
                    )}
                    {form.type === 'recurring' && (
                        <div className="crm-wa-camp__grid">
                            <label className="crm-field">
                                <span className="crm-field__label">Repeats</span>
                                <select className="crm-input" value={form.recurrence} onChange={e => set('recurrence', e.target.value as any)}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </label>
                            <label className="crm-field">
                                <span className="crm-field__label">Starts (optional)</span>
                                <input className="crm-input" type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
                            </label>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                        <button type="button" className="crm-btn crm-btn--ghost" onClick={() => { setShowForm(false); setForm(blankForm); }}>Cancel</button>
                        <button type="button" className="crm-btn crm-btn--primary" disabled={busy} onClick={create}>
                            <Icon name="check" size={18} /> {busy ? 'Saving…' : 'Create campaign'}
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="crm-inbox__hint">Loading campaigns…</div>
            ) : campaigns.length === 0 ? (
                <div className="crm-empty" style={{ padding: '48px 16px' }}>
                    <Icon name="campaign" size={40} />
                    <p className="crm-empty__title">No campaigns yet</p>
                    <p className="crm-empty__text">Create a scheduled blast, a recurring offer, or an automation that messages customers on events.</p>
                </div>
            ) : (
                <div className="crm-wa-camp__list">
                    {campaigns.map(c => (
                        <div key={c.id} className="crm-card crm-wa-camp__item">
                            <div className="crm-wa-camp__item-main">
                                <div className="crm-wa-camp__item-head">
                                    <span className="crm-wa-camp__name">{c.name}</span>
                                    <span className="crm-wa-camp__badge">{TYPE_LABEL[c.type]}</span>
                                    <span className={`crm-pill-status crm-pill-status--${STATUS_TONE[c.status] === 'ok' ? 'ok' : 'due'}`}>{c.status}</span>
                                </div>
                                <p className="crm-wa-camp__sum">{summary(c)}</p>
                                <p className="crm-wa-camp__meta">{c.sent_count} sent{c.last_run_at ? ` · last run ${fmt(c.last_run_at)}` : ''}</p>
                            </div>
                            {canManage && (
                                <div className="crm-wa-camp__actions">
                                    {c.status !== 'completed' && c.status !== 'cancelled' && (
                                        <button type="button" className="crm-iconbtn" title="Send now" onClick={() => runNow(c)}><Icon name="send" size={18} /></button>
                                    )}
                                    {(c.status === 'active' || c.status === 'scheduled' || c.status === 'paused') && (
                                        <button type="button" className="crm-iconbtn" title={c.status === 'paused' ? 'Resume' : 'Pause'} onClick={() => toggle(c)}>
                                            <Icon name={c.status === 'paused' ? 'play_arrow' : 'pause'} size={18} />
                                        </button>
                                    )}
                                    <button type="button" className="crm-iconbtn" title="Delete" onClick={() => remove(c)}><Icon name="delete" size={18} /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CrmWhatsAppCampaigns;
