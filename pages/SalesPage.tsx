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

    const handleManualCodeEntry = () => {
        setIsManualOpen(true);
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
                    id: Date.now().toString(), // Temporary ID
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

    // Mobile-optimized tabbed interface
    const MobileTabBar = () => (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
            <div className="flex">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                >
                    <ShoppingCartIcon className={`w-5 h-5 mx-auto mb-1 ${activeTab === 'products' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-xs">Products</span>
                </button>
                <button
                    onClick={() => setActiveTab('cart')}
                    className={`flex-1 py-3 px-4 text-center font-medium relative ${activeTab === 'cart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                >
                    <div className="relative">
                        <ShoppingCartIcon className={`w-5 h-5 mx-auto mb-1 ${activeTab === 'cart' ? 'text-blue-600' : 'text-slate-400'}`} />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </div>
                    <span className="text-xs">Cart</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-[100dvh] md:h-full md:min-h-0 bg-gray-100 md:rounded-2xl md:overflow-hidden">
            {/* Header - Hidden on mobile when cart is active */}
            <div className={`${activeTab === 'cart' ? 'hidden md:block' : ''}`}>
                <Header
                    title={"Point of Sale"}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    hideSearchOnMobile={true}
                    onSearch={(term) => {
                        const lowerTerm = term.toLowerCase();
                        if (!lowerTerm) return;

                        const matches = products.filter(p => p.status === 'active');
                        const filtered = matches.filter(p =>
                            p.name.toLowerCase().includes(lowerTerm) ||
                            (p.sku && p.sku.toLowerCase().includes(lowerTerm)) ||
                            (p.barcode && p.barcode.toLowerCase().includes(lowerTerm))
                        );

                        if (filtered.length === 1) {
                            const product = filtered[0];
                            const availableStock = typeof (product as any).stock === 'number' ? (product as any).stock : (parseFloat(String((product as any).stock)) || 0);
                            if (availableStock > 0) {
                                addToCart(product);
                                setSearchTerm('');
                            } else {
                                showSnackbar(`"${product.name}" is out of stock.`, 'error');
                            }
                        } else if (filtered.length > 1) {
                            showSnackbar('Multiple products match. Please select one manually.', 'info');
                        } else {
                            showSnackbar('No product found for the scanned code.', 'error');
                        }
                    }}
                    rightContent={
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="hidden md:block px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Scan QR Code"
                            title="Scan QR Code"
                        >
                            <QrCodeIcon className="w-6 h-6" />
                        </button>
                    }
                />
            </div>
            {/* Main Content Area */}
            <div className="flex-grow bg-gray-100 md:rounded-2xl flex flex-col md:flex-row p-4 gap-4 md:overflow-hidden min-w-0 pb-20 md:pb-4">
                {/* Product Selection - Mobile tab */}
                <div className={`${activeTab === 'products' ? 'block' : 'hidden'} md:block flex-grow flex flex-col md:overflow-y-auto min-w-0 min-h-0 h-auto md:h-full`}>
                    {/* Quick Actions Bar for Mobile */}
                    <div className="md:hidden sticky top-0 z-20 flex gap-2 mb-4 p-2 -mx-4 px-4 bg-gray-100 backdrop-blur-2xm shadow-xl border-b border-gray-200 transition-all duration-300">
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 flex items-center justify-center gap-2"
                        >
                            <QrCodeIcon className="w-5 h-5" />
                            Scan
                        </button>
                        <button
                            onClick={handleManualCodeEntry}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Enter Code
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center p-10">Loading...</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3 pr-2 flex-1 min-h-0 content-start">
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
                                        className="relative bg-white border border-slate-200 rounded-lg p-2 text-left flex flex-col items-stretch justify-between transition-all active:scale-[0.98] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
                                    >
                                        <div className="w-full overflow-hidden rounded-md bg-slate-50 aspect-square">
                                            {p.imageUrls?.[0] ? (
                                                <img src={buildAssetUrl(p.imageUrls[0])} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <ShoppingCartIcon className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                                            <div className="mt-1 flex items-center justify-between">
                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                                    {formatCurrency(p.price, storeSettings)}{p.unitOfMeasure === 'kg' ? '/kg' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        {isSoldOut && (
                                            <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex items-center justify-center font-bold text-red-600 rounded-lg text-xs">
                                                SOLD OUT
                                            </div>
                                        )}
                                        {isLowStock && (
                                            <div className="absolute top-1 right-1 bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                                {numericStock} left
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Cart/Till - Mobile tab */}
                <div className={`${activeTab === 'cart' ? 'flex' : 'hidden'} md:flex w-full md:w-[32rem] lg:w-1/2 xl:w-2/5 flex-shrink-0 flex-col min-h-0 h-auto md:h-full md:max-h-full md:overflow-y-auto bg-slate-50 rounded-lg shadow min-w-0`}>
                    {/* Cart Header */}
                    <div className="p-3 border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-slate-800">Cart ({cart.length})</h2>
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-xs text-red-500 hover:underline flex items-center gap-1"
                                    >
                                        <XMarkIcon className="w-4 h-4" /> Clear
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerPanel(s => !s)}
                                    className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-100"
                                >
                                    {showCustomerPanel ? 'Hide Customer' : 'Customer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDensity(d => d === 'compact' ? 'cozy' : 'compact')}
                                    className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-100"
                                >
                                    {density === 'compact' ? 'Cozy' : 'Compact'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Customer Section */}
                    {showCustomerPanel && (
                        <div className="px-3 py-2 border-b border-slate-200">
                            <CustomerSelect
                                customers={customers}
                                selectedCustomer={selectedCustomer}
                                onSelectCustomer={(c) => {
                                    setSelectedCustomer(c);
                                    setAppliedStoreCredit(0);
                                }}
                            />
                            {selectedCustomer && selectedCustomer.storeCredit > 0 && storeSettings.enableStoreCredit && (
                                <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded-md">
                                    <strong>{formatCurrency(selectedCustomer.storeCredit, storeSettings)}</strong> store credit available
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cart Items */}
                    <div className="flex-grow overflow-y-auto min-h-48">
                        {cart.length === 0 ? (
                            <div className="text-center text-slate-500 p-10">
                                <ShoppingCartIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                <div className="font-semibold">Your cart is empty</div>
                                <div className="text-xs mt-1">Add products to get started</div>
                                <button
                                    onClick={() => window.innerWidth < 768 ? setActiveTab('products') : {}}
                                    className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium"
                                >
                                    Browse Products
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className={`sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-3 ${density === 'compact' ? 'py-1' : 'py-2'} grid grid-cols-12 gap-2 text-[11px] text-slate-500 uppercase`}>
                                    <div className="col-span-6">Item</div>
                                    <div className="col-span-3 text-center">Qty</div>
                                    <div className="col-span-2 text-right">Total</div>
                                    <div className="col-span-1 text-right">&nbsp;</div>
                                </div>
                                <div className="divide-y divide-slate-200">
                                    {cart.map(item => (
                                        <div key={item.productId} className={`px-3 ${density === 'compact' ? 'py-1' : 'py-2'} grid grid-cols-12 gap-2 items-center`}>
                                            <div className="col-span-6">
                                                <p className="font-medium text-sm leading-5 truncate" title={item.name}>{item.name}</p>
                                                <p className="text-xs text-gray-600">{formatCurrency(item.price, storeSettings)}</p>
                                            </div>
                                            <div className="col-span-3 flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - getStepFor(item.unitOfMeasure as any))}
                                                    className="w-7 h-7 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-sm flex items-center justify-center"
                                                >
                                                    -
                                                </button>
                                                <span className="min-w-[2rem] text-center font-semibold text-sm">
                                                    {item.quantity}{item.unitOfMeasure === 'kg' ? 'kg' : ''}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + getStepFor(item.unitOfMeasure as any))}
                                                    className="w-7 h-7 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-sm flex items-center justify-center"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="font-semibold text-sm">{formatCurrency(item.price * item.quantity, storeSettings)}</p>
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, 0)}
                                                    className="text-slate-400 hover:text-red-600 p-1"
                                                    title="Remove"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Held Sales */}
                    {heldSales.length > 0 && (
                        <div className="border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setShowHeldPanel(s => !s)}
                                className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-medium text-gray-600 hover:bg-slate-100"
                            >
                                <span>Held Sales ({heldSales.length})</span>
                                <span className="text-slate-500">{showHeldPanel ? '▲' : '▼'}</span>
                            </button>
                            {showHeldPanel && (
                                <div className="px-3 pb-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        {heldSales.map((sale, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleRecallSale(i)}
                                                className="text-xs bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg hover:bg-yellow-200 text-left"
                                            >
                                                <div className="font-medium">Sale #{i + 1}</div>
                                                <div className="text-[10px]">{sale.length} items</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="border-t border-slate-200">
                        {/* Adjustments */}
                        <button
                            type="button"
                            onClick={() => setShowAdjustmentsPanel(s => !s)}
                            className="w-full px-3 py-3 flex items-center justify-between text-left hover:bg-slate-50"
                        >
                            <div className="font-semibold text-slate-800">Order Summary</div>
                            <span className="text-slate-500 text-sm">{showAdjustmentsPanel ? 'Hide' : 'Show'}</span>
                        </button>

                        {showAdjustmentsPanel && (
                            <div className="px-3 pb-3 space-y-3">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Subtotal</span>
                                        <span>{formatCurrency(subtotal, storeSettings)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-sm">Discount</span>
                                        <div className="flex items-center">
                                            <span className="mr-1 text-sm">{storeSettings.currency.symbol}</span>
                                            <input
                                                type="number"
                                                value={discount}
                                                onChange={e => setDiscount(e.target.value)}
                                                className="w-24 p-2 border rounded-lg text-right text-sm"
                                                placeholder="0.00"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    {storeSettings.enableStoreCredit && selectedCustomer && selectedCustomer.storeCredit > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 text-sm">Store Credit</span>
                                            {finalAppliedCredit > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-green-600">-{formatCurrency(finalAppliedCredit, storeSettings)}</span>
                                                    <button
                                                        onClick={handleApplyStoreCredit}
                                                        className="text-xs text-red-500 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleApplyStoreCredit}
                                                    disabled={totalBeforeCredit <= 0}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                                >
                                                    Apply Credit
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="px-3 py-3 bg-blue-50 border-t border-slate-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-lg text-slate-900">
                                        {formatCurrency(total, storeSettings)}
                                    </div>
                                    <div className="text-xs text-slate-500">Total amount due</div>
                                </div>
                                {isCashMethod && changeDue > 0 && (
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-green-700">
                                            Change: {formatCurrency(changeDue, storeSettings)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Method & Cash Input */}
                        <div className="px-3 py-3 space-y-3">
                            <select
                                value={selectedPaymentMethod}
                                onChange={e => setSelectedPaymentMethod(e.target.value)}
                                className="w-full p-3 rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-medium bg-white"
                            >
                                {(storeSettings.paymentMethods || []).map(method => (
                                    <option key={method.id} value={method.name}>{method.name}</option>
                                ))}
                                {(storeSettings.paymentMethods || []).length === 0 && <option>No payment methods</option>}
                            </select>

                            {isCashMethod && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Cash Received
                                    </label>
                                    <div className="flex items-center">
                                        <span className="mr-2 text-lg font-semibold">{storeSettings.currency.symbol}</span>
                                        <input
                                            ref={cashInputRef}
                                            type="number"
                                            inputMode="decimal"
                                            value={cashReceived}
                                            onChange={e => setCashReceived(e.target.value)}
                                            className="flex-1 p-3 border rounded-lg text-right text-lg font-semibold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-3 sticky bottom-0">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleHoldSale}
                                disabled={cart.length === 0}
                                className="w-full flex items-center justify-center p-3 rounded-lg bg-yellow-400 text-yellow-900 font-semibold hover:bg-yellow-500 disabled:bg-yellow-200 disabled:text-yellow-600"
                            >
                                <BackspaceIcon className="w-5 h-5 mr-2" /> Hold
                            </button>
                            <button
                                onClick={() => processTransaction('paid')}
                                disabled={cart.length === 0 || total < 0 || (isCashMethod && cashReceivedNumber < total)}
                                className="w-full flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400"
                            >
                                <span className="mr-2">{payLabel}</span>
                            </button>
                        </div>

                        <button
                            onClick={() => processTransaction('invoice')}
                            disabled={cart.length === 0 || total < 0 || !selectedCustomer}
                            className="w-full flex items-center justify-center p-3 rounded-lg bg-white text-gray-700 font-semibold border border-gray-300 hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-400"
                        >
                            <DocumentPlusIcon className="w-5 h-5 mr-2" />
                            Charge to Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Tab Bar */}
            <MobileTabBar />

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
            {showReceiptModal && lastSale && (
                <ReceiptModal
                    isOpen={showReceiptModal}
                    onClose={() => setShowReceiptModal(false)}
                    saleData={lastSale}
                    showSnackbar={showSnackbar}
                    storeSettings={storeSettings}
                />
            )}
        </div>
    );
};

export default SalesPage;