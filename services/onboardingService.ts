import { api } from './api';

export interface OnboardingState {
    completedActions: string[];
    dismissedHelpers: string[];
    lastUpdated?: string;
}

/**
 * Fetch the current user's onboarding state
 */
export async function getOnboardingState(): Promise<OnboardingState> {
    try {
        const state = await api.get<OnboardingState>('/onboarding/state');
        return state;
    } catch (error) {
        console.error('Failed to fetch onboarding state:', error);
        // Return default state on error
        return {
            completedActions: [],
            dismissedHelpers: [],
            lastUpdated: undefined
        };
    }
}

/**
 * Mark an action as completed
 */
export async function completeAction(actionId: string): Promise<OnboardingState> {
    return await api.patch<OnboardingState>('/onboarding/complete-action', { actionId });
}

/**
 * Dismiss a helper so it doesn't show again
 */
export async function dismissHelper(helperId: string): Promise<OnboardingState> {
    return await api.patch<OnboardingState>('/onboarding/dismiss-helper', { helperId });
}

/**
 * Reset onboarding state (for testing or allowing users to restart)
 */
export async function resetOnboarding(): Promise<OnboardingState> {
    return await api.post<OnboardingState>('/onboarding/reset');
}

// Export onboarding action IDs as constants for consistency
export const ONBOARDING_ACTIONS = {
    // Inventory actions
    ADDED_FIRST_PRODUCT: 'added_first_product',
    CREATED_FIRST_CATEGORY: 'created_first_category',
    ADDED_FIRST_SUPPLIER: 'added_first_supplier',

    // Sales actions
    MADE_FIRST_SALE: 'made_first_sale',
    USED_BARCODE_SCANNER: 'used_barcode_scanner',
    ADDED_CUSTOMER_TO_SALE: 'added_customer_to_sale',

    // Customer actions
    ADDED_FIRST_CUSTOMER: 'added_first_customer',

    // Purchase Order actions
    CREATED_FIRST_PO: 'created_first_po',
    RECEIVED_FIRST_PO: 'received_first_po',

    // Reports actions
    VIEWED_REPORTS: 'viewed_reports',

    // Accounting actions
    VIEWED_ACCOUNTING: 'viewed_accounting',
    RECORDED_FIRST_EXPENSE: 'recorded_first_expense',
} as const;

// Export helper IDs as constants
export const ONBOARDING_HELPERS = {
    ADD_FIRST_PRODUCT: 'helper_add_first_product',
    CREATE_CATEGORIES: 'helper_create_categories',
    ADD_SUPPLIERS: 'helper_add_suppliers',
    MAKE_FIRST_SALE: 'helper_make_first_sale',
    USE_BARCODE_SCANNER: 'helper_use_barcode_scanner',
    ADD_CUSTOMER_TO_SALE: 'helper_add_customer_to_sale',
    ADD_FIRST_CUSTOMER: 'helper_add_first_customer',
    CREATE_FIRST_PO: 'helper_create_first_po',
    RECEIVE_INVENTORY: 'helper_receive_inventory',
    EXPLORE_REPORTS: 'helper_explore_reports',
    UNDERSTAND_ACCOUNTS: 'helper_understand_accounts',
    RECORD_EXPENSE: 'helper_record_expense',
} as const;
