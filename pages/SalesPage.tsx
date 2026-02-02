import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Product, CartItem, Sale, Customer, StoreSettings, Payment, Category, Supplier, User } from '../types';
import { SnackbarType } from '../App';
import { api } from '@/services/api';
import { formatCurrency } from '../utils/currency';
import {
    MagnifyingGlassIcon
} from '../components/icons';
import TourGuide from '../components/TourGuide';
import PaymentChoiceModal from '../components/sales/PaymentChoiceModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Header from "@/components/Header.tsx";
import Pagination from '../components/ui/Pagination';
import ReceiptModal from '../components/sales/ReceiptModal';
import HeldSalesModal from '../components/sales/HeldSalesModal';
import { ProductCardSkeleton } from '../components/sales/ProductCardSkeleton';
import ProductFormModal from '../components/ProductFormModal';
import ScanActionModal from '../components/sales/ScanActionModal';
import OutOfStockModal from '../components/sales/OutOfStockModal';
import LowStockAlertModal from '../components/sales/LowStockAlertModal';

// New Modular Components
import { ProductCard } from '../components/sales/ProductCard';
import { CartPanel } from '../components/sales/CartPanel';
import { CheckoutActions } from '../components/sales/CheckoutActions';
import { MobileCartView } from '../components/sales/MobileCartView';
import { MobileProductView } from '../components/sales/MobileProductView';
import { SalesHeaderActions } from '../components/sales/SalesHeaderActions';
import { SalesFAB } from '../components/sales/SalesFAB';

interface SalesPageProps {
    user: User;
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
    user,
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
    const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');

    // External Product Lookup State
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [initialProductValues, setInitialProductValues] = useState<Partial<Product> | undefined>(undefined);

    // Scan Action State
    const [showScanActionModal, setShowScanActionModal] = useState(false);
    const [lastScannedProductName, setLastScannedProductName] = useState('');
    const [isScannerPaused, setIsScannerPaused] = useState(false);
    const [showPaymentChoiceModal, setShowPaymentChoiceModal] = useState(false);
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
    const [verifyingMessage, setVerifyingMessage] = useState('Verifying Payment...');
    const [runTour, setRunTour] = useState(false);
    const [lencoReference, setLencoReference] = useState<string | undefined>(undefined);
    const stopPollingRef = useRef(false);

    // Out-of-Stock Modal State
    const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
    const [outOfStockProduct, setOutOfStockProduct] = useState<Product | null>(null);

    // Low Stock Alert Modal State
    const [showLowStockAlert, setShowLowStockAlert] = useState(false);
    const [lowStockProduct, setLowStockProduct] = useState<Product | null>(null);

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


    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(18); // Default matches historical 3x6 grid

