import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Account, JournalEntry, StoreSettings, AccountType, Sale, Customer, Payment, SupplierInvoice, SupplierPayment, PurchaseOrder, Supplier, Expense } from '../types';
import Header from '../components/Header';
import { formatCurrency } from '../utils/currency';
import PlusIcon from '../components/icons/PlusIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import PrinterIcon from '../components/icons/PrinterIcon';
import UnifiedRecordPaymentModal from '../components/accounting/UnifiedRecordPaymentModal';
import SupplierInvoiceFormModal from '../components/accounting/SupplierInvoiceFormModal';
import SupplierInvoiceDetailModal from '../components/accounting/SupplierInvoiceDetailModal';
import SalesInvoiceDetailModal from '../components/accounting/SalesInvoiceDetailModal';
import ArrowTrendingUpIcon from '../components/icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from '../components/icons/ArrowTrendingDownIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import CalculatorIcon from '../components/icons/CalculatorIcon';
import DocumentChartBarIcon from '../components/icons/DocumentChartBarIcon';
import ReceiptPercentIcon from '../components/icons/ReceiptPercentIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import UsersIcon from '../components/icons/UsersIcon';
import BuildingOfficeIcon from '../components/icons/BuildingOfficeIcon';
import InformationCircleIcon from '../components/icons/InformationCircleIcon';
import GridIcon from '../components/icons/GridIcon';
import EllipsisVerticalIcon from '../components/icons/EllipsisVerticalIcon';
import EyeIcon from '../components/icons/EyeIcon';
import CalendarDaysIcon from '../components/icons/CalendarDaysIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import ExpenseFormModal from '../components/accounting/ExpenseFormModal';
import AccountAdjustmentModal from '../components/accounting/AccountAdjustmentModal';
import ScaleIcon from '../components/icons/Scale';

// --- Subcomponents for AccountingPage ---
const AccountingDashboard: React.FC<{ accounts: Account[], journalEntries: JournalEntry[], storeSettings: StoreSettings }> = ({ accounts, journalEntries, storeSettings }) => {
    const recentTransactions = React.useMemo(() => {
        return [...journalEntries]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [journalEntries]);

    // Calculate key metrics
    const totalRevenue = useMemo(() =>
        accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0),
        [accounts]
    );
    const totalExpenses = useMemo(() =>
        accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0),
        [accounts]
    );
    const netIncome = totalRevenue - totalExpenses;
    const totalAssets = useMemo(() =>
        accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0),
        [accounts]
    );
    const totalLiabilities = useMemo(() =>
        accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0),
        [accounts]
    );

    return (
        <div className="space-y-8">
            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-blue-700">Revenue</div>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue, storeSettings)}</div>
                    <div className="text-xs text-blue-600 mt-2">Total income this period</div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                            <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-red-700">Expenses</div>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses, storeSettings)}</div>
                    <div className="text-xs text-red-600 mt-2">Total costs this period</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                            <CalculatorIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-emerald-700">Net Income</div>
                        </div>
                    </div>
                    <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                        {formatCurrency(netIncome, storeSettings)}
                    </div>
                    <div className="text-xs text-emerald-600 mt-2">Profit after expenses</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                            <BanknotesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-purple-700">Assets</div>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{formatCurrency(totalAssets, storeSettings)}</div>
                    <div className="text-xs text-purple-600 mt-2">Total company assets</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                        <BookOpenIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">Recent Journal Entries</h3>
                                </div>
                                <span className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-100 rounded-full">
                                    {recentTransactions.length} entries
                                </span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recentTransactions.map(entry => (
                                <div key={entry.id} className="p-5 hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
                                                {entry.description}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(entry.date).toLocaleDateString()} • {entry.reference || 'No reference'}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {entry.lines.map((line, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${line.type === 'debit' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                                    <span className="text-slate-700">{line.accountName}</span>
                                                </div>
                                                <span className={`font-mono ${line.type === 'debit' ? 'text-blue-700' : 'text-green-700'}`}>
                                                    {line.type === 'debit' ? formatCurrency(line.amount, storeSettings) : `(${formatCurrency(line.amount, storeSettings)})`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {recentTransactions.length === 0 && (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <BookOpenIcon className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-slate-600">No journal entries yet</p>
                                    <p className="text-sm text-slate-500 mt-1">Transactions will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                                    <CalculatorIcon className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Account Balances</h3>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                            {accounts.filter(a => a.subType).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 8).map(account => (
                                <div key={account.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${account.type === 'asset' ? 'bg-blue-500' :
                                                    account.type === 'liability' ? 'bg-red-500' :
                                                        account.type === 'equity' ? 'bg-purple-500' :
                                                            account.type === 'revenue' ? 'bg-green-500' : 'bg-amber-500'
                                                    }`}></div>
                                                <span className="text-sm font-medium text-slate-900 truncate">{account.name}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">{account.number}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'
                                                }`}>
                                                {formatCurrency(account.balance, storeSettings)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AccountFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: Account) => void;
    accountToEdit?: Account | null;
}> = ({ isOpen, onClose, onSave, accountToEdit }) => {
    const [account, setAccount] = useState<Omit<Account, 'id' | 'balance'>>({
        name: '', number: '', type: 'expense', isDebitNormal: true, description: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (accountToEdit) {
                setAccount(accountToEdit);
            } else {
                setAccount({ name: '', number: '', type: 'expense', isDebitNormal: true, description: '' });
            }
        }
    }, [accountToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isDebitNormal = account.type === 'asset' || account.type === 'expense';
        const finalAccount: Account = {
            ...account,
            id: accountToEdit?.id || `acc_${Date.now()}`,
            balance: accountToEdit?.balance || 0,
            isDebitNormal,
        };
        onSave(finalAccount);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                    <PencilIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    {accountToEdit ? 'Edit Account' : 'Add New Account'}
                                </h3>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <XMarkIcon className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Account Name</label>
                            <input
                                type="text"
                                value={account.name}
                                onChange={e => setAccount({ ...account, name: e.target.value })}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
                                placeholder="e.g., Cash, Accounts Receivable"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Account Number</label>
                                <input
                                    type="text"
                                    value={account.number}
                                    onChange={e => setAccount({ ...account, number: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
                                    placeholder="e.g., 1000, 2000"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Account Type</label>
                                <select
                                    value={account.type}
                                    onChange={e => setAccount({ ...account, type: e.target.value as AccountType })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium appearance-none"
                                >
                                    <option value="asset">Asset</option>
                                    <option value="liability">Liability</option>
                                    <option value="equity">Equity</option>
                                    <option value="revenue">Revenue</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Description</label>
                            <textarea
                                value={account.description}
                                onChange={e => setAccount({ ...account, description: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium resize-none"
                                placeholder="Purpose of this account"
                            />
                        </div>

                        {accountToEdit?.subType && (
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                                <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5" />
                                <p className="text-[10px] sm:text-xs font-medium text-blue-700">
                                    System Account: This account is used for automatic bookkeeping. Some core properties are protected.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 px-6 py-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                        >
                            Save Account
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

const ChartOfAccountsView: React.FC<{
    accounts: Account[],
    storeSettings: StoreSettings,
    onSaveAccount: (account: Account) => void,
    onDeleteAccount: (accountId: string) => void,
    onAdjustAccount: (account: Account) => void,
}> = ({ accounts, storeSettings, onSaveAccount, onDeleteAccount, onAdjustAccount }) => {
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
                                        <div className={`text-sm md:text-base font-black tracking-tight ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                                            {formatCurrency(account.balance, storeSettings)}
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

const JournalView: React.FC<{
    entries: JournalEntry[],
    accounts: Account[],
    sales: Sale[],
    customers: Customer[],
    storeSettings: StoreSettings,
    onAddEntry: (entry: Omit<JournalEntry, 'id'>) => void,
}> = ({ entries, sales, customers, storeSettings }) => {
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    const enrichedEntries = useMemo(() => {
        return entries.map(entry => {
            const isUndefinedDesc = entry.description.includes('undefined');

            if (!isUndefinedDesc) return entry;

            let cName = '';

            if (entry.source?.type === 'sale' && entry.source.id) {
                const sale = sales.find(s => s.transactionId === entry.source.id);
                if (sale) {
                    cName = sale.customerName ||
                        (sale.customerId ? customers.find(c => c.id === sale.customerId)?.name : undefined) ||
                        'Walk-in Customer';
                }
            } else if (entry.source?.type === 'payment' && entry.source.id) {
                // For payments, the ID might be the payment ID or the Sale ID depending on implementation.
                // But usually payments are children of sales.
                // Let's try to find a sale that has this payment ID.
                const sale = sales.find(s => s.payments?.some(p => p.id === entry.source.id)) ||
                    sales.find(s => s.transactionId === entry.source.id); // Fallback if source.id is actually saleId

                if (sale) {
                    cName = sale.customerName ||
                        (sale.customerId ? customers.find(c => c.id === sale.customerId)?.name : undefined) ||
                        'Walk-in Customer';
                }
            }

            if (cName) {
                let newDesc = entry.description;
                if (newDesc.includes('customer - ID undefined')) {
                    newDesc = newDesc.replace('customer - ID undefined', cName);
                } else {
                    newDesc = newDesc.replace('undefined', cName);
                }
                return { ...entry, description: newDesc };
            }

            return entry;
        });
    }, [entries, sales, customers]);

    const filteredEntries = useMemo(() => {
        let filtered = [...enrichedEntries];

        if (selectedDate) {
            filtered = filtered.filter(entry =>
                new Date(entry.date).toISOString().split('T')[0] === selectedDate
            );
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(entry =>
                entry.description.toLowerCase().includes(term) ||
                entry.lines.some(line =>
                    line.accountName.toLowerCase().includes(term) ||
                    line.accountId.toLowerCase().includes(term)
                )
            );
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [entries, selectedDate, searchTerm]);

    const totalDebits = useMemo(() =>
        filteredEntries.flatMap(e => e.lines)
            .filter(l => l.type === 'debit')
            .reduce((sum, l) => sum + l.amount, 0),
        [filteredEntries]
    );

    const totalCredits = useMemo(() =>
        filteredEntries.flatMap(e => e.lines)
            .filter(l => l.type === 'credit')
            .reduce((sum, l) => sum + l.amount, 0),
        [filteredEntries]
    );

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900">General Journal</h3>
                    <p className="text-sm text-slate-600 mt-1">View and manage all accounting entries</p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 self-start lg:self-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Dr</span>
                            <span className="font-bold text-blue-700">{formatCurrency(totalDebits, storeSettings)}</span>
                        </div>
                        <div className="hidden sm:block text-slate-300">|</div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Cr</span>
                            <span className="font-bold text-green-700">{formatCurrency(totalCredits, storeSettings)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <CalendarIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
                    />
                </div>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search entries..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
                    />
                </div>
            </div>

            {/* Journal Entries */}
            <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                    <div className="text-center py-12 md:py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BookOpenIcon className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-600 font-medium">No journal entries found</p>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or date range</p>
                    </div>
                ) : (
                    filteredEntries.map(entry => (
                        <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-colors">
                            <div className="p-4 md:p-5 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <div className="px-2.5 py-1 bg-white shadow-sm border border-slate-100 text-slate-700 text-[10px] md:text-xs font-bold rounded-lg flex items-center gap-1.5 uppercase tracking-wider">
                                                <CalendarDaysIcon className="w-3 h-3 text-slate-400" />
                                                {new Date(entry.date).toLocaleDateString()}
                                            </div>
                                            {entry.reference && (
                                                <div className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] md:text-xs font-bold rounded-lg border border-blue-100 uppercase tracking-wider">
                                                    Ref: {entry.reference}
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-bold text-slate-900 text-sm md:text-base leading-tight">{entry.description}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">ID</div>
                                        <div className="text-xs font-mono font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
                                            {entry.id.substring(0, 8)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 md:p-5 bg-white">
                                <div className="space-y-1.5 md:space-y-2">
                                    {entry.lines.map((line, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 md:w-1.5 h-10 rounded-full ${line.type === 'debit' ? 'bg-gradient-to-b from-blue-400 to-blue-600' : 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                                                    }`}></div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 text-sm truncate">{line.accountName}</div>
                                                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tight truncate">Acc: {line.accountId}</div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className={`text-base md:text-lg font-black tracking-tight ${line.type === 'debit' ? 'text-blue-700' : 'text-emerald-700'
                                                    }`}>
                                                    {formatCurrency(line.amount, storeSettings)}
                                                </div>
                                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                                    {line.type}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const CustomerStatementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    customer: Customer;
    sales: Sale[];
    storeSettings: StoreSettings;
}> = ({ isOpen, onClose, customer, sales, storeSettings }) => {
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const customerSales = sales
        .filter(s => s.customerId === customer.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const statementLines = customerSales.flatMap(sale => {
        const lines: { date: string; description: string; amount: number; type: 'invoice' | 'payment' }[] = [{
            date: sale.timestamp,
            description: `Invoice #${sale.transactionId}`,
            amount: sale.total,
            type: 'invoice' as const
        }];

        (sale.payments || []).forEach(p => {
            lines.push({
                date: p.date || '',
                description: `Payment Received - ${p.method}`,
                amount: -p.amount,
                type: 'payment' as const
            });
        });

        return lines;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const finalLines = statementLines.map(line => {
        runningBalance += line.amount;
        return { ...line, balance: runningBalance };
    });

    const handlePrint = () => {
        const printContents = printRef.current?.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow && printContents) {
            printWindow.document.write('<html lang="en"><head><title>Customer Statement</title>');
            printWindow.document.write('<style>body{font-family:sans-serif;font-size:12px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background-color:#f2f2f2;} tr:nth-child(even){background-color:#f9f9f9;} .text-right{text-align:right;} .header{margin-bottom:20px;} h1,h2,h3{margin:0;} .total-row{font-weight:bold;background-color:#f2f2f2;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                <div className="px-6 py-5 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                <DocumentChartBarIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Customer Statement</h3>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <XMarkIcon className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto overflow-x-auto" ref={printRef}>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                                <div className="mt-2 space-y-1">
                                    {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
                                    {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
                                    {customer.address && <p className="text-sm text-slate-600">{customer.address.street}, {customer.address.city}, {customer.address.state} {customer.address.zip}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-500">Statement Date</div>
                                <div className="text-lg font-bold text-slate-900">{new Date().toLocaleDateString()}</div>
                                <div className="mt-4">
                                    <div className="text-sm text-slate-500">Current Balance</div>
                                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(customer.accountBalance, storeSettings)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {finalLines.map((line, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                            {new Date(line.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${line.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                                {line.description}
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${line.type === 'payment' ? 'text-green-600' : 'text-slate-900'}`}>
                                            {formatCurrency(line.amount, storeSettings)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-slate-900">
                                            {formatCurrency(line.balance, storeSettings)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                                    <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-900">Current Balance Due</td>
                                    <td className="px-4 py-4 text-right font-bold text-blue-700">{formatCurrency(customer.accountBalance, storeSettings)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gradient-to-b from-white to-slate-50 px-6 py-5 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Print Statement
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};


const ARManagementView: React.FC<{
    sales: Sale[],
    customers: Customer[],
    storeSettings: StoreSettings,
    onRecordPayment: (saleId: string, payment: Omit<Payment, 'id'>) => void,
    onViewInvoice: (invoice: Sale) => void,
}> = ({ sales, customers, storeSettings, onRecordPayment, onViewInvoice }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
    const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
    const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<Customer | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('open');
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

    const sortedInvoices = useMemo(() => {
        return sales
            .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
    }, [sales]);

    const customersById = useMemo(() => {
        const map: Record<string, Customer> = {};
        for (const c of customers) {
            map[c.id] = c;
        }
        return map;
    }, [customers]);

    const filteredInvoices = useMemo(() => {
        const isPaid = (s: Sale) => {
            const calculatedAmountPaid = s.payments?.reduce((sum, p) => sum + p.amount, 0) ?? s.amountPaid;
            const balanceCents = Math.round((s.total - calculatedAmountPaid) * 100);
            return s.paymentStatus === 'paid' || balanceCents <= 0;
        };

        if (statusFilter === 'all') return sortedInvoices;

        if (statusFilter === 'paid') {
            return sortedInvoices.filter(s => isPaid(s));
        }

        if (statusFilter === 'overdue') {
            return sortedInvoices.filter(s => !isPaid(s) && s.dueDate && new Date(s.dueDate) < new Date());
        }

        return sortedInvoices.filter(s => !isPaid(s));
    }, [sortedInvoices, statusFilter]);

    const totalOutstanding = useMemo(() =>
        sortedInvoices.reduce((sum, inv) => {
            const calculatedAmountPaid = inv.payments?.reduce((pSum, p) => pSum + p.amount, 0) ?? inv.amountPaid;
            return sum + Math.max(0, inv.total - calculatedAmountPaid);
        }, 0),
        [sortedInvoices]
    );

    const handleRecordPaymentClick = (invoice: Sale) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    };

    const handleGenerateStatement = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setSelectedCustomerForStatement(customer);
            setIsStatementModalOpen(true);
        }
    };

    const StatusBadge: React.FC<{ invoice: Sale }> = ({ invoice }) => {
        const calculatedAmountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? invoice.amountPaid;
        const rawBalance = (invoice.total - calculatedAmountPaid);
        const balanceCents = Math.round(rawBalance * 100);
        const isPaid = balanceCents <= 0 || invoice.paymentStatus === 'paid';
        const isOverdue = !isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date();

        if (isPaid) {
            return (
                <span className="px-2.5 py-1 bg-gradient-to-r from-green-50 to-green-100 text-green-700 text-[10px] md:text-xs font-medium rounded-full">
                    Paid
                </span>
            );
        }

        if (isOverdue) {
            return (
                <span className="px-2.5 py-1 bg-gradient-to-r from-red-50 to-red-100 text-red-700 text-[10px] md:text-xs font-medium rounded-full">
                    Overdue
                </span>
            );
        }

        return (
            <span className="px-2.5 py-1 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 text-[10px] md:text-xs font-medium rounded-full">
                Pending
            </span>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900">Accounts Receivable</h3>
                    <p className="text-sm text-slate-600 mt-1">Manage customer invoices and payments</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">Total Outstanding</div>
                        <div className="text-lg md:text-xl font-bold text-blue-900">{formatCurrency(totalOutstanding, storeSettings)}</div>
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['open', 'overdue', 'paid', 'all'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 whitespace-nowrap ${statusFilter === status
                                ? 'bg-blue-900 border-blue-900 text-white shadow-lg'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            {status === 'all' ? 'All History' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>

                <div className="flex-1"></div>

                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <UsersIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <select
                        onChange={e => e.target.value && handleGenerateStatement(e.target.value)}
                        value={''}
                        className="w-full md:w-64 pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none text-sm font-medium text-slate-700 shadow-sm"
                    >
                        <option value="" disabled>Generate Statement</option>
                        {customers.filter(c => c.accountBalance > 0).map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({formatCurrency(c.accountBalance, storeSettings)})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredInvoices.map(invoice => {
                    const calculatedAmountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? invoice.amountPaid;
                    const rawBalance = (invoice.total - calculatedAmountPaid);
                    const balanceCents = Math.round(rawBalance * 100);
                    const balanceDue = Math.max(0, balanceCents) / 100;
                    const isPaid = balanceCents <= 0 || invoice.paymentStatus === 'paid';
                    const isOverdue = !isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date();
                    const customerName = invoice.customerName || (invoice.customerId ? customersById[invoice.customerId]?.name : undefined) || 'Unknown Customer';

                    return (
                        <div
                            key={invoice.transactionId}
                            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group active:bg-slate-50 transition-colors"
                            onClick={() => onViewInvoice(invoice)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-slate-900">#{invoice.transactionId}</span>
                                        <StatusBadge invoice={invoice} />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <UsersIcon className="w-3.5 h-3.5" />
                                        <span>{customerName}</span>
                                    </div>
                                </div>
                                <div className="relative" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => setActiveActionMenu(activeActionMenu === invoice.transactionId ? null : invoice.transactionId)}
                                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full"
                                    >
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </button>
                                    {activeActionMenu === invoice.transactionId && (
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-1 animate-fade-in-up">
                                            <button
                                                onClick={() => {
                                                    onViewInvoice(invoice);
                                                    setActiveActionMenu(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                                View Details
                                            </button>
                                            {!isPaid && (
                                                <button
                                                    onClick={() => {
                                                        handleRecordPaymentClick(invoice);
                                                        setActiveActionMenu(null);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                                                >
                                                    <CalculatorIcon className="w-4 h-4" />
                                                    Record Payment
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Due Date</div>
                                    <div className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Balance Due</div>
                                    <div className="text-sm font-bold text-slate-900">
                                        {formatCurrency(balanceDue, storeSettings)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Balance Due</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredInvoices.map(invoice => {
                                const calculatedAmountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? invoice.amountPaid;
                                const rawBalance = (invoice.total - calculatedAmountPaid);
                                const balanceCents = Math.round(rawBalance * 100);
                                const balanceDue = Math.max(0, balanceCents) / 100;
                                const isPaid = balanceCents <= 0 || invoice.paymentStatus === 'paid';
                                const isOverdue = !isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date();
                                const customerName = invoice.customerName || (invoice.customerId ? customersById[invoice.customerId]?.name : undefined) || 'Unknown Customer';

                                return (
                                    <tr
                                        key={invoice.transactionId}
                                        onClick={() => onViewInvoice(invoice)}
                                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-sm font-medium text-blue-700">{invoice.transactionId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                                                    <UsersIcon className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <span className="text-sm text-slate-900 font-medium">{customerName}</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-slate-900">{formatCurrency(balanceDue, storeSettings)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <StatusBadge invoice={invoice} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                            {!isPaid && (
                                                <button
                                                    onClick={() => handleRecordPaymentClick(invoice)}
                                                    className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200"
                                                >
                                                    Record Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredInvoices.length === 0 && (
                <div className="text-center py-12 md:py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <DocumentChartBarIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-600 font-medium">No open invoices found</p>
                    <p className="text-sm text-slate-500 mt-1">All invoices are paid up!</p>
                </div>
            )}

            {
                selectedInvoice && (
                    <UnifiedRecordPaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => {
                            setIsPaymentModalOpen(false);
                            setActiveActionMenu(null);
                        }}
                        invoiceId={selectedInvoice.transactionId}
                        balanceDue={Math.max(0, selectedInvoice.total - (selectedInvoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? selectedInvoice.amountPaid))}
                        customerOrSupplierName={selectedInvoice.customerName || (selectedInvoice.customerId ? customersById[selectedInvoice.customerId]?.name : undefined)}
                        paymentMethods={storeSettings.paymentMethods}
                        onSave={onRecordPayment}
                        storeSettings={storeSettings}
                    />
                )
            }
            {
                selectedCustomerForStatement && (
                    <CustomerStatementModal
                        isOpen={isStatementModalOpen}
                        onClose={() => {
                            setIsStatementModalOpen(false);
                            setSelectedCustomerForStatement(null);
                        }}
                        customer={selectedCustomerForStatement}
                        sales={sales}
                        storeSettings={storeSettings}
                    />
                )
            }
        </div >
    );
};

const APManagementView: React.FC<{
    supplierInvoices: SupplierInvoice[],
    purchaseOrders: PurchaseOrder[],
    storeSettings: StoreSettings,
    onRecordPayment: (invoiceId: string, payment: Omit<SupplierPayment, 'id'>) => void,
    onSaveInvoice: (invoice: SupplierInvoice) => void,
    onViewInvoice: (invoice: SupplierInvoice) => void,
    suppliers: Supplier[],
    onOpenInvoiceForm: () => void,
}> = ({ supplierInvoices, storeSettings, onRecordPayment, onViewInvoice, onOpenInvoiceForm }) => {
    const [invoiceToPay, setInvoiceToPay] = useState<SupplierInvoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

    const StatusBadge: React.FC<{ status: SupplierInvoice['status'] }> = ({ status }) => {
        const statusConfig = {
            unpaid: { color: 'from-amber-500 to-yellow-500', bg: 'bg-gradient-to-r from-amber-50 to-yellow-100', text: 'text-amber-700' },
            partially_paid: { color: 'from-blue-500 to-blue-600', bg: 'bg-gradient-to-r from-blue-50 to-blue-100', text: 'text-blue-700' },
            paid: { color: 'from-green-500 to-emerald-500', bg: 'bg-gradient-to-r from-green-50 to-emerald-100', text: 'text-green-700' },
            overdue: { color: 'from-red-500 to-red-600', bg: 'bg-gradient-to-r from-red-50 to-red-100', text: 'text-red-700' },
        };
        const config = statusConfig[status] || statusConfig.unpaid;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium ${config.bg} ${config.text}`}>
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-br ${config.color}`}></div>
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
        );
    };

    const invoicesWithStatus = useMemo(() => {
        return supplierInvoices.map(inv => {
            if (inv.status !== 'paid' && new Date(inv.dueDate) < new Date()) {
                return { ...inv, status: 'overdue' as const };
            }
            return inv;
        }).sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    }, [supplierInvoices]);

    const filteredInvoices = useMemo(() => {
        if (statusFilter === 'all') return invoicesWithStatus;
        if (statusFilter === 'overdue') {
            return invoicesWithStatus.filter(inv => inv.status === 'overdue');
        }
        return invoicesWithStatus.filter(inv => inv.status === statusFilter);
    }, [invoicesWithStatus, statusFilter]);

    const totalOutstanding = useMemo(() =>
        filteredInvoices.reduce((sum, inv) => sum + (inv.amount - inv.amountPaid), 0),
        [filteredInvoices]
    );

    const overdueCount = useMemo(() =>
        invoicesWithStatus.filter(inv => inv.status === 'overdue').length,
        [invoicesWithStatus]
    );

    const unpaidCount = useMemo(() =>
        invoicesWithStatus.filter(inv => inv.status === 'unpaid').length,
        [invoicesWithStatus]
    );

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900">Accounts Payable</h3>
                    <p className="text-sm text-slate-600 mt-1">Manage supplier invoices and payments</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                        <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Total Outstanding</div>
                        <div className="text-lg md:text-xl font-bold text-amber-900">{formatCurrency(totalOutstanding, storeSettings)}</div>
                    </div>
                    <button
                        onClick={onOpenInvoiceForm}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md shadow-blue-100"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="whitespace-nowrap">Record Invoice</span>
                    </button>
                </div>
            </div>

            {/* Stats and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <div className="text-sm font-medium text-slate-700">Total Invoices</div>
                    <div className="text-2xl font-bold text-slate-900">{invoicesWithStatus.length}</div>
                </div>
                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                    <div className="text-sm font-medium text-red-700">Overdue</div>
                    <div className="text-2xl font-bold text-red-900">{overdueCount}</div>
                </div>
                <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                    <div className="text-sm font-medium text-amber-700">Unpaid</div>
                    <div className="text-2xl font-bold text-amber-900">{unpaidCount}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {['all', 'unpaid', 'overdue', 'paid'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${statusFilter === status
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {status === 'all' ? 'All Invoices' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredInvoices.map(invoice => (
                    <div
                        key={invoice.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group active:bg-slate-50 transition-colors"
                        onClick={() => onViewInvoice(invoice)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</span>
                                    <StatusBadge status={invoice.status} />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                    <span>{invoice.supplierName}</span>
                                </div>
                            </div>
                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setActiveActionMenu(activeActionMenu === invoice.id ? null : invoice.id)}
                                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </button>
                                {activeActionMenu === invoice.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-1 animate-fade-in-up">
                                        <button
                                            onClick={() => {
                                                onViewInvoice(invoice);
                                                setActiveActionMenu(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                            View Details
                                        </button>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => {
                                                    setInvoiceToPay(invoice);
                                                    setActiveActionMenu(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                                            >
                                                <CalculatorIcon className="w-4 h-4" />
                                                Record Payment
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Due Date</div>
                                <div className={`text-sm font-semibold ${invoice.status === 'overdue' ? 'text-red-600' : 'text-slate-900'}`}>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Outstanding</div>
                                <div className="text-sm font-bold text-slate-900">
                                    {formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">PO #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Balance Due</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredInvoices.map(invoice => (
                                <tr
                                    key={invoice.id}
                                    onClick={() => onViewInvoice(invoice)}
                                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="text-sm font-medium text-slate-900">{invoice.invoiceNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg flex items-center justify-center">
                                                <BuildingOfficeIcon className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <span className="text-sm text-slate-900">{invoice.supplierName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                        {invoice.poNumber}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-bold text-slate-900">{formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={invoice.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => setInvoiceToPay(invoice)}
                                                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200"
                                            >
                                                Record Payment
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12">
                                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <DocumentChartBarIcon className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-600 font-medium">No invoices found</p>
                                        <p className="text-sm text-slate-500 mt-1">Try changing your filters</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {invoiceToPay && (
                <UnifiedRecordPaymentModal
                    isOpen={!!invoiceToPay}
                    onClose={() => {
                        setInvoiceToPay(null);
                        setActiveActionMenu(null);
                    }}
                    invoiceId={invoiceToPay.id}
                    invoiceNumber={invoiceToPay.invoiceNumber}
                    balanceDue={invoiceToPay.amount - invoiceToPay.amountPaid}
                    customerOrSupplierName={invoiceToPay.supplierName}
                    paymentMethods={storeSettings.supplierPaymentMethods || storeSettings.paymentMethods}
                    onSave={onRecordPayment}
                    storeSettings={storeSettings}
                />
            )}
        </div>
    );
};

const TaxReportView: React.FC<{ sales: Sale[], storeSettings: StoreSettings }> = ({ sales, storeSettings }) => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const filteredData = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const relevantSales = sales.filter(s => {
            const saleDate = new Date(s.timestamp);
            return saleDate >= start && saleDate <= end;
        });

        const totalSales = relevantSales.reduce((sum, s) => sum + s.subtotal, 0);
        const totalTax = relevantSales.reduce((sum, s) => sum + s.tax, 0);
        const totalTransactions = relevantSales.reduce((sum, s) => sum + s.total, 0);

        return {
            totalSales,
            totalTax,
            totalTransactions,
            numberOfTransactions: relevantSales.length,
            averageTransaction: relevantSales.length > 0 ? totalTransactions / relevantSales.length : 0
        };
    }, [sales, startDate, endDate]);

    const taxRate = storeSettings.taxRate;

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900">Sales Tax Report</h3>
                    <p className="text-sm text-slate-600 mt-1">Track and report sales tax collections</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative group flex-1 sm:flex-none">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-700"
                        />
                    </div>
                    <span className="hidden sm:block text-slate-400 font-bold px-1">/</span>
                    <div className="relative group flex-1 sm:flex-none">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Tax Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-blue-700">Taxable Sales</div>
                        </div>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                    <div className="text-[10px] font-medium text-blue-600 mt-2 uppercase tracking-wider">Subject to Tax</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
                            <BanknotesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Tax Collected</div>
                        </div>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-emerald-900 tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                    <div className="text-[10px] font-medium text-emerald-600 mt-2 uppercase tracking-wider">At {taxRate}% tax rate</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-purple-600 rounded-xl shadow-lg shadow-purple-200">
                            <ReceiptPercentIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-purple-700">Transactions</div>
                        </div>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-purple-900 tracking-tight">{filteredData.numberOfTransactions}</div>
                    <div className="text-[10px] font-medium text-purple-600 mt-2 uppercase tracking-wider">Total Count</div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-slate-600 rounded-xl shadow-lg shadow-slate-200">
                            <CalculatorIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Avg Transaction</div>
                        </div>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(filteredData.averageTransaction, storeSettings)}</div>
                    <div className="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-wider">Inc. Tax</div>
                </div>
            </div>

            {/* Tax Calculation Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                            <CalculatorIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Tax Calculation Breakdown</h3>
                    </div>
                </div>
                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Taxable Sales</div>
                            <div className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                            <div className="text-[10px] text-slate-500 mt-2 font-medium">Base amount for calculation</div>
                        </div>

                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 hover:border-blue-200 transition-colors">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-blue-700 mb-1">Tax Collected</div>
                            <div className="text-xl font-black text-blue-900 tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                            <div className="text-[10px] text-blue-600 mt-2 font-medium">Amount to be remitted ({taxRate}%)</div>
                        </div>

                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-colors">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mb-1">Total inclusive</div>
                            <div className="text-xl font-black text-emerald-900 tracking-tight">
                                {formatCurrency(filteredData.totalSales + filteredData.totalTax, storeSettings)}
                            </div>
                            <div className="text-[10px] text-emerald-600 mt-2 font-medium">Sum of sales and tax</div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                            <InformationCircleIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">
                                This report summarizes the total sales tax collected at the rate of {taxRate}% for the selected period.
                                The tax amount of {formatCurrency(filteredData.totalTax, storeSettings)} should be remitted to the relevant tax authorities.
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                                Note: This is a simplified report based on a single tax rate. For multi-rate tax management, further configuration is required.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FinancialStatementsView: React.FC<{ accounts: Account[], journalEntries: JournalEntry[], storeSettings: StoreSettings }> = ({ accounts, journalEntries, storeSettings }) => {
    const [activeReport, setActiveReport] = React.useState('pnl');
    const [pnlStartDate, setPnlStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [pnlEndDate, setPnlEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const pnlData = useMemo(() => {
        const start = new Date(pnlStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(pnlEndDate);
        end.setHours(23, 59, 59, 999);

        const revenueAccounts = new Map<string, { name: string, balance: number }>();
        const expenseAccounts = new Map<string, { name: string, balance: number }>();

        const revenueAccountIds = new Set(accounts.filter(a => a.type === 'revenue').map(a => a.id));
        const expenseAccountIds = new Set(accounts.filter(a => a.type === 'expense').map(a => a.id));

        const relevantEntries = journalEntries.filter(e => {
            const entryDate = new Date(e.date);
            return entryDate >= start && entryDate <= end;
        });

        for (const entry of relevantEntries) {
            for (const line of entry.lines) {
                if (revenueAccountIds.has(line.accountId)) {
                    const acc = revenueAccounts.get(line.accountId) || { name: line.accountName, balance: 0 };
                    acc.balance += (line.type === 'credit' ? line.amount : -line.amount);
                    revenueAccounts.set(line.accountId, acc);
                } else if (expenseAccountIds.has(line.accountId)) {
                    const acc = expenseAccounts.get(line.accountId) || { name: line.accountName, balance: 0 };
                    acc.balance += (line.type === 'debit' ? line.amount : -line.amount);
                    expenseAccounts.set(line.accountId, acc);
                }
            }
        }

        const totalRevenue = Array.from(revenueAccounts.values()).reduce((sum, acc) => sum + acc.balance, 0);
        const totalExpenses = Array.from(expenseAccounts.values()).reduce((sum, acc) => sum + acc.balance, 0);
        const netIncome = totalRevenue - totalExpenses;

        return {
            revenueAccounts: Array.from(revenueAccounts.values()).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
            expenseAccounts: Array.from(expenseAccounts.values()).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
            totalRevenue,
            totalExpenses,
            netIncome
        };
    }, [accounts, journalEntries, pnlStartDate, pnlEndDate]);

    const balanceSheetData = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'asset').sort((a, b) => a.number.localeCompare(b.number));
        const liabilities = accounts.filter(a => a.type === 'liability').sort((a, b) => a.number.localeCompare(b.number));
        const equity = accounts.filter(a => a.type === 'equity').sort((a, b) => a.number.localeCompare(b.number));

        const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
        const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

        return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
    }, [accounts]);

    const renderPNL = () => (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900">Profit & Loss Statement</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={pnlStartDate}
                            onChange={e => setPnlStartDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-700"
                        />
                    </div>
                    <span className="hidden sm:block text-slate-400 font-bold px-1">/</span>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={pnlEndDate}
                            onChange={e => setPnlEndDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-700"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Revenue Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-50 bg-emerald-50/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-100">
                                    <ArrowTrendingUpIcon className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="font-bold text-slate-900">Revenue</h4>
                            </div>
                            <div className="text-lg font-black text-emerald-700 tracking-tight">
                                {formatCurrency(pnlData.totalRevenue, storeSettings)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 md:p-5 flex-1 bg-white">
                        <div className="space-y-1">
                            {pnlData.revenueAccounts.map(acc => (
                                <div key={acc.name} className="flex justify-between items-center p-3 hover:bg-slate-50/50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-100">
                                    <span className="text-sm font-medium text-slate-700">{acc.name}</span>
                                    <span className="text-sm font-bold text-emerald-700 tracking-tight">
                                        {formatCurrency(acc.balance, storeSettings)}
                                    </span>
                                </div>
                            ))}
                            {pnlData.revenueAccounts.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">No revenue entries</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-50 bg-red-50/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-100">
                                    <ArrowTrendingDownIcon className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="font-bold text-slate-900">Expenses</h4>
                            </div>
                            <div className="text-lg font-black text-red-700 tracking-tight">
                                {formatCurrency(pnlData.totalExpenses, storeSettings)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 md:p-5 flex-1 bg-white">
                        <div className="space-y-1">
                            {pnlData.expenseAccounts.map(acc => (
                                <div key={acc.name} className="flex justify-between items-center p-3 hover:bg-slate-50/50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-100">
                                    <span className="text-sm font-medium text-slate-700">{acc.name}</span>
                                    <span className="text-sm font-bold text-red-700 tracking-tight">
                                        ({formatCurrency(acc.balance, storeSettings)})
                                    </span>
                                </div>
                            ))}
                            {pnlData.expenseAccounts.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">No expense entries</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Net Income Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <CalculatorIcon className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-100">Net Income Result</h4>
                            <p className="text-sm text-slate-400 mt-1">Total revenue minus all expenses</p>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className={`text-3xl md:text-4xl font-black tracking-tight ${pnlData.netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(pnlData.netIncome, storeSettings)}
                        </div>
                        <div className="flex items-center justify-center md:justify-end gap-2 mt-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${pnlData.netIncome >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {pnlData.netIncome >= 0 ? 'Profit' : 'Loss'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBalanceSheet = () => (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-slate-900">Balance Sheet</h3>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    As of {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Assets */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-50 bg-blue-50/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
                                    <ArrowTrendingUpIcon className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="font-bold text-slate-900">Assets</h4>
                            </div>
                            <div className="text-lg font-black text-blue-700 tracking-tight">
                                {formatCurrency(balanceSheetData.totalAssets, storeSettings)}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 md:p-5 flex-1 bg-white">
                        <div className="space-y-1">
                            {balanceSheetData.assets.map(acc => (
                                <div key={acc.id} className="flex justify-between items-center p-3 hover:bg-slate-50/50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        <span className="text-sm font-medium text-slate-700">{acc.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-700 tracking-tight">
                                        {formatCurrency(acc.balance, storeSettings)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                    {/* Liabilities */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-50 bg-red-50/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-100">
                                        <ArrowTrendingDownIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <h4 className="font-bold text-slate-900">Liabilities</h4>
                                </div>
                                <div className="text-lg font-black text-red-700 tracking-tight">
                                    {formatCurrency(balanceSheetData.totalLiabilities, storeSettings)}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 md:p-5 bg-white">
                            <div className="space-y-1">
                                {balanceSheetData.liabilities.map(acc => (
                                    <div key={acc.id} className="flex justify-between items-center p-3 hover:bg-slate-50/50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <span className="text-sm font-medium text-slate-700">{acc.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-red-700 tracking-tight">
                                            {formatCurrency(acc.balance, storeSettings)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Equity */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-50 bg-purple-50/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-600 rounded-xl shadow-lg shadow-purple-100">
                                        <ChartBarIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <h4 className="font-bold text-slate-900">Equity</h4>
                                </div>
                                <div className="text-lg font-black text-purple-700 tracking-tight">
                                    {formatCurrency(balanceSheetData.totalEquity, storeSettings)}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 md:p-5 bg-white">
                            <div className="space-y-1">
                                {balanceSheetData.equity.map(acc => (
                                    <div key={acc.id} className="flex justify-between items-center p-3 hover:bg-slate-50/50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                            <span className="text-sm font-medium text-slate-700">{acc.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-purple-700 tracking-tight">
                                            {formatCurrency(acc.balance, storeSettings)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Balance Sheet Summary */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Assets</div>
                        <div className="text-lg md:text-xl font-black text-blue-700">
                            {formatCurrency(balanceSheetData.totalAssets, storeSettings)}
                        </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Liabilities</div>
                        <div className="text-lg md:text-xl font-black text-red-700">
                            {formatCurrency(balanceSheetData.totalLiabilities, storeSettings)}
                        </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Equity</div>
                        <div className="text-lg md:text-xl font-black text-purple-700">
                            {formatCurrency(balanceSheetData.totalEquity, storeSettings)}
                        </div>
                    </div>
                </div>
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-200 text-center">
                    <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Equation Audit</div>
                    <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-black border-2 ${Math.abs(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)) < 0.01
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        Assets = Liabilities + Equity: {
                            Math.abs(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)) < 0.01
                                ? '✓ Perfectly Balanced'
                                : '✗ Equation Imbalance'
                        }
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Financial Statements</h3>
                    <p className="text-sm text-slate-600 mt-1">View and analyze your business health</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start lg:self-auto">
                    <button
                        onClick={() => setActiveReport('pnl')}
                        className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeReport === 'pnl'
                            ? 'bg-white text-blue-700 shadow-md ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Profit & Loss
                    </button>
                    <button
                        onClick={() => setActiveReport('balance_sheet')}
                        className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeReport === 'balance_sheet'
                            ? 'bg-white text-blue-700 shadow-md ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Balance Sheet
                    </button>
                </div>
            </div>
            <div className="animate-fade-in">
                {activeReport === 'pnl' ? renderPNL() : renderBalanceSheet()}
            </div>
        </div>
    );
};

// --- Main Accounting Page Component ---
interface AccountingPageProps {
    accounts: Account[];
    journalEntries: JournalEntry[];
    sales: Sale[];
    customers: Customer[];
    suppliers: Supplier[];
    supplierInvoices: SupplierInvoice[];
    purchaseOrders: PurchaseOrder[];
    onSaveAccount: (account: Account) => void;
    onDeleteAccount: (accountId: string) => void;
    onAddManualJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
    onRecordPayment: (saleId: string, payment: Omit<Payment, 'id'>) => void;
    onSaveSupplierInvoice: (invoice: SupplierInvoice) => void;
    onRecordSupplierPayment: (invoiceId: string, payment: Omit<SupplierPayment, 'id'>) => void;
    isLoading: boolean;
    error: string | null;
    storeSettings: StoreSettings;
}

const AccountingPage: React.FC<AccountingPageProps> = ({
    accounts, journalEntries, sales, customers, suppliers, supplierInvoices, purchaseOrders,
    onSaveAccount, onDeleteAccount, onAddManualJournalEntry, onRecordPayment,
    onSaveSupplierInvoice, onRecordSupplierPayment,
    isLoading, error, storeSettings
}) => {
    const [activeTab, setActiveTab] = React.useState('dashboard');
    const [isTabMenuOpen, setIsTabMenuOpen] = React.useState(false);
    const [isSupplierInvoiceFormOpen, setIsSupplierInvoiceFormOpen] = React.useState(false);
    const [editingSupplierInvoice, setEditingSupplierInvoice] = React.useState<SupplierInvoice | null>(null);
    const [viewingAPInvoice, setViewingAPInvoice] = React.useState<SupplierInvoice | null>(null);
    const [viewingARInvoice, setViewingARInvoice] = React.useState<Sale | null>(null);
    const [isRecordSupplierPaymentOpen, setIsRecordSupplierPaymentOpen] = React.useState(false);
    const [invoiceToPayAP, setInvoiceToPayAP] = React.useState<SupplierInvoice | null>(null);
    const [isRecordARPaymentOpen, setIsRecordARPaymentOpen] = React.useState(false);
    const [invoiceToPayAR, setInvoiceToPayAR] = React.useState<Sale | null>(null);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = React.useState(false);
    const [accountToAdjust, setAccountToAdjust] = React.useState<Account | null>(null);
    const [isExpenseFormOpen, setIsExpenseFormOpen] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
    const [expenses, setExpenses] = React.useState<Expense[]>([]);

    const availableTabs = React.useRef<string[]>([
        'dashboard',
        'reports',
        'ar_management',
        'ap_management',
        'expenses',
        'taxes',
        'chart_of_accounts',
        'journal',
    ]);

    React.useEffect(() => {
        const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
        if (hash && availableTabs.current.includes(hash)) {
            setActiveTab(hash);
        }
    }, []);

    const setActiveTabAndHash = (tabName: string) => {
        setActiveTab(tabName);
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `#${tabName}`);
        }
    };

    const handleSelectTab = (tabName: string) => {
        setActiveTabAndHash(tabName);
        setIsTabMenuOpen(false);
    };

    const handleOpenRecordPaymentAP = (invoice: SupplierInvoice) => {
        setInvoiceToPayAP(invoice);
        setIsRecordSupplierPaymentOpen(true);
        setViewingAPInvoice(null);
    };

    const handleOpenRecordPaymentAR = (invoice: Sale) => {
        setInvoiceToPayAR(invoice);
        setIsRecordARPaymentOpen(true);
        // Optionally close the detail modal, or keep it open. 
        // For better UX, we might want to close the detail modal or keep it and update it.
        // Let's close it for now to avoid stacked modals unless intended.
        // Actually, let's keep it open or close it? The user didn't specify.
        // The implementation plan checklist just said "Enable the button".
        // Let's close the detail modal to focus on payment.
        setViewingARInvoice(null);
    };

    const handleAdjustAccount = async (
        accountId: string,
        adjustmentAmount: number,
        offsetAccountId: string,
        offsetAccountName: string,
        description: string
    ) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/accounting/accounts/${accountId}/adjust`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    adjustmentAmount,
                    offsetAccountId,
                    offsetAccountName,
                    description
                })
            });

            if (response.ok) {
                // Trigger a page reload to refresh data
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.message || 'Error adjusting account balance');
            }
        } catch (error) {
            console.error('Error adjusting account:', error);
            alert('Error adjusting account balance');
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading accounting data...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200 p-6">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                <span className="text-white text-xs">!</span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-900">Error Loading Data</h4>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'ar_management':
                return <ARManagementView sales={sales} customers={customers} storeSettings={storeSettings} onRecordPayment={onRecordPayment} onViewInvoice={setViewingARInvoice} />
            case 'ap_management':
                return <APManagementView
                    supplierInvoices={supplierInvoices}
                    purchaseOrders={purchaseOrders}
                    suppliers={suppliers}
                    storeSettings={storeSettings}
                    onRecordPayment={onRecordSupplierPayment}
                    onSaveInvoice={onSaveSupplierInvoice}
                    onViewInvoice={setViewingAPInvoice}
                    onOpenInvoiceForm={() => { setEditingSupplierInvoice(null); setIsSupplierInvoiceFormOpen(true); }}
                />
            case 'chart_of_accounts':
                return <ChartOfAccountsView
                    accounts={accounts}
                    storeSettings={storeSettings}
                    onSaveAccount={onSaveAccount}
                    onDeleteAccount={onDeleteAccount}
                    onAdjustAccount={(account) => {
                        setAccountToAdjust(account);
                        setIsAdjustmentModalOpen(true);
                    }}
                />;
            case 'journal':
                return <JournalView entries={journalEntries} accounts={accounts} sales={sales} customers={customers} storeSettings={storeSettings} onAddEntry={onAddManualJournalEntry} />;
            case 'expenses':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Expenses</h2>
                                <p className="text-sm text-slate-600 mt-1">Record and manage business expenses</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingExpense(null);
                                    setIsExpenseFormOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span className="font-bold text-sm">Record Expense</span>
                            </button>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <p className="text-center text-slate-500 py-8">Expense recording feature ready. Click "Record Expense" to get started.</p>
                        </div>
                    </div>
                );
            case 'taxes':
                return <TaxReportView sales={sales} storeSettings={storeSettings} />;
            case 'reports':
                return <FinancialStatementsView accounts={accounts} journalEntries={journalEntries} storeSettings={storeSettings} />;
            case 'dashboard':
            default:
                return <AccountingDashboard accounts={accounts} journalEntries={journalEntries} storeSettings={storeSettings} />;
        }
    };

    const TabButton: React.FC<{ tabName: string, label: string, shortLabel?: string, icon?: React.ReactNode }> = ({ tabName, label, shortLabel, icon }) => {
        const isActive = activeTab === tabName;
        return (
            <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTabAndHash(tabName)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`}
            >
                {icon && <span className="w-4 h-4">{icon}</span>}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden inline">{shortLabel ?? label}</span>
            </button>
        );
    };

    const tabConfig = [
        { tabName: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: <ChartBarIcon className="w-4 h-4" /> },
        { tabName: 'reports', label: 'Reports', shortLabel: 'Reports', icon: <DocumentChartBarIcon className="w-4 h-4" /> },
        { tabName: 'ar_management', label: 'Accounts Receivable', shortLabel: 'A/R', icon: <ArrowTrendingUpIcon className="w-4 h-4" /> },
        { tabName: 'ap_management', label: 'Accounts Payable', shortLabel: 'A/P', icon: <ArrowTrendingDownIcon className="w-4 h-4" /> },
        { tabName: 'expenses', label: 'Expenses', shortLabel: 'Expenses', icon: <BanknotesIcon className="w-4 h-4" /> },
        { tabName: 'taxes', label: 'Taxes', shortLabel: 'Taxes', icon: <ReceiptPercentIcon className="w-4 h-4" /> },
        { tabName: 'chart_of_accounts', label: 'Chart of Accounts', shortLabel: 'Accounts', icon: <BookOpenIcon className="w-4 h-4" /> },
        { tabName: 'journal', label: 'Journal', shortLabel: 'Journal', icon: <ClipboardDocumentListIcon className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <Header
                title="Accounting"
                showSearch={false}
                rightContent={
                    <button
                        type="button"
                        className="sm:hidden p-2 rounded-lg text-slate-600 active:bg-slate-100"
                        aria-haspopup="menu"
                        aria-expanded={isTabMenuOpen}
                        aria-controls="accounting-tab-menu"
                        onClick={() => setIsTabMenuOpen(o => !o)}
                    >
                        <GridIcon className="w-5 h-5" />
                    </button>
                }
            />

            <main className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Desktop Tabs */}
                    <div className="hidden sm:flex items-center gap-2 mb-8 p-2 bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                        {tabConfig.map((tab) => (
                            <TabButton key={tab.tabName} {...tab} />
                        ))}
                    </div>

                    {/* Mobile Tab Menu (Floating Grid) */}
                    {isTabMenuOpen && (
                        <div
                            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm sm:hidden animate-fade-in"
                            onClick={() => setIsTabMenuOpen(false)}
                        >
                            <div
                                className="absolute top-[70px] right-4 left-4 bg-white rounded-3xl shadow-2xl p-5 animate-fade-in-up border border-slate-100"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="grid grid-cols-3 gap-4">
                                    {tabConfig.map((tab) => {
                                        const isActive = activeTab === tab.tabName;
                                        return (
                                            <button
                                                key={tab.tabName}
                                                onClick={() => handleSelectTab(tab.tabName)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${isActive
                                                    ? 'bg-slate-900 text-white shadow-lg'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <div className={`mb-2 p-2.5 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                                                    {React.cloneElement(tab.icon as React.ReactElement, { className: "w-6 h-6" })}
                                                </div>
                                                <span className="text-[10px] font-bold text-center leading-tight">
                                                    {tab.shortLabel || tab.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="animate-fade-in">
                        {renderContent()}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <SupplierInvoiceFormModal
                isOpen={isSupplierInvoiceFormOpen}
                onClose={() => setIsSupplierInvoiceFormOpen(false)}
                onSave={onSaveSupplierInvoice}
                invoiceToEdit={editingSupplierInvoice}
                purchaseOrders={purchaseOrders}
                suppliers={suppliers}
            />
            {viewingAPInvoice && (
                <SupplierInvoiceDetailModal
                    isOpen={!!viewingAPInvoice}
                    onClose={() => setViewingAPInvoice(null)}
                    invoice={viewingAPInvoice}
                    onRecordPayment={handleOpenRecordPaymentAP}
                    storeSettings={storeSettings}
                />
            )}
            {invoiceToPayAP && (
                <RecordSupplierPaymentModal
                    isOpen={isRecordSupplierPaymentOpen}
                    onClose={() => setIsRecordSupplierPaymentOpen(false)}
                    invoice={invoiceToPayAP}
                    onSave={onRecordSupplierPayment}
                    storeSettings={storeSettings}
                />
            )}
            {viewingARInvoice && (
                <SalesInvoiceDetailModal
                    isOpen={!!viewingARInvoice}
                    onClose={() => setViewingARInvoice(null)}
                    invoice={sales.find(s => s.transactionId === viewingARInvoice.transactionId) || viewingARInvoice}
                    onRecordPayment={handleOpenRecordPaymentAR}
                    storeSettings={storeSettings}
                    customerName={viewingARInvoice.customerName || (viewingARInvoice.customerId ? (customers.find(c => c.id === viewingARInvoice.customerId)?.name) : undefined) || undefined}
                />
            )}
            {invoiceToPayAR && (
                <RecordPaymentModal
                    isOpen={isRecordARPaymentOpen}
                    onClose={() => setIsRecordARPaymentOpen(false)}
                    invoice={sales.find(s => s.transactionId === invoiceToPayAR.transactionId) || invoiceToPayAR}
                    onSave={onRecordPayment}
                    storeSettings={storeSettings}
                    customerName={invoiceToPayAR.customerName || (invoiceToPayAR.customerId ? (customers.find(c => c.id === invoiceToPayAR.customerId)?.name) : undefined) || undefined}
                />
            )}

            {/* Account Adjustment Modal */}
            {accountToAdjust && (
                <AccountAdjustmentModal
                    isOpen={isAdjustmentModalOpen}
                    onClose={() => {
                        setIsAdjustmentModalOpen(false);
                        setAccountToAdjust(null);
                    }}
                    onSave={(amount, offsetId, offsetName, desc) => {
                        handleAdjustAccount(accountToAdjust.id, amount, offsetId, offsetName, desc);
                        setIsAdjustmentModalOpen(false);
                        setAccountToAdjust(null);
                    }}
                    account={accountToAdjust}
                    accounts={accounts}
                />
            )}

            {/* Expense Form Modal */}
            <ExpenseFormModal
                isOpen={isExpenseFormOpen}
                onClose={() => {
                    setIsExpenseFormOpen(false);
                    setEditingExpense(null);
                }}
                onSave={async (expense) => {
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch('/api/expenses', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(expense)
                        });

                        if (response.ok) {
                            // Reload the page to refresh data
                            window.location.reload();
                        } else {
                            const data = await response.json();
                            alert(data.message || 'Error recording expense');
                        }
                    } catch (error) {
                        console.error('Error recording expense:', error);
                        alert('Error recording expense');
                    }
                    setIsExpenseFormOpen(false);
                    setEditingExpense(null);
                }}
                expenseToEdit={editingExpense}
                accounts={accounts}
            />
        </div>
    );
};

export default AccountingPage;