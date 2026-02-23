import React, { useState, useMemo } from 'react';
import { Account, AccountType, StoreSettings, RecurringExpense } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import PlusIcon from '../../icons/PlusIcon';
import PencilIcon from '../../icons/PencilIcon';
import TrashIcon from '../../icons/TrashIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
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
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group active:scale-95 transition-all duration-300"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${type === 'asset' ? 'bg-blue-500' : type === 'liability' ? 'bg-red-500' : type === 'equity' ? 'bg-purple-500' : type === 'revenue' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <div className="text-left">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{title}s</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {typeAccounts.length} accounts • {formatCurrency(totalBalance, storeSettings)}
                            </p>
                        </div>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                    <div className="mt-2 space-y-2 pl-2">
                        {typeAccounts.sort((a, b) => a.number.localeCompare(b.number)).map(account => (
                            <div key={account.id} className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="hidden sm:block font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            {account.number}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="sm:hidden font-mono text-xs text-slate-400">{account.number}</span>
                                                <h5 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{account.name}</h5>
                                                {account.subType && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded font-medium uppercase tracking-wide">System</span>
                                                )}
                                            </div>
                                            {account.description && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{account.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${account.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`}>
                                                {formatCurrency(account.balance, storeSettings)}
                                            </div>
                                            {recurringCommitments[account.id] && (
                                                <div className="flex items-center gap-1 mt-1 justify-end text-xs text-indigo-500">
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
                                                className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors active:scale-95 transition-all duration-300"
                                                title="Adjust Balance"
                                            >
                                                <ScaleIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEdit(account)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors active:scale-95 transition-all duration-300">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            {!account.subType && (
                                                <button onClick={() => onDeleteAccount(account.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors active:scale-95 transition-all duration-300">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="md:hidden relative">
                                            <button
                                                onClick={() => setActiveActionMenu(activeActionMenu === account.id ? null : account.id)}
                                                className="p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors active:scale-95 transition-all duration-300"
                                            >
                                                <EllipsisVerticalIcon className="w-5 h-5" />
                                            </button>

                                            {activeActionMenu === account.id && (
                                                <>
                                                    <div className="fixed inset-0 z-30" onClick={() => setActiveActionMenu(null)}></div>
                                                    <div className="liquid-glass-card rounded-[2rem] absolute right-0 mt-2 w-48 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-40 py-1">
                                                        <button
                                                            onClick={() => { onAdjustAccount(account); setActiveActionMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all duration-300"
                                                        >
                                                            <ScaleIcon className="w-4 h-4" />
                                                            Adjust Balance
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(account)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all duration-300"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                            Edit Account
                                                        </button>
                                                        {!account.subType && (
                                                            <button
                                                                onClick={() => { onDeleteAccount(account.id); setActiveActionMenu(null); }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all duration-300"
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
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Chart of Accounts</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Organize and manage your financial structure</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors active:scale-95 transition-all duration-300"
                >
                    <PlusIcon className="w-4 h-4" />
                    New Account
                </button>
            </div>

            <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search accounts name or number..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
            </div>

            <div className="animate-fade-in space-y-3">
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
