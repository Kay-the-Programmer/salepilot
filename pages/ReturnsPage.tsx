import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Return, StoreSettings } from '../types';
import { SnackbarType } from '../App';
import Header from '../components/Header';
import UnifiedScannerModal from '../components/UnifiedScannerModal';
import QrCodeIcon from '../components/icons/QrCodeIcon';
import ArrowUturnLeftIcon from '../components/icons/ArrowUturnLeftIcon';
import { formatCurrency } from '../utils/currency';
import ReceiptModal from '../components/sales/ReceiptModal';
import ReturnDetailsModal from '../components/sales/ReturnDetailsModal';
import PrinterIcon from '../components/icons/PrinterIcon';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import PackageIcon from '../components/icons/PackageIcon';
import { GridIcon, ListIcon } from '../components/icons';
import { StandardCard, StandardRow } from '../components/ui/standard';
import Pagination from '../components/ui/Pagination';
import ListGridToggle from '../components/ui/ListGridToggle';
import UnifiedListGrid from '../components/ui/UnifiedListGrid';

interface ReturnsPageProps {
    sales: Sale[];
    returns: Return[];
    onProcessReturn: (returnInfo: Return) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
}

const returnReasons = ["Unwanted item", "Damaged goods", "Incorrect size/color", "Doesn't match description", "Other"];

// Inline CSS for mobile responsiveness
const styles = `
  .safe-area-padding {
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
  
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .touch-manipulation {
    touch-action: manipulation;
  }
  
  .no-pull-to-refresh {
    overscroll-behavior-y: none;
  }
  
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
  }

  @media (min-width: 769px) {
    .desktop-hover:hover {
      background-color: rgba(243, 244, 246, 1);
    }
  }
  
  @media (max-width: 768px) {
    .mobile-tap-target {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* Glass effect */
  .glass-morphism {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
`;

// Custom media query hook
const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        const updateMatches = () => setMatches(media.matches);
        updateMatches();
        const listener = () => updateMatches();
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

