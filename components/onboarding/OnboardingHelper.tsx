import { ReactNode } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import XMarkIcon from '../icons/XMarkIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';

export interface OnboardingHelperProps {
    helperId: string;
    title: string;
    description: string;
    actionButton?: {
        label: string;
        onClick: () => void;
    };
    variant?: 'banner' | 'card' | 'compact';
    icon?: ReactNode;
    showWhen?: boolean; // Additional condition for showing (e.g., data.length === 0)
}

export default function OnboardingHelper({
    helperId,
    title,
    description,
    actionButton,
    variant = 'card',
    icon,
    showWhen = true
}: OnboardingHelperProps) {
    const { isHelperDismissed, dismissHelper } = useOnboarding();

    // Don't show if dismissed or showWhen condition is false
    if (isHelperDismissed(helperId) || !showWhen) {
        return null;
    }

    const handleDismiss = () => {
        dismissHelper(helperId);
    };

    const dismissBtn = (
        <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            title="Dismiss"
            className="flex-shrink-0 p-1.5 -m-1 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-surface-variant transition-colors"
        >
            <XMarkIcon className="h-4 w-4" />
        </button>
    );

    const primaryAction = actionButton && (
        <button
            onClick={actionButton.onClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm transition-all active:scale-95"
        >
            {actionButton.label}
            <ArrowRightIcon className="h-4 w-4" />
        </button>
    );

    // ── Banner: full-width informational strip ──
    if (variant === 'banner') {
        return (
            <div className="bg-surface border border-brand-border rounded-2xl p-4 mb-6 shadow-sm animate-fade-in-up">
                <div className="flex items-start gap-3">
                    {icon && <div className="flex-shrink-0 mt-0.5 text-primary [&>*]:h-5 [&>*]:w-5">{icon}</div>}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-brand-text tracking-tight">{title}</h3>
                        <p className="mt-0.5 text-sm text-brand-text-muted leading-relaxed">{description}</p>
                        {actionButton && (
                            <button
                                onClick={actionButton.onClick}
                                className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm transition-all active:scale-95"
                            >
                                {actionButton.label}
                                <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {dismissBtn}
                </div>
            </div>
        );
    }

    // ── Compact: single dense row ──
    if (variant === 'compact') {
        return (
            <div className="bg-surface border border-brand-border rounded-xl p-3 mb-4 shadow-sm animate-fade-in-up">
                <div className="flex items-center gap-3">
                    {icon && <div className="flex-shrink-0 text-primary [&>*]:h-5 [&>*]:w-5">{icon}</div>}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-brand-text tracking-tight">{title}</p>
                        <p className="mt-0.5 text-xs text-brand-text-muted leading-snug line-clamp-1">{description}</p>
                    </div>
                    {actionButton && (
                        <button
                            onClick={actionButton.onClick}
                            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm transition-all active:scale-95"
                        >
                            {actionButton.label}
                            <ArrowRightIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {dismissBtn}
                </div>
            </div>
        );
    }

    // ── Card (default): prominent empty-state guidance ──
    return (
        <div className="bg-success-muted/50 dark:bg-primary/[0.06] border border-primary/15 rounded-2xl p-5 md:p-6 mb-6 shadow-sm animate-fade-in-up">
            <div className="flex items-start gap-4">
                {icon && <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-primary/10 text-primary shadow-sm [&>*]:h-6 [&>*]:w-6">{icon}</div>}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base md:text-lg font-bold text-brand-text tracking-tight">{title}</h3>
                        {dismissBtn}
                    </div>
                    <p className="mt-1 text-sm text-brand-text-muted leading-relaxed max-w-prose">{description}</p>
                    {primaryAction && <div className="mt-4">{primaryAction}</div>}
                </div>
            </div>
        </div>
    );
}
