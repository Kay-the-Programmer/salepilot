import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shopService, ShopInfo } from '../../services/shop.service';
import { buildAssetUrl } from '../../services/api';
import { Product } from '../../types';
import { HiOutlineCheck, HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi2';
import { useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { logEvent } from '../../src/utils/analytics';

const ShopProductDetail: React.FC = () => {
    const { storeId, productId } = useParams<{ storeId: string; productId: string }>();
    const { shopInfo } = useOutletContext<{ shopInfo: ShopInfo }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        if (!storeId || !productId) return;
        const fetchProduct = async () => {
            try {
                const prod = await shopService.getProductById(storeId, productId);
                setProduct(prod);
            } catch (error) {
                console.error("Failed to load product", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [storeId, productId]);

    const addToCart = () => {
        if (!product || !storeId) return;

        const cartKey = `cart_${storeId}`;
        const currentCartJson = localStorage.getItem(cartKey);
        let cart = currentCartJson ? JSON.parse(currentCartJson) : [];

        const existingItemIndex = cart.findIndex((item: any) => item.id === product.id);

        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.imageUrls?.[0],
                quantity: quantity,
                stock: product.stock,
                unitOfMeasure: product.unitOfMeasure
            });
        }

        localStorage.setItem(cartKey, JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        logEvent('Shop', 'Add to Cart', product.name);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!product) return <div className="p-8 text-center">Product not found.</div>;

    const formatPrice = (price: number) => {
        return formatCurrency(price, shopInfo.settings as any);
    };

    return (
        <div className="liquid-glass-card rounded-[2rem] border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden relative h-96">
                        {product.imageUrls && product.imageUrls.length > 0 ? (
                            <img
                                src={buildAssetUrl(product.imageUrls[0])}
                                alt={product.name}
                                className="w-full h-full object-contain object-center"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600?text=No+Image' }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                        <span>{product.brand}</span>
                        {product.sku && (
                            <>
                                <span>&bull;</span>
                                <span>SKU: {product.sku}</span>
                            </>
                        )}
                    </div>

                    <div className="mb-6">
                        <p className="text-4xl font-bold text-indigo-600">{formatPrice(product.price)}</p>
                    </div>

                    <div className="prose prose-sm text-gray-500 mb-8">
                        <p>{product.description || 'No description available for this product.'}</p>
                    </div>

                    {/* Stock & Add to Cart */}
                    <div className="mt-auto border-t border-gray-100 pt-6">
                        {product.stock > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 text-green-600 font-medium">
                                    <HiOutlineCheck className="w-5 h-5" />
                                    <span>In Stock ({product.stock} {product.unitOfMeasure === 'kg' ? 'kg' : 'units'})</span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border border-gray-300 rounded-md">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="p-2 text-gray-500 hover:bg-gray-50 active:scale-95 transition-all duration-300"
                                        >
                                            <HiOutlineMinus className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={product.stock}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                                            className="w-16 text-center border-none focus:ring-0 appearance-none bg-transparent"
                                        />
                                        <button
                                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                            className="p-2 text-gray-500 hover:bg-gray-50 active:scale-95 transition-all duration-300"
                                        >
                                            <HiOutlinePlus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={addToCart}
                                        disabled={addedToCart}
                                        className={`flex-1 flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${addedToCart
                                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                                            }`}
                                    >
                                        {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50 text-red-700 rounded-md font-medium text-center">
                                Out of Stock
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopProductDetail;
