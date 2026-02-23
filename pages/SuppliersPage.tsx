
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
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-google">
                <header className="flex-none sticky top-0 z-40 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-transparent transition-all duration-300">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6 flex items-center h-16 sm:h-auto">
                        <button
                            onClick={handleBackToList}
                            className="mr-4 p-2.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 transition-colors active:scale-95 duration-300 backdrop-blur-md"
                            aria-label="Back to supplier list"
                        >
                            <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <h1 className="text-[22px] sm:text-[34px] font-bold sm:font-semibold text-slate-900 dark:text-white leading-tight truncate tracking-tight">
                            {selectedSupplier.name}
                        </h1>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
                    <div className="max-w-[1400px] mx-auto w-full">
                        <SupplierDetailView
                            supplier={selectedSupplier}
                            products={supplierProducts}
                            onEdit={handleOpenEditModal}
                            storeSettings={storeSettings}
                        />
                    </div>
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
        <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 font-google overflow-hidden relative">
            <Header
                title="Suppliers"
                buttonText="Add Supplier"
                onButtonClick={handleOpenAddModal}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                rightContent={
                    <ListGridToggle
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        size="sm"
                    />
                }
            />
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 scroll-smooth" id="suppliers-content" tabIndex={-1}>
                <div className="max-w-[1400px] mx-auto w-full">
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

                    {filteredSuppliers.length > 0 && (
                        <div className="mt-8 mb-20 md:mb-0">
                            <Pagination
                                total={filteredSuppliers.length}
                                page={page}
                                pageSize={pageSize}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                label="suppliers"
                            />
                        </div>
                    )}
                </div>
            </main>
            <SupplierFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                supplierToEdit={editingSupplier}
            />
        </div>
    );
};

export default SuppliersPage;
