import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Product, CartItem, Sale, Customer, StoreSettings, Payment, Category, Supplier } from '../types';
import { SnackbarType } from '../App';
import PlusIcon from '../components/icons/PlusIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';

import ReceiptModal from '../components/sales/ReceiptModal';
import QrCodeIcon from '../components/icons/QrCodeIcon';
import UnifiedScannerModal from '../components/UnifiedScannerModal';

import CustomerSelect from '../components/sales/CustomerSelect';
import HeldSalesModal from '../components/sales/HeldSalesModal';
import { ProductCardSkeleton } from '../components/sales/ProductCardSkeleton';
import ProductFormModal from '../components/ProductFormModal';
import ScanActionModal from '../components/sales/ScanActionModal';
import { api } from '@/services/api';
import { formatCurrency } from '../utils/currency';
import DocumentPlusIcon from '../components/icons/DocumentPlusIcon';
import { buildAssetUrl } from '@/services/api';
import Header from "@/components/Header.tsx";
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';



import BoltIcon from '../components/icons/BoltIcon';
import ClockIcon from '../components/icons/ClockIcon';

import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import BellAlertIcon from '../components/icons/BellAlertIcon';


import Bars3Icon from '../components/icons/Bars3Icon';
import GridIcon from '../components/icons/GridIcon';
import ListIcon from '../components/icons/ListIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import logo from '../assets/logo.png';
import { ArrowLeftIcon } from '@/components/icons';

interface SalesPageProps {
    products: Product[];
    customers: Customer[];
    onProcessSale: (sale: Sale) => Promise<Sale | null>;
    isLoading: boolean;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
    onOpenSidebar?: () => void;
    categories: Category[];
    suppliers: Supplier[];
    onSaveProduct: (product: Product | Omit<Product, 'id'>) => Promise<Product>;
}

