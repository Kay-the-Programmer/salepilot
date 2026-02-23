import React from 'react';
import { Product } from '../../types';
import { buildAssetUrl } from '@/services/api';
import { BellAlertIcon, ShoppingCartIcon } from '../icons';

interface OutOfStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
}

const OutOfStockModal: React.FC<OutOfStockModalProps> = ({ isOpen, onClose, product }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="liquid-glass-card rounded-[2rem] max-w-md w-full mx-4 overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-5 border-b border-red-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                            <BellAlertIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Out of Stock</h3>
                            <p className="text-xs text-slate-600 mt-0.5">Product currently unavailable</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-slate-700 font-medium mb-2">
                            Sorry, "<span className="font-bold text-slate-900">{product.name}</span>" is currently out of stock.
                        </p>
                        <p className="text-sm text-slate-500">
                            Please check back later or contact your admin to reorder this product.
                        </p>
                    </div>

                    {/* Product Info Card */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center gap-3">
                            {product.imageUrls?.[0] ? (
                                <img
                                    src={buildAssetUrl(product.imageUrls[0])}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                                    <ShoppingCartIcon className="w-8 h-8 text-slate-400" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 text-sm">{product.name}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">SKU: {product.sku || 'N/A'}</p>
                                <div className="mt-1">
                                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                        0 in stock
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OutOfStockModal;
