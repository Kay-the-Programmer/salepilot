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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Image Section */}
            <div className="lg:col-span-1">
                <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/60 backdrop-blur-2xl rounded-[1.75rem] border border-slate-200/40 dark:border-white/5 overflow-hidden relative aspect-square shadow-sm transition-all duration-300 hover:shadow-lg">
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
                                    <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-3">
                            <ShoppingCartIcon className="w-14 h-14" />
                            <p className="text-sm text-slate-400 dark:text-slate-600 font-medium">No image</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Key Information */}
            <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Price Card */}
                    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-slate-200/40 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-3">Price</div>
                        <div className="text-[30px] font-black text-slate-900 dark:text-white tracking-tight">
                            {formatCurrency(price, storeSettings)}
                        </div>
                        {product.unitOfMeasure === 'kg' && (
                            <div className="text-[12px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">per kg</div>
                        )}
                    </div>
                    {/* Profit Card */}
                    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-slate-200/40 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-3">Profit</div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className={`text-[30px] font-black tracking-tight ${profitAmount > 0 ? 'text-emerald-500' : profitAmount < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                {formatCurrency(profitAmount, storeSettings)}
                            </span>
                            {profitMargin !== null && (
                                <span className={`text-[12px] font-extrabold px-2 py-1 rounded-full ${profitMargin > 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
                                    {profitMargin > 0 ? '+' : ''}{profitMargin.toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock Status */}
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-slate-200/40 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                    <StockIndicator product={product} storeSettings={storeSettings} />
                </div>
            </div>
        </div>
    );
};

export default ProductOverview;
