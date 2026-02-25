import React from 'react';
import { CartItem, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { ShoppingCartIcon, XMarkIcon } from '../icons';

interface CartPanelProps {
    cart: CartItem[];
    storeSettings: StoreSettings;
    updateQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
    cart,
    storeSettings,
    updateQuantity,
    removeFromCart
}) => {
    const getStepFor = (uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1);

    const [removingItems, setRemovingItems] = React.useState<string[]>([]);

    const handleRemoveWithAnimation = (productId: string) => {
        setRemovingItems(prev => [...prev, productId]);
        setTimeout(() => {
            removeFromCart(productId);
            setRemovingItems(prev => prev.filter(id => id !== productId));
        }, 400); // Match CSS animation duration
    };

    return (
        <div id="pos-cart-items" className="hidden md:flex flex-1 overflow-y-auto">
            {
                cart.length === 0 ? (
                    <div className="p-8 text-center h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 dark:from-white/5 to-slate-200 dark:to-white/10 rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-4">
                            <ShoppingCartIcon className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-700 dark:text-white font-medium mb-2">Your cart is empty</p>
                    </div>
                ) : (
                    <div className="w-full pb-4 pt-2 px-3 space-y-3">
                        {cart.map(item => (
                            <div
                                key={item.productId}
                                className={`
                                    bg-white dark:bg-slate-800/80 rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-sm p-4 sm:p-5 group
                                    transition-all duration-300 hover:shadow-md hover:scale-[1.01]
                                    animate-cart-item
                                    ${removingItems.includes(item.productId) ? 'animate-cart-item-exit' : ''}
                                `}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                    {/* Product Info Section */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                            {/* Product Name & Price */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 dark:text-white text-base sm:text-sm truncate leading-tight">
                                                    {item.name}
                                                </h3>
                                                <p className="text-slate-500 dark:text-gray-500 text-sm sm:text-xs mt-1 sm:mt-1.5">
                                                    {formatCurrency(item.price, storeSettings)} each
                                                </p>
                                            </div>

                                            {/* Total & Quantity */}
                                            <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end sm:gap-1">
                                                <p className="font-bold text-slate-900 dark:text-white text-lg sm:text-base">
                                                    {formatCurrency(item.price * item.quantity, storeSettings)}
                                                </p>
                                                <p className="text-slate-500 dark:text-gray-500 text-sm sm:text-xs">
                                                    {item.quantity}{item.unitOfMeasure === 'kg' ? 'kg' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls Section */}
                                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start sm:gap-4">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-full border border-slate-100 dark:border-white/5 shadow-inner">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - getStepFor(item.unitOfMeasure))}
                                                className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-transparent transition-all active:scale-90 duration-300"
                                                aria-label="Decrease quantity"
                                            >
                                                <span className="font-bold text-lg leading-none">−</span>
                                            </button>

                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                                className="w-14 text-center text-sm font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white"
                                                min="0"
                                                step={item.unitOfMeasure === 'kg' ? '0.1' : '1'}
                                                aria-label={`Quantity of ${item.name}`}
                                            />

                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + getStepFor(item.unitOfMeasure))}
                                                className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-transparent transition-all active:scale-90 duration-300"
                                                aria-label="Increase quantity"
                                            >
                                                <span className="font-bold text-lg leading-none">+</span>
                                            </button>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemoveWithAnimation(item.productId)}
                                            className="p-2.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100 dark:active:bg-red-500/20 rounded-full transition-all duration-300 group-hover:opacity-100 opacity-0 sm:opacity-100 sm:group-hover:opacity-100 active:scale-90"
                                            aria-label={`Remove ${item.name} from cart`}
                                        >
                                            <XMarkIcon className="w-5 h-5 sm:w-4 sm:h-4 text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" />
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
