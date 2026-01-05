import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Product, CartItem, Sale, Customer, StoreSettings, Payment } from '../types';
import { SnackbarType } from '../App';
import PlusIcon from '../components/icons/PlusIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import BackspaceIcon from '../components/icons/BackspaceIcon';
import ReceiptModal from '../components/sales/ReceiptModal';
import QrCodeIcon from '../components/icons/QrCodeIcon';
import QrScannerModal from '../components/sales/QrScannerModal';
import ManualCodeModal from '../components/sales/ManualCodeModal';
import CustomerSelect from '../components/sales/CustomerSelect';
import { formatCurrency } from '../utils/currency';
import DocumentPlusIcon from '../components/icons/DocumentPlusIcon';
import { buildAssetUrl } from '@/services/api';
import Header from "@/components/Header.tsx";
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import TagIcon from '../components/icons/TagIcon';
import UserCircleIcon from '../components/icons/UserCircleIcon';

/**
 * Sales properties
 */
interface SalesPageProps {
    products: Product[];
    customers: Customer[];
    onProcessSale: (sale: Sale) => Promise<Sale | null>;
    isLoading: boolean;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
}

const SalesPage: React.FC<SalesPageProps> = ({ products, customers, onProcessSale, isLoading, showSnackbar, storeSettings }) => {
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
    const [showCustomerPanel, setShowCustomerPanel] = useState<boolean>(false);
    const [showHeldPanel, setShowHeldPanel] = useState<boolean>(false);
    const [showAdjustmentsPanel, setShowAdjustmentsPanel] = useState<boolean>(false);
    const [density, setDensity] = useState<'cozy' | 'compact'>('cozy');
    const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
    const [mobileCartOpen, setMobileCartOpen] = useState<boolean>(false);
    const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
    const [isFabVisible, setIsFabVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Scroll to hide logic
    useEffect(() => {
        const handleScroll = () => {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) return;

            const currentScrollY = mainContent.scrollTop;
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
        } else {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            if (mainContent) {
                mainContent.removeEventListener('scroll', handleScroll);
            } else {
                window.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    /**
     * Set payment method
     */
    useEffect(() => {
        const methods = storeSettings.paymentMethods || [];
        if (methods.length > 0) {
            setSelectedPaymentMethod(methods[0].name);
        } else {
            setSelectedPaymentMethod('');
        }
    }, [storeSettings.paymentMethods]);

    /**
     * Reset cash when payment method changes
     */
    useEffect(() => {
        setCashReceived('');
    }, [selectedPaymentMethod]);

    // Close cart panel on mobile when cart is cleared
    useEffect(() => {
        if (cart.length === 0) {
            setMobileCartOpen(false);
            if (window.innerWidth < 768) {
                setActiveTab('products');
            }
        }
    }, [cart.length]);

    const taxRate = storeSettings.taxRate / 100;

    // Scroll to top when tab changes on mobile to avoid disorientation
    useEffect(() => {
        if (window.innerWidth < 768) {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
    }, [activeTab]);

    const roundQty = (q: number) => Math.round(q * 1000) / 1000;
    const getStepFor = (uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1);

    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.productId === product.id);
        const step = getStepFor(product.unitOfMeasure);
        const stockInCart = existingItem ? existingItem.quantity : 0;
        const availableStock = typeof (product as any).stock === 'number' ? (product as any).stock : (parseFloat(String((product as any).stock)) || 0);

        if (stockInCart + step <= availableStock + 1e-9) {
            if (existingItem) {
                const newQty = Math.min(availableStock, roundQty(existingItem.quantity + step));
                setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: newQty } : item));
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
            }
            showSnackbar(`Added "${product.name}" to cart.`, 'success');
        } else {
            showSnackbar(`You've added all available stock for "${product.name}".`, 'error');
        }
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        setCart(currentCart => {
            const itemToUpdate = currentCart.find(item => item.productId === productId);
            if (!itemToUpdate) return currentCart;

            const clamped = Math.max(0, Math.min(itemToUpdate.stock, roundQty(newQuantity)));
            if (clamped <= 0) {
                return currentCart.filter(item => item.productId !== productId);
            }
            if (clamped <= itemToUpdate.stock + 1e-9) {
                return currentCart.map(item => item.productId === productId ? { ...item, quantity: clamped } : item);
            } else {
                showSnackbar(`Quantity for "${itemToUpdate.name}" cannot exceed available stock of ${itemToUpdate.stock}.`, 'error');
                return currentCart;
            }
        });
    };

    const setQuantityFromPrice = (productId: string) => {
        const item = cart.find(i => i.productId === productId);
        if (!item) return;
        if (item.unitOfMeasure !== 'kg') {
            showSnackbar('This shortcut is only available for items sold per kg.', 'info');
            return;
        }
        const pricePerKg = item.price;
        if (!pricePerKg || pricePerKg <= 0) {
            showSnackbar('Invalid price per kg configured for this product.', 'error');
            return;
        }
        const currencySymbol = storeSettings?.currency?.symbol || '';
        const input = window.prompt(`Enter amount ${currencySymbol ? `in ${currencySymbol}` : ''} to sell for "${item.name}":`, '');
        if (input === null) return;
        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0) {
            showSnackbar('Please enter a valid positive amount.', 'error');
            return;
        }
        let qty = amount / pricePerKg;
        qty = roundQty(qty);
        qty = Math.max(0, Math.min(item.stock, qty));
        if (qty <= 0) {
            showSnackbar('Entered amount is too low to sell any quantity.', 'error');
            return;
        }
        updateQuantity(productId, qty);
        showSnackbar(`Set ${item.name} to ${qty} kg based on amount ${currencySymbol}${amount.toFixed(2)}.`, 'success');
    };

    const clearCart = useCallback(() => {
        setCart([]);
        setDiscount('0');
        setSelectedCustomer(null);
        setAppliedStoreCredit(0);
        setCashReceived('');
        if (window.innerWidth < 768) {
            setActiveTab('products');
        }
    }, []);

    const handleHoldSale = () => {
        if (cart.length === 0) return;
        setHeldSales([...heldSales, cart]);
        clearCart();
        showSnackbar('Sale has been put on hold.', 'info');
    };

    const handleRecallSale = (index: number) => {
        if (cart.length > 0) {
            showSnackbar("Please hold or complete the current sale before recalling another.", 'error');
            return;
        }
        setCart(heldSales[index]);
        setHeldSales(heldSales.filter((_, i) => i !== index));
        showSnackbar(`Sale #${index + 1} recalled.`, 'info');
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
        const ok = addProductByCode(decodedText);
        if (!ok) {
            showSnackbar('Product not found for the scanned QR code.', 'error');
        }
        setIsScannerOpen(false);
    };

    const handleScanError = (errorMessage: string) => {
        console.error(errorMessage);
        showSnackbar('QR Scan failed. Please ensure you have granted camera permissions.', 'error');
        setIsScannerOpen(false);
    };

    const addProductByCode = (code: string) => {
        const trimmed = (code || '').trim();
        if (!trimmed) return false;
        const product = products.find(p =>
            p.status === 'active' &&
            (p.barcode === trimmed || p.sku === trimmed)
        );
        if (product) {
            addToCart(product);
            return true;
        } else {
            showSnackbar('No product found for that code.', 'error');
            return false;
        }
    };

    const handleManualSubmit = (code: string) => {
        const ok = addProductByCode(code);
        if (ok) {
            setIsManualOpen(false);
        }
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

    const isCashMethod = useMemo(() => (selectedPaymentMethod || '').toLowerCase().includes('cash'), [selectedPaymentMethod]);
    const cashReceivedNumber = useMemo(() => parseFloat(cashReceived || '0') || 0, [cashReceived]);
    const changeDue = useMemo(() => Math.max(0, cashReceivedNumber - total), [cashReceivedNumber, total]);

    const payLabel = useMemo(() => selectedPaymentMethod ? `Pay ${selectedPaymentMethod}` : 'Pay', [selectedPaymentMethod]);

    useEffect(() => {
        if (isCashMethod && total > 0) {
            setTimeout(() => cashInputRef.current?.focus(), 0);
        }
    }, [isCashMethod, total]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTyping = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true');

            if (!e.ctrlKey) return;

            if (e.key === 'Enter') {
                if (cart.length > 0 && total >= 0 && (!isCashMethod || cashReceivedNumber >= total)) {
                    e.preventDefault();
                    processTransaction('paid');
                }
                return;
            }
            const key = e.key.toLowerCase();
            if (key === 'h') {
                if (cart.length > 0) {
                    e.preventDefault();
                    handleHoldSale();
                }
                return;
            }
            if (key === 'i') {
                if (cart.length > 0 && total >= 0 && selectedCustomer) {
                    e.preventDefault();
                    processTransaction('invoice');
                }
                return;
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [cart.length, total, isCashMethod, cashReceivedNumber, selectedCustomer]);

    const handleApplyStoreCredit = () => {
        if (finalAppliedCredit > 0) {
            setAppliedStoreCredit(0);
        } else {
            const customerCredit = selectedCustomer?.storeCredit || 0;
            const creditToApply = Math.min(totalBeforeCredit, customerCredit);
            setAppliedStoreCredit(creditToApply);
        }
    };

    const processTransaction = async (type: 'paid' | 'invoice') => {
        if (cart.length === 0) return;

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
                showSnackbar(`Invoice ${newSale.transactionId} created for ${selectedCustomer?.name}.`, 'success');
            } else {
                setLastSale(newSale);
                setShowReceiptModal(true);
            }
            clearCart();
        }
    }

    // Floating Action Buttons - Premium Design
    const FloatingActionButtons = () => (
        <div
            className={`md:hidden fixed z-50 bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isFabVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[200%] opacity-0 scale-95'}`}
        >
            {/* Products Button */}
            <button
                onClick={() => setActiveTab('products')}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 hover:scale-105 group ${activeTab === 'products'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
            >
                <ShoppingCartIcon className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'products' ? 'scale-110' : ''}`} />
                {activeTab === 'products' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                )}
            </button>

            {/* Scan Button */}
            <button
                onClick={() => setIsScannerOpen(true)}
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 active:scale-95 hover:scale-105"
            >
                <QrCodeIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            </button>

            {/* Cart Button */}
            <button
                onClick={() => setActiveTab('cart')}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 hover:scale-105 group ${activeTab === 'cart'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
            >
                <ShoppingCartIcon className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'cart' ? 'scale-110' : ''}`} />
                {cart.length > 0 && (
                    <span className={`absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-900 shadow-lg transition-all duration-300 ${activeTab === 'cart' ? 'scale-125' : ''}`}>
                        {cart.length}
                    </span>
                )}
                {activeTab === 'cart' && cart.length === 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                )}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col min-h-[100dvh] md:h-full md:min-h-0 bg-gradient-to-b from-slate-50 to-white md:rounded-2xl md:overflow-hidden">
            <Header
                title="POS / Sales"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                hideSearchOnMobile={true}
            />
            {/* Mobile Tab Navigation */}
            {/* Mobile Tab Navigation */}
            <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/50">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => activeTab === 'cart' ? setActiveTab('products') : null}
                        className={`transition-opacity duration-200 ${activeTab === 'products' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-slate-700" />
                    </button>

                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'products'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => setActiveTab('cart')}
                            className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'cart'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Cart
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setIsManualOpen(true)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all duration-200"
                        >
                            Code
                        </button>
                    </div>

                    <div className="w-6"></div> {/* Spacer for balance */}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow bg-gradient-to-b from-slate-50 to-white md:rounded-2xl flex flex-col md:flex-row p-2 md:p-4 gap-4 md:overflow-hidden min-w-0 md:pt-4 pb-24 md:pb-4">
                {/* Product Selection */}
                <div className={`${activeTab === 'products' ? 'block' : 'hidden'} md:block flex-grow flex flex-col md:overflow-y-auto min-w-0 min-h-0 h-auto md:h-full`}>
                    {/* Search Bar for Mobile - Removed as Header handles it now */}

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center p-10">
                                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <div className="text-slate-600">Loading products...</div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 px-2 flex-1 min-h-0 content-start">
                            {filteredProducts.map(p => {
                                const numericStock = typeof (p as any).stock === 'number' ? (p as any).stock : (parseFloat(String((p as any).stock)) || 0);
                                const isSoldOut = numericStock === 0;
                                const lowStockThreshold = p.reorderPoint || storeSettings.lowStockThreshold;
                                const isLowStock = numericStock > 0 && numericStock <= lowStockThreshold;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        disabled={isSoldOut}
                                        className="group relative bg-white border border-slate-200 rounded-2xl p-3 text-left flex flex-col items-stretch justify-between transition-all duration-300 active:scale-[0.98] hover:shadow-xl hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50 overflow-hidden"
                                    >
                                        {/* Background glow effect */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        {/* Image Container */}
                                        <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-white aspect-square mb-3">
                                            {p.imageUrls?.[0] ? (
                                                <img
                                                    src={buildAssetUrl(p.imageUrls[0])}
                                                    alt={p.name}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <ShoppingCartIcon className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" />
                                                </div>
                                            )}
                                            {/* Overlay gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>

                                        {/* Product Info */}
                                        <div className="relative">
                                            <p className="text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2.8rem] leading-tight mb-2">{p.name}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700 border border-blue-200">
                                                    {formatCurrency(p.price, storeSettings)}
                                                    {p.unitOfMeasure === 'kg' && <span className="text-xs ml-1 font-normal">/kg</span>}
                                                </span>
                                                {!isSoldOut && numericStock > 0 && (
                                                    <span className="text-xs text-slate-500">
                                                        {numericStock} in stock
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sold Out Overlay */}
                                        {isSoldOut && (
                                            <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
                                                <div className="text-center">
                                                    <div className="font-bold text-red-600 text-sm mb-1">SOLD OUT</div>
                                                    <div className="text-xs text-slate-500">Check back later</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Low Stock Badge */}
                                        {isLowStock && !isSoldOut && (
                                            <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                                {numericStock} left
                                            </div>
                                        )}

                                        {/* Add to Cart Badge */}
                                        <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                                            <PlusIcon className="w-4 h-4 text-white" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Cart/Till Panel */}
                <div className={`${activeTab === 'cart' ? 'flex' : 'hidden'} md:flex w-full md:w-[32rem] lg:w-1/2 xl:w-2/5 flex-shrink-0 flex-col min-h-0 h-auto md:h-full md:max-h-full md:overflow-y-auto bg-gradient-to-b from-white to-slate-50 rounded-2xl shadow-xl min-w-0 border border-slate-200/50`}>
                    {/* Cart Header */}
                    <div className="p-4 border-b border-slate-200/50 sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                        <ShoppingCartIcon className="w-5 h-5 text-white" />
                                    </div>
                                    {cart.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-lg">
                                            {cart.length}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-slate-900">Shopping Cart</h2>
                                    <p className="text-xs text-slate-500">{cart.length} items • {formatCurrency(subtotal, storeSettings)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="px-3 py-1.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 text-sm font-semibold rounded-lg hover:from-red-100 hover:to-red-200 transition-all duration-200 active:scale-95 border border-red-200"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Customer Selection */}
                    {!showCustomerPanel && selectedCustomer && (
                        <div className="px-4 py-3 border-b border-slate-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UserCircleIcon className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{selectedCustomer.name}</p>
                                        <p className="text-xs text-slate-600">{selectedCustomer.email || selectedCustomer.phone}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Customer Panel Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowCustomerPanel(s => !s)}
                        className="px-4 py-3 border-b border-slate-200/50 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <UserCircleIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-semibold text-slate-900">
                                    {selectedCustomer ? 'Change Customer' : 'Select Customer'}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {selectedCustomer ? selectedCustomer.name : 'Add customer details'}
                                </div>
                            </div>
                        </div>
                        <div className={`transition-transform duration-200 ${showCustomerPanel ? 'rotate-180' : ''}`}>
                            <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
                        </div>
                    </button>

                    {/* Customer Selection */}
                    {showCustomerPanel && (
                        <div className="px-4 py-3 border-b border-slate-200/50 bg-gradient-to-b from-white to-slate-50/50">
                            <CustomerSelect
                                customers={customers}
                                selectedCustomer={selectedCustomer}
                                onSelectCustomer={(c) => {
                                    setSelectedCustomer(c);
                                    setAppliedStoreCredit(0);
                                    setShowCustomerPanel(false);
                                }}
                            />
                            {selectedCustomer && selectedCustomer.storeCredit > 0 && storeSettings.enableStoreCredit && (
                                <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-emerald-900">Store Credit Available</div>
                                            <div className="text-lg font-bold text-emerald-700">{formatCurrency(selectedCustomer.storeCredit, storeSettings)}</div>
                                        </div>
                                        <button
                                            onClick={handleApplyStoreCredit}
                                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${finalAppliedCredit > 0
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                        >
                                            {finalAppliedCredit > 0 ? 'Remove' : 'Apply'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cart Items */}
                    <div className="flex-grow overflow-y-auto min-h-48">
                        {cart.length === 0 ? (
                            <div className="text-center text-slate-500 p-10">
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <ShoppingCartIcon className="w-10 h-10 text-slate-400" />
                                </div>
                                <div className="font-bold text-lg text-slate-700 mb-2">Your cart is empty</div>
                                <div className="text-sm text-slate-500 mb-6">Add products to get started</div>
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 active:scale-95"
                                >
                                    Browse Products
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200/50">
                                {cart.map(item => (
                                    <div key={item.productId} className="group px-4 py-3 hover:bg-slate-50/50 transition-colors duration-200">
                                        <div className="flex items-start gap-3">
                                            {/* Item Image/Icon */}
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200">
                                                <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-900 truncate">{item.name}</p>
                                                        <p className="text-xs text-slate-600 mt-1">{formatCurrency(item.price, storeSettings)} each</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm text-slate-900">{formatCurrency(item.price * item.quantity, storeSettings)}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{item.quantity}{item.unitOfMeasure === 'kg' ? 'kg' : ''}</p>
                                                    </div>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity - getStepFor(item.unitOfMeasure as any))}
                                                            className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm flex items-center justify-center font-bold text-slate-700 hover:text-slate-900 transition-all duration-200 active:scale-95"
                                                        >
                                                            -
                                                        </button>
                                                        <div className="w-12 text-center">
                                                            <span className="font-bold text-slate-900">{item.quantity}</span>
                                                            {item.unitOfMeasure === 'kg' && <span className="text-xs text-slate-500 ml-1">kg</span>}
                                                        </div>
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity + getStepFor(item.unitOfMeasure as any))}
                                                            className="w-8 h-8 rounded-lg border border-slate-300 bg-gradient-to-b from-white to-slate-50 hover:from-blue-50 hover:to-blue-100 text-sm flex items-center justify-center font-bold text-slate-700 hover:text-blue-700 transition-all duration-200 active:scale-95"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => updateQuantity(item.productId, 0)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200 group-hover:opacity-100 opacity-0"
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

                    {/* Order Summary */}
                    <div className="border-t border-slate-200/50 bg-gradient-to-b from-white to-slate-50">
                        {/* Summary Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowAdjustmentsPanel(s => !s)}
                            className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                    <TagIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">Order Summary</div>
                                    <div className="text-sm text-slate-500">View pricing details</div>
                                </div>
                            </div>
                            <div className={`transition-transform duration-300 ${showAdjustmentsPanel ? 'rotate-180' : ''}`}>
                                <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
                            </div>
                        </button>

                        {/* Summary Details */}
                        {showAdjustmentsPanel && (
                            <div className="px-4 pb-4 space-y-4">
                                {/* Subtotal */}
                                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
                                    <span className="text-sm text-slate-600">Subtotal</span>
                                    <span className="font-semibold text-slate-900">{formatCurrency(subtotal, storeSettings)}</span>
                                </div>

                                {/* Discount */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Discount</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900">{storeSettings.currency.symbol}</span>
                                            <input
                                                type="number"
                                                value={discount}
                                                onChange={e => setDiscount(e.target.value)}
                                                className="w-28 p-2 border border-slate-300 rounded-xl text-right text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                                                placeholder="0.00"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Store Credit */}
                                    {storeSettings.enableStoreCredit && selectedCustomer && selectedCustomer.storeCredit > 0 && (
                                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-semibold text-emerald-900">Store Credit</div>
                                                    <div className="text-xs text-emerald-700">Available: {formatCurrency(selectedCustomer.storeCredit, storeSettings)}</div>
                                                </div>
                                                {finalAppliedCredit > 0 ? (
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-emerald-700">-{formatCurrency(finalAppliedCredit, storeSettings)}</div>
                                                        <button
                                                            onClick={handleApplyStoreCredit}
                                                            className="text-xs text-red-600 hover:text-red-800 font-medium mt-1"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={handleApplyStoreCredit}
                                                        disabled={totalBeforeCredit <= 0}
                                                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        Apply
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Total Amount */}
                        <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-slate-200/50">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <div className="text-sm text-slate-600">Total Amount</div>
                                    <div className="font-bold text-2xl text-slate-900">{formatCurrency(total, storeSettings)}</div>
                                </div>
                                {isCashMethod && changeDue > 0 && (
                                    <div className="text-right">
                                        <div className="text-sm text-slate-600">Change Due</div>
                                        <div className="font-bold text-lg text-emerald-700">{formatCurrency(changeDue, storeSettings)}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Section */}
                        <div className="p-4 space-y-4 border-t border-slate-200/50">
                            {/* Payment Method */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-900">Payment Method</label>
                                <div className="relative">
                                    <select
                                        value={selectedPaymentMethod}
                                        onChange={e => setSelectedPaymentMethod(e.target.value)}
                                        className="w-full p-3 pl-11 rounded-xl border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm font-semibold appearance-none"
                                    >
                                        {(storeSettings.paymentMethods || []).map(method => (
                                            <option key={method.id} value={method.name}>{method.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                                        <CreditCardIcon className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronLeftIcon className="w-5 h-5 text-slate-400 -rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Cash Received */}
                            {isCashMethod && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-900">
                                        Cash Received
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-900">{storeSettings.currency.symbol}</span>
                                        <input
                                            ref={cashInputRef}
                                            type="number"
                                            inputMode="decimal"
                                            value={cashReceived}
                                            onChange={e => setCashReceived(e.target.value)}
                                            className="w-full pl-12 pr-4 p-3 border border-slate-300 rounded-xl text-right text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200/50 space-y-3 sticky bottom-0 rounded-b-2xl">
                        {/* Hold & Pay Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleHoldSale}
                                disabled={cart.length === 0}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-600 hover:to-orange-600 disabled:from-amber-300 disabled:to-orange-300 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-lg shadow-amber-500/25"
                            >
                                <BackspaceIcon className="w-5 h-5" />
                                Hold
                            </button>
                            <button
                                onClick={() => processTransaction('paid')}
                                disabled={cart.length === 0 || total < 0 || (isCashMethod && cashReceivedNumber < total)}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-lg shadow-blue-600/25"
                            >
                                <CreditCardIcon className="w-5 h-5" />
                                {payLabel}
                            </button>
                        </div>

                        {/* Charge to Account Button */}
                        <button
                            onClick={() => processTransaction('invoice')}
                            disabled={cart.length === 0 || total < 0 || !selectedCustomer}
                            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-white to-slate-50 text-slate-900 font-bold border-2 border-slate-200 hover:border-blue-300 hover:from-blue-50 hover:to-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
                        >
                            <DocumentPlusIcon className="w-5 h-5" />
                            Charge to Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Action Buttons */}
            <FloatingActionButtons />

            {/* Modals */}
            <QrScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
            />
            <ManualCodeModal
                isOpen={isManualOpen}
                onClose={() => setIsManualOpen(false)}
                onSubmit={handleManualSubmit}
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
        </div>
    );
};

export default SalesPage;