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
    // Collapsible sections to declutter Till and give more space to the cart list
    const [showCustomerPanel, setShowCustomerPanel] = useState<boolean>(false);
    const [showHeldPanel, setShowHeldPanel] = useState<boolean>(false);
    const [showAdjustmentsPanel, setShowAdjustmentsPanel] = useState<boolean>(false);
    const [density, setDensity] = useState<'cozy' | 'compact'>('cozy');
    const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
    // Mobile: control cart visibility on small screens
    const [mobileCartOpen, setMobileCartOpen] = useState<boolean>(false);
    const [isManualOpen, setIsManualOpen] = useState<boolean>(false);

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
        }
    }, [cart.length]);

    const taxRate = storeSettings.taxRate / 100;

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

    // For kg-based products: allow entering an amount to compute kilograms
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
        if (input === null) return; // Cancelled
        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0) {
            showSnackbar('Please enter a valid positive amount.', 'error');
            return;
        }
        let qty = amount / pricePerKg;
        qty = roundQty(qty);
        // Clamp to available stock
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

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredProducts.length === 1) {
                const product = filteredProducts[0];
                const availableStock = typeof (product as any).stock === 'number' ? (product as any).stock : (parseFloat(String((product as any).stock)) || 0);
                if (availableStock > 0) {
                    addToCart(product);
                    setSearchTerm(''); // Clear search after successful scan
                } else {
                    showSnackbar(`"${product.name}" is out of stock.`, 'error');
                }
            } else if (filteredProducts.length > 1) {
                showSnackbar('Multiple products match. Please select one manually.', 'info');
            } else {
                showSnackbar('No product found for the scanned code.', 'error');
            }
        }
    };

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

    // Add by barcode/SKU in case scanner fails
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

    // Auto-focus cash input when cash is selected and there is an amount to pay
    useEffect(() => {
        if (isCashMethod && total > 0) {
            setTimeout(() => cashInputRef.current?.focus(), 0);
        }
    }, [isCashMethod, total]);

    // Global keyboard shortcuts for quick operations
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTyping = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true');

            // Allow shortcuts even when typing, except when modifier is not pressed
            if (!e.ctrlKey) return;

            // Ctrl+Enter -> Pay
            if (e.key === 'Enter') {
                if (cart.length > 0 && total >= 0 && (!isCashMethod || cashReceivedNumber >= total)) {
                    e.preventDefault();
                    processTransaction('paid');
                }
                return;
            }
            const key = e.key.toLowerCase();
            // Ctrl+H -> Hold current sale
            if (key === 'h') {
                if (cart.length > 0) {
                    e.preventDefault();
                    handleHoldSale();
                }
                return;
            }
            // Ctrl+I -> Create invoice
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
        if (finalAppliedCredit > 0) { // Toggle off
            setAppliedStoreCredit(0);
        } else { // Toggle on
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
             dueDate.setDate(dueDate.getDate() + 30); // Net 30
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
                }]
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


    return (
        <div className="flex flex-col h-full bg-gray-100 rounded-2xl">
            <Header title={"Point of Sale"}></Header>

            <div className="flex-grow bg-gray-100 rounded-2xl flex flex-col md:flex-row p-4 gap-4 overflow-hidden min-w-0">
                {/* Product Selection */}
                <div className="flex-grow flex flex-col overflow-hidden min-w-0 min-h-0">
                    {/* Normal product UI (search + grid). Hidden on small screens when cart is open */}
                    <div className={`${mobileCartOpen ? 'hidden md:block' : 'block'} flex flex-col min-h-0`}>
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.817-4.817A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search products or scan barcode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Scan QR Code"
                                title="Scan QR Code"
                            >
                                <QrCodeIcon className="w-6 h-6" />
                            </button>
                            {/* Mobile-only inline View Cart button (non-floating) */}
                            {!mobileCartOpen && cart.length > 0 && (
                                <button
                                    onClick={() => setMobileCartOpen(true)}
                                    className="md:hidden px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                                    aria-label="Open Cart"
                                    title="Open Cart"
                                >
                                    <ShoppingCartIcon className="w-5 h-5 mr-2" />
                                    View Cart ({cart.length})
                                </button>
                            )}
                        </div>
                        {isLoading ? <div className="text-center p-10">Loading...</div> :
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 overflow-y-auto pr-2 flex-1 min-h-0">
                            {filteredProducts.map(p => {
                                const numericStock = typeof (p as any).stock === 'number' ? (p as any).stock : (parseFloat(String((p as any).stock)) || 0);
                                const isSoldOut = numericStock === 0;
                                const lowStockThreshold = p.reorderPoint || storeSettings.lowStockThreshold;
                                const isLowStock = numericStock > 0 && numericStock <= lowStockThreshold;
                                return (
                                <button key={p.id} onClick={() => addToCart(p)} disabled={isSoldOut} className="relative group bg-white border border-slate-200 rounded-lg p-3 text-left flex flex-col items-stretch justify-between transition-all hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50">
                                    <div className="w-full overflow-hidden rounded-md bg-slate-50 aspect-square">
                                        {p.imageUrls?.[0] ? (
                                            <img src={buildAssetUrl(p.imageUrls[0])} alt={p.name} loading="lazy" decoding="async" sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <ShoppingCartIcon className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-slate-800 line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                                        <div className="mt-1 flex items-center justify-between">
                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{formatCurrency(p.price, storeSettings)}{p.unitOfMeasure === 'kg' ? ' / kg' : ''}</span>
                                        </div>
                                    </div>
                                    {isSoldOut && <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center font-bold text-red-600 rounded-lg">SOLD OUT</div>}
                                    {isLowStock && <div className="absolute top-1 right-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{numericStock} left</div>}
                                </button>
                                );
                            })}
                        </div>
                        }
                    </div>

                    {/* Mobile-only: when cart is open, hide products and show Scan and Enter code buttons */}
                    <div className={`${mobileCartOpen ? 'flex md:hidden' : 'hidden'} flex justify-center gap-2`}>
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="px-3 py-2 text-sm rounded-2xl shadow-md border border-slate-300 bg-white text-slate-700 font-semibold shadow hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                            aria-label="Scan products"
                            title="Scan products"
                        >
                            <QrCodeIcon className="w-6 h-6" />
                            Scan products
                        </button>
                        <button
                            onClick={handleManualCodeEntry}
                            className="px-3 py-2 text-sm rounded-2xl shadow-md border border-slate-300 bg-white text-slate-700 font-semibold shadow hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                            aria-label="Enter code manually"
                            title="Enter code manually"
                        >
                            <PlusIcon className="w-6 h-6" />
                            Enter code
                        </button>
                    </div>
                </div>


                {/* Till */}
                <div className={`${mobileCartOpen ? 'flex' : 'hidden'} md:flex w-full md:w-[32rem] lg:w-1/2 xl:w-2/5 flex-shrink-0 flex-col min-h-0 md:h-full md:max-h-full max-h-[75vh] overflow-y-auto bg-slate-50 rounded-lg shadow min-w-0`}>
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-xl font-semibold flex items-center"><ShoppingCartIcon className="w-6 h-6 mr-2"/> Till</h2>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCustomerPanel(s => !s)}
                                className=" border rounded-md w-full px-2 py-1 flex items-center justify-between text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                                aria-expanded={showCustomerPanel}
                            >
                                <span className="text-xs text-slate-500">{showCustomerPanel ? 'Customer Hide' : 'Customer Show'}</span>
                            </button>
                            <button type="button" onClick={() => setMobileCartOpen(false)} className="md:hidden text-xs px-2 py-1 rounded-md border text-slate-700 border-slate-300 hover:bg-slate-100" title="Close cart">Close</button>
                            {/*<button type="button" onClick={() => setShowShortcuts(s => !s)} className="text-xs px-2 py-1 rounded-md border text-slate-700 border-slate-300 hover:bg-slate-100" title="Keyboard Shortcuts">Shortcuts</button>*/}
                            <button type="button" onClick={() => setDensity(d => d === 'compact' ? 'cozy' : 'compact')} className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-100" title="Toggle density">{density === 'compact' ? 'Cozy' : 'Compact'}</button>
                            <button onClick={clearCart} className="text-sm text-red-500 hover:underline flex items-center gap-1"><XMarkIcon className="w-4 h-4" /> Clear</button>
                        </div>
                    </div>


                    {/* Customer (collapsible) */}
                    <div className="border-b border-slate-200">

                        {showCustomerPanel && (
                            <div className="px-4 pb-3 py-2">
                                <CustomerSelect customers={customers} selectedCustomer={selectedCustomer} onSelectCustomer={(c) => { setSelectedCustomer(c); setAppliedStoreCredit(0); }} />
                                {selectedCustomer && selectedCustomer.storeCredit > 0 && storeSettings.enableStoreCredit && (
                                    <div className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded-md">
                                        Customer has <strong>{formatCurrency(selectedCustomer.storeCredit, storeSettings)}</strong> in store credit.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>


                    {/* Cart Items */}
                    <div className="flex-grow overflow-y-auto min-h-48">
                         {cart.length === 0 ? (
                            <div className="text-center text-slate-500 p-10">
                                <div className="text-4xl mb-2">🛒</div>
                                <div className="font-semibold">Your cart is empty</div>
                                <div className="text-xs mt-1">Search or scan a product to get started</div>
                            </div>
                         ) : (
                            <div className="">
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
                                                <p className="font-medium text-[13px] leading-5 truncate" title={item.name}>{item.name}</p>
                                                <p className="text-xs text-gray-600">{formatCurrency(item.price, storeSettings)}</p>
                                            </div>
                                            <div className="col-span-3 flex items-center justify-center gap-2">
                                                <button onClick={() => updateQuantity(item.productId, item.quantity - getStepFor(item.unitOfMeasure as any))} className="w-7 h-7 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-sm">-</button>
                                                <span className="min-w-[1.5rem] text-center font-semibold">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.productId, item.quantity + getStepFor(item.unitOfMeasure as any))} className="w-7 h-7 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-sm">+</button>
                                                {item.unitOfMeasure === 'kg' && (
                                                    <button onClick={() => setQuantityFromPrice(item.productId)} className="px-2 h-7 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-[10px]"
                                                            title="Enter amount to calculate kilograms">
                                                        Amt
                                                    </button>
                                                )}
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="font-semibold text-sm">{formatCurrency(item.price * item.quantity, storeSettings)}</p>
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button onClick={() => updateQuantity(item.productId, 0)} className="text-slate-400 hover:text-red-600" title="Remove">
                                                    <XMarkIcon className="w-5 h-5 inline" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}
                    </div>

                    {/* Held Sales (collapsible) */}
                    {heldSales.length > 0 && (
                        <div className="border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setShowHeldPanel(s => !s)}
                                className="w-full px-4 py-2 flex items-center justify-between text-left text-xs font-bold text-gray-600 uppercase hover:bg-slate-100"
                                aria-expanded={showHeldPanel}
                            >
                                <span>Held Sales</span>
                                <span className="text-[11px] font-normal text-slate-500">{showHeldPanel ? 'Hide' : 'Show'}</span>
                            </button>
                            {showHeldPanel && (
                                <div className="px-4 pb-3 flex gap-2 flex-wrap">
                                    {heldSales.map((sale, i) => (
                                        <button key={i} onClick={() => handleRecallSale(i)} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md hover:bg-yellow-200">
                                            Sale #{i+1} ({sale.length} items)
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="px-4 pt-0 pb-4 border-t border-slate-200 space-y-2 text-sm">
                        {/*<div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal, storeSettings)}</span></div>*/}
                        {/* Adjustments (collapsible) */}
                        <div className="border-t border-slate-200 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAdjustmentsPanel(s => !s)}
                                className="w-full -mt-2 -pt-2 px-0 py-2 flex items-center justify-between text-left text-xs font-bold text-gray-600 uppercase hover:bg-slate-100"
                                aria-expanded={showAdjustmentsPanel}
                            >
                                <span>Adjustments</span>
                                <span className="text-[11px] font-normal text-slate-500">{showAdjustmentsPanel ? 'Hide' : 'Show'}</span>
                            </button>
                            {showAdjustmentsPanel && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span>Discount</span>
                                        <div className="flex items-center">
                                            <span className="mr-1">{storeSettings.currency.symbol}</span>
                                            <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-20 p-1 border rounded-md text-right"/>
                                        </div>
                                    </div>
                                    {storeSettings.enableStoreCredit && selectedCustomer && selectedCustomer.storeCredit > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span>Store Credit</span>
                                            {finalAppliedCredit > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-green-600">-{formatCurrency(finalAppliedCredit, storeSettings)}</span>
                                                    <button onClick={handleApplyStoreCredit} className="text-xs text-red-500 hover:underline">Remove</button>
                                                </div>
                                            ) : (
                                                <button onClick={handleApplyStoreCredit} disabled={totalBeforeCredit <= 0} className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed">Apply Credit</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {/*<div className="flex justify-between"><span>Tax ({ storeSettings.taxRate }%)</span><span>{formatCurrency(taxAmount, storeSettings)}</span></div>*/}
                        <div className="flex justify-between font-bold text-lg border-t border-slate-200 pt-2"><span>Total</span><span>{formatCurrency(total, storeSettings)}</span></div>
                        {isCashMethod && (
                            <div className="space-y-2 border-t border-slate-200 pt-2">
                                <div className="flex justify-between items-center">
                                    <span>Cash Received</span>
                                    <div className="flex items-center">
                                        <span className="mr-1">{storeSettings.currency.symbol}</span>
                                        <input
                                            ref={cashInputRef}
                                            type="number"
                                            inputMode="decimal"
                                            value={cashReceived}
                                            onChange={e => setCashReceived(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && cart.length > 0 && total >= 0 && (!isCashMethod || cashReceivedNumber >= total)) {
                                                    e.preventDefault();
                                                    processTransaction('paid');
                                                }
                                            }}
                                            className="w-28 p-1 border rounded-md text-right"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {(() => {
                                        const exact = Math.max(0, total);
                                        const round10 = Math.ceil(exact / 10) * 10;
                                        const plus10 = exact + 10;
                                        const plus20 = exact + 20;
                                        const opts = [
                                            { label: 'Exact', value: exact },
                                            { label: `~${storeSettings.currency.symbol}${Math.round(round10)}`, value: round10 },
                                            { label: `+10`, value: plus10 },
                                            { label: `+20`, value: plus20 },
                                        ];
                                        return opts.map(o => (
                                            <button
                                                key={o.label}
                                                type="button"
                                                className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-100"
                                                onClick={() => setCashReceived(String(o.value.toFixed ? o.value.toFixed(2) : o.value))}
                                            >
                                                {o.label}
                                            </button>
                                        ));
                                    })()}
                                </div>
                                <div className={`flex justify-between font-semibold ${changeDue > 0 ? 'text-green-700' : 'text-gray-700'}`}>
                                    <span>Change Due</span>
                                    <span>{formatCurrency(changeDue, storeSettings)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-slate-100 rounded-b-lg border-t border-slate-200 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleHoldSale} disabled={cart.length === 0} className="w-full flex items-center justify-center p-3 rounded-md bg-yellow-400 text-yellow-900 font-semibold hover:bg-yellow-500 disabled:bg-yellow-200 disabled:text-yellow-600">
                                <BackspaceIcon className="w-5 h-5 mr-2"/> Hold
                            </button>
                             <select value={selectedPaymentMethod} onChange={e => setSelectedPaymentMethod(e.target.value)} className="w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-semibold" disabled={(storeSettings.paymentMethods || []).length === 0}>
                                {(storeSettings.paymentMethods || []).map(method => (
                                    <option key={method.id} value={method.name}>{method.name}</option>
                                ))}
                                 {(storeSettings.paymentMethods || []).length === 0 && <option>No methods</option>}
                            </select>
                        </div>
                        <button onClick={() => processTransaction('paid')} disabled={cart.length === 0 || total < 0 || (isCashMethod && cashReceivedNumber < total)} className="w-full flex items-center justify-center p-3 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow hover:from-blue-600 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 disabled:opacity-90">
                            <span className="mr-2">{payLabel}</span> {formatCurrency(total > 0 ? total : 0, storeSettings)}
                        </button>
                        <button
                            onClick={() => processTransaction('invoice')}
                            disabled={cart.length === 0 || total < 0 || !selectedCustomer}
                            title={!selectedCustomer ? "Select a customer to charge to an account" : ""}
                            className="w-full flex items-center justify-center p-3 rounded-md bg-white text-gray-700 font-semibold border border-gray-300 hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            <DocumentPlusIcon className="w-5 h-5 mr-2"/> Charge to Account
                        </button>
                        {showShortcuts && (
                            <div className="mt-2 p-3 rounded-md bg-white border border-slate-200 text-xs text-slate-700">
                                <div className="font-bold text-slate-600 mb-1">Keyboard shortcuts</div>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><span className="font-semibold">Ctrl+Enter</span>: Pay {formatCurrency(total > 0 ? total : 0, storeSettings)}</li>
                                    <li><span className="font-semibold">Ctrl+H</span>: Hold current sale</li>
                                    <li><span className="font-semibold">Ctrl+I</span>: Create invoice</li>
                                    <li><span className="font-semibold">Enter</span>: In Cash Received, complete payment when valid</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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