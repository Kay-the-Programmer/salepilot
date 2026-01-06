import React, { useState } from 'react';
import { Supplier } from '../../types';
import TrashIcon from '../icons/TrashIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import PlusIcon from '../icons/PlusIcon';
import SearchIcon from '../icons/SearchIcon';
import Swipeable from './Swipeable';

interface SupplierListProps {
    suppliers: Supplier[];
    onSelectSupplier: (supplierId: string) => void;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplierId: string) => void;
    onAddNew?: () => void;
    isLoading: boolean;
    error: string | null;
}

const SupplierList: React.FC<SupplierListProps> = ({
    suppliers,
    onSelectSupplier,
    onEdit,
    onDelete,
    onAddNew,
    isLoading,
    error
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const handleSwipe = (direction: 'left' | 'right', supplierId: string) => {
        if (direction === 'left') {
            onDelete(supplierId);
        }
    };

    const handleSupplierClick = (supplierId: string) => {
        setSelectedId(supplierId);
        setTimeout(() => {
            onSelectSupplier(supplierId);
        }, 150);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                <div className="text-gray-600 font-medium">Loading suppliers...</div>
                <div className="text-sm text-gray-400 mt-2">Please wait a moment</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <div className="text-lg font-medium text-gray-900 mb-2">Error Loading Suppliers</div>
                <div className="text-gray-600 text-center mb-6">{error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium active:scale-95 transition-transform"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (suppliers.length === 0) {
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

    const SupplierCard: React.FC<{ supplier: Supplier }> = ({ supplier }) => (
        <div className="mb-3">
            <Swipeable
                onSwipeLeft={() => handleSwipe('left', supplier.id)}
                leftActionColor="bg-red-500"
                leftActionIcon={<TrashIcon className="w-5 h-5 text-white" />}
            >
                <div
                    className={`bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-[0.98] ${selectedId === supplier.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => handleSupplierClick(supplier.id)}
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 text-lg truncate max-w-[calc(100%-60px)]">
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
        </div>
    );

    const SupplierGridItem: React.FC<{ supplier: Supplier }> = ({ supplier }) => (
        <div
            className="bg-white rounded-2xl p-5 border border-gray-200 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => handleSupplierClick(supplier.id)}
        >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 border border-blue-100">
                <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 truncate w-full text-base">{supplier.name}</h3>
            {supplier.contactPerson && (
                <div className="text-sm text-gray-500 mb-3 truncate w-full">{supplier.contactPerson}</div>
            )}
            <div className="flex items-center justify-center gap-2 w-full mt-auto pt-2">
                {supplier.email && <div className="w-2 h-2 rounded-full bg-blue-400" title="Email available" />}
                {supplier.phone && <div className="w-2 h-2 rounded-full bg-green-400" title="Phone available" />}
                {!supplier.email && !supplier.phone && <span className="text-xs text-gray-400">No details</span>}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* View Toggle - Optional, can be kept or moved to main header. Keeping simple row for now. */}
            <div className="px-4 py-3 flex justify-between items-center bg-transparent">
                <div className="text-sm font-medium text-gray-500">
                    {suppliers.length} Supplier{suppliers.length !== 1 ? 's' : ''} Found
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <div className="w-5 h-5 flex flex-col justify-center gap-1">
                            <div className="w-5 h-0.5 bg-current rounded-full" />
                            <div className="w-5 h-0.5 bg-current rounded-full" />
                            <div className="w-5 h-0.5 bg-current rounded-full" />
                        </div>
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <div className="w-5 h-5 grid grid-cols-2 gap-1">
                            <div className="w-2 h-2 bg-current rounded-sm" />
                            <div className="w-2 h-2 bg-current rounded-sm" />
                            <div className="w-2 h-2 bg-current rounded-sm" />
                            <div className="w-2 h-2 bg-current rounded-sm" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {suppliers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <SearchIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No matches found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-6">
                            We couldn't find any suppliers matching your search.
                        </p>
                        {onAddNew && (
                            <button
                                onClick={onAddNew}
                                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl font-medium active:scale-95 transition-transform"
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                Add Supplier
                            </button>
                        )}
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="space-y-2">
                        {suppliers.map((supplier) => (
                            <SupplierCard key={supplier.id} supplier={supplier} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {suppliers.map((supplier) => (
                            <SupplierGridItem key={supplier.id} supplier={supplier} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierList;