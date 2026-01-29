import React, { useMemo, useState, useEffect } from 'react';
import { Product, StoreSettings } from '@/types.ts';
import { buildAssetUrl } from '@/services/api';
import { formatCurrency } from '@/utils/currency.ts';
import ShoppingCartIcon from '@/components/icons/ShoppingCartIcon';
import StatusBadge from './StatusBadge';
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
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative aspect-square group">
                    {mainImage ? (
                        <>
                            <img
                                src={mainImage}
                                alt={product.name}
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                onLoad={() => setImageLoaded(true)}
                            />
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-8">
                            <ShoppingCartIcon className="w-16 h-16 sm:w-20 sm:h-20" />
                            <p className="text-sm text-slate-400 mt-3">No image available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pricing and Quick Stats - 2/3 on desktop */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Selling Price Card */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 sm:p-6 border border-blue-100 flex flex-col justify-center">
                    <div className="text-3xl sm:text-4xl font-bold text-slate-900">
                        {formatCurrency(price, storeSettings)}
                    </div>
                    <div className="text-sm text-slate-500 font-medium mt-1">Selling Price</div>
                </div>

                {/* Cost Card */}
                <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200">
                    <div className="text-sm text-slate-500 font-medium mb-1">Cost Price</div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {formatCurrency(costPrice, storeSettings)}
                    </div>
                </div>

                {/* Profit Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 sm:p-6 border border-emerald-100">
                    <div className="text-sm text-slate-500 font-medium mb-1">Profit</div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl sm:text-3xl font-bold ${profitAmount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {formatCurrency(profitAmount, storeSettings)}
                        </span>
                        {profitMargin !== null && (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                {profitMargin.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 flex flex-col justify-center">
                    <div className="text-sm text-slate-500 font-medium mb-2">Status</div>
                    <StatusBadge status={product.status} />
                </div>

                {/* Stock Summary */}
                <div className="sm:col-span-2 bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200">
                    <StockIndicator product={product} storeSettings={storeSettings} />
                </div>
            </div>
        </div>
    );
};

export default ProductOverview;
