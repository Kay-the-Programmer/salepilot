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
import OutOfStockModal from '../components/sales/OutOfStockModal';
import LowStockAlertModal from '../components/sales/LowStockAlertModal';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

// New Modular Components
import { ProductCard } from '../components/sales/ProductCard';
import { CartPanel } from '../components/sales/CartPanel';
import { CheckoutActions } from '../components/sales/CheckoutActions';
import { MobileCartView } from '../components/sales/MobileCartView';
import { MobileProductView } from '../components/sales/MobileProductView';
import { SalesHeaderActions } from '../components/sales/SalesHeaderActions';

// Icons for Bottom Navigation
import { ShoppingCartIcon, ArchiveBoxIcon, ClockIcon } from '../components/icons';

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
    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
    const [heldSales, setHeldSales] = useState<CartItem[][]>([]);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [appliedStoreCredit, setAppliedStoreCredit] = useState(0);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const cashInputRef = useRef<HTMLInputElement>(null);

    const [showHeldPanel, setShowHeldPanel] = useState<boolean>(false);
    const [shouldFocusCashInput, setShouldFocusCashInput] = useState(false);
    const mobileCashInputRef = useRef<HTMLInputElement>(null);
    const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');

    // External Product Lookup State
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [initialProductValues, setInitialProductValues] = useState<Partial<Product> | undefined>(undefined);

    // Scan Action State
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

    // External barcode scanner hook — paused while any modal overlapping the POS is open
    const isScannerModalOpen = showOutOfStockModal || showLowStockAlert || isProductFormOpen || showPaymentChoiceModal;

    // Stable ref so the scanner callback never becomes stale
    const handleContinuousScanRef = useRef<(barcode: string) => void>(() => {});

    const stableScanCallback = useCallback((barcode: string) => {
        handleContinuousScanRef.current(barcode);
    }, []);

    const { isActive: isExternalScannerActive } = useBarcodeScanner(stableScanCallback, { paused: isScannerModalOpen });

    const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');

    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        const saved = localStorage.getItem('pos-view-mode');
        if (saved === 'list' || saved === 'grid') return saved;
        return typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid';
    });

    // Cart Actions Tab State
    const [cartActionTab, setCartActionTab] = useState<'customer' | 'summary' | 'payment'>('payment');


    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(18); // Default matches historical 3x6 grid

    // Mobile Nav Visibility State
    const [isNavVisible, setIsNavVisible] = useState(true);

    // Scroll Detection for hiding/showing bottom nav
    const lastScrollY = useRef(0);
    const handleMobileScroll = useCallback((currentScrollY: number) => {
        if (typeof window === 'undefined' || window.innerWidth >= 768) return;

        const scrollDiff = currentScrollY - lastScrollY.current;

        if (scrollDiff > 10 && currentScrollY > 60) {
            // Scrolling down
            setIsNavVisible(false);
        } else if (scrollDiff < -10) {
            // Scrolling up
            setIsNavVisible(true);
        }
        lastScrollY.current = currentScrollY;
    }, []);

    // Persist view mode to localStorage
    useEffect(() => {
        localStorage.setItem('pos-view-mode', viewMode);
    }, [viewMode]);



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

    const roundQty = useCallback((q: number) => Math.round(q * 1000) / 1000, []);
    const getStepFor = useCallback((uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1), []);

    const addToCart = useCallback((product: Product) => {
        const existingItem = cart.find(item => item.productId === product.id);
        const step = getStepFor(product.unitOfMeasure);
        const stockInCart = existingItem ? existingItem.quantity : 0;
        const availableStock = typeof (product as any).stock === 'number'
            ? (product as any).stock
            : (parseFloat(String((product as any).stock)) || 0);

        if (stockInCart + step <= availableStock + 1e-9) {
            if (existingItem) {
                const newQty = Math.min(availableStock, roundQty(existingItem.quantity + step));
                // Option B: Move to top and update quantity
                setCart(prev => [
                    { ...existingItem, quantity: newQty },
                    ...prev.filter(item => item.productId !== product.id)
                ]);
                showSnackbar(`Added another "${product.name}" to cart`, 'success');
            } else {
                // Prepend new item to the top
                setCart(prev => [
                    {
                        productId: product.id,
                        name: product.name,
                        sku: product.sku,
                        price: product.price,
                        quantity: step,
                        stock: availableStock,
                        unitOfMeasure: product.unitOfMeasure,
                        costPrice: product.costPrice,
                    },
                    ...prev
                ]);
                showSnackbar(`Added "${product.name}" to cart`, 'success');
            }
        } else {
            // Show out-of-stock modal instead of just snackbar
            setOutOfStockProduct(product);
            setShowOutOfStockModal(true);
        }
    }, [cart, getStepFor, roundQty, showSnackbar]);

    const updateQuantity = useCallback((productId: string, newQuantity: number) => {
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
    }, [roundQty, showSnackbar]);

    const removeFromCart = useCallback((productId: string) => {
        const item = cart.find(item => item.productId === productId);
        if (item) {
            setCart(prev => prev.filter(p => p.productId !== productId));
            showSnackbar(`Removed "${item.name}" from cart`, 'info');
        }
    }, [cart, showSnackbar]);

    const clearCart = useCallback(() => {
        if (cart.length === 0) return;
        setCart([]);
        setDiscount('0');
        setDiscountType('amount');
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

    const handleContinuousScan = useCallback(async (decodedText: string) => {
        const trimmed = decodedText.trim();
        const product = products.find(p =>
            p.status === 'active' &&
            (p.barcode === trimmed || p.sku === trimmed)
        );
        if (product) {
            addToCart(product);
            // Modal popup removed for seamless continuous scanning
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
    }, [products, addToCart, showSnackbar]);

    // Keep ref current so stableScanCallback always delegates to latest handleContinuousScan
    useEffect(() => {
        handleContinuousScanRef.current = handleContinuousScan;
    }, [handleContinuousScan]);

    const handleScanError = useCallback((error: any) => {
        console.warn(error);
    }, []);

    const { subtotal, discountAmount, taxAmount, total, totalBeforeCredit, finalAppliedCredit } = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const discountValue = parseFloat(discount) || 0;
        const discountAmount = discountType === 'percentage'
            ? subtotal * (discountValue / 100)
            : discountValue;
        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
        const taxAmount = subtotalAfterDiscount * taxRate;
        const totalBeforeCredit = subtotalAfterDiscount + taxAmount;
        const finalAppliedCredit = Math.min(appliedStoreCredit, totalBeforeCredit);
        const total = totalBeforeCredit - finalAppliedCredit;
        return { subtotal, discountAmount, taxAmount, total, totalBeforeCredit, finalAppliedCredit };
    }, [cart, discount, discountType, appliedStoreCredit, taxRate]);

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
                cashReceived: isCashMethod ? cashReceivedNumber : undefined,
                changeDue: isCashMethod ? changeDue : undefined,
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
                            // If Merchant Key is set, generate local reference and skip backend initiation
                            if (storeSettings.lencoPublicKey) {
                                const localRef = `SP-${Date.now()}`;
                                setLencoReference(localRef);
                                setShowPaymentChoiceModal(true);
                            } else {
                                // Standard flow: Fetch reference from backend
                                const refResponse = await api.post<any>('/payments/lenco/initiate', { prefix: 'SP_SALE' });
                                if (refResponse.status && refResponse.data.reference) {
                                    setShowPaymentChoiceModal(true);
                                    setLencoReference(refResponse.data.reference);
                                }
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
        <div className="h-[100dvh] w-full bg-background relative selection:bg-primary/30 flex flex-col md:flex-row overflow-hidden font-google">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative z-10">
                <Header
                    title="Point of Sale"
                    onMenuClick={onOpenSidebar}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    hideSearchOnMobile={false}
                    showSearch={true}
                    hideSearchOnDesktop={true}
                    className="z-[60]"
                    searchSuggestions={
                        searchTerm.trim().length > 0
                            ? filteredProducts.slice(0, 8).map(p => p.name)
                            : []
                    }
                    onSuggestionSelect={(name) => setSearchTerm(name)}
                    rightContent={
                        <div className="flex items-center gap-2">
                            {/* External Scanner Status Badge */}
                            {isExternalScannerActive && (
                                <div
                                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold select-none"
                                    title="External barcode scanner is active"
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Scanner Active
                                </div>
                            )}
                            <SalesHeaderActions
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                heldSalesCount={heldSales.length}
                                onOpenHeldSales={() => setShowHeldPanel(true)}
                                onTourStart={() => setRunTour(true)}
                            />
                        </div>
                    }
                />

                <div className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col">
                        <div className="flex-1 flex flex-col h-full min-w-0">
                            {/* Products Grid/List */}
                            <div
                                id="pos-product-list"
                                className="flex-1 overflow-y-auto p-3 md:p-4 scroll-smooth pb-24 md:pb-4"
                                role="region"
                                aria-label="Product catalog"
                            >
                                {isLoading ? (
                                    <div className="max-w-7xl mx-auto w-full">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                                            {Array.from({ length: 12 }).map((_, i) => (
                                                <ProductCardSkeleton key={i} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-7xl mx-auto w-full">
                                        {viewMode === 'grid' ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
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
                                            <div className="space-y-1.5">
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
                                            <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
                                                <div className="w-16 h-16 rounded-3xl bg-surface border border-brand-border flex items-center justify-center mb-4 shadow-sm">
                                                    <MagnifyingGlassIcon className="w-7 h-7 text-brand-text-muted" />
                                                </div>
                                                <p className="text-brand-text font-semibold">No products found</p>
                                                <p className="text-sm text-brand-text-muted mt-1 max-w-xs">
                                                    {searchTerm ? `No results for "${searchTerm}" — try a different search` : 'No active products yet'}
                                                </p>
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
            <aside
                className="w-full md:w-[380px] xl:w-[420px] flex-none hidden md:flex flex-col h-full bg-surface/80 backdrop-blur-3xl border-l border-brand-border shadow-[-20px_0_40px_rgb(0,0,0,0.04)] dark:shadow-[-20px_0_40px_rgb(0,0,0,0.2)] z-20"
                aria-label="Shopping cart"
            >
                {/* Cart Header */}
                <div className="flex-none px-6 py-5 border-b border-brand-border bg-transparent relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h2 className="text-[17px] font-bold tracking-tight text-brand-text leading-none">Order</h2>
                            <p className="text-[13px] font-medium text-brand-text-muted mt-1.5 tabular-nums">
                                {cart.length > 0
                                    ? <span className="flex items-center gap-2">
                                        <span className="bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary px-2 py-0.5 rounded-full text-[11px] font-bold">{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                        <span>{formatCurrency(subtotal, storeSettings)}</span>
                                    </span>
                                    : 'Nothing added yet'}
                            </p>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-xs font-semibold text-danger hover:text-danger/80 transition-colors active:scale-95"
                                aria-label="Clear all items from cart"
                            >
                                Clear all
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
                    discountType={discountType}
                    setDiscountType={setDiscountType}
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

            </aside>

            {/* Mobile View Components */}
            <MobileProductView
                isOpen={activeTab === 'products'}
                products={filteredProducts}
                cart={cart}
                storeSettings={storeSettings}
                addToCart={addToCart}
                updateQuantity={updateQuantity}
                searchTerm={searchTerm}
                viewMode={viewMode}
                onScroll={handleMobileScroll}
            />

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
                discountType={discountType}
                setDiscountType={setDiscountType}
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
                mobileCashInputRef={mobileCashInputRef}
                isScannerOpen={isScannerOpen}
                setIsScannerOpen={setIsScannerOpen}
                onContinuousScan={handleContinuousScan}
                onScanError={handleScanError}
                setAppliedStoreCredit={setAppliedStoreCredit}
                heldSalesCount={heldSales.length}
                onOpenHeldSales={() => setShowHeldPanel(true)}
                onScroll={handleMobileScroll}
            />

            {/* Mobile Footer Spacing for Bottom Nav */}
            <div className="h-24 md:hidden flex-none"></div>

            {/* Premium Mobile Bottom Navigation Bar (Liquid Glass Apple Design) */}
            <nav
                aria-label="Mobile Bottom Navigation"
                className={`
                    md:hidden fixed z-[70] transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)
                    left-6 right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))]
                    liquid-glass
                    rounded-[2.5rem]
                    ${isNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-[calc(100%+4rem)] opacity-0 pointer-events-none'}
                `}
            >
                <div className="flex items-center justify-around px-3 py-2.5">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`group relative flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-90 outline-none ${activeTab === 'products' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                        aria-selected={activeTab === 'products'}
                    >
                        <div className="relative">
                            <div className={`p-2 rounded-2xl transition-all duration-500 ${activeTab === 'products' ? 'bg-blue-500/10 scale-110' : 'bg-transparent group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/50'}`}>
                                <ArchiveBoxIcon className="w-[22px] h-[22px]" />
                            </div>
                            {activeTab === 'products' && (
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
                            )}
                        </div>
                        <span className={`text-[10px] font-extrabold tracking-tight transition-all duration-300 uppercase ${activeTab === 'products' ? 'opacity-100' : 'opacity-60'}`}>Catalog</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`group relative flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-90 outline-none ${activeTab === 'cart' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                        aria-selected={activeTab === 'cart'}
                    >
                        <div className="relative">
                            <div className={`p-2 rounded-2xl transition-all duration-500 ${activeTab === 'cart' ? 'bg-blue-500/10 scale-110' : 'bg-transparent group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/50'}`}>
                                <ShoppingCartIcon className="w-[22px] h-[22px]" />
                            </div>
                            {cart.length > 0 && (
                                <div className="absolute -top-1 -right-1 bg-rose-500 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-[0_2px_8px_rgba(244,63,94,0.4)] border-2 border-white/80 dark:border-slate-800/80 px-1.5 transition-transform transform scale-110">
                                    {cart.length}
                                </div>
                            )}
                            {activeTab === 'cart' && (
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
                            )}
                        </div>
                        <span className={`text-[10px] font-extrabold tracking-tight transition-all duration-300 uppercase ${activeTab === 'cart' ? 'opacity-100' : 'opacity-60'}`}>Cart</span>
                    </button>

                    <button
                        onClick={() => setShowHeldPanel(true)}
                        className="group relative flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-90 outline-none text-slate-500 dark:text-slate-400"
                    >
                        <div className="relative">
                            <div className="p-2 rounded-2xl transition-all duration-500 bg-transparent group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/50">
                                <ClockIcon className="w-[22px] h-[22px]" />
                            </div>
                            {heldSales.length > 0 && (
                                <div className="absolute -top-1 -right-1 bg-amber-500 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-[0_2px_8px_rgba(245,158,11,0.4)] border-2 border-white/80 dark:border-slate-800/80 px-1.5 transition-transform transform scale-110">
                                    {heldSales.length}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-extrabold tracking-tight transition-all duration-300 uppercase opacity-60 group-hover:opacity-100">Held</span>
                    </button>
                </div>
            </nav>

            {/* Modals */}
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
                merchantPublicKey={storeSettings.lencoPublicKey}
                onLencoSuccess={(response) => {
                    if (storeSettings.lencoPublicKey) {
                        // Direct settlement: Trust the widget callback and finalize immediately
                        setShowPaymentChoiceModal(false);
                        processTransaction('paid', response.reference);
                        showSnackbar('Payment confirmed via Merchant Account', 'success');
                    } else {
                        // Standard platform settlement: Backend verification required
                        handleLencoVerification(response.reference);
                    }
                }}
                onConfirmationPending={(response) => {
                    if (storeSettings.lencoPublicKey) {
                        // For merchant keys, we can't really track pending status via backend
                        setShowPaymentChoiceModal(false);
                        showSnackbar('Payment initiated. Please confirm on your device.', 'info');
                    } else {
                        handleLencoVerification(response.reference);
                    }
                }}
                onManualConfirm={() => {
                    setShowPaymentChoiceModal(false);
                    processTransaction('paid', `MANUAL-${Date.now()}`);
                }}
            />

            {/* Verification Loading Overlay */}
            {
                isVerifyingPayment && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="liquid-glass-card rounded-[2rem] p-6 flex flex-col items-center gap-4">
                            <LoadingSpinner size="lg" fullScreen={false} text="" />
                            <p className="font-semibold text-slate-900">{verifyingMessage}</p>
                            <p className="text-sm text-slate-500 text-center">Please wait while we confirm your transaction with Lenco.</p>
                            <button
                                onClick={handleCancelVerification}
                                className="mt-4 px-6 py-2 bg-red-50 text-red-600 rounded-xl font-bold border border-red-200 hover:bg-red-100 transition-all text-sm active:scale-95 transition-all duration-300"
                            >
                                Cancel Transaction
                            </button>
                        </div>
                    </div>
                )
            }

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