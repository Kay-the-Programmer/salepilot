import { useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ONBOARDING_ACTIONS } from '../../services/onboardingService';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import CheckIcon from '../icons/CheckIcon';

interface OnboardingTask {
    id: string;
    title: string;
    description: string;
    actionId: string;
    link?: string;
}

const ONBOARDING_TASKS: OnboardingTask[] = [
    {
        id: 'add-product',
        title: 'Add your first product',
        description: 'Start building your inventory',
        actionId: ONBOARDING_ACTIONS.ADDED_FIRST_PRODUCT,
        link: '/inventory'
    },
    {
        id: 'make-sale',
        title: 'Make your first sale',
        description: 'Process a transaction',
        actionId: ONBOARDING_ACTIONS.MADE_FIRST_SALE,
        link: '/sales'
    },
    {
        id: 'create-category',
        title: 'Organize with categories',
        description: 'Create product categories',
        actionId: ONBOARDING_ACTIONS.CREATED_FIRST_CATEGORY,
        link: '/inventory'
    },
    {
        id: 'view-reports',
        title: 'Check your reports',
        description: 'Monitor your business metrics',
        actionId: ONBOARDING_ACTIONS.VIEWED_REPORTS,
        link: '/reports'
    },
];

export default function OnboardingChecklist() {
    const { isActionCompleted } = useOnboarding();
    const [isExpanded, setIsExpanded] = useState(true);

    const completedCount = ONBOARDING_TASKS.filter(task =>
        isActionCompleted(task.actionId)
    ).length;
    const totalCount = ONBOARDING_TASKS.length;
    const progress = (completedCount / totalCount) * 100;

    return (
        <div className="glass-effect rounded-[2rem] border border-white/40 dark:border-slate-800/40 overflow-hidden shadow-lg animate-fade-in-up">
            {/* Header */}
            <div
                className="px-6 py-4 bg-gradient-to-r from-blue-600/90 to-indigo-700/90 text-white cursor-pointer active:scale-[0.98] transition-all duration-300 relative overflow-hidden group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex-1">
                        <h3 className="font-bold text-base font-outfit tracking-tight">Getting Started</h3>
                        <p className="text-xs font-medium text-white/80 mt-0.5">
                            {completedCount} of {totalCount} completed
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold tracking-wider uppercase">
                            {Math.round(progress)}%
                        </div>
                        <div className="p-1.5 bg-white/10 rounded-full">
                            <ChevronDownIcon
                                className={`h-4 w-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 bg-white/20 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-white h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Task List */}
            {isExpanded && (
                <div className="p-3 space-y-2">
                    {ONBOARDING_TASKS.map((task, index) => {
                        const isCompleted = isActionCompleted(task.actionId);

                        return (
                            <div
                                key={task.id}
                                className={`flex items-center p-3 rounded-2xl transition-all duration-300 ${isCompleted
                                    ? 'bg-green-500/5 border border-green-500/10'
                                    : 'bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/20 hover:bg-white/60 dark:hover:bg-slate-800/60'
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex-shrink-0">
                                    {isCompleted ? (
                                        <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-500/20">
                                            <CheckIcon className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    ) : (
                                        <div className="h-6 w-6 border-2 border-slate-300 dark:border-slate-600 rounded-full" />
                                    )}
                                </div>
                                <div className="ml-4 flex-1">
                                    <h4 className={`text-sm font-semibold font-outfit ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'
                                        }`}>
                                        {task.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{task.description}</p>
                                </div>
                                {!isCompleted && task.link && (
                                    <a
                                        href={task.link}
                                        className="ml-3 px-3 py-1 bg-blue-600/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                        Go →
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
