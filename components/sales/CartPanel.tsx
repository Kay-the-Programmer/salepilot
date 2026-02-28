import React from 'react';
import { CartItem, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { ShoppingCartIcon, XMarkIcon } from '../icons';
import MinusIcon from '../icons/MinusIcon';
import PlusIcon from '../icons/PlusIcon';

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

    const handleRemove = (productId: string) => {
        setRemovingItems(prev => [...prev, productId]);
        setTimeout(() => {
            removeFromCart(productId);
            setRemovingItems(prev => prev.filter(id => id !== productId));
        }, 300);
    };

    if (cart.length === 0) {
        return (
            <div id="pos-cart-items" className="hidden md:flex flex-1 items-center justify-center">
                <div className="text-center px-6">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <ShoppingCartIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cart is empty</p>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Tap a product or scan a barcode to begin</p>
                </div>
            </div>
        );
    }

    return (
        <div id="pos-cart-items" className="hidden md:flex flex-1 overflow-y-auto flex-col">
            <div className="flex-1 px-3 py-2 space-y-1">
                {cart.map(item => {
                    const step = getStepFor(item.unitOfMeasure);
                    const isRemoving = removingItems.includes(item.productId);

                    return (
                        <div
                            key={item.productId}
                            className={`
                                group flex items-center gap-3 px-3 py-2.5 rounded-2xl
                                bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-white/5
                                hover:border-slate-200 dark:hover:border-white/10
                                transition-all duration-300
                                ${isRemoving ? 'opacity-0 scale-95 -translate-x-2' : 'opacity-100 scale-100'}
                            `}
                        >
                            {/* Item Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                                    {item.name}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
                                    {formatCurrency(item.price, storeSettings)} × {item.quantity}{item.unitOfMeasure === 'kg' ? 'kg' : ''} =&nbsp;
                                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                                        {formatCurrency(item.price * item.quantity, storeSettings)}
                                    </span>
                                </p>
                            </div>

                            {/* Quantity Stepper */}
                            <div className="flex items-center bg-slate-100 dark:bg-white/8 rounded-full p-0.5 gap-0.5 flex-shrink-0">
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity - step)}
                                    className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center active:scale-90 transition-all shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
                                    aria-label="Decrease"
                                >
                                    <MinusIcon className="w-2.5 h-2.5" />
                                </button>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                    className="w-10 text-center text-xs font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white tabular-nums"
                                    min="0"
                                    step={step}
                                    aria-label={`Qty ${item.name}`}
                                />
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity + step)}
                                    className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center active:scale-90 transition-all shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
                                    aria-label="Increase"
                                >
                                    <PlusIcon className="w-2.5 h-2.5" />
                                </button>
                            </div>

                            {/* Remove */}
                            <button
                                onClick={() => handleRemove(item.productId)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                aria-label={`Remove ${item.name}`}
                            >
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
