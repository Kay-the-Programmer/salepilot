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

    const renderAccountList = (type: AccountType, title: string, accentColor: string) => {
        const typeAccounts = filteredAccounts.filter(a => a.type === type);
        if (typeAccounts.length === 0) return null;

        const totalBalance = typeAccounts.reduce((sum, a) => sum + a.balance, 0);
        const isExpanded = expandedSections[type];

        return (
            <div className="mb-4">
                <button
                    onClick={() => toggleSection(type)}
                    className="w-full flex items-center justify-between p-4 glass-effect !bg-white/50 dark:!bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-600 ${accentColor}`}>
                            <CalculatorIcon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-black text-slate-900 dark:text-slate-100 tracking-tight text-sm uppercase">{title}s</h4>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                                {typeAccounts.length} accounts • Total: {formatCurrency(totalBalance, storeSettings)}
                            </p>
                        </div>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                    <div className="mt-2 space-y-2 pl-2">
                        {typeAccounts.sort((a, b) => a.number.localeCompare(b.number)).map(account => (
                            <div key={account.id} className="relative group glass-effect !bg-white/30 dark:!bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl p-3 md:p-4 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="hidden sm:block font-mono text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                                            {account.number}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="sm:hidden font-mono text-[10px] font-black text-slate-400 dark:text-slate-500">{account.number}</span>
                                                <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{account.name}</h5>
                                                {account.subType && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md font-black uppercase tracking-tighter">System</span>
                                                )}
                                            </div>
                                            {account.description && (
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{account.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                        <div className="text-right">
                                            <div className={`text-sm md:text-base font-black tracking-tight ${account.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`}>
                                                {formatCurrency(account.balance, storeSettings)}
                                            </div>
                                            {recurringCommitments[account.id] && (
                                                <div className="flex items-center gap-1 mt-1 justify-end">
                                                    <CalendarDaysIcon className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                                                        {recurringCommitments[account.id].count} recurring • {formatCurrency(recurringCommitments[account.id].totalAmount, storeSettings)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Desktop Actions */}
                                        <div className="hidden md:flex items-center gap-1">
                                            <button
                                                onClick={() => onAdjustAccount(account)}
                                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                                title="Adjust Balance"
                                            >
                                                <ScaleIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEdit(account)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            {!account.subType && (
                                                <button onClick={() => onDeleteAccount(account.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="md:hidden relative">
                                            <button
                                                onClick={() => setActiveActionMenu(activeActionMenu === account.id ? null : account.id)}
                                                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            >
                                                <EllipsisVerticalIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                            </button>

                                            {activeActionMenu === account.id && (
                                                <>
                                                    <div className="fixed inset-0 z-30" onClick={() => setActiveActionMenu(null)}></div>
                                                    <div className="absolute right-0 mt-2 w-48 glass-effect !bg-white/95 dark:!bg-slate-900/95 rounded-xl shadow-xl z-40 animate-scale-up py-1.5">
                                                        <button
                                                            onClick={() => { onAdjustAccount(account); setActiveActionMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                                                        >
                                                            <ScaleIcon className="w-4 h-4" />
                                                            Adjust Balance
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(account)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        >
                                                            <PencilIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                                            Edit Account
                                                        </button>
                                                        {!account.subType && (
                                                            <button
                                                                onClick={() => { onDeleteAccount(account.id); setActiveActionMenu(null); }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
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
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Chart of Accounts</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Organize and manage your financial structure</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-black text-sm rounded-2xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Account
                </button>
            </div>

            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search accounts name or number..."
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm"
                />
            </div>

            <div className="animate-fade-in space-y-2">
                {renderAccountList('asset', 'Assets', 'text-blue-600 dark:text-blue-400')}
                {renderAccountList('liability', 'Liabilities', 'text-red-600 dark:text-red-400')}
                {renderAccountList('equity', 'Equity', 'text-purple-600 dark:text-purple-400')}
                {renderAccountList('revenue', 'Revenue', 'text-emerald-600 dark:text-emerald-400')}
                {renderAccountList('expense', 'Expenses', 'text-amber-600 dark:text-amber-400')}
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
