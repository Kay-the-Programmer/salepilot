import React, { useState } from 'react';
import { Supplier } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import PlusIcon from '../icons/PlusIcon';
import SearchIcon from '../icons/SearchIcon';
import FunnelIcon from '../icons/FunnelIcon';
import Swipeable from './SwipeAble';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone?.includes(searchQuery)
    );

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
        <Swipeable
            onSwipeLeft={() => handleSwipe('left', supplier.id)}
            onSwipeRight={() => {}}
            leftActionColor="bg-red-500"
            leftActionIcon={<TrashIcon className="w-5 h-5 text-white" />}
        >
            <div 
                className={`bg-white rounded-2xl p-4 border border-gray-200 mb-3 transition-all duration-200 ${
                    selectedId === supplier.id 
                        ? 'ring-2 ring-gray-900 scale-[0.99]' 
                        : 'hover:shadow-lg active:scale-[0.99]'
                }`}
                onClick={() => handleSupplierClick(supplier.id)}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-3">
                            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900">{supplier.name}</div>
                            {supplier.contactPerson && (
                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <UserCircleIcon className="w-4 h-4 mr-1" />
                                    {supplier.contactPerson}
                                </div>
                            )}
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="space-y-2">
                    {supplier.email && (
                        <div className="flex items-center text-sm">
                            <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-600 truncate">{supplier.email}</span>
                        </div>
                    )}
                    
                    {supplier.phone && (
                        <div className="flex items-center text-sm">
                            <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{supplier.phone}</span>
                        </div>
                    )}
                    
                    {supplier.paymentTerms && (
                        <div className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg mt-2">
                            {supplier.paymentTerms}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(supplier);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors mr-2"
                    >
                        Edit
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(supplier.id);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </Swipeable>
    );

    const SupplierGridItem: React.FC<{ supplier: Supplier }> = ({ supplier }) => (
        <div 
            className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col items-center text-center hover:shadow-lg active:scale-[0.98] transition-all"
            onClick={() => handleSupplierClick(supplier.id)}
        >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="font-semibold text-gray-900 mb-1 truncate w-full">{supplier.name}</div>
            {supplier.contactPerson && (
                <div className="text-sm text-gray-600 mb-2 truncate w-full">{supplier.contactPerson}</div>
            )}
            <div className="text-xs text-gray-500 mt-auto pt-3">
                {supplier.email ? 'Email available' : 'No contact info'}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Suppliers</h1>
                        <div className="text-sm text-gray-500">
                            {filteredSuppliers.length} of {suppliers.length} suppliers
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            className="p-2 rounded-lg bg-gray-100 active:bg-gray-200 transition-colors"
                            aria-label={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
                        >
                            <FunnelIcon className="w-5 h-5 text-gray-600" />
                        </button>
                        {onAddNew && (
                            <button
                                onClick={onAddNew}
                                className="flex items-center px-3 py-2 bg-gray-900 text-white rounded-xl font-medium active:scale-95 transition-transform"
                            >
                                <PlusIcon className="w-5 h-5 mr-1" />
                                <span className="text-sm">Add</span>
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Search */}
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {filteredSuppliers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <SearchIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-lg font-medium text-gray-900 mb-2">No matches found</div>
                        <div className="text-gray-500 text-center">
                            Try adjusting your search or filter to find what you're looking for.
                        </div>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="space-y-2">
                        {filteredSuppliers.map((supplier) => (
                            <SupplierCard key={supplier.id} supplier={supplier} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredSuppliers.map((supplier) => (
                            <SupplierGridItem key={supplier.id} supplier={supplier} />
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Stats Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                        <span className="font-medium text-gray-700">{filteredSuppliers.length}</span> suppliers shown
                    </div>
                    <div className="flex items-center space-x-4">
                        <div>
                            <span className="font-medium text-gray-700">
                                {suppliers.filter(s => s.email).length}
                            </span> with email
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">
                                {suppliers.filter(s => s.phone).length}
                            </span> with phone
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierList;