import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Product, CartItem, Sale, Customer, StoreSettings, Payment } from '../types';
import { SnackbarType } from '../App';
import PlusIcon from '../components/icons/PlusIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import BackspaceIcon from '../components/icons/BackspaceIcon';
import ReceiptModal from '../components/sales/ReceiptModal';
import QrCodeIcon from '../components/icons/QrCodeIcon';
import UnifiedScannerModal from '../components/UnifiedScannerModal';
import ManualCodeModal from '../components/sales/ManualCodeModal';
import CustomerSelect from '../components/sales/CustomerSelect';
import HeldSalesModal from '../components/sales/HeldSalesModal';
import { formatCurrency } from '../utils/currency';
import DocumentPlusIcon from '../components/icons/DocumentPlusIcon';
import { buildAssetUrl } from '@/services/api';
import Header from "@/components/Header.tsx";
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import TagIcon from '../components/icons/TagIcon';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import BoltIcon from '../components/icons/BoltIcon';
import ClockIcon from '../components/icons/ClockIcon';
import ArrowTrendingUpIcon from '../components/icons/ArrowTrendingUpIcon';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import Bars3BottomLeftIcon from '../components/icons/Bars3BottomLeftIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import Bars3Icon from '../components/icons/Bars3Icon';
import logo from '../assets/logo.png';

interface SalesPageProps {
    products: Product[];
    customers: Customer[];
    onProcessSale: (sale: Sale) => Promise<Sale | null>;
    isLoading: boolean;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
    onOpenSidebar?: () => void;
}

