import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Product, CartItem, Sale, Customer, StoreSettings, Payment, Category, Supplier, User, Return } from '../types';
import { SnackbarType } from '../App';
import { api } from '@/services/api';
import { formatCurrency } from '../utils/currency';
import TourGuide from '../components/TourGuide';
import ReceiptModal from '../components/sales/ReceiptModal';
import HeldSalesModal from '../components/sales/HeldSalesModal';
import ProductFormModal from '../components/ProductFormModal';
import OutOfStockModal from '../components/sales/OutOfStockModal';
import LowStockAlertModal from '../components/sales/LowStockAlertModal';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

// POS components — redesigned to match salepilot_web_v2/src/pages/pos
import { ProductCard } from '../components/sales/ProductCard';
import { CartPanel } from '../components/sales/CartPanel';
import { CheckoutActions } from '../components/sales/CheckoutActions';
import { PaymentPanel } from '../components/sales/PaymentPanel';
import { ConfirmPaymentPanel } from '../components/sales/ConfirmPaymentPanel';
import { SalesHistoryView } from '../components/sales/SalesHistoryView';
import CustomerSelect from '../components/sales/CustomerSelect';
import PosIcon from '../components/sales/PosIcon';
import UnifiedScannerModal from '../components/UnifiedScannerModal';
import Logo from '../assets/logo.png';
import AppSwitcher from '../components/standalone/AppSwitcher';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import './sale-v2.css';

interface SalesPageProps {
    user: User;
    products: Product[];
    customers: Customer[];
    onProcessSale: (sale: Sale) => Promise<Sale | null>;
    isLoading: boolean;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
    onOpenSidebar?: () => void;
    onLogout?: () => void;
    categories: Category[];
    suppliers: Supplier[];
    onSaveProduct: (product: Product | Omit<Product, 'id'>) => Promise<Product>;
    onProcessReturn: (returnInfo: Return) => void;
}

