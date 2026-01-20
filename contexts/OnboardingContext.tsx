import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OnboardingState, getOnboardingState, completeAction as completeActionAPI, dismissHelper as dismissHelperAPI } from '../services/onboardingService';
import { User } from '../types';

interface OnboardingContextValue {
    state: OnboardingState;
    isLoading: boolean;
    isActionCompleted: (actionId: string) => boolean;
    isHelperDismissed: (helperId: string) => boolean;
    completeAction: (actionId: string) => Promise<void>;
    dismissHelper: (helperId: string) => Promise<void>;
    refreshState: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

interface OnboardingProviderProps {
    children: ReactNode;
    user: User | null;
}

export function OnboardingProvider({ children, user }: OnboardingProviderProps) {
    const [state, setState] = useState<OnboardingState>({
        completedActions: [],
        dismissedHelpers: [],
        lastUpdated: undefined
    });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch onboarding state when user changes
    useEffect(() => {
        if (user?.id) {
            loadState();
        } else {
            // Reset state if no user
            setState({
                completedActions: [],
                dismissedHelpers: [],
                lastUpdated: undefined
            });
            setIsLoading(false);
        }
    }, [user?.id]);

    const loadState = async () => {
        setIsLoading(true);
        try {
            const fetchedState = await getOnboardingState();
            setState(fetchedState);
        } catch (error) {
            console.error('Failed to load onboarding state:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isActionCompleted = (actionId: string): boolean => {
        return state.completedActions.includes(actionId);
    };

    const isHelperDismissed = (helperId: string): boolean => {
        return state.dismissedHelpers.includes(helperId);
    };

    const completeAction = async (actionId: string): Promise<void> => {
        try {
            const updatedState = await completeActionAPI(actionId);
            setState(updatedState);
        } catch (error) {
            console.error('Failed to complete action:', error);
            // Optimistically update local state even on error
            setState(prev => ({
                ...prev,
                completedActions: prev.completedActions.includes(actionId)
                    ? prev.completedActions
                    : [...prev.completedActions, actionId],
                lastUpdated: new Date().toISOString()
            }));
        }
    };

    const dismissHelper = async (helperId: string): Promise<void> => {
        try {
            const updatedState = await dismissHelperAPI(helperId);
            setState(updatedState);
        } catch (error) {
            console.error('Failed to dismiss helper:', error);
            // Optimistically update local state even on error
            setState(prev => ({
                ...prev,
                dismissedHelpers: prev.dismissedHelpers.includes(helperId)
                    ? prev.dismissedHelpers
                    : [...prev.dismissedHelpers, helperId],
                lastUpdated: new Date().toISOString()
            }));
        }
    };

    const value: OnboardingContextValue = {
        state,
        isLoading,
        isActionCompleted,
        isHelperDismissed,
        completeAction,
        dismissHelper,
        refreshState: loadState
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding(): OnboardingContextValue {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
