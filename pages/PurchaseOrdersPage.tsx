import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PurchaseOrder, Supplier, Product, POItem, StoreSettings } from '../types';
import Header from '../components/Header';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PlusIcon from '../components/icons/PlusIcon';
import { SnackbarType } from '../App';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import ArrowDownTrayIcon from '../components/icons/ArrowDownTrayIcon';
import CalendarDaysIcon from '../components/icons/CalendarDaysIcon';
import { formatCurrency } from '../utils/currency';


interface PurchaseOrdersPageProps {
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
    onSave: (po: PurchaseOrder) => void;
    onDelete: (poId: string) => void;
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

// --- Sub-components defined within the page for locality ---

const StatusBadge: React.FC<{ status: PurchaseOrder['status'] }> = ({ status }) => {
    const statusStyles: Record<PurchaseOrder['status'], string> = {
        draft: 'bg-gray-100 text-gray-800 ring-gray-500/10',
        ordered: 'bg-blue-50 text-blue-700 ring-blue-700/10',
        partially_received: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
        received: 'bg-green-50 text-green-700 ring-green-600/20',
        canceled: 'bg-red-50 text-red-700 ring-red-600/10',
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>
            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
    );
};

const ReceiveStockModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    po: PurchaseOrder;
    onReceive: (receivedItems: { productId: string, quantity: number }[]) => void;
}> = ({ isOpen, onClose, po, onReceive }) => {
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/*Receive stock interface*/}
            <div className="bg-gray-100 rounded-lg shadow-xl transform transition-all sm:max-w-4xl w-full m-4">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-700" id="modal-title">
                            Receive Stock for PO {po.poNumber}
                        </h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {itemsToReceive.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-300">
                           <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Product</th>
                                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Ordered</th>
                                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Received</th>
                                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Remaining</th>
                                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Receiving Now</th>
                                </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200 bg-white">
                                {itemsToReceive.map(item => {
                                   const remaining = item.quantity - item.receivedQuantity;
                                   return (
                                     <tr key={item.productId}>
                                         <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{item.productName}</td>
                                         <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-gray-500">{item.quantity}</td>
                                         <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-gray-500">{item.receivedQuantity}</td>
                                         <td className="whitespace-nowrap px-3 py-4 text-center text-sm font-semibold text-blue-600">{remaining}</td>
                                         <td className="whitespace-nowrap px-3 py-4 text-sm">
                                             <input
                                                 type="number"
                                                 value={receivedQuantities[item.productId] ?? ''}
                                                 onChange={(e) => handleQuantityChange(item.productId, e.target.value, remaining)}
                                                 min="0"
                                                 max={remaining}
                                                 placeholder="0"
                                                 className="block w-24 mx-auto p-1 border rounded-md text-center focus:ring-blue-500 focus:border-blue-500"
                                             />
                                         </td>
                                     </tr>
                                   );
                                })}
                           </tbody>
                        </table>
                    ) : (
                       <p className="text-center text-gray-500 py-8">All items on this PO have been fully received.</p>
                    )}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t items-center">
                    <button onClick={handleSubmit} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={itemsToReceive.length === 0}>Receive Items</button>
                    <button onClick={handleReceiveAll} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" disabled={itemsToReceive.length === 0}>Receive All Remaining</button>
                    <button onClick={onClose} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm mr-auto">Cancel</button>
                </div>
            </div>
        </div>
    );
};