const SalesPage: React.FC<SalesPageProps> = ({
    user,
    products,
    customers,
    onProcessSale,
    isLoading,
    showSnackbar,
    storeSettings,
    categories,
    suppliers,
    onSaveProduct,
    onProcessReturn,
    onLogout,
}) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory] = useState('All Items');
    const [discount, setDiscount] = useState<string>('0');
    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
    const [heldSales, setHeldSales] = useState<CartItem[][]>([]);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerPicker, setShowCustomerPicker] = useState(false);
    // Progressive disclosure: 'cart' = building the order, 'payment' = method/charge step,
    // 'confirm' = mobile-money gateway/manual confirmation step.
    const [cartView, setCartView] = useState<'cart' | 'payment' | 'confirm'>('cart');
    // Mobile: cart aside opens as a full-screen sheet
    const [mobileCartOpen, setMobileCartOpen] = useState(false);
    // POS top-level view + menu (Sell vs Sales History & Refunds)
    const [posView, setPosView] = useState<'sell' | 'history'>('sell');
    const [posMenuOpen, setPosMenuOpen] = useState(false);
    const [appliedStoreCredit, setAppliedStoreCredit] = useState(0);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const cashInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [showHeldPanel, setShowHeldPanel] = useState<boolean>(false);
    const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');

    // External Product Lookup State
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [initialProductValues, setInitialProductValues] = useState<Partial<Product> | undefined>(undefined);

    // Scan Action State
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

    // Camera barcode scanner (triggered from the search bar)
    const [isCamScannerOpen, setIsCamScannerOpen] = useState(false);

    // External barcode scanner hook — paused while any modal overlapping the POS is open
    const isScannerModalOpen = showOutOfStockModal || showLowStockAlert || isProductFormOpen || isCamScannerOpen || cartView === 'confirm';

    // Premium entitlement: the automated Payment Gateway add-on. Unlocked when the
    // store has bought the module, or has configured its own merchant gateway key.
    const isGatewayUnlocked = !!storeSettings.lencoPublicKey || (storeSettings.enabledModules?.includes('payment_gateway') ?? false);

    // Stable ref so the scanner callback never becomes stale
    const handleContinuousScanRef = useRef<(barcode: string) => void>(() => { });

    const stableScanCallback = useCallback((barcode: string) => {
        handleContinuousScanRef.current(barcode);
    }, []);

    const { isActive: isExternalScannerActive } = useBarcodeScanner(stableScanCallback, { paused: isScannerModalOpen });

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

    // An empty cart can never be in the payment step, and the mobile sheet should close.
    useEffect(() => {
        if (cart.length === 0) {
            setCartView('cart');
            setMobileCartOpen(false);
        }
    }, [cart.length]);

    const taxRate = storeSettings.taxRate / 100;

    const roundQty = useCallback((q: number) => Math.round(q * 1000) / 1000, []);
    const getStepFor = useCallback((uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1), []);

    const addToCart = useCallback((product: Product) => {
        // Adding a product returns us to the cart-building view (hides held list / payment step).
        setCartView('cart');
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
        const catObj = activeCategory !== 'All Items'
            ? categories.find(c => c.name === activeCategory)
            : undefined;

        return products.filter(p => {
            if (p.status !== 'active') return false;
            if (activeCategory !== 'All Items' && (!catObj || (p as any).categoryId !== catObj.id)) return false;
            if (!term) return true;
            return (
                p.name.toLowerCase().includes(term) ||
                (p.sku && p.sku.toLowerCase().includes(term)) ||
                (p.barcode && p.barcode.toLowerCase().includes(term))
            );
        });
    }, [products, searchTerm, activeCategory, categories]);

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
                // Intercept Mobile Money → show the Confirm Payment step (inline page, not a modal)
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
                                setCartView('confirm');
                            } else {
                                // No merchant Lenco account connected. The Accept Mobile Money
                                // add-on enables this option, but funds must settle to the
                                // MERCHANT — we never route a sale to the platform account.
                                // Guide them to connect their own Lenco account first.
                                showSnackbar('Connect your Lenco account in Settings → Financial to receive mobile-money payments.', 'warning');
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
        <div className="sale">
            {/* ── Top bar ── */}
            <header className="sale__topbar">
                <AppSwitcher user={user} currentRoute="pos" triggerClassName="sale__menu" />
                <div className="sale__brand">
                    <img src={Logo} alt="SalePilot" className="sale__brand-logo" />
                    <h1 className="sale__title">{posView === 'history' ? 'Sales History' : 'Point of Sale'}</h1>
                </div>

                <div className="sale__topactions">
                    {isExternalScannerActive && (
                        <span className="sale__scanbadge" title="External barcode scanner is active">
                            <span className="sale__scanbadge-dot" />
                            Scanner Active
                        </span>
                    )}

                    <button type="button" className="sale__iconbtn" onClick={toggleTheme} aria-label="Toggle light or dark theme" title="Toggle theme">
                        <PosIcon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={22} />
                    </button>

                    {/* Simple POS menu — Sell / Sales History / Held / Help */}
                    <div className="sale__menuwrap">
                        <button
                            type="button"
                            id="pos-menu-btn"
                            className="sale__iconbtn sale__menubtn"
                            aria-label="Open POS menu"
                            aria-haspopup="menu"
                            aria-expanded={posMenuOpen}
                            onClick={() => setPosMenuOpen(v => !v)}
                        >
                            <PosIcon name="menu" size={22} />
                            {heldSales.length > 0 && <span className="sale__menubtn-badge">{heldSales.length}</span>}
                        </button>
                        {posMenuOpen && (
                            <>
                                <div className="sale__menu-backdrop" onClick={() => setPosMenuOpen(false)} />
                                <div className="sale__menu-pop" role="menu">
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className={`sale__menu-item${posView === 'sell' ? ' sale__menu-item--active' : ''}`}
                                        onClick={() => { setPosView('sell'); setPosMenuOpen(false); }}
                                    >
                                        <PosIcon name="point_of_sale" size={20} fill={posView === 'sell' ? 1 : 0} />
                                        Point of Sale
                                        {posView === 'sell' && <PosIcon name="check" size={18} className="sale__menu-check" />}
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className={`sale__menu-item${posView === 'history' ? ' sale__menu-item--active' : ''}`}
                                        onClick={() => { setPosView('history'); setMobileCartOpen(false); setPosMenuOpen(false); }}
                                    >
                                        <PosIcon name="receipt_long" size={20} fill={posView === 'history' ? 1 : 0} />
                                        Sales History &amp; Refunds
                                        {posView === 'history' && <PosIcon name="check" size={18} className="sale__menu-check" />}
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="sale__menu-item"
                                        onClick={() => { setShowHeldPanel(true); setPosMenuOpen(false); }}
                                    >
                                        <PosIcon name="history" size={20} />
                                        Held Sales
                                        {heldSales.length > 0 && <span className="sale__menu-count">{heldSales.length}</span>}
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="sale__menu-item"
                                        onClick={() => { setRunTour(true); setPosMenuOpen(false); }}
                                    >
                                        <PosIcon name="help" size={20} />
                                        Help Guide
                                    </button>
                                    <div className="sale__menu-sep" />
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="sale__menu-item"
                                        onClick={() => { navigate('/inv/items'); setPosMenuOpen(false); }}
                                    >
                                        <PosIcon name="inventory_2" size={20} />
                                        Inventory
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="sale__menu-item"
                                        onClick={() => { navigate('/pos/dashboard'); setPosMenuOpen(false); }}
                                    >
                                        <PosIcon name="monitoring" size={20} />
                                        Dashboard
                                    </button>
                                    <div className="sale__menu-sep" />
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="sale__menu-item"
                                        onClick={() => { navigate('/'); setPosMenuOpen(false); }}
                                    >
                                        <PosIcon name="grid_view" size={20} />
                                        Full SalePilot App
                                    </button>
                                    {onLogout && (
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className="sale__menu-item"
                                            onClick={() => { onLogout(); setPosMenuOpen(false); }}
                                        >
                                            <PosIcon name="logout" size={20} />
                                            Logout
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                </div>

                {posView === 'sell' && (
                    <div className="sale__search">
                        <PosIcon name="search" size={20} className="sale__search-icon" />
                        <input
                            ref={searchInputRef}
                            id="pos-search"
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search products or scan barcode"
                            aria-label="Search products"
                        />
                        <div className="sale__search-actions">
                            {searchTerm && (
                                <button
                                    type="button"
                                    className="sale__search-clear"
                                    aria-label="Clear search"
                                    onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                                >
                                    <PosIcon name="close" size={16} />
                                </button>
                            )}
                            <button
                                type="button"
                                className="sale__search-scan"
                                aria-label="Scan barcode"
                                onClick={() => setIsCamScannerOpen(true)}
                            >
                                <PosIcon name="barcode_scanner" size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {posView === 'history' ? (
                <SalesHistoryView
                    storeSettings={storeSettings}
                    customers={customers}
                    onProcessReturn={onProcessReturn}
                    showSnackbar={showSnackbar}
                />
            ) : (
                <div className="sale__body">
                    {/* ── Browse ── */}
                    <main className="sale__browse">
                        <div className="sale__grid" id="pos-product-list" role="region" aria-label="Product catalog">
                            {isLoading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="prodcard" style={{ height: 210, opacity: 0.4, pointerEvents: 'none' }} />
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <div className="sale__empty">
                                    <PosIcon name="search_off" size={40} />
                                    <p>
                                        {searchTerm
                                            ? `No products match “${searchTerm}”.`
                                            : 'No active products in this category yet.'}
                                    </p>
                                </div>
                            ) : (
                                filteredProducts.map(product => {
                                    const cartItem = cart.find(item => item.productId === product.id);
                                    return (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            cartItem={cartItem}
                                            storeSettings={storeSettings}
                                            addToCart={addToCart}
                                            updateQuantity={updateQuantity}
                                            onLowStockAlert={(p) => {
                                                setLowStockProduct(p);
                                                setShowLowStockAlert(true);
                                            }}
                                            variant="grid"
                                        />
                                    );
                                })
                            )}
                        </div>
                    </main>

                    {/* ── Cart / Payment (progressive disclosure) ── */}
                    <aside className={`cart${mobileCartOpen ? ' cart--open' : ''}`} aria-label="Current sale">
                        {cartView === 'confirm' ? (
                            <ConfirmPaymentPanel
                                storeSettings={storeSettings}
                                totalAmount={total}
                                customerEmail={selectedCustomer?.email || 'guest@salepilot.com'}
                                customerName={selectedCustomer?.name || 'Guest'}
                                customerPhone={mobileMoneyNumber || selectedCustomer?.phone || ''}
                                reference={lencoReference}
                                merchantPublicKey={storeSettings.lencoPublicKey}
                                isGatewayUnlocked={isGatewayUnlocked}
                                onLencoSuccess={(response) => {
                                    if (storeSettings.lencoPublicKey) {
                                        processTransaction('paid', response.reference);
                                        showSnackbar('Payment confirmed via Merchant Account', 'success');
                                    } else {
                                        handleLencoVerification(response.reference);
                                    }
                                }}
                                onConfirmationPending={(response) => {
                                    if (storeSettings.lencoPublicKey) {
                                        setCartView('payment');
                                        showSnackbar('Payment initiated. Please confirm on your device.', 'info');
                                    } else {
                                        handleLencoVerification(response.reference);
                                    }
                                }}
                                onManualConfirm={() => processTransaction('paid', `MANUAL-${Date.now()}`)}
                                onUpgrade={() => showSnackbar('Payment Gateway is a premium add-on — manage it from Settings → Subscription.', 'info')}
                                onBack={() => setCartView('payment')}
                                onCloseMobile={() => setMobileCartOpen(false)}
                            />
                        ) : cartView === 'payment' ? (
                            <PaymentPanel
                                cart={cart}
                                storeSettings={storeSettings}
                                total={total}
                                subtotal={subtotal}
                                taxAmount={taxAmount}
                                finalAppliedCredit={finalAppliedCredit}
                                selectedCustomer={selectedCustomer}
                                onApplyStoreCredit={handleApplyStoreCredit}
                                selectedPaymentMethod={selectedPaymentMethod}
                                setSelectedPaymentMethod={setSelectedPaymentMethod}
                                cashReceived={cashReceived}
                                setCashReceived={setCashReceived}
                                cashInputRef={cashInputRef as React.RefObject<HTMLInputElement>}
                                changeDue={changeDue}
                                mobileMoneyNumber={mobileMoneyNumber}
                                setMobileMoneyNumber={setMobileMoneyNumber}
                                processTransaction={processTransaction}
                                isProcessing={isProcessing}
                                onBack={() => setCartView('cart')}
                                onCloseMobile={() => setMobileCartOpen(false)}
                            />
                        ) : (
                            <>
                                <div className="cart__head">
                                    <div>
                                        <h2>Current Sale</h2>
                                        <p className="cart__meta tnum">
                                            {cart.length > 0
                                                ? `${cart.length} ${cart.length === 1 ? 'item' : 'items'} · ${formatCurrency(subtotal, storeSettings)}`
                                                : 'Walk-in Customer'}
                                            {selectedCustomer ? ` · ${selectedCustomer.name}` : ''}
                                        </p>
                                    </div>
                                    <div className="cart__head-actions">
                                        <button
                                            type="button"
                                            className={`v2-iconbtn${selectedCustomer ? ' cart__method--active' : ''}`}
                                            aria-label="Add customer to sale"
                                            aria-expanded={showCustomerPicker}
                                            onClick={() => setShowCustomerPicker(v => !v)}
                                        >
                                            <PosIcon name={selectedCustomer ? 'person' : 'person_add'} size={20} />
                                        </button>
                                        <button
                                            type="button"
                                            className="cart__close"
                                            aria-label="Close cart"
                                            onClick={() => setMobileCartOpen(false)}
                                        >
                                            <PosIcon name="close" size={20} />
                                        </button>
                                    </div>
                                </div>

                                {showCustomerPicker && (
                                    <div className="cart__customer">
                                        <CustomerSelect
                                            customers={customers}
                                            selectedCustomer={selectedCustomer}
                                            onSelectCustomer={(c) => {
                                                setSelectedCustomer(c);
                                                setAppliedStoreCredit(0);
                                            }}
                                        />
                                    </div>
                                )}

                                {cart.length > 0 ? (
                                    <CartPanel
                                        cart={cart}
                                        storeSettings={storeSettings}
                                        updateQuantity={updateQuantity}
                                        removeFromCart={removeFromCart}
                                    />
                                ) : heldSales.length > 0 ? (
                                    <div className="cart__lines">
                                        <div className="cart__held-head">Held Sales <span>{heldSales.length}</span></div>
                                        {heldSales.map((hc, i) => {
                                            const heldTotal = hc.reduce((a, it) => a + it.price * it.quantity, 0);
                                            const heldUnits = hc.reduce((a, it) => a + it.quantity, 0);
                                            return (
                                                <div className="heldcard" key={i}>
                                                    <div className="heldcard__info">
                                                        <span className="heldcard__title">Held #{i + 1}</span>
                                                        <span className="heldcard__sub tnum">
                                                            {heldUnits} {heldUnits === 1 ? 'item' : 'items'} · {formatCurrency(heldTotal, storeSettings)}
                                                        </span>
                                                    </div>
                                                    <button type="button" className="v2-btn v2-btn--secondary" onClick={() => handleRecallSale(i)}>
                                                        <PosIcon name="restore" size={18} /> Recall
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="cart__lines">
                                        <div className="cart__empty">
                                            <PosIcon name="shopping_cart" size={34} />
                                            <p>Add items to start a sale</p>
                                            <span>Tap any product on the left to add it here.</span>
                                        </div>
                                    </div>
                                )}

                                {cart.length > 0 && (
                                    <CheckoutActions
                                        storeSettings={storeSettings}
                                        total={total}
                                        subtotal={subtotal}
                                        taxAmount={taxAmount}
                                        discount={discount}
                                        setDiscount={setDiscount}
                                        discountType={discountType}
                                        setDiscountType={setDiscountType}
                                        finalAppliedCredit={finalAppliedCredit}
                                        onProcessPayment={() => setCartView('payment')}
                                        onHoldSale={handleHoldSale}
                                        clearCart={clearCart}
                                    />
                                )}
                            </>
                        )}
                    </aside>
                </div>
            )}

            {/* ── Mobile cart bar — opens the cart sheet ── */}
            {posView === 'sell' && cart.length > 0 && !mobileCartOpen && (
                <div className="sale__cartbar">
                    <div className="sale__cartbar-info">
                        <span className="sale__cartbar-count">
                            {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
                        </span>
                        <span className="sale__cartbar-total tnum">{formatCurrency(total, storeSettings)}</span>
                    </div>
                    <button
                        type="button"
                        className="sale__cartbar-btn"
                        onClick={() => setMobileCartOpen(true)}
                    >
                        <PosIcon name="shopping_cart" size={20} fill={1} />
                        View Order
                    </button>
                </div>
            )}

            {/* ── Modals ── */}
            <HeldSalesModal
                isOpen={showHeldPanel}
                onClose={() => setShowHeldPanel(false)}
                heldSales={heldSales}
                onRecallSale={handleRecallSale}
                storeSettings={storeSettings}
            />

            {showReceiptModal && lastSale && (
                <ReceiptModal
                    isOpen={showReceiptModal}
                    onClose={() => setShowReceiptModal(false)}
                    saleData={lastSale}
                    showSnackbar={showSnackbar}
                    storeSettings={storeSettings}
                />
            )}

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

            {/* Verification Loading Overlay */}
            {isVerifyingPayment && (
                <div className="payverify">
                    <div className="payverify__card">
                        <div className="payverify__spinner" />
                        <h3 className="payverify__title">{verifyingMessage}</h3>
                        <p className="payverify__sub">Please wait while we confirm your transaction with the payment gateway.</p>
                        <button type="button" onClick={handleCancelVerification} className="payverify__cancel">
                            Cancel Transaction
                        </button>
                    </div>
                </div>
            )}

            <UnifiedScannerModal
                isOpen={isCamScannerOpen}
                onClose={() => setIsCamScannerOpen(false)}
                onScanSuccess={(code) => {
                    setIsCamScannerOpen(false);
                    handleContinuousScan(code);
                }}
                title="Scan Product"
            />

            <TourGuide
                user={user}
                page="sales"
                run={runTour}
                onTourEnd={() => setRunTour(false)}
            />
        </div>
    );
};

export default SalesPage;
