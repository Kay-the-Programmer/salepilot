
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StockTakeSession, CountedItem } from '../types';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import ConfirmationModal from '../components/ConfirmationModal';

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
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-8">
                <div className="text-center">
                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h2 className="mt-2 text-xl font-semibold text-gray-900">Inventory Counts</h2>
                    <p className="mt-1 text-sm text-gray-500">Verify your inventory by starting a physical stock count.</p>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={onStart}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === filterType ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
            {label}
            {typeof count !== 'undefined' && <span className={`ml-2 inline-block px-2 py-0.5 text-xs rounded-full ${filter === filterType ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>{count}</span>}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <header className="bg-gray-100 z-10 p-4 ">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock Take in Progress</h1>
                        <p className="text-sm text-gray-500">Started at: {new Date(session.startTime).toLocaleString()}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <button onClick={handleCancel} type="button" className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            <XMarkIcon className="-ml-0.5 h-5 w-5 text-gray-500" />
                            Cancel
                        </button>
                        <button onClick={handleFinalize} type="button" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                            Complete Count
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search products by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="block w-full max-w-sm py-2 pl-10 pr-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 sm:px-4 lg:px-4 py-4 flex-1 flex flex-col min-h-0">
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="overflow-auto flex-1 shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-2/5">Product</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/5">SKU</th>
                                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 w-1/5">Expected</th>
                                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 w-1/5">Counted</th>
                                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 w-1/5">Discrepancy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredAndSortedItems.length > 0 ? filteredAndSortedItems.map((item) => {
                                        const discrepancy = item.counted !== null ? item.counted - item.expected : null;
                                        return (
                                            <tr key={item.productId} className={item.counted !== null ? (discrepancy === 0 ? 'bg-green-50' : 'bg-red-50') : ''}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{item.name}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.sku || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-gray-700">{item.expected}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <input
                                                        ref={el => { inputRefs.current[item.productId] = el; }}
                                                        type="number"
                                                        value={item.counted ?? ''}
                                                        onChange={e => handleCountChange(item.productId, e.target.value)}
                                                        min="0"
                                                        step="any"
                                                        className="block w-24 mx-auto p-1 border rounded-md text-center focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className={`whitespace-nowrap px-3 py-4 text-center text-sm font-bold ${discrepancy === null ? 'text-gray-500' : discrepancy > 0 ? 'text-blue-600' : discrepancy < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {discrepancy === null ? '—' : (discrepancy > 0 ? `+${discrepancy}` : discrepancy)}
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 text-gray-500">
                                                No products match your search or filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </div >
    );
};

export default StockTakePage;
