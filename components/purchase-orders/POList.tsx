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
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <UnifiedListGrid<PurchaseOrder>
                items={orders}
                viewMode={viewMode}
                isLoading={isLoading}
                error={error}
                emptyStateComponent={
                    <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
                        <p className="text-gray-500 mb-6">
                            {statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first purchase order'}
                        </p>
                        {handleCreateNew && (
                            <button
                                onClick={handleCreateNew}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
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
                listClassName="divide-y divide-gray-200"
                renderGridItem={(po, _index, isSelected) => (
                    <StandardCard
                        title={po.supplierName}
                        subtitle={po.poNumber}
                        status={<StatusBadge status={po.status} />}
                        isSelected={isSelected}
                        onClick={() => onSelectPO(po)}
                        primaryInfo={formatCurrency(po.total, storeSettings)}
                        secondaryInfo={
                            <div className="text-xs text-gray-500">
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
