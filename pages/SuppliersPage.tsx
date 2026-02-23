
import React, { useState, useMemo, useEffect } from 'react';
import { Supplier, Product, StoreSettings } from '../types';
import Header from '../components/Header';
import SupplierList from '../components/suppliers/SupplierList';
import SupplierFormModal from '../components/suppliers/SupplierFormModal';
import SupplierDetailView from '../components/suppliers/SupplierDetailView';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import Pagination from '../components/ui/Pagination';
import ListGridToggle from '../components/ui/ListGridToggle';

interface SuppliersPageProps {
    suppliers: Supplier[];
    products: Product[];
    onSaveSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (supplierId: string) => void;
    isLoading: boolean;
    error: string | null;
    storeSettings: StoreSettings;
}

const SuppliersPage: React.FC<SuppliersPageProps> = ({
    suppliers,
    products,
    onSaveSupplier,
    onDeleteSupplier,
    isLoading,
    error,
    storeSettings,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const handleOpenAddModal = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    const handleSave = (supplier: Supplier) => {
        onSaveSupplier(supplier);
        handleCloseModal();
    };

    const handleSelectSupplier = (supplierId: string) => {
        setSelectedSupplierId(supplierId);
    };

    const handleBackToList = () => {
        setSelectedSupplierId(null);
    };

    const filteredSuppliers = useMemo(() => suppliers.filter(supplier => {
        if (searchTerm.trim() === '') return true;
        const term = searchTerm.toLowerCase();
        return (
            supplier.name.toLowerCase().includes(term) ||
            (supplier.email && supplier.email.toLowerCase().includes(term)) ||
            (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(term))
        );
    }), [suppliers, searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const paginatedSuppliers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredSuppliers.slice(start, start + pageSize);
    }, [filteredSuppliers, page, pageSize]);

    const selectedSupplier = useMemo(() =>
        suppliers.find(c => c.id === selectedSupplierId),
        [suppliers, selectedSupplierId]
    );

    const supplierProducts = useMemo(() =>
        products.filter(p => p.supplierId === selectedSupplierId),
        [products, selectedSupplierId]
    );

    if (selectedSupplier) {
        return (
            <div className="flex flex-col h-full">
                <header className="bg-gray-100/80 dark:bg-slate-900/80 backdrop-blur-[2px] sticky top-0 z-10 border-b border-gray-200/50 dark:border-slate-800/50 glass-effect">
                    <div className="mx-auto px-4 sm:px-4 lg:px-4">
                        <div className="flex items-center h-16">
                            <button
                                onClick={handleBackToList}
                                className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 transition-colors active:scale-95 transition-all duration-300"
                                aria-label="Back to supplier list"
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate">
                                {selectedSupplier.name}
                            </h1>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-slate-950">
                    <SupplierDetailView
                        supplier={selectedSupplier}
                        products={supplierProducts}
                        onEdit={handleOpenEditModal}
                        storeSettings={storeSettings}
                    />
                </main>
                <SupplierFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    supplierToEdit={editingSupplier}
                />
            </div>
        )
    }

    return (
        <>
            <Header
                title="Suppliers"
                buttonText="Add Supplier"
                onButtonClick={handleOpenAddModal}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-slate-950">
                <div className="px-4 py-3 flex justify-end">
                    <ListGridToggle
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        size="sm"
                    />
                </div>
                <SupplierList
                    suppliers={paginatedSuppliers}
                    onSelectSupplier={handleSelectSupplier}
                    onEdit={handleOpenEditModal}
                    onDelete={onDeleteSupplier}
                    onAddNew={handleOpenAddModal}
                    isLoading={isLoading}
                    error={error}
                    viewMode={viewMode}
                    selectedSupplierId={selectedSupplierId}
                />
                <Pagination
                    total={filteredSuppliers.length}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    label="suppliers"
                    className="border-t border-gray-200 dark:border-slate-800 backdrop-blur-[2px] sticky bottom-0 glass-effect !bg-white/80 dark:!bg-slate-900/80"
                />
            </main>
            <SupplierFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                supplierToEdit={editingSupplier}
            />
        </>
    );
};

export default SuppliersPage;
