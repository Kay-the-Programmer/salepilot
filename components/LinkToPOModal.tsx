import React from 'react';
import { Product, PurchaseOrder } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import PlusIcon from './icons/PlusIcon';

interface LinkToPOModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    purchaseOrders: PurchaseOrder[];
    onLink: (po: PurchaseOrder) => void;
    onCreateNew: () => void;
    onSkip: () => void;
}

const LinkToPOModal: React.FC<LinkToPOModalProps> = ({
    isOpen,
    onClose,
    product,
    purchaseOrders,
    onLink,
    onCreateNew,
    onSkip
}) => {
    if (!isOpen) return null;

    // Filter POs that contain this product and are in a state to receive items
    const relevantPOs = purchaseOrders.filter(po =>
        (po.status === 'ordered' || po.status === 'partially_received') &&
        po.items.some(item => item.productId === product.id)
    );

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    Link to Purchase Order
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    You are receiving stock for <strong>{product.name}</strong>. Would you like to link this to an existing Purchase Order?
                                </p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {relevantPOs.length > 0 ? (
                            <div className="mt-4 space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Detailed Active Orders</h4>
                                {relevantPOs.map(po => {
                                    const item = po.items.find(i => i.productId === product.id);
                                    if (!item) return null;
                                    const remaining = item.quantity - item.receivedQuantity;

                                    return (
                                        <button
                                            key={po.id}
                                            onClick={() => onLink(po)}
                                            className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-semibold text-gray-900">{po.poNumber}</span>
                                                    <span className="mx-2 text-gray-300">|</span>
                                                    <span className="text-sm text-gray-600">{po.supplierName}</span>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${po.status === 'ordered' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {po.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Ordered: {item.quantity}</span>
                                                <span className="text-gray-500">Received: {item.receivedQuantity}</span>
                                                <span className={`font-medium ${remaining > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                                                    Remaining: {remaining}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
                                No active orders found checking specifically for this product.
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={onCreateNew}
                                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Create New Purchase Order
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onSkip}
                        >
                            Just Adjust Stock
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkToPOModal;
