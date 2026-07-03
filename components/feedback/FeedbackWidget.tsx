import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../ui/Modal';
import { INPUT_CLASS } from '../../utils/ui';
import { ChatBubbleLeftRightIcon, CheckCircleIcon } from '../icons';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'praise' | 'general';
type Step = 'mood' | 'type' | 'message';

interface TypeDef {
    id: FeedbackType;
    label: string;
    emoji: string;
    desc: string;
    placeholder: string;
    suggestions: string[];
}

const TYPES: TypeDef[] = [
    {
        id: 'bug', label: 'Something broke', emoji: '🐞', desc: 'A bug or error',
        placeholder: 'What went wrong, and what were you doing when it happened?',
        suggestions: ['It crashed', "It's too slow", 'Numbers look wrong', "A button doesn't work"],
    },
    {
        id: 'feature', label: 'I have an idea', emoji: '✨', desc: 'Something new',
        placeholder: 'What would you like SalePilot to do? How would it help you?',
        suggestions: ['On the POS', 'In reports', 'For inventory', 'For payments'],
    },
    {
        id: 'improvement', label: 'Could be better', emoji: '📈', desc: 'An improvement',
        placeholder: 'What could work better? What slows you down?',
        suggestions: ['Make it faster', 'Fewer clicks', 'Clearer layout'],
    },
    {
        id: 'praise', label: 'I love something', emoji: '💚', desc: 'Praise',
        placeholder: "What do you love about SalePilot? We'd love to hear it!",
        suggestions: ['Easy to use', 'Saves me time', 'Great support'],
    },
    {
        id: 'general', label: 'Just a note', emoji: '💬', desc: 'Anything else',
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

const STEP_ORDER: Step[] = ['mood', 'type', 'message'];

const FeedbackWidget: React.FC = () => {
    const location = useLocation();
    const { showToast } = useToast();
    const user = getCurrentUser();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('mood');
    const [type, setType] = useState<FeedbackType>('general');
    const [typeTouched, setTypeTouched] = useState(false);
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const hidden = useMemo(
        () => HIDDEN_PREFIXES.some(p => location.pathname === p || location.pathname.startsWith(p + '/')) ||
            location.pathname === '/pos',
        [location.pathname]
    );

    // Clear any pending auto-advance timer on unmount.
    useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

    if (!user || hidden) return null;

    const firstName = (user.name || '').trim().split(' ')[0];
    const activeType = TYPES.find(t => t.id === type)!;
    const stepIndex = STEP_ORDER.indexOf(step);
    const trimmedLen = message.trim().length;
    const encouragement = trimmedLen === 0 ? '' : trimmedLen < 12 ? 'A little more detail helps 🙌' : 'Great — thank you! 🎉';

    const reset = () => {
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        setStep('mood');
        setType('general');
        setTypeTouched(false);
        setRating(0);
        setMessage('');
        setDone(false);
    };

    const close = () => {
        setOpen(false);
        // Delay the reset so the modal doesn't visibly flip back mid fade-out.
        setTimeout(reset, 200);
    };

    const goTo = (s: Step) => {
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        setStep(s);
    };
    const back = () => goTo(STEP_ORDER[Math.max(0, stepIndex - 1)]);

    // Picking a mood gently pre-selects a fitting category (until the user makes
    // their own choice), then glides to the next step so it feels effortless.
    const pickMood = (v: number) => {
        setRating(v);
        if (!typeTouched) {
            if (v >= 5) setType('praise');
            else if (v <= 2) setType('improvement');
        }
        advanceTimer.current = setTimeout(() => goTo('type'), 260);
    };

    const pickType = (id: FeedbackType) => {
        setType(id);
        setTypeTouched(true);
        advanceTimer.current = setTimeout(() => {
            goTo('message');
            requestAnimationFrame(() => textareaRef.current?.focus());
        }, 200);
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

    const headline = step === 'mood'
        ? (firstName ? `Hi ${firstName} 👋` : 'Share your feedback')
        : step === 'type' ? "What's it about?"
            : 'Tell us more';
    const subhead = step === 'mood'
        ? "How's SalePilot working for you?"
        : step === 'type' ? 'Pick what best fits — it helps us route it.'
            : `${activeType.emoji} ${activeType.desc}`;

    return (
        <>
            {/* Floating trigger — a compact icon button that expands to its label only
                on hover, so it stays out of the way. Hidden while the modal is open, and
                kept below the modal layer (z-40) so any dialog cleanly covers it. */}
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="group fixed bottom-4 right-4 md:bottom-5 md:right-5 z-40 flex items-center h-12 rounded-full bg-sp-navy text-white shadow-lg shadow-sp-navy/25 hover:bg-sp-navy-light hover:shadow-xl transition-all duration-300 active:scale-95 pl-3.5 pr-3.5 hover:pr-5 print:hidden"
                    aria-label="Send feedback"
                    title="Send feedback"
                >
                    <ChatBubbleLeftRightIcon className="w-5 h-5 shrink-0" />
                    <span className="max-w-0 group-hover:max-w-[110px] overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:ml-2 text-sm font-bold transition-all duration-300">Feedback</span>
                </button>
            )}

            <Modal open={open} onClose={close} size="md" disabled={submitting}>
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
                    <>
                        {/* Custom header: back (steps 2–3) + title + progress + close */}
                        <div className="p-5 pb-4 border-b border-brand-border shrink-0">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2 min-w-0">
                                    {stepIndex > 0 && (
                                        <button
                                            type="button"
                                            onClick={back}
                                            className="p-1.5 -ml-1.5 mt-0.5 text-brand-text-muted hover:text-brand-text rounded-full transition-colors flex-shrink-0"
                                            aria-label="Back"
                                        >
                                            <ArrowLeftIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-extrabold tracking-tight text-brand-text truncate">{headline}</h3>
                                        <p className="text-sm text-brand-text-muted mt-0.5 truncate">{subhead}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={close}
                                    disabled={submitting}
                                    className="shrink-0 p-2 -mr-1 text-brand-text-muted hover:text-brand-text hover:bg-surface-variant rounded-lg transition-all disabled:opacity-50 active:scale-95"
                                    aria-label="Close"
                                >
                                    <span className="material-symbols-rounded text-[20px]">close</span>
                                </button>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-3.5 flex items-center gap-1.5">
                                {STEP_ORDER.map((s, i) => (
                                    <span
                                        key={s}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? 'w-7 bg-sp-navy' : i < stepIndex ? 'w-1.5 bg-sp-navy' : 'w-1.5 bg-surface-variant'}`}
                                    />
                                ))}
                                <span className="ml-1.5 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
                                    Step {stepIndex + 1} of 3
                                </span>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* ── Step 1: Mood ── */}
                            {step === 'mood' && (
                                <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                                    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Overall rating">
                                        {MOODS.map(m => {
                                            const isActive = rating === m.v;
                                            return (
                                                <button
                                                    key={m.v}
                                                    type="button"
                                                    onClick={() => pickMood(m.v)}
                                                    aria-pressed={isActive}
                                                    aria-label={m.label}
                                                    className={`group/mood flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-200 active:scale-90 ${isActive
                                                        ? 'border-sp-navy bg-sp-navy-soft ring-2 ring-sp-navy/20'
                                                        : 'border-brand-border bg-surface hover:bg-surface-variant hover:-translate-y-0.5'}`}
                                                >
                                                    <span className="text-3xl leading-none transition-transform group-hover/mood:scale-110">{m.emoji}</span>
                                                    <span className={`text-[10px] font-bold leading-none text-center ${isActive ? 'text-sp-navy' : 'text-brand-text-muted'}`}>{m.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => goTo('type')}
                                        className="mt-5 w-full text-center text-sm font-semibold text-brand-text-muted hover:text-brand-text transition-colors py-2"
                                    >
                                        Skip — just leave a note →
                                    </button>
                                </div>
                            )}

                            {/* ── Step 2: Category ── */}
                            {step === 'type' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                    {TYPES.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => pickType(t.id)}
                                            aria-pressed={type === t.id}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all active:scale-[0.99] ${type === t.id
                                                ? 'border-2 border-sp-navy bg-sp-navy-soft/40'
                                                : 'border-brand-border bg-surface hover:border-sp-navy/40'}`}
                                        >
                                            <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-bold text-brand-text">{t.label}</span>
                                                <span className="block text-xs text-brand-text-muted truncate">{t.desc}</span>
                                            </span>
                                            <svg className="w-4 h-4 text-brand-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ── Step 3: Message ── */}
                            {step === 'message' && (
                                <form onSubmit={submit} className="animate-in fade-in slide-in-from-right-2 duration-200">
                                    <textarea
                                        ref={textareaRef}
                                        className={`${INPUT_CLASS} h-32 resize-none`}
                                        placeholder={activeType.placeholder}
                                        value={message}
                                        maxLength={5000}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyDown={onMessageKeyDown}
                                        required
                                        autoFocus
                                    />

                                    {/* Quick starters — one tap to break the blank page */}
                                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                                        {activeType.suggestions.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => insertSuggestion(s)}
                                                className="px-2.5 py-1 rounded-full text-[12px] font-semibold text-brand-text-muted bg-surface-variant hover:bg-sp-navy-soft hover:text-sp-navy transition-colors active:scale-95"
                                            >
                                                + {s}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-semibold text-sp-navy min-h-[14px]">{encouragement}</span>
                                        <span className="text-[11px] text-brand-text-muted tnum">{message.length}/5000</span>
                                    </div>

                                    <p className="mt-4 text-[11px] text-brand-text-muted">
                                        Attached: this page · we may reply at {user.email}
                                    </p>

                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={back}
                                            disabled={submitting}
                                            className="px-4 py-3 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-xl hover:bg-surface-variant transition-all disabled:opacity-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || !message.trim()}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-sp-orange rounded-xl shadow-sm hover:bg-sp-orange-light transition-all active:scale-95 disabled:opacity-50"
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
                                </form>
                            )}
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
};

export default FeedbackWidget;
