import React, { useEffect, useRef, useState } from 'react';
import { CartItem, Customer, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import {
    ShoppingCartIcon,
    CreditCardIcon,
    ClockIcon,
    DocumentPlusIcon,
    UserIcon,
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

// Payment method chip configuration
const getPaymentIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cash')) return '💵';
    if (lower.includes('card') || lower.includes('credit') || lower.includes('debit')) return '💳';
    if (lower.includes('mobile') || lower.includes('mtn') || lower.includes('airtel') || lower.includes('lenco')) return '📱';
    return '💰';
};

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
    const isCashMethod = (selectedPaymentMethod || '').toLowerCase().includes('cash');
    const isMobileMoney = ['mobile', 'lenco', 'mtn', 'airtel'].some(k =>
        (selectedPaymentMethod || '').toLowerCase().includes(k)
    );
    const cashReceivedNumber = parseFloat(cashReceived || '0') || 0;

    const paymentMethods = (storeSettings.paymentMethods && storeSettings.paymentMethods.length > 0)
        ? storeSettings.paymentMethods
        : [{ id: 'pm_cash', name: 'Cash' }, { id: 'pm_card', name: 'Card' }];

    const tabItems = [
        { id: 'customer' as const, label: 'Customer', icon: <UserIcon className="w-3.5 h-3.5" /> },
        { id: 'summary' as const, label: 'Summary', icon: <ShoppingCartIcon className="w-3.5 h-3.5" /> },
        { id: 'payment' as const, label: 'Payment', icon: <CreditCardIcon className="w-3.5 h-3.5" /> },
    ];

    const isPayDisabled = cart.length === 0 || total < 0 || (isCashMethod && cashReceivedNumber < total) || isProcessing;

    // Quick cash amounts
    const quickAmounts = total > 0
        ? [total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500]
            .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
            .slice(0, 4)
        : [];

    return (
        <div className="hidden md:flex flex-none bg-white dark:bg-slate-900/95 border-t border-slate-200/60 dark:border-white/8 flex-col"
            style={{ height: '400px' }}>

            {isScannerOpen ? (
                <div className="flex-1 p-4 overflow-hidden flex flex-col">
                    <div className="flex-1 w-full relative min-h-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
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
                <div className="flex flex-col h-full">
                    {/* Tab Bar */}
                    <div className="flex-none px-3 pt-3">
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1" role="tablist">
                            {tabItems.map(tab => (
                                <button
                                    key={tab.id}
                                    id={`pos-tab-${tab.id}`}
                                    role="tab"
                                    aria-selected={cartActionTab === tab.id}
                                    onClick={() => setCartActionTab(tab.id)}
                                    className={`
                                        flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl
                                        transition-all duration-200 focus:outline-none active:scale-95
                                        ${cartActionTab === tab.id
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
                                    `}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0" role="tabpanel">
                        {cart.length > 0 ? (
                            <>
                                {/* ── Customer Tab ── */}
                                {cartActionTab === 'customer' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                                Select Customer
                                            </label>
                                            <CustomerSelect
                                                customers={customers}
                                                selectedCustomer={selectedCustomer}
                                                onSelectCustomer={c => {
                                                    setSelectedCustomer(c);
                                                    setAppliedStoreCredit(0);
                                                }}
                                            />
                                        </div>
                                        {selectedCustomer && selectedCustomer.storeCredit > 0 && storeSettings.enableStoreCredit && (
                                            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                                                <div>
                                                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                                        Store Credit
                                                    </p>
                                                    <p className="text-2xl font-light text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                                                        {formatCurrency(selectedCustomer.storeCredit, storeSettings)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={onApplyStoreCredit}
                                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${finalAppliedCredit > 0
                                                        ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}
                                                >
                                                    {finalAppliedCredit > 0 ? 'Remove' : 'Apply'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Summary Tab ── */}
                                {cartActionTab === 'summary' && (
                                    <div className="space-y-0">
                                        {[
                                            { label: 'Subtotal', value: formatCurrency(subtotal, storeSettings) },
                                            ...(finalAppliedCredit > 0 ? [{ label: 'Store Credit', value: `−${formatCurrency(finalAppliedCredit, storeSettings)}`, color: 'text-emerald-600 dark:text-emerald-400' }] : []),
                                            { label: `Tax (${storeSettings.taxRate}%)`, value: formatCurrency(taxAmount, storeSettings) },
                                        ].map(row => (
                                            <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
                                                <span className={`text-sm font-medium tabular-nums ${(row as any).color || 'text-slate-800 dark:text-slate-200'}`}>{row.value}</span>
                                            </div>
                                        ))}

                                        {/* Discount row */}
                                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5">
                                            <span className="text-sm text-slate-500 dark:text-slate-400">Discount</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-300 dark:text-slate-600">{storeSettings.currency.symbol}</span>
                                                <input
                                                    type="number"
                                                    value={discount}
                                                    onChange={e => setDiscount(e.target.value)}
                                                    aria-label="Discount amount"
                                                    className="w-24 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-right text-sm font-medium tabular-nums focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-slate-800 dark:text-white"
                                                    placeholder="0.00" min="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="flex justify-between items-center pt-3 mt-1">
                                            <span className="text-base font-bold text-slate-900 dark:text-white">Total</span>
                                            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                                                {formatCurrency(total, storeSettings)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* ── Payment Tab ── */}
                                {cartActionTab === 'payment' && (
                                    <div className="space-y-4">
                                        {/* Big Total */}
                                        <div className="text-center py-2">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Due</p>
                                            <p className="text-[2.75rem] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                                                {formatCurrency(total, storeSettings)}
                                            </p>
                                        </div>

                                        {/* Payment Method Chips */}
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Payment Method</p>
                                            <div className={`grid gap-2 ${paymentMethods.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                                {paymentMethods.map(method => {
                                                    const isSelected = selectedPaymentMethod === method.name;
                                                    return (
                                                        <button
                                                            key={method.id}
                                                            onClick={() => setSelectedPaymentMethod(method.name)}
                                                            className={`
                                                                flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl text-xs font-semibold
                                                                border-2 transition-all duration-150 active:scale-95
                                                                ${isSelected
                                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-[0_0_0_1px_rgba(99,102,241,0.3)]'
                                                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'}
                                                            `}
                                                        >
                                                            <span className="text-base leading-none">{getPaymentIcon(method.name)}</span>
                                                            <span className="truncate max-w-full text-center">{method.name}</span>
                                                        </button>
                                                    );
                                                })}
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
                                                    onChange={e => setMobileMoneyNumber(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
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
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
                                                        {storeSettings.currency.symbol}
                                                    </span>
                                                    <input
                                                        id="cash-received-input"
                                                        ref={cashInputRef}
                                                        type="number"
                                                        value={cashReceived}
                                                        onChange={e => setCashReceived(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-white/10 rounded-2xl text-right text-lg font-bold tabular-nums text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                {/* Quick Amount Chips */}
                                                {quickAmounts.length > 0 && (
                                                    <div className="flex gap-1.5 mt-2">
                                                        {quickAmounts.map((amt, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setCashReceived(String(amt))}
                                                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl border transition-all active:scale-95
                                                                    ${parseFloat(cashReceived) === amt
                                                                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/50'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}
                                                            >
                                                                {i === 0 ? 'Exact' : formatCurrency(amt, storeSettings)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {changeDue > 0 && (
                                                    <div className="flex justify-between items-center mt-2.5 py-2.5 px-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
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
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-4">
                                <ShoppingCartIcon className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-2" />
                                <p className="text-sm text-slate-400 dark:text-slate-600">Add items to begin checkout</p>
                            </div>
                        )}
                    </div>

                    {/* ── Action Buttons — always at bottom ── */}
                    <div className="flex-none px-3 pb-3 pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                            {/* Hold */}
                            <button
                                id="pos-hold-btn"
                                onClick={onHoldSale}
                                disabled={cart.length === 0}
                                aria-label="Hold sale"
                                className="col-span-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex flex-col items-center justify-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                            >
                                <ClockIcon className="w-4 h-4" />
                                <span className="text-[10px]">Hold</span>
                            </button>

                            {/* Pay Button */}
                            <button
                                id="pos-pay-btn"
                                onClick={() => processTransaction('paid')}
                                disabled={isPayDisabled}
                                aria-label={`Charge ${formatCurrency(total, storeSettings)}`}
                                className="col-span-3 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-extrabold text-base flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-500/30"
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

                        {/* Invoice */}
                        <button
                            onClick={() => processTransaction('invoice')}
                            disabled={!selectedCustomer || isProcessing || cart.length === 0}
                            aria-label="Create invoice"
                            className="w-full py-2.5 text-sm text-slate-500 dark:text-slate-400 font-semibold bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/8 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl active:scale-95 transition-all"
                        >
                            <DocumentPlusIcon className="w-4 h-4" />
                            {!selectedCustomer ? 'Select a customer to invoice' : 'Create Invoice'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
