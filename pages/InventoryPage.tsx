import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, Supplier, StoreSettings, User, Account } from '../types';

import ProductList from '../components/ProductList';
import ProductFormModal from '../components/ProductFormModal';
import CategoryList from '../components/CategoryList';
import CategoryFormModal from '../components/CategoryFormModal';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import LabelPrintModal from '../components/LabelPrintModal';
import ProductDetailView from '../components/products/ProductDetailView';
import { api } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import { FiFilter, FiGrid, FiList, FiPlusCircle, FiCamera, FiX } from 'react-icons/fi';
import Header from '../components/Header';
import GridIcon from '../components/icons/GridIcon';
import UnifiedScannerModal from '../components/UnifiedScannerModal';
import CubeIcon from '../components/icons/CubeIcon';
import TagIcon from '../components/icons/TagIcon';
import PlusIcon from '../components/icons/PlusIcon';
import LoadingSpinner from '../components/LoadingSpinner';

interface InventoryPageProps {
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    accounts?: Account[];
    onSaveProduct: (product: Product | Omit<Product, 'id'>) => Promise<Product>;
    onDeleteProduct: (productId: string) => void;
    onArchiveProduct: (productId: string) => void;
    onStockChange: (productId: string, newStock: number) => void;
    onAdjustStock: (productId: string, newQuantity: number, reason: string) => void;
    onSaveCategory?: (category: Category) => void;
    onDeleteCategory?: (categoryId: string) => void;
    isLoading: boolean;
    error: string | null;
    storeSettings: StoreSettings;
    currentUser: User;
}

