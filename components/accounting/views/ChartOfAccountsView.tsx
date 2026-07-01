import React, { useState, useMemo } from 'react';
import { Account, AccountType, StoreSettings, RecurringExpense } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import PlusIcon from '../../icons/PlusIcon';
import PencilIcon from '../../icons/PencilIcon';
import TrashIcon from '../../icons/TrashIcon';
import ChevronDownIcon from '../../icons/ChevronDownIcon';
import EllipsisVerticalIcon from '../../icons/EllipsisVerticalIcon';
import CalendarDaysIcon from '../../icons/CalendarDaysIcon';
import MagnifyingGlassIcon from '../../icons/MagnifyingGlassIcon';
import ScaleIcon from '../../icons/Scale';
import AccountFormModal from '../modals/AccountFormModal';

interface ChartOfAccountsViewProps {
    accounts: Account[];
    storeSettings: StoreSettings;
    onSaveAccount: (account: Account) => void;
    onDeleteAccount: (accountId: string) => void;
    onAdjustAccount: (account: Account) => void;
    recurringExpenses: RecurringExpense[];
}

// Semantic dot color per account type (navy / red / midnight / green / orange).
const TYPE_DOT: Record<AccountType, string> = {
    asset: 'var(--m3-primary)',
    liability: 'var(--m3-error)',
    equity: 'var(--m3-tertiary)',
    revenue: '#16a34a',
    expense: 'var(--m3-secondary)',
};

const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({
    accounts, storeSettings, onSaveAccount, onDeleteAccount, onAdjustAccount, recurringExpenses
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<AccountType, boolean>>({
        asset: true, liability: true, equity: true, revenue: true, expense: true
    });

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
        setActiveActionMenu(null);
    };

    const handleAdd = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const toggleSection = (type: AccountType) => {
        setExpandedSections(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const filteredAccounts = useMemo(() => {
        if (!searchTerm) return accounts;
        const term = searchTerm.toLowerCase();
        return accounts.filter(account =>
            account.name.toLowerCase().includes(term) ||
            account.number.toLowerCase().includes(term) ||
            account.description?.toLowerCase().includes(term)
        );
    }, [accounts, searchTerm]);

    // Calculate recurring expense commitments per account
    const recurringCommitments = useMemo(() => {
        const commitments: Record<string, { count: number; totalAmount: number }> = {};

        recurringExpenses.filter(re => re.status === 'active').forEach(expense => {
            // Track for expense account (where money is debited)
            if (!commitments[expense.expenseAccountId]) {
                commitments[expense.expenseAccountId] = { count: 0, totalAmount: 0 };
            }
            commitments[expense.expenseAccountId].count++;
            commitments[expense.expenseAccountId].totalAmount += expense.amount;

            // Track for payment account (where money is credited)
            if (!commitments[expense.paymentAccountId]) {
                commitments[expense.paymentAccountId] = { count: 0, totalAmount: 0 };
            }
            commitments[expense.paymentAccountId].count++;
            commitments[expense.paymentAccountId].totalAmount += expense.amount;
        });

        return commitments;
    }, [recurringExpenses]);

    const renderAccountList = (type: AccountType, title: string) => {
        const typeAccounts = filteredAccounts.filter(a => a.type === type);
        if (typeAccounts.length === 0) return null;

        const totalBalance = typeAccounts.reduce((sum, a) => sum + a.balance, 0);
        const isExpanded = expandedSections[type];

        return (
            <div className="mb-4">
                <button
                    onClick={() => toggleSection(type)}
                    className="w-full flex items-center justify-between p-4 m3-bg-surface-lowest border m3-border-outline-variant rounded-xl hover:m3-bg-surface-container transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_DOT[type] }}></div>
                        <div className="text-left">
                            <h4 className="font-bold m3-text-on-surface text-sm">{title}</h4>
                            <p className="text-xs m3-text-on-surface-variant mt-0.5">
                                {typeAccounts.length} accounts • {formatCurrency(totalBalance, storeSettings)}
                            </p>
                        </div>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 m3-text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                    <div className="mt-2 space-y-2 pl-2">
                        {typeAccounts.sort((a, b) => a.number.localeCompare(b.number)).map(account => (
                            <div key={account.id} className="relative group m3-bg-surface-lowest border m3-border-outline-variant rounded-lg p-3 hover:m3-border-primary transition-all">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="hidden sm:block font-mono text-xs font-bold m3-text-on-surface-variant m3-bg-surface-container px-2 py-1 rounded">
                                            {account.number}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="sm:hidden font-mono text-xs m3-text-on-surface-variant">{account.number}</span>
                                                <h5 className="font-semibold m3-text-on-surface text-sm truncate">{account.name}</h5>
                                                {account.subType && (
                                                    <span className="text-[10px] px-1.5 py-0.5 m3-bg-surface-container m3-text-on-surface-variant rounded font-medium uppercase tracking-wide">System</span>
                                                )}
                                            </div>
                                            {account.description && (
                                                <p className="text-xs m3-text-on-surface-variant truncate mt-0.5">{account.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${account.balance >= 0 ? 'm3-text-on-surface' : 'm3-text-error'}`}>
                                                {formatCurrency(account.balance, storeSettings)}
                                            </div>
                                            {recurringCommitments[account.id] && (
                                                <div className="flex items-center gap-1 mt-1 justify-end text-xs m3-text-tertiary">
                                                    <CalendarDaysIcon className="w-3 h-3" />
                                                    <span>
                                                        {recurringCommitments[account.id].count} recurring
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Desktop Actions */}
                                        <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onAdjustAccount(account)}
                                                className="p-1.5 m3-text-on-surface-variant hover:m3-text-tertiary hover:m3-bg-surface-container rounded transition-colors"
                                                title="Adjust Balance"
                                            >
                                                <ScaleIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEdit(account)} className="p-1.5 m3-text-on-surface-variant hover:m3-text-primary hover:m3-bg-surface-container rounded transition-colors">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            {!account.subType && (
                                                <button onClick={() => onDeleteAccount(account.id)} className="p-1.5 m3-text-on-surface-variant hover:m3-text-error hover:m3-bg-surface-container rounded transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="md:hidden relative">
                                            <button
                                                onClick={() => setActiveActionMenu(activeActionMenu === account.id ? null : account.id)}
                                                className="p-1.5 m3-text-on-surface-variant hover:m3-bg-surface-container rounded transition-colors"
                                            >
                                                <EllipsisVerticalIcon className="w-5 h-5" />
                                            </button>

                                            {activeActionMenu === account.id && (
                                                <>
                                                    <div className="fixed inset-0 z-30" onClick={() => setActiveActionMenu(null)}></div>
                                                    <div className="m3-bg-surface-lowest rounded-xl shadow-lg absolute right-0 mt-2 w-48 border m3-border-outline-variant z-40 py-1">
                                                        <button
                                                            onClick={() => { onAdjustAccount(account); setActiveActionMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium m3-text-on-surface hover:m3-bg-surface-container transition-colors"
                                                        >
                                                            <ScaleIcon className="w-4 h-4" />
                                                            Adjust Balance
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(account)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium m3-text-on-surface hover:m3-bg-surface-container transition-colors"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                            Edit Account
                                                        </button>
                                                        {!account.subType && (
                                                            <button
                                                                onClick={() => { onDeleteAccount(account.id); setActiveActionMenu(null); }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium m3-text-error hover:m3-bg-surface-container transition-colors"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                                Delete Account
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold m3-text-on-surface tracking-tight">Chart of Accounts</h3>
                    <p className="text-sm m3-text-on-surface-variant mt-1">Organize and manage your financial structure</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 m3-bg-primary m3-text-on-primary font-bold text-sm rounded-xl transition-all duration-300 active:scale-95 shadow-sm"
                >
                    <PlusIcon className="w-4 h-4" />
                    New Account
                </button>
            </div>

            <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <MagnifyingGlassIcon className="w-5 h-5 m3-text-on-surface-variant" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search accounts name or number..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm m3-bg-surface-lowest m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] focus:border-transparent transition-all"
                />
            </div>

            <div className="sp-fade-in space-y-3">
                {renderAccountList('asset', 'Assets')}
                {renderAccountList('liability', 'Liabilities')}
                {renderAccountList('equity', 'Equity')}
                {renderAccountList('revenue', 'Revenue')}
                {renderAccountList('expense', 'Expenses')}
            </div>

            <AccountFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSaveAccount}
                accountToEdit={editingAccount}
            />
        </div>
    );
};

export default ChartOfAccountsView;
