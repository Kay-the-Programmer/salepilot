import React, { useEffect, useRef, useState } from 'react';
import { CartItem, Customer, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import {
    ShoppingCartIcon,
    XMarkIcon,
    QrCodeIcon,
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
    isScannerPaused?: boolean;
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
    isScannerPaused,
    changeDue,
    mobileMoneyNumber,
    setMobileMoneyNumber,
    setAppliedStoreCredit,
    cashInputRef
}) => {
    const [actionsPanelHeight, setActionsPanelHeight] = useState(400); // Default height
    const isResizing = useRef(false);

    // Handle resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newHeight = window.innerHeight - e.clientY;
            // Min height: 200px, Max height: 80% of screen height
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
        e.preventDefault(); // Prevent text selection
    };

    const isCashMethod = (selectedPaymentMethod || '').toLowerCase().includes('cash');
    const cashReceivedNumber = parseFloat(cashReceived || '0') || 0;

    const isMobileMoney = (selectedPaymentMethod?.toLowerCase().includes('mobile') || selectedPaymentMethod?.toLowerCase().includes('lenco') || selectedPaymentMethod?.toLowerCase().includes('mtn') || selectedPaymentMethod?.toLowerCase().includes('airtel'));


    return (
        <div
            className="hidden md:flex flex-none bg-gray-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] relative flex flex-col transition-all duration-75 ease-linear"
            style={{ height: `${actionsPanelHeight}px` }}
        >
            {/* Drag Handle */}
            <div
                className="bg-slate-50 border-b border-slate-200 cursor-ns-resize flex items-center justify-center py-0 absolute top-0 left-0 right-0 z-10"
                onMouseDown={startResizing}
            >
                <div className="w-12 h-1.5 bg-slate-300 "></div>
            </div>

            {/* Scanner Toggle / Header */}
            <div className="flex items-center justify-between px-4 py-0 mt-2 z-10">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {isScannerOpen ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            Scanning Mode
                        </>
                    ) : (
                        <>
                            <ShoppingCartIcon className="w-4 h-4 text-slate-500" />
                            Checkout Actions
                        </>
                    )}
                </h3>
                <button
                    id="pos-scanner-btn"
                    onClick={() => setIsScannerOpen(!isScannerOpen)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isScannerOpen
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                        }`}
                >
                    {isScannerOpen ? (
                        <>
                            <XMarkIcon className="w-4 h-4" />
                            Stop Scanning
                        </>
                    ) : (
                        <>
                            <QrCodeIcon className="w-4 h-4" />
                            Scan Barcode
                        </>
                    )}
                </button>
            </div>

            {isScannerOpen ? (
                <div className="flex-1 p-4 bg-slate-50/50 overflow-hidden flex flex-col">
                    <div className="flex-1 w-full relative min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                    <p className="text-center text-xs text-slate-500 mt-2">
                        Point camera at a barcode to add to cart
                    </p>
                </div>
            ) : (
                <>
                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-200 bg-gray-50 z-10 flex-none px-4">
                        <button
                            id="pos-tab-customer"
                            onClick={() => setCartActionTab('customer')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${cartActionTab === 'customer'
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            Customer
                        </button>
                        <button
                            id="pos-tab-summary"
                            onClick={() => setCartActionTab('summary')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${cartActionTab === 'summary'
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            Summary
                        </button>
                        <button
                            id="pos-tab-payment"
                            onClick={() => setCartActionTab('payment')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${cartActionTab === 'payment'
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            Payment
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
                        {cart.length > 0 ? (
                            <>
                                {/* Customer Tab Content */}
                                {cartActionTab === 'customer' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <label className="block text-sm font-medium text-slate-900 mb-3">
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
                                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-emerald-900">Store Credit Available</p>
                                                        <p className="text-2xl font-bold text-emerald-700 mt-1">
                                                            {formatCurrency(selectedCustomer.storeCredit, storeSettings)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={onApplyStoreCredit}
                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 ${finalAppliedCredit > 0
                                                            ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                                                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'
                                                            }`}
                                                    >
                                                        {finalAppliedCredit > 0 ? 'Remove Credit' : 'Apply Credit'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Summary Tab Content */}
                                {cartActionTab === 'summary' && (
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                                            <h3 className="font-semibold text-slate-900">Order Summary</h3>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <div className="flex justify-between items-center text-slate-600">
                                                <span>Subtotal</span>
                                                <span className="font-mono text-slate-900">{formatCurrency(subtotal, storeSettings)}</span>
                                            </div>

                                            <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-200">
                                                <span className="text-slate-600">Discount</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-400">{storeSettings.currency.symbol}</span>
                                                    <input
                                                        type="number"
                                                        value={discount}
                                                        onChange={(e) => setDiscount(e.target.value)}
                                                        className="w-28 px-2 py-1 border border-slate-300 rounded text-right text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        placeholder="0.00"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>

                                            {finalAppliedCredit > 0 && (
                                                <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-200">
                                                    <span className="text-slate-600">Store Credit</span>
                                                    <span className="font-mono text-emerald-600 font-medium">-{formatCurrency(finalAppliedCredit, storeSettings)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-200">
                                                <span className="text-slate-600">Tax ({storeSettings.taxRate}%)</span>
                                                <span className="font-mono text-slate-900">{formatCurrency(taxAmount, storeSettings)}</span>
                                            </div>

                                            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-100 mt-2">
                                                <span className="text-lg font-bold text-slate-900">Total</span>
                                                <span className="text-2xl font-bold text-blue-600">{formatCurrency(total, storeSettings)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Tab Content */}
                                {cartActionTab === 'payment' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* Big Total Display */}
                                        <div className="text-center py-2 bg-gradient-to-br flex justify-between px-4 m-auto from-blue-500 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                                            <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Total to Pay</p>
                                            <p className="text-3xl font-bold tracking-tight">{formatCurrency(total, storeSettings)}</p>
                                        </div>

                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                    Payment Method
                                                </label>
                                                <div className="relative group">
                                                    <select
                                                        value={selectedPaymentMethod}
                                                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer hover:bg-slate-100"
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
                                                    <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
                                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
                                                </div>
                                            </div>
                                            {isMobileMoney && (
                                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                        Payer Mobile Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={mobileMoneyNumber}
                                                        onChange={(e) => setMobileMoneyNumber(e.target.value)}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        placeholder="e.g. 0961111111"
                                                    />
                                                </div>
                                            )}

                                            {isCashMethod && (
                                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                        Cash Received
                                                    </label>
                                                    <div className="relative group">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                            {storeSettings.currency.symbol}
                                                        </span>
                                                        <input
                                                            ref={cashInputRef}
                                                            type="number"
                                                            value={cashReceived}
                                                            onChange={(e) => setCashReceived(e.target.value)}
                                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-right text-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    {changeDue > 0 && (
                                                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center animate-in slide-in-from-top-2">
                                                            <span className="text-sm font-medium text-emerald-800">Change Due</span>
                                                            <span className="text-xl font-bold text-emerald-600">
                                                                {formatCurrency(changeDue, storeSettings)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Primary Actions */}
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <button
                                                id="pos-hold-btn"
                                                onClick={onHoldSale}
                                                className="py-3.5 px-4 bg-white border-2 border-amber-100 text-amber-700 font-bold rounded-xl hover:bg-amber-50 hover:border-amber-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <ClockIcon className="w-5 h-5" />
                                                Hold
                                            </button>
                                            <button
                                                id="pos-pay-btn"
                                                onClick={() => processTransaction('paid')}
                                                disabled={total < 0 || (isCashMethod && cashReceivedNumber < total) || isProcessing}
                                                className="py-3.5 px-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95 transform"
                                            >
                                                {isProcessing ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <CreditCardIcon className="w-5 h-5" />
                                                )}
                                                <span className="truncate">
                                                    {isProcessing ? 'Processing' : `Pay ${formatCurrency(total, storeSettings)}`}
                                                </span>
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => processTransaction('invoice')}
                                            disabled={!selectedCustomer || isProcessing}
                                            className="w-full py-3 px-4 bg-slate-50 text-slate-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                        >
                                            <DocumentPlusIcon className="w-5 h-5" />
                                            Charge to Account (Invoice)
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <ShoppingCartIcon className="w-12 h-12 mb-2 opacity-20" />
                                <p className="text-sm">Cart is empty</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
