import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, Supplier, StoreSettings, User, Account, PurchaseOrder } from '../types';

import ProductList from '../components/ProductList';
import ProductFormModal from '../components/ProductFormModal';
import CategoryList from '../components/CategoryList';
import CategoryFormModal from '../components/CategoryFormModal';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import LabelPrintModal from '../components/LabelPrintModal';
import ProductDetailView from '../components/products/ProductDetailView';
import CategoryDetailView from '../components/products/CategoryDetailView';
import { api } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import { FiFilter, FiCamera, FiGrid, FiList } from 'react-icons/fi';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import Header from '../components/Header';

import UnifiedScannerModal from '../components/UnifiedScannerModal';
import LinkToPOModal from '../components/LinkToPOModal';
import CubeIcon from '../components/icons/CubeIcon';
import TagIcon from '../components/icons/TagIcon';
import PlusIcon from '../components/icons/PlusIcon';
import LoadingSpinner from '../components/LoadingSpinner';

interface InventoryPageProps {
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    accounts?: Account[];
    purchaseOrders: PurchaseOrder[];
    onSaveProduct: (product: Product | Omit<Product, 'id'>) => Promise<Product>;
    onDeleteProduct: (productId: string) => void;
    onArchiveProduct: (productId: string) => void;
    onStockChange: (productId: string, newStock: number) => void;
    onAdjustStock: (productId: string, newQuantity: number, reason: string) => void;
    onReceivePOItems?: (poId: string, items: { productId: string, quantity: number }[]) => void;
    onSavePurchaseOrder?: (po: PurchaseOrder) => void;
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
    purchaseOrders = [],
    onSaveProduct,
    onDeleteProduct,
    onArchiveProduct,
    onStockChange,
    onAdjustStock,
    onReceivePOItems,
    onSavePurchaseOrder,
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

    // Link to PO State
    const [isLinkPOModalOpen, setIsLinkPOModalOpen] = useState(false);
    const [linkPOProduct, setLinkPOProduct] = useState<Product | null>(null);
    const [linkPOQuantity, setLinkPOQuantity] = useState<number>(0);


