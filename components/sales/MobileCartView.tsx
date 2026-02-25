import React from 'react';
import { CartItem, Customer, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import {
    ShoppingCartIcon,
    XMarkIcon,
    QrCodeIcon,
    CreditCardIcon,
    ChevronDownIcon,
    ClockIcon,
    DocumentPlusIcon,
    ArrowLeftIcon
} from '../icons';
import UnifiedScannerModal from '../UnifiedScannerModal';
import CustomerSelect from './CustomerSelect';

interface MobileCartViewProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    storeSettings: StoreSettings;
    updateQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    customers: Customer[];
    selectedCustomer: Customer | null;
    setSelectedCustomer: (c: Customer | null) => void;
    discount: string;
    setDiscount: (val: string) => void;
    subtotal: number;
    taxAmount: number;
    total: number;
    selectedPaymentMethod: string;
    setSelectedPaymentMethod: (val: string) => void;
    mobileMoneyNumber: string;
    setMobileMoneyNumber: (val: string) => void;
    cashReceived: string;
    setCashReceived: (val: string) => void;
    changeDue: number;
    onHoldSale: () => void;
    processTransaction: (type: 'paid' | 'invoice') => void;
    isProcessing: boolean;
    mobileCashInputRef: React.RefObject<HTMLInputElement>;
    isScannerOpen: boolean;
    setIsScannerOpen: (isOpen: boolean) => void;
    onContinuousScan: (decodedText: string) => void;
    onScanError: (error: any) => void;
    setAppliedStoreCredit: (amount: number) => void;
}

