import React, { useState } from 'react';
import { Supplier } from '../../types';
import TrashIcon from '../icons/TrashIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import UserCircleIcon from '../icons/UserCircleIcon';

import PhoneIcon from '../icons/PhoneIcon';
import PlusIcon from '../icons/PlusIcon';
import ConfirmationModal from '../ConfirmationModal';
import Swipeable from './Swipeable';
import UnifiedListGrid from '../ui/UnifiedListGrid';
import { StandardCard, StandardRow } from '../ui/standard';

interface SupplierListProps {
    suppliers: Supplier[];
    onSelectSupplier: (supplierId: string) => void;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplierId: string) => void;
    onAddNew?: () => void;
    isLoading: boolean;
    error: string | null;
    viewMode?: 'grid' | 'list';
    selectedSupplierId?: string | null;
}

const SupplierList: React.FC<SupplierListProps> = ({
    suppliers,
    onSelectSupplier,
    onEdit,
    onDelete,
    onAddNew,
    isLoading,
    error,
    viewMode = 'list',
    selectedSupplierId = null
}) => {
    const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

    const handleDeleteClick = (supplierId: string) => {
        setSupplierToDelete(supplierId);
    };

    const confirmDelete = () => {
        if (supplierToDelete) {
            onDelete(supplierToDelete);
            setSupplierToDelete(null);
        }
    };

    // Custom empty state for suppliers
    if (!isLoading && !error && suppliers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <BuildingOfficeIcon className="w-12 h-12 text-gray-400" />
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-2">No Suppliers Yet</div>
                <div className="text-gray-500 text-center mb-8">
                    Add your first supplier to manage contacts, payment terms, and more.
                </div>
                {onAddNew && (
                    <button
                        onClick={onAddNew}
                        className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-medium active:scale-95 transition-transform"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add First Supplier
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            <UnifiedListGrid<Supplier>
                items={suppliers}
                viewMode={viewMode}
                isLoading={isLoading}
                error={error}
                emptyMessage="No suppliers found."
                selectedId={selectedSupplierId}
                getItemId={(supplier) => supplier.id}
                onItemClick={(supplier) => onSelectSupplier(supplier.id)}
                renderGridItem={(supplier, _index, isSelected) => (
                    <StandardCard
                        title={supplier.name}
                        subtitle="Supplier"
                        isSelected={isSelected}
                        onClick={() => onSelectSupplier(supplier.id)}
                        image={
                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600">
                                <BuildingOfficeIcon className="w-16 h-16 opacity-50" />
                            </div>
                        }
                        secondaryInfo={
                            <div className="flex flex-col gap-1 mt-1">
                                {supplier.contactPerson && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
                                        <UserCircleIcon className="w-3 h-3 text-gray-400" />
                                        {supplier.contactPerson}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    {supplier.email && <div className="w-2 h-2 rounded-full bg-blue-400" title="Email available" />}
                                    {supplier.phone && <div className="w-2 h-2 rounded-full bg-green-400" title="Phone available" />}
                                    {!supplier.email && !supplier.phone && <span className="text-[10px] text-gray-400">No contact details</span>}
                                </div>
                            </div>
                        }
                        actions={
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(supplier);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(supplier.id);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100"
                                >
                                    Delete
                                </button>
                            </div>
                        }
                    />
                )}
                renderListItem={(supplier, _index, isSelected) => (
                    <Swipeable
                        onSwipeLeft={() => handleDeleteClick(supplier.id)}
                        leftActionColor="bg-red-500"
                        leftActionIcon={<TrashIcon className="w-5 h-5 text-white" />}
                    >
                        <StandardRow
                            title={supplier.name}
                            isSelected={isSelected}
                            onClick={() => onSelectSupplier(supplier.id)}
                            leading={
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                                </div>
                            }
                            details={[
                                supplier.contactPerson ? (
                                    <div className="flex items-center gap-1 text-gray-600" key="contact">
                                        <UserCircleIcon className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="truncate">{supplier.contactPerson}</span>
                                    </div>
                                ) : null,
                                supplier.phone ? (
                                    <div className="flex items-center gap-1 text-gray-500" key="phone">
                                        <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs">{supplier.phone}</span>
                                    </div>
                                ) : null
                            ]}
                            actions={
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(supplier);
                                        }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        title="Edit"
                                    >
                                        <div className="text-xs font-medium">Edit</div>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(supplier.id);
                                        }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="Delete"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            }
                        />
                    </Swipeable>
                )}
                gridColumns={{ minWidth: '220px' }}
                className="!p-0"
            />

            <ConfirmationModal
                isOpen={!!supplierToDelete}
                onClose={() => setSupplierToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Supplier"
                message="Are you sure you want to delete this supplier? This action cannot be undone and may affect linked products."
                confirmText="Delete Supplier"
                confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
            />
        </>
    );
};

export default SupplierList;