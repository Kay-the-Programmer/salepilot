import React from 'react';
import { PurchaseOrder, StoreSettings } from '@/types';
import { formatCurrency } from '@/utils/currency';
import UnifiedListGrid from '../ui/UnifiedListGrid';
import { StandardCard, StandardRow } from '../ui/standard';
import StatusBadge from './StatusBadge';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import PlusIcon from '../icons/PlusIcon';

interface POListProps {
    orders: PurchaseOrder[];
    storeSettings: StoreSettings;
    viewMode: 'grid' | 'list';
    onSelectPO: (po: PurchaseOrder) => void;
    isLoading?: boolean;
    error?: string | null;
    statusFilter?: string;
    handleCreateNew?: () => void;
}

const POList: React.FC<POListProps> = ({
    orders,
    storeSettings,
    viewMode,
    onSelectPO,
    isLoading = false,
    error = null,
    statusFilter = 'all',
    handleCreateNew,
}) => {
    return (
        <div glass-effect="" className="liquid-glass-card rounded-[2rem] flex flex-col h-full dark:bg-slate-900 border border-gray-200 dark:border-slate-800/50 overflow-hidden">
            <UnifiedListGrid<PurchaseOrder>
                items={orders}
                viewMode={viewMode}
                isLoading={isLoading}
                error={error}
                emptyStateComponent={
                    <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchase orders found</h3>
                        <p className="text-gray-500 dark:text-slate-400 mb-6">
                            {statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first purchase order'}
                        </p>
                        {handleCreateNew && (
                            <button
                                onClick={handleCreateNew}
                                className="px-6 py-3 bg-blue-600 dark:bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors active:scale-95 transition-all duration-300"
                            >
                                <PlusIcon className="w-5 h-5 inline mr-2" />
                                Create Purchase Order
                            </button>
                        )}
                    </div>
                }
                getItemId={(item) => item.id}
                onItemClick={onSelectPO}
                className={viewMode === 'list' ? '!p-0' : 'p-4'}
                listClassName="divide-y divide-gray-200 dark:divide-slate-800"
                renderGridItem={(po, _index, isSelected) => (
                    <StandardCard
                        title={po.supplierName}
                        subtitle={po.poNumber}
                        status={<StatusBadge status={po.status} />}
                        isSelected={isSelected}
                        onClick={() => onSelectPO(po)}
                        primaryInfo={formatCurrency(po.total, storeSettings)}
                        secondaryInfo={
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                {new Date(po.createdAt).toLocaleDateString()}
                            </div>
                        }
                    />
                )}
                renderListItem={(po, _index, isSelected) => (
                    <StandardRow
                        title={po.poNumber}
                        subtitle={po.supplierName}
                        status={<StatusBadge status={po.status} />}
                        isSelected={isSelected}
                        onClick={() => onSelectPO(po)}
                        primaryMeta={formatCurrency(po.total, storeSettings)}
                        secondaryMeta={new Date(po.createdAt).toLocaleDateString()}
                    />
                )}
            />
        </div>
    );
};

export default POList;
