import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, Supplier, StoreSettings, User, Account } from '../types';
import Header from '../components/Header';
import ProductList from '../components/ProductList';
import ProductFormModal from '../components/ProductFormModal';
import CategoryList from '../components/CategoryList';
import CategoryFormModal from '../components/CategoryFormModal';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import LabelPrintModal from '../components/LabelPrintModal';
import ProductDetailView from '../components/products/ProductDetailView';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { api } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

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

    // Category Management State
    const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);



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
            // onSaveProduct now handles state updates, so we just need to call it
            // and close the modal on success.
            const savedProduct = await onSaveProduct(productData);
            handleCloseModal();

            // Ensure the newly added/updated product is visible in the list by clearing any active search filter
            setSearchTerm('');
            // And jump to the first page so the newest items (usually at the top) are visible
            setPage(1);

            // If user was on a detail page for the product that was just edited,
            // update that specific product's state to ensure the view is fresh.
            if (detailedProduct && detailedProduct.id === savedProduct.id) {
                setDetailedProduct(savedProduct);
            }
        } catch (error) {
            // Error is handled by onSaveProduct, which shows a snackbar.
            // We catch it here to prevent the modal from closing on failure.
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
                    // Treat as signed delta for non Stock Count reasons
                    nextStock = Math.max(0, prev.stock + newQuantity);
                }
                return { ...prev, stock: nextStock };
            });
        }
        handleCloseStockModal();
    };

    // Category Handlers
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
            handleBackToList(); // Go back to list view after deletion
        }
        handleCloseDeleteModal();
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProductId(product.id);
    };

    const handleBackToList = () => {
        setSelectedProductId(null);
        setSearchTerm(''); // Clear search when going back
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

    // --- Sorting ---
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

    // --- Pagination ---
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));

    const paginatedProducts = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedProducts.slice(start, start + pageSize);
    }, [sortedProducts, page, pageSize]);

    useEffect(() => {
        // Reset to first page when filters/sorting change
        setPage(1);
    }, [searchTerm, showArchived, sortBy, sortOrder]);

    useEffect(() => {
        // Clamp current page if total pages shrink
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
                <div className="flex flex-col h-full bg-gray-100">
                    <header className="bg-gray-100 z-10">
                        <div className="mx-auto px-0 sm:px-6 lg:px-8">
                            <div className="flex items-center h-16">
                                <button
                                    onClick={handleBackToList}
                                    className="mr-4 p-2 rounded-full hover:bg-gray-100"
                                    aria-label="Back to product list"
                                >
                                    <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
                                </button>
                                <h1 className="text-xl font-bold leading-7 text-gray-700 sm:truncate">
                                    Product Details
                                </h1>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 overflow-x-hidden overflow-y-auto">
                        {detailIsLoading && <div className="text-center p-10">Loading product details...</div>}
                        {detailError && <div className="text-center p-10 text-red-500">Error: {detailError}</div>}
                        {detailedProduct && (
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
                            />
                        )}
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
            </>
        )
    }

    return (
        <>
            <Header
                title="Product Inventory"
                buttonText={canManageProducts ? (activeTab === 'products' ? "Add Product" : "Add Category") : undefined}
                onButtonClick={canManageProducts ? (activeTab === 'products' ? handleOpenAddModal : handleOpenAddCategoryModal) : undefined}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showArchivedToggle={false}
                showArchived={showArchived}
                setShowArchived={setShowArchived}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                {/* Tabs */}
                <div className="bg-white border-b px-4">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`${activeTab === 'products'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`${activeTab === 'categories'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Categories
                        </button>
                    </nav>
                </div>

                {activeTab === 'products' ? (
                    <>

                        {/* Sorting controls */}
                        <div className="px-4 pt-4">
                            <div className="bg-white rounded-md border p-3 flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="sortBy" className="text-sm text-gray-700">Sort by</label>
                                    <select
                                        id="sortBy"
                                        className="border rounded px-2 py-1 text-sm"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                    >
                                        <option value="name">Name</option>
                                        <option value="sku">SKU</option>
                                        <option value="price">Price</option>
                                        <option value="stock">Stock</option>
                                        <option value="category">Category</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="sortOrder" className="text-sm text-gray-700">Order</label>
                                    <select
                                        id="sortOrder"
                                        className="border rounded px-2 py-1 text-sm"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as any)}
                                    >
                                        <option value="asc">Ascending</option>
                                        <option value="desc">Descending</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <ProductList
                            products={paginatedProducts}
                            categories={categories}
                            onSelectProduct={handleSelectProduct}
                            onStockChange={onStockChange}
                            onAdjustStock={handleOpenStockModal}
                            isLoading={isLoading}
                            error={error}
                            storeSettings={storeSettings}
                            userRole={currentUser.role}
                        />
                        {/* Pagination controls */}
                        <div className="px-4 pb-6">
                            <div className="bg-white rounded-md border p-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-sm text-gray-700">
                                    Showing {(sortedProducts.length === 0 ? 0 : (page - 1) * pageSize + 1)}–{Math.min(sortedProducts.length, page * pageSize)} of {sortedProducts.length}
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="pageSize" className="text-sm text-gray-700">Per page</label>
                                    <select
                                        id="pageSize"
                                        className="border rounded px-2 py-1 text-sm"
                                        value={pageSize}
                                        onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
                                    >
                                        <option value={12}>12</option>
                                        <option value={24}>24</option>
                                        <option value={48}>48</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        onClick={() => setPage(1)}
                                        disabled={page <= 1}
                                        aria-label="First page"
                                    >
                                        « First
                                    </button>
                                    <button
                                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        aria-label="Previous page"
                                    >
                                        ‹ Prev
                                    </button>
                                    <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
                                    <button
                                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        aria-label="Next page"
                                    >
                                        Next ›
                                    </button>
                                    <button
                                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        onClick={() => setPage(totalPages)}
                                        disabled={page >= totalPages}
                                        aria-label="Last page"
                                    >
                                        Last »
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <CategoryList
                        categories={categories}
                        searchTerm={searchTerm}
                        onEdit={handleOpenEditCategoryModal}
                        onDelete={onDeleteCategory || (() => { })}
                        isLoading={isLoading}
                        error={error}
                    />
                )}
            </main>

            {canManageProducts && isModalOpen && (
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

            {canManageProducts && (
                <CategoryFormModal
                    isOpen={isCategoryModalOpen}
                    onClose={handleCloseCategoryModal}
                    onSave={handleSaveCategoryInternal}
                    categoryToEdit={editingCategory}
                    allCategories={categories}
                    accounts={accounts}
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
        </>
    );
};

export default InventoryPage;