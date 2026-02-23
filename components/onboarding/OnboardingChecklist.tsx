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
        <div className="liquid-glass-card rounded-[2rem] border border-gray-200 overflow-hidden">
            {/* Header */}
            <div
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white cursor-pointer active:scale-95 transition-all duration-300"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm">Getting Started</h3>
                        <p className="text-xs opacity-90 mt-0.5">
                            {completedCount} of {totalCount} completed
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="text-right text-xs font-medium">
                            {Math.round(progress)}%
                        </div>
                        <ChevronDownIcon
                            className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-white h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Task List */}
            {isExpanded && (
                <div className="p-2">
                    {ONBOARDING_TASKS.map((task) => {
                        const isCompleted = isActionCompleted(task.actionId);

                        return (
                            <div
                                key={task.id}
                                className={`flex items-start p-2 rounded-lg mb-1 transition-all ${isCompleted
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                    }`}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {isCompleted ? (
                                        <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                                            <CheckIcon className="h-3 w-3 text-white" />
                                        </div>
                                    ) : (
                                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                                    )}
                                </div>
                                <div className="ml-3 flex-1">
                                    <h4 className={`text-sm font-medium ${isCompleted ? 'text-green-900 line-through' : 'text-gray-900'
                                        }`}>
                                        {task.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 mt-0.5">{task.description}</p>
                                </div>
                                {!isCompleted && task.link && (
                                    <a
                                        href={task.link}
                                        className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
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