export const MobileCartView: React.FC<MobileCartViewProps> = ({
    isOpen,
    onClose,
    cart,
    storeSettings,
    updateQuantity,
    removeFromCart,
    clearCart,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    discount,
    setDiscount,
    subtotal,
    taxAmount,
    total,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    mobileMoneyNumber,
    setMobileMoneyNumber,
    cashReceived,
    setCashReceived,
    changeDue,
    onHoldSale,
    processTransaction,
    isProcessing,
    mobileCashInputRef,
    isScannerOpen,
    setIsScannerOpen,
    onContinuousScan,
    onScanError,
    setAppliedStoreCredit
}) => {
    const getStepFor = (uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1);
    const isCashMethod = (selectedPaymentMethod || '').toLowerCase().includes('cash');
    const isMobileMoney = (selectedPaymentMethod?.toLowerCase().includes('mobile') || selectedPaymentMethod?.toLowerCase().includes('lenco') || selectedPaymentMethod?.toLowerCase().includes('mtn') || selectedPaymentMethod?.toLowerCase().includes('airtel'));


    const [removingItems, setRemovingItems] = React.useState<string[]>([]);

    const handleRemoveWithAnimation = (productId: string) => {
        setRemovingItems(prev => [...prev, productId]);
        setTimeout(() => {
            removeFromCart(productId);
            setRemovingItems(prev => prev.filter(id => id !== productId));
        }, 400); // Match CSS animation duration
    };

    return (
        <div className={`md:hidden fixed inset-0 bg-white dark:bg-slate-900 z-50 transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Mobile Cart Header */}
            <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 z-10 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        <ArrowLeftIcon className="w-6 h-6 text-slate-700 dark:text-white" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cart ({cart.length})</h2>
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
            <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50/50 dark:bg-white/5">

                {/* Slot 1: Scrollable Content (Empty State or List + Checkout) */}
                <div className={`
                    flex-1 overflow-y-auto scroll-smooth no-scrollbar transition-all duration-500 ease-in-out
                    ${(cart.length === 0 && isScannerOpen) ? 'basis-0 opacity-0 overflow-hidden' : 'opacity-100'}
                `}>
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                <ShoppingCartIcon className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cart is Empty</h3>
                            <p className="text-slate-500 dark:text-gray-400 mb-8 max-w-[200px] leading-relaxed">Scan a product or browse the catalog to start selling</p>

                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <button
                                    onClick={() => setIsScannerOpen(true)}
                                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                                >
                                    <QrCodeIcon className="w-6 h-6" />
                                    Scan Barcode
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full px-6 py-4 bg-white text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
                                >
                                    Browse Products
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div id="pos-mobile-cart-items">
                            {/* Items List */}
                            <div className="p-4 space-y-4">
                                {cart.map(item => (
                                    <div
                                        key={item.productId}
                                        className={`
                                            bg-white dark:bg-slate-800/80 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-sm 
                                            animate-cart-item
                                            ${removingItems.includes(item.productId) ? 'animate-cart-item-exit' : ''}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white text-base">{item.name}</h4>
                                                <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mt-1">{formatCurrency(item.price, storeSettings)} each</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-extrabold text-slate-900 dark:text-white text-lg">{formatCurrency(item.price * item.quantity, storeSettings)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-full border border-slate-100 dark:border-white/5 shadow-inner">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - getStepFor(item.unitOfMeasure))}
                                                    className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-transparent transition-all active:scale-90 duration-300"
                                                >
                                                    <span className="font-bold text-xl leading-none">−</span>
                                                </button>
                                                <span className="font-bold text-lg text-slate-900 dark:text-white w-14 text-center">
                                                    {item.quantity}
                                                    {item.unitOfMeasure === 'kg' && <span className="text-xs text-slate-500 dark:text-gray-500 ml-0.5">kg</span>}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + getStepFor(item.unitOfMeasure))}
                                                    className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-transparent transition-all active:scale-90 duration-300"
                                                >
                                                    <span className="font-bold text-xl leading-none">+</span>
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveWithAnimation(item.productId)}
                                                className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100 dark:active:bg-red-500/20 rounded-full transition-all duration-300 active:scale-90"
                                                title="Remove item"
                                            >
                                                <XMarkIcon className="w-6 h-6 text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Checkout Actions (Only if scanner is closed) */}
                            {!isScannerOpen && (
                                <div className="px-4 pb-4 space-y-6">
                                    {/* Customer Select */}
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] border border-slate-200/50 dark:border-white/10">
                                        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Customer</label>
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
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] border border-slate-200/50 dark:border-white/10 space-y-4">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-gray-400">Subtotal</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(subtotal, storeSettings)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 dark:text-gray-400">Discount</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs">{storeSettings.currency.symbol}</span>
                                                    <input
                                                        type="number"
                                                        value={discount}
                                                        onChange={(e) => setDiscount(e.target.value)}
                                                        className="w-20 px-2 py-1 border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded text-right text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-gray-400">Tax</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(taxAmount, storeSettings)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                                                <span className="font-bold text-slate-900 dark:text-white">Total</span>
                                                <span className="font-bold text-lg text-slate-900 dark:text-white">{formatCurrency(total, storeSettings)}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                                            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Payment Method</label>
                                            <div className="relative group">
                                                <select
                                                    value={selectedPaymentMethod}
                                                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200/50 dark:border-white/10 rounded-[1.25rem] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 transition-all duration-300 shadow-inner"
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

                                        {isMobileMoney && (
                                            <div className="pt-2">
                                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Payer Mobile Number</label>
                                                <input
                                                    type="text"
                                                    value={mobileMoneyNumber}
                                                    onChange={(e) => setMobileMoneyNumber(e.target.value)}
                                                    className="w-full p-4 border border-slate-200/50 dark:border-white/10 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-[1.25rem] font-bold text-lg shadow-inner focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="e.g. 0961111111"
                                                />
                                            </div>
                                        )}

                                        {isCashMethod && (
                                            <div className="pt-2">
                                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Cash Received</label>
                                                <input
                                                    ref={mobileCashInputRef}
                                                    type="number"
                                                    value={cashReceived}
                                                    onChange={(e) => setCashReceived(e.target.value)}
                                                    className="w-full p-4 border border-slate-200/50 dark:border-white/10 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-[1.25rem] font-bold text-lg shadow-inner focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="0.00"
                                                />
                                                {changeDue > 0 && (
                                                    <div className="mt-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                                        Change Due: {formatCurrency(changeDue, storeSettings)}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3 pt-4">
                                            <button
                                                id="pos-mobile-hold-btn"
                                                onClick={onHoldSale}
                                                className="col-span-1 py-3.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                                            >
                                                <ClockIcon className="w-[18px] h-[18px]" />
                                                Hold
                                            </button>

                                            <button
                                                id="pos-mobile-pay-btn"
                                                onClick={() => processTransaction('paid')}
                                                disabled={total < 0 || (isCashMethod && parseFloat(cashReceived || '0') < total) || isProcessing}
                                                className="col-span-2 py-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full font-extrabold disabled:opacity-50 flex items-center justify-center gap-2 text-base active:scale-95 transition-all shadow-md hover:shadow-lg"
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
                                            className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-full border border-slate-200/50 dark:border-white/10 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 active:scale-95 transition-all shadow-sm"
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
                                onScanSuccess={onContinuousScan}
                                onScanError={onScanError}
                                continuous={true}
                                delayBetweenScans={1500}
                                paused={false}
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
                    <div className="flex-none p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 z-30 pb-[env(safe-area-inset-bottom)] md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        {isScannerOpen ? (
                            <button
                                onClick={() => setIsScannerOpen(false)}
                                className="w-full py-3.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl font-bold border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            >
                                <XMarkIcon className="w-5 h-5" />
                                Stop Scanning
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="w-full py-4 bg-blue-600 text-white rounded-[1.25rem] font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <QrCodeIcon className="w-5 h-5 text-white/90" />
                                <span>Scan Product</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
