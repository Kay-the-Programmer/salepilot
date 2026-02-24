import { ReactNode } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import XMarkIcon from '../icons/XMarkIcon';

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

    if (variant === 'banner') {
        return (
            <div className="glass-effect border border-white/20 dark:border-slate-800/20 p-4 mb-6 rounded-2xl shadow-sm animate-fade-in-up">
                <div className="flex items-start">
                    {icon && (
                        <div className="flex-shrink-0 mr-3 text-blue-500 dark:text-blue-400">
                            {icon}
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 font-outfit">{title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
                        {actionButton && (
                            <button
                                onClick={actionButton.onClick}
                                className="mt-3 inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-95 shadow-sm"
                            >
                                {actionButton.label}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 ml-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Dismiss"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className="glass-effect border border-white/30 dark:border-slate-800/30 p-3 rounded-2xl shadow-sm mb-4 animate-fade-in-up">
                <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                        {icon && (
                            <div className="flex-shrink-0 mr-3 text-blue-500 dark:text-blue-400">
                                {icon}
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-outfit">{title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{description}</p>
                        </div>
                    </div>
                    <div className="flex items-center ml-3 space-x-2">
                        {actionButton && (
                            <button
                                onClick={actionButton.onClick}
                                className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 dark:bg-blue-500 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-95 shadow-sm"
                            >
                                {actionButton.label}
                            </button>
                        )}
                        <button
                            onClick={handleDismiss}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Dismiss"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default: card variant
    return (
        <div className="glass-effect rounded-[2rem] border border-white/40 dark:border-slate-800/40 p-6 mb-6 shadow-lg animate-fade-in-up hover:shadow-xl transition-all group overflow-hidden relative">
            {/* Subtle background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-400/10 blur-[80px] rounded-full group-hover:bg-blue-400/20 transition-all duration-700"></div>

            <div className="flex items-start relative z-10">
                {icon && (
                    <div className="flex-shrink-0 mr-5 text-blue-500 dark:text-blue-400 p-3 bg-white/50 dark:bg-slate-800/50 rounded-2xl shadow-sm">
                        {icon}
                    </div>
                )}
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2 font-outfit tracking-tight">{title}</h3>
                            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="ml-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all rounded-full hover:bg-white/80 dark:hover:bg-slate-800/80"
                            title="Dismiss"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    {actionButton && (
                        <button
                            onClick={actionButton.onClick}
                            className="mt-6 inline-flex items-center px-6 py-2.5 text-sm font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.4)] transition-all active:scale-95 duration-200"
                        >
                            {actionButton.label}
                            <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
