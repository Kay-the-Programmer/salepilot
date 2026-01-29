import React, { useState, useMemo } from 'react';
import { JournalEntry, Account, Sale, Customer, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import BookOpenIcon from '../../icons/BookOpenIcon';
import CalendarDaysIcon from '../../icons/CalendarDaysIcon';
import CalendarIcon from '../../icons/CalendarIcon';
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

export default JournalView;
