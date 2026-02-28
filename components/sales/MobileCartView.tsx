import React from 'react';
import { CartItem, Customer, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import {
    ShoppingCartIcon,
    XMarkIcon,
    QrCodeIcon,
    CreditCardIcon,
    ClockIcon,
    DocumentPlusIcon,
    ArrowLeftIcon,
    UserIcon,
} from '../icons';
import MinusIcon from '../icons/MinusIcon';
import PlusIcon from '../icons/PlusIcon';
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
    mobileCashInputRef: React.RefObject<HTMLInputElement | null>;
    isScannerOpen: boolean;
    setIsScannerOpen: (isOpen: boolean) => void;
    onContinuousScan: (decodedText: string) => void;
    onScanError: (error: any) => void;
    setAppliedStoreCredit: (amount: number) => void;
}

// Payment icon helper
const getPaymentIcon = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes('cash')) return '💵';
    if (l.includes('card') || l.includes('credit') || l.includes('debit')) return '💳';
    if (l.includes('mobile') || l.includes('mtn') || l.includes('airtel') || l.includes('lenco')) return '📱';
    return '💰';
};

// Section types for tab navigation
type CartSection = 'items' | 'details' | 'payment';

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
    setAppliedStoreCredit,
}) => {
    const getStepFor = (uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1);
    const isCashMethod = (selectedPaymentMethod || '').toLowerCase().includes('cash');
    const isMobileMoney = ['mobile', 'lenco', 'mtn', 'airtel'].some(k =>
        (selectedPaymentMethod || '').toLowerCase().includes(k)
    );

    const [activeSection, setActiveSection] = React.useState<CartSection>('items');
    const [removingItems, setRemovingItems] = React.useState<string[]>([]);

    const cashReceivedNumber = parseFloat(cashReceived || '0') || 0;
    const isPayDisabled = cart.length === 0 || total < 0 || (isCashMethod && cashReceivedNumber < total) || isProcessing;

    const paymentMethods = (storeSettings.paymentMethods && storeSettings.paymentMethods.length > 0)
        ? storeSettings.paymentMethods
        : [{ id: 'pm_cash', name: 'Cash' }, { id: 'pm_card', name: 'Card' }];

    // Quick cash amounts
    const quickAmounts = total > 0
        ? [total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500]
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 4)
        : [];

    const handleRemove = (productId: string) => {
        setRemovingItems(prev => [...prev, productId]);
        setTimeout(() => {
            removeFromCart(productId);
            setRemovingItems(prev => prev.filter(id => id !== productId));
        }, 300);
    };

    const sectionTabs: { id: CartSection; label: string; icon: React.ReactNode }[] = [
        { id: 'items', label: 'Items', icon: <ShoppingCartIcon className="w-4 h-4" /> },
        { id: 'details', label: 'Details', icon: <UserIcon className="w-4 h-4" /> },
        { id: 'payment', label: 'Pay', icon: <CreditCardIcon className="w-4 h-4" /> },
    ];

    return (
        <div className={`md:hidden fixed inset-x-0 bottom-0 top-16 bg-slate-100 dark:bg-slate-900 z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* ── Header ── */}
            <div className="flex-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 px-4 py-3 z-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-10 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90 transition-all"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none">Order</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
                            {cart.length > 0
                                ? `${cart.length} ${cart.length === 1 ? 'item' : 'items'} · ${formatCurrency(subtotal, storeSettings)}`
                                : 'Nothing added yet'}
                        </p>
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-xs font-semibold text-red-500 dark:text-red-400 transition-colors active:scale-95 px-2 py-1"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* ── Section Tabs (only when cart has items) ── */}
            {cart.length > 0 && !isScannerOpen && (
                <div className="flex-none bg-white dark:bg-slate-900 px-3 pb-3 pt-2">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
                        {sectionTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`
                                    flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-[14px]
                                    transition-all duration-300 active:scale-[0.96]
                                    ${activeSection === tab.id
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgb(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.3)]'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
                                `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Main Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto min-h-0">

                {/* Empty state */}
                {cart.length === 0 && !isScannerOpen && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-8 pb-32">
                        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-5 shadow-sm">
                            <ShoppingCartIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Cart is Empty</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mb-8 max-w-[200px] leading-relaxed">
                            Scan a product or browse the catalog to start selling
                        </p>
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                            >
                                <QrCodeIcon className="w-5 h-5" />
                                Scan Barcode
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full px-6 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-semibold border border-slate-200 dark:border-white/10 active:scale-95 transition-all"
                            >
                                Browse Products
                            </button>
                        </div>
                    </div>
                )}

                {/* Scanner + Items Split View */}
                {isScannerOpen && (
                    <div className="flex flex-col h-full">
                        {/* Top Half: Scanner */}
                        <div className="h-[45vh] bg-black relative flex-shrink-0">
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
                            <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
                                <p className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                                    Align barcode within frame
                                </p>
                            </div>
                            <button
                                onClick={() => setIsScannerOpen(false)}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center active:scale-95 transition-all z-10"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Bottom Half: Cart Items */}
                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto px-3 py-2 pb-24 space-y-2 relative border-t border-slate-200/50 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-10">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                                    <ShoppingCartIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Scan to add items</p>
                                </div>
                            ) : (
                                cart.map(item => {
                                    const isRemoving = removingItems.includes(item.productId);
                                    return (
                                        <div
                                            key={item.productId}
                                            className={`bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-white/5 p-2.5 transition-all duration-300 ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100'}`}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-slate-900 dark:text-white leading-tight line-clamp-1">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                                                        {formatCurrency(item.price, storeSettings)} × {item.quantity}{item.unitOfMeasure === 'kg' ? 'kg' : ''} = <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(item.price * item.quantity, storeSettings)}</span>
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(item.productId)}
                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90 flex-shrink-0"
                                                >
                                                    <XMarkIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Items Section */}
                {cart.length > 0 && !isScannerOpen && activeSection === 'items' && (
                    <div className="px-3 py-2 pb-56 space-y-2">
                        {cart.map(item => {
                            const step = getStepFor(item.unitOfMeasure);
                            const isRemoving = removingItems.includes(item.productId);
                            return (
                                <div
                                    key={item.productId}
                                    className={`bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-white/5 p-3 transition-all duration-300 ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-slate-900 dark:text-white leading-tight line-clamp-2">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                                                {formatCurrency(item.price, storeSettings)} × {item.quantity}{item.unitOfMeasure === 'kg' ? 'kg' : ''} =&nbsp;
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {formatCurrency(item.price * item.quantity, storeSettings)}
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(item.productId)}
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90 flex-shrink-0 mt-0.5"
                                        >
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Stepper */}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center bg-slate-100 dark:bg-white/8 rounded-full p-0.5 gap-0.5">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - step)}
                                                className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center active:scale-90 transition-all shadow-sm"
                                            >
                                                <MinusIcon className="w-3 h-3" />
                                            </button>
                                            <span className="w-12 text-center text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                                {item.quantity}{item.unitOfMeasure === 'kg' ? <span className="text-xs font-normal">kg</span> : ''}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + step)}
                                                className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center active:scale-90 transition-all shadow-sm"
                                            >
                                                <PlusIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                                            {formatCurrency(item.price * item.quantity, storeSettings)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Details Section (customer + summary) */}
                {cart.length > 0 && !isScannerOpen && activeSection === 'details' && (
                    <div className="px-3 py-2 pb-56 space-y-3">
                        {/* Customer */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-white/5 p-4">
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Customer</p>
                            <CustomerSelect
                                customers={customers}
                                selectedCustomer={selectedCustomer}
                                onSelectCustomer={(c) => {
                                    setSelectedCustomer(c);
                                    setAppliedStoreCredit(0);
                                }}
                            />
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-white/5 p-4 space-y-0">
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Order Summary</p>
                            {[
                                { label: 'Subtotal', value: formatCurrency(subtotal, storeSettings) },
                                { label: `Tax (${storeSettings.taxRate}%)`, value: formatCurrency(taxAmount, storeSettings) },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
                                    <span className="text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200">{row.value}</span>
                                </div>
                            ))}

                            {/* Discount */}
                            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Discount</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-300 dark:text-slate-600">{storeSettings.currency.symbol}</span>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={e => setDiscount(e.target.value)}
                                        className="w-20 px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl text-right text-sm font-medium tabular-nums focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-slate-800 dark:text-white"
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center pt-3">
                                <span className="font-bold text-slate-900 dark:text-white">Total</span>
                                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                                    {formatCurrency(total, storeSettings)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Section */}
                {cart.length > 0 && !isScannerOpen && activeSection === 'payment' && (
                    <div className="px-3 py-2 pb-56 space-y-3">
                        {/* Big Total */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-white/5 p-5 text-center">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Due</p>
                            <p className="text-[3rem] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                                {formatCurrency(total, storeSettings)}
                            </p>
                        </div>

                        {/* Payment Method Chips */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-white/5 p-4">
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Payment Method</p>
                            <div className={`grid gap-2 ${paymentMethods.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                {paymentMethods.map(method => {
                                    const isSelected = selectedPaymentMethod === method.name;
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedPaymentMethod(method.name)}
                                            className={`
                                                flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl text-xs font-semibold
                                                border-2 transition-all duration-150 active:scale-95
                                                ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'}
                                            `}
                                        >
                                            <span className="text-xl leading-none">{getPaymentIcon(method.name)}</span>
                                            <span className="truncate max-w-full">{method.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mobile Money Input */}
                        {isMobileMoney && (
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-white/5 p-4">
                                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                    Payer Mobile Number
                                </label>
                                <input
                                    type="text"
                                    value={mobileMoneyNumber}
                                    onChange={e => setMobileMoneyNumber(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                                    placeholder="e.g. 0961111111"
                                />
                            </div>
                        )}

                        {/* Cash Received */}
                        {isCashMethod && (
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-white/5 p-4">
                                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                    Cash Received
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm pointer-events-none">
                                        {storeSettings.currency.symbol}
                                    </span>
                                    <input
                                        ref={mobileCashInputRef}
                                        type="number"
                                        value={cashReceived}
                                        onChange={e => setCashReceived(e.target.value)}
                                        className="w-full pl-9 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-2xl text-right text-xl font-bold tabular-nums text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* Quick amounts */}
                                {quickAmounts.length > 0 && (
                                    <div className="flex gap-2 mt-2.5">
                                        {quickAmounts.map((amt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCashReceived(String(amt))}
                                                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95
                                                    ${cashReceivedNumber === amt
                                                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/50'
                                                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'}`}
                                            >
                                                {i === 0 ? 'Exact' : formatCurrency(amt, storeSettings)}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {changeDue > 0 && (
                                    <div className="flex justify-between items-center mt-3 py-3 px-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Change Due</span>
                                        <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            {formatCurrency(changeDue, storeSettings)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {cart.length > 0 && !isScannerOpen && (
                <div className="flex-none absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-0 right-0 z-30 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Frosted glass background */}
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border-t border-slate-200/50 dark:border-white/5 px-4 pt-4 pb-4 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)] relative rounded-t-3xl mx-2 mb-2">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent dark:from-slate-900/40 pointer-events-none" />
                        <div className="relative z-10 group">
                            {/* Scan button (compact, above) */}
                            <div className="grid grid-cols-4 gap-2 mb-2.5">
                                <button
                                    onClick={onHoldSale}
                                    className="col-span-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                                >
                                    <ClockIcon className="w-4 h-4" />
                                    <span className="text-[10px]">Hold</span>
                                </button>

                                {/* Main Charge Button */}
                                <button
                                    id="pos-mobile-pay-btn"
                                    onClick={() => processTransaction('paid')}
                                    disabled={isPayDisabled}
                                    className="col-span-3 py-4 rounded-[20px] bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-extrabold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] transition-all duration-300 shadow-[0_8px_20px_rgb(99,102,241,0.3)] overflow-hidden relative"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                                            <span>Processing…</span>
                                        </>
                                    ) : (
                                        <>
                                            <CreditCardIcon className="w-5 h-5 flex-shrink-0" />
                                            <span>Charge {formatCurrency(total, storeSettings)}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Secondary: Invoice + Scan */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setIsScannerOpen(true)}
                                    className="py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <QrCodeIcon className="w-4 h-4" />
                                    Scan More
                                </button>
                                <button
                                    onClick={() => processTransaction('invoice')}
                                    disabled={!selectedCustomer || isProcessing}
                                    className="py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all"
                                >
                                    <DocumentPlusIcon className="w-4 h-4" />
                                    {!selectedCustomer ? 'Invoice (select customer)' : 'Invoice'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
