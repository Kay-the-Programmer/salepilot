import React, { ReactNode } from 'react';
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
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg shadow-sm">
                <div className="flex items-start">
                    {icon && (
                        <div className="flex-shrink-0 mr-3 text-blue-500">
                            {icon}
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blue-900 mb-1">{title}</h3>
                        <p className="text-sm text-blue-800">{description}</p>
                        {actionButton && (
                            <button
                                onClick={actionButton.onClick}
                                className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            >
                                {actionButton.label}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 ml-3 text-blue-400 hover:text-blue-600 transition-colors"
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-lg shadow-sm mb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                        {icon && (
                            <div className="flex-shrink-0 mr-2 text-blue-500">
                                {icon}
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
                        </div>
                    </div>
                    <div className="flex items-center ml-3 space-x-2">
                        {actionButton && (
                            <button
                                onClick={actionButton.onClick}
                                className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            >
                                {actionButton.label}
                            </button>
                        )}
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
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
        <div className="bg-white border-2 border-blue-200 rounded-lg shadow-md p-5 mb-4 hover:border-blue-300 transition-all">
            <div className="flex items-start">
                {icon && (
                    <div className="flex-shrink-0 mr-4 text-blue-500">
                        {icon}
                    </div>
                )}
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Dismiss"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    {actionButton && (
                        <button
                            onClick={actionButton.onClick}
                            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                        >
                            {actionButton.label}
                            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
