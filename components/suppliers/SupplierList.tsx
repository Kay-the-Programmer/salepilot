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
            <div className="flex flex-col items-center justify-center py-24 px-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[32px] border border-slate-200/50 dark:border-white/5 my-8">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-6 shadow-inner">
                    <BuildingOfficeIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-[22px] font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">No Suppliers Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm mb-8 leading-relaxed">
                    Add your first supplier to manage contacts, payment terms, and streamline reordering.
                </p>
                {onAddNew && (
                    <button
                        onClick={onAddNew}
                        className="flex items-center px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-lg shadow-blue-600/20 active:scale-95 transition-all duration-300 group"
                    >
                        <PlusIcon className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
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
                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[24px] border border-slate-200/50 dark:border-white/5 hover:border-blue-200 hover:dark:border-blue-500/30 shadow-sm"
                        image={
                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-900/80 flex items-center justify-center text-blue-600/80 dark:text-blue-400/80">
                                <BuildingOfficeIcon className="w-12 h-12 md:w-16 md:h-16 opacity-60 mix-blend-multiply dark:mix-blend-screen" />
                            </div>
                        }
                        secondaryInfo={
                            <div className="flex flex-col gap-1.5 mt-2">
                                {supplier.contactPerson && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 truncate bg-slate-50 dark:bg-slate-800 w-fit px-2 py-1 rounded-md">
                                        <UserCircleIcon className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="font-medium">{supplier.contactPerson}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 mt-1 px-1">
                                    {supplier.email && <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/20" title="Email available" />}
                                    {supplier.phone && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/20" title="Phone available" />}
                                    {!supplier.email && !supplier.phone && <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">No Contact Info</span>}
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
                                    className="px-4 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-300 active:scale-95 shadow-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(supplier.id);
                                    }}
                                    className="px-4 py-2 text-[13px] font-semibold text-red-600 dark:text-red-400 hover:text-white bg-red-50 hover:bg-red-500 dark:bg-red-900/20 dark:hover:bg-red-600 rounded-xl transition-all duration-300 active:scale-95 shadow-sm"
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
                        className="rounded-[20px] mb-2 shadow-sm border border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden"
                    >
                        <StandardRow
                            title={supplier.name}
                            isSelected={isSelected}
                            onClick={() => onSelectSupplier(supplier.id)}
                            className="p-4"
                            leading={
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/50 flex items-center justify-center border border-slate-200/50 dark:border-white/5 shadow-inner">
                                    <BuildingOfficeIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 drop-shadow-sm" />
                                </div>
                            }
                            details={[
                                supplier.contactPerson ? (
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md" key="contact">
                                        <UserCircleIcon className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="truncate text-[13px] font-medium">{supplier.contactPerson}</span>
                                    </div>
                                ) : null,
                                supplier.phone ? (
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 px-1" key="phone">
                                        <PhoneIcon className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs font-medium tracking-wide">{supplier.phone}</span>
                                    </div>
                                ) : null
                            ]}
                            actions={
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(supplier);
                                        }}
                                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300 active:scale-95 bg-slate-50 dark:bg-slate-800/50 shadow-sm"
                                        title="Edit"
                                        aria-label="Edit supplier"
                                    >
                                        <div className="text-xs font-semibold px-2">Edit</div>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(supplier.id);
                                        }}
                                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300 active:scale-95 bg-slate-50 dark:bg-slate-800/50 shadow-sm"
                                        title="Delete"
                                        aria-label="Delete supplier"
                                    >
                                        <TrashIcon className="w-4 h-4 mx-1" />
                                    </button>
                                </div>
                            }
                        />
                    </Swipeable>
                )}
                gridColumns={{ minWidth: '240px' }}
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