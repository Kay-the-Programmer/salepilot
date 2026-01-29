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

    const renderAccountList = (type: AccountType, title: string, iconColor: string, accentColor: string) => {
        const typeAccounts = filteredAccounts.filter(a => a.type === type);
        if (typeAccounts.length === 0) return null;

        const totalBalance = typeAccounts.reduce((sum, a) => sum + a.balance, 0);
        const isExpanded = expandedSections[type];

        return (
            <div className="mb-4">
                <button
                    onClick={() => toggleSection(type)}
                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all duration-200 shadow-sm group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-slate-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100 ${accentColor}`}>
                            <CalculatorIcon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-black text-slate-900 tracking-tight text-sm uppercase">{title}s</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                {typeAccounts.length} accounts • Total: {formatCurrency(totalBalance, storeSettings)}
                            </p>
                        </div>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                    <div className="mt-2 space-y-2 pl-2">
                        {typeAccounts.sort((a, b) => a.number.localeCompare(b.number)).map(account => (
                            <div key={account.id} className="relative group bg-white border border-slate-100 rounded-xl p-3 md:p-4 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="hidden sm:block font-mono text-xs font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                            {account.number}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="sm:hidden font-mono text-[10px] font-black text-slate-400">{account.number}</span>
                                                <h5 className="font-bold text-slate-900 text-sm truncate">{account.name}</h5>
                                                {account.subType && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-black uppercase tracking-tighter">System</span>
                                                )}
                                            </div>
                                            {account.description && (
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5">{account.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                        <div className="text-right">
                                            <div className={`text-sm md:text-base font-black tracking-tight ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                                                {formatCurrency(account.balance, storeSettings)}
                                            </div>
                                            {recurringCommitments[account.id] && (
                                                <div className="flex items-center gap-1 mt-1 justify-end">
                                                    <CalendarDaysIcon className="w-3 h-3 text-indigo-500" />
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">
                                                        {recurringCommitments[account.id].count} recurring • {formatCurrency(recurringCommitments[account.id].totalAmount, storeSettings)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Desktop Actions */}
                                        <div className="hidden md:flex items-center gap-1">
                                            <button
                                                onClick={() => onAdjustAccount(account)}
                                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="Adjust Balance"
                                            >
                                                <ScaleIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEdit(account)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            {!account.subType && (
                                                <button onClick={() => onDeleteAccount(account.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="md:hidden relative">
                                            <button
                                                onClick={() => setActiveActionMenu(activeActionMenu === account.id ? null : account.id)}
                                                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                                            >
                                                <EllipsisVerticalIcon className="w-5 h-5 text-slate-400" />
                                            </button>

                                            {activeActionMenu === account.id && (
                                                <>
                                                    <div className="fixed inset-0 z-30" onClick={() => setActiveActionMenu(null)}></div>
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-scale-up">
                                                        <button
                                                            onClick={() => { onAdjustAccount(account); setActiveActionMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-purple-600 hover:bg-purple-50"
                                                        >
                                                            <ScaleIcon className="w-4 h-4" />
                                                            Adjust Balance
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(account)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                        >
                                                            <PencilIcon className="w-4 h-4 text-blue-500" />
                                                            Edit Account
                                                        </button>
                                                        {!account.subType && (
                                                            <button
                                                                onClick={() => { onDeleteAccount(account.id); setActiveActionMenu(null); }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
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
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Chart of Accounts</h3>
                    <p className="text-sm text-slate-600 mt-1">Organize and manage your financial structure</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-sm rounded-2xl hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Account
                </button>
            </div>

            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search accounts name or number..."
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 text-sm font-medium shadow-sm"
                />
            </div>

            <div className="animate-fade-in space-y-2">
                {renderAccountList('asset', 'Asset', 'bg-blue-100 text-blue-600', 'text-blue-600')}
                {renderAccountList('liability', 'Liability', 'bg-red-100 text-red-600', 'text-red-600')}
                {renderAccountList('equity', 'Equity', 'bg-purple-100 text-purple-600', 'text-purple-600')}
                {renderAccountList('revenue', 'Revenue', 'bg-green-100 text-green-600', 'text-green-600')}
                {renderAccountList('expense', 'Expense', 'bg-amber-100 text-amber-600', 'text-amber-600')}
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
