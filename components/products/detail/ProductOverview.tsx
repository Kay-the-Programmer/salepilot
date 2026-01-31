import React, { useMemo, useState, useEffect } from 'react';
import { Product, StoreSettings } from '@/types.ts';
import { buildAssetUrl } from '@/services/api';
import { formatCurrency } from '@/utils/currency.ts';
import ShoppingCartIcon from '@/components/icons/ShoppingCartIcon';
import StockIndicator from './StockIndicator';


interface ProductOverviewProps {
    product: Product;
    storeSettings: StoreSettings;
}

const ProductOverview: React.FC<ProductOverviewProps> = ({ product, storeSettings }) => {
    const [mainImage, setMainImage] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);

    const rawImageUrls = useMemo(() => (product.imageUrls || []).map((url: string) => url.replace(/[{}]/g, '')), [product.imageUrls]);
    const imageUrls = useMemo(() => rawImageUrls.map((url: string) => url && !url.startsWith('data:') && !/^https?:\/\//i.test(url)
        ? buildAssetUrl(url)
        : url
    ), [rawImageUrls]);

    useEffect(() => {
        const firstImageUrl = imageUrls[0] || '';
        setMainImage(firstImageUrl);
        setImageLoaded(false);
    }, [product.id, imageUrls]);

    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const costPrice = typeof product.costPrice === 'string' ? parseFloat(product.costPrice || '0') : (product.costPrice || 0);
    const profitMargin = price > 0 && costPrice > 0 ? ((price - costPrice) / price) * 100 : null;
    const profitAmount = price - costPrice;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Section - Full width on mobile, 1/3 on desktop */}
            <div className="lg:col-span-1">
                <div glass-effect="" className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative aspect-square">
                    {mainImage ? (
                        <>
                            <img
                                src={mainImage}
                                alt={product.name}
                                className="w-full h-full object-contain"
                                onLoad={() => setImageLoaded(true)}
                            />
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                            <ShoppingCartIcon className="w-16 h-16" />
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-3">No image</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Key Information - 2/3 on desktop */}
            <div className="lg:col-span-2 space-y-4">
                {/* Price and Profit */}
                <div className="grid grid-cols-2 gap-4">
                    <div glass-effect="" className="rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Price</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(price, storeSettings)}
                        </div>
                    </div>
                    <div glass-effect="" className="rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Profit</div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${profitAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                {formatCurrency(profitAmount, storeSettings)}
                            </span>
                            {profitMargin !== null && (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {profitMargin.toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock Status */}
                <div glass-effect="" className="rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <StockIndicator product={product} storeSettings={storeSettings} />
                </div>
            </div>
        </div>
    );
};

export default ProductOverview;
