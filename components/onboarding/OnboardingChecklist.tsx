import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ONBOARDING_ACTIONS } from '../../services/onboardingService';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import CheckIcon from '../icons/CheckIcon';

interface OnboardingTask {
    id: string;
    title: string;
    description: string;
    actionId: string;
    link: string;
}

const ONBOARDING_TASKS: OnboardingTask[] = [
    {
        id: 'add-product',
        title: 'Add your first product',
        description: 'Build your inventory in Inventory → Products',
        actionId: ONBOARDING_ACTIONS.ADDED_FIRST_PRODUCT,
        link: '/inventory'
    },
    {
        id: 'create-category',
        title: 'Organize with categories',
        description: 'Group products on the Categories page',
        actionId: ONBOARDING_ACTIONS.CREATED_FIRST_CATEGORY,
        link: '/categories'
    },
    {
        id: 'make-sale',
        title: 'Make your first sale',
        description: 'Ring up a transaction at the Sales till',
        actionId: ONBOARDING_ACTIONS.MADE_FIRST_SALE,
        link: '/sales'
    },
    {
        id: 'view-reports',
        title: 'Check your reports',
        description: 'Track performance on the Reports dashboard',
        actionId: ONBOARDING_ACTIONS.VIEWED_REPORTS,
        link: '/reports'
    },
];

export default function OnboardingChecklist() {
    const { isActionCompleted } = useOnboarding();
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(true);

    const completedCount = ONBOARDING_TASKS.filter(task =>
        isActionCompleted(task.actionId)
    ).length;
    const totalCount = ONBOARDING_TASKS.length;
    const progress = (completedCount / totalCount) * 100;
    const allDone = completedCount === totalCount;

    return (
        <div className="bg-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm animate-fade-in-up">
            {/* Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left px-5 py-4 hover:bg-surface-variant/60 transition-colors"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-brand-text tracking-tight">Getting started</h3>
                        <p className="text-xs font-medium text-brand-text-muted mt-0.5">
                            {allDone ? 'All set — nice work!' : `${completedCount} of ${totalCount} complete`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-success-muted text-primary rounded-full text-xs font-bold tabular-nums">
                            {Math.round(progress)}%
                        </span>
                        <ChevronDownIcon
                            className={`h-5 w-5 text-brand-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 bg-warm-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </button>

            {/* Task list */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-1.5">
                    {ONBOARDING_TASKS.map((task) => {
                        const isCompleted = isActionCompleted(task.actionId);

                        return (
                            <div
                                key={task.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                    isCompleted
                                        ? 'bg-success-muted/40 border-primary/10'
                                        : 'bg-background border-brand-border hover:bg-surface-variant/60'
                                }`}
                            >
                                <div className="flex-shrink-0">
                                    {isCompleted ? (
                                        <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                                            <CheckIcon className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    ) : (
                                        <div className="h-6 w-6 border-2 border-warm-300 dark:border-white/20 rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-bold tracking-tight ${
                                        isCompleted ? 'text-brand-text-muted line-through' : 'text-brand-text'
                                    }`}>
                                        {task.title}
                                    </h4>
                                    <p className="text-xs text-brand-text-muted mt-0.5 truncate">{task.description}</p>
                                </div>
                                {!isCompleted && (
                                    <button
                                        type="button"
                                        onClick={() => navigate(task.link)}
                                        className="flex-shrink-0 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                                    >
                                        Go
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
