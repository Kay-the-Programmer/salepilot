import React, { useEffect, useState } from 'react';
import { Icon } from './CrmBits';
import { whatsappService, WhatsAppStatus } from '../../services/whatsappService';
import { API_BASE_URL } from '../../services/api';

interface CrmWhatsAppConnectProps {
    status: WhatsAppStatus | null;
    canManage: boolean;
    onNotify: (msg: string) => void;
    /** Called after a successful save so the hub can re-fetch connection status. */
    onSaved?: () => void;
}

interface ConnectForm {
    phone_number_id: string;
    business_account_id: string;
    display_phone_number: string;
    access_token: string;
    webhook_verify_token: string;
    is_enabled: boolean;
}

const genToken = () => `sb_${Math.random().toString(36).slice(2, 11)}`;

const CALLBACK_URL = `${API_BASE_URL}/whatsapp/webhook`;

const copy = (value: string, onNotify: (m: string) => void) => {
    navigator.clipboard?.writeText(value).then(
        () => onNotify('Copied to clipboard.'),
        () => onNotify('Could not copy — select and copy manually.'),
    );
};

/**
 * In-CRM WhatsApp Cloud API connection. Lets a store admin paste their Meta
 * credentials (stored encrypted by the backend) and shows the webhook callback
 * URL + verify token to register in the Meta App dashboard. Mirrors the legacy
 * superadmin WhatsAppSettingsPage but store-scoped and in the CRM design system.
 */