    // Persist view mode to localStorage
    useEffect(() => {
        localStorage.setItem('pos-view-mode', viewMode);
    }, [viewMode]);

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
        setMobileMoneyNumber('');
    }, [selectedPaymentMethod]);

    // Close cart panel on mobile when cart is cleared
    useEffect(() => {
        if (cart.length === 0 && window.innerWidth < 768) {
            setActiveTab('products');
        }
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
            // Show out-of-stock modal instead of just snackbar
            setOutOfStockProduct(product);
            setShowOutOfStockModal(true);
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

    // Pagination Logic
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredProducts.slice(startIndex, startIndex + pageSize);
    }, [filteredProducts, currentPage, pageSize]);

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

    const processTransaction = async (type: 'paid' | 'invoice', reference?: string) => {
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
                // Intercept Mobile Money for Modal Choice
                if (!reference) {
                    const isMobileMoney = (selectedPaymentMethod || '').toLowerCase().includes('mobile') ||
                        (selectedPaymentMethod || '').toLowerCase().includes('lenco') ||
                        (selectedPaymentMethod || '').toLowerCase().includes('mtn') ||
                        (selectedPaymentMethod || '').toLowerCase().includes('airtel');

                    if (isMobileMoney) {
                        try {
                            // Fetch reference from backend first
                            const refResponse = await api.post<any>('/payments/lenco/initiate', { prefix: 'SP_SALE' });
                            if (refResponse.status && refResponse.data.reference) {
                                setShowPaymentChoiceModal(true);
                                // We don't return here, we wait for the modal to call processTransaction again with the reference
                                // But we need to save the reference somewhere. 
                                // Actually, it's better to just set the reference in the modal or state.
                                setLencoReference(refResponse.data.reference);
                            }
                        } catch (err) {
                            console.error('Failed to initiate Lenco reference:', err);
                            showSnackbar('Failed to initiate payment. Please try again.', 'error');
                        }
                        setIsProcessing(false);
                        return;
                    }
                }

                saleData = {
                    ...baseSaleData,
                    paymentStatus: 'paid',
                    amountPaid: total,
                    payments: [{
                        amount: total,
                        method: selectedPaymentMethod,
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                        reference: reference
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

    const handleLencoVerification = useCallback(async (reference: string, retries: number = 0) => {
        if (retries === 0) {
            setIsVerifyingPayment(true);
            setVerifyingMessage('Initiating verification...');
            setShowPaymentChoiceModal(false);
            stopPollingRef.current = false;
        }

        if (stopPollingRef.current) {
            console.log('Verification stopped by user');
            return;
        }

        try {
            console.log(`Verifying Lenco payment (attempt ${retries + 1}):`, reference);
            const verificationResult = await api.post<any>('/payments/lenco/verify', { reference });

            if (verificationResult.status) {
                if (verificationResult.pending) {
                    if (retries < 20) { // Poll for ~1 minute (3s * 20)
                        setVerifyingMessage(verificationResult.message || 'Waiting for confirmation...');
                        console.log('Payment still pending, retrying in 3s...');
                        setTimeout(() => handleLencoVerification(reference, retries + 1), 3000);
                    } else {
                        showSnackbar('Payment confirmation timed out. Please check your transaction history later.', 'warning');
                        setIsVerifyingPayment(false);
                    }
                } else {
                    setVerifyingMessage('Payment verified!');
                    showSnackbar('Payment verified successfully!', 'success');
                    setIsVerifyingPayment(false);
                    processTransaction('paid', reference);
                }
            } else {
                showSnackbar(verificationResult.message || 'Payment verification failed', 'error');
                setIsVerifyingPayment(false);
            }
        } catch (err: any) {
            console.error('Lenco verification error:', err);
            showSnackbar('Failed to verify payment. Please contact support.', 'error');
            setIsVerifyingPayment(false);
        }
    }, [processTransaction, showSnackbar]);

    const handleCancelVerification = async () => {
        if (!lencoReference) return;

        try {
            stopPollingRef.current = true;
            setIsVerifyingPayment(false);
            showSnackbar('Cancelling transaction...', 'info');

            const response = await api.post<any>('/payments/lenco/cancel', { reference: lencoReference });
            if (response.status) {
                showSnackbar('Transaction cancelled successfully. If a USSD prompt appears on your phone, please decline it manually.', 'success');
            } else {
                showSnackbar(response.message || 'Error notifying backend of cancellation', 'warning');
            }
        } catch (err) {
            console.error('Error cancelling Lenco verification:', err);
            // Even if the API call fails, we've already stopped UI polling
        }
    };

    return (
        <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                <div className="flex-none bg">
                    <Header
                        title="Point of Sale"
                        onMenuClick={onOpenSidebar}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        hideSearchOnMobile={true}
                        showSearch={false}
                        rightContent={
                            <SalesHeaderActions
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                heldSalesCount={heldSales.length}
                                onOpenHeldSales={() => setShowHeldPanel(true)}
                                onTourStart={() => setRunTour(true)}
                            />
                        }
                    />
                </div>

                <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-slate-900">
                    <div className="h-full flex flex-col">
                        {/* Left Column - Products */}
                        <div className="flex-1 flex flex-col h-full min-w-0">
                            {/* Products Grid/List */}
                            <div id="pos-product-list" className="flex-1 overflow-y-auto p-4 scroll-smooth">
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
                                                    const cartItem = cart.find(item => item.productId === product.id);
                                                    return (
                                                        <ProductCard
                                                            key={product.id}
                                                            product={product}
                                                            cartItem={cartItem}
                                                            storeSettings={storeSettings}
                                                            addToCart={addToCart}
                                                            updateQuantity={updateQuantity}
                                                            onLowStockAlert={(product) => {
                                                                setLowStockProduct(product);
                                                                setShowLowStockAlert(true);
                                                            }}
                                                            variant="grid"
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {paginatedProducts.map(product => {
                                                    const cartItem = cart.find(item => item.productId === product.id);
                                                    return (
                                                        <ProductCard
                                                            key={product.id}
                                                            product={product}
                                                            cartItem={cartItem}
                                                            storeSettings={storeSettings}
                                                            addToCart={addToCart}
                                                            updateQuantity={updateQuantity}
                                                            onLowStockAlert={(product) => {
                                                                setLowStockProduct(product);
                                                                setShowLowStockAlert(true);
                                                            }}
                                                            variant="list"
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {filteredProducts.length === 0 && (
                                            <div className="text-center py-12">
                                                <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                                                <p className="text-slate-600 dark:text-gray-400">No products found</p>
                                                <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">Try a different search term</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Pagination
                                total={filteredProducts.length}
                                page={currentPage}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                                label="products"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Cart & Checkout */}
            <div className="w-full md:w-[400px] xl:w-[450px] flex-none flex flex-col h-full bg-gray-50 dark:bg-slate-900 z-20 " >
                {/* Cart Header */}
                <div className="flex-none p-4 py-2 border-b border-slate-100 dark:border-white/5 shadow-sm bg-transparent" >
                    <div className="flex items-center justify-between">
                        <div className="hidden md:flex items-center gap-3">
                            <div>
                                <h2 className="font-bold text-lg text-slate-700 dark:text-white">Shopping Cart</h2>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                    <span>{cart.length} items</span>
                                    {cart.length > 0 && (
                                        <>
                                            <span className="w-1 h-1 bg-slate-400 dark:bg-slate-600 rounded-full"></span>
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
                <CartPanel
                    cart={cart}
                    storeSettings={storeSettings}
                    updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart}
                />

                {/* Cart Summary & Actions (Fixed Bottom) - Now Resizable */}
                <CheckoutActions
                    cart={cart}
                    storeSettings={storeSettings}
                    customers={customers}
                    total={total}
                    subtotal={subtotal}
                    taxAmount={taxAmount}
                    discount={discount}
                    setDiscount={setDiscount}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                    onApplyStoreCredit={handleApplyStoreCredit}
                    finalAppliedCredit={finalAppliedCredit}
                    selectedPaymentMethod={selectedPaymentMethod}
                    setSelectedPaymentMethod={setSelectedPaymentMethod}
                    cashReceived={cashReceived}
                    setCashReceived={setCashReceived}
                    processTransaction={processTransaction}
                    isProcessing={isProcessing}
                    isScannerOpen={isScannerOpen}
                    setIsScannerOpen={setIsScannerOpen}
                    cartActionTab={cartActionTab}
                    setCartActionTab={setCartActionTab}
                    onHoldSale={handleHoldSale}
                    onContinuousScan={handleContinuousScan}
                    onScanError={handleScanError}
                    changeDue={changeDue}
                    mobileMoneyNumber={mobileMoneyNumber}
                    setMobileMoneyNumber={setMobileMoneyNumber}
                    setAppliedStoreCredit={setAppliedStoreCredit}
                    cashInputRef={cashInputRef as React.RefObject<HTMLInputElement>}
                />

                {/* Mobile Product View */}
                <MobileProductView
                    isOpen={activeTab === 'products'}
                    products={filteredProducts}
                    storeSettings={storeSettings}
                    addToCart={addToCart}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onOpenSidebar={onOpenSidebar}
                    onTourStart={() => setRunTour(true)}
                />
            </div>

            {/* Mobile Cart View */}
            <MobileCartView
                isOpen={activeTab === 'cart'}
                onClose={() => setActiveTab('products')}
                cart={cart}
                storeSettings={storeSettings}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                clearCart={clearCart}
                customers={customers}
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                discount={discount}
                setDiscount={setDiscount}
                subtotal={subtotal}
                taxAmount={taxAmount}
                total={total}
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                mobileMoneyNumber={mobileMoneyNumber}
                setMobileMoneyNumber={setMobileMoneyNumber}
                cashReceived={cashReceived}
                setCashReceived={setCashReceived}
                changeDue={changeDue}
                onHoldSale={handleHoldSale}
                processTransaction={processTransaction}
                isProcessing={isProcessing}
                mobileCashInputRef={mobileCashInputRef as React.RefObject<HTMLInputElement>}
                isScannerOpen={isScannerOpen}
                setIsScannerOpen={setIsScannerOpen}
                onContinuousScan={handleContinuousScan}
                onScanError={handleScanError}
                setAppliedStoreCredit={setAppliedStoreCredit}
            />

            {/* Modals */}
            {activeTab !== 'cart' && (
                <SalesFAB
                    isFabVisible={isFabVisible}
                    setIsScannerOpen={setIsScannerOpen}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    cartCount={cart.length}
                    setShowHeldPanel={setShowHeldPanel}
                    heldSalesCount={heldSales.length}
                />
            )}

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

            {/* Modals */}
            <OutOfStockModal
                isOpen={showOutOfStockModal}
                onClose={() => {
                    setShowOutOfStockModal(false);
                    setOutOfStockProduct(null);
                }}
                product={outOfStockProduct!}
            />

            <LowStockAlertModal
                isOpen={showLowStockAlert}
                onClose={() => {
                    setShowLowStockAlert(false);
                    setLowStockProduct(null);
                }}
                product={lowStockProduct!}
                user={user}
                storeSettings={storeSettings}
                showSnackbar={showSnackbar}
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

            <PaymentChoiceModal
                isOpen={showPaymentChoiceModal}
                onClose={() => setShowPaymentChoiceModal(false)}
                totalAmount={total} // Using the memoized total instead of re-calculating
                customerEmail={selectedCustomer?.email || 'guest@salepilot.com'}
                customerName={selectedCustomer?.name || 'Guest'}
                customerPhone={mobileMoneyNumber || selectedCustomer?.phone || ''}
                storeSettings={storeSettings}
                reference={lencoReference}
                onLencoSuccess={async (response) => {
                    handleLencoVerification(response.reference);
                }}
                onConfirmationPending={async (response) => {
                    handleLencoVerification(response.reference);
                }}
                onManualConfirm={() => {
                    setShowPaymentChoiceModal(false);
                    processTransaction('paid', 'manual-verfication');
                }}
            />

            {/* Verification Loading Overlay */}
            {isVerifyingPayment && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                        <LoadingSpinner size="lg" fullScreen={false} text="" />
                        <p className="font-semibold text-slate-900">{verifyingMessage}</p>
                        <p className="text-sm text-slate-500 text-center">Please wait while we confirm your transaction with Lenco.</p>
                        <button
                            onClick={handleCancelVerification}
                            className="mt-4 px-6 py-2 bg-red-50 text-red-600 rounded-xl font-bold border border-red-200 hover:bg-red-100 transition-all text-sm"
                        >
                            Cancel Transaction
                        </button>
                    </div>
                </div>
            )}

            <TourGuide
                user={user}
                page="sales"
                run={runTour}
                onTourEnd={() => setRunTour(false)}
            />

        </div >
    );
};

export default SalesPage;