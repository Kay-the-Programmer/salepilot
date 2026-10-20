import { toDateInputValue } from '../../utils/date';

/**
 * What recording an expense means, in one place.
 *
 * There are two expense surfaces and that is deliberate — the standalone
 * Expenses app is for a cashier with `expenses:record`, who may only see what
 * they recorded, while the Accounting Hub's Expenses view is the admin ledger.
 * What was not deliberate is that each had built its own answer to the same
 * three questions: what the POST body looks like, which ledger account the
 * money leaves, and what the quick categories are. They had already drifted —
 * one offered quick categories and the other did not, and they picked the
 * payment account by different rules — so the same expense recorded from the
 * till and from the books could post differently.
 *
 * The surfaces stay separate. The arithmetic and the posting rules live here.
 */

/** Not a tender: the expense is unpaid and posts to Accounts Payable. */
export const ON_ACCOUNT = 'On account (pay later)';

/** The categories offered as one-tap choices, in the order they are shown. */
export const QUICK_CATEGORY_NAMES = [
    'Rent', 'Utilities', 'Supplies', 'Salaries',
    'Transport', 'Marketing', 'Taxes', 'Other',
] as const;

export interface ExpenseAccountChoice {
    id: string;
    name: string;
    number?: string;
    type?: string;
    subType?: string;
}

/** `1000 · Cash` where there is an account number, the bare name otherwise. */
export const accountLabel = (a: ExpenseAccountChoice): string =>
    a.number ? `${a.number} · ${a.name}` : a.name;

/** The accounts an expense can be charged to. */
export const expenseAccountsOf = <T extends ExpenseAccountChoice>(accounts: T[]): T[] =>
    accounts.filter(a => a.type === 'expense');

/**
 * The accounts an expense can be paid from.
 *
 * The chart offers only Cash and Accounts Payable as ways to pay (the
 * backend's PAYMENT_SUB_TYPES), so every tender that moves money now — cash,
 * mobile money, bank — posts against Cash, and only "on account" posts to
 * Payables. The tender's own name rides along on the expense, so "paid by MTN"
 * survives that simplification.
 */
export const paymentAccountsOf = <T extends ExpenseAccountChoice>(accounts: T[]): T[] =>
    accounts.filter(a => a.subType === 'cash' || a.subType === 'accounts_payable');

/** Which payment account a chosen tender posts against. */
export const accountForMethod = (accounts: ExpenseAccountChoice[], method: string): string => {
    if (accounts.length === 0) return '';
    const wantPayable = method === ON_ACCOUNT;
    const match = accounts.find(a => a.name.toLowerCase().includes('payable') === wantPayable);
    return (match || accounts[0]).id;
};

export interface ExpenseDraft {
    date?: string;
    description: string;
    /** Already parsed — the surfaces own their own input masking. */
    amount: number;
    expenseAccountId: string;
    paymentAccountId: string;
    /** The tender the shopkeeper actually used, e.g. "MTN Mobile Money". */
    paymentMethod?: string;
    reference?: string;
    category?: string;
}

export interface ExpensePayload {
    date: string;
    description: string;
    amount: number;
    expenseAccountId: string;
    expenseAccountName?: string;
    paymentAccountId: string;
    paymentAccountName?: string;
    paymentMethod?: string;
    category?: string;
    reference?: string;
}

/**
 * The body `POST /expenses` expects.
 *
 * Account *names* go along with the ids because the expense row denormalises
 * them for display, and "on account" is sent as no payment method at all —
 * it is the absence of a tender, not a tender called "on account".
 */
export const buildExpensePayload = (
    draft: ExpenseDraft,
    accounts: ExpenseAccountChoice[],
): ExpensePayload => {
    const expenseAccount = accounts.find(a => a.id === draft.expenseAccountId);
    const paymentAccount = accounts.find(a => a.id === draft.paymentAccountId);
    const method = draft.paymentMethod;
    return {
        date: draft.date || toDateInputValue(new Date()),
        description: draft.description.trim(),
        amount: draft.amount,
        expenseAccountId: draft.expenseAccountId,
        expenseAccountName: expenseAccount?.name,
        paymentAccountId: draft.paymentAccountId,
        paymentAccountName: paymentAccount?.name,
        paymentMethod: method === ON_ACCOUNT ? undefined : method,
        category: draft.category ?? expenseAccount?.name,
        reference: draft.reference?.trim() || undefined,
    };
};

/** Everything a draft needs before it can be posted; null when it is ready. */
export const validateExpenseDraft = (draft: Partial<ExpenseDraft>): string | null => {
    if (!draft.amount || draft.amount <= 0) return 'Please enter a valid amount';
    if (!draft.description?.trim()) return 'Please describe what the money was spent on';
    if (!draft.expenseAccountId || !draft.paymentAccountId) {
        return 'Please select both expense and payment accounts';
    }
    return null;
};
