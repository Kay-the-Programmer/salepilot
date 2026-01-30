import React, { useState } from 'react';
import { Supplier } from '../../types';
import TrashIcon from '../icons/TrashIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import PlusIcon from '../icons/PlusIcon';
import ConfirmationModal from '../ConfirmationModal';
import Swipeable from './Swipeable';
import UnifiedListGrid from '../ui/UnifiedListGrid';

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

// Supplier Grid Card Component
const SupplierGridCard: React.FC<{
    supplier: Supplier;
    isSelected: boolean;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplierId: string) => void;
}> = ({ supplier, isSelected, onEdit, onDelete }) => (
    <div
        className={`group bg-white rounded-2xl p-5 border flex flex-col items-center text-center shadow-sm transition-all duration-300 ${isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md transform scale-[1.02]'
                : 'border-gray-200 hover:shadow-md hover:border-blue-100'
            }`}
    >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 border border-blue-100">
            <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className={`font-bold mb-1 truncate w-full text-base transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
            }`}>{supplier.name}</h3>
        {supplier.contactPerson && (
            <div className="text-sm text-gray-500 mb-3 truncate w-full">{supplier.contactPerson}</div>
        )}
        <div className="flex items-center justify-center gap-2 w-full mt-auto pt-2">
            {supplier.email && <div className="w-2 h-2 rounded-full bg-blue-400" title="Email available" />}
            {supplier.phone && <div className="w-2 h-2 rounded-full bg-green-400" title="Phone available" />}
            {!supplier.email && !supplier.phone && <span className="text-xs text-gray-400">No details</span>}
        </div>

        {/* Action buttons that appear on hover */}
        <div className="mt-3 pt-3 border-t border-gray-100 w-full flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(supplier);
                }}
                className="flex-1 py-2 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
                Edit
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(supplier.id);
                }}
                className="flex-1 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
                Delete
            </button>
        </div>
    </div>
);

// Supplier List Card Component (with swipeable)
const SupplierListCard: React.FC<{
    supplier: Supplier;
    isSelected: boolean;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplierId: string) => void;
    onClick: () => void;
}> = ({ supplier, isSelected, onEdit, onDelete, onClick }) => (
    <Swipeable
        onSwipeLeft={() => onDelete(supplier.id)}
        leftActionColor="bg-red-500"
        leftActionIcon={<TrashIcon className="w-5 h-5 text-white" />}
    >
        <div
            className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:shadow-md'
                }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <h3 className={`font-bold text-lg truncate max-w-[calc(100%-60px)] ${isSelected ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                    {supplier.name}
                </h3>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                </div>
            </div>
            {supplier.contactPerson && (
                <div className="flex items-center text-sm text-gray-500 mt-1">
                    <UserCircleIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span className="truncate">{supplier.contactPerson}</span>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
                {supplier.phone ? (
                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <PhoneIcon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                        <span className="truncate text-xs font-medium">{supplier.phone}</span>
                    </div>
                ) : (
                    <div className="flex items-center text-sm text-gray-400 bg-gray-50/50 p-2 rounded-lg decoration-dashed">
                        <span className="text-xs">No phone</span>
                    </div>
                )}

                {supplier.email ? (
                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                        <span className="truncate text-xs font-medium">{supplier.email}</span>
                    </div>
                ) : (
                    <div className="flex items-center text-sm text-gray-400 bg-gray-50/50 p-2 rounded-lg decoration-dashed">
                        <span className="text-xs">No email</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end mt-4 gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(supplier);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg border border-gray-200 hover:bg-white hover:border-gray-300 active:bg-gray-100 transition-all"
                >
                    Edit
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(supplier.id);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg border border-red-100 hover:bg-white hover:border-red-200 active:bg-red-50 transition-all"
                >
                    Delete
                </button>
            </div>
        </div>
    </Swipeable>
);

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
                    <SupplierGridCard
                        supplier={supplier}
                        isSelected={isSelected}
                        onEdit={onEdit}
                        onDelete={handleDeleteClick}
                    />
                )}
                renderListItem={(supplier, _index, isSelected) => (
                    <SupplierListCard
                        supplier={supplier}
                        isSelected={isSelected}
                        onEdit={onEdit}
                        onDelete={handleDeleteClick}
                        onClick={() => onSelectSupplier(supplier.id)}
                    />
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