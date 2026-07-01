import React, { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../ui/Modal';
import { INPUT_CLASS } from '../../utils/ui';
import { ChatBubbleLeftRightIcon, CheckCircleIcon } from '../icons';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'praise' | 'general';

interface TypeDef {
    id: FeedbackType;
    label: string;
    emoji: string;
    placeholder: string;
    suggestions: string[];
}

const TYPES: TypeDef[] = [
    {
        id: 'bug', label: 'Bug', emoji: '🐞',
        placeholder: 'What went wrong, and what were you doing when it happened?',
        suggestions: ['It crashed', "It's too slow", 'Numbers look wrong', "A button doesn't work"],
    },
    {
        id: 'feature', label: 'Idea', emoji: '✨',
        placeholder: 'What would you like SalePilot to do? How would it help you?',
        suggestions: ['On the POS', 'In reports', 'For inventory', 'For payments'],
    },
    {
        id: 'improvement', label: 'Improve', emoji: '📈',
        placeholder: 'What could work better? What slows you down?',
        suggestions: ['Make it faster', 'Fewer clicks', 'Clearer layout'],
    },
    {
        id: 'praise', label: 'Praise', emoji: '💚',
        placeholder: "What do you love about SalePilot? We'd love to hear it!",
        suggestions: ['Easy to use', 'Saves me time', 'Great support'],
    },
    {
        id: 'general', label: 'Other', emoji: '💬',
        placeholder: "Tell us what's on your mind…",
        suggestions: ['A question', 'An idea', 'Something else'],
    },
];

const MOODS: { v: number; emoji: string; label: string }[] = [
    { v: 1, emoji: '😠', label: 'Frustrated' },
    { v: 2, emoji: '🙁', label: 'Unhappy' },
    { v: 3, emoji: '😐', label: 'Okay' },
    { v: 4, emoji: '🙂', label: 'Good' },
    { v: 5, emoji: '😍', label: 'Love it' },
];

// Routes where the floating trigger should stay hidden: unauthenticated flows,
// the customer storefront, and the full-screen POS register.
const HIDDEN_PREFIXES = [
    '/login', '/register', '/forgot', '/reset', '/verify', '/store-setup',
    '/shop', '/track', '/privacy', '/terms',
];

const FeedbackWidget: React.FC = () => {
    const location = useLocation();
    const { showToast } = useToast();
    const user = getCurrentUser();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [open, setOpen] = useState(false);
    const [type, setType] = useState<FeedbackType>('general');
    const [typeTouched, setTypeTouched] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverMood, setHoverMood] = useState(0);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const hidden = useMemo(
        () => HIDDEN_PREFIXES.some(p => location.pathname === p || location.pathname.startsWith(p + '/')) ||
            location.pathname === '/pos',
        [location.pathname]
    );

    if (!user || hidden) return null;

    const firstName = (user.name || '').trim().split(' ')[0];
    const activeType = TYPES.find(t => t.id === type)!;
    const shownMood = hoverMood || rating;
    const trimmedLen = message.trim().length;
    const encouragement = trimmedLen === 0 ? '' : trimmedLen < 12 ? 'A little more detail helps 🙌' : 'Great — thank you! 🎉';

    const reset = () => {
        setType('general');
        setTypeTouched(false);
        setRating(0);
        setHoverMood(0);
        setMessage('');
        setDone(false);
    };

    const close = () => {
        setOpen(false);
        // Delay the reset so the modal doesn't visibly flip back mid fade-out.
        setTimeout(reset, 200);
    };

    // Picking a mood gently pre-selects a fitting category (only until the user
    // makes their own choice) — makes the form feel responsive without hijacking.
    const pickMood = (v: number) => {
        setRating(v === rating ? 0 : v);
        if (!typeTouched) {
            if (v >= 5) setType('praise');
            else if (v <= 2) setType('improvement');
        }
    };

    const pickType = (id: FeedbackType) => {
        setType(id);
        setTypeTouched(true);
        textareaRef.current?.focus();
    };

    const insertSuggestion = (text: string) => {
        setMessage(prev => {
            const t = prev.trim();
            return t ? `${t} ${text}` : text;
        });
        requestAnimationFrame(() => textareaRef.current?.focus());
    };

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || submitting) return;
        setSubmitting(true);
        try {
            await api.post('/feedback', {
                type,
                rating: rating || undefined,
                message: message.trim(),
                page: location.pathname,
                platform: 'web',
            }, { skipQueue: true });
            setDone(true);
            showToast('Thanks! Your feedback was sent.', 'success');
            setTimeout(close, 1800);
        } catch (err: any) {
            showToast(err?.message || 'Could not send feedback. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // ⌘/Ctrl + Enter to send from the textarea.
    const onMessageKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
    };

    return (
        <>
            {/* Floating trigger — a compact icon button that expands to its label only
                on hover, so it stays out of the way. Hidden while the modal is open, and
                kept below the modal layer (z-40) so any dialog cleanly covers it. */}
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="group fixed bottom-4 right-4 md:bottom-5 md:right-5 z-40 flex items-center h-12 rounded-full bg-sp-green text-white shadow-lg shadow-sp-green/25 hover:bg-sp-green-dark hover:shadow-xl transition-all duration-300 active:scale-95 pl-3.5 pr-3.5 hover:pr-5 print:hidden"
                    aria-label="Send feedback"
                    title="Send feedback"
                >
                    <ChatBubbleLeftRightIcon className="w-5 h-5 shrink-0" />
                    <span className="max-w-0 group-hover:max-w-[110px] overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:ml-2 text-sm font-bold transition-all duration-300">Feedback</span>
                </button>
            )}

            <Modal
                open={open}
                onClose={close}
                size="lg"
                disabled={submitting}
                title={done ? 'Thank you!' : firstName ? `Hi ${firstName} 👋` : 'Share your feedback'}
                icon={<span className="w-9 h-9 rounded-xl bg-sp-green-soft text-sp-green-dark flex items-center justify-center"><ChatBubbleLeftRightIcon className="w-5 h-5" /></span>}
            >
                {done ? (
                    <div className="flex flex-col items-center justify-center text-center px-8 py-14">
                        <div className="w-20 h-20 rounded-full bg-success-muted text-success flex items-center justify-center mb-4 animate-in zoom-in-50 duration-300">
                            <CheckCircleIcon className="w-11 h-11" />
                        </div>
                        <h4 className="text-lg font-extrabold text-brand-text tracking-tight">Feedback sent 🎉</h4>
                        <p className="text-sm text-brand-text-muted mt-1 max-w-xs">
                            Thank you for helping us make SalePilot better{firstName ? `, ${firstName}` : ''}.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={submit} className="p-6 pt-5 space-y-6 overflow-y-auto">
                        {/* Mood — the expressive, friendly entry point */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-2.5">How's SalePilot working for you?</label>
                            <div className="flex items-center gap-2 sm:gap-3" role="radiogroup" aria-label="Overall rating">
                                {MOODS.map(m => {
                                    const isActive = rating === m.v;
                                    const dim = shownMood !== 0 && shownMood !== m.v;
                                    return (
                                        <button
                                            key={m.v}
                                            type="button"
                                            onClick={() => pickMood(m.v)}
                                            onMouseEnter={() => setHoverMood(m.v)}
                                            onMouseLeave={() => setHoverMood(0)}
                                            aria-pressed={isActive}
                                            aria-label={m.label}
                                            className={`relative flex-1 aspect-square max-w-[64px] rounded-2xl border text-2xl sm:text-3xl flex items-center justify-center transition-all duration-200 active:scale-90 ${isActive
                                                ? 'border-sp-green bg-sp-green-soft ring-2 ring-sp-green/25 scale-110'
                                                : 'border-brand-border bg-surface hover:bg-surface-variant hover:scale-105'} ${dim ? 'opacity-45' : 'opacity-100'}`}
                                        >
                                            <span className="leading-none">{m.emoji}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="h-5 mt-1.5">
                                {shownMood !== 0 && (
                                    <span className="text-xs font-bold text-sp-green-dark animate-in fade-in duration-200">
                                        {MOODS.find(m => m.v === shownMood)?.label}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Type — quick, scannable chips */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-2">What's it about?</label>
                            <div className="flex flex-wrap gap-2">
                                {TYPES.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => pickType(t.id)}
                                        aria-pressed={type === t.id}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold border transition-all active:scale-95 ${type === t.id
                                            ? 'border-sp-green bg-sp-green-soft text-sp-green-dark ring-2 ring-sp-green/20'
                                            : 'border-brand-border bg-surface text-brand-text-muted hover:bg-surface-variant hover:text-brand-text'}`}
                                    >
                                        <span className="text-base leading-none">{t.emoji}</span>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message — context-aware prompt + jump-start chips */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">Tell us more</label>
                            <textarea
                                ref={textareaRef}
                                className={`${INPUT_CLASS} h-28 resize-none`}
                                placeholder={activeType.placeholder}
                                value={message}
                                maxLength={5000}
                                onChange={e => setMessage(e.target.value)}
                                onKeyDown={onMessageKeyDown}
                                required
                                autoFocus
                            />

                            {/* Quick starters — one tap to break the blank page */}
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {activeType.suggestions.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => insertSuggestion(s)}
                                        className="px-2.5 py-1 rounded-full text-[12px] font-semibold text-brand-text-muted bg-surface-variant hover:bg-sp-green-soft hover:text-sp-green-dark transition-colors active:scale-95"
                                    >
                                        + {s}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-sp-green-dark min-h-[14px]">{encouragement}</span>
                                <span className="text-[11px] text-brand-text-muted tnum">{message.length}/5000</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                            <p className="text-[11px] text-brand-text-muted text-center sm:text-left">
                                Attached: this page · we may reply at {user.email}
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={close}
                                    disabled={submitting}
                                    className="hidden sm:inline-flex px-4 py-2.5 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-xl hover:bg-surface-variant transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !message.trim()}
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-sp-amber rounded-xl shadow-sm hover:bg-sp-green-dark transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Sending…
                                        </>
                                    ) : (
                                        <>Send feedback</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
};

export default FeedbackWidget;
