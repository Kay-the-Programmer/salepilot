import { useState, useMemo, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { PurchaseOrder, Supplier, Product, POItem, StoreSettings } from '../types';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PlusIcon from '../components/icons/PlusIcon';
import { SnackbarType } from '../App';
import XMarkIcon from '../components/icons/XMarkIcon';
import TruckIcon from '../components/icons/TruckIcon';
import PackageIcon from '../components/icons/PackageIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import InformationCircleIcon from '../components/icons/InformationCircleIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import Pagination from '../components/ui/Pagination';
import ListGridToggle from '../components/ui/ListGridToggle';
import POList from '../components/purchase-orders/POList';
import StatusBadge from '../components/purchase-orders/StatusBadge';
import GridIcon from '../components/icons/GridIcon'; // Keeping for mobile menu
import { formatCurrency } from '../utils/currency';

interface PurchaseOrdersPageProps {
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
    onSave: (po: PurchaseOrder) => Promise<void> | void;
    onDelete: (poId: string) => Promise<void> | void;
    onReceiveItems: (poId: string, receivedItems: { productId: string, quantity: number }[]) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    isLoading: boolean;
    error: string | null;
    storeSettings: StoreSettings;
}

type ViewState =
    | { mode: 'list' }
    | { mode: 'detail'; po: PurchaseOrder }
    | { mode: 'form'; po?: PurchaseOrder };



export function ReceiveStockModal({ isOpen, onClose, po, onReceive, storeSettings }: {
    isOpen: boolean;
    onClose: () => void;
    po: PurchaseOrder;
    onReceive: (receivedItems: { productId: string, quantity: number }[]) => void;
    storeSettings: StoreSettings;
}) {
    const [receivedQuantities, setReceivedQuantities] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen) {
            setReceivedQuantities({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const itemsToReceive = po.items.filter(item => item.receivedQuantity < item.quantity);

    const handleQuantityChange = (productId: string, value: string, max: number) => {
        const numValue = parseInt(value, 10);
        if (value === '' || (numValue >= 0 && numValue <= max)) {
            setReceivedQuantities(prev => ({ ...prev, [productId]: value }));
        }
    };

    const handleReceiveAll = () => {
        const allReceived = itemsToReceive.reduce((acc, item) => {
            const remaining = item.quantity - item.receivedQuantity;
            acc[item.productId] = remaining.toString();
            return acc;
        }, {} as { [key: string]: string });
        setReceivedQuantities(allReceived);
    };

    const handleSubmit = () => {
        const finalReceivedItems = Object.entries(receivedQuantities)
            .map(([productId, quantityStr]) => ({
                productId,
                quantity: parseInt(quantityStr, 10)
            }))
            .filter(item => !isNaN(item.quantity) && item.quantity > 0);

        if (finalReceivedItems.length > 0) {
            onReceive(finalReceivedItems);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
            <div
                glass-effect=""
                className="bg-white/95 dark:bg-slate-900/80 w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-2xl border border-gray-100 dark:border-slate-700/50"
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS-style drag handle for mobile */}
                <div className="sm:hidden pt-2 pb-0 flex justify-center">
                    <div className="w-10 h-1 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="px-6 pt-5 pb-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100" id="modal-title">
                                Receive Stock
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                                PO #{po.poNumber} • {po.supplierName}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-full transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    {itemsToReceive.length > 0 ? (
                        <div className="space-y-4">
                            {itemsToReceive.map(item => {
                                const remaining = item.quantity - item.receivedQuantity;
                                return (
                                    <div key={item.productId} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {item.productName}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                    SKU: {item.sku}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(item.costPrice, storeSettings)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-slate-500">each</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            <div className="text-center">
                                                <div className="text-sm font-medium text-gray-700 dark:text-slate-300">Ordered</div>
                                                <div className="text-lg font-bold text-gray-900 dark:text-white">{item.quantity}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm font-medium text-gray-700 dark:text-slate-300">Received</div>
                                                <div className="text-lg font-bold text-green-600 dark:text-emerald-400">{item.receivedQuantity}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm font-medium text-gray-700 dark:text-slate-300">Remaining</div>
                                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{remaining}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                Receiving Now
                                            </label>
                                            <input
                                                type="number"
                                                value={receivedQuantities[item.productId] ?? ''}
                                                onChange={(e) => handleQuantityChange(item.productId, e.target.value, remaining)}
                                                min="0"
                                                max={remaining}
                                                placeholder="0"
                                                className="w-full px-4 py-3 text-center text-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                                <PackageIcon className="w-8 h-8 text-green-600 dark:text-emerald-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                All Items Received
                            </h4>
                            <p className="text-gray-500 dark:text-slate-400">
                                This purchase order has been fully received.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        {itemsToReceive.length > 0 && (
                            <button
                                onClick={handleReceiveAll}
                                className="flex-1 px-4 py-2 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                Receive All
                            </button>
                        )}
                    </div>
                    {itemsToReceive.length > 0 && (
                        <button
                            onClick={handleSubmit}
                            disabled={Object.values(receivedQuantities).every(val => !val || parseInt(val) === 0)}
                            className="w-full sm:w-auto sm:min-w-[160px] px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            Confirm Receipt
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export function PurchaseOrderForm({ poToEdit, suppliers, products, onSave, onCancel, showSnackbar, storeSettings, initialSupplierId, isLoading }: {
    poToEdit?: PurchaseOrder;
    suppliers: Supplier[];
    products: Product[];
    onSave: (po: PurchaseOrder, placeOrder: boolean) => void;
    onCancel: () => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
    initialSupplierId?: string;
    isLoading: boolean;
}) {
    const [po, setPo] = useState<Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>>(() => {
        if (poToEdit) return { ...poToEdit };
        // Pre-fill supplier if provided
        const prefillSupplier = initialSupplierId ? suppliers.find(s => s.id === initialSupplierId) : null;

        return {
            supplierId: prefillSupplier?.id || '',
            supplierName: prefillSupplier?.name || '',
            status: 'draft',
            items: [],
            notes: '',
            subtotal: 0,
            shippingCost: 0,
            tax: 0,
            total: 0,
            expectedAt: undefined,
            isMarketplaceOrder: !!prefillSupplier?.linkedStoreId
        };
    });

    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const supplierId = e.target.value;
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
            setPo(prev => ({ ...prev, supplierId: supplier.id, supplierName: supplier.name, items: [] }));
        }
    };

    const addProductToPO = (product: Product, quantity: number = 1) => {
        setPo(prev => {
            const exists = prev.items.some(item => item.productId === product.id);
            if (exists) {
                showSnackbar("Product is already in this PO.", "info");
                return prev;
            }
            const newItem: POItem = {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                quantity: quantity,
                costPrice: product.costPrice || 0,
                receivedQuantity: 0,
            };
            return { ...prev, items: [...prev.items, newItem] };
        });
    };

    const updateItem = (productId: string, field: 'quantity' | 'costPrice', value: number) => {
        setPo(prev => ({
            ...prev,
            items: prev.items.map(item => item.productId === productId ? { ...item, [field]: value } : item)
        }));
    };

    const removeItem = (productId: string) => {
        setPo(prev => ({
            ...prev,
            items: prev.items.filter(item => item.productId !== productId)
        }));
        showSnackbar("Item removed from order", "info");
    };

    useEffect(() => {
        const subtotal = po.items.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
        const tax = subtotal * (storeSettings.taxRate / 100);
        const total = subtotal + po.shippingCost + tax;
        setPo(prev => ({ ...prev, subtotal, tax, total }));
    }, [po.items, po.shippingCost, storeSettings.taxRate]);

    const availableProducts = useMemo(() => {
        if (!po.supplierId) return [];
        return products.filter(p => p.supplierId === po.supplierId && p.status === 'active');
    }, [po.supplierId, products]);

    const suggestedProducts = useMemo(() => {
        if (!po.supplierId) return [];
        return products
            .filter(p => p.supplierId === po.supplierId && typeof p.reorderPoint !== 'undefined' && p.stock < p.reorderPoint)
            .map(p => {
                const targetStock = (p.reorderPoint || 0) + (p.safetyStock || 0);
                const suggestedQty = Math.max(1, targetStock - p.stock);
                return { ...p, suggestedQty };
            });
    }, [po.supplierId, products]);

    const handleAddAllSuggested = () => {
        let addedCount = 0;
        setPo(prev => {
            const currentItems = new Set(prev.items.map(i => i.productId));
            const itemsToAdd: POItem[] = suggestedProducts
                .filter(p => !currentItems.has(p.id))
                .map(p => {
                    addedCount++;
                    return {
                        productId: p.id,
                        productName: p.name,
                        sku: p.sku,
                        quantity: p.suggestedQty,
                        costPrice: p.costPrice || 0,
                        receivedQuantity: 0,
                    };
                });

            if (addedCount === 0) {
                showSnackbar("All suggested products are already in the PO.", "info");
                return prev;
            }

            return { ...prev, items: [...prev.items, ...itemsToAdd] };
        });
        if (addedCount > 0) {
            showSnackbar(`Added ${addedCount} suggested products to the PO.`, "success");
        }
    };

    const handleSaveAndExit = (placeOrder: boolean) => {
        onSave({
            ...po,
            id: poToEdit?.id || `po_${Date.now()}`,
            poNumber: poToEdit?.poNumber || `PO-${Date.now().toString().slice(-6)}`,
            createdAt: poToEdit?.createdAt || new Date().toISOString()
        }, placeOrder);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-[2px] border-b border-gray-200 dark:border-slate-800 px-4 py-3 sm:px-6 flex-shrink-0">
                <div className="flex items-center">
                    <button
                        onClick={onCancel}
                        className="p-2 -ml-2 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <div className="ml-3">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {poToEdit ? `Edit PO #${poToEdit.poNumber}` : 'New Purchase Order'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            {poToEdit ? 'Update purchase order details' : 'Create a new purchase order'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Content - Scrollable Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
                <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-24 space-y-6">
                    {/* Supplier Selection */}
                    <div id="po-supplier-select" glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <TruckIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                            Supplier Selection
                        </h3>
                        <div className="relative">
                            <select
                                id="supplierId"
                                value={po.supplierId}
                                onChange={handleSupplierChange}
                                className="w-full px-4 py-3 text-base bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-900 dark:text-white"
                                disabled={!!poToEdit}
                            >
                                <option value="" disabled className="dark:bg-slate-800">Select a supplier...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id} className="dark:bg-slate-800">
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronRightIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 dark:text-slate-500 pointer-events-none" />
                        </div>
                        {poToEdit && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                                Supplier cannot be changed after a PO is created.
                            </p>
                        )}
                    </div>

                    {/* Products Section */}
                    {po.supplierId && (
                        <div className="space-y-6">
                            {/* Add Products */}
                            <div id="po-available-products" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Available Products */}
                                <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <PackageIcon className="w-5 h-5 text-blue-500" />
                                            Available Products
                                        </h4>
                                        <span className="text-sm text-gray-500 dark:text-slate-400">
                                            {availableProducts.length} items
                                        </span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                                        {availableProducts.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => addProductToPO(p)}
                                                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-slate-400">
                                                        SKU: {p.sku}
                                                    </div>
                                                </div>
                                                <PlusIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                            </button>
                                        ))}
                                        {availableProducts.length === 0 && (
                                            <div className="text-center py-4 text-gray-500 dark:text-slate-400">
                                                No products found for this supplier.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Suggested Products */}
                                <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <span className="text-yellow-500">📊</span>
                                                Suggested Products
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                Items below reorder point
                                            </p>
                                        </div>
                                        {suggestedProducts.length > 0 && (
                                            <button
                                                onClick={handleAddAllSuggested}
                                                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            >
                                                Add All ({suggestedProducts.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                                        {suggestedProducts.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => addProductToPO(p, p.suggestedQty)}
                                                className="w-full flex items-center justify-between p-3 rounded-xl border border-yellow-200 dark:border-yellow-900/50 hover:border-yellow-300 dark:hover:border-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors text-left"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                                        {p.name}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
                                                        <span>Stock: {p.stock}</span>
                                                        <span>•</span>
                                                        <span>Order: {p.suggestedQty}</span>
                                                    </div>
                                                </div>
                                                <PlusIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                            </button>
                                        ))}
                                        {suggestedProducts.length === 0 && (
                                            <div className="text-center py-4 text-gray-500 dark:text-slate-400">
                                                All items are well-stocked.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        PO Items ({po.items.length})
                                    </h3>
                                </div>

                                {po.items.length > 0 ? (
                                    <div className="divide-y divide-gray-200 dark:divide-slate-800">
                                        {po.items.map(item => (
                                            <div key={item.productId} className="p-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                                            {item.productName}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                            SKU: {item.sku}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                            Quantity
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={e => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                            Cost Price
                                                        </label>
                                                        <div className="relative">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                                <span className="text-gray-500 dark:text-slate-500">{storeSettings.currency.symbol}</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.costPrice}
                                                                onChange={e => updateItem(item.productId, 'costPrice', parseFloat(e.target.value) || 0)}
                                                                className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                            Line Total
                                                        </label>
                                                        <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-right font-semibold text-gray-900 dark:text-white border border-gray-100 dark:border-slate-700">
                                                            {formatCurrency(item.quantity * item.costPrice, storeSettings)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <PackageIcon className="mx-auto w-12 h-12 text-gray-300 dark:text-slate-600 mb-4" />
                                        <p className="text-gray-500 dark:text-slate-400">
                                            No items added to this purchase order.
                                        </p>
                                        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                                            Add products from the sections above.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Details and Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Details */}
                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                Order Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="expectedAt" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Expected Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        id="expectedAt"
                                        value={po.expectedAt?.split('T')[0] || ''}
                                        onChange={e => setPo({ ...po, expectedAt: new Date(e.target.value).toISOString() })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        value={po.notes || ''}
                                        onChange={e => setPo({ ...po, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                        placeholder="Add any notes or instructions..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Costs Summary */}
                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <CurrencyDollarIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                Cost Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-slate-400">Subtotal</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(po.subtotal, storeSettings)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="shippingCost" className="text-gray-600 dark:text-slate-400">Shipping</label>
                                        <input
                                            type="number"
                                            id="shippingCost"
                                            value={po.shippingCost}
                                            onChange={e => setPo({ ...po, shippingCost: parseFloat(e.target.value) || 0 })}
                                            className="w-24 px-2 py-1 text-right bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(po.shippingCost, storeSettings)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-slate-400">Tax ({storeSettings.taxRate}%)</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(po.tax, storeSettings)}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(po.total, storeSettings)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div id="po-save-actions" className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            onClick={() => handleSaveAndExit(false)}
                            disabled={isLoading}
                            className="px-6 py-3.5 border-2 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 active:bg-gray-100 dark:active:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading && <div className="w-5 h-5 border-2 border-gray-600 dark:border-slate-400 border-t-transparent rounded-full animate-spin" />}
                            Save as Draft
                        </button>
                        <button
                            onClick={() => handleSaveAndExit(true)}
                            disabled={isLoading}
                            className="px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            Place Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function PurchaseOrdersPage({
    purchaseOrders,
    suppliers,
    products,
    onSave,
    onDelete,
    onReceiveItems,
    showSnackbar,
    isLoading,
    error,
    storeSettings,
}: PurchaseOrdersPageProps) {
    const [view, setView] = useState<ViewState>({ mode: 'list' });
    const [listViewMode, setListViewMode] = useState<'list' | 'grid'>('list');
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Missing states
    const [runMainTour, setRunMainTour] = useState(false);
    const [runFormTour, setRunFormTour] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [initialSupplierId, setInitialSupplierId] = useState<string | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);



    useEffect(() => {
        if (view.mode === 'detail') {
            const updatedPO = purchaseOrders.find(p => p.id === view.po.id);
            if (updatedPO && JSON.stringify(updatedPO) !== JSON.stringify(view.po)) {
                setView({ mode: 'detail', po: updatedPO });
            }
        }
    }, [purchaseOrders, view]);

    useEffect(() => {
        // Main tour check
        if (view.mode === 'list' && !localStorage.getItem('salePilot.poMainTourSeen')) {
            setRunMainTour(true);
        }
    }, [view.mode]);

    useEffect(() => {
        // Form tour check
        if (view.mode === 'form' && !localStorage.getItem('salePilot.poFormTourSeen')) {
            const timer = setTimeout(() => setRunFormTour(true), 500);
            return () => clearTimeout(timer);
        }
    }, [view.mode]);

    const handleJoyrideCallback = (data: CallBackProps, tour: 'main' | 'form') => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            if (tour === 'main') {
                setRunMainTour(false);
                localStorage.setItem('salePilot.poMainTourSeen', 'true');
            } else {
                setRunFormTour(false);
                localStorage.setItem('salePilot.poFormTourSeen', 'true');
            }
        }
    };

    const mainTourSteps: Step[] = [
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Purchase Orders 📦</h3>
                    <p>Welcome to the PO management screen! Here you can track all your supplier orders.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '#po-stats',
            content: 'View quick stats about your orders, including drafts, pending orders, and total value.',
            placement: 'bottom',
        },
        {
            target: '#po-filters',
            content: 'Filter your orders by status to find what you need quickly.',
            placement: 'bottom',
        },
        {
            target: '#po-new-btn',
            content: 'Click here to create a new Purchase Order.',
            placement: 'left',
        },
        {
            target: '#po-help-btn',
            content: 'Need to see this tour again? Click here anytime.',
            placement: 'left',
        }
    ];

    const formTourSteps: Step[] = [
        {
            target: '#po-supplier-select',
            content: 'First, select the supplier you want to order from.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '#po-available-products',
            content: 'Add products from the available list or use the "Suggested Products" to quickly restock low items.',
            placement: 'right',
        },
        {
            target: '#po-save-actions',
            content: 'Save as a draft to work on it later, or "Place Order" to finalize it.',
            placement: 'top',
        }
    ];

    const filteredPOs = useMemo(() => {
        const filtered = statusFilter === 'all'
            ? purchaseOrders
            : purchaseOrders.filter(po => po.status === statusFilter);
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [purchaseOrders, statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter]);

    const paginatedPOs = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredPOs.slice(start, start + pageSize);
    }, [filteredPOs, page, pageSize]);

    const handleCreateNew = () => {
        setInitialSupplierId(undefined); // Reset
        setView({ mode: 'form' });
    };
    const handleSelectPO = (po: PurchaseOrder) => setView({ mode: 'detail', po });
    const handleEditPO = (po: PurchaseOrder) => setView({ mode: 'form', po });
    const handleBackToList = () => {

        setView({ mode: 'list' });
    };

    const handleSavePO = async (po: PurchaseOrder, placeOrder: boolean) => {
        setIsSaving(true);
        try {
            let finalPO = { ...po };
            if (placeOrder && finalPO.status === 'draft') {
                finalPO.status = 'ordered';
                finalPO.orderedAt = new Date().toISOString();
            }
            await onSave(finalPO);

            if (placeOrder) {
                showSnackbar("Purchase Order placed successfully!", "success");
            } else {
                showSnackbar("Purchase Order saved as draft.", "success");
            }

            if (placeOrder || finalPO.status !== 'draft') {
                setView({ mode: 'detail', po: finalPO });
            } else {
                setView({ mode: 'list' });
            }
        } catch (err) {
            console.error(err);
            showSnackbar("Failed to save purchase order", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenDeleteModal = (po: PurchaseOrder) => {
        setPoToDelete(po);
        setDeleteError(null);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!poToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await onDelete(poToDelete.id);
            showSnackbar("Purchase Order deleted successfully", "success");
            setIsDeleteModalOpen(false);
            setPoToDelete(null);
            handleBackToList();
        } catch (err: any) {
            console.error(err);
            setDeleteError(err.message || "Failed to delete purchase order");
            // Error snackbar is already shown by Dashboard.tsx, but we want to show it in the modal too
        } finally {
            setIsDeleting(false);
        }
    };



    const handleReceiveStock = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsReceiveModalOpen(true);
    };

    const renderListView = () => {
        const stats = {
            draft: filteredPOs.filter(po => po.status === 'draft').length,
            ordered: filteredPOs.filter(po => po.status === 'ordered').length,
            partially_received: filteredPOs.filter(po => po.status === 'partially_received').length,
            totalValue: filteredPOs.reduce((sum, po) => sum + po.total, 0),
        };

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-[2px] border-b border-gray-200 dark:border-slate-800 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
                            <button
                                id="po-help-btn"
                                onClick={() => {
                                    localStorage.removeItem('salePilot.poMainTourSeen');
                                    setRunMainTour(true);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Start Tour"
                            >
                                <InformationCircleIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Desktop Tabs (Pills) */}
                        <div id="po-filters" className="hidden md:flex items-center gap-3 mx-6">
                            <div className="flex bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
                                {['all', 'draft', 'ordered', 'received', 'canceled'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === status
                                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* View Toggle */}
                            <ListGridToggle viewMode={listViewMode} onViewModeChange={setListViewMode} size="sm" />

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg active:bg-gray-200 dark:active:bg-slate-800 text-gray-600 dark:text-slate-400"
                                aria-label="Menu"
                            >
                                <GridIcon className="w-5 h-5" />
                            </button>

                            <button
                                id="po-new-btn"
                                onClick={handleCreateNew}
                                className={`ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${purchaseOrders.length === 0 ? 'animate-pulse' : ''}`}
                            >
                                <PlusIcon className="w-5 h-5 mr-1" />
                                <span className="hidden sm:inline">New PO</span>
                                <span className="sm:hidden">Add</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Grid Menu Popup */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm md:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}>
                        <div
                            glass-effect=""
                            className="absolute top-[70px] right-4 left-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 animate-fade-in-up border border-gray-100 dark:border-slate-800"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="grid grid-cols-2 gap-4">
                                {['all', 'draft', 'ordered', 'received', 'canceled'].map((status) => {
                                    const isActive = statusFilter === status;
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${isActive
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <span className="text-sm font-semibold whitespace-nowrap">
                                                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="px-4 py-4 sm:px-6">
                    <div id="po-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-slate-400">Draft</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draft}</div>
                        </div>
                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-slate-400">Ordered</div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.ordered}</div>
                        </div>
                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-slate-400">In Transit</div>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.partially_received}</div>
                        </div>
                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Value</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalValue, storeSettings)}</div>
                        </div>
                    </div>

                    {/* POs List */}
                    <POList
                        orders={paginatedPOs}
                        storeSettings={storeSettings}
                        viewMode={listViewMode}
                        onSelectPO={handleSelectPO}
                        isLoading={isLoading}
                        error={error}
                        statusFilter={statusFilter}
                        handleCreateNew={handleCreateNew}
                    />

                    {!isLoading && paginatedPOs.length > 0 && (
                        <div glass-effect="" className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 rounded-b-2xl shadow-sm border-x border-b">
                            <Pagination
                                total={filteredPOs.length}
                                page={page}
                                pageSize={pageSize}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                label="orders"
                            />
                        </div>
                    )}

                </div>
            </div>
        );
    };

    const renderDetailView = (po: PurchaseOrder) => {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-[2px] border-b border-gray-200 dark:border-slate-800 px-4 py-3 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button
                                onClick={handleBackToList}
                                className="p-2 -ml-2 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <div className="ml-3">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        PO #{po.poNumber}
                                    </h1>
                                    <StatusBadge status={po.status} />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Created on {new Date(po.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {po.status === 'draft' && (
                                <button
                                    onClick={() => handleEditPO(po)}
                                    className="p-2 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Edit PO"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            )}
                            {(po.status === 'ordered' || po.status === 'partially_received') && (
                                <button
                                    onClick={() => handleReceiveStock(po)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 dark:bg-emerald-600 hover:bg-green-700 dark:hover:bg-emerald-700 active:scale-95 transition-all"
                                >
                                    <PackageIcon className="w-4 h-4 mr-2" />
                                    Receive Stock
                                </button>
                            )}
                            <button
                                onClick={() => handleOpenDeleteModal(po)}
                                className="p-2 text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete PO"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <TruckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Supplier</h3>
                            </div>
                            <div className="space-y-1">
                                <div className="text-lg font-bold text-gray-900 dark:text-white">{po.supplierName}</div>
                                {po.isMarketplaceOrder && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400">
                                        Marketplace Order
                                    </span>
                                )}
                            </div>
                        </div>

                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <InformationCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Dates</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-slate-400">Ordered:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {po.orderedAt ? new Date(po.orderedAt).toLocaleString() : 'Not ordered yet'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-slate-400">Expected:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {po.expectedAt ? new Date(po.expectedAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-50 dark:bg-emerald-900/20 rounded-lg">
                                    <CurrencyDollarIcon className="w-5 h-5 text-green-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Financials</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-slate-400">Total Amount:</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(po.total, storeSettings)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-slate-400">Items:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{po.items.length} products</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Items</h3>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                                <thead className="bg-gray-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Received</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cost</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                                    {po.items.map((item) => (
                                        <tr key={item.productId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">SKU: {item.sku}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white font-semibold">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <span className={`font-bold ${item.receivedQuantity >= item.quantity ? 'text-green-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    {item.receivedQuantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-slate-400">
                                                {formatCurrency(item.costPrice, storeSettings)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(item.quantity * item.costPrice, storeSettings)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary and Notes */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                Notes
                            </h3>
                            <div className="text-gray-600 dark:text-slate-400 text-sm italic bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                                {po.notes || 'No notes provided for this order.'}
                            </div>
                        </div>

                        <div glass-effect="" className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(po.subtotal, storeSettings)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-slate-400">Shipping</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(po.shippingCost, storeSettings)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-slate-400">Tax ({storeSettings.taxRate}%)</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(po.tax, storeSettings)}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(po.total, storeSettings)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCurrentView = () => {
        switch (view.mode) {
            case 'detail':
                return renderDetailView(view.po);
            case 'form':
                return (
                    <PurchaseOrderForm
                        poToEdit={view.po}
                        suppliers={suppliers}
                        products={products}
                        onSave={handleSavePO}
                        onCancel={handleBackToList}
                        showSnackbar={showSnackbar}
                        storeSettings={storeSettings}
                        initialSupplierId={initialSupplierId}
                        isLoading={isLoading || isSaving}
                    />
                );
            case 'list':
            default:
                return renderListView();
        }
    };

    return (
        <>
            <Joyride
                steps={mainTourSteps}
                run={runMainTour}
                continuous
                showProgress
                showSkipButton
                locale={{ last: 'Okay' }}
                callback={(data) => handleJoyrideCallback(data, 'main')}
                styles={{
                    options: {
                        primaryColor: '#2563EB', // blue-600
                        zIndex: 10000,
                    }
                }}
            />
            <Joyride
                steps={formTourSteps}
                run={runFormTour}
                continuous
                showProgress
                showSkipButton
                locale={{ last: 'Okay' }}
                callback={(data) => handleJoyrideCallback(data, 'form')}
                styles={{
                    options: {
                        primaryColor: '#2563EB', // blue-600
                        zIndex: 10000,
                    }
                }}
            />
            {renderCurrentView()}
            {isDeleteModalOpen && poToDelete && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setPoToDelete(null);
                    }}
                    onConfirm={handleConfirmDelete}
                    title="Delete Purchase Order"
                    message={
                        <div className="space-y-3">
                            <p>
                                Are you sure you want to delete <strong>PO #{poToDelete.poNumber}</strong>? This action cannot be undone.
                            </p>
                            {deleteError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-2 animate-shake">
                                    <XMarkIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                                        {deleteError}
                                    </p>
                                </div>
                            )}
                        </div>
                    }
                    confirmText={isDeleting ? "Deleting..." : "Delete"}

                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}
            {selectedPO && (
                <ReceiveStockModal
                    isOpen={isReceiveModalOpen}
                    onClose={() => {
                        setIsReceiveModalOpen(false);
                        setSelectedPO(null);
                    }}
                    po={selectedPO}
                    onReceive={(items) => {
                        onReceiveItems(selectedPO.id, items);
                        setIsReceiveModalOpen(false);
                        setSelectedPO(null);
                    }}
                    storeSettings={storeSettings}
                />
            )}
        </>
    );
}
