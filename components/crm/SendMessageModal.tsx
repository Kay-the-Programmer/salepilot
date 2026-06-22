import React, { useMemo, useRef, useState } from 'react';
import { Customer } from '../../types';
import { Icon, Avatar } from './CrmBits';
import { CustomerMetrics } from './crmModel';

interface SendMessageModalProps {
    customer: Customer;
    metrics?: CustomerMetrics;
    storeName?: string;
    smsConfigured?: boolean;
    smsSandbox?: boolean;
    onClose: () => void;
    onSent: (channel: 'sms' | 'email', body: string) => void;
}

type Channel = 'sms' | 'email';

const TEMPLATES: { id: string; label: string; body: (name: string, store: string) => string }[] = [
    { id: 'loyalty', label: 'Loyalty Reward', body: (n, s) => `Hi ${n}, as a valued member we've just added 500 bonus loyalty points to your account! Visit us soon to redeem. - ${s}` },
    { id: 'discount', label: 'Special Discount', body: (n, s) => `Special offer for you, ${n}! Use code PILOT20 for 20% off your next purchase this weekend. Hope to see you! - ${s}` },
    { id: 'checkin', label: 'Checking In', body: (n, s) => `Hi ${n}, we haven't seen you in a while! Just checking in to see if there's anything we can help you find. - ${s}` },
    { id: 'birthday', label: 'Birthday Gift', body: (n, s) => `Happy Birthday ${n}! 🎂 Stop by today for a free gift with any purchase. Wishing you the best! - ${s}` },
];

export const SendMessageModal: React.FC<SendMessageModalProps> = ({ customer, metrics, storeName = 'SalePilot Shop', smsConfigured = true, smsSandbox = false, onClose, onSent }) => {
    const firstName = useMemo(() => customer.name.trim().split(/\s+/)[0] || customer.name, [customer.name]);
    const initialChannel: Channel = customer.phone ? 'sms' : 'email';
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
    const over = channel === 'sms' && personalized.length > 160;
    const smsReady = channel === 'sms' && !!customer.phone && smsConfigured;
    const canSend = personalized.trim().length > 0 && (channel === 'sms' ? smsReady : !!customer.email);

    const destination = channel === 'sms' ? customer.phone : customer.email;

    // Contextual note under the channel selector.
    const channelNote: { tone: 'info' | 'warn'; text: string } | null = channel === 'sms'
        ? (!customer.phone ? { tone: 'warn', text: 'No phone number on file for this customer.' }
            : !smsConfigured ? { tone: 'warn', text: 'SMS isn\'t configured on the server yet. Ask your admin to add Africa\'s Talking credentials.' }
                : smsSandbox ? { tone: 'info', text: 'Sandbox mode — messages reach the Africa\'s Talking simulator, not real phones.' }
                    : { tone: 'info', text: 'Sent over SMS via your business line.' })
        : { tone: 'info', text: 'Email delivery isn\'t enabled yet — this composes the message only.' };

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
                                    <p className="crm-recip__meta">{destination || (channel === 'sms' ? 'No phone on file' : 'No email on file')}</p>
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
                        <div className="crm-channel">
                            <button type="button" className={channel === 'sms' ? 'is-active' : ''} onClick={() => setChannel('sms')}>
                                <Icon name="sms" size={20} fill={channel === 'sms' ? 1 : 0} /> SMS
                            </button>
                            <button type="button" className={channel === 'email' ? 'is-active' : ''} onClick={() => setChannel('email')}>
                                <Icon name="mail" size={20} fill={channel === 'email' ? 1 : 0} /> Email
                            </button>
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
                                <span className="crm-composer__cap">{channel === 'sms' ? 'Sent from your business line' : 'Sent from your store email'}</span>
                                {channel === 'sms' && (
                                    <span className={`crm-composer__count${over ? ' is-over' : ''}`}>{personalized.length} / 160</span>
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
                        Send Message <Icon name="send" size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendMessageModal;