const SalesPage: React.FC<SalesPageProps> = ({
    products,
    customers,
    onProcessSale,
    isLoading,
    showSnackbar,
    storeSettings,
    onOpenSidebar,
    categories,
    suppliers,
    onSaveProduct
}) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [discount, setDiscount] = useState<string>('0');
    const [heldSales, setHeldSales] = useState<CartItem[][]>([]);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [appliedStoreCredit, setAppliedStoreCredit] = useState(0);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const cashInputRef = useRef<HTMLInputElement | null>(null);

    const [showHeldPanel, setShowHeldPanel] = useState<boolean>(false);
    const [shouldFocusCashInput, setShouldFocusCashInput] = useState(false);
    const mobileCashInputRef = useRef<HTMLInputElement | null>(null);

    // External Product Lookup State
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [initialProductValues, setInitialProductValues] = useState<Partial<Product> | undefined>(undefined);

    // Scan Action State
    const [showScanActionModal, setShowScanActionModal] = useState(false);
    const [lastScannedProductName, setLastScannedProductName] = useState('');
    const [isScannerPaused, setIsScannerPaused] = useState(false);

    const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
    const [isFabVisible, setIsFabVisible] = useState(true);
    const lastScrollY = useRef(0);

    // View Mode State (grid or list)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        const saved = localStorage.getItem('pos-view-mode');
        return (saved === 'list' || saved === 'grid') ? saved : 'grid';
    });

    // Cart Actions Tab State
    const [cartActionTab, setCartActionTab] = useState<'customer' | 'summary' | 'payment'>('payment');
    const [actionsPanelHeight, setActionsPanelHeight] = useState(400); // Default height
    const isResizing = useRef(false);

    // Handle resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newHeight = window.innerHeight - e.clientY;
            // Min height: 200px, Max height: 80% of screen height
            if (newHeight > 200 && newHeight < window.innerHeight * 0.8) {
                setActionsPanelHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
        };

        if (/* condition to add listeners only when relevant and global */ true) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizing = (e: React.MouseEvent) => {
        isResizing.current = true;
        document.body.style.cursor = 'ns-resize';
        e.preventDefault(); // Prevent text selection
    };


    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 18; // Fixed for desktop grid 3x6 

    const [showQuickActions, setShowQuickActions] = useState<boolean>(false);

    // Persist view mode to localStorage
    useEffect(() => {
        localStorage.setItem('pos-view-mode', viewMode);
    }, [viewMode]);

    // Quick actions for popular products
    const quickActions = useMemo(() => {
        return products
            .filter(p => p.status === 'active')
            .sort((a, b) => ((b as any).stock || 0) - ((a as any).stock || 0))
            .slice(0, 4);
    }, [products]);

    // Scroll behavior for FAB
    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target;
            if (!target) return;
            // Handle both window scroll and element scroll
            const currentScrollY = (target instanceof Document) ? window.scrollY : (target as HTMLElement).scrollTop;

            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setIsFabVisible(false);
            } else {
                setIsFabVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.addEventListener('scroll', handleScroll, { passive: true });
        }
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            if (mainContent) {
                mainContent.removeEventListener('scroll', handleScroll);
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Auto-select first payment method
    useEffect(() => {
        const methods = storeSettings.paymentMethods || [];
        const fallbacks = [{ id: 'pm_cash', name: 'Cash' }, { id: 'pm_card', name: 'Card' }];
        const allMethods = methods.length > 0 ? methods : fallbacks;

        if (allMethods.length > 0 && !selectedPaymentMethod) {
            setSelectedPaymentMethod(allMethods[0].name);
        }
    }, [storeSettings.paymentMethods, selectedPaymentMethod]);

    // Reset cash when payment method changes
    useEffect(() => {
        setCashReceived('');
    }, [selectedPaymentMethod]);

    // Close cart panel on mobile when cart is cleared
    useEffect(() => {
        if (cart.length === 0 && window.innerWidth < 768) {
            setActiveTab('products');
        }
        // Switch to payment tab if cart has items and none selected? 
        // Or default to 'customer' if no customer, else 'payment'?
        // Let's keep it simple: don't auto-switch tabs on cart change to avoid annoying jumps.
    }, [cart.length]);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Auto-focus cash input when proceeding to payment
    useEffect(() => {
        if (shouldFocusCashInput) {
            // Small delay to allow tab switching animation to complete
            const timer = setTimeout(() => {
                // Try mobile ref first if visible (based on window width or just existence)
                if (window.innerWidth < 768 && mobileCashInputRef.current) {
                    mobileCashInputRef.current.focus();
                } else if (cashInputRef.current) {
                    cashInputRef.current.focus();
                }
                setShouldFocusCashInput(false);
            }, 300); // Wait for animations
            return () => clearTimeout(timer);
        }
    }, [shouldFocusCashInput]);

    const taxRate = storeSettings.taxRate / 100;

    const roundQty = (q: number) => Math.round(q * 1000) / 1000;
    const getStepFor = (uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1);

    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.productId === product.id);
        const step = getStepFor(product.unitOfMeasure);
        const stockInCart = existingItem ? existingItem.quantity : 0;
        const availableStock = typeof (product as any).stock === 'number'
            ? (product as any).stock
            : (parseFloat(String((product as any).stock)) || 0);

        if (stockInCart + step <= availableStock + 1e-9) {
            if (existingItem) {
                const newQty = Math.min(availableStock, roundQty(existingItem.quantity + step));
                setCart(cart.map(item => item.productId === product.id
                    ? { ...item, quantity: newQty }
                    : item));
                showSnackbar(`Added another "${product.name}" to cart`, 'success');
            } else {
                setCart([
                    ...cart,
                    {
                        productId: product.id,
                        name: product.name,
                        sku: product.sku,
                        price: product.price,
                        quantity: step,
                        stock: availableStock,
                        unitOfMeasure: product.unitOfMeasure,
                        costPrice: product.costPrice,
                    }
                ]);
                showSnackbar(`Added "${product.name}" to cart`, 'success');
            }
        } else {
            showSnackbar(`No more "${product.name}" available in stock`, 'error');
        }
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        setCart(currentCart => {
            const itemToUpdate = currentCart.find(item => item.productId === productId);
            if (!itemToUpdate) return currentCart;

            const clamped = Math.max(0, Math.min(itemToUpdate.stock, roundQty(newQuantity)));
            if (clamped <= 0) {
                showSnackbar(`Removed "${itemToUpdate.name}" from cart`, 'info');
                return currentCart.filter(item => item.productId !== productId);
            }
            if (clamped <= itemToUpdate.stock + 1e-9) {
                return currentCart.map(item => item.productId === productId
                    ? { ...item, quantity: clamped }
                    : item);
            } else {
                showSnackbar(`Cannot exceed available stock of ${itemToUpdate.stock}`, 'error');
                return currentCart;
            }
        });
    };

    const removeFromCart = (productId: string) => {
        const item = cart.find(item => item.productId === productId);
        if (item) {
            setCart(cart.filter(item => item.productId !== productId));
            showSnackbar(`Removed "${item.name}" from cart`, 'info');
        }
    };

    const clearCart = useCallback(() => {
        if (cart.length === 0) return;
        setCart([]);
        setDiscount('0');
        setSelectedCustomer(null);
        setAppliedStoreCredit(0);
        setCashReceived('');
        showSnackbar('Cart cleared', 'info');
    }, [cart.length]);

    const handleHoldSale = () => {
        if (cart.length === 0) return;
        setHeldSales([...heldSales, cart]);
        clearCart();
        showSnackbar('Sale held for later', 'info');
    };

    const handleRecallSale = (index: number) => {
        if (cart.length > 0) {
            showSnackbar("Please complete or hold current sale first", 'error');
            return;
        }
        setCart(heldSales[index]);
        setHeldSales(heldSales.filter((_, i) => i !== index));
        showSnackbar(`Held sale #${index + 1} recalled`, 'success');
    };

    const filteredProducts = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return products.filter(p => p.status === 'active');

        return products.filter(p =>
            p.status === 'active' &&
            (p.name.toLowerCase().includes(term) ||
                (p.sku && p.sku.toLowerCase().includes(term)) ||
                (p.barcode && p.barcode.toLowerCase().includes(term)))
        );
    }, [products, searchTerm]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);



    const handleContinuousScan = async (decodedText: string) => {
        if (isScannerPaused || showScanActionModal) return;

        const trimmed = decodedText.trim();
        const product = products.find(p =>
            p.status === 'active' &&
            (p.barcode === trimmed || p.sku === trimmed)
        );
        if (product) {
            addToCart(product);
            setLastScannedProductName(product.name);
            setIsScannerPaused(true);
            setShowScanActionModal(true);
        } else {
            // Try external lookup
            try {
                // Check if we already have this product in local state to avoid re-fetching if just added (though products prop should update)
                const response = await api.get<any>(`/products/external-lookup/${trimmed}`);
                if (response) {
                    setInitialProductValues({
                        ...response,
                        stock: 0,
                        price: 0,
                        costPrice: 0,
                        categoryId: undefined
                    });
                    setIsProductFormOpen(true);
                    setIsScannerOpen(false); // Close scanner to focus on modal
                    showSnackbar('Product found online! Please confirm details.', 'success');
                } else {
                    showSnackbar('No product found for scanned code', 'error');
                }
            } catch (err: any) {
                // 404 from backend means not found externally either
                if (err.message && err.message.includes('404')) {
                    showSnackbar('No product found locally or online', 'error');
                } else {
                    showSnackbar('No product found for scanned code', 'error');
                }
            }
        }
    };

    const handleScanError = (error: any) => {
        console.warn(error);
    };



    const { subtotal, discountAmount, taxAmount, total, totalBeforeCredit, finalAppliedCredit } = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const discountAmount = parseFloat(discount) || 0;
        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
        const taxAmount = subtotalAfterDiscount * taxRate;
        const totalBeforeCredit = subtotalAfterDiscount + taxAmount;
        const finalAppliedCredit = Math.min(appliedStoreCredit, totalBeforeCredit);
        const total = totalBeforeCredit - finalAppliedCredit;
        return { subtotal, discountAmount, taxAmount, total, totalBeforeCredit, finalAppliedCredit };
    }, [cart, discount, appliedStoreCredit, taxRate]);

    const isCashMethod = useMemo(() =>
        (selectedPaymentMethod || '').toLowerCase().includes('cash'),
        [selectedPaymentMethod]
    );
    const cashReceivedNumber = useMemo(() => parseFloat(cashReceived || '0') || 0, [cashReceived]);
    const changeDue = useMemo(() => Math.max(0, cashReceivedNumber - total), [cashReceivedNumber, total]);

    // Keyboard shortcuts
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if (isTyping || !e.ctrlKey) return;

            if (e.key === 'Enter' && cart.length > 0 && total >= 0 && (!isCashMethod || cashReceivedNumber >= total)) {
                e.preventDefault();
                processTransaction('paid');
            } else if (e.key.toLowerCase() === 'h' && cart.length > 0) {
                e.preventDefault();
                handleHoldSale();
            } else if (e.key.toLowerCase() === 'i' && cart.length > 0 && total >= 0 && selectedCustomer) {
                e.preventDefault();
                processTransaction('invoice');
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [cart.length, total, isCashMethod, cashReceivedNumber, selectedCustomer]);

    const handleApplyStoreCredit = () => {
        if (finalAppliedCredit > 0) {
            setAppliedStoreCredit(0);
            showSnackbar('Store credit removed', 'info');
        } else {
            const customerCredit = selectedCustomer?.storeCredit || 0;
            const creditToApply = Math.min(totalBeforeCredit, customerCredit);
            setAppliedStoreCredit(creditToApply);
            showSnackbar(`${formatCurrency(creditToApply, storeSettings)} store credit applied`, 'success');
        }
    };

    const processTransaction = async (type: 'paid' | 'invoice') => {
        if (cart.length === 0) {
            showSnackbar('Cart is empty', 'error');
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const baseSaleData = {
                cart: cart.map(item => ({ ...item, returnedQuantity: 0 })),
                total,
                subtotal,
                tax: taxAmount,
                discount: discountAmount,
                storeCreditUsed: finalAppliedCredit,
                customerId: selectedCustomer?.id,
                customerName: selectedCustomer?.name,
                refundStatus: 'none' as const,
            };

            let saleData: Partial<Sale>;

            if (type === 'invoice') {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);
                saleData = {
                    ...baseSaleData,
                    paymentStatus: 'unpaid',
                    amountPaid: 0,
                    dueDate: dueDate.toISOString(),
                    payments: [],
                };
            } else {
                saleData = {
                    ...baseSaleData,
                    paymentStatus: 'paid',
                    amountPaid: total,
                    payments: [{
                        amount: total,
                        method: selectedPaymentMethod,
                        id: Date.now().toString(),
                        date: new Date().toISOString()
                    } as Payment]
                };
            }

            const newSale = await onProcessSale(saleData as Sale);

            if (newSale) {
                if (type === 'invoice') {
                    showSnackbar(`Invoice created for ${selectedCustomer?.name}`, 'success');
                } else {
                    setLastSale(newSale);
                    setShowReceiptModal(true);
                }
                clearCart();
            }
        } catch (error) {
            console.error('Transaction failed:', error);
            showSnackbar('Transaction failed. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Floating Action Buttons
    const FloatingActionButtons = () => (
        <div className={`md:hidden fixed z-50 bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 bg-transparent/1 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-2xl transition-all duration-300 ${isFabVisible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
            <button
                onClick={() => {
                    setIsScannerOpen(true);
                    setActiveTab('cart');
                }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-all"
            >
                <QrCodeIcon className="w-6 h-6" />
            </button>
            <button
                onClick={() => setActiveTab(prev => prev === 'products' ? 'cart' : 'products')}
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg flex items-center justify-center active:scale-95 transition-all"
            >
                <ShoppingCartIcon className="w-6 h-6" />
                {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                        {cart.length}
                    </span>
                )}
            </button>

            <button
                onClick={() => setShowHeldPanel(true)}
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-all"
            >
                <ClockIcon className="w-6 h-6" />
                {heldSales.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                        {heldSales.length}
                    </span>
                )}
            </button>
        </div>
    );

    // Header Actions for Desktop
    const headerActions = (
        <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto ml-4 md:ml-0">
                <div className="relative flex-1 md:flex-none">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products..."
                        className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                {/* View Toggle (Desktop Only) */}
                <div className="hidden md:flex items-center gap-1 bg-white rounded-xl p-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-xl transition-colors ${viewMode === 'grid'
                            ? 'bg-white text-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        title="Grid view"
                    >
                        <GridIcon className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200" />
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-xl transition-colors ${viewMode === 'list'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        title="List view"
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <button
                onClick={() => setShowHeldPanel(true)}
                className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-sm font-medium rounded-xl border border-amber-200 flex items-center gap-2 hover:border-amber-300 transition-colors relative"
            >
                <ClockIcon className="w-4 h-4" />
                Held Sales
                {heldSales.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {heldSales.length}
                    </span>
                )}
            </button>
        </div>
    );



    return (
        <div className="h-screen w-full bg-slate-50 flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                <div className="flex-none">
                    <Header
                        title="Point of Sale"
                        onMenuClick={onOpenSidebar}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        hideSearchOnMobile={true}
                        showSearch={false}
                        rightContent={headerActions}
                    />
                </div>

                <div className="flex-1 overflow-hidden bg-gray-100">
                    <div className="h-full flex flex-col">
                        {/* Left Column - Products */}
                        <div className="flex-1 flex flex-col h-full min-w-0">
                            {/* Products Grid/List */}
                            <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                                {isLoading ? (
                                    <div className="max-w-7xl mx-auto w-full">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <ProductCardSkeleton key={i} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-7xl mx-auto w-full">
                                        {viewMode === 'grid' ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                                {paginatedProducts.map(product => {
                                                    const numericStock = typeof (product as any).stock === 'number'
                                                        ? (product as any).stock
                                                        : (parseFloat(String((product as any).stock)) || 0);
                                                    const isSoldOut = numericStock === 0;
                                                    const lowStockThreshold = product.reorderPoint || storeSettings.lowStockThreshold;
                                                    const isLowStock = numericStock > 0 && numericStock <= lowStockThreshold;
                                                    const cartItem = cart.find(item => item.productId === product.id);

                                                    return (
                                                        <div
                                                            key={product.id}
                                                            onClick={() => !isSoldOut && addToCart(product)}
                                                            className={`
                                        group relative bg-white rounded-xl border border-slate-200 
                                        transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden cursor-pointer
                                        ${isSoldOut ? 'opacity-60 grayscale' : ''}
                                        ${cartItem ? 'ring-2 ring-blue-500 border-transparent' : ''}
                                    `}
                                                        >
                                                            {/* Image Container */}
                                                            <div className="aspect-square bg-white relative overflow-hidden">
                                                                {product.imageUrls?.[0] ? (
                                                                    <img
                                                                        src={buildAssetUrl(product.imageUrls[0])}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                        <ShoppingCartIcon className="w-12 h-12 opacity-20" />
                                                                    </div>
                                                                )}

                                                                {/* Stock Badge */}
                                                                <div className="absolute top-2 right-2">
                                                                    {isSoldOut ? (
                                                                        <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                                                            Sold Out
                                                                        </div>
                                                                    ) : isLowStock ? (
                                                                        <div className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                                                            {numericStock} left
                                                                        </div>
                                                                    ) : null}
                                                                </div>

                                                                {/* Quick Add Overlay */}
                                                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${cartItem ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-200 hover:scale-110">
                                                                        {cartItem ? (
                                                                            <span className="font-bold text-blue-600 text-lg">{cartItem.quantity}</span>
                                                                        ) : (
                                                                            <PlusIcon className="w-6 h-6 text-slate-900" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Product Details */}
                                                            <div className="p-3">
                                                                <h3 className="font-medium text-slate-900 text-sm line-clamp-2 h-10 mb-1 leading-snug group-hover:text-blue-600 transition-colors">
                                                                    {product.name}
                                                                </h3>
                                                                <div className="flex items-end justify-between">
                                                                    <div>
                                                                        <div className="font-bold text-slate-900 text-base">
                                                                            {formatCurrency(product.price, storeSettings)}
                                                                        </div>
                                                                    </div>

                                                                    {/* Quantity Controls Overlay (only visible if in cart) */}
                                                                    {cartItem && (
                                                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                                            <button
                                                                                onClick={() => updateQuantity(product.id, cartItem.quantity - getStepFor(product.unitOfMeasure))}
                                                                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateQuantity(product.id, cartItem.quantity + getStepFor(product.unitOfMeasure))}
                                                                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {paginatedProducts.map(product => {
                                                    const numericStock = typeof (product as any).stock === 'number'
                                                        ? (product as any).stock
                                                        : (parseFloat(String((product as any).stock)) || 0);
                                                    const isSoldOut = numericStock === 0;
                                                    const lowStockThreshold = product.reorderPoint || storeSettings.lowStockThreshold;
                                                    const isLowStock = numericStock > 0 && numericStock <= lowStockThreshold;
                                                    const cartItem = cart.find(item => item.productId === product.id);

                                                    return (
                                                        <div
                                                            key={product.id}
                                                            onClick={() => !isSoldOut && addToCart(product)}
                                                            className={`
                                                                group bg-white rounded-xl border border-slate-200 p-3
                                                                transition-all duration-200 hover:shadow-md cursor-pointer flex items-center gap-4
                                                                ${isSoldOut ? 'opacity-60 grayscale' : ''}
                                                                ${cartItem ? 'ring-2 ring-blue-500 border-transparent' : ''}
                                                            `}
                                                        >
                                                            {/* Image */}
                                                            <div className="w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden relative">
                                                                {product.imageUrls?.[0] ? (
                                                                    <img
                                                                        src={buildAssetUrl(product.imageUrls[0])}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                        <ShoppingCartIcon className="w-8 h-8 opacity-20" />
                                                                    </div>
                                                                )}
                                                                {cartItem && (
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                                                            <span className="font-bold text-blue-600 text-sm">{cartItem.quantity}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Product Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors truncate">
                                                                    {product.name}
                                                                </h3>
                                                                <div className="flex items-center gap-2">
                                                                    {isSoldOut ? (
                                                                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                                                            Sold Out
                                                                        </span>
                                                                    ) : isLowStock ? (
                                                                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                                                            {numericStock} left
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-500">
                                                                            {numericStock} in stock
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Price and Actions */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right">
                                                                    <div className="font-bold text-slate-900 text-lg">
                                                                        {formatCurrency(product.price, storeSettings)}
                                                                    </div>
                                                                </div>
                                                                {cartItem ? (
                                                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                                        <button
                                                                            onClick={() => updateQuantity(product.id, cartItem.quantity - getStepFor(product.unitOfMeasure))}
                                                                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <button
                                                                            onClick={() => updateQuantity(product.id, cartItem.quantity + getStepFor(product.unitOfMeasure))}
                                                                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        className="w-9 h-9 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            !isSoldOut && addToCart(product);
                                                                        }}
                                                                    >
                                                                        <PlusIcon className="w-5 h-5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {filteredProducts.length === 0 && (
                                            <div className="text-center py-12">
                                                <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-600">No products found</p>
                                                <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pagination Footer */}
                            {
                                !isLoading && filteredProducts.length > 0 && (
                                    <div className="flex-none p-4 border-t border-slate-200 bg-white/5 backdrop-blur top-shadow z-10">
                                        <div className="flex items-center justify-between max-w-7xl mx-auto">
                                            <div className="text-sm text-slate-600">
                                                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium">{filteredProducts.length}</span> products
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                                                </button>
                                                <span className="text-sm font-medium text-slate-900 px-2">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Cart & Checkout */}
            <div className="w-full md:w-[400px] xl:w-[450px] flex-none flex flex-col h-full bg-gray-50 z-20 " >
                {/* Cart Header */}
                <div className="flex-none p-4 py-2 border-b border-slate-100 shadow-sm bg-transparent" >
                    <div className="flex items-center justify-between">
                        <div className="hidden md:flex items-center gap-3">
                            <div>
                                <h2 className="font-bold text-lg text-slate-700">Shopping Cart</h2>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <span>{cart.length} items</span>
                                    {cart.length > 0 && (
                                        <>
                                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                            <span>{formatCurrency(subtotal, storeSettings)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="hidden md:flex flex-1 overflow-y-auto" >
                    {
                        cart.length === 0 ? (
                            <div className="p-8 text-center h-full flex flex-col items-center justify-center">
                                <div className="w-16 h-16  from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShoppingCartIcon className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-slate-700 font-medium mb-2">Your cart is empty</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {cart.map(item => (
                                    <div key={item.productId} className="px-2 py-4 hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-900 truncate">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {formatCurrency(item.price, storeSettings)} each
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm text-slate-900">
                                                            {formatCurrency(item.price * item.quantity, storeSettings)}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {item.quantity}{item.unitOfMeasure === 'kg' ? 'kg' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - getStepFor(item.unitOfMeasure))}
                                                        className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
                                                    >
                                                        <span className="font-bold text-slate-700">-</span>
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                                        className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                        min="0"
                                                        step={item.unitOfMeasure === 'kg' ? '0.1' : '1'}
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + getStepFor(item.unitOfMeasure))}
                                                        className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
                                                    >
                                                        <span className="font-bold text-slate-700">+</span>
                                                    </button>
                                                    <button
                                                        onClick={() => removeFromCart(item.productId)}
                                                        className="ml-auto p-1.5 hover:bg-red-50 rounded-lg transition-colors group-hover:opacity-100 opacity-0"
                                                    >
                                                        <XMarkIcon className="w-4 h-4 text-slate-400 hover:text-red-600 transition-colors" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div>

                {/* Cart Summary & Actions (Fixed Bottom) - Now Resizable */}
                <div
                    className="hidden md:flex flex-none bg-gray-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] relative flex flex-col transition-all duration-75 ease-linear"
                    style={{ height: `${actionsPanelHeight}px` }}
                >
                    {/* Drag Handle */}
                    <div
                        className="bg-slate-50 border-b border-slate-200 cursor-ns-resize flex items-center justify-center py-0 absolute top-0 left-0 right-0 z-10"
                        onMouseDown={startResizing}
                    >
                        <div className="w-12 h-1.5 bg-slate-300 "></div>
                    </div>

                    {/* Scanner Toggle / Header */}
                    <div className="flex items-center justify-between px-4 py-0 mt-2 z-10">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            {isScannerOpen ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    Scanning Mode
                                </>
                            ) : (
                                <>
                                    <ShoppingCartIcon className="w-4 h-4 text-slate-500" />
                                    Checkout Actions
                                </>
                            )}
                        </h3>
                        <button
                            onClick={() => setIsScannerOpen(!isScannerOpen)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isScannerOpen
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                                }`}
                        >
                            {isScannerOpen ? (
                                <>
                                    <XMarkIcon className="w-4 h-4" />
                                    Stop Scanning
                                </>
                            ) : (
                                <>
                                    <QrCodeIcon className="w-4 h-4" />
                                    Scan Barcode
                                </>
                            )}
                        </button>
                    </div>

                    {isScannerOpen ? (
                        <div className="flex-1 p-4 bg-slate-50/50 overflow-hidden flex flex-col">
                            <div className="flex-1 w-full relative min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <UnifiedScannerModal
                                    isOpen={true}
                                    variant="embedded"
                                    onClose={() => setIsScannerOpen(false)}
                                    onScanSuccess={handleContinuousScan}
                                    onScanError={handleScanError}
                                    continuous={true}
                                    delayBetweenScans={1500}
                                />
                            </div>
                            <p className="text-center text-xs text-slate-500 mt-2">
                                Point camera at a barcode to add to cart
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Tab Navigation */}
                            <div className="flex border-b border-slate-200 bg-gray-50 z-10 flex-none px-4">
                                <button
                                    onClick={() => setCartActionTab('customer')}
                                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${cartActionTab === 'customer'
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    Customer
                                </button>
                                <button
                                    onClick={() => setCartActionTab('summary')}
                                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${cartActionTab === 'summary'
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    Summary
                                </button>
                                <button
                                    onClick={() => setCartActionTab('payment')}
                                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${cartActionTab === 'payment'
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    Payment
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
                                {cart.length > 0 ? (
                                    <>
                                        {/* Customer Tab Content */}
                                        {cartActionTab === 'customer' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                    <label className="block text-sm font-medium text-slate-900 mb-3">
                                                        Select Customer
                                                    </label>
                                                    <CustomerSelect
                                                        customers={customers}
                                                        selectedCustomer={selectedCustomer}
                                                        onSelectCustomer={(c) => {
                                                            setSelectedCustomer(c);
                                                            setAppliedStoreCredit(0);
                                                        }}
                                                    />
                                                </div>

                                                {selectedCustomer && selectedCustomer.storeCredit > 0 && storeSettings.enableStoreCredit && (
                                                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 shadow-sm">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-medium text-emerald-900">Store Credit Available</p>
                                                                <p className="text-2xl font-bold text-emerald-700 mt-1">
                                                                    {formatCurrency(selectedCustomer.storeCredit, storeSettings)}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={handleApplyStoreCredit}
                                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 ${finalAppliedCredit > 0
                                                                    ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'
                                                                    }`}
                                                            >
                                                                {finalAppliedCredit > 0 ? 'Remove Credit' : 'Apply Credit'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Summary Tab Content */}
                                        {cartActionTab === 'summary' && (
                                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="p-4 bg-slate-50 border-b border-slate-100">
                                                    <h3 className="font-semibold text-slate-900">Order Summary</h3>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div className="flex justify-between items-center text-slate-600">
                                                        <span>Subtotal</span>
                                                        <span className="font-mono text-slate-900">{formatCurrency(subtotal, storeSettings)}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-200">
                                                        <span className="text-slate-600">Discount</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-slate-400">{storeSettings.currency.symbol}</span>
                                                            <input
                                                                type="number"
                                                                value={discount}
                                                                onChange={(e) => setDiscount(e.target.value)}
                                                                className="w-28 px-2 py-1 border border-slate-300 rounded text-right text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                                placeholder="0.00"
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    {finalAppliedCredit > 0 && (
                                                        <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-200">
                                                            <span className="text-slate-600">Store Credit</span>
                                                            <span className="font-mono text-emerald-600 font-medium">-{formatCurrency(finalAppliedCredit, storeSettings)}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-200">
                                                        <span className="text-slate-600">Tax ({storeSettings.taxRate}%)</span>
                                                        <span className="font-mono text-slate-900">{formatCurrency(taxAmount, storeSettings)}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-3 border-t-2 border-slate-100 mt-2">
                                                        <span className="text-lg font-bold text-slate-900">Total</span>
                                                        <span className="text-2xl font-bold text-blue-600">{formatCurrency(total, storeSettings)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Tab Content */}
                                        {cartActionTab === 'payment' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                {/* Big Total Display */}
                                                <div className="text-center py-2 bg-gradient-to-br flex justify-between px-4 m-auto from-blue-500 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                                                    <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Total to Pay</p>
                                                    <p className="text-3xl font-bold tracking-tight">{formatCurrency(total, storeSettings)}</p>
                                                </div>

                                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                            Payment Method
                                                        </label>
                                                        <div className="relative group">
                                                            <select
                                                                value={selectedPaymentMethod}
                                                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer hover:bg-slate-100"
                                                            >
                                                                {(storeSettings.paymentMethods && storeSettings.paymentMethods.length > 0)
                                                                    ? storeSettings.paymentMethods.map(method => (
                                                                        <option key={method.id} value={method.name}>
                                                                            {method.name}
                                                                        </option>
                                                                    ))
                                                                    : [
                                                                        { id: 'pm_cash', name: 'Cash' },
                                                                        { id: 'pm_card', name: 'Card' }
                                                                    ].map(method => (
                                                                        <option key={method.id} value={method.name}>
                                                                            {method.name}
                                                                        </option>
                                                                    ))
                                                                }
                                                            </select>
                                                            <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
                                                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
                                                        </div>
                                                    </div>

                                                    {isCashMethod && (
                                                        <div className="animate-in fade-in zoom-in-95 duration-200">
                                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                                Cash Received
                                                            </label>
                                                            <div className="relative group">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                                    {storeSettings.currency.symbol}
                                                                </span>
                                                                <input
                                                                    ref={cashInputRef}
                                                                    type="number"
                                                                    value={cashReceived}
                                                                    onChange={(e) => setCashReceived(e.target.value)}
                                                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-right text-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            {changeDue > 0 && (
                                                                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center animate-in slide-in-from-top-2">
                                                                    <span className="text-sm font-medium text-emerald-800">Change Due</span>
                                                                    <span className="text-xl font-bold text-emerald-600">
                                                                        {formatCurrency(changeDue, storeSettings)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Primary Actions */}
                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <button
                                                        onClick={handleHoldSale}
                                                        className="py-3.5 px-4 bg-white border-2 border-amber-100 text-amber-700 font-bold rounded-xl hover:bg-amber-50 hover:border-amber-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                                                    >
                                                        <ClockIcon className="w-5 h-5" />
                                                        Hold
                                                    </button>
                                                    <button
                                                        onClick={() => processTransaction('paid')}
                                                        disabled={total < 0 || (isCashMethod && cashReceivedNumber < total) || isProcessing}
                                                        className="py-3.5 px-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95 transform"
                                                    >
                                                        {isProcessing ? (
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <CreditCardIcon className="w-5 h-5" />
                                                        )}
                                                        <span className="truncate">
                                                            {isProcessing ? 'Processing' : `Pay ${formatCurrency(total, storeSettings)}`}
                                                        </span>
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => processTransaction('invoice')}
                                                    disabled={!selectedCustomer || isProcessing}
                                                    className="w-full py-3 px-4 bg-slate-50 text-slate-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                                >
                                                    <DocumentPlusIcon className="w-5 h-5" />
                                                    Charge to Account (Invoice)
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <ShoppingCartIcon className="w-12 h-12 mb-2 opacity-20" />
                                        <p className="text-sm">Cart is empty</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Product View */}
                <div className={`md:hidden fixed inset-0 z-50 transition-transform duration-300 overflow-y-auto ${activeTab === 'products' ? 'translate-x-0' : 'translate-x-full'}`}>
                    {/* Mobile Products Header */}
                    <div className="sticky top-0 z-10">
                        {/* Top Bar (Menu, Logo, Notification) */}
                        <div className="bg-transparent/1 backdrop-blur-sm border-b border-slate-200/50 p-4 pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {onOpenSidebar && (
                                        <button
                                            onClick={onOpenSidebar}
                                            className="p-2 -ml-2 rounded-md text-slate-700 hover:bg-slate-50 focus:outline-none"
                                        >
                                            <GridIcon className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                                <div className="absolute left-1/2 transform -translate-x-1/2">
                                    <img src={logo} alt="SalePilot" className="h-8" />
                                </div>
                                <button className="p-2 rounded-full hover:bg-slate-100 relative">
                                    <BellAlertIcon className="w-6 h-6 text-slate-700" />
                                    {/* Optional: Add notification badge here if needed */}
                                </button>
                            </div>
                        </div>

                        {/* Search Bar (Sticky) */}
                        <div className="bg-transparent/1 backdrop-blur-sm border-b border-slate-200 px-4 pb-4 pt-2">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-3xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Mobile Products Grid */}
                    <div className="p-4 pb-24">
                        <div className="grid grid-cols-2 gap-3">
                            {filteredProducts.slice(0, 20).map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white rounded-xl border border-slate-200 p-1 text-left"
                                >
                                    <div className="aspect-square bg-slate-100 rounded-lg mb-2 overflow-hidden relative">
                                        {product.imageUrls?.[0] ? (
                                            <img
                                                src={buildAssetUrl(product.imageUrls[0])}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ShoppingCartIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-sm text-slate-900 line-clamp-2">
                                        {product.name}
                                    </h3>
                                    <div className="mt-2 font-bold text-slate-900">
                                        {formatCurrency(product.price, storeSettings)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Cart View */}
            <div className={`md:hidden fixed inset-0 bg-white z-50 transition-transform duration-300 flex flex-col ${activeTab === 'cart' ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Mobile Cart Header */}
                <div className="flex-none bg-white border-b border-slate-200 z-10 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setActiveTab('products')}
                            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-bold text-slate-900">Cart ({cart.length})</h2>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded-lg"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Cart Content - Animated Flex Layout */}
                <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50/50">

                    {/* Slot 1: Scrollable Content (Empty State or List + Checkout) */}
                    <div className={`
                        flex-1 overflow-y-auto scroll-smooth no-scrollbar transition-all duration-500 ease-in-out
                        ${(cart.length === 0 && isScannerOpen) ? 'basis-0 opacity-0 overflow-hidden' : 'opacity-100'}
                    `}>
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                    <ShoppingCartIcon className="w-10 h-10 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Cart is Empty</h3>
                                <p className="text-slate-500 mb-8 max-w-[200px] leading-relaxed">Scan a product or browse the catalog to start selling</p>

                                <div className="flex flex-col gap-3 w-full max-w-xs">
                                    <button
                                        onClick={() => setIsScannerOpen(true)}
                                        className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                                    >
                                        <QrCodeIcon className="w-6 h-6" />
                                        Scan Barcode
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        className="w-full px-6 py-4 bg-white text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
                                    >
                                        Browse Products
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* Items List */}
                                <div className="p-4 space-y-4">
                                    {cart.map(item => (
                                        <div key={item.productId} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-base">{item.name}</h4>
                                                    <p className="text-sm text-slate-500 font-medium mt-1">{formatCurrency(item.price, storeSettings)} each</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-extrabold text-slate-900 text-lg">{formatCurrency(item.price * item.quantity, storeSettings)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - getStepFor(item.unitOfMeasure))}
                                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 shadow-sm transition-all active:scale-95"
                                                    >
                                                        <span className="text-slate-600 font-bold text-lg">-</span>
                                                    </button>
                                                    <span className="font-bold text-xl text-slate-900 w-12 text-center">
                                                        {item.quantity}
                                                        {item.unitOfMeasure === 'kg' && <span className="text-xs text-slate-500 ml-0.5">kg</span>}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + getStepFor(item.unitOfMeasure))}
                                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 shadow-sm transition-all active:scale-95"
                                                    >
                                                        <span className="text-slate-600 font-bold text-lg">+</span>
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.productId)}
                                                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove item"
                                                >
                                                    <XMarkIcon className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Checkout Actions (Only if scanner is closed) */}
                                {!isScannerOpen && (
                                    <div className="px-4 pb-4 space-y-6">
                                        {/* Customer Select */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                            <label className="block text-sm font-medium text-slate-900 mb-2">Customer</label>
                                            <CustomerSelect
                                                customers={customers}
                                                selectedCustomer={selectedCustomer}
                                                onSelectCustomer={(c) => {
                                                    setSelectedCustomer(c);
                                                    setAppliedStoreCredit(0);
                                                }}
                                            />
                                        </div>

                                        {/* Summary & Payment */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Subtotal</span>
                                                    <span className="font-medium">{formatCurrency(subtotal, storeSettings)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-600">Discount</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs">{storeSettings.currency.symbol}</span>
                                                        <input
                                                            type="number"
                                                            value={discount}
                                                            onChange={(e) => setDiscount(e.target.value)}
                                                            className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Tax</span>
                                                    <span className="font-medium">{formatCurrency(taxAmount, storeSettings)}</span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-slate-100">
                                                    <span className="font-bold text-slate-900">Total</span>
                                                    <span className="font-bold text-lg text-slate-900">{formatCurrency(total, storeSettings)}</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100">
                                                <label className="block text-sm font-medium text-slate-900 mb-2">Payment Method</label>
                                                <div className="relative group">
                                                    <select
                                                        value={selectedPaymentMethod}
                                                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                        className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer hover:bg-slate-100"
                                                    >
                                                        {(storeSettings.paymentMethods && storeSettings.paymentMethods.length > 0)
                                                            ? storeSettings.paymentMethods.map(method => (
                                                                <option key={method.id} value={method.name}>
                                                                    {method.name}
                                                                </option>
                                                            ))
                                                            : [
                                                                { id: 'pm_cash', name: 'Cash' },
                                                                { id: 'pm_card', name: 'Card' }
                                                            ].map(method => (
                                                                <option key={method.id} value={method.name}>
                                                                    {method.name}
                                                                </option>
                                                            ))
                                                        }
                                                    </select>
                                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
                                                </div>
                                            </div>

                                            {isCashMethod && (
                                                <div className="pt-2">
                                                    <label className="block text-sm font-medium text-slate-900 mb-2">Cash Received</label>
                                                    <input
                                                        ref={mobileCashInputRef}
                                                        type="number"
                                                        value={cashReceived}
                                                        onChange={(e) => setCashReceived(e.target.value)}
                                                        className="w-full p-2 border border-slate-300 rounded-lg font-bold text-lg"
                                                        placeholder="0.00"
                                                    />
                                                    {changeDue > 0 && (
                                                        <div className="mt-2 text-emerald-700 text-sm font-medium">
                                                            Change Due: {formatCurrency(changeDue, storeSettings)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3 pt-4">
                                                <button
                                                    onClick={handleHoldSale}
                                                    className="py-3 bg-orange-100 text-orange-700 rounded-lg font-medium flex items-center justify-center gap-2"
                                                >
                                                    <ClockIcon className="w-5 h-5" />
                                                    Hold
                                                </button>
                                                <button
                                                    onClick={() => processTransaction('paid')}
                                                    disabled={total < 0 || (isCashMethod && cashReceivedNumber < total) || isProcessing}
                                                    className="py-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    {isProcessing ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <CreditCardIcon className="w-5 h-5" />
                                                    )}
                                                    {isProcessing ? 'Processing' : `Pay ${formatCurrency(total, storeSettings)}`}
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => processTransaction('invoice')}
                                                disabled={cart.length === 0 || total < 0 || !selectedCustomer || isProcessing}
                                                className="w-full py-3 px-4 bg-slate-100 text-slate-900 font-semibold rounded-lg border border-slate-300 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                            >
                                                {isProcessing ? (
                                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                                                ) : (
                                                    <DocumentPlusIcon className="w-5 h-5" />
                                                )}
                                                {isProcessing ? 'Processing...' : 'Charge to Account'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Slot 2: Scanner Area - Animates height/flex based on state */}
                    <div className={`
                         transition-all duration-300 ease-out bg-black z-20 flex flex-col shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.2)] overflow-hidden
                         ${isScannerOpen
                            ? (cart.length === 0 ? 'flex-1 min-h-[200px] border-t-0' : 'h-48 flex-none border-t border-slate-800')
                            : 'h-0 border-none'}
                    `}>
                        {isScannerOpen && (
                            <div className="flex-1 w-full relative bg-slate-900">
                                <UnifiedScannerModal
                                    isOpen={true}
                                    variant="embedded"
                                    onClose={() => setIsScannerOpen(false)}
                                    onScanSuccess={handleContinuousScan}
                                    onScanError={handleScanError}
                                    continuous={true}
                                    delayBetweenScans={1500}
                                    paused={isScannerPaused}
                                />
                                {cart.length === 0 && (
                                    <div className="absolute inset-x-0 bottom-8 text-center pointer-events-none">
                                        <p className="inline-block px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white font-medium text-sm border border-white/10">
                                            Align barcode within frame
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Slot 3: Fixed Footer (Toggle Button) */}
                    {(cart.length > 0 || isScannerOpen) && (
                        <div className="flex-none p-4 bg-white border-t border-slate-200 z-30 pb-[env(safe-area-inset-bottom)] md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            {isScannerOpen ? (
                                <button
                                    onClick={() => setIsScannerOpen(false)}
                                    className="w-full py-3.5 bg-red-50 text-red-600 rounded-xl font-bold border border-red-200 hover:bg-red-100 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                    Stop Scanning
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsScannerOpen(true)}
                                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-3 group active:scale-95"
                                >
                                    <QrCodeIcon className="w-5 h-5 text-white/90" />
                                    <span>Scan Product</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>




            </div>

            {/* Modals */}
            {activeTab !== 'cart' && <FloatingActionButtons />}

            <HeldSalesModal
                isOpen={showHeldPanel}
                onClose={() => setShowHeldPanel(false)}
                heldSales={heldSales}
                onRecallSale={handleRecallSale}
                storeSettings={storeSettings}
            />
            {
                showReceiptModal && lastSale && (
                    <ReceiptModal
                        isOpen={showReceiptModal}
                        onClose={() => setShowReceiptModal(false)}
                        saleData={lastSale}
                        showSnackbar={showSnackbar}
                        storeSettings={storeSettings}
                    />
                )
            }

            <ScanActionModal
                isOpen={showScanActionModal}
                productName={lastScannedProductName}
                onContinue={() => {
                    setShowScanActionModal(false);
                    setIsScannerPaused(false);
                }}
                onProceed={() => {
                    setShowScanActionModal(false);
                    setIsScannerPaused(false);
                    setIsScannerOpen(false);
                    setActiveTab('cart');
                    setCartActionTab('payment');
                    setShouldFocusCashInput(true);
                }}
            />

            <ProductFormModal
                isOpen={isProductFormOpen}
                onClose={() => {
                    setIsProductFormOpen(false);
                    setInitialProductValues(undefined);
                }}
                onSave={async (newProduct) => {
                    try {
                        const savedProduct = await onSaveProduct(newProduct);
                        addToCart(savedProduct);
                        setIsProductFormOpen(false);
                        setInitialProductValues(undefined);
                        showSnackbar('Product added to catalog and cart!', 'success');
                    } catch (error) {
                        console.error("Failed to save product:", error);
                    }
                }}

                categories={categories}
                suppliers={suppliers}
                storeSettings={storeSettings}
                initialValues={initialProductValues}
            />
        </div >
    );
};

export default SalesPage;