const InventoryPage: React.FC<InventoryPageProps> = ({
    products,
    categories,
    suppliers,
    accounts = [],
    onSaveProduct,
    onDeleteProduct,
    onArchiveProduct,
    onStockChange,
    onAdjustStock,
    onSaveCategory,
    onDeleteCategory,
    isLoading,
    error,
    storeSettings,
    currentUser
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
    const [stockAdjustInitialReason, setStockAdjustInitialReason] = useState<string | undefined>(undefined);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [productToPrint, setProductToPrint] = useState<Product | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);


    // Category Management State
    const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
    const [detailIsLoading, setDetailIsLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const supplierMap = new Map(suppliers.map(s => [s.id, s]));

    const canManageProducts = currentUser.role === 'admin' || currentUser.role === 'inventory_manager';

    useEffect(() => {
        if (selectedProductId) {
            const fetchProduct = async () => {
                setDetailIsLoading(true);
                setDetailError(null);
                try {
                    const product = await api.get<Product>(`/products/${selectedProductId}`);
                    setDetailedProduct(product);
                } catch (err: any) {
                    // Fallback to local state first
                    const local = products.find(p => p.id === selectedProductId) || null;
                    if (local) {
                        setDetailedProduct(local);
                        setDetailError(null);
                    } else {
                        // Lazy-load from IndexedDB as a deeper fallback
                        try {
                            const { dbService } = await import('../services/dbService');
                            const cached = await dbService.get<Product>('products', selectedProductId);
                            if (cached) {
                                setDetailedProduct(cached);
                                setDetailError(null);
                            } else {
                                setDetailedProduct(null);
                                setDetailError(err.message || 'Product details unavailable offline');
                            }
                        } catch (e: any) {
                            setDetailedProduct(null);
                            setDetailError(err.message || e?.message || 'Product details unavailable offline');
                        }
                    }
                } finally {
                    setDetailIsLoading(false);
                }
            };
            fetchProduct();
        } else {
            setDetailedProduct(null);
        }
    }, [selectedProductId, products]);

    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSave = async (productData: Product | Omit<Product, 'id'>) => {
        try {
            const savedProduct = await onSaveProduct(productData);
            handleCloseModal();
            setSearchTerm('');
            setPage(1);

            if (detailedProduct && detailedProduct.id === savedProduct.id) {
                setDetailedProduct(savedProduct);
            }
        } catch (error) {
            console.error("Failed to save product:", error);
        }
    };

    const handleOpenStockModal = (product: Product, initialReason?: string) => {
        setStockAdjustProduct(product);
        setStockAdjustInitialReason(initialReason);
        setIsStockModalOpen(true);
    };

    const handleCloseStockModal = () => {
        setIsStockModalOpen(false);
        setStockAdjustProduct(null);
        setStockAdjustInitialReason(undefined);
    };

    const handleSaveStockAdjustment = (productId: string, newQuantity: number, reason: string) => {
        onAdjustStock(productId, newQuantity, reason);
        if (detailedProduct && detailedProduct.id === productId) {
            setDetailedProduct(prev => {
                if (!prev) return null;
                let nextStock = prev.stock;
                if (reason === 'Stock Count') {
                    nextStock = newQuantity;
                } else {
                    nextStock = Math.max(0, prev.stock + newQuantity);
                }
                return { ...prev, stock: nextStock };
            });
        }
        handleCloseStockModal();
    };

    const handleOpenAddCategoryModal = () => {
        setEditingCategory(null);
        setIsCategoryModalOpen(true);
    };

    const handleOpenEditCategoryModal = (category: Category) => {
        setEditingCategory(category);
        setIsCategoryModalOpen(true);
    };

    const handleCloseCategoryModal = () => {
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
    };

    const handleSaveCategoryInternal = (category: Category) => {
        if (onSaveCategory) {
            onSaveCategory(category);
        }
        handleCloseCategoryModal();
    };

    const handleOpenPrintModal = (product: Product) => {
        setProductToPrint(product);
        setIsPrintModalOpen(true);
    };

    const handleClosePrintModal = () => {
        setIsPrintModalOpen(false);
        setProductToPrint(null);
    };

    const handleOpenDeleteModal = (product: Product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setProductToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleConfirmDelete = () => {
        if (productToDelete) {
            onDeleteProduct(productToDelete.id);
            handleBackToList();
        }
        handleCloseDeleteModal();
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProductId(product.id);
    };

    const handleBackToList = () => {
        setSelectedProductId(null);
        setSearchTerm('');
    };

    const filteredProducts = products.filter(product => {
        if (!showArchived && product.status === 'archived') {
            return false;
        }

        if (searchTerm.trim() === '') return true;

        const term = searchTerm.toLowerCase();
        const category = product.categoryId ? categoryMap.get(product.categoryId) : null;
        const supplier = product.supplierId ? supplierMap.get(product.supplierId) : null;

        return (
            product.name.toLowerCase().includes(term) ||
            product.sku.toLowerCase().includes(term) ||
            (product.barcode && product.barcode.toLowerCase().includes(term)) ||
            (category && category.name.toLowerCase().includes(term)) ||
            (supplier && supplier.name.toLowerCase().includes(term)) ||
            (product.brand && product.brand.toLowerCase().includes(term))
        );
    });

    type SortBy = 'name' | 'price' | 'stock' | 'category' | 'sku';
    type SortOrder = 'asc' | 'desc';
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const sortedProducts = useMemo(() => {
        const arr = [...filteredProducts];
        const getCategoryName = (p: Product) => (p.categoryId ? (categoryMap.get(p.categoryId)?.name || '') : '');
        arr.sort((a, b) => {
            let cmp = 0;
            switch (sortBy) {
                case 'price':
                    cmp = (a.price || 0) - (b.price || 0);
                    break;
                case 'stock':
                    cmp = (Number(a.stock) || 0) - (Number(b.stock) || 0);
                    break;
                case 'category':
                    cmp = getCategoryName(a).localeCompare(getCategoryName(b));
                    break;
                case 'sku':
                    cmp = (a.sku || '').localeCompare(b.sku || '');
                    break;
                case 'name':
                default:
                    cmp = (a.name || '').localeCompare(b.name || '');
            }
            return sortOrder === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [filteredProducts, sortBy, sortOrder, categoryMap]);

    const [page, setPage] = useState(1);
    const pageSize = 12;
    const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));

    const paginatedProducts = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedProducts.slice(start, start + pageSize);
    }, [sortedProducts, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, showArchived, sortBy, sortOrder]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const selectedProductCategory = useMemo(() => {
        if (!detailedProduct || !detailedProduct.categoryId) return undefined;
        return categories.find(c => c.id === detailedProduct.categoryId);
    }, [detailedProduct, categories]);

    const selectedProductSupplier = useMemo(() => {
        if (!detailedProduct || !detailedProduct.supplierId) return undefined;
        return suppliers.find(s => s.id === detailedProduct.supplierId);
    }, [detailedProduct, suppliers]);

    const displayedAttributes = useMemo(() => {
        if (!detailedProduct?.categoryId) return [];

        const attributeDefinitions = new Map<string, string>();
        let currentCatId: string | null | undefined = detailedProduct.categoryId;
        while (currentCatId) {
            const category = categories.find(c => c.id === currentCatId);
            if (category) {
                category.attributes.forEach(attr => {
                    if (!attributeDefinitions.has(attr.id)) {
                        attributeDefinitions.set(attr.id, attr.name);
                    }
                });
                currentCatId = category.parentId;
            } else {
                currentCatId = null;
            }
        }

        const attrs: { name: string; value: string }[] = [];
        if (detailedProduct.customAttributes) {
            for (const attrId in detailedProduct.customAttributes) {
                if (attributeDefinitions.has(attrId)) {
                    attrs.push({
                        name: attributeDefinitions.get(attrId)!,
                        value: detailedProduct.customAttributes[attrId]
                    });
                }
            }
        }
        return attrs;
    }, [detailedProduct, categories]);

    if (selectedProductId) {
        return (
            <>
                <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
                    <main className="flex-1 overflow-y-auto bg-gray-50/50">
                        <div className="w-full h-full">
                            {detailIsLoading && (
                                <LoadingSpinner fullScreen={false} text="Loading product details..." className="py-20" />
                            )}
                            {detailError && (
                                <div className="text-center p-10 bg-red-50 rounded-xl border border-red-200 m-6">
                                    <p className="text-red-600 font-medium">Error loading product</p>
                                    <p className="text-red-500 text-sm mt-1">{detailError}</p>
                                </div>
                            )}
                            {detailedProduct && (
                                <div className="animate-fadeIn">
                                    <ProductDetailView
                                        product={detailedProduct}
                                        category={selectedProductCategory}
                                        supplier={selectedProductSupplier}
                                        attributes={displayedAttributes}
                                        storeSettings={storeSettings}
                                        user={currentUser}
                                        onEdit={handleOpenEditModal}
                                        onDelete={handleOpenDeleteModal}
                                        onArchive={onArchiveProduct}
                                        onPrintLabel={handleOpenPrintModal}
                                        onAdjustStock={handleOpenStockModal}
                                        onPersonalUse={(p) => handleOpenStockModal(p, 'Personal Use')}
                                        onBack={handleBackToList}
                                    />
                                </div>
                            )}
                        </div>
                    </main>
                </div>
                {canManageProducts && isModalOpen && (
                    <ProductFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        productToEdit={editingProduct}
                        categories={categories}
                        suppliers={suppliers}
                        storeSettings={storeSettings}
                    />
                )}
                {canManageProducts && isStockModalOpen && (
                    <StockAdjustmentModal
                        isOpen={isStockModalOpen}
                        onClose={handleCloseStockModal}
                        onSave={handleSaveStockAdjustment}
                        product={stockAdjustProduct}
                        initialReason={stockAdjustInitialReason}
                    />
                )}
                <LabelPrintModal
                    isOpen={isPrintModalOpen}
                    onClose={handleClosePrintModal}
                    product={productToPrint}
                    storeSettings={storeSettings}
                />
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleConfirmDelete}
                    title="Delete Product"
                    message={
                        <p>Are you sure you want to permanently delete "<strong>{productToDelete?.name}</strong>"? This action cannot be undone.</p>
                    }
                    confirmText="Delete"
                />
                <UnifiedScannerModal
                    isOpen={isScanModalOpen}
                    onClose={() => setIsScanModalOpen(false)}
                    onScanSuccess={(code) => {
                        // Try to find product by barcode or SKU
                        const scannedProduct = products.find(p =>
                            p.sku === code ||
                            p.barcode === code ||
                            (p.variants && p.variants.some(v => v.sku === code))
                        );

                        if (scannedProduct) {
                            setSelectedProductId(scannedProduct.id);
                            setIsScanModalOpen(false);
                        } else {
                            setSearchTerm(code);
                            setIsScanModalOpen(false);
                            // Optional: Show "Product not found" toast or let the search result show "No products found"
                        }
                    }}
                />
            </>
        )
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Custom Header (Desktop) */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 hidden md:block">
                <Header
                    title="Inventory"
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    isSearchActive={isSearchActive}
                    setIsSearchActive={setIsSearchActive}
                    className="!static !border-none !shadow-none"
                    buttonText={canManageProducts ? (activeTab === 'products' ? 'Add Product' : 'Add Category') : undefined}
                    onButtonClick={canManageProducts ? (activeTab === 'products' ? handleOpenAddModal : handleOpenAddCategoryModal) : undefined}
                    searchLeftContent={
                        <div className="flex items-center gap-3 mr-4">
                            <div className="flex bg-gray-100/80 p-1 rounded-xl shrink-0">
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'products'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Products
                                </button>
                                <button
                                    onClick={() => setActiveTab('categories')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'categories'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Categories
                                </button>
                            </div>

                            {activeTab === 'products' && (
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${showFilters || searchTerm || showArchived
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <FiFilter className="w-4 h-4" />
                                    Filters
                                </button>
                            )}
                        </div>
                    }
                />
            </div>

            {/* Mobile Header (New) */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900">
                        {activeTab === 'products' ? 'Products' : 'Categories'}
                    </h1>
                    <div className="flex items-center gap-2">
                        {/* Scan Button */}
                        <button
                            onClick={() => setIsScanModalOpen(true)}
                            className="p-2 rounded-lg text-gray-600 active:bg-gray-100 transition-colors"
                            aria-label="Scan Barcode"
                        >
                            <FiCamera className="w-6 h-6" />
                        </button>
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 rounded-lg active:bg-gray-100 transition-colors ${isMobileMenuOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                            aria-label="Menu"
                        >
                            <GridIcon className="w-6 h-6" />
                        </button>
                        {/* Filter Button */}
                        <button
                            onClick={() => setIsFilterPopupOpen(true)}
                            className={`p-2 rounded-lg active:bg-gray-100 transition-colors ${isFilterPopupOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            aria-label="Filters"
                        >
                            <FiFilter className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Popup */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute inset-0 bg-black/50 animate-fade-in" />
                    <div
                        className="absolute top-[60px] right-4 left-auto w-48 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-gray-100 p-2"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setActiveTab('products');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${activeTab === 'products'
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <CubeIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-semibold">Products</span>
                            </button>

                            <button
                                onClick={() => {
                                    setActiveTab('categories');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${activeTab === 'categories'
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <TagIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-semibold">Categories</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsScanModalOpen(true);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="hidden flex-col items-center justify-center p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all"
                            >
                                <FiCamera className="w-6 h-6 mb-1" />
                                <span className="text-xs font-semibold">Scan Item</span>
                            </button>

                            {canManageProducts && (
                                <button
                                    onClick={() => {
                                        handleOpenAddModal();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                                >
                                    <PlusIcon className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-semibold">Add</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Filter Popup */}
            {isFilterPopupOpen && (
                <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsFilterPopupOpen(false)}>
                    <div className="absolute inset-0 bg-black/50 animate-fade-in" />
                    {/* Position below header roughly or absolute right */}
                    <div
                        className="absolute top-[60px] right-4 left-auto w-64 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-gray-100 p-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Filter Options</h3>
                            <button onClick={() => setIsFilterPopupOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg">
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Sort */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Sort By</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['name', 'price', 'stock', 'category'].map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setSortBy(option as any)}
                                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${sortBy === option
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                                >
                                    <span>Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                </button>
                            </div>

                            {/* View Mode */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">View Mode</label>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                                    >
                                        <FiGrid className="w-4 h-4" /> Grid
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                                    >
                                        <FiList className="w-4 h-4" /> List
                                    </button>
                                </div>
                            </div>

                            {/* Archived Toggle */}
                            <label className="flex items-center justify-between text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span>Show Archived</span>
                                <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${showArchived ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    onClick={() => setShowArchived(!showArchived)}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showArchived ? 'translate-x-4' : 'translate-x-0'}`}
                                    />
                                </div>
                            </label>

                            <button
                                onClick={() => setIsFilterPopupOpen(false)}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium text-sm shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-transform"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                {activeTab === 'products' ? (
                    <>
                        {/* Collapsible Filters Section */}
                        {showFilters && (
                            <div className="bg-white border-b border-gray-100 px-4 py-4 animate-slideDown">
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Sort By</label>
                                            <div className="flex gap-2">
                                                <select
                                                    className="flex-1 form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value as any)}
                                                >
                                                    <option value="name">Name</option>
                                                    <option value="price">Price</option>
                                                    <option value="stock">Stock</option>
                                                    <option value="category">Category</option>
                                                </select>
                                                <button
                                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                                                >
                                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                                                checked={showArchived}
                                                onChange={(e) => setShowArchived(e.target.checked)}
                                            />
                                            Show Archived
                                        </label>

                                        {/* View Mode Toggle moved here */}
                                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                                            <button
                                                onClick={() => setViewMode('grid')}
                                                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                                            >
                                                <FiGrid className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                                            >
                                                <FiList className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <ProductList
                            products={paginatedProducts}
                            categories={categories}
                            onSelectProduct={handleSelectProduct}
                            onStockChange={onStockChange}
                            onAdjustStock={handleOpenStockModal}
                            isLoading={isLoading}
                            error={error}
                            storeSettings={storeSettings}
                            userRole={currentUser.role as any}
                            viewMode={viewMode}
                        />

                        {/* Pagination - Simplified for mobile */}
                        {sortedProducts.length > 0 && (
                            <div className="px-4 py-6 pb-24 sm:pb-6">
                                <div className="flex flex-col items-center gap-4">
                                    <span className="text-sm text-gray-500">
                                        {sortedProducts.length} Products • Page {page} of {totalPages}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page <= 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page >= totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Floating Action Button */}
                        {/* FAB removed - moved to header */}
                    </>
                ) : (
                    <div className="px-4 py-6">
                        <CategoryList
                            categories={categories}
                            searchTerm={searchTerm}
                            onEdit={handleOpenEditCategoryModal}
                            onDelete={onDeleteCategory || (() => { })}
                            isLoading={isLoading}
                            error={error}
                        />
                        {/* FAB for Categories */}
                        {/* FAB removed - moved to header */}
                    </div>
                )}
            </main>

            {
                canManageProducts && isModalOpen && (
                    <ProductFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        productToEdit={editingProduct}
                        categories={categories}
                        suppliers={suppliers}
                        storeSettings={storeSettings}
                        onAddCategory={handleOpenAddCategoryModal}
                    />
                )
            }

            {
                canManageProducts && isStockModalOpen && (
                    <StockAdjustmentModal
                        isOpen={isStockModalOpen}
                        onClose={handleCloseStockModal}
                        onSave={handleSaveStockAdjustment}
                        product={stockAdjustProduct}
                        initialReason={stockAdjustInitialReason}
                    />
                )
            }

            {
                canManageProducts && (
                    <CategoryFormModal
                        isOpen={isCategoryModalOpen}
                        onClose={handleCloseCategoryModal}
                        onSave={handleSaveCategoryInternal}
                        categoryToEdit={editingCategory}
                        allCategories={categories}
                        accounts={accounts}
                    />
                )
            }
            <LabelPrintModal
                isOpen={isPrintModalOpen}
                onClose={handleClosePrintModal}
                product={productToPrint}
                storeSettings={storeSettings}
            />
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Delete Product"
                message={
                    <p>Are you sure you want to permanently delete "<strong>{productToDelete?.name}</strong>"? This action cannot be undone.</p>
                }
                confirmText="Delete"
            />
            <UnifiedScannerModal
                isOpen={isScanModalOpen}
                onClose={() => setIsScanModalOpen(false)}
                onScanSuccess={(code) => {
                    // Try to find product by barcode or SKU
                    const scannedProduct = products.find(p =>
                        p.sku === code ||
                        p.barcode === code ||
                        (p.variants && p.variants.some(v => v.sku === code))
                    );

                    if (scannedProduct) {
                        setSelectedProductId(scannedProduct.id);
                        setIsScanModalOpen(false);
                    } else {
                        setSearchTerm(code);
                        setIsScanModalOpen(false);
                    }
                }}
            />
        </div >
    );
};

export default InventoryPage;