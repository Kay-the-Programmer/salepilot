import React, { useMemo, useRef, useState } from 'react';
import { Customer } from '../../types';
import { Icon, Avatar } from './CrmBits';
import { CustomerMetrics } from './crmModel';
import { previewSmsText, smsSegments } from '../../utils/smsSegments';

interface SendMessageModalProps {
    customer: Customer;
    metrics?: CustomerMetrics;
    storeName?: string;
    smsConfigured?: boolean;
    smsSandbox?: boolean;
    smsEntitled?: boolean;
    /** Store name the server prepends to every SMS (store_settings.sms_display_name). */
    smsDisplayName?: string | null;
    /** An approved sender id puts the name on the handset, so no prefix is added. */
    smsSenderId?: string | null;
    /** Server has Meta Cloud API credentials. */
    whatsappConfigured?: boolean;
    /** Store owner switched the WhatsApp integration on. */
    whatsappEnabled?: boolean;
    /** Store has the premium WhatsApp module unlocked. */
    whatsappEntitled?: boolean;
    /** Business number shown to customers, if known. */
    whatsappNumber?: string | null;
    onClose: () => void;
    onSent: (channel: Channel, body: string) => void;
}

export type Channel = 'whatsapp' | 'sms' | 'email';

const TEMPLATES: { id: string; label: string; body: (name: string, store: string) => string }[] = [
    { id: 'loyalty', label: 'Loyalty Reward', body: (n, s) => `Hi ${n}, as a valued member we've just added 500 bonus loyalty points to your account! Visit us soon to redeem. - ${s}` },
    { id: 'discount', label: 'Special Discount', body: (n, s) => `Special offer for you, ${n}! Use code PILOT20 for 20% off your next purchase this weekend. Hope to see you! - ${s}` },
    { id: 'checkin', label: 'Checking In', body: (n, s) => `Hi ${n}, we haven't seen you in a while! Just checking in to see if there's anything we can help you find. - ${s}` },
    { id: 'birthday', label: 'Birthday Gift', body: (n, s) => `Happy Birthday ${n}! 🎂 Stop by today for a free gift with any purchase. Wishing you the best! - ${s}` },
];

