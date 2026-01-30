import React, { useState } from 'react';
import { Courier } from '@/types';
import { XMarkIcon } from '../icons/index';
import UnifiedListGrid from '../ui/UnifiedListGrid';
import { StandardCard, StandardRow } from '../ui/standard';
import ConfirmationModal from '../ConfirmationModal';

interface CourierListProps {
    couriers: Courier[];
    viewMode: 'grid' | 'list';
    onSelect: (courier: Courier) => void;
    onDelete: (id: string) => void;
    selectedId: string | null;
}

const CourierList: React.FC<CourierListProps> = ({
    couriers,
    viewMode,
    onSelect,
    onDelete,
    selectedId
}) => {
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <UnifiedListGrid<Courier>
                items={couriers}
                viewMode={viewMode}
                isLoading={false}
                emptyMessage="No couriers found."
                getItemId={(item) => item.id}
                onItemClick={onSelect}
                selectedId={selectedId}
                className={viewMode === 'list' ? '!p-0' : ''}
                listClassName="space-y-0 divide-y divide-gray-200"
                renderGridItem={(courier, _index, isSelected) => (
                    <StandardCard
                        title={courier.company_name}
                        subtitle="Courier"
                        isSelected={isSelected}
                        onClick={() => onSelect(courier)}
                        status={
                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${courier.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {courier.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                        }
                        secondaryInfo={
                            <div className="space-y-1 mt-1">
                                {courier.contact_details && <div className="text-xs text-gray-600 truncate">{courier.contact_details}</div>}
                                {courier.receipt_details && <div className="text-xs text-gray-400 truncate">{courier.receipt_details}</div>}
                            </div>
                        }
                        actions={
                            <button
                                onClick={(e) => handleDeleteClick(courier.id, e)}
                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        }
                    />
                )}
                renderListItem={(courier, _index, isSelected) => (
                    <StandardRow
                        title={courier.company_name}
                        isSelected={isSelected}
                        onClick={() => onSelect(courier)}
                        status={
                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${courier.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {courier.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                        }
                        details={[
                            courier.contact_details ? <span className="truncate max-w-[200px]" key="contact">{courier.contact_details}</span> : null
                        ]}
                        actions={
                            <button
                                onClick={(e) => handleDeleteClick(courier.id, e)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        }
                    />
                )}
            />

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Courier"
                message="Are you sure you want to delete this courier?"
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
};

export default CourierList;
