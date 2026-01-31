import React, { useState, useMemo } from 'react';
import { JournalEntry, Account, Sale, Customer, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import BookOpenIcon from '../../icons/BookOpenIcon';
import CalendarDaysIcon from '../../icons/CalendarDaysIcon';
import MagnifyingGlassIcon from '../../icons/MagnifyingGlassIcon';

interface JournalViewProps {
    entries: JournalEntry[];
    accounts: Account[];
    sales: Sale[];
    customers: Customer[];
    storeSettings: StoreSettings;
    onAddEntry: (entry: Omit<JournalEntry, 'id'>) => void;
}

const JournalView: React.FC<JournalViewProps> = ({ entries, sales, customers, storeSettings }) => {
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
    }, [enrichedEntries, selectedDate, searchTerm]);

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
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">General Journal</h3>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">View and manage all accounting entries</p>
                </div>
                <div glass-effect="" className="flex items-center gap-2 p-3 !bg-slate-50/50 dark:!bg-slate-900/50 border border-slate-100 dark:border-slate-800 self-start lg:self-auto rounded-2xl hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Total Dr</span>
                            <span className="font-black text-blue-700 dark:text-blue-400 text-base md:text-lg">{formatCurrency(totalDebits, storeSettings)}</span>
                        </div>
                        <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Total Cr</span>
                            <span className="font-black text-emerald-700 dark:text-emerald-400 text-base md:text-lg">{formatCurrency(totalCredits, storeSettings)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div glass-effect="" className="rounded-2xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 text-sm font-bold text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search entries..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 text-sm font-bold text-slate-900 dark:text-slate-100"
                        />
                    </div>
                </div>
            </div>

            {/* Journal Entries */}
            <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                    <div glass-effect="" className="text-center py-24 rounded-3xl border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                            <BookOpenIcon className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-black">No journal entries found</p>
                        <p className="text-xs text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-widest font-bold">Try adjusting your filters</p>
                    </div>
                ) : (
                    filteredEntries.map(entry => (
                        <div key={entry.id} glass-effect="" className="rounded-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-[0.995]">
                            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <div className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] md:text-xs font-black rounded-lg flex items-center gap-1.5 uppercase tracking-widest shadow-sm">
                                                <CalendarDaysIcon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                                                {new Date(entry.date).toLocaleDateString()}
                                            </div>
                                            {entry.reference && (
                                                <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] md:text-xs font-black rounded-lg border border-indigo-100 dark:border-indigo-800/50 uppercase tracking-widest">
                                                    REF: {entry.reference}
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-black text-slate-900 dark:text-slate-100 text-sm md:text-base tracking-tight leading-tight">{entry.description}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-0.5">Entry ID</div>
                                        <div className="text-[11px] font-black text-slate-600 dark:text-slate-400 px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm">
                                            {entry.id.substring(0, 8).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 md:p-5 !bg-transparent">
                                <div className="space-y-1.5 md:space-y-2">
                                    {entry.lines.map((line, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl border border-transparent hover:border-slate-100/50 dark:hover:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-1.5 h-10 rounded-full shadow-sm ${line.type === 'debit' ? 'bg-gradient-to-b from-blue-400 to-indigo-600 shadow-blue-500/20' : 'bg-gradient-to-b from-emerald-400 to-teal-600 shadow-emerald-500/20'
                                                    }`}></div>
                                                <div className="min-w-0">
                                                    <div className="font-black text-slate-900 dark:text-slate-100 text-sm tracking-tight">{line.accountName}</div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest opacity-80 mt-0.5">Code: {line.accountId}</div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className={`text-base md:text-lg font-black tracking-tight ${line.type === 'debit' ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400'
                                                    }`}>
                                                    {formatCurrency(line.amount, storeSettings)}
                                                </div>
                                                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-600">
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

export default JournalView;
