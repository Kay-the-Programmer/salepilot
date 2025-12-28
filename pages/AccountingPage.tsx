
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Account, JournalEntry, StoreSettings, AccountType, Sale, Customer, Payment, SupplierInvoice, SupplierPayment, PurchaseOrder, Supplier } from '../types';
import Header from '../components/Header';
import { formatCurrency } from '../utils/currency';
import PlusIcon from '../components/icons/PlusIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import PrinterIcon from '../components/icons/PrinterIcon';
import RecordSupplierPaymentModal from '../components/accounting/RecordSupplierPaymentModal';
import SupplierInvoiceFormModal from '../components/accounting/SupplierInvoiceFormModal';
import SupplierInvoiceDetailModal from '../components/accounting/SupplierInvoiceDetailModal';
import SalesInvoiceDetailModal from '../components/accounting/SalesInvoiceDetailModal';

// --- Subcomponents for AccountingPage ---
const AccountingDashboard: React.FC<{ accounts: Account[], journalEntries: JournalEntry[], storeSettings: StoreSettings }> = ({ accounts, journalEntries, storeSettings }) => {


    const recentTransactions = useMemo(() => {
        return [...journalEntries]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [journalEntries]);

    return (
        <div className="space-y-8">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white shadow rounded-lg">
                    <h3 className="px-4 py-4 sm:px-6 text-base font-semibold text-gray-800 border-b">Recent Journal Entries</h3>
                    <ul className="divide-y divide-gray-200">
                        {recentTransactions.map(entry => (
                            <li key={entry.id} className="p-4 sm:p-6 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm text-gray-800 font-medium truncate pr-4">{entry.description}</p>
                                    <p className="text-xs text-gray-500 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</p>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    {entry.lines.map((line, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span>{line.accountName}</span>
                                            <span className="font-mono">{line.type === 'debit' ? formatCurrency(line.amount, storeSettings) : `(${formatCurrency(line.amount, storeSettings)})`}</span>
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white shadow rounded-lg">
                     <h3 className="px-4 py-4 sm:px-6 text-base font-semibold text-gray-800 border-b">Account Balances</h3>
                     <ul className="divide-y divide-gray-200">
                        {accounts.filter(a => a.subType).map(account => (
                            <li key={account.id} className="px-4 py-3 sm:px-6 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">{account.name}</span>
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(account.balance, storeSettings)}</span>
                            </li>
                        ))}
                     </ul>
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

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
             <div className="bg-white rounded-lg shadow-xl sm:max-w-lg w-full m-4">
                 <form onSubmit={handleSubmit}>
                     <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                         <h3 className="text-lg font-medium text-gray-900">{accountToEdit ? 'Edit Account' : 'Add New Account'}</h3>
                         <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                     </div>
                     <div className="px-6 py-4 space-y-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Account Name</label>
                             <input type="text" value={account.name} onChange={e => setAccount({...account, name: e.target.value})} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-700">Account Number</label>
                               <input type="text" value={account.number} onChange={e => setAccount({...account, number: e.target.value})} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-gray-700">Account Type</label>
                               <select value={account.type} onChange={e => setAccount({...account, type: e.target.value as AccountType})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                                   <option value="asset">Asset</option>
                                   <option value="liability">Liability</option>
                                   <option value="equity">Equity</option>
                                   <option value="revenue">Revenue</option>
                                   <option value="expense">Expense</option>
                               </select>
                           </div>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Description</label>
                             <textarea value={account.description} onChange={e => setAccount({...account, description: e.target.value})} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                         </div>
                         {accountToEdit?.subType && <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded-md">This is a system account used for automatic posting. Some properties cannot be changed.</p>}
                     </div>
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Save Account</button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                    </div>
                 </form>
             </div>
        </div>
    );
};

const ChartOfAccountsView: React.FC<{ 
    accounts: Account[],
    storeSettings: StoreSettings,
    onSaveAccount: (account: Account) => void,
    onDeleteAccount: (accountId: string) => void,
}> = ({ accounts, storeSettings, onSaveAccount, onDeleteAccount }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const renderAccountList = (type: AccountType) => (
        <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-600 capitalize mb-2">{type}s</h4>
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-200">
                        {accounts.filter(a => a.type === type).sort((a,b) => a.number.localeCompare(b.number)).map(account => (
                            <tr key={account.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">{formatCurrency(account.balance, storeSettings)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button onClick={() => handleEdit(account)} className="text-blue-600 hover:text-blue-900 mr-4"><PencilIcon className="w-5 h-5"/></button>
                                    {!account.subType && <button onClick={() => onDeleteAccount(account.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h3 className="text-xl font-semibold">Chart of Accounts</h3>
                <button onClick={handleAdd} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="w-5 h-5"/> Add Account
                </button>
            </div>
            {renderAccountList('asset')}
            {renderAccountList('liability')}
            {renderAccountList('equity')}
            {renderAccountList('revenue')}
            {renderAccountList('expense')}

            <AccountFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onSaveAccount} accountToEdit={editingAccount} />
        </div>
    );
};

const JournalView: React.FC<{ 
    entries: JournalEntry[], 
    accounts: Account[], 
    storeSettings: StoreSettings,
    onAddEntry: (entry: Omit<JournalEntry, 'id'>) => void,
}> = ({ entries, storeSettings, }) => {
    const [ setIsModalOpen] = useState(false);

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold">Journal</h3>
                {/*<button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">*/}
                {/*    <PlusIcon className="w-5 h-5"/> Manual Entry*/}
                {/*</button>*/}
            </div>
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map(entry => (
                            <React.Fragment key={entry.id}>
                                <tr className="bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(entry.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700" colSpan={4}>{entry.description}</td>
                                </tr>
                                {entry.lines.map((line, index) => (
                                    <tr key={index}>
                                        <td colSpan={2}></td>
                                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{line.accountName}</td>
                                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 text-right font-mono">{line.type === 'debit' ? formatCurrency(line.amount, storeSettings) : ''}</td>
                                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 text-right font-mono">{line.type === 'credit' ? formatCurrency(line.amount, storeSettings) : ''}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* TODO: Manual Entry Modal */}
        </div>
    )
};

// --- A/R Management Components ---

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
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    const finalLines = statementLines.map(line => {
        runningBalance += line.amount;
        return {...line, balance: runningBalance};
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

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-4xl w-full">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                    <h3 className="text-lg font-medium text-gray-900">Customer Statement</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto overflow-x-auto" ref={printRef}>
                    <div className="header mb-6">
                        <h2 className="text-xl font-bold">{customer.name}</h2>
                        <p>{customer.email}</p>
                        <p className="mt-2">Statement Date: {new Date().toLocaleDateString()}</p>
                    </div>
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {finalLines.map((line, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(line.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{line.description}</td>
                                    <td className={`px-4 py-2 whitespace-nowrap text-sm text-right ${line.type === 'payment' ? 'text-green-600' : ''}`}>{formatCurrency(line.amount, storeSettings)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold">{formatCurrency(line.balance, storeSettings)}</td>
                                </tr>
                            ))}
                             <tr className="total-row">
                                <td colSpan={3} className="px-4 py-2 text-right font-bold">Current Balance Due</td>
                                <td className="px-4 py-2 text-right font-bold">{formatCurrency(customer.accountBalance, storeSettings)}</td>
                             </tr>
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3 border-t">
                    <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                        <PrinterIcon className="w-5 h-5"/> Print
                    </button>
                    <button onClick={onClose} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const RecordPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    invoice: Sale;
    onSave: (saleId: string, payment: Omit<Payment, 'id'>) => void;
    storeSettings: StoreSettings;
}> = ({ isOpen, onClose, invoice, onSave, storeSettings }) => {
    const balanceDue = invoice.total - invoice.amountPaid;
    const [amount, setAmount] = useState(balanceDue.toFixed(2));
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState<string>(storeSettings?.paymentMethods?.[0]?.id || 'cash');

    useEffect(() => {
        if(isOpen) {
            setAmount(balanceDue.toFixed(2));
            setDate(new Date().toISOString().split('T')[0]);
            setMethod(storeSettings?.paymentMethods?.[0]?.id || 'cash');
        }
    }, [invoice, balanceDue, isOpen, storeSettings]);
    
    if (!isOpen) return null;

    const isInvalid = isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || parseFloat(amount) > balanceDue + 0.001;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount);
        if (isInvalid) {
            alert("Invalid payment amount.");
            return;
        }
        onSave(invoice.transactionId, { date, amount: paymentAmount, method });
        onClose();
    };
    
    return (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-20 flex justify-center items-center z-50 transition-opacity">
             <div className="bg-white rounded-lg shadow-xl sm:max-w-lg w-full m-4">
                 <form onSubmit={handleSubmit}>
                     <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                         <div>
                            <h3 className="text-lg font-medium text-gray-900">Record Payment for {invoice.transactionId}</h3>
                            <p className="text-sm text-gray-500 mt-1">Balance Due: {formatCurrency(balanceDue, storeSettings)}</p>
                         </div>
                         <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                     </div>
                     <div className="px-6 py-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
                                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} max={balanceDue} step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                             <select value={method} onChange={e => setMethod(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                                {storeSettings.paymentMethods?.map(pm => (
                                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                                ))}
                            </select>
                         </div>
                     </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                        <button type="submit" disabled={isInvalid} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-400">Record Payment</button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                    </div>
                 </form>
             </div>
        </div>
    )
}

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

    const openInvoices = useMemo(() => {
        const isPaid = (s: Sale) => {
            const balanceCents = Math.round((s.total - s.amountPaid) * 100);
            return s.paymentStatus === 'paid' || balanceCents <= 0;
        };
        return sales
            .filter(s => !isPaid(s))
            .sort((a,b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
    }, [sales]);

    // Map customers by id for quick lookup of names when invoice.customerName is missing
    const customersById = useMemo(() => {
        const map: Record<string, Customer> = {};
        for (const c of customers) {
            map[c.id] = c;
        }
        return map;
    }, [customers]);

    const handleRecordPaymentClick = (invoice: Sale) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    }
    
    const handleGenerateStatement = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setSelectedCustomerForStatement(customer);
            setIsStatementModalOpen(true);
        }
    };

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold">Open Invoices</h3>
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance Due</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {openInvoices.map(invoice => {
                            const rawBalance = (invoice.total - invoice.amountPaid);
                            const balanceCents = Math.round(rawBalance * 100);
                            const balanceDue = Math.max(0, balanceCents) / 100;
                            const isPaid = balanceCents <= 0 || invoice.paymentStatus === 'paid';
                            const isOverdue = !isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date();
                            return (
                            <tr key={invoice.transactionId} onClick={() => onViewInvoice(invoice)} className="hover:bg-gray-50 cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{invoice.transactionId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{invoice.customerName || (invoice.customerId ? customersById[invoice.customerId]?.name : undefined) || 'Unknown Customer'}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">{formatCurrency(balanceDue, storeSettings)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isPaid ? 'bg-green-100 text-green-800' : isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                       {isPaid ? 'PAID' : isOverdue ? 'Overdue' : (invoice.paymentStatus || 'unpaid').replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => handleRecordPaymentClick(invoice)} className="text-blue-600 hover:text-blue-800 font-medium">Record Payment</button>
                                </td>
                            </tr>
                        )})}
                         {openInvoices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-gray-500">
                                    No open invoices.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <h3 className="text-xl font-semibold mt-12">Customer Statements</h3>
            <div className="bg-white p-4 rounded-lg shadow ring-1 ring-black ring-opacity-5">
                <label htmlFor="customer-statement-select" className="block text-sm font-medium text-gray-700">Select a customer to generate a statement</label>
                <select 
                    id="customer-statement-select" 
                    onChange={e => e.target.value && handleGenerateStatement(e.target.value)}
                    value={''}
                    className="mt-1 block w-full max-w-sm pl-3 pr-10 py-2 text-base border p-2 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                    <option value="" disabled>-- Select a Customer --</option>
                    {customers.filter(c=> c.accountBalance > 0).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {selectedInvoice && <RecordPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} invoice={selectedInvoice} onSave={onRecordPayment} storeSettings={storeSettings} />}
            {selectedCustomerForStatement && (
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
            )}
        </div>
    )
};

// --- A/P Management Components ---
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

    const StatusBadge: React.FC<{ status: SupplierInvoice['status'] }> = ({ status }) => {
        const statusStyles: Record<SupplierInvoice['status'], string> = {
            unpaid: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
            partially_paid: 'bg-blue-50 text-blue-700 ring-blue-700/10',
            paid: 'bg-green-50 text-green-700 ring-green-600/20',
            overdue: 'bg-red-100 text-red-800 ring-red-600/20',
        };
        return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
        );
    };

    const invoicesWithStatus = useMemo(() => {
        return supplierInvoices.map(inv => {
            if (inv.status !== 'paid' && new Date(inv.dueDate) < new Date()) {
                return {...inv, status: 'overdue' as const};
            }
            return inv;
        }).sort((a,b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    }, [supplierInvoices]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h3 className="text-xl font-semibold">Supplier Invoices</h3>
                <button onClick={onOpenInvoiceForm} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="w-5 h-5"/> Record Invoice
                </button>
            </div>
             <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance Due</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoicesWithStatus.map(invoice => (
                            <tr key={invoice.id} onClick={() => onViewInvoice(invoice)} className="hover:bg-gray-50 cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{invoice.supplierName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{invoice.poNumber}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">{formatCurrency(invoice.amount - invoice.amountPaid, storeSettings)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm"><StatusBadge status={invoice.status} /></td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={e => e.stopPropagation()}>
                                    {invoice.status !== 'paid' && (
                                        <button onClick={() => setInvoiceToPay(invoice)} className="text-blue-600 hover:text-blue-800 font-medium">Record Payment</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {invoicesWithStatus.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500">
                                    No supplier invoices found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {invoiceToPay && (
                <RecordSupplierPaymentModal
                    isOpen={!!invoiceToPay}
                    onClose={() => setInvoiceToPay(null)}
                    invoice={invoiceToPay}
                    onSave={onRecordPayment}
                    storeSettings={storeSettings}
                />
            )}
        </div>
    )
};

// --- New Components ---
const TaxReportView: React.FC<{ sales: Sale[], storeSettings: StoreSettings }> = ({ sales, storeSettings }) => {
    const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const filteredData = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        
        const relevantSales = sales.filter(s => {
            const saleDate = new Date(s.timestamp);
            return saleDate >= start && saleDate <= end;
        });

        const totalSales = relevantSales.reduce((sum, s) => sum + s.subtotal, 0);
        const totalTax = relevantSales.reduce((sum, s) => sum + s.tax, 0);

        return {
            totalSales,
            totalTax,
            numberOfTransactions: relevantSales.length
        };

    }, [sales, startDate, endDate]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold">Sales Tax Report</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-1.5 border rounded-md text-sm" />
                    <span className="text-gray-500">to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-1.5 border rounded-md text-sm" />
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Total Sales (Taxable)</dt>
                        <dd className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(filteredData.totalSales, storeSettings)}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Total Tax Collected</dt>
                        <dd className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(filteredData.totalTax, storeSettings)}</dd>
                    </div>
                     <div>
                        <dt className="text-sm font-medium text-gray-500">Number of Transactions</dt>
                        <dd className="mt-1 text-3xl font-bold text-gray-900">{filteredData.numberOfTransactions}</dd>
                    </div>
                </dl>
                <div className="mt-6 border-t pt-4">
                    <p className="text-sm text-gray-600">This report summarizes the total sales tax collected for the selected period. This amount should be remitted to the relevant tax authorities. Note: This is a simplified report based on a single tax rate of {storeSettings.taxRate}%. For multi-rate tax management, further configuration is required.</p>
                </div>
            </div>
        </div>
    );
};

const FinancialStatementsView: React.FC<{ accounts: Account[], journalEntries: JournalEntry[], storeSettings: StoreSettings }> = ({ accounts, journalEntries, storeSettings }) => {
    const [activeReport, setActiveReport] = useState('pnl');
    const [pnlStartDate, setPnlStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [pnlEndDate, setPnlEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const pnlData = useMemo(() => {
        const start = new Date(pnlStartDate);
        start.setHours(0,0,0,0);
        const end = new Date(pnlEndDate);
        end.setHours(23,59,59,999);

        const revenueAccounts = new Map<string, {name: string, balance: number}>();
        const expenseAccounts = new Map<string, {name: string, balance: number}>();

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
            revenueAccounts: Array.from(revenueAccounts.values()),
            expenseAccounts: Array.from(expenseAccounts.values()),
            totalRevenue,
            totalExpenses,
            netIncome
        };
    }, [accounts, journalEntries, pnlStartDate, pnlEndDate]);
    
    const balanceSheetData = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'asset').sort((a,b) => a.number.localeCompare(b.number));
        const liabilities = accounts.filter(a => a.type === 'liability').sort((a,b) => a.number.localeCompare(b.number));
        const equity = accounts.filter(a => a.type === 'equity').sort((a,b) => a.number.localeCompare(b.number));

        const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
        const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);
        
        return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
    }, [accounts]);

    const renderPNL = () => (
        <div className="bg-white shadow rounded-lg p-6">
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold">Profit & Loss Statement</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <input type="date" value={pnlStartDate} onChange={e => setPnlStartDate(e.target.value)} className="p-1.5 border rounded-md text-sm" />
                    <span className="text-gray-500">to</span>
                    <input type="date" value={pnlEndDate} onChange={e => setPnlEndDate(e.target.value)} className="p-1.5 border rounded-md text-sm" />
                </div>
            </div>
            <div className="space-y-4 text-sm">
                <div>
                    <h4 className="font-bold text-base mb-1">Revenue</h4>
                    {pnlData.revenueAccounts.map(acc => (
                        <div key={acc.name} className="flex justify-between pl-4 py-1">
                            <span>{acc.name}</span>
                            <span>{formatCurrency(acc.balance, storeSettings)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                        <span>Total Revenue</span>
                        <span>{formatCurrency(pnlData.totalRevenue, storeSettings)}</span>
                    </div>
                </div>
                 <div>
                    <h4 className="font-bold text-base mt-4 mb-1">Expenses</h4>
                     {pnlData.expenseAccounts.map(acc => (
                        <div key={acc.name} className="flex justify-between pl-4 py-1">
                            <span>{acc.name}</span>
                            <span>{formatCurrency(acc.balance, storeSettings)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                        <span>Total Expenses</span>
                        <span>({formatCurrency(pnlData.totalExpenses, storeSettings)})</span>
                    </div>
                </div>
                <div className={`flex justify-between font-bold text-lg border-t-2 pt-2 mt-2 ${pnlData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span>Net Income</span>
                    <span>{formatCurrency(pnlData.netIncome, storeSettings)}</span>
                </div>
            </div>
        </div>
    );
    
     const renderBalanceSheet = () => (
         <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Balance Sheet as of {new Date().toLocaleDateString()}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div>
                    <h4 className="font-bold text-base mb-2">Assets</h4>
                    {balanceSheetData.assets.map(acc => (
                         <div key={acc.id} className="flex justify-between py-1">
                            <span>{acc.name}</span>
                            <span>{formatCurrency(acc.balance, storeSettings)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-1 mt-1">
                        <span>Total Assets</span>
                        <span>{formatCurrency(balanceSheetData.totalAssets, storeSettings)}</span>
                    </div>
                </div>
                 <div>
                    <h4 className="font-bold text-base mb-2">Liabilities</h4>
                     {balanceSheetData.liabilities.map(acc => (
                         <div key={acc.id} className="flex justify-between py-1">
                            <span>{acc.name}</span>
                            <span>{formatCurrency(acc.balance, storeSettings)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                        <span>Total Liabilities</span>
                        <span>{formatCurrency(balanceSheetData.totalLiabilities, storeSettings)}</span>
                    </div>

                    <h4 className="font-bold text-base mb-2 mt-6">Equity</h4>
                     {balanceSheetData.equity.map(acc => (
                         <div key={acc.id} className="flex justify-between py-1">
                            <span>{acc.name}</span>
                            <span>{formatCurrency(acc.balance, storeSettings)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                        <span>Total Equity</span>
                        <span>{formatCurrency(balanceSheetData.totalEquity, storeSettings)}</span>
                    </div>

                     <div className="flex justify-between font-bold border-t-2 pt-2 mt-2">
                        <span>Total Liabilities & Equity</span>
                        <span>{formatCurrency(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity, storeSettings)}</span>
                    </div>
                </div>
            </div>
        </div>
    );


    return (
        <div>
            <div className="mb-4 flex gap-2">
                <button onClick={() => setActiveReport('pnl')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeReport === 'pnl' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}>Profit & Loss</button>
                <button onClick={() => setActiveReport('balance_sheet')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeReport === 'balance_sheet' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}>Balance Sheet</button>
            </div>
            {activeReport === 'pnl' ? renderPNL() : renderBalanceSheet()}
        </div>
    )
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
}1

const AccountingPage: React.FC<AccountingPageProps> = ({
    accounts, journalEntries, sales, customers, suppliers, supplierInvoices, purchaseOrders,
    onSaveAccount, onDeleteAccount, onAddManualJournalEntry, onRecordPayment,
    onSaveSupplierInvoice, onRecordSupplierPayment,
    isLoading, error, storeSettings
}) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Define available tabs for validation/hash syncing
    const availableTabs = useRef<string[]>([
        'dashboard',
        'reports',
        'ar_management',
        'ap_management',
        'taxes',
        'chart_of_accounts',
        'journal',
    ]);

    // Initialize active tab from URL hash if present
    useEffect(() => {
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
    
    // --- Modal States ---
    const [isSupplierInvoiceFormOpen, setIsSupplierInvoiceFormOpen] = useState(false);
    const [editingSupplierInvoice, setEditingSupplierInvoice] = useState<SupplierInvoice | null>(null);

    const [viewingAPInvoice, setViewingAPInvoice] = useState<SupplierInvoice | null>(null);
    const [viewingARInvoice, setViewingARInvoice] = useState<Sale | null>(null);

    const [isRecordSupplierPaymentOpen, setIsRecordSupplierPaymentOpen] = useState(false);
    const [invoiceToPayAP, setInvoiceToPayAP] = useState<SupplierInvoice | null>(null);
    
    // Mobile tab menu state
    const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);

    const handleSelectTab = (tabName: string) => {
        setActiveTabAndHash(tabName);
        setIsTabMenuOpen(false);
    };
    
    const TabButton: React.FC<{ tabName: string, label: string, shortLabel?: string }> = ({ tabName, label, shortLabel }) => (
        <button
            type="button"
            role="tab"
            aria-selected={activeTab === tabName}
            onClick={() => setActiveTabAndHash(tabName)}
            className={`shrink-0 inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${activeTab === tabName 
                    ? 'bg-gray-50 text-gray-700 fontweight-semibold shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`
            }
        >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden inline">{shortLabel ?? label}</span>
        </button>
    );
    
    const handleOpenRecordPaymentAP = (invoice: SupplierInvoice) => {
        setInvoiceToPayAP(invoice);
        setIsRecordSupplierPaymentOpen(true);
        setViewingAPInvoice(null); // Close detail view if open
    };

    const renderContent = () => {
        if (isLoading) return <p>Loading accounting data...</p>;
        if (error) return <p className="text-red-500">{error}</p>;

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
                return <ChartOfAccountsView accounts={accounts} storeSettings={storeSettings} onSaveAccount={onSaveAccount} onDeleteAccount={onDeleteAccount} />;
            case 'journal':
                return <JournalView entries={journalEntries} accounts={accounts} storeSettings={storeSettings} onAddEntry={onAddManualJournalEntry} />;
            case 'taxes':
                return <TaxReportView sales={sales} storeSettings={storeSettings} />;
            case 'reports':
                return <FinancialStatementsView accounts={accounts} journalEntries={journalEntries} storeSettings={storeSettings} />;
            case 'dashboard':
            default:
                return <AccountingDashboard accounts={accounts} journalEntries={journalEntries} storeSettings={storeSettings} />;
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-gray-100 ">
            <Header title={"Accounting"} rightContent={(
                            <button
                                type="button"
                                className="sm:hidden inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 border"
                                aria-haspopup="menu"
                                aria-expanded={isTabMenuOpen}
                                aria-controls="accounting-tab-menu"
                                onClick={() => setIsTabMenuOpen(o => !o)}
                            >
                                Menu
                            </button>
                        )} />
            <main className="flex-1 overflow-y-auto p-0 px-4 pb-4 ">
                 <div className=" mb-6 rounded-md sticky top-0 z-20 ">
                    <div className="relative">
                        <nav className="hidden bg-gray-100  p-2 sm:flex -mx-4 px-4 items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar" aria-label="Tabs" role="tablist">
                            <TabButton tabName="dashboard" label="Dashboard" shortLabel="Home" />
                            <TabButton tabName="reports" label="Reports" shortLabel="Reports" />
                            <TabButton tabName="ar_management" label="Accounts Receivable" shortLabel="A/R" />
                            <TabButton tabName="ap_management" label="Accounts Payable" shortLabel="A/P" />
                            <TabButton tabName="taxes" label="Taxes" shortLabel="Taxes" />
                            <TabButton tabName="chart_of_accounts" label="Chart of Accounts" shortLabel="Accounts" />
                            <TabButton tabName="journal" label="Journal" shortLabel="Journal" />
                        </nav>

                        {/* Mobile dropdown panel */}
                        {isTabMenuOpen && (
                            <>
                                {/* Backdrop to close menu on outside click */}
                                <div className="fixed inset-0 z-10 bg-black/30 sm:hidden" onClick={() => setIsTabMenuOpen(false)}></div>
                                <div id="accounting-tab-menu" role="menu" aria-label="Accounting Tabs" className="sm:hidden absolute left-0 right-0 mt-2 z-20 mx-4">
                                    <div className="bg-white rounded-lg shadow ring-1 ring-black ring-opacity-5 divide-y">
                                        <button className={`w-full text-left px-4 py-3 text-sm ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`} onClick={() => handleSelectTab('dashboard')} role="menuitem">Dashboard</button>
                                        <button className={`w-full text-left px-4 py-3 text-sm ${activeTab === 'reports' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`} onClick={() => handleSelectTab('reports')} role="menuitem">Reports</button>
                                        <button className={`w-full text-left px-4 py-3 text-sm ${activeTab === 'ar_management' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`} onClick={() => handleSelectTab('ar_management')} role="menuitem">Accounts Receivable</button>
                                        <button className={`w-full text-left px-4 py-3 text-sm ${activeTab === 'ap_management' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`} onClick={() => handleSelectTab('ap_management')} role="menuitem">Accounts Payable</button>
                                        <button className={`w-full text-left px-4 py-3 text-sm ${activeTab === 'taxes' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`} onClick={() => handleSelectTab('taxes')} role="menuitem">Taxes</button>
                                        <button className={`w-full text-left px-4 py-3 text-sm ${activeTab === 'chart_of_accounts' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`} onClick={() => handleSelectTab('chart_of_accounts')} role="menuitem">Chart of Accounts</button>
                                        <button className={`w-full text-left px-4 py-3 text-sm ${activeTab === 'journal' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`} onClick={() => handleSelectTab('journal')} role="menuitem">Journal</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="animate-fade-in">
                    {renderContent()}
                </div>
            </main>
            
            {/* --- Modals --- */}
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
                    invoice={viewingARInvoice}
                    onRecordPayment={() => {
                        // This reuses the existing AR payment modal logic, which is slightly different
                        // For now, let's just close the detail and let user click 'Record Payment' on list
                        alert("Please use the 'Record Payment' button on the main Accounts Receivable list for now.");
                        setViewingARInvoice(null);
                    }}
                    storeSettings={storeSettings}
                    customerName={viewingARInvoice.customerName || (viewingARInvoice.customerId ? (customers.find(c => c.id === viewingARInvoice.customerId)?.name) : undefined) || undefined}
                 />
            )}
        </div>
    );
};

export default AccountingPage;