    // Category Management State
    const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Resizable panel state
    const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
        const saved = localStorage.getItem('inventory-panel-width');
        return saved ? parseFloat(saved) : 60;
    });
    const [isResizing, setIsResizing] = useState(false);

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
    const [detailIsLoading, setDetailIsLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const supplierMap = new Map(suppliers.map(s => [s.id, s]));

    const canManageProducts = currentUser.role === 'admin' || currentUser.role === 'inventory_manager';

    // Handle resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = (e.clientX / window.innerWidth) * 100;
            // Constrain between 40% and 75%
            if (newWidth >= 40 && newWidth <= 75) {
                setLeftPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            localStorage.setItem('inventory-panel-width', leftPanelWidth.toString());
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, leftPanelWidth]);

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

    const detailedCategory = useMemo(() => {
        if (!selectedCategoryId) return null;
        return categories.find(c => c.id === selectedCategoryId) || null;
    }, [selectedCategoryId, categories]);

    const subcategories = useMemo(() => {
        if (!selectedCategoryId) return [];
        return categories.filter(c => c.parentId === selectedCategoryId);
    }, [selectedCategoryId, categories]);

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
        console.log('handleSaveStockAdjustment called', { productId, newQuantity, reason });
        console.log('Props checks', { hasOnReceive: !!onReceivePOItems, hasOnSavePO: !!onSavePurchaseOrder });

        // Intercept "Receiving Stock" reason to check for POs
        if (reason === 'Receiving Stock' && onReceivePOItems && onSavePurchaseOrder) {
            const product = products.find(p => p.id === productId);
            if (product) {
                // Check if stock is increasing (it should be for receiving)
                // For "Receiving Stock", newQuantity is the adjustment amount (delta), not the total stock
                if (newQuantity > 0) {
                    setLinkPOProduct(product);
                    setLinkPOQuantity(newQuantity);
                    // Close stock modal first, then open link modal
                    handleCloseStockModal();
                    setIsLinkPOModalOpen(true);
                    return;
                }
            }
        }

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

    const handleLinkToPO = (po: PurchaseOrder) => {
        if (!linkPOProduct) return;

        if (onReceivePOItems) {
            onReceivePOItems(po.id, [{ productId: linkPOProduct.id, quantity: linkPOQuantity }]);
        }

        setIsLinkPOModalOpen(false);
        setLinkPOProduct(null);
        setLinkPOQuantity(0);
    };

    const handleCreateNewPO = () => {
        if (!linkPOProduct || !onSavePurchaseOrder) return;

        // Create a new PO with "Received" status
        const newPO: PurchaseOrder = {
            id: `new_${Date.now()}`,
            poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            supplierId: linkPOProduct.supplierId || suppliers[0]?.id || '',
            supplierName: linkPOProduct.supplierId ? (suppliers.find(s => s.id === linkPOProduct.supplierId)?.name || 'Unknown Supplier') : (suppliers[0]?.name || 'Unknown Supplier'),
            status: 'received',
            items: [{
                productId: linkPOProduct.id,
                productName: linkPOProduct.name,
                sku: linkPOProduct.sku,
                quantity: linkPOQuantity,
                costPrice: linkPOProduct.costPrice || 0,
                receivedQuantity: linkPOQuantity
            }],
            createdAt: new Date().toISOString(),
            orderedAt: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            subtotal: (linkPOProduct.costPrice || 0) * linkPOQuantity,
            shippingCost: 0,
            tax: 0,
            total: (linkPOProduct.costPrice || 0) * linkPOQuantity,
        };

        onSavePurchaseOrder(newPO);
        // Also update the stock
        onAdjustStock(linkPOProduct.id, linkPOProduct.stock + linkPOQuantity, 'Receiving Stock');

        setIsLinkPOModalOpen(false);
        setLinkPOProduct(null);
        setLinkPOQuantity(0);
    };

    const handleSkipLinkPO = () => {
        if (!linkPOProduct) return;
        // Just proceed with standard stock adjustment
        const newStock = linkPOProduct.stock + linkPOQuantity;

        onAdjustStock(linkPOProduct.id, newStock, 'Receiving Stock');

        // Update local detail state if needed
        if (detailedProduct && detailedProduct.id === linkPOProduct.id) {
            setDetailedProduct({ ...detailedProduct, stock: newStock });
        }

        setIsLinkPOModalOpen(false);
        setLinkPOProduct(null);
        setLinkPOQuantity(0);
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

    const handleSelectCategory = (categoryId: string) => {
        setSelectedCategoryId(categoryId);
    };

    const handleBackToList = () => {
        setSelectedProductId(null);
        setSelectedCategoryId(null);
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
    const [sortBy] = useState<SortBy>('name');
    const [sortOrder] = useState<SortOrder>('asc');

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

    // Desktop: Two-panel layout with left having header + products, right having full-height details
    const selectedItem = activeTab === 'products' ? selectedProductId : selectedCategoryId;

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Desktop Header */}
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
                                    onClick={() => {
                                        setActiveTab('products');
                                        setSearchTerm('');
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'products'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Products
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('categories');
                                        setSearchTerm('');
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'categories'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Categories
                                </button>
                            </div>

                            {activeTab === 'products' && (
                                <>
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

                                    <div className="flex bg-gray-100/80 p-1 rounded-xl">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            title="Grid View"
                                        >
                                            <FiGrid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            title="List View"
                                        >
                                            <FiList className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setShowArchived(!showArchived)}
                                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${showArchived
                                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {showArchived ? 'Showing Archived' : 'Show Archived'}
                                    </button>
                                </>
                            )}
                        </div>
                    }
                />
            </div>

            {/* Mobile Header */}
            <div className={`sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden ${selectedItem ? 'hidden' : ''}`}>
                <div className="px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">
                        {activeTab === 'products' ? 'Inventory' : 'Categories'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsScanModalOpen(true)}
                            className="p-2 rounded-lg text-gray-600 active:bg-gray-100 transition-colors"
                        >
                            <FiCamera className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 rounded-lg active:bg-gray-100 transition-colors ${isMobileMenuOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                        >
                            <FiGrid className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: List View */}
                <div
                    className={`flex flex-col h-full border-r border-gray-200 bg-white transition-all duration-300 ${selectedItem ? 'hidden md:flex' : 'flex w-full'}`}
                    style={{ width: selectedItem ? (typeof window !== 'undefined' && window.innerWidth < 768 ? '0%' : `${leftPanelWidth}%`) : '100%', minWidth: selectedItem ? '400px' : 'none' }}
                >
                    <div className="flex-1 overflow-hidden relative">
                        {activeTab === 'products' ? (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 overflow-y-auto scroll-smooth">
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
                                        selectedProductId={selectedProductId}
                                    />
                                </div>
                                {sortedProducts.length > 0 && (
                                    <div className="flex-none p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-gray-500">
                                                <span className="font-medium">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedProducts.length)}</span> of <span className="font-medium">{sortedProducts.length}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page <= 1}
                                                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                                >
                                                    <ChevronLeftIcon className="w-4 h-4" />
                                                </button>
                                                <span className="text-xs font-medium text-gray-700 mx-1">
                                                    {page} / {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page >= totalPages}
                                                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                                >
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full overflow-y-auto scroll-smooth">
                                <CategoryList
                                    categories={categories}
                                    searchTerm={searchTerm}
                                    onEdit={handleOpenEditCategoryModal}
                                    onDelete={onDeleteCategory || (() => { })}
                                    isLoading={isLoading}
                                    error={error}
                                    selectedCategoryId={selectedCategoryId}
                                    onSelectCategory={handleSelectCategory}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Resize Handle (Desktop Only) */}
                {selectedItem && (
                    <div
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizing(true);
                        }}
                        className="hidden md:block w-1 hover:w-2 bg-gray-200 hover:bg-blue-500 cursor-col-resize transition-all duration-200 z-10 active:bg-blue-600"
                    />
                )}

                {/* Right Panel: Detail View */}
                <div
                    className={`flex-1 flex flex-col bg-white h-full relative ${!selectedItem ? 'hidden md:flex md:bg-gray-50' : 'flex w-full overflow-hidden'}`}
                    style={selectedItem ? { width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : `${100 - leftPanelWidth}%` } : {}}
                >
                    {selectedItem ? (
                        <div className="h-full overflow-y-auto scroll-smooth">
                            {activeTab === 'products' ? (
                                <div className="h-full">
                                    {detailIsLoading ? (
                                        <LoadingSpinner fullScreen={false} text="Loading product details..." className="py-20" />
                                    ) : detailError ? (
                                        <div className="text-center p-10 bg-red-50 rounded-xl border border-red-200 m-6">
                                            <p className="text-red-600 font-medium">Error loading product</p>
                                            <p className="text-red-500 text-sm mt-1">{detailError}</p>
                                        </div>
                                    ) : detailedProduct ? (
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
                                    ) : null}
                                </div>
                            ) : (
                                <div className="h-full">
                                    {detailedCategory ? (
                                        <CategoryDetailView
                                            category={detailedCategory}
                                            subcategories={subcategories}
                                            storeSettings={storeSettings}
                                            user={currentUser}
                                            onEdit={handleOpenEditCategoryModal}
                                            onDelete={(cat) => onDeleteCategory?.(cat.id)}
                                            onBack={handleBackToList}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 italic">
                                            Category not found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <div className="p-4 bg-white rounded-3xl shadow-sm mb-4 border border-gray-100">
                                {activeTab === 'products' ? (
                                    <CubeIcon className="w-12 h-12 text-gray-300" />
                                ) : (
                                    <TagIcon className="w-12 h-12 text-gray-300" />
                                )}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                No {activeTab === 'products' ? 'Product' : 'Category'} Selected
                            </h3>
                            <p className="text-sm text-gray-500 max-w-xs">
                                Select {activeTab === 'products' ? 'a product' : 'a category'} from the list on the left to view and manage its details here.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
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

            <UnifiedScannerModal
                isOpen={isScanModalOpen}
                onClose={() => setIsScanModalOpen(false)}
                onScanSuccess={(code) => {
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

            {linkPOProduct && (
                <LinkToPOModal
                    isOpen={isLinkPOModalOpen}
                    onClose={() => setIsLinkPOModalOpen(false)}
                    product={linkPOProduct}
                    purchaseOrders={purchaseOrders}
                    onLink={handleLinkToPO}
                    onCreateNew={handleCreateNewPO}
                    onSkip={handleSkipLinkPO}
                />
            )}

            {/* Mobile Menu Popup */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute top-[60px] right-4 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2" onClick={e => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl ${activeTab === 'products' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'}`}
                            >
                                <CubeIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-semibold">Products</span>
                            </button>
                            <button
                                onClick={() => { setActiveTab('categories'); setIsMobileMenuOpen(false); }}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl ${activeTab === 'categories' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'}`}
                            >
                                <TagIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-semibold">Categories</span>
                            </button>
                            {canManageProducts && (
                                <button
                                    onClick={() => { handleOpenAddModal(); setIsMobileMenuOpen(false); }}
                                    className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-700"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Add New Item</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;