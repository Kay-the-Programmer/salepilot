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
                <div className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-white/5 overflow-hidden relative aspect-square shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-none transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] group">
                    {mainImage ? (
                        <>
                            <img
                                src={mainImage}
                                alt={product.name}
                                className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                                onLoad={() => setImageLoaded(true)}
                            />
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-slate-200/20 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-4">
                            <div className="p-5 rounded-full bg-slate-50 dark:bg-white/5">
                                <ShoppingCartIcon className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">No image available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Key Information */}
            <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-5">
                    {/* Price Card */}
                    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.25rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_40px_80px_rgba(0,0,0,0.2)] transition-all duration-500 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Unit Price</div>
                        <div className="text-[36px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">
                            {formatCurrency(price, storeSettings)}
                        </div>
                        {product.unitOfMeasure === 'kg' && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">per kilogram</div>
                        )}
                    </div>
                    {/* Profit Card */}
                    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.25rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_40px_80px_rgba(0,0,0,0.2)] transition-all duration-500 relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ${profitAmount > 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`}></div>
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Margin</div>
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <span className={`text-[36px] font-black tracking-tighter leading-none ${profitAmount > 0 ? 'text-emerald-500' : profitAmount < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                {formatCurrency(profitAmount, storeSettings)}
                            </span>
                            {profitMargin !== null && (
                                <span className={`text-[11px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase border ${profitMargin > 0 ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-600 bg-rose-500/10 border-rose-500/20'}`}>
                                    {profitMargin > 0 ? '+' : ''}{profitMargin.toFixed(0)}% MARGIN
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock Status */}
                <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.25rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_40px_80px_rgba(0,0,0,0.2)] transition-all duration-500">
                    <StockIndicator product={product} storeSettings={storeSettings} />
                </div>
            </div>
        </div>
    );
};

export default ProductOverview;
