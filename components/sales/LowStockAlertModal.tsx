import React from 'react';
import { Product, User, StoreSettings } from '../../types';
import { api, buildAssetUrl } from '@/services/api';
import { BellAlertIcon, ShoppingCartIcon } from '../icons';
import { SnackbarType } from '../../App';

interface LowStockAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    user: User;
    storeSettings: StoreSettings;
    showSnackbar: (message: string, type?: SnackbarType) => void;
}

const LowStockAlertModal: React.FC<LowStockAlertModalProps> = ({
    isOpen,
    onClose,
    product,
    user,
    storeSettings,
    showSnackbar
}) => {
    if (!isOpen) return null;

    const stockCount = typeof (product as any).stock === 'number'
        ? (product as any).stock
        : (parseFloat(String((product as any).stock)) || 0);

    const handleSendAlert = async () => {
        try {
            await api.post('/notifications/low-stock', {
                productId: product.id,
                productName: product.name,
                currentStock: stockCount,
                reorderPoint: product.reorderPoint || storeSettings.lowStockThreshold,
                requestedBy: user.email || user.name,
                storeId: user.currentStoreId
            });
            showSnackbar(`Admin notified about low stock for "${product.name}"`, 'success');
            onClose();
        } catch (error) {
            console.error('Failed to send low stock notification:', error);
            showSnackbar('Failed to send notification. Please try again.', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="liquid-glass-card rounded-[2rem] max-w-md w-full mx-4 overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 border-b border-amber-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500 rounded-xl shadow-lg">
                            <BellAlertIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Low Stock Alert</h3>
                            <p className="text-xs text-slate-600 mt-0.5">Notify admin to restock</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-slate-700 font-medium mb-2">
                            Send a notification to admin about low stock for:
                        </p>
                        <p className="text-sm text-slate-500 mb-4">
                            The admin will be notified to reorder "<span className="font-bold text-slate-900">{product.name}</span>".
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
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                        {stockCount} left
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Reorder at: {product.reorderPoint || storeSettings.lowStockThreshold}
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
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 active:scale-95 transition-all duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendAlert}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                        Send Alert
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LowStockAlertModal;
