import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

/**
 * Super Admin — Automated Emails.
 *
 * Configure the transactional email engine: enable/disable each email, edit its
 * subject and HTML (with {{variable}} placeholders), tune numeric conditions,
 * preview with sample data, and send a test to yourself.
 */

interface TemplateVar { name: string; description: string; }
interface TemplateCondition { field: string; label: string; default: number; }
interface EmailTemplate {
    key: string;
    name: string;
    description: string;
    recipient: string;
    variables: TemplateVar[];
    sample: Record<string, string | number>;
    condition: TemplateCondition | null;
    subject: string;
    html: string;
    enabled: boolean;
    config: Record<string, any>;
    updatedAt: string | null;
    updatedBy: string | null;
}

const SuperAdminEmails: React.FC = () => {
    const { showToast } = useToast();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Editable draft for the selected template
    const [subject, setSubject] = useState('');
    const [html, setHtml] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [config, setConfig] = useState<Record<string, any>>({});
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const [previewHtml, setPreviewHtml] = useState('');
    const [previewSubject, setPreviewSubject] = useState('');

    // Track which field (subject / body) was last focused so a variable chip
    // inserts at the caret in the right place.
    const lastFocus = useRef<'subject' | 'html'>('html');
    const subjectRef = useRef<HTMLInputElement>(null);
    const htmlRef = useRef<HTMLTextAreaElement>(null);

    const selected = useMemo(() => templates.find(t => t.key === selectedKey) || null, [templates, selectedKey]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<{ templates: EmailTemplate[] }>('/superadmin/email-templates');
            setTemplates(res.templates || []);
            setSelectedKey(prev => prev || res.templates?.[0]?.key || null);
        } catch {
            showToast('Failed to load email templates', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { load(); }, [load]);

    // Load the selected template into the editable draft.
    useEffect(() => {
        if (!selected) return;
        setSubject(selected.subject);
        setHtml(selected.html);
        setEnabled(selected.enabled);
        setConfig(selected.config || {});
        setDirty(false);
    }, [selectedKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced server-side preview (accurate links + money formatting).
    useEffect(() => {
        if (!selectedKey) return;
        const t = setTimeout(async () => {
            try {
                const res = await api.post<{ subject: string; html: string }>(
                    `/superadmin/email-templates/${selectedKey}/preview`,
                    { subject, html },
                );
                setPreviewSubject(res.subject);
                setPreviewHtml(res.html);
            } catch { /* preview is best-effort */ }
        }, 400);
        return () => clearTimeout(t);
    }, [selectedKey, subject, html]);

    const markDirty = () => setDirty(true);

    const insertVar = (name: string) => {
        const token = `{{${name}}}`;
        if (lastFocus.current === 'subject' && subjectRef.current) {
            const el = subjectRef.current;
            const s = el.selectionStart ?? subject.length;
            const e = el.selectionEnd ?? subject.length;
            const next = subject.slice(0, s) + token + subject.slice(e);
            setSubject(next); markDirty();
            requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + token.length, s + token.length); });
        } else {
            const el = htmlRef.current;
            const s = el?.selectionStart ?? html.length;
            const e = el?.selectionEnd ?? html.length;
            const next = html.slice(0, s) + token + html.slice(e);
            setHtml(next); markDirty();
            if (el) requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + token.length, s + token.length); });
        }
    };

    const save = async () => {
        if (!selectedKey) return;
        setSaving(true);
        try {
            await api.put(`/superadmin/email-templates/${selectedKey}`, { subject, html, enabled, config });
            showToast('Email template saved', 'success');
            setDirty(false);
            setTemplates(prev => prev.map(t => t.key === selectedKey ? { ...t, subject, html, enabled, config } : t));
        } catch (e: any) {
            showToast(e?.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleEnabled = async (t: EmailTemplate) => {
        // Persist the on/off immediately from the list without a full save.
        try {
            await api.put(`/superadmin/email-templates/${t.key}`, { enabled: !t.enabled });
            setTemplates(prev => prev.map(x => x.key === t.key ? { ...x, enabled: !x.enabled } : x));
            if (t.key === selectedKey) setEnabled(!t.enabled);
            showToast(`${t.name} ${!t.enabled ? 'enabled' : 'disabled'}`, 'success');
        } catch {
            showToast('Failed to update', 'error');
        }
    };

    const sendTest = async () => {
        if (!selectedKey) return;
        setTesting(true);
        try {
            const res = await api.post<{ message: string }>(`/superadmin/email-templates/${selectedKey}/test`, { subject, html });
            showToast(res.message || 'Test sent', 'success');
        } catch (e: any) {
            showToast(e?.message || 'Failed to send test', 'error');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-brand-text-muted">Loading email templates…</div>;
    }

    return (
        <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold tracking-tight text-brand-text">Automated Emails</h1>
                <p className="text-sm text-brand-text-muted mt-1">
                    Design each automated email, choose when it sends, and preview it with sample data.
                    Placeholders like <code className="px-1 rounded bg-surface-variant">{'{{storeName}}'}</code> are filled in when the email is sent.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                {/* ── Template list ── */}
                <aside className="space-y-2">
                    {templates.map(t => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setSelectedKey(t.key)}
                            className={`w-full text-left p-3 rounded-xl border transition-colors ${
                                t.key === selectedKey
                                    ? 'border-primary bg-primary/5'
                                    : 'border-brand-border bg-surface hover:bg-surface-variant'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-sm text-brand-text truncate">{t.name}</span>
                                <span
                                    role="switch"
                                    aria-checked={t.enabled}
                                    onClick={(e) => { e.stopPropagation(); toggleEnabled(t); }}
                                    className={`shrink-0 w-9 h-5 rounded-full relative cursor-pointer transition-colors ${t.enabled ? 'bg-primary' : 'bg-surface-variant border border-brand-border'}`}
                                >
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${t.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                                </span>
                            </div>
                            <div className="text-[11px] text-brand-text-muted mt-1">To: {t.recipient}</div>
                        </button>
                    ))}
                </aside>

                {/* ── Editor + preview ── */}
                {selected && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-xl border border-brand-border bg-surface">
                            <div className="flex items-start justify-between gap-3 mb-1">
                                <div>
                                    <h2 className="font-bold text-brand-text">{selected.name}</h2>
                                    <p className="text-xs text-brand-text-muted mt-0.5">{selected.description}</p>
                                </div>
                                <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                                    <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wide">{enabled ? 'On' : 'Off'}</span>
                                    <span
                                        role="switch"
                                        aria-checked={enabled}
                                        onClick={() => { setEnabled(v => !v); markDirty(); }}
                                        className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? 'bg-primary' : 'bg-surface-variant border border-brand-border'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-1.5">Subject</label>
                            <input
                                ref={subjectRef}
                                type="text"
                                value={subject}
                                onFocus={() => { lastFocus.current = 'subject'; }}
                                onChange={(e) => { setSubject(e.target.value); markDirty(); }}
                                className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-surface text-sm text-brand-text focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>

                        {/* Condition (optional) */}
                        {selected.condition && (
                            <div>
                                <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-1.5">Condition</label>
                                <div className="flex items-center gap-2 text-sm text-brand-text">
                                    <span>{selected.condition.label}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={config[selected.condition.field] ?? selected.condition.default}
                                        onChange={(e) => { setConfig(c => ({ ...c, [selected.condition!.field]: Number(e.target.value) })); markDirty(); }}
                                        className="w-28 px-2 py-1.5 rounded-lg border border-brand-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Variables */}
                        <div>
                            <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-1.5">Insert a variable</label>
                            <div className="flex flex-wrap gap-1.5">
                                {selected.variables.map(v => (
                                    <button
                                        key={v.name}
                                        type="button"
                                        title={v.description}
                                        onClick={() => insertVar(v.name)}
                                        className="px-2 py-1 rounded-md border border-brand-border bg-surface-variant text-[11px] font-mono text-brand-text hover:border-primary hover:text-primary transition-colors"
                                    >
                                        {'{{'}{v.name}{'}}'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* HTML body */}
                        <div>
                            <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-1.5">Email body (HTML)</label>
                            <textarea
                                ref={htmlRef}
                                value={html}
                                onFocus={() => { lastFocus.current = 'html'; }}
                                onChange={(e) => { setHtml(e.target.value); markDirty(); }}
                                spellCheck={false}
                                className="w-full h-[280px] px-3 py-2.5 rounded-lg border border-brand-border bg-surface text-xs font-mono text-brand-text focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={save}
                                disabled={!dirty || saving}
                                className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
                            </button>
                            <button
                                type="button"
                                onClick={sendTest}
                                disabled={testing}
                                className="px-5 py-2.5 rounded-lg border border-brand-border bg-surface text-sm font-bold text-brand-text hover:bg-surface-variant transition-colors disabled:opacity-50"
                            >
                                {testing ? 'Sending…' : 'Send test to me'}
                            </button>
                            {selected.updatedAt && (
                                <span className="text-xs text-brand-text-muted">
                                    Last edited {new Date(selected.updatedAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {/* Live preview */}
                        <div>
                            <label className="block text-xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-1.5">Preview (sample data)</label>
                            <div className="rounded-xl border border-brand-border overflow-hidden bg-white">
                                <div className="px-4 py-2.5 border-b border-brand-border bg-surface-variant">
                                    <span className="text-[11px] text-brand-text-muted uppercase tracking-wide font-bold">Subject</span>
                                    <div className="text-sm font-semibold text-brand-text truncate">{previewSubject || '—'}</div>
                                </div>
                                <iframe
                                    title="Email preview"
                                    srcDoc={previewHtml}
                                    className="w-full h-[520px] bg-white"
                                    sandbox=""
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminEmails;