export const CrmWhatsAppConnect: React.FC<CrmWhatsAppConnectProps> = ({ status, canManage, onNotify, onSaved }) => {
    const [form, setForm] = useState<ConnectForm>({
        phone_number_id: '', business_account_id: '', display_phone_number: '',
        access_token: '', webhook_verify_token: genToken(), is_enabled: true,
    });
    const [tokenSet, setTokenSet] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        whatsappService.getConfig()
            .then(cfg => {
                if (!active || !cfg) return;
                setForm({
                    phone_number_id: cfg.phone_number_id || '',
                    business_account_id: cfg.business_account_id || '',
                    display_phone_number: cfg.display_phone_number || '',
                    access_token: '',
                    webhook_verify_token: cfg.webhook_verify_token || genToken(),
                    is_enabled: cfg.is_enabled ?? true,
                });
                setTokenSet(!!cfg.access_token_set);
            })
            .catch(() => { /* no config yet — keep the generated verify token */ })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const set = <K extends keyof ConnectForm>(k: K, v: ConnectForm[K]) => setForm(f => ({ ...f, [k]: v }));

    const save = async () => {
        if (!canManage) return;
        if (!form.phone_number_id.trim()) { onNotify('Phone Number ID is required.'); return; }
        if (!tokenSet && !form.access_token.trim()) { onNotify('Access Token is required to connect.'); return; }
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                phone_number_id: form.phone_number_id.trim(),
                business_account_id: form.business_account_id.trim() || undefined,
                display_phone_number: form.display_phone_number.trim() || undefined,
                webhook_verify_token: form.webhook_verify_token.trim(),
                is_enabled: form.is_enabled,
            };
            if (form.access_token.trim()) payload.access_token = form.access_token.trim();
            await whatsappService.saveConfig(payload);
            if (form.access_token.trim()) setTokenSet(true);
            set('access_token', '');
            onNotify('WhatsApp connection saved.');
            onSaved?.();
        } catch (e: any) {
            onNotify(e?.message || 'Failed to save WhatsApp settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="crm-card crm-card--pad"><div className="crm-inbox__hint">Loading connection…</div></div>;
    }

    const ro = !canManage;

    return (
        <div className="crm-card crm-card--pad crm-wa-connect">
            {ro && (
                <div className="crm-channel-note crm-channel-note--warn" style={{ marginTop: 0 }}>
                    <Icon name="lock" size={16} fill={1} />
                    <span>Only store admins can change the WhatsApp connection. Ask an admin to connect it.</span>
                </div>
            )}

            {/* Enable + live state */}
            <div className="crm-wa-conn-row">
                <div>
                    <h3 className="crm-wa-conn-title">Connection</h3>
                    <p className="crm-wa-conn-sub">
                        {status?.configured
                            ? (status.enabled ? 'Connected and active.' : 'Connected — switch on to start messaging.')
                            : 'Not connected yet. Add your Meta Cloud API credentials below.'}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_enabled}
                    disabled={ro}
                    className={`crm-switch${form.is_enabled ? ' is-on' : ''}`}
                    onClick={() => set('is_enabled', !form.is_enabled)}
                >
                    <span className="crm-switch__dot" />
                </button>
            </div>

            {/* Credentials */}
            <div className="crm-wa-conn-grid">
                <label className="crm-field">
                    <span className="crm-field__label">Phone Number ID *</span>
                    <input className="crm-input" type="text" value={form.phone_number_id} disabled={ro}
                        onChange={e => set('phone_number_id', e.target.value)} placeholder="From WhatsApp → API setup" />
                </label>
                <label className="crm-field">
                    <span className="crm-field__label">Business Account ID (WABA)</span>
                    <input className="crm-input" type="text" value={form.business_account_id} disabled={ro}
                        onChange={e => set('business_account_id', e.target.value)} placeholder="Optional" />
                </label>
            </div>

            <label className="crm-field">
                <span className="crm-field__label">Display Phone Number</span>
                <input className="crm-input" type="text" value={form.display_phone_number} disabled={ro}
                    onChange={e => set('display_phone_number', e.target.value)} placeholder="+260 97 123 4567 — the number customers see" />
            </label>

            <label className="crm-field">
                <span className="crm-field__label">Access Token *</span>
                <input className="crm-input" type="password" value={form.access_token} disabled={ro}
                    onChange={e => set('access_token', e.target.value)}
                    placeholder={tokenSet ? '•••••••• (saved — type to replace)' : 'EAAG… permanent System User token'} />
                <span className="crm-wa-hint">Stored encrypted; never shown again. A permanent System User token is recommended.</span>
            </label>

            {/* Webhook */}
            <div className="crm-wa-webhook">
                <h4 className="crm-wa-conn-title" style={{ fontSize: 15 }}>Webhook</h4>
                <p className="crm-wa-conn-sub" style={{ marginBottom: 10 }}>
                    In your Meta App → WhatsApp → Configuration, set these, then subscribe to the <b>messages</b> field.
                </p>
                <div className="crm-wa-copyrow">
                    <span className="crm-wa-copyrow__label">Callback URL</span>
                    <code className="crm-wa-copyrow__val">{CALLBACK_URL}</code>
                    <button type="button" className="crm-iconbtn" aria-label="Copy callback URL" onClick={() => copy(CALLBACK_URL, onNotify)}><Icon name="content_copy" size={18} /></button>
                </div>
                <div className="crm-wa-copyrow">
                    <span className="crm-wa-copyrow__label">Verify Token</span>
                    <code className="crm-wa-copyrow__val">{form.webhook_verify_token}</code>
                    <button type="button" className="crm-iconbtn" aria-label="Copy verify token" onClick={() => copy(form.webhook_verify_token, onNotify)}><Icon name="content_copy" size={18} /></button>
                    {!ro && <button type="button" className="crm-iconbtn" aria-label="Regenerate verify token" title="Regenerate" onClick={() => set('webhook_verify_token', genToken())}><Icon name="refresh" size={18} /></button>}
                </div>
            </div>

            {!ro && (
                <div className="crm-wa-conn-foot">
                    <button type="button" className="crm-btn crm-btn--primary" disabled={saving} onClick={save}>
                        <Icon name="link" size={18} /> {saving ? 'Saving…' : 'Save connection'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CrmWhatsAppConnect;