const PurchaseOrderForm: React.FC<{
    poToEdit?: PurchaseOrder;
    suppliers: Supplier[];
    products: Product[];
    onSave: (po: PurchaseOrder, placeOrder: boolean) => void;
    onCancel: () => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
}> = ({ poToEdit, suppliers, products, onSave, onCancel, showSnackbar, storeSettings }) => {
    const [po, setPo] = useState<Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>>(() => {
        if (poToEdit) return { ...poToEdit };
        return {
            supplierId: '',
            supplierName: '',
            status: 'draft',
            items: [],
            notes: '',
            subtotal: 0,
            shippingCost: 0,
            tax: 0,
            total: 0,
            expectedAt: undefined,
        };
    });

    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const supplierId = e.target.value;
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
            setPo(prev => ({ ...prev, supplierId: supplier.id, supplierName: supplier.name, items: [] })); // Clear items on supplier change
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
    };

    React.useEffect(() => {
        const subtotal = po.items.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
        const tax = subtotal * (storeSettings.taxRate / 100);
        const total = subtotal + po.shippingCost + tax;
        setPo(prev => ({...prev, subtotal, tax, total }));
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
                const suggestedQty = Math.max(1, targetStock - p.stock); // Order at least 1
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
        <>
            {/*Create purchase order form*/}
            <header className="bg-gray-100 z-10">
                <div className="mx-auto px-4 sm:px-4 lg:px-4">
                    <div className="flex items-center h-16">
                        <button onClick={onCancel} className="mr-4 p-2 rounded-full hover:bg-gray-100"><ArrowLeftIcon className="w-6 h-6 text-gray-600" /></button>
                        <h1 className="text-2xl font-bold text-gray-900">{poToEdit ? `Edit PO ${poToEdit.poNumber}` : 'Create New Purchase Order'}</h1>
                    </div>
                </div>
            </header>
             <main className="flex-1 overflow-y-auto bg-gray-100 p-8 px-4 py-2">
                <div className="max-w-6xl mx-auto space-y-6">
                     {/* Supplier Selection */}
                    <div className="bg-gray-100 p-0 rounded-lg ">
                        <div className="mt-4">
                            <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Select a supplier</label>
                            <select id="supplierId" value={po.supplierId} onChange={handleSupplierChange} className="mt-1 border p-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" disabled={!!poToEdit}>
                                <option value="" disabled>-- Select --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {poToEdit && <p className="text-xs text-gray-500 mt-1">Supplier cannot be changed after a PO is created.</p>}
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow">
                        {po.supplierId ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-600">Add Products from Supplier</h4>
                                        <div className="max-h-48 overflow-y-auto border rounded-md mt-1">
                                            {availableProducts.map(p => (
                                                <div key={p.id} onClick={() => addProductToPO(p)} className="flex justify-between items-center p-2 hover:bg-blue-50 cursor-pointer text-sm">
                                                    <span>{p.name}</span>
                                                    <PlusIcon className="w-5 h-5 text-blue-500"/>
                                                </div>
                                            ))}
                                             {availableProducts.length === 0 && <p className="text-center text-gray-500 text-sm p-4">No products found for this supplier.</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <div>
                                                <h4 className="font-medium text-sm text-gray-600">Suggested Products</h4>
                                                <p className="text-xs text-gray-500">(Items below reorder point)</p>
                                            </div>
                                            {suggestedProducts.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={handleAddAllSuggested}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    Add All ({suggestedProducts.length})
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-48 overflow-y-auto border rounded-md mt-1">
                                            {suggestedProducts.map(p => (
                                                    <div key={p.id} onClick={() => addProductToPO(p, p.suggestedQty)} className="flex justify-between items-center p-2 hover:bg-blue-50 cursor-pointer text-sm">
                                                    <div>
                                                        <span>{p.name} <span className="text-red-500">({p.stock} left)</span></span>
                                                        <span className="text-xs text-gray-500 block">Suggest ordering: {p.suggestedQty}</span>
                                                    </div>
                                                    <PlusIcon className="w-5 h-5 text-blue-500"/>
                                                </div>
                                            ))}
                                            {suggestedProducts.length === 0 && <p className="text-center text-gray-500 text-sm p-4">No items need reordering.</p>}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Added Items Table */}
                                <div className="flow-root">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead><tr>
                                            <th className="py-2 text-left text-sm font-semibold text-gray-900">Product</th>
                                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900">Quantity</th>
                                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900">Cost</th>
                                            <th className="px-3 py-2 text-right text-sm font-semibold text-gray-900">Total</th>
                                            <th></th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-gray-200">
                                        {po.items.map(item => (
                                            <tr key={item.productId}>
                                                <td className="py-2 text-sm">{item.productName}</td>
                                                <td className="px-3 py-2"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 1)} className="w-20 p-1 border rounded-md text-center" /></td>
                                                <td className="px-3 py-2"><input type="number" step="0.01" min="0" value={item.costPrice} onChange={e => updateItem(item.productId, 'costPrice', parseFloat(e.target.value) || 0)} className="w-24 p-1 border rounded-md text-right" /></td>
                                                <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.quantity * item.costPrice, storeSettings)}</td>
                                                <td className="py-2 text-right"><button onClick={() => removeItem(item.productId)}><TrashIcon className="w-5 h-5 text-red-500"/></button></td>
                                            </tr>
                                        ))}
                                         {po.items.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-6">No items added to this purchase order.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : <p className="text-gray-500">Please select a supplier to add items.</p>}
                    </div>
                    
                    {/* Summary and Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Details</h3>
                             <div>
                                <label htmlFor="expectedAt" className="block text-sm font-medium text-gray-700">Expected Delivery Date</label>
                                <input type="date" id="expectedAt" value={po.expectedAt?.split('T')[0] || ''} onChange={e => setPo({...po, expectedAt: new Date(e.target.value).toISOString()})} className="mt-1 block w-full rounded-md border p-1  shadow-sm" />
                             </div>
                            <div className="mt-4">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea id="notes" value={po.notes || ''} onChange={e => setPo({...po, notes: e.target.value})} rows={3} className="mt-1 block w-full rounded-md border p-2 shadow-sm" />
                            </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Costs</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(po.subtotal, storeSettings)}</span></div>
                                <div className="flex justify-between items-center">
                                    <label htmlFor="shippingCost">Shipping</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                          <span className="text-gray-500 sm:text-sm">{storeSettings.currency.symbol}</span>
                                        </div>
                                        <input type="number" id="shippingCost" value={po.shippingCost} onChange={e => setPo({...po, shippingCost: parseFloat(e.target.value) || 0})} className="w-28 p-1 border rounded-md text-right pl-7" />
                                    </div>
                                </div>
                                <div className="flex justify-between"><span>Tax ({storeSettings.taxRate}%)</span><span>{formatCurrency(po.tax, storeSettings)}</span></div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span>{formatCurrency(po.total, storeSettings)}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                         <button onClick={() => handleSaveAndExit(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Save as Draft</button>
                         <button onClick={() => handleSaveAndExit(true)} className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700">Save and Place Order</button>
                    </div>
                </div>
            </main>
        </>
    );
}


const PurchaseOrdersPage: React.FC<PurchaseOrdersPageProps> = ({
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
}) => {
    const [view, setView] = useState<ViewState>({ mode: 'list' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

    useEffect(() => {
        if (view.mode === 'detail') {
            const updatedPO = purchaseOrders.find(p => p.id === view.po.id);
            if (updatedPO && JSON.stringify(updatedPO) !== JSON.stringify(view.po)) {
                setView({ mode: 'detail', po: updatedPO });
            }
        }
    }, [purchaseOrders, view]);

    const filteredPOs = useMemo(() => {
        return purchaseOrders.filter(po => 
            po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [purchaseOrders, searchTerm]);

    const handleCreateNew = () => setView({ mode: 'form' });
    const handleSelectPO = (po: PurchaseOrder) => setView({ mode: 'detail', po });
    const handleEditPO = (po: PurchaseOrder) => setView({ mode: 'form', po });
    const handleBackToList = () => {
        setSearchTerm('');
        setView({ mode: 'list' });
    };

    const handleSavePO = (po: PurchaseOrder, placeOrder: boolean) => {
        let finalPO = { ...po };
        if(placeOrder && finalPO.status === 'draft') {
            finalPO.status = 'ordered';
            finalPO.orderedAt = new Date().toISOString();
        }
        onSave(finalPO);
        if (placeOrder || finalPO.status !== 'draft') {
            setView({ mode: 'detail', po: finalPO });
        } else {
            setView({ mode: 'list' });
        }
    }
    
    // --- RENDER METHODS FOR EACH VIEW ---

    const renderListView = () => (
        <>
            <Header
                title="Purchase Orders"
                buttonText="Create PO"
                onButtonClick={handleCreateNew}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-0 bg-gray-100">
                 <div className="p-0">
                    <div className="mt-4 flow-root">
                        {isLoading && <p>Loading...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {!isLoading && !error && (
                            filteredPOs.length > 0 ? (
                                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-4">
                                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-300">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">PO Number</th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Supplier</th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                                                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total</th>
                                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {filteredPOs.map(po => (
                                                    <tr key={po.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectPO(po)}>
                                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-blue-600 sm:pl-6">{po.poNumber}</td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{po.supplierName}</td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><StatusBadge status={po.status} /></td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700 font-medium">{formatCurrency(po.total, storeSettings)}</td>
                                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6" onClick={e => e.stopPropagation()}>
                                                            {po.status === 'draft' && (
                                                                <div className="flex items-center justify-end space-x-4">
                                                                    <button onClick={() => handleEditPO(po)} className="text-blue-600 hover:text-blue-900" title="Edit PO"><PencilIcon className="w-5 h-5"/></button>
                                                                    <button onClick={() => onDelete(po.id)} className="text-red-600 hover:text-red-900" title="Delete PO"><TrashIcon className="w-5 h-5"/></button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                               <div className="text-center py-12">
                                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No purchase orders found</h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm ? 'Try adjusting your search.' : 'Get started by creating a new purchase order.'}
                                  </p>
                                  <div className="mt-6">
                                    <button
                                      onClick={handleCreateNew}
                                      type="button"
                                      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                    >
                                      <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                                      New Purchase Order
                                    </button>
                                  </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </>
    );
    
    const renderDetailView = (po: PurchaseOrder) => {
        const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string, actions?: React.ReactNode }> = ({ title, children, className, actions }) => (
            <div className={`bg-gray-50 rounded-lg shadow ${className}`}>
                <div className="px-4 py-5 sm:px-4 lg:px-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold leading-6 text-gray-700">{title}</h3>
                    {actions}
                </div>
                <div className="border-t border-gray-200">{children}</div>
            </div>
        );

        return (
             <>
                <header className="bg-gray-100 z-10">
                    <div className="mx-auto px-4 sm:px-4 lg:px-4">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <button onClick={handleBackToList} className="mr-4 p-2 rounded-full hover:bg-gray-100"><ArrowLeftIcon className="w-6 h-6 text-gray-600" /></button>
                                <div>
                                    <h1 className="text-2xl mt-4 font-bold text-gray-700">PO: {po.poNumber}</h1>
                                    <p className="text-sm text-gray-500">{"Supplier: " + po.supplierName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <StatusBadge status={po.status} />
                                {po.status === 'draft' && <button onClick={() => handleEditPO(po)} className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"><PencilIcon className="w-4 h-4" /> Edit</button>}
                                {(po.status === 'ordered' || po.status === 'partially_received') && <button onClick={() => setIsReceiveModalOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"><ArrowDownTrayIcon className="w-5 h-5" /> Receive Stock</button>}
                            </div>
                        </div>
                    </div>
                </header>
                 <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
                     <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 space-y-8">
                             <InfoCard title="Items Ordered">
                                <div className="flow-root">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Product</th>
                                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Ordered</th>
                                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Received</th>
                                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Cost</th>
                                                <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {po.items.map(item => (
                                                <tr key={item.productId}>
                                                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                        <div className="font-medium text-gray-900">{item.productName}</div>
                                                        <div className="text-gray-500">{item.sku}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-gray-500">{item.quantity}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-gray-500">
                                                         <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${item.receivedQuantity >= item.quantity ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-800'}`}>{item.receivedQuantity}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">{formatCurrency(item.costPrice, storeSettings)}</td>
                                                    <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm text-gray-900 font-medium sm:pr-6">{formatCurrency(item.costPrice * item.quantity, storeSettings)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             </InfoCard>

                            {po.receptions && po.receptions.length > 0 && (
                                <InfoCard title="Receiving History">
                                    <div className="px-4 py-5 sm:p-6 space-y-4">
                                        {po.receptions.slice().reverse().map((reception, index) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                                                <p className="font-semibold text-sm text-gray-800">
                                                    Received on: <span className="font-normal">{new Date(reception.date).toLocaleString()}</span>
                                                </p>
                                                <ul className="mt-2 pl-5 list-disc text-sm text-gray-600 space-y-1">
                                                    {reception.items.map(item => (
                                                        <li key={item.productId}>
                                                            <span className="font-medium">{item.quantityReceived} x</span> {item.productName}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </InfoCard>
                            )}
                             
                            {po.notes && <InfoCard title="Notes"><div className="px-4 py-5 sm:p-6 text-sm text-gray-600 whitespace-pre-wrap">{po.notes}</div></InfoCard>}
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <InfoCard title="Summary">
                                <dl className="sm:divide-y sm:divide-gray-200">
                                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500 flex items-center"><CalendarDaysIcon className="w-5 h-5 mr-2 text-gray-400"/>Created</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{new Date(po.createdAt).toLocaleString()}</dd>
                                    </div>
                                    {po.orderedAt && <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500 flex items-center"><CalendarDaysIcon className="w-5 h-5 mr-2 text-gray-400"/>Ordered</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{new Date(po.orderedAt).toLocaleString()}</dd>
                                    </div>}
                                    {po.expectedAt && <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500 flex items-center"><CalendarDaysIcon className="w-5 h-5 mr-2 text-gray-400"/>Expected</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{new Date(po.expectedAt).toLocaleDateString()}</dd>
                                    </div>}
                                     {po.receivedAt && <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500 flex items-center"><CalendarDaysIcon className="w-5 h-5 mr-2 text-gray-400"/>Last Received</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{new Date(po.receivedAt).toLocaleString()}</dd>
                                    </div>}
                                </dl>
                            </InfoCard>
                            <InfoCard title="Costs">
                                <dl className="sm:divide-y sm:divide-gray-200 text-sm">
                                    <div className="py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6"><dt>Subtotal</dt><dd className="text-right">{formatCurrency(po.subtotal, storeSettings)}</dd></div>
                                    <div className="py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6"><dt>Shipping</dt><dd className="text-right">{formatCurrency(po.shippingCost, storeSettings)}</dd></div>
                                    <div className="py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6"><dt>Tax</dt><dd className="text-right">{formatCurrency(po.tax, storeSettings)}</dd></div>
                                    <div className="py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6 font-bold text-base"><dt>Total</dt><dd className="text-right">{formatCurrency(po.total, storeSettings)}</dd></div>
                                </dl>
                            </InfoCard>
                        </div>
                     </div>
                 </main>
            </>
        )
    };


    const renderCurrentView = () => {
        switch(view.mode) {
            case 'detail':
                return renderDetailView(view.po);
            case 'form':
                return <PurchaseOrderForm 
                    poToEdit={view.po}
                    suppliers={suppliers}
                    products={products}
                    onSave={handleSavePO}
                    onCancel={handleBackToList}
                    showSnackbar={showSnackbar}
                    storeSettings={storeSettings}
                />;
            case 'list':
            default:
                return renderListView();
        }
    };
    
    return (
        <>
            {renderCurrentView()}
            {view.mode === 'detail' && (
                <ReceiveStockModal 
                    isOpen={isReceiveModalOpen}
                    onClose={() => setIsReceiveModalOpen(false)}
                    po={view.po}
                    onReceive={(items) => onReceiveItems(view.po.id, items)}
                />
            )}
        </>
    )
};

export default PurchaseOrdersPage;