import React, { useState } from 'react';
import { Bus } from '@/types';
import { XMarkIcon } from '../icons/index';
import UnifiedListGrid from '../ui/UnifiedListGrid';
import { StandardCard, StandardRow } from '../ui/standard';
import ConfirmationModal from '../ConfirmationModal';

interface BusListProps {
    buses: Bus[];
    viewMode: 'grid' | 'list';
    onSelect: (bus: Bus) => void;
    onDelete: (id: string) => void;
    selectedId: string | null;
}

const BusList: React.FC<BusListProps> = ({
    buses,
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
            <UnifiedListGrid<Bus>
                items={buses}
                viewMode={viewMode}
                isLoading={false}
                emptyMessage="No buses found."
                getItemId={(item) => item.id}
                onItemClick={onSelect}
                selectedId={selectedId}
                className={viewMode === 'list' ? '!p-0' : ''}
                listClassName="space-y-0 divide-y divide-gray-200"
                renderGridItem={(bus, _index, isSelected) => (
                    <StandardCard
                        title={bus.driver_name}
                        subtitle={bus.number_plate}
                        isSelected={isSelected}
                        onClick={() => onSelect(bus)}
                        status={
                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${bus.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {bus.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                        }
                        secondaryInfo={
                            <div className="space-y-1 mt-1">
                                {bus.vehicle_name && <div className="text-xs text-gray-600 truncate">{bus.vehicle_name}</div>}
                                {bus.contact_phone && <div className="text-xs text-gray-500">{bus.contact_phone}</div>}
                            </div>
                        }
                        actions={
                            <button
                                onClick={(e) => handleDeleteClick(bus.id, e)}
                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        }
                    />
                )}
                renderListItem={(bus, _index, isSelected) => (
                    <StandardRow
                        title={bus.driver_name}
                        subtitle={bus.number_plate}
                        isSelected={isSelected}
                        onClick={() => onSelect(bus)}
                        status={
                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${bus.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {bus.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                        }
                        details={[
                            bus.vehicle_name ? <span className="truncate" key="veh">{bus.vehicle_name}</span> : null,
                            bus.contact_phone ? <span className="text-gray-500" key="ph">{bus.contact_phone}</span> : null
                        ]}
                        actions={
                            <button
                                onClick={(e) => handleDeleteClick(bus.id, e)}
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
                title="Delete Bus"
                message="Are you sure you want to delete this bus entry?"
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
};

export default BusList;
