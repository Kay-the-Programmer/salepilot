
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StockTakeSession } from '../types';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import { HiOutlineXMark } from 'react-icons/hi2';

interface StockTakePageProps {
    session: StockTakeSession | null;
    onStart: () => void;
    onUpdateItem: (productId: string, count: number | null) => void;
    onCancel: () => void;
    onFinalize: () => void;
}

const StockTakePage: React.FC<StockTakePageProps> = ({ session, onStart, onUpdateItem, onCancel, onFinalize }) => {
    const [filter, setFilter] = useState('all'); // 'all', 'counted', 'uncounted', 'discrepancy'
    const [searchTerm, setSearchTerm] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    useEffect(() => {
        inputRefs.current = {};
    }, [session]);

    const handleCountChange = (productId: string, value: string) => {
        if (value === '') {
            onUpdateItem(productId, null);
        } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue >= 0) {
                onUpdateItem(productId, numValue);
            }
        }
    };

    const handleFinalize = () => {
        const uncountedItems = session?.items.filter(i => i.counted === null).length || 0;
        if (uncountedItems > 0) {
            if (!window.confirm(`There are still ${uncountedItems} uncounted item(s). Are you sure you want to finalize the count? Uncounted items will not be adjusted.`)) {
                return;
            }
        }
        if (window.confirm('Are you sure you want to complete this stock take? This will update your inventory levels.')) {
            onFinalize();
        }
    };

    const handleCancel = () => {
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = () => {
        setIsCancelModalOpen(false);
        onCancel();
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && filteredAndSortedItems.length === 1) {
            e.preventDefault();
            const firstItem = filteredAndSortedItems[0];
            const inputElement = inputRefs.current[firstItem.productId];
            inputElement?.focus();
            inputElement?.select();
        }
    };

    const { totalItems, countedItems, itemsWithDiscrepancy } = useMemo(() => {
        if (!session) return { totalItems: 0, countedItems: 0, itemsWithDiscrepancy: 0 };

        const total = session.items.length;
        const counted = session.items.filter(i => i.counted !== null).length;
        const discrepancy = session.items.filter(i => i.counted !== null && i.counted !== i.expected).length;

        return { totalItems: total, countedItems: counted, itemsWithDiscrepancy: discrepancy };
    }, [session]);

    const filteredAndSortedItems = useMemo(() => {
        if (!session) return [];
        return session.items
            .filter(item => {
                const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.sku ? item.sku.toLowerCase().includes(searchTerm.toLowerCase()) : false);
                if (!searchMatch) return false;

                switch (filter) {
                    case 'counted': return item.counted !== null;
                    case 'uncounted': return item.counted === null;
                    case 'discrepancy': return item.counted !== null && item.counted !== item.expected;
                    default: return true;
                }
            });
    }, [session, filter, searchTerm]);

    if (!session) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-950 p-8">
                <div glass-effect="" className="max-w-md w-full text-center p-12 rounded-[2.5rem] shadow-xl border border-white/50 dark:border-slate-800/50">
                    <div className="mx-auto h-20 w-20 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6">
                        <ClipboardDocumentListIcon className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Stock Counts</h2>
                    <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">Verify your inventory by starting a physical stock count.</p>
                    <div className="mt-10">
                        <button
                            type="button"
                            onClick={onStart}
                            className="w-full inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:translate-y-[-2px] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 uppercase tracking-widest active:scale-95 transition-all duration-300"
                        >
                            Start New Stock Take
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const FilterButton: React.FC<{
        filterType: string;
        label: string;
        count?: number;
    }> = ({ filterType, label, count }) => (
        <button
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filter === filterType
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
        >
            {label}
            {typeof count !== 'undefined' && <span className={`ml-2 inline-block px-2 py-0.5 text-[10px] rounded-lg ${filter === filterType ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{count}</span>}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            <header className="z-10 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Stock Take in Progress</h1>
                        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">Started at: {new Date(session.startTime).toLocaleString()}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                        <button onClick={handleCancel} type="button" className="inline-flex items-center gap-x-1.5 rounded-md bg-white dark:bg-red-500 px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-500/20 dark:hover:shadow-slate-500/20 dark:hover:bg-slate-800 hover:translate-y-[-2px] transition-all uppercase tracking-widest active:scale-95 transition-all duration-300">
                            <XMarkIcon className="h-4 w-4 text-slate-400" />
                            Cancel
                        </button>
                        <button onClick={handleFinalize} type="button" className="rounded-md bg-blue-600 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-slate-50 dark:hover:bg-slate-800 hover:translate-y-[-2px] transition-all uppercase tracking-widest active:scale-95 transition-all duration-300">
                            Complete Count
                        </button>
                    </div>
                </div>
                <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1 max-w-md">
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search products by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="block w-full py-4 pl-12 pr-4 bg-white dark:bg-slate-900 border-0 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm font-bold text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <FilterButton filterType="all" label="All Items" count={totalItems} />
                        <FilterButton filterType="uncounted" label="Uncounted" count={totalItems - countedItems} />
                        <FilterButton filterType="counted" label="Counted" count={countedItems} />
                        <FilterButton filterType="discrepancy" label="Discrepancies" count={itemsWithDiscrepancy} />
                    </div>
                </div>
            </header>
            <main className="flex-1 flex flex-col overflow-hidden px-6 pb-6">
                <div glass-effect="" className="flex-1 flex flex-col min-h-0 shadow-xl border border-white/50 dark:border-slate-800/50 overflow-hidden">
                    <div className="overflow-auto flex-1 premium-scrollbar">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th scope="col" className="py-5 pl-8 pr-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] w-2/5">Product</th>
                                    <th scope="col" className="px-4 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] w-1/5">SKU</th>
                                    <th scope="col" className="px-4 py-5 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] w-1/5">Expected</th>
                                    <th scope="col" className="px-4 py-5 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] w-1/5">Counted</th>
                                    <th scope="col" className="px-4 py-5 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] w-1/5">Discrepancy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {filteredAndSortedItems.length > 0 ? filteredAndSortedItems.map((item) => {
                                    const discrepancy = item.counted !== null ? item.counted - item.expected : null;
                                    const isOk = discrepancy === 0;
                                    const isHigh = discrepancy !== null && discrepancy > 0;
                                    const isLow = discrepancy !== null && discrepancy < 0;

                                    return (
                                        <tr key={item.productId} className={`group hover:bg-white/50 dark:hover:bg-slate-800/30 transition-colors ${item.counted !== null ? (isOk ? 'bg-emerald-50/30 dark:bg-emerald-500/5' : 'bg-rose-50/30 dark:bg-rose-500/5') : ''}`}>
                                            <td className="whitespace-nowrap py-5 pl-8 pr-4 text-sm font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                                            <td className="whitespace-nowrap px-4 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">{item.sku || '—'}</td>
                                            <td className="whitespace-nowrap px-4 py-5 text-center text-sm font-bold text-slate-700 dark:text-slate-300">{item.expected}</td>
                                            <td className="whitespace-nowrap px-4 py-5 text-sm">
                                                <input
                                                    ref={el => { inputRefs.current[item.productId] = el; }}
                                                    type="number"
                                                    value={item.counted ?? ''}
                                                    onChange={e => handleCountChange(item.productId, e.target.value)}
                                                    min="0"
                                                    step="any"
                                                    className="block w-24 mx-auto py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
                                                />
                                            </td>
                                            <td className={`whitespace-nowrap px-4 py-5 text-center text-sm font-black tracking-tight ${discrepancy === null ? 'text-slate-300 dark:text-slate-700' : isHigh ? 'text-blue-600 dark:text-blue-400' : isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {discrepancy === null ? '—' : (discrepancy > 0 ? `+${discrepancy}` : discrepancy)}
                                            </td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-20">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                                                    <HiOutlineXMark className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No products found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <ConfirmationModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title="Cancel Stock Take"
                message="Are you sure you want to cancel this stock take? All progress will be lost and this session will be discarded."
                confirmText="Yes, Cancel"
                cancelText="No, Keep It"
                confirmButtonClass="bg-rose-600 hover:bg-rose-700 rounded-2xl p-4 font-black uppercase tracking-widest text-[10px]"
                variant="floating"
            />
        </div>
    );
};

export default StockTakePage;
