import React from 'react';
import { CartItem, StoreSettings } from '../../types';
import { buildAssetUrl } from '@/services/api';
import { formatCurrency } from '../../utils/currency';
import PosIcon from './PosIcon';

interface CartPanelProps {
    cart: CartItem[];
    storeSettings: StoreSettings;
    updateQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
}

/**
 * Cart line list — faithful port of the `.cart__lines` region from
 * salepilot_web_v2/src/pages/pos/Sale.tsx.
 */
export const CartPanel: React.FC<CartPanelProps> = ({
    cart,
    storeSettings,
    updateQuantity,
    removeFromCart
}) => {
    const getStepFor = (uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1);

    if (cart.length === 0) {
        return (
            <div id="pos-cart-items" className="cart__lines">
                <div className="cart__empty">
                    <PosIcon name="shopping_cart" size={34} />
                    <p>Add items to start a sale</p>
                    <span>Tap any product on the left to add it here.</span>
                </div>
            </div>
        );
    }

    return (
        <div id="pos-cart-items" className="cart__lines">
            {cart.map(item => {
                const step = getStepFor(item.unitOfMeasure);
                const img = (item as any).imageUrls?.[0];
                return (
                    <div className="cart__line" key={item.productId}>
                        <div className="cart__art">
                            {img
                                ? <img src={buildAssetUrl(img)} alt={item.name} />
                                : <PosIcon name="inventory_2" size={24} />}
                        </div>
                        <div className="cart__line-main">
                            <div className="cart__line-top">
                                <span className="cart__name">{item.name}</span>
                                <span className="cart__line-price tnum">
                                    {formatCurrency(item.price * item.quantity, storeSettings)}
                                </span>
                            </div>
                            <p className="cart__line-sub tnum">
                                {formatCurrency(item.price, storeSettings)}
                                {item.unitOfMeasure === 'kg' ? ' / kg' : ' each'}
                            </p>
                            <div className="cart__stepper">
                                <button
                                    type="button"
                                    className="v2-iconbtn v2-iconbtn--sm"
                                    aria-label="Decrease"
                                    onClick={() => updateQuantity(item.productId, item.quantity - step)}
                                >
                                    <PosIcon name="remove" size={18} />
                                </button>
                                <span className="cart__qty tnum">{item.quantity}</span>
                                <button
                                    type="button"
                                    className="v2-iconbtn v2-iconbtn--sm"
                                    aria-label="Increase"
                                    onClick={() => updateQuantity(item.productId, item.quantity + step)}
                                >
                                    <PosIcon name="add" size={18} />
                                </button>
                                <button
                                    type="button"
                                    className="cart__remove"
                                    aria-label={`Remove ${item.name}`}
                                    onClick={() => removeFromCart(item.productId)}
                                >
                                    <PosIcon name="delete" size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
