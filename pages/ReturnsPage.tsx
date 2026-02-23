import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Return, StoreSettings } from '../types';
import { SnackbarType } from '../App';
import { ArrowLeftIcon, CalendarIcon, CheckCircleIcon, CurrencyDollarIcon, PackageIcon, PrinterIcon, QrCodeIcon, XMarkIcon } from '../components/icons';
import ArrowUturnLeftIcon from '../components/icons/ArrowUturnLeftIcon';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import Header from '../components/Header';
import UnifiedScannerModal from '../components/UnifiedScannerModal';
import { formatCurrency } from '../utils/currency';
import ReceiptModal from '../components/sales/ReceiptModal';
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

const ReturnsPage: React.FC<ReturnsPageProps> = ({ sales, returns, onProcessReturn, showSnackbar, storeSettings }) => {
    const [lookupId, setLookupId] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const [selectedReturnForDetails, setSelectedReturnForDetails] = useState<Return | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isDetailPaneOpen, setIsDetailPaneOpen] = useState(false);

    const isMobile = window.innerWidth <= 768; // We can typically rely on Tailwind `md:`, `lg:` classes instead of doing this via JS for the main layout.
    const isDesktop = window.innerWidth > 1024;


    const taxRate = storeSettings.taxRate / 100;

    // State for the return items being built
    const [itemsToReturn, setItemsToReturn] = useState<{ [productId: string]: { quantity: number; reason: string; addToStock: boolean; name: string; price: number; } }>({});
    const [refundMethod, setRefundMethod] = useState('original_method');

    // Removed manual style injection

    const handleSelectReturn = (ret: Return) => {
        setSelectedReturnForDetails(ret);
        setIsDetailPaneOpen(true);
    };

    const handleCloseDetailPane = () => {
        setIsDetailPaneOpen(false);
        setSelectedReturnForDetails(null);
    };

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
    const paginatedReturns = useMemo(() => sortedReturns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [sortedReturns, currentPage]);


    if (!selectedSale) {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
                <Header title="Returns & Refunds" />
                <main className="flex-1 overflow-hidden flex flex-col">
                    {/* Hero Search Section - Fixed at top of main */}
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 py-12 px-4 shadow-sm flex-none">
                        <div className="max-w-2xl mx-auto text-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl tracking-tight">Find a Past Sale</h2>
                            <p className="mt-2 text-sm font-medium text-gray-500 dark:text-slate-400">
                                Enter the Transaction ID from the receipt or scan the barcode to start a return.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter Transaction ID..."
                                        value={lookupId}
                                        onChange={(e) => setLookupId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                        className="block w-full pl-10 pr-3 py-4 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-bold transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsScannerOpen(true)}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center p-4 border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mobile-tap-target shadow-sm active:scale-95 transition-all duration-300"
                                        title="Scan Receipt"
                                    >
                                        <QrCodeIcon className="w-6 h-6 mr-2 sm:mr-0" />
                                        <span className="sm:hidden font-bold uppercase tracking-widest text-[10px]">Scan QR</span>
                                    </button>
                                    <button
                                        onClick={handleLookup}
                                        className="flex-[2] sm:flex-none inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-95 transition-all duration-300"
                                    >
                                        Find Sale
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content - Split Layout */}
                    <div className="flex-1 flex gap-6 overflow-hidden p-4 md:p-6 max-w-[1400px] mx-auto w-full">
                        {/* Left side: List (main content) */}
                        <div className={`flex-1 flex flex-col overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm transition-all ${isDetailPaneOpen && isMobile ? 'hidden' : 'flex'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-slate-200/50 dark:border-white/10 gap-4">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                                        <ArrowUturnLeftIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        Recent Returns
                                    </h3>
                                    <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                        Total Scope: {returns.length} returns
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <ListGridToggle
                                        viewMode={viewMode}
                                        onViewModeChange={setViewMode}
                                        size="sm"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                {returns.length === 0 ? (
                                    <div className="text-center py-12 px-4 h-full flex flex-col items-center justify-center">
                                        <div className="mx-auto w-16 h-16 text-gray-200 dark:text-slate-800 mb-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
                                            <ArrowUturnLeftIcon className="w-10 h-10" />
                                        </div>
                                        <p className="text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">No returns recorded yet.</p>
                                    </div>
                                ) : (
                                    <UnifiedListGrid<Return>
                                        items={paginatedReturns}
                                        viewMode={viewMode}
                                        isLoading={false}
                                        error={null}
                                        selectedId={selectedReturnForDetails?.id}
                                        getItemId={(ret) => ret.id}
                                        onItemClick={handleSelectReturn}
                                        className="!p-4"
                                        renderGridItem={(ret, _index, isSelected) => (
                                            <StandardCard
                                                title={`Sale Ref: ${ret.originalSaleId}`}
                                                subtitle={ret.id}
                                                status={
                                                    <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-3 py-1 rounded-full text-xs shadow-sm">
                                                        {formatCurrency(ret.refundAmount, storeSettings)}
                                                    </div>
                                                }
                                                isSelected={isSelected}
                                                onClick={() => handleSelectReturn(ret)}
                                                secondaryInfo={
                                                    <div className="flex items-center justify-between w-full mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                                            <CalendarIcon className="w-3.5 h-3.5" />
                                                            {new Date(ret.timestamp).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">
                                                            {ret.returnedItems.reduce((acc, i) => acc + i.quantity, 0)} units
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
                                                onClick={() => handleSelectReturn(ret)}
                                                primaryMeta={formatCurrency(ret.refundAmount, storeSettings)}
                                                secondaryMeta={new Date(ret.timestamp).toLocaleDateString()}
                                                details={[
                                                    <span key="items" className="text-xs font-medium text-gray-500 dark:text-slate-400">
                                                        {ret.returnedItems.reduce((acc, i) => acc + i.quantity, 0)} Items Returned
                                                    </span>
                                                ]}
                                                actions={
                                                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap px-4 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl transition-colors hover:bg-blue-100 dark:hover:bg-blue-500/20">View Analysis</div>
                                                }
                                            />
                                        )}
                                    />
                                )}
                            </div>

                            {returns.length > 0 && (
                                <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                                    <Pagination
                                        total={sortedReturns.length}
                                        page={currentPage}
                                        pageSize={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                        onPageSizeChange={setItemsPerPage}
                                        label="returns"
                                        compact={isMobile}
                                        className="!p-0 !bg-transparent !border-none !shadow-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right side: Detail Pane */}
                        {(isDesktop || (isMobile && isDetailPaneOpen)) && selectedReturnForDetails && (
                            <div className={`${isMobile ? 'fixed inset-0 z-50 bg-gray-50 dark:bg-slate-950 flex flex-col' : 'w-full lg:w-[450px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden glass-effect animate-slide-left'}`}>
                                {/* Detail Header */}
                                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        {isMobile && (
                                            <button onClick={handleCloseDetailPane} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95 transition-all duration-300">
                                                <ArrowLeftIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                            </button>
                                        )}
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Return Analysis</h3>
                                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest font-mono">{selectedReturnForDetails.id}</p>
                                        </div>
                                    </div>
                                    {!isMobile && (
                                        <button onClick={handleCloseDetailPane} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all text-gray-400 dark:text-slate-500 active:scale-95 transition-all duration-300">
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Detail Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                    {/* Meta Info Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 dark:bg-blue-500/10 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-500/20">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                                                <CalendarIcon className="w-4 h-4" />
                                                <span className="text-xs font-semibold uppercase tracking-wider">Recorded On</span>
                                            </div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-lg tracking-tight">
                                                {new Date(selectedReturnForDetails.timestamp).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">
                                                {new Date(selectedReturnForDetails.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                                                <PackageIcon className="w-4 h-4" />
                                                <span className="text-xs font-semibold uppercase tracking-wider">Source Sale</span>
                                            </div>
                                            <p className="font-mono font-black text-gray-900 dark:text-white text-lg tracking-tight">
                                                {selectedReturnForDetails.originalSaleId}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items Analysis */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 dark:border-white/10 pb-2">
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Returned Inventory</h4>
                                            <span className="bg-slate-900 dark:bg-blue-600 text-white px-2 py-0.5 rounded-lg text-xs font-semibold">
                                                {selectedReturnForDetails.returnedItems.length} SKU
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {selectedReturnForDetails.returnedItems.map((item, index) => (
                                                <div key={index} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] p-5 border border-slate-200/50 dark:border-white/10 shadow-sm flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900 dark:text-white tracking-tight text-sm leading-tight">{item.productName}</p>
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-white/5 rounded-lg text-slate-600 dark:text-slate-400">
                                                                Qty: {item.quantity}
                                                            </span>
                                                            {item.addToStock && (
                                                                <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center gap-1.5 border border-emerald-100/50 dark:border-emerald-500/20">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    Restocked
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider mb-1.5">Resolution</span>
                                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-xl border border-blue-100/50 dark:border-blue-500/20 inline-block">
                                                            {item.reason}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Financial Settlement */}
                                    <div className="bg-slate-900 dark:bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-900/20 dark:shadow-none relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
                                                <div>
                                                    <p className="text-white/50 text-[10px] uppercase tracking-widest font-black mb-1">Settlement Method</p>
                                                    <p className="font-black text-sm text-white capitalize tracking-wide flex items-center gap-2 uppercase">
                                                        {selectedReturnForDetails.refundMethod.replace('_', ' ')}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-white/10 rounded-2xl">
                                                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white/50 font-black uppercase tracking-widest text-[10px] mb-2">Total Financial Refund</span>
                                                <span className="text-4xl font-black tracking-tighter text-white">
                                                    {formatCurrency(selectedReturnForDetails.refundAmount, storeSettings)}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Decorative Background Element */}
                                        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main >

                <UnifiedScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} onScanError={(err) => showSnackbar(err, 'error')} />
            </div >
        )
    }

    const saleHasCustomer = !!selectedSale.customerId;

    // Return processing view
    return (
        <>
            <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
                <Header
                    title={isMobile ? "Process Return" : `Return: ${selectedSale.transactionId}`}
                    buttonText="Find Another Sale"
                    onButtonClick={() => setSelectedSale(null)}
                />

                <main className="flex-1 overflow-y-auto smooth-scroll safe-area-padding safe-area-bottom">
                    <div className={`grid grid-cols-1 ${isDesktop ? 'lg:grid-cols-12' : ''} gap-6 p-4 lg:p-8 max-w-[1600px] mx-auto`}>

                        {/* Left side: Item selection (8 cols on desktop) */}
                        <div className={`${isDesktop ? 'lg:col-span-8' : ''} space-y-6`}>
                            <div className="liquid-glass-card rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 dark:bg-slate-900 p-6 border border-gray-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Items to Return</h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Adjust quantities for the items you want to refund.</p>
                                </div>
                                <button
                                    onClick={() => setIsReceiptModalOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700 mobile-tap-target active:scale-95 transition-all duration-300"
                                >
                                    <PrinterIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
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
                                            <div key={item.productId} className="p-5 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-800 opacity-60 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-600 dark:text-slate-400 line-through">{item.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-500">Fully returned</p>
                                                </div>
                                                <CheckCircleIcon className="w-6 h-6 text-gray-400 dark:text-slate-600" />
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={item.productId} className={`p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border ${isReturning ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200/50 dark:border-white/10'} shadow-sm transition-all`}>
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900 dark:text-white text-lg">{item.name}</p>
                                                        {isReturning && <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-md">Selected</span>}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-slate-500">
                                                        <span className="flex items-center gap-1.5"><PackageIcon className="w-4 h-4" /> Purchased: {item.quantity}</span>
                                                        <span className="flex items-center gap-1.5"><CurrencyDollarIcon className="w-4 h-4" /> {formatCurrency(item.price, storeSettings)}</span>
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-32">
                                                    <label htmlFor={`qty-${item.productId}`} className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Quantity</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            id={`qty-${item.productId}`}
                                                            value={currentReturn?.quantity ?? '0'}
                                                            onChange={(e) => handleReturnQuantityChange(item.productId, item, e.target.value)}
                                                            min="0"
                                                            max={returnableQty}
                                                            className="block w-full rounded-xl border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-2.5 text-center font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        />
                                                        <p className="mt-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 text-center uppercase">Max: {returnableQty}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {isReturning && (
                                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                                    <div>
                                                        <label htmlFor={`reason-${item.productId}`} className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-left">Reason for Return</label>
                                                        <select
                                                            id={`reason-${item.productId}`}
                                                            value={currentReturn.reason || returnReasons[0]}
                                                            onChange={e => handleItemDetailChange(item.productId, 'reason', e.target.value)}
                                                            className="block w-full rounded-xl border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white py-2.5 px-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            {returnReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-end">
                                                        <label className="relative flex items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 cursor-pointer w-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors active:scale-95 transition-all duration-300">
                                                            <input
                                                                id={`stock-${item.productId}`}
                                                                type="checkbox"
                                                                checked={currentReturn.addToStock || false}
                                                                onChange={e => handleItemDetailChange(item.productId, 'addToStock', e.target.checked)}
                                                                className="h-5 w-5 rounded-md border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 transition-all bg-white dark:bg-slate-800"
                                                            />
                                                            <span className="ml-3 text-sm font-bold text-gray-700 dark:text-slate-300">Add back to stock?</span>
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
                                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-sm">
                                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-white/10">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Refund Summary</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400 font-medium">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(refundSubtotal, storeSettings)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-green-600 dark:text-emerald-400 font-semibold">
                                            <span>Discount Adjustment</span>
                                            <span>-{formatCurrency(refundDiscount, storeSettings)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400 font-medium pb-4 border-b border-slate-100 dark:border-white/10">
                                            <span>Estimated Tax Refund</span>
                                            <span>{formatCurrency(refundTax, storeSettings)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Total Refund</span>
                                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(refundTotal, storeSettings)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Refund Method Selection */}
                                <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6">
                                    <h4 className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Refund Method</h4>
                                    <div className="space-y-3">
                                        <label className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${refundMethod === 'original_method' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                            <input
                                                name="refund-method"
                                                type="radio"
                                                checked={refundMethod === 'original_method'}
                                                onChange={() => setRefundMethod('original_method')}
                                                className="h-5 w-5 border-gray-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 focus:ring-blue-600 bg-white dark:bg-slate-800"
                                            />
                                            <span className="ml-3 font-bold text-sm dark:text-slate-200">Original Payment Method</span>
                                        </label>

                                        <label className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${refundMethod === 'store_credit' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'} ${(!saleHasCustomer || !storeSettings.enableStoreCredit) ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                            <input
                                                name="refund-method"
                                                type="radio"
                                                checked={refundMethod === 'store_credit'}
                                                onChange={() => setRefundMethod('store_credit')}
                                                disabled={!saleHasCustomer || !storeSettings.enableStoreCredit}
                                                className="h-5 w-5 border-gray-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 focus:ring-blue-600 bg-white dark:bg-slate-800"
                                            />
                                            <div className="ml-3 text-left">
                                                <p className="font-bold text-sm dark:text-slate-200">Store Credit</p>
                                                {!saleHasCustomer && <p className="text-[10px] font-bold uppercase tracking-tight opacity-70 dark:text-slate-500">Requires Customer</p>}
                                                {!storeSettings.enableStoreCredit && <p className="text-[10px] font-bold uppercase tracking-tight opacity-70 dark:text-slate-500">Disabled in Settings</p>}
                                            </div>
                                        </label>

                                        {(storeSettings.paymentMethods || []).map((method) => (
                                            <label key={method.id} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${refundMethod === method.name ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                                <input
                                                    name="refund-method"
                                                    type="radio"
                                                    checked={refundMethod === method.name}
                                                    onChange={() => setRefundMethod(method.name)}
                                                    className="h-5 w-5 border-gray-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 focus:ring-blue-600 bg-white dark:bg-slate-800"
                                                />
                                                <span className="ml-3 font-bold text-sm dark:text-slate-200">{method.name}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <button
                                        onClick={processReturn}
                                        disabled={refundTotal <= 0}
                                        className="w-full mt-8 bg-blue-600 text-white font-black py-4 px-6 rounded-2xl shadow-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.98] transition-all uppercase tracking-widest text-sm active:scale-95 transition-all duration-300"
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