const ReturnsPage: React.FC<ReturnsPageProps> = ({ sales, returns, onProcessReturn, showSnackbar, storeSettings }) => {
    const [lookupId, setLookupId] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    // New State for Details Modal, View Mode, and Pagination
    const [selectedReturnForDetails, setSelectedReturnForDetails] = useState<Return | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // using 'card' as grid equivalent or just grid
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const taxRate = storeSettings.taxRate / 100;

    // Responsive breakpoints
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');
    const isDesktop = !isMobile && !isTablet;

    // State for the return items being built
    const [itemsToReturn, setItemsToReturn] = useState<{ [productId: string]: { quantity: number; reason: string; addToStock: boolean; name: string; price: number; } }>({});
    const [refundMethod, setRefundMethod] = useState('original_method');

    useEffect(() => {
        // Add styles to document head
        const styleElement = document.createElement('style');
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

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

    // Pagination Logic
    const sortedReturns = useMemo(() => [...returns].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [returns]);
    const totalPages = Math.ceil(sortedReturns.length / itemsPerPage);
    const paginatedReturns = useMemo(() => sortedReturns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [sortedReturns, currentPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (!selectedSale) {
        return (
            <div className="flex flex-col h-full bg-gray-50">
                <Header title="Returns & Refunds" />
                <main className="flex-1 overflow-y-auto smooth-scroll safe-area-padding safe-area-bottom">
                    {/* Hero Search Section */}
                    <div className="bg-white border-b border-gray-200 py-12 px-4 shadow-sm">
                        <div className="max-w-2xl mx-auto text-center">
                            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Find a Past Sale</h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Enter the Transaction ID from the receipt or scan the barcode to start a return.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter Transaction ID..."
                                        value={lookupId}
                                        onChange={(e) => setLookupId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsScannerOpen(true)}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center p-3 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mobile-tap-target"
                                        title="Scan Receipt"
                                    >
                                        <QrCodeIcon className="w-6 h-6 mr-2 sm:mr-0" />
                                        <span className="sm:hidden font-medium">Scan QR</span>
                                    </button>
                                    <button
                                        onClick={handleLookup}
                                        className="flex-[2] sm:flex-none inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all mobile-tap-target"
                                    >
                                        Find Sale
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Returns Section */}
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <ArrowUturnLeftIcon className="w-5 h-5 text-blue-600" />
                                    Recent Returns
                                </h3>
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                                    Total: {returns.length} returns
                                </div>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center self-end sm:self-auto">
                                <ListGridToggle
                                    viewMode={viewMode}
                                    onViewModeChange={setViewMode}
                                    size="sm"
                                />
                            </div>
                        </div>

                        {returns.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="mx-auto w-12 h-12 text-gray-300 mb-3">
                                    <ArrowUturnLeftIcon className="w-full h-full" />
                                </div>
                                <p className="text-gray-500">No returns recorded yet.</p>
                            </div>
                        ) : (
                            <>
                                <UnifiedListGrid<Return>
                                    items={paginatedReturns}
                                    viewMode={viewMode}
                                    isLoading={false}
                                    error={null}
                                    selectedId={selectedReturnForDetails?.id}
                                    getItemId={(ret) => ret.id}
                                    onItemClick={(ret) => setSelectedReturnForDetails(ret)}
                                    className="!p-0"
                                    renderGridItem={(ret, _index, isSelected) => (
                                        <StandardCard
                                            title={`Sale Ref: ${ret.originalSaleId}`}
                                            subtitle={ret.id}
                                            status={
                                                <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    {formatCurrency(ret.refundAmount, storeSettings)}
                                                </div>
                                            }
                                            isSelected={isSelected}
                                            onClick={() => setSelectedReturnForDetails(ret)}
                                            secondaryInfo={
                                                <div className="flex items-center justify-between w-full mt-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <CalendarIcon className="w-3.5 h-3.5" />
                                                        {new Date(ret.timestamp).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                                                        {ret.returnedItems.reduce((acc, i) => acc + i.quantity, 0)} items
                                                    </div>
                                                </div>
                                            }
                                        />
                                    )}
                                    renderListItem={(ret, _index, isSelected) => (
                                        <StandardRow
                                            title={`Sale Ref: ${ret.originalSaleId}`}
                                            subtitle={ret.id}
                                            isSelected={isSelected}
                                            onClick={() => setSelectedReturnForDetails(ret)}
                                            primaryMeta={formatCurrency(ret.refundAmount, storeSettings)}
                                            secondaryMeta={new Date(ret.timestamp).toLocaleDateString()}
                                            details={[
                                                <span key="items" className="text-xs text-gray-500">
                                                    {ret.returnedItems.reduce((acc, i) => acc + i.quantity, 0)} items
                                                </span>
                                            ]}
                                            actions={
                                                <div className="text-sm text-blue-600 font-medium whitespace-nowrap px-3 py-1 bg-blue-50 rounded-lg">View</div>
                                            }
                                        />
                                    )}
                                />

                                {/* Pagination Controls */}
                                <Pagination
                                    total={sortedReturns.length}
                                    page={currentPage}
                                    pageSize={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setItemsPerPage}
                                    label="returns"
                                    className="mt-8 !p-0 !bg-transparent !border-none !shadow-none"
                                />
                            </>
                        )}
                    </div>
                </main >
                <UnifiedScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} onScanError={(err) => showSnackbar(err, 'error')} />

                {
                    selectedReturnForDetails && (
                        <ReturnDetailsModal
                            isOpen={!!selectedReturnForDetails}
                            onClose={() => setSelectedReturnForDetails(null)}
                            returnData={selectedReturnForDetails}
                            storeSettings={storeSettings}
                        />
                    )
                }
            </div >
        )
    }

    const saleHasCustomer = !!selectedSale.customerId;

    // Return processing view
    return (
        <>
            <div className="flex flex-col h-full bg-gray-50">
                <Header
                    title={isMobile ? "Process Return" : `Return: ${selectedSale.transactionId}`}
                    buttonText="Find Another Sale"
                    onButtonClick={() => setSelectedSale(null)}
                />

                <main className="flex-1 overflow-y-auto smooth-scroll safe-area-padding safe-area-bottom">
                    <div className={`grid grid-cols-1 ${isDesktop ? 'lg:grid-cols-12' : ''} gap-6 p-4 lg:p-8 max-w-[1600px] mx-auto`}>

                        {/* Left side: Item selection (8 cols on desktop) */}
                        <div className={`${isDesktop ? 'lg:col-span-8' : ''} space-y-6`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Select Items to Return</h3>
                                    <p className="text-sm text-gray-500 mt-1">Adjust quantities for the items you want to refund.</p>
                                </div>
                                <button
                                    onClick={() => setIsReceiptModalOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all border border-gray-200 mobile-tap-target"
                                >
                                    <PrinterIcon className="h-5 w-5 text-gray-500" />
                                    Print Receipt
                                </button>
                            </div>

                            <div className="space-y-4">
                                {selectedSale.cart.map(item => {
                                    const returnableQty = item.quantity - (item.returnedQuantity || 0);
                                    const currentReturn = itemsToReturn[item.productId];
                                    const isReturning = currentReturn?.quantity > 0;

                                    if (returnableQty <= 0) {
                                        return (
                                            <div key={item.productId} className="p-5 rounded-2xl bg-gray-100 border border-gray-200 opacity-60 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-600 line-through">{item.name}</p>
                                                    <p className="text-xs text-gray-500">Fully returned</p>
                                                </div>
                                                <CheckCircleIcon className="w-6 h-6 text-gray-400" />
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={item.productId} className={`p-6 rounded-2xl bg-white border ${isReturning ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'} shadow-sm transition-all`}>
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                                                        {isReturning && <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Selected</span>}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1"><PackageIcon className="w-4 h-4" /> Purchased: {item.quantity}</span>
                                                        <span className="flex items-center gap-1"><CurrencyDollarIcon className="w-4 h-4" /> {formatCurrency(item.price, storeSettings)}</span>
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-32">
                                                    <label htmlFor={`qty-${item.productId}`} className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Quantity</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            id={`qty-${item.productId}`}
                                                            value={currentReturn?.quantity ?? '0'}
                                                            onChange={(e) => handleReturnQuantityChange(item.productId, item, e.target.value)}
                                                            min="0"
                                                            max={returnableQty}
                                                            className="block w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 text-center font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        />
                                                        <p className="mt-1.5 text-[10px] font-bold text-gray-400 text-center uppercase">Max: {returnableQty}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {isReturning && (
                                                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                                    <div>
                                                        <label htmlFor={`reason-${item.productId}`} className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">Reason for Return</label>
                                                        <select
                                                            id={`reason-${item.productId}`}
                                                            value={currentReturn.reason || returnReasons[0]}
                                                            onChange={e => handleItemDetailChange(item.productId, 'reason', e.target.value)}
                                                            className="block w-full rounded-xl border-gray-200 bg-white py-2.5 px-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            {returnReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-end">
                                                        <label className="relative flex items-center p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer w-full hover:bg-gray-100 transition-colors">
                                                            <input
                                                                id={`stock-${item.productId}`}
                                                                type="checkbox"
                                                                checked={currentReturn.addToStock || false}
                                                                onChange={e => handleItemDetailChange(item.productId, 'addToStock', e.target.checked)}
                                                                className="h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-600 transition-all"
                                                            />
                                                            <span className="ml-3 text-sm font-bold text-gray-700">Add back to stock?</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right side: Summary (4 cols on desktop) */}
                        <div className={`${isDesktop ? 'lg:col-span-4' : ''}`}>
                            <div className={`${isDesktop ? 'sticky top-24' : ''} space-y-6`}>
                                {/* Detailed Refund Calculations */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 bg-gray-50 border-b border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900">Refund Summary</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between text-sm text-gray-600 font-medium">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(refundSubtotal, storeSettings)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-green-600 font-bold">
                                            <span>Discount Adjustment</span>
                                            <span>-{formatCurrency(refundDiscount, storeSettings)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600 font-medium pb-4 border-b border-gray-50">
                                            <span>Estimated Tax Refund</span>
                                            <span>{formatCurrency(refundTax, storeSettings)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">Total Refund</span>
                                            <span className="text-2xl font-black text-blue-600">{formatCurrency(refundTotal, storeSettings)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Refund Method Selection */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Refund Method</h4>
                                    <div className="space-y-3">
                                        <label className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${refundMethod === 'original_method' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                                            <input
                                                name="refund-method"
                                                type="radio"
                                                checked={refundMethod === 'original_method'}
                                                onChange={() => setRefundMethod('original_method')}
                                                className="h-5 w-5 border-gray-300 text-blue-600 focus:ring-blue-600"
                                            />
                                            <span className="ml-3 font-bold text-sm">Original Payment Method</span>
                                        </label>

                                        <label className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${refundMethod === 'store_credit' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white hover:bg-gray-50'} ${(!saleHasCustomer || !storeSettings.enableStoreCredit) ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                            <input
                                                name="refund-method"
                                                type="radio"
                                                checked={refundMethod === 'store_credit'}
                                                onChange={() => setRefundMethod('store_credit')}
                                                disabled={!saleHasCustomer || !storeSettings.enableStoreCredit}
                                                className="h-5 w-5 border-gray-300 text-blue-600 focus:ring-blue-600"
                                            />
                                            <div className="ml-3">
                                                <p className="font-bold text-sm text-left">Store Credit</p>
                                                {!saleHasCustomer && <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">Requires Customer</p>}
                                                {!storeSettings.enableStoreCredit && <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">Disabled in Settings</p>}
                                            </div>
                                        </label>

                                        {(storeSettings.paymentMethods || []).map((method) => (
                                            <label key={method.id} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${refundMethod === method.name ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                                                <input
                                                    name="refund-method"
                                                    type="radio"
                                                    checked={refundMethod === method.name}
                                                    onChange={() => setRefundMethod(method.name)}
                                                    className="h-5 w-5 border-gray-300 text-blue-600 focus:ring-blue-600"
                                                />
                                                <span className="ml-3 font-bold text-sm">{method.name}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <button
                                        onClick={processReturn}
                                        disabled={refundTotal <= 0}
                                        className="w-full mt-8 bg-blue-600 text-white font-black py-4 px-6 rounded-2xl shadow-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
                                    >
                                        Complete Refund
                                    </button>
                                </div>
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