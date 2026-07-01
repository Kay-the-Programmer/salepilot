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

    const filterInput = "w-full pl-10 pr-4 py-3 rounded-xl text-sm m3-bg-surface-lowest m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] focus:border-transparent transition-all";

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold m3-text-on-surface tracking-tight">General Journal</h3>
                    <p className="text-sm m3-text-on-surface-variant mt-1">View and manage all accounting entries</p>
                </div>
                <div className="m3-bg-surface-lowest rounded-2xl flex items-center gap-6 px-4 py-2.5 border m3-border-outline-variant shadow-sm self-start lg:self-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium m3-text-on-surface-variant">Total Dr:</span>
                        <span className="font-bold m3-text-primary text-base">{formatCurrency(totalDebits, storeSettings)}</span>
                    </div>
                    <div className="w-px h-4 m3-bg-surface-highest"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium m3-text-on-surface-variant">Total Cr:</span>
                        <span className="font-bold text-green-600 dark:text-green-400 text-base">{formatCurrency(totalCredits, storeSettings)}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <CalendarDaysIcon className="w-5 h-5 m3-text-on-surface-variant" />
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={filterInput}
                    />
                </div>
                <div className="relative flex-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <MagnifyingGlassIcon className="w-5 h-5 m3-text-on-surface-variant" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search entries..."
                        className={filterInput}
                    />
                </div>
            </div>

            {/* Journal Entries */}
            <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border-2 border-dashed m3-border-outline-variant">
                        <div className="w-12 h-12 m3-bg-surface-container rounded-xl flex items-center justify-center mx-auto mb-3">
                            <BookOpenIcon className="w-6 h-6 m3-text-on-surface-variant" />
                        </div>
                        <p className="m3-text-on-surface font-medium">No journal entries found</p>
                        <p className="text-sm m3-text-on-surface-variant mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    filteredEntries.map(entry => (
                        <div key={entry.id} className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b m3-border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold m3-text-on-surface-variant">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </span>
                                        {entry.reference && (
                                            <>
                                                <span className="m3-text-on-surface-variant" style={{ opacity: 0.5 }}>•</span>
                                                <span className="text-xs font-medium m3-text-on-surface-variant">
                                                    REF: {entry.reference}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <p className="font-semibold m3-text-on-surface text-sm">{entry.description}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-mono m3-text-on-surface-variant m3-bg-surface-container px-2 py-1 rounded">
                                        ID: {entry.id.substring(0, 8).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="p-2">
                                {entry.lines.map((line, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 hover:m3-bg-surface-container rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-8 rounded-full" style={{ background: line.type === 'debit' ? 'var(--m3-primary)' : '#16a34a' }}></div>
                                            <div>
                                                <div className="font-medium m3-text-on-surface text-sm">{line.accountName}</div>
                                                <div className="text-xs m3-text-on-surface-variant font-mono mt-0.5">{line.accountId}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold m3-text-on-surface">
                                                {formatCurrency(line.amount, storeSettings)}
                                            </div>
                                            <div className="text-xs m3-text-on-surface-variant capitalize">{line.type}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default JournalView;
