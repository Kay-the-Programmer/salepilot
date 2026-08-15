import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User, StoreSettings } from '../../types';
import { api } from '../../services/api';
import { formatCurrency, paymentMethodsOf } from '../../utils/currency';
import { Icon, Avatar } from '../crm/CrmBits';
import AppSwitcher from '../standalone/AppSwitcher';
import AppNavMenu from '../standalone/AppNavMenu';
import RailThemeButton from '../standalone/RailThemeButton';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';
import LoadingSpinner from '../LoadingSpinner';
import Logo from '../../assets/logo.png';
import '../crm/crm.css';
// Defines the `.sp-assistant` scope carrying the --m3-* variables and m3-*
// utilities used below (same import AccountingShell makes).
import '../../pages/assistant/assistant.css';

interface ExpenseAccountOption {
    id: string;
    name: string;
    number?: string;
}

interface ExpenseRow {
    id: string;
    date: string;
    description: string;
    amount: number;
    expenseAccountName?: string;
    paymentAccountName?: string;
    reference?: string;
}

interface ExpensesAppProps {
    user: User;
    storeSettings: StoreSettings | null;
    onExit: () => void;
    onLogout: () => void;
}

const FIELD =
    'w-full px-3 py-2.5 rounded-lg text-sm font-medium m3-bg-surface-container m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] focus:border-transparent transition-all';
const LABEL = 'block text-xs font-semibold m3-text-on-surface-variant mb-1.5';

const today = () => new Date().toISOString().slice(0, 10);
const accountLabel = (a: ExpenseAccountOption) => (a.number ? `${a.number} · ${a.name}` : a.name);

/**
 * Expense recording for staff.
 *
 * Deliberately *not* the Accounting Hub: a cashier holds `expenses:record`, so
 * they may record spending and review what they recorded — the ledger,
 * receivables, payables, tax and statements stay in /books for admins. The
 * backend scopes every read here to the signed-in user, so this view can only
 * ever show that person's own expenses.
 */
/** Not a tender — the expense is unpaid and posts to Accounts Payable. */
const ON_ACCOUNT = 'On account (pay later)';

/**
 * Which ledger account the money leaves.
 *
 * The chart offers only Cash and Accounts Payable as ways to pay (the backend's
 * PAYMENT_SUB_TYPES), so every tender that moves money now — cash, mobile
 * money, bank — posts against Cash, and only "on account" posts to Payables.
 * The tender's own name rides along on the expense, so "paid by MTN" survives
 * that simplification.
 */
const accountForMethod = (accounts: ExpenseAccountOption[], method: string): string => {
    if (accounts.length === 0) return '';
    const wantPayable = method === ON_ACCOUNT;
    const match = accounts.find(a => a.name.toLowerCase().includes('payable') === wantPayable);
    return (match || accounts[0]).id;
};

export const ExpensesApp: React.FC<ExpensesAppProps> = ({ user, storeSettings, onExit, onLogout }) => {
    const { openAppSwitcher } = useAppSwitcher();

    const [expenseAccounts, setExpenseAccounts] = useState<ExpenseAccountOption[]>([]);
    const [paymentAccounts, setPaymentAccounts] = useState<ExpenseAccountOption[]>([]);
    const [rows, setRows] = useState<ExpenseRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const [date, setDate] = useState(today());
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [expenseAccountId, setExpenseAccountId] = useState('');
    const [paymentAccountId, setPaymentAccountId] = useState('');
    // The store's OWN tender for this expense — the same list Settings offers
    // and the till records on a sale. ON_ACCOUNT means it isn't paid yet, which
    // posts to Accounts Payable rather than Cash.
    const [paymentMethod, setPaymentMethod] = useState('');

    // The store's tenders, plus the on-account option.
    const tenderOptions = useMemo(
        () => [...paymentMethodsOf(storeSettings).map(m => m.name), ON_ACCOUNT],
        [storeSettings],
    );

    // Keep the choice tied to the store's list: pick the first configured
    // tender, and re-pick if the current one is no longer offered.
    useEffect(() => {
        if (tenderOptions.includes(paymentMethod)) return;
        const first = tenderOptions[0];
        setPaymentMethod(first);
        setPaymentAccountId(accountForMethod(paymentAccounts, first));
    }, [tenderOptions, paymentMethod, paymentAccounts]);
    const [reference, setReference] = useState('');

    const loadAccounts = useCallback(async () => {
        try {
            const data = await api.get<{ expenseAccounts: ExpenseAccountOption[]; paymentAccounts: ExpenseAccountOption[] }>(
                '/expenses/accounts',
            );
            setExpenseAccounts(data.expenseAccounts || []);
            setPaymentAccounts(data.paymentAccounts || []);
            setExpenseAccountId(prev => prev || data.expenseAccounts?.[0]?.id || '');
            setPaymentAccountId(prev => prev || data.paymentAccounts?.[0]?.id || '');
        } catch {
            setError('Could not load expense categories. Check your connection and try again.');
        }
    }, []);

    const loadExpenses = useCallback(async () => {
        try {
            const data = await api.get<{ items: ExpenseRow[]; totalAmount: number }>('/expenses?limit=50');
            setRows(data.items || []);
            setTotal(Number(data.totalAmount) || 0);
        } catch {
            setError('Could not load your expenses.');
        }
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([loadAccounts(), loadExpenses()]);
            setLoading(false);
        })();
    }, [loadAccounts, loadExpenses]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(t);
    }, [toast]);

    const parsedAmount = useMemo(() => {
        const n = parseFloat(amount);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [amount]);

    const canSubmit = !saving && !!parsedAmount && description.trim() !== '' && !!expenseAccountId && !!paymentAccountId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSaving(true);
        setError(null);
        try {
            const expenseAccount = expenseAccounts.find(a => a.id === expenseAccountId);
            const paymentAccount = paymentAccounts.find(a => a.id === paymentAccountId);
            await api.post('/expenses', {
                date,
                description: description.trim(),
                amount: parsedAmount,
                expenseAccountId,
                expenseAccountName: expenseAccount?.name,
                paymentAccountId,
                paymentAccountName: paymentAccount?.name,
                paymentMethod: paymentMethod === ON_ACCOUNT ? undefined : paymentMethod,
                category: expenseAccount?.name,
                reference: reference.trim() || undefined,
            });
            setDescription('');
            setAmount('');
            setReference('');
            setDate(today());
            await loadExpenses();
            setToast('Expense recorded');
        } catch (err: any) {
            setError(err?.message || 'Could not save the expense.');
        } finally {
            setSaving(false);
        }
    };

    const noAccounts = !loading && expenseAccounts.length === 0;

    return (
        <div className="crm">
            <aside className="crm-rail" aria-label="Expenses navigation">
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name="receipt_long" size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        <span className="crm-rail__brand-title">SalePilot Expenses</span>
                        <span className="crm-rail__brand-sub">Record spending</span>
                    </div>
                </div>

                <nav className="crm-rail__nav">
                    <button type="button" className="crm-rail__item is-active" aria-current="page">
                        <Icon name="receipt_long" size={22} fill={1} /> My Expenses
                    </button>
                </nav>

                <div className="crm-rail__foot">
                    <button type="button" className="crm-rail__item" onClick={openAppSwitcher}>
                        <Icon name="apps" size={22} /> SalePilot Apps
                    </button>
                    <RailThemeButton />
                    <button type="button" className="crm-rail__item crm-rail__item--logout" onClick={onLogout}>
                        <Icon name="logout" size={22} /> Logout
                    </button>
                    <div className="crm-rail__user">
                        <Avatar name={user?.name} src={user?.profilePicture} size={36} />
                        <div className="crm-rail__user-info">
                            <span className="crm-rail__user-name">{user?.name}</span>
                            <span className="crm-rail__user-role">{user?.role}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="crm-body">
                <header className="crm-bar crm-bar--mobile">
                    <AppSwitcher user={user} currentRoute="expenses" triggerClassName="crm-iconbtn" />
                    <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
                    <div className="crm-bar__actions">
                        <AppNavMenu
                            items={[{ icon: 'receipt_long', label: 'My Expenses', active: true, onClick: () => {} }]}
                            onExit={onExit}
                            onLogout={onLogout}
                            triggerClassName="crm-iconbtn"
                        />
                    </div>
                </header>

                {/* `sp-assistant` scopes the --m3-* variables and m3-* utilities
                    used below; without it every surface renders transparent. */}
                <main className="sp-assistant p-4 sm:p-6 overflow-y-auto">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-5">
                            <h1 className="text-xl font-bold m3-text-on-surface">My Expenses</h1>
                            <p className="text-sm m3-text-on-surface-variant mt-0.5">
                                Record money you spend for the store. Only you and the store owner can see these.
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-16"><LoadingSpinner /></div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                <section className="lg:col-span-2">
                                    <form
                                        onSubmit={handleSubmit}
                                        className="rounded-2xl p-4 sm:p-5 m3-bg-surface-low border m3-border-outline-variant"
                                    >
                                        <h2 className="text-sm font-bold m3-text-on-surface mb-4">Record an expense</h2>

                                        {noAccounts ? (
                                            <p className="text-sm m3-text-on-surface-variant">
                                                No expense categories have been set up for this store yet. Ask the store
                                                owner to add them in the Accounting Hub.
                                            </p>
                                        ) : (
                                            <>
                                                <div className="mb-3">
                                                    <label className={LABEL} htmlFor="exp-description">Description</label>
                                                    <input
                                                        id="exp-description"
                                                        className={FIELD}
                                                        value={description}
                                                        onChange={e => setDescription(e.target.value)}
                                                        placeholder="e.g. Taxi to the supplier"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <label className={LABEL} htmlFor="exp-amount">Amount</label>
                                                        <input
                                                            id="exp-amount"
                                                            className={FIELD}
                                                            value={amount}
                                                            onChange={e => setAmount(e.target.value)}
                                                            inputMode="decimal"
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={LABEL} htmlFor="exp-date">Date</label>
                                                        <input
                                                            id="exp-date"
                                                            type="date"
                                                            className={FIELD}
                                                            value={date}
                                                            max={today()}
                                                            onChange={e => setDate(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <label className={LABEL} htmlFor="exp-account">Expense Account</label>
                                                    <select
                                                        id="exp-account"
                                                        className={FIELD}
                                                        value={expenseAccountId}
                                                        onChange={e => setExpenseAccountId(e.target.value)}
                                                    >
                                                        {expenseAccounts.map(a => (
                                                            <option key={a.id} value={a.id}>{accountLabel(a)}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="mb-3">
                                                    <label className={LABEL} htmlFor="exp-payment">Paid by</label>
                                                    <select
                                                        id="exp-payment"
                                                        className={FIELD}
                                                        value={paymentMethod}
                                                        onChange={e => {
                                                            const value = e.target.value;
                                                            setPaymentMethod(value);
                                                            setPaymentAccountId(accountForMethod(paymentAccounts, value));
                                                        }}
                                                    >
                                                        {tenderOptions.map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="mb-4">
                                                    <label className={LABEL} htmlFor="exp-reference">Reference / Note</label>
                                                    <input
                                                        id="exp-reference"
                                                        className={FIELD}
                                                        value={reference}
                                                        onChange={e => setReference(e.target.value)}
                                                        placeholder="e.g. receipt number (optional)"
                                                    />
                                                </div>

                                                {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

                                                <button
                                                    type="submit"
                                                    disabled={!canSubmit}
                                                    className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-[color:var(--m3-primary)] disabled:opacity-50 transition-opacity"
                                                >
                                                    {saving ? 'Saving…' : 'Save expense'}
                                                </button>
                                            </>
                                        )}
                                    </form>
                                </section>

                                <section className="lg:col-span-3">
                                    <div className="rounded-2xl m3-bg-surface-low border m3-border-outline-variant overflow-hidden">
                                        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b m3-border-outline-variant">
                                            <h2 className="text-sm font-bold m3-text-on-surface">Recorded by you</h2>
                                            <span className="text-sm font-bold m3-text-on-surface">
                                                {formatCurrency(total, storeSettings!)}
                                            </span>
                                        </div>

                                        {rows.length === 0 ? (
                                            <p className="px-5 py-10 text-center text-sm m3-text-on-surface-variant">
                                                Nothing recorded yet. Your expenses will appear here.
                                            </p>
                                        ) : (
                                            <ul className="divide-y divide-[color:var(--m3-outline-variant)]">
                                                {rows.map(row => (
                                                    <li key={row.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold m3-text-on-surface truncate">
                                                                {row.description}
                                                            </p>
                                                            <p className="text-xs m3-text-on-surface-variant truncate">
                                                                {new Date(row.date).toLocaleDateString()}
                                                                {row.expenseAccountName ? ` · ${row.expenseAccountName}` : ''}
                                                                {row.reference ? ` · ${row.reference}` : ''}
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-bold m3-text-on-surface whitespace-nowrap">
                                                            {formatCurrency(row.amount, storeSettings!)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {toast && (
                <div className="sp-assistant fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[color:var(--m3-primary)] shadow-lg z-50">
                    {toast}
                </div>
            )}
        </div>
    );
};

export default ExpensesApp;
