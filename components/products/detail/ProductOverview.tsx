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
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[24px] border border-slate-200/50 dark:border-white/5 overflow-hidden relative aspect-square shadow-sm transition-all duration-300 hover:shadow-md">
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
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[24px] p-6 border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Price</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-google">
                            {formatCurrency(price, storeSettings)}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[24px] p-6 border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Profit</div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black font-google ${profitAmount > 0 ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                {formatCurrency(profitAmount, storeSettings)}
                            </span>
                            {profitMargin !== null && (
                                <span className="text-sm font-bold text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded-full">
                                    +{profitMargin.toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock Status */}
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[24px] p-6 border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                    <StockIndicator product={product} storeSettings={storeSettings} />
                </div>
            </div>
        </div>
    );
};

export default ProductOverview;