const CHANNELS: { id: Channel; label: string; icon: string }[] = [
    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
    { id: 'sms', label: 'SMS', icon: 'sms' },
    { id: 'email', label: 'Email', icon: 'mail' },
];

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
    customer, metrics, storeName = 'SalePilot Shop',
    smsConfigured = true, smsSandbox = false, smsEntitled = true, smsDisplayName, smsSenderId,
    whatsappConfigured = false, whatsappEnabled = false, whatsappEntitled = false, whatsappNumber,
    onClose, onSent,
}) => {
    const firstName = useMemo(() => customer.name.trim().split(/\s+/)[0] || customer.name, [customer.name]);

    const waReady = !!customer.phone && whatsappConfigured && whatsappEnabled && whatsappEntitled;
    const smsReadyChannel = !!customer.phone && smsConfigured && smsEntitled;
    // Prefer the richest channel the customer can actually receive on.
    const initialChannel: Channel = waReady ? 'whatsapp' : smsReadyChannel ? 'sms' : customer.phone ? 'whatsapp' : 'email';

    const [channel, setChannel] = useState<Channel>(initialChannel);
    const [body, setBody] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const applyTemplate = (id: string) => {
        const t = TEMPLATES.find(x => x.id === id);
        if (t) setBody(t.body(customer.name, storeName));
    };

    const insertName = () => {
        const el = textareaRef.current;
        if (!el) { setBody(b => b + '[Name]'); return; }
        const start = el.selectionStart ?? body.length;
        const end = el.selectionEnd ?? body.length;
        setBody(body.slice(0, start) + '[Name]' + body.slice(end));
        requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + 6; });
    };

    const personalized = body.replace(/\[Name\]/g, firstName);

    // What the recipient will actually get. The server prepends the store name
    // so a customer can tell who texted them — which costs characters, and they
    // are charged whether or not whoever is typing can see them. An approved
    // sender id puts the name on the handset instead, so no prefix is added.
    const smsText = channel === 'sms' && !smsSenderId ? previewSmsText(smsDisplayName, personalized) : personalized.trim();
    const smsCost = useMemo(() => smsSegments(smsText), [smsText]);
    const smsPrefix = smsText.length > personalized.trim().length
        ? smsText.slice(0, smsText.length - personalized.trim().length)
        : '';
    // "Over" means "about to cost another whole message", not "over 160": one
    // curly quote pasted from Word drops the allowance to 70.
    const over = channel === 'sms' && smsCost.segments > 1;

    const isReady = channel === 'whatsapp' ? waReady
        : channel === 'sms' ? smsReadyChannel
            : !!customer.email;
    const canSend = personalized.trim().length > 0 && isReady;

    const destination = channel === 'email' ? customer.email : customer.phone;

    // Contextual note under the channel selector.
    const channelNote: { tone: 'info' | 'warn'; text: string } | null = (() => {
        if (channel === 'whatsapp') {
            if (!customer.phone) return { tone: 'warn', text: 'No phone number on file for this customer.' };
            if (!whatsappEntitled) return { tone: 'warn', text: 'WhatsApp messaging is a premium add-on. Unlock it from Subscription to message customers here.' };
            if (!whatsappConfigured) return { tone: 'warn', text: 'WhatsApp isn\'t connected yet. Ask your admin to add Meta Cloud API credentials in WhatsApp Settings.' };
            if (!whatsappEnabled) return { tone: 'warn', text: 'WhatsApp is connected but switched off. Turn it on in WhatsApp Settings.' };
            return { tone: 'info', text: `Sent over WhatsApp Business${whatsappNumber ? ` from ${whatsappNumber}` : ''}. Free-form replies reach customers within 24h of their last message; outside that, only approved templates send.` };
        }
        if (channel === 'sms') {
            if (!customer.phone) return { tone: 'warn', text: 'No phone number on file for this customer.' };
            if (!smsEntitled) return { tone: 'warn', text: 'SMS messaging is a premium add-on. Unlock it from Subscription.' };
            if (!smsConfigured) return { tone: 'warn', text: 'SMS isn\'t configured on the server yet. Ask your admin to add Africa\'s Talking credentials.' };
            if (smsSandbox) return { tone: 'info', text: 'Sandbox mode — messages reach the Africa\'s Talking simulator, not real phones.' };
            if (smsSenderId) return { tone: 'info', text: `Customers see this arrive from "${smsSenderId}", so your name isn't added to the message.` };
            if (smsPrefix) return { tone: 'info', text: `Sent with "${smsPrefix.trim()}" in front of the message, so the customer knows it's from you. Those characters count towards the message.` };
            return { tone: 'warn', text: 'No store name is added to this message, so the customer may not know who sent it. Set one under Settings → Store details.' };
        }
        if (!customer.email) return { tone: 'warn', text: 'No email address on file for this customer.' };
        return { tone: 'info', text: 'Sent from your store\'s email address. Included in this customer\'s outreach history.' };
    })();

    return (
        <div className="crm-modal-backdrop" onClick={onClose}>
            <div className="crm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Send message">
                <div className="crm-modal__bar">
                    <button type="button" className="crm-iconbtn" aria-label="Close" onClick={onClose}><Icon name="arrow_back" /></button>
                    <h2 className="crm-modal__title">Send Message</h2>
                </div>

                <div className="crm-modal__body">
                    {/* Recipient */}
                    <div className="crm-field">
                        <span className="crm-field__label">Recipient</span>
                        <div className="crm-recip">
                            <div className="crm-recip__id">
                                <Avatar name={customer.name} size={48} />
                                <div>
                                    <p className="crm-recip__name">{customer.name}</p>
                                    <p className="crm-recip__meta">{destination || (channel === 'email' ? 'No email on file' : 'No phone on file')}</p>
                                </div>
                            </div>
                            {metrics && (metrics.tier.id === 'gold' || metrics.tier.id === 'platinum') && (
                                <span className="crm-badge crm-badge--gold"><Icon name="verified" size={14} fill={1} /> {metrics.tier.name}</span>
                            )}
                        </div>
                    </div>

                    {/* Channel */}
                    <div className="crm-field">
                        <span className="crm-field__label">Channel</span>
                        <div className="crm-channel crm-channel--3">
                            {CHANNELS.map(ch => (
                                <button
                                    key={ch.id}
                                    type="button"
                                    className={`${channel === ch.id ? 'is-active' : ''}${ch.id === 'whatsapp' ? ' crm-channel--wa' : ''}`}
                                    onClick={() => setChannel(ch.id)}
                                >
                                    <Icon name={ch.icon} size={20} fill={channel === ch.id ? 1 : 0} /> {ch.label}
                                </button>
                            ))}
                        </div>
                        {channelNote && (
                            <div className={`crm-channel-note crm-channel-note--${channelNote.tone}`}>
                                <Icon name={channelNote.tone === 'warn' ? 'warning' : 'info'} size={16} fill={1} />
                                <span>{channelNote.text}</span>
                            </div>
                        )}
                    </div>

                    {/* Templates */}
                    <div className="crm-field">
                        <span className="crm-field__label">Templates</span>
                        <div className="crm-templates">
                            {TEMPLATES.map(t => (
                                <button key={t.id} type="button" onClick={() => applyTemplate(t.id)}>{t.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Composer */}
                    <div className="crm-field">
                        <div className="crm-composer">
                            <div className="crm-composer__head">
                                <span className="crm-composer__cap">Message Body</span>
                                <button type="button" className="crm-link" onClick={insertName} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Icon name="add_circle" size={18} /> Personalize with [Name]
                                </button>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Type your message here..."
                            />
                            <div className="crm-composer__foot">
                                <span className="crm-composer__cap">
                                    {channel === 'whatsapp' ? 'Sent from your WhatsApp Business line'
                                        : channel === 'sms' ? (smsSenderId ? `Sent as "${smsSenderId}"` : smsPrefix ? `Sent as "${smsPrefix.trim()}"` : 'Sent from your business line')
                                            : 'Sent from your store email'}
                                </span>
                                {channel === 'sms' && (
                                    <span className={`crm-composer__count${over ? ' is-over' : ''}`} title={smsText || undefined}>
                                        {smsCost.remaining} left
                                        {smsCost.segments > 1 ? ` · ${smsCost.segments} messages` : ''}
                                        {smsCost.encoding === 'UCS-2' ? ' · unicode' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="crm-modal__foot">
                    <button
                        type="button"
                        className="crm-btn crm-btn--filled crm-btn--block"
                        disabled={!canSend}
                        style={{ opacity: canSend ? 1 : 0.5, cursor: canSend ? 'pointer' : 'not-allowed', padding: 14 }}
                        onClick={() => canSend && onSent(channel, personalized)}
                    >
                        Send {channel === 'whatsapp' ? 'on WhatsApp' : channel === 'sms' ? 'SMS' : 'Email'} <Icon name="send" size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendMessageModal;
