import React, { useEffect, useRef, useState } from 'react';
import { CartItem, Customer, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import {
    ShoppingCartIcon,
    CreditCardIcon,
    ChevronDownIcon,
    ClockIcon,
    DocumentPlusIcon
} from '../icons';
import UnifiedScannerModal from '../UnifiedScannerModal';
import CustomerSelect from './CustomerSelect';

interface CheckoutActionsProps {
    cart: CartItem[];
    storeSettings: StoreSettings;
    customers: Customer[];
    total: number;
    subtotal: number;
    taxAmount: number;
    discount: string;
    setDiscount: (val: string) => void;
    selectedCustomer: Customer | null;
    setSelectedCustomer: (c: Customer | null) => void;
    onApplyStoreCredit: () => void;
    finalAppliedCredit: number;
    selectedPaymentMethod: string;
    setSelectedPaymentMethod: (val: string) => void;
    cashReceived: string;
    setCashReceived: (val: string) => void;
    processTransaction: (type: 'paid' | 'invoice') => void;
    isProcessing: boolean;
    isScannerOpen: boolean;
    setIsScannerOpen: (isOpen: boolean) => void;
    cartActionTab: 'customer' | 'summary' | 'payment';
    setCartActionTab: (tab: 'customer' | 'summary' | 'payment') => void;
    onHoldSale: () => void;
    onContinuousScan: (decodedText: string) => void;
    onScanError: (error: any) => void;
    changeDue: number;
    mobileMoneyNumber: string;
    setMobileMoneyNumber: (val: string) => void;
    setAppliedStoreCredit: (amount: number) => void;
    cashInputRef: React.RefObject<HTMLInputElement>;
}

export const CheckoutActions: React.FC<CheckoutActionsProps> = ({
    cart,
    storeSettings,
    customers,
    total,
    subtotal,
    taxAmount,
    discount,
    setDiscount,
    selectedCustomer,
    setSelectedCustomer,
    onApplyStoreCredit,
    finalAppliedCredit,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    cashReceived,
    setCashReceived,
    processTransaction,
    isProcessing,
    isScannerOpen,
    setIsScannerOpen,
    cartActionTab,
    setCartActionTab,
    onHoldSale,
    onContinuousScan,
    onScanError,
    changeDue,
    mobileMoneyNumber,
    setMobileMoneyNumber,
    setAppliedStoreCredit,
    cashInputRef
}) => {
    const [actionsPanelHeight, setActionsPanelHeight] = useState(400);
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight > 200 && newHeight < window.innerHeight * 0.8) {
                setActionsPanelHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizing = (e: React.MouseEvent) => {
        isResizing.current = true;
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
    };

    const isCashMethod = (selectedPaymentMethod || '').toLowerCase().includes('cash');
    const cashReceivedNumber = parseFloat(cashReceived || '0') || 0;
    const isMobileMoney = (selectedPaymentMethod?.toLowerCase().includes('mobile') || selectedPaymentMethod?.toLowerCase().includes('lenco') || selectedPaymentMethod?.toLowerCase().includes('mtn') || selectedPaymentMethod?.toLowerCase().includes('airtel'));

    const tabItems = [
        { id: 'customer' as const, label: 'Customer' },
        { id: 'summary' as const, label: 'Summary' },
        { id: 'payment' as const, label: 'Payment' },
    ];

    return (
        <div
            className="hidden md:flex flex-none bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 relative flex-col transition-all duration-75 ease-linear"
            style={{ height: `${actionsPanelHeight}px` }}
        >
            {/* Drag Handle */}
            <div
                className="flex items-center justify-center py-1.5 cursor-ns-resize absolute top-0 left-0 right-0 z-10"
                onMouseDown={startResizing}
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize checkout panel"
            >
                <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {isScannerOpen ? (
                <div className="flex-1 p-4 overflow-hidden flex flex-col mt-4">
                    <div className="flex-1 w-full relative min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                        <UnifiedScannerModal
                            isOpen={true}
                            variant="embedded"
                            onClose={() => setIsScannerOpen(false)}
                            onScanSuccess={onContinuousScan}
                            onScanError={onScanError}
                            continuous={true}
                            delayBetweenScans={1500}
                        />
                    </div>
                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                        Point camera at a barcode to add to cart
                    </p>
                </div>
            ) : (
                <>
                    {/* Tab Navigation */}
                    <nav
                        className="flex border-b border-slate-100 dark:border-white/5 flex-none px-4 mt-4"
                        role="tablist"
                        aria-label="Checkout sections"
                    >
                        {tabItems.map((tab) => (
                            <button
                                key={tab.id}
                                id={`pos-tab-${tab.id}`}
                                role="tab"
                                aria-selected={cartActionTab === tab.id}
                                aria-controls={`pos-panel-${tab.id}`}
                                onClick={() => setCartActionTab(tab.id)}
                                className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${cartActionTab === tab.id
                                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="flex-1 overflow-y-auto p-4" role="tabpanel" id={`pos-panel-${cartActionTab}`}>
                        {cart.length > 0 ? (
                            <>
                                {/* Customer Tab */}
                                {cartActionTab === 'customer' && (
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
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
                                            <div className="py-4 border-t border-slate-100 dark:border-white/5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Store Credit</p>
                                                        <p className="text-2xl font-light text-emerald-600 dark:text-emerald-400 mt-1">
                                                            {formatCurrency(selectedCustomer.storeCredit, storeSettings)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={onApplyStoreCredit}
                                                        aria-label={finalAppliedCredit > 0 ? 'Remove store credit' : 'Apply store credit'}
                                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${finalAppliedCredit > 0
                                                            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 focus-visible:ring-red-500'
                                                            : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 focus-visible:ring-emerald-500'
                                                            }`}
                                                    >
                                                        {finalAppliedCredit > 0 ? 'Remove' : 'Apply'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Summary Tab */}
                                {cartActionTab === 'summary' && (
                                    <div className="space-y-0">
                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-sm text-slate-500 dark:text-slate-400">Subtotal</span>
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency(subtotal, storeSettings)}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-3 border-t border-slate-100 dark:border-white/5">
                                            <span className="text-sm text-slate-500 dark:text-slate-400">Discount</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-300 dark:text-slate-600">{storeSettings.currency.symbol}</span>
                                                <input
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                    aria-label="Discount amount"
                                                    className="w-24 px-2 py-1.5 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg text-right text-sm font-medium tabular-nums focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                                                    placeholder="0.00"
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        {finalAppliedCredit > 0 && (
                                            <div className="flex justify-between items-center py-3 border-t border-slate-100 dark:border-white/5">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">Store Credit</span>
                                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">−{formatCurrency(finalAppliedCredit, storeSettings)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center py-3 border-t border-slate-100 dark:border-white/5">
                                            <span className="text-sm text-slate-500 dark:text-slate-400">Tax ({storeSettings.taxRate}%)</span>
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency(taxAmount, storeSettings)}</span>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-200 dark:border-white/10">
                                            <span className="text-base font-semibold text-slate-900 dark:text-white">Total</span>
                                            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(total, storeSettings)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Tab */}
                                {cartActionTab === 'payment' && (
                                    <div className="space-y-5">
                                        {/* Total Display */}
                                        <div className="text-center py-3">
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">{formatCurrency(total, storeSettings)}</p>
                                        </div>

                                        {/* Payment Method */}
                                        <div>
                                            <label htmlFor="payment-method-select" className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                                Payment Method
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="payment-method-select"
                                                    value={selectedPaymentMethod}
                                                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all duration-300"
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
                                                <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Mobile Money Number */}
                                        {isMobileMoney && (
                                            <div>
                                                <label htmlFor="mobile-money-input" className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                                    Payer Mobile Number
                                                </label>
                                                <input
                                                    id="mobile-money-input"
                                                    type="text"
                                                    value={mobileMoneyNumber}
                                                    onChange={(e) => setMobileMoneyNumber(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                    placeholder="e.g. 0961111111"
                                                />
                                            </div>
                                        )}

                                        {/* Cash Received */}
                                        {isCashMethod && (
                                            <div>
                                                <label htmlFor="cash-received-input" className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                                    Cash Received
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                                                        {storeSettings.currency.symbol}
                                                    </span>
                                                    <input
                                                        id="cash-received-input"
                                                        ref={cashInputRef}
                                                        type="number"
                                                        value={cashReceived}
                                                        onChange={(e) => setCashReceived(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-right text-lg font-semibold tabular-nums text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                {changeDue > 0 && (
                                                    <div className="flex justify-between items-center mt-3 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                                                        <span className="text-sm text-emerald-700 dark:text-emerald-400">Change Due</span>
                                                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                            {formatCurrency(changeDue, storeSettings)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="pt-2 space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    id="pos-hold-btn"
                                                    onClick={onHoldSale}
                                                    aria-label="Hold this sale for later"
                                                    className="py-3 px-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95 transition-all duration-300"
                                                >
                                                    <ClockIcon className="w-4 h-4" />
                                                    <span className="text-sm">Hold</span>
                                                </button>
                                                <button
                                                    id="pos-pay-btn"
                                                    onClick={() => processTransaction('paid')}
                                                    disabled={total < 0 || (isCashMethod && cashReceivedNumber < total) || isProcessing}
                                                    aria-label={`Pay ${formatCurrency(total, storeSettings)}`}
                                                    className="py-3 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-white active:scale-95 transition-all duration-300"
                                                >
                                                    {isProcessing ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                                                    ) : (
                                                        <CreditCardIcon className="w-4 h-4" />
                                                    )}
                                                    <span className="text-sm truncate">
                                                        {isProcessing ? 'Processing…' : `Pay ${formatCurrency(total, storeSettings)}`}
                                                    </span>
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => processTransaction('invoice')}
                                                disabled={!selectedCustomer || isProcessing}
                                                aria-label="Create an invoice for this sale"
                                                className="w-full py-2.5 text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg"
                                            >
                                                <DocumentPlusIcon className="w-4 h-4" />
                                                Invoice
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                                <ShoppingCartIcon className="w-10 h-10 mb-2" />
                                <p className="text-sm text-slate-400 dark:text-slate-600">Cart is empty</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
