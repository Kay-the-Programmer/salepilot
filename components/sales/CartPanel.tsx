import React from 'react';
import { CartItem, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { ShoppingCartIcon, XMarkIcon } from '../icons';

interface CartPanelProps {
    cart: CartItem[];
    storeSettings: StoreSettings;
    updateQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
    cart,
    storeSettings,
    updateQuantity,
    removeFromCart,
    clearCart
}) => {
    const getStepFor = (uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1);

    return (
        <div id="pos-cart-items" className="hidden md:flex flex-1 overflow-y-auto">
            {
                cart.length === 0 ? (
                    <div className="p-8 text-center h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16  from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShoppingCartIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-700 font-medium mb-2">Your cart is empty</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 w-full">
                        {cart.map(item => (
                            <div
                                key={item.productId}
                                className="px-4 py-4 sm:py-5 hover:bg-slate-50/50 transition-colors duration-200 border-b border-slate-100 last:border-b-0 group"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                    {/* Product Info Section */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                            {/* Product Name & Price */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 text-base sm:text-sm truncate leading-tight">
                                                    {item.name}
                                                </h3>
                                                <p className="text-slate-500 text-sm sm:text-xs mt-1 sm:mt-1.5">
                                                    {formatCurrency(item.price, storeSettings)} each
                                                </p>
                                            </div>

                                            {/* Total & Quantity */}
                                            <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end sm:gap-1">
                                                <p className="font-bold text-slate-900 text-lg sm:text-base">
                                                    {formatCurrency(item.price * item.quantity, storeSettings)}
                                                </p>
                                                <p className="text-slate-500 text-sm sm:text-xs">
                                                    {item.quantity}{item.unitOfMeasure === 'kg' ? 'kg' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls Section */}
                                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start sm:gap-4">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - getStepFor(item.unitOfMeasure))}
                                                className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center transition-all duration-150 active:scale-95"
                                                aria-label="Decrease quantity"
                                            >
                                                <span className="font-bold text-slate-700 text-lg">−</span>
                                            </button>

                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                                className="w-16 sm:w-14 px-2 py-2 sm:py-1.5 border border-slate-300 rounded-lg text-center text-base sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                                min="0"
                                                step={item.unitOfMeasure === 'kg' ? '0.1' : '1'}
                                                aria-label={`Quantity of ${item.name}`}
                                            />

                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + getStepFor(item.unitOfMeasure))}
                                                className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center transition-all duration-150 active:scale-95"
                                                aria-label="Increase quantity"
                                            >
                                                <span className="font-bold text-slate-700 text-lg">+</span>
                                            </button>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="p-2.5 sm:p-1.5 hover:bg-red-50 active:bg-red-100 rounded-lg transition-all duration-150 group-hover:opacity-100 opacity-0 sm:opacity-100 sm:group-hover:opacity-100"
                                            aria-label={`Remove ${item.name} from cart`}
                                        >
                                            <XMarkIcon className="w-5 h-5 sm:w-4 sm:h-4 text-slate-400 hover:text-red-600 transition-colors" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div>
    );
};
