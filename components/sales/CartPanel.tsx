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
            <div id="pos-cart-items" className="hidden md:flex flex-1 items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="text-center px-8 py-10 relative z-10 w-full max-w-[280px]">
                    <div className="w-20 h-20 rounded-[24px] bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/5 flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3">
                        <ShoppingCartIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Cart is empty</p>
                    <p className="text-[13px] font-medium text-slate-400 dark:text-slate-600 mt-2 leading-relaxed">
                        Tap a product or scan a barcode to begin building an order
                    </p>
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
                                group flex items-center gap-4 px-4 py-3 rounded-[20px]
                                bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-white/5
                                hover:shadow-sm hover:border-slate-300 dark:hover:border-white/10
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
                            <div className="flex items-center bg-slate-100/80 dark:bg-white/10 rounded-full p-1 gap-1 flex-shrink-0">
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity - step)}
                                    className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm hover:shadow-md border border-slate-200/50 dark:border-white/5"
                                    aria-label="Decrease"
                                >
                                    <MinusIcon className="w-3 h-3" />
                                </button>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                    className="w-10 text-center text-[13px] font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white tabular-nums"
                                    min="0"
                                    step={step}
                                    aria-label={`Qty ${item.name}`}
                                />
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity + step)}
                                    className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm hover:shadow-md border border-slate-200/50 dark:border-white/5"
                                    aria-label="Increase"
                                >
                                    <PlusIcon className="w-3 h-3" />
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
