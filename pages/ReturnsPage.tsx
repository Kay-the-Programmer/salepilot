import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Return, StoreSettings } from '../types';
import { SnackbarType } from '../App';
import Header from '../components/Header';
import QrScannerModal from '../components/sales/QrScannerModal';
import QrCodeIcon from '../components/icons/QrCodeIcon';
import ArrowUturnLeftIcon from '../components/icons/ArrowUturnLeftIcon';
import { formatCurrency } from '../utils/currency';
import ReceiptModal from '../components/sales/ReceiptModal';
import PrinterIcon from '../components/icons/PrinterIcon';

interface ReturnsPageProps {
    sales: Sale[];
    returns: Return[];
    onProcessReturn: (returnInfo: Return) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
}

const returnReasons = ["Unwanted item", "Damaged goods", "Incorrect size/color", "Doesn't match description", "Other"];

const ReturnsPage: React.FC<ReturnsPageProps> = ({ sales, returns, onProcessReturn, showSnackbar, storeSettings }) => {
    const [lookupId, setLookupId] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const taxRate = storeSettings.taxRate / 100;

    // State for the return items being built
    const [itemsToReturn, setItemsToReturn] = useState<{ [productId: string]: { quantity: number; reason: string; addToStock: boolean; name: string; price: number;} }>({});
    const [refundMethod, setRefundMethod] = useState('original_method');

    useEffect(() => {
        // Reset form when a new sale is selected or deselected
        setItemsToReturn({});
        setRefundMethod('original_method');
    }, [selectedSale]);

    const handleLookup = () => {
        const foundSale = sales.find(s => s.transactionId.toLowerCase() === lookupId.toLowerCase().trim());
        if (foundSale) {
            if (foundSale.refundStatus === 'fully_refunded') {
                showSnackbar('This sale has already been fully refunded.', 'error');
                // still show the sale for re-printing receipt
            }
            setSelectedSale(foundSale);
            setLookupId('');
        } else {
            showSnackbar('Sale not found. Please check the Transaction ID.', 'error');
        }
    };
    
    const handleScanSuccess = (decodedText: string) => {
        setLookupId(decodedText);
        const foundSale = sales.find(s => s.transactionId.toLowerCase() === decodedText.toLowerCase().trim());
         if (foundSale) {
            if (foundSale.refundStatus === 'fully_refunded') {
                showSnackbar('This sale has already been fully refunded.', 'error');
            }
            setSelectedSale(foundSale);
        } else {
            showSnackbar('Sale not found from scanned code.', 'error');
        }
        setIsScannerOpen(false);
        setLookupId('');
    };

    const handleReturnQuantityChange = (productId: string, cartItem: Sale['cart'][0], newQuantityStr: string) => {
        const newQuantity = parseInt(newQuantityStr, 10);
        const maxReturnable = cartItem.quantity - (cartItem.returnedQuantity || 0);

        if (isNaN(newQuantity) || newQuantity < 0) return; // Ignore invalid input

        const quantityToSet = Math.min(newQuantity, maxReturnable);

        setItemsToReturn(prev => {
            const updated = { ...prev };
            if (quantityToSet > 0) {
                updated[productId] = {
                    ...updated[productId],
                    quantity: quantityToSet,
                    name: cartItem.name,
                    price: cartItem.price,
                };
            } else {
                delete updated[productId]; // Remove from items to return if quantity is 0
            }
            return updated;
        });
    };
    
    const handleItemDetailChange = (productId: string, field: 'reason' | 'addToStock', value: string | boolean) => {
        if (!itemsToReturn[productId]) return;

        setItemsToReturn(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value
            }
        }));
    };

    const { refundSubtotal, refundDiscount, refundTax, refundTotal } = useMemo(() => {
        if (!selectedSale || Object.keys(itemsToReturn).length === 0) {
            return { refundSubtotal: 0, refundDiscount: 0, refundTax: 0, refundTotal: 0 };
        }

        const refundSubtotal = Object.values(itemsToReturn).reduce((acc, item) => acc + item.price * item.quantity, 0);
        
        // Calculate proportional discount
        const originalSubtotal = selectedSale.cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const proportionOfSale = originalSubtotal > 0 ? refundSubtotal / originalSubtotal : 0;
        const refundDiscount = (selectedSale.discount || 0) * proportionOfSale;

        const taxableAmount = Math.max(0, refundSubtotal - refundDiscount);
        const refundTax = taxableAmount * taxRate;
        const refundTotal = taxableAmount + refundTax;

        return { refundSubtotal, refundDiscount, refundTax, refundTotal };
    }, [itemsToReturn, selectedSale, taxRate]);

    const processReturn = () => {
        if (!selectedSale || refundTotal <= 0) return;

        const returnInfo: Return = {
            id: `RET-${Date.now()}`,
            originalSaleId: selectedSale.transactionId,
            timestamp: new Date().toISOString(),
            returnedItems: Object.entries(itemsToReturn).map(([productId, item]) => ({
                productId,
                productName: item.name,
                quantity: item.quantity,
                reason: item.reason || 'Other',
                addToStock: item.addToStock || false
            })),
            refundAmount: refundTotal,
            refundMethod: refundMethod,
        };
        onProcessReturn(returnInfo);
        setSelectedSale(null); // Go back to lookup screen
    };

    if (!selectedSale) {
        return (
            <>
                <Header title="" />
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-medium text-gray-900">Find a Past Sale</h2>
                        <p className="mt-1 text-sm text-gray-600">Enter the Transaction ID from the receipt or scan the receipt's barcode.</p>
                        <div className="mt-4 flex gap-2">
                             <input
                                type="text"
                                placeholder="Enter Transaction ID (e.g., SALE-1704106800000)"
                                value={lookupId}
                                onChange={(e) => setLookupId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="p-2 border rounded-md bg-white hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Scan Receipt Barcode"
                                title="Scan Receipt Barcode"
                            >
                                <QrCodeIcon className="w-6 h-6" />
                            </button>
                            <button onClick={handleLookup} className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">Find</button>
                        </div>
                    </div>
                    
                     <div className="max-w-4xl mx-auto mt-8">
                        <h3 className="text-lg font-medium text-gray-900">Recent Returns</h3>
                        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                            <ul role="list" className="divide-y divide-gray-200">
                                {returns.slice(0, 10).map((ret) => (
                                    <li key={ret.id}>
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-blue-600 truncate">{ret.id}</p>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        Ref: {ret.originalSaleId}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        <ArrowUturnLeftIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                        {ret.returnedItems.reduce((acc, i) => acc + i.quantity, 0)} items returned
                                                    </p>
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                    <p>
                                                        {new Date(ret.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </main>
                <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} onScanError={(err) => showSnackbar(err, 'error')} />
            </>
        )
    }

    const saleHasCustomer = !!selectedSale.customerId;

    // Return processing view
    return (
        <>
            <div className="flex flex-col h-full">
                <Header title={`Processing Return for Sale: ${selectedSale.transactionId}`} buttonText="Find Another Sale" onButtonClick={() => setSelectedSale(null)} />
                <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 overflow-y-auto bg-gray-100">
                    {/* Left side: Item selection */}
                    <div className="lg:col-span-2 bg-gray-50 p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Select Items to Return</h3>
                            <button
                                onClick={() => setIsReceiptModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                <PrinterIcon className="h-5 w-5 text-gray-500" />
                                Print Receipt
                            </button>
                        </div>
                        <div className="space-y-4">
                            {selectedSale.cart.map(item => {
                                const returnableQty = item.quantity - (item.returnedQuantity || 0);
                                const currentReturn = itemsToReturn[item.productId];
                                if (returnableQty <= 0) {
                                    return (
                                        <div key={item.productId} className="p-4 rounded-md bg-gray-100 opacity-60">
                                            <p className="font-medium text-gray-600">{item.name}</p>
                                            <p className="text-sm text-gray-500">All items have been returned.</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={item.productId} className="p-4 rounded-md border border-gray-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-800">{item.name}</p>
                                                <p className="text-sm text-gray-500">Purchased: {item.quantity} &bull; Price: {formatCurrency(item.price, storeSettings)}</p>
                                            </div>
                                            <div className="w-24">
                                                <label htmlFor={`qty-${item.productId}`} className="block text-sm font-medium text-gray-700 text-right">Return Qty</label>
                                                <input
                                                    type="number"
                                                    id={`qty-${item.productId}`}
                                                    value={currentReturn?.quantity ?? '0'}
                                                    onChange={(e) => handleReturnQuantityChange(item.productId, item, e.target.value)}
                                                    min="0"
                                                    max={returnableQty}
                                                    className="mt-1 block w-full rounded-md border p-1 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-center"
                                                />
                                                <p className="text-xs text-gray-500 text-right">Max: {returnableQty}</p>
                                            </div>
                                        </div>
                                        {currentReturn?.quantity > 0 && (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                                <div>
                                                    <label htmlFor={`reason-${item.productId}`} className="block text-sm font-medium text-gray-700">Reason</label>
                                                    <select
                                                        id={`reason-${item.productId}`}
                                                        value={currentReturn.reason || returnReasons[0]}
                                                        onChange={e => handleItemDetailChange(item.productId, 'reason', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border p-1 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    >
                                                        {returnReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-end">
                                                    <div className="relative flex items-start">
                                                        <div className="flex h-6 items-center">
                                                            <input id={`stock-${item.productId}`} type="checkbox" checked={currentReturn.addToStock || false} onChange={e => handleItemDetailChange(item.productId, 'addToStock', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                                                        </div>
                                                        <div className="ml-3 text-sm leading-6">
                                                            <label htmlFor={`stock-${item.productId}`} className="font-medium text-gray-900">Add back to stock?</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* Right side: Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 p-4 rounded-lg shadow-md sticky top-0">
                            <h3 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">Refund Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(refundSubtotal, storeSettings)}</span></div>
                                <div className="flex justify-between"><span>Discount</span><span className="text-green-600">-{formatCurrency(refundDiscount, storeSettings)}</span></div>
                                <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(refundTax, storeSettings)}</span></div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total Refund</span><span>{formatCurrency(refundTotal, storeSettings)}</span></div>
                            </div>

                            <div className="mt-6">
                                <h4 className="text-md font-semibold text-gray-800 mb-2">Refund Method</h4>
                                <fieldset className="mt-2">
                                    <legend className="sr-only">Refund method</legend>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <input id="original_method" name="refund-method" type="radio" checked={refundMethod === 'original_method'} onChange={() => setRefundMethod('original_method')} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                                            <label htmlFor="original_method" className="ml-3 block text-sm font-medium leading-6 text-gray-900">Original Method</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input id="store_credit" name="refund-method" type="radio" checked={refundMethod === 'store_credit'} onChange={() => setRefundMethod('store_credit')} disabled={!saleHasCustomer || !storeSettings.enableStoreCredit} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50" />
                                            <label htmlFor="store_credit" className={`ml-3 block text-sm font-medium leading-6 text-gray-900 ${!saleHasCustomer || !storeSettings.enableStoreCredit ? 'text-gray-400' : ''}`}>
                                                Store Credit
                                                {!saleHasCustomer && <span className="text-xs"> (Customer required)</span>}
                                                {!storeSettings.enableStoreCredit && <span className="text-xs"> (Disabled)</span>}
                                            </label>
                                        </div>
                                        {(storeSettings.paymentMethods || []).map((method) => (
                                            <div key={method.id} className="flex items-center">
                                                <input id={method.id} name="refund-method" type="radio" checked={refundMethod === method.name} onChange={() => setRefundMethod(method.name)} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                                                <label htmlFor={method.id} className="ml-3 block text-sm font-medium leading-6 text-gray-900">{method.name}</label>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>
                            </div>
                            
                            <div className="mt-6">
                                <button
                                    onClick={processReturn}
                                    disabled={refundTotal <= 0}
                                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                >
                                    Process Refund
                                </button>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
            {selectedSale && (
                <ReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    saleData={selectedSale}
                    showSnackbar={showSnackbar}
                    storeSettings={storeSettings}
                />
            )}
        </>
    );
};

export default ReturnsPage;