const SalesPage: React.FC<SalesPageProps> = ({
    products,
    customers,
    onProcessSale,
    isLoading,
    showSnackbar,
    storeSettings,
    onOpenSidebar
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
    const cashInputRef = useRef<HTMLInputElement | null>(null);

    const [showHeldPanel, setShowHeldPanel] = useState<boolean>(false);
    const [showAdjustmentsPanel, setShowAdjustmentsPanel] = useState<boolean>(true);
    const [density, setDensity] = useState<'cozy' | 'compact'>('cozy');
    const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
    const [isFabVisible, setIsFabVisible] = useState(true);
    const lastScrollY = useRef(0);
    const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
    const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
    const [cartItemBeingEdited, setCartItemBeingEdited] = useState<string | null>(null);

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
            const target = e.target as HTMLElement;
            // Handle both window scroll and element scroll
            const currentScrollY = target === document ? window.scrollY : (target as HTMLElement).scrollTop;

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
        if (methods.length > 0) {
            setSelectedPaymentMethod(methods[0].name);
        }
    }, [storeSettings.paymentMethods]);

    // Reset cash when payment method changes
    useEffect(() => {
        setCashReceived('');
    }, [selectedPaymentMethod]);

    // Close cart panel on mobile when cart is cleared
    useEffect(() => {
        if (cart.length === 0 && window.innerWidth < 768) {
            setActiveTab('products');
        }
    }, [cart.length]);

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

    const handleScanSuccess = (decodedText: string) => {
        const trimmed = decodedText.trim();
        const product = products.find(p =>
            p.status === 'active' &&
            (p.barcode === trimmed || p.sku === trimmed)
        );
        if (product) {
            addToCart(product);
        } else {
            showSnackbar('No product found for scanned code', 'error');
        }
        setIsScannerOpen(false);
    };

    const handleContinuousScan = (decodedText: string) => {
        const trimmed = decodedText.trim();
        const product = products.find(p =>
            p.status === 'active' &&
            (p.barcode === trimmed || p.sku === trimmed)
        );
        if (product) {
            addToCart(product);
        } else {
            showSnackbar('No product found for scanned code', 'error');
        }
    };

    const handleScanError = (error: any) => {
        console.warn(error);
    };

    const handleManualSubmit = (code: string) => {
        handleScanSuccess(code);
        setIsManualOpen(false);
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
    };

    // Floating Action Buttons
    const FloatingActionButtons = () => (
        <div className={`md:hidden fixed z-50 bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl transition-all duration-300 ${isFabVisible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
            <button
                onClick={() => setIsScannerOpen(true)}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-all"
            >
                <QrCodeIcon className="w-6 h-6" />
            </button>
            <button
                onClick={() => setActiveTab(prev => prev === 'products' ? 'cart' : 'products')}
                className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg flex items-center justify-center active:scale-95 transition-all"
            >
                <ShoppingCartIcon className="w-6 h-6" />
                {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                        {cart.length}
                    </span>
                )}
            </button>
            <button
                onClick={() => setIsManualOpen(true)}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-all"
            >
                <Bars3BottomLeftIcon className="w-6 h-6" />
            </button>
            <button
                onClick={() => setShowHeldPanel(true)}
                className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-all"
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <Header
                title="Point of Sale"
                onMenuClick={onOpenSidebar}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                hideSearchOnMobile={true}
            />

            {/* Stats Bar */}
            <div className="px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-sm font-medium text-slate-700">Ready</span>
                        </div>
                        <div className="text-sm text-slate-600">
                            <span className="font-semibold">{products.filter(p => p.status === 'active').length}</span> products available
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowQuickActions(!showQuickActions)}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 flex items-center gap-2 hover:border-blue-300 transition-colors"
                        >
                            <BoltIcon className="w-4 h-4" />
                            Quick Add
                        </button>
                        <button
                            onClick={() => setShowHeldPanel(true)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-sm font-medium rounded-lg border border-amber-200 flex items-center gap-2 hover:border-amber-300 transition-colors relative"
                        >
                            <ClockIcon className="w-4 h-4" />
                            Held Sales
                            {heldSales.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                    {heldSales.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200 flex items-center gap-2 hover:border-emerald-300 transition-colors"
                        >
                            <QrCodeIcon className="w-4 h-4" />
                            Scan
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Panel */}
            {
                showQuickActions && (
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-blue-100">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <BoltIcon className="w-4 h-4 text-blue-600" />
                                    Quick Add Products
                                </h3>
                                <button
                                    onClick={() => setShowQuickActions(false)}
                                    className="text-slate-500 hover:text-slate-700"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {quickActions.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="flex-shrink-0 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-2 group"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center">
                                            <PlusIcon className="w-3 h-3 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                                                {product.name}
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                {formatCurrency(product.price, storeSettings)}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Products */}
                    <div className="lg:col-span-2">
                        {/* Products Grid */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Products Header */}
                            <div className="p-4 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center">
                                            <h2 className="text-lg font-bold text-slate-900 hidden md:block">Products</h2>
                                            <img src={logo} alt="SalePilot" className="h-8 md:hidden" />
                                        </div>
                                        <p className="text-sm text-slate-600">Tap to add items to cart</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search products..."
                                                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setDensity(d => d === 'cozy' ? 'compact' : 'cozy')}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Toggle density"
                                        >
                                            <Bars3BottomLeftIcon className="w-5 h-5 text-slate-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Products Grid */}
                            {isLoading ? (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-600">Loading products...</p>
                                </div>
                            ) : (
                                <div className="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredProducts.map(product => {
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
                                                    className={`group relative bg-white rounded-xl border ${cartItem ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'} transition-all duration-200 overflow-hidden`}
                                                >
                                                    {/* Product Image */}
                                                    <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden relative">
                                                        {product.imageUrls?.[0] ? (
                                                            <img
                                                                src={buildAssetUrl(product.imageUrls[0])}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ShoppingCartIcon className="w-12 h-12 text-slate-300" />
                                                            </div>
                                                        )}
                                                        {/* Stock Indicator */}
                                                        <div className="absolute top-3 right-3">
                                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${isSoldOut
                                                                ? 'bg-red-100 text-red-700'
                                                                : isLowStock
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-emerald-100 text-emerald-700'
                                                                }`}>
                                                                {isSoldOut ? 'Sold Out' : `${numericStock} in stock`}
                                                            </div>
                                                        </div>
                                                        {/* Add to Cart Overlay */}
                                                        <button
                                                            onClick={() => addToCart(product)}
                                                            disabled={isSoldOut}
                                                            className={`absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors duration-200 ${isSoldOut ? 'cursor-not-allowed' : ''}`}
                                                        >
                                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transform transition-all duration-200 ${cartItem
                                                                ? 'bg-blue-600 scale-100'
                                                                : 'bg-white/90 scale-0 group-hover:scale-100'}`}>
                                                                {cartItem ? (
                                                                    <span className="text-white font-bold text-sm">{cartItem.quantity}</span>
                                                                ) : (
                                                                    <PlusIcon className={`w-5 h-5 ${isSoldOut ? 'text-slate-400' : 'text-blue-600'}`} />
                                                                )}
                                                            </div>
                                                        </button>
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="p-4">
                                                        <div className="mb-2">
                                                            <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 h-10">
                                                                {product.name}
                                                            </h3>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {product.sku || 'No SKU'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="text-lg font-bold text-slate-900">
                                                                    {formatCurrency(product.price, storeSettings)}
                                                                </div>
                                                                {product.unitOfMeasure === 'kg' && (
                                                                    <div className="text-xs text-slate-500">per kg</div>
                                                                )}
                                                            </div>
                                                            {cartItem && (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateQuantity(product.id, cartItem.quantity - getStepFor(product.unitOfMeasure));
                                                                        }}
                                                                        className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center"
                                                                    >
                                                                        <span className="font-bold text-slate-700">-</span>
                                                                    </button>
                                                                    <span className="text-sm font-semibold text-slate-900">
                                                                        {cartItem.quantity}
                                                                        {product.unitOfMeasure === 'kg' && 'kg'}
                                                                    </span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateQuantity(product.id, cartItem.quantity + getStepFor(product.unitOfMeasure));
                                                                        }}
                                                                        className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center"
                                                                    >
                                                                        <span className="font-bold text-slate-700">+</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
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
                    </div>

                    {/* Right Column - Cart & Checkout */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 space-y-6">
                            {/* Cart Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                {/* Cart Header */}
                                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                                <ShoppingCartIcon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-lg text-slate-900">Shopping Cart</h2>
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
                                <div className="max-h-[300px] overflow-y-auto">
                                    {cart.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <ShoppingCartIcon className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-slate-700 font-medium mb-2">Your cart is empty</p>
                                            <p className="text-sm text-slate-500">Add products to get started</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {cart.map(item => (
                                                <div key={item.productId} className="p-4 hover:bg-slate-50/50 transition-colors group">
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
                                    )}
                                </div>

                                {/* Cart Summary */}
                                {cart.length > 0 && (
                                    <>
                                        {/* Customer Selection */}
                                        <div className="p-4 border-t border-slate-100">
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-slate-900 mb-2">
                                                    Customer
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
                                                <div className="p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-emerald-900">Store Credit</p>
                                                            <p className="text-xs text-emerald-700">
                                                                Available: {formatCurrency(selectedCustomer.storeCredit, storeSettings)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={handleApplyStoreCredit}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${finalAppliedCredit > 0
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                                }`}
                                                        >
                                                            {finalAppliedCredit > 0 ? 'Remove' : 'Apply'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Order Summary */}
                                        <div className="p-4 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-600">Subtotal</span>
                                                    <span className="font-medium text-slate-900">{formatCurrency(subtotal, storeSettings)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-600">Discount</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">{storeSettings.currency.symbol}</span>
                                                        <input
                                                            type="number"
                                                            value={discount}
                                                            onChange={(e) => setDiscount(e.target.value)}
                                                            className="w-24 px-2 py-1 border border-slate-300 rounded-lg text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="0.00"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                                {finalAppliedCredit > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-600">Store Credit</span>
                                                        <span className="font-medium text-emerald-700">-{formatCurrency(finalAppliedCredit, storeSettings)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-600">Tax ({storeSettings.taxRate}%)</span>
                                                    <span className="font-medium text-slate-900">{formatCurrency(taxAmount, storeSettings)}</span>
                                                </div>
                                                <div className="pt-3 border-t border-slate-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-base font-semibold text-slate-900">Total</span>
                                                        <span className="text-2xl font-bold text-slate-900">{formatCurrency(total, storeSettings)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Section */}
                                        <div className="p-4 border-t border-slate-100 bg-white">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                                        Payment Method
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            value={selectedPaymentMethod}
                                                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                            className="w-full p-3 pl-10 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                                        >
                                                            {(storeSettings.paymentMethods || []).map(method => (
                                                                <option key={method.id} value={method.name}>
                                                                    {method.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    </div>
                                                </div>
                                                {isCashMethod && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-900 mb-2">
                                                            Cash Received
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-slate-900">
                                                                {storeSettings.currency.symbol}
                                                            </span>
                                                            <input
                                                                ref={cashInputRef}
                                                                type="number"
                                                                value={cashReceived}
                                                                onChange={(e) => setCashReceived(e.target.value)}
                                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        {changeDue > 0 && (
                                                            <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium text-emerald-900">Change Due</span>
                                                                    <span className="text-lg font-bold text-emerald-700">
                                                                        {formatCurrency(changeDue, storeSettings)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="p-4 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={handleHoldSale}
                                                    disabled={cart.length === 0}
                                                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                                                >
                                                    <ClockIcon className="w-5 h-5" />
                                                    Hold Sale
                                                </button>
                                                <button
                                                    onClick={() => processTransaction('paid')}
                                                    disabled={cart.length === 0 || total < 0 || (isCashMethod && cashReceivedNumber < total)}
                                                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                                                >
                                                    <CreditCardIcon className="w-5 h-5" />
                                                    Complete Sale
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => processTransaction('invoice')}
                                                disabled={cart.length === 0 || total < 0 || !selectedCustomer}
                                                className="w-full py-3 px-4 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-900 font-semibold rounded-lg border-2 border-slate-300 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                                            >
                                                <DocumentPlusIcon className="w-5 h-5" />
                                                Charge to Account
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
                <div className="flex items-center px-4 py-2">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                    >
                        <ShoppingCartIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs font-medium">Products</span>
                    </button>
                    <div className="relative mx-2">
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="w-16 h-16 -mt-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center"
                        >
                            <QrCodeIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all ${activeTab === 'cart' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                    >
                        <div className="relative">
                            <ShoppingCartIcon className="w-6 h-6 mb-1" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-medium">Cart</span>
                    </button>
                </div>
            </div>

            {/* Mobile Product View */}
            <div className={`md:hidden fixed inset-0 bg-white z-50 transition-transform duration-300 ${activeTab === 'products' ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Mobile Products Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 z-10 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {onOpenSidebar && (
                                <button
                                    onClick={onOpenSidebar}
                                    className="p-2 -ml-2 rounded-md text-slate-700 hover:bg-slate-50 focus:outline-none"
                                >
                                    <Bars3Icon className="w-6 h-6" />
                                </button>
                            )}

                            {/* Desktop: Show Products title */}
                            <h2 className="text-lg font-bold text-slate-900 hidden md:block">Products</h2>
                        </div>

                        {/* Mobile: Center the logo */}
                        <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
                            <img src={logo} alt="SalePilot" className="h-8" />
                        </div>

                        {/* Cart button always on the right */}
                        <button
                            onClick={() => setActiveTab('cart')}
                            className="relative p-2"
                        >
                            <ShoppingCartIcon className="w-6 h-6 text-slate-700" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                {/* Mobile Products Grid */}
                <div className="p-4 overflow-y-auto h-[calc(100vh-140px)]">
                    <div className="grid grid-cols-2 gap-3">
                        {filteredProducts.slice(0, 20).map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white rounded-xl border border-slate-200 p-3 text-left"
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

            {/* Mobile Cart View */}
            <div className={`md:hidden fixed inset-0 bg-white z-50 transition-transform duration-300 ${activeTab === 'cart' ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Mobile Cart Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 z-10 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setActiveTab('products')}
                            className="p-2"
                        >
                            <ChevronLeftIcon className="w-6 h-6 text-slate-700" />
                        </button>
                        <h2 className="text-xl font-bold text-slate-900">Cart ({cart.length})</h2>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-sm font-medium text-red-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
                {/* Mobile Cart Content */}
                <div className="p-4 overflow-y-auto h-[calc(100vh-140px)] safe-area-bottom pb-24">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                <ShoppingCartIcon className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">Your cart is empty</h3>
                            <p className="text-sm text-slate-500 mb-6">Add products to start a sale</p>
                            <button
                                onClick={() => setActiveTab('products')}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
                            >
                                Browse Products
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Items List */}
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.productId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{item.name}</h4>
                                                <p className="text-sm text-slate-500">{formatCurrency(item.price, storeSettings)} each</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity, storeSettings)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - getStepFor(item.unitOfMeasure))}
                                                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50"
                                                >
                                                    -
                                                </button>
                                                <span className="font-semibold w-12 text-center">
                                                    {item.quantity}
                                                    {item.unitOfMeasure === 'kg' && 'kg'}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + getStepFor(item.unitOfMeasure))}
                                                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.productId)}
                                                className="text-red-500 p-2"
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

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
                                    <select
                                        value={selectedPaymentMethod}
                                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                    >
                                        {(storeSettings.paymentMethods || []).map(method => (
                                            <option key={method.id} value={method.name}>{method.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {isCashMethod && (
                                    <div className="pt-2">
                                        <label className="block text-sm font-medium text-slate-900 mb-2">Cash Received</label>
                                        <input
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
                                        className="py-3 bg-orange-100 text-orange-700 rounded-lg font-medium"
                                    >
                                        Hold
                                    </button>
                                    <button
                                        onClick={() => processTransaction('paid')}
                                        disabled={total < 0 || (isCashMethod && cashReceivedNumber < total)}
                                        className="py-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50"
                                    >
                                        Pay {formatCurrency(total, storeSettings)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <FloatingActionButtons />
            <UnifiedScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleContinuousScan}
                onScanError={handleScanError}
                continuous={true}
                title="Scan Products"
            />
            <ManualCodeModal
                isOpen={isManualOpen}
                onClose={() => setIsManualOpen(false)}
                onSubmit={handleManualSubmit}
            />
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
        </div >
    );
};

export default SalesPage;