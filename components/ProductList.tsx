import React from 'react';
import { Product, Category, StoreSettings } from '../types';
import { formatCurrency } from '@/utils/currency';
import { buildAssetUrl } from '../services/api';

import UnifiedListGrid from './ui/UnifiedListGrid';

interface Props {
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
  onStockChange: (productId: string, newStock: number) => void;
  onAdjustStock: (product: Product) => void;
  isLoading: boolean;
  error: string | null;
  storeSettings: StoreSettings;
  userRole: 'admin' | 'staff' | 'inventory_manager';
  viewMode?: 'grid' | 'list';
  selectedProductId?: string | null;
}

// Subcomponent to handle individual product card logic, especially image loading
const ProductCard: React.FC<{
  product: Product;
  categoryName: string;
  storeSettings: StoreSettings;
  onSelect: () => void;
  isSelected?: boolean;
}> = React.memo(({ product, categoryName, storeSettings, onSelect, isSelected }) => {
  const [imgError, setImgError] = React.useState(false);

  const formatPrice = (val: any): string => formatCurrency(val, storeSettings);
  const asNumber = (val: any) => {
    const n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };

  const imageUrl = React.useMemo(() => {
    if (!product.imageUrls || product.imageUrls.length === 0) return null;
    let url = product.imageUrls[0];
    url = url.replace(/[{}]/g, '');
    if (!url) return null;
    if (url.startsWith('data:') || /^https?:\/\//i.test(url)) return url;
    return buildAssetUrl(url);
  }, [product.imageUrls]);

  const showImage = imageUrl && !imgError;
  const isLowStock = asNumber(product.stock) <= (product.reorderPoint ?? storeSettings.lowStockThreshold);

  return (
    <div
      onClick={(e) => {
        if (!e.defaultPrevented) {
          onSelect();
        }
      }}
      className={`group relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2rem] transition-all duration-500 overflow-hidden cursor-pointer h-full active:scale-[0.98] hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${isSelected
        ? 'ring-2 ring-blue-500/50 shadow-[0_12px_40px_rgba(59,130,246,0.2)]'
        : 'shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none hover:translate-y-[-4px]'
        }`}
    >
      {/* Card Header / Image Area */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50/50 to-slate-200/50 dark:from-slate-800/30 dark:to-slate-900/50 flex items-center justify-center overflow-hidden">
        {showImage ? (
          <img
            src={imageUrl!}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-slate-300 dark:text-slate-700/50">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] rounded-full backdrop-blur-md border shadow-sm ${isLowStock
            ? 'bg-rose-500 text-white border-white/20'
            : 'bg-slate-900/80 dark:bg-white/90 text-white dark:text-slate-900 border-white/10 dark:border-slate-200'
            }`}>
            {asNumber(product.stock)} LEFT
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-[10px] font-black tracking-[0.12em] uppercase px-2 py-0.5 rounded-md ${isSelected ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>{categoryName}</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-600 font-mono font-bold tracking-tighter opacity-60">#{product.sku?.slice(-6) || 'N/A'}</span>
          </div>
          <h3 className={`font-bold text-[15px] leading-snug mb-1 line-clamp-2 transition-colors ${isSelected ? 'text-blue-900 dark:text-white' : 'text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
            {product.name}
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[18px] font-black tracking-tighter text-slate-900 dark:text-white">
            {formatPrice(product.price)}
            {product.unitOfMeasure === 'kg' && <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-1">/kg</span>}
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-500'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

const ProductListRow: React.FC<{
  product: Product;
  categoryName: string;
  storeSettings: StoreSettings;
  onSelect: () => void;
  onAdjustStock: () => void;
  isSelected?: boolean;
  canManage: boolean;
}> = React.memo(({ product, categoryName, storeSettings, onSelect, onAdjustStock, isSelected, canManage }) => {
  const formatPrice = (val: any): string => formatCurrency(val, storeSettings);
  const asNumber = (val: any) => {
    const n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };
  const isLowStock = asNumber(product.stock) <= (product.reorderPoint ?? storeSettings.lowStockThreshold);

  return (
    <div
      className={`group relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[1.5rem] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all duration-500 cursor-pointer hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:scale-[1.005] active:scale-[0.985] ${isSelected
        ? 'ring-2 ring-blue-500/50 shadow-[0_8px_30px_rgba(59,130,246,0.15)]'
        : 'shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
        }`}
      onClick={onSelect}
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-1.5">
          <h3 className={`font-bold text-[16px] tracking-tight truncate ${isSelected ? 'text-blue-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
            {product.name}
          </h3>
          <span className={`text-[9px] px-2.5 py-0.5 font-black tracking-widest uppercase rounded-full border ${isLowStock
            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20'
            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20'
            }`}>
            {asNumber(product.stock)} {product.unitOfMeasure === 'kg' ? 'kg' : 'units'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[11px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">{categoryName}</span>
          <div className="h-3 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-600">SKU: {product.sku}</span>
          <div className="h-3 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <span className="text-[15px] font-black tracking-tighter text-slate-900 dark:text-white">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        <button
          className={`px-4 py-2 text-[13px] font-bold tracking-wide rounded-full transition-all duration-200 active:scale-90 ${isSelected
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          {isSelected ? 'Viewing' : 'Details'}
        </button>
        {canManage && (
          <button
            className="px-4 py-2 text-[13px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold tracking-wide rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all duration-200 active:scale-90"
            onClick={(e) => { e.stopPropagation(); onAdjustStock(); }}
          >
            Adjust
          </button>
        )}
      </div>
    </div>
  );
});

const ProductList: React.FC<Props> = React.memo(({
  products,
  categories,
  onSelectProduct,
  onAdjustStock,
  isLoading,
  error,
  storeSettings,
  userRole,
  viewMode = 'grid',
  selectedProductId
}) => {
  const getCategoryName = (categoryId?: string) =>
    categoryId ? (categories.find(c => c.id === categoryId)?.name || '-') : '-';

  const canManage = userRole === 'admin' || userRole === 'inventory_manager';

  return (
    <UnifiedListGrid<Product>
      items={products}
      viewMode={viewMode}
      isLoading={isLoading}
      error={error}
      emptyMessage="No products to display."
      selectedId={selectedProductId}
      getItemId={(product) => product.id}
      onItemClick={(product) => onSelectProduct(product)}
      className="!p-4"
      gridColumns={{ minWidth: '180px' }}
      renderGridItem={(product, _index, isSelected) => (
        <ProductCard
          product={product}
          categoryName={getCategoryName(product.categoryId)}
          storeSettings={storeSettings}
          onSelect={() => onSelectProduct(product)}
          isSelected={isSelected}
        />
      )}
      renderListItem={(product, _index, isSelected) => (
        <ProductListRow
          product={product}
          categoryName={getCategoryName(product.categoryId)}
          storeSettings={storeSettings}
          onSelect={() => onSelectProduct(product)}
          onAdjustStock={() => onAdjustStock(product)}
          isSelected={isSelected}
          canManage={canManage}
        />
      )}
    />
  );
});

export default ProductList;
