import React, { useEffect, useMemo, useState } from 'react';
import { Customer, StoreSettings } from '../../types';
import { smsService, SmsConfig } from '../../services/smsService';
import { XMarkIcon } from '../icons';

interface SendSmsModalProps {
    customer: Customer;
    storeSettings?: StoreSettings | null;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Compose and send an SMS to a customer via the backend (Africa's Talking).
 * Styled with the main app's semantic tokens to match the customer screens.
 */
const SendSmsModal: React.FC<SendSmsModalProps> = ({ customer, storeSettings, isOpen, onClose }) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
    const [smsInfo, setSmsInfo] = useState<SmsConfig | null>(null);

    const firstName = useMemo(() => customer.name.trim().split(/\s+/)[0] || customer.name, [customer.name]);
    const storeName = storeSettings?.name || 'our shop';

    const templates = useMemo(() => ([
        { label: 'Thank you', text: `Hi ${firstName}, thank you for shopping with ${storeName}! We appreciate your business.` },
        { label: 'Special offer', text: `Hi ${firstName}, enjoy 10% off your next purchase at ${storeName} this week. Show this SMS in store!` },
        { label: 'Order ready', text: `Hi ${firstName}, your order at ${storeName} is ready for collection. See you soon!` },
        { label: 'Payment reminder', text: `Hi ${firstName}, a friendly reminder about your outstanding balance at ${storeName}. Thank you!` },
    ]), [firstName, storeName]);

    useEffect(() => {
        if (!isOpen) return;
        setMessage('');
        setResult(null);
        setSmsInfo(null);
        smsService.getConfig().then(setSmsInfo).catch(() => setSmsInfo(null));
    }, [isOpen, customer.id]);

    if (!isOpen) return null;

    const configured = smsInfo?.configured ?? true; // optimistic until config resolves
    const sandbox = smsInfo?.sandbox ?? false;
    const trimmed = message.trim();
    const segments = Math.max(1, Math.ceil(message.length / 160));
    const canSend = !!customer.phone && trimmed.length > 0 && configured && !sending;

    const handleSend = async () => {
        if (!canSend || !customer.phone) return;
        setSending(true);
        setResult(null);
        try {
            const res = await smsService.send({ to: customer.phone, message: trimmed, customerId: customer.id });
            if ((res as any)?.offline) {
                setResult({ ok: false, text: 'You appear to be offline. Reconnect and try again.' });
            } else if (res.success) {
                setResult({ ok: true, text: `Sent to ${res.recipient || customer.phone}${res.cost ? ` · ${res.cost}` : ''}.` });
                setMessage('');
            } else {
                setResult({ ok: false, text: res.status || res.message || 'Message was not delivered.' });
            }
        } catch (err: any) {
            setResult({ ok: false, text: err?.message || 'Failed to send SMS.' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-lg max-h-[90vh] bg-surface rounded-3xl border border-brand-border shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="px-6 py-5 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 3v-3z" /></svg>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-brand-text truncate">Send SMS</h3>
                            <p className="text-sm text-brand-text-muted truncate">{customer.name} · {customer.phone || 'No phone on file'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-brand-text-muted hover:bg-surface-variant transition-colors active:scale-95">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {!customer.phone && (
                        <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-sm font-medium text-warning">
                            This customer has no phone number. Add one in their profile to send an SMS.
                        </div>
                    )}
                    {customer.phone && !configured && (
                        <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-sm font-medium text-warning">
                            SMS isn't configured on the server yet. Ask your admin to add Africa's Talking credentials.
                        </div>
                    )}
                    {customer.phone && configured && sandbox && (
                        <div className="p-3 rounded-xl bg-info/10 border border-info/20 text-sm font-medium text-info">
                            Sandbox mode — messages reach the Africa's Talking simulator, not real phones.
                        </div>
                    )}

                    {/* Templates */}
                    <div>
                        <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide mb-2">Quick templates</p>
                        <div className="flex flex-wrap gap-2">
                            {templates.map(t => (
                                <button
                                    key={t.label}
                                    type="button"
                                    onClick={() => setMessage(t.text)}
                                    className="px-3 py-1.5 rounded-full border border-brand-border bg-surface-variant text-sm font-medium text-brand-text hover:border-primary hover:text-primary transition-colors active:scale-95"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Composer */}
                    <div>
                        <label className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide mb-2 block">Message</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder={`Write a message to ${firstName}...`}
                            rows={5}
                            disabled={!customer.phone}
                            className="w-full p-4 bg-background border border-brand-border rounded-2xl text-brand-text placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none disabled:opacity-60"
                        />
                        <div className="flex justify-between mt-2 text-xs text-brand-text-muted">
                            <span>{segments} SMS · {message.length} chars</span>
                            <span>Sent via your business line</span>
                        </div>
                    </div>

                    {result && (
                        <div className={`p-3 rounded-xl text-sm font-medium border ${result.ok ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'}`}>
                            {result.ok ? '✓ ' : ''}{result.text}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-brand-text-muted hover:text-brand-text bg-surface border border-brand-border rounded-xl hover:bg-surface-variant transition-all active:scale-95"
                    >
                        {result?.ok ? 'Close' : 'Cancel'}
                    </button>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!canSend}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-surface text-sm font-semibold rounded-xl shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                        {sending ? (
                            <>
                                <span className="w-4 h-4 border-2 border-surface/40 border-t-surface rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                Send SMS
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendSmsModal;
