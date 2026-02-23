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
    // Clean braces if present (backend artifact)
    url = url.replace(/[{}]/g, '');

    if (!url) return null;
    if (url.startsWith('data:') || /^https?:\/\//i.test(url)) return url;

    return buildAssetUrl(url);
  }, [product.imageUrls]);

  const showImage = imageUrl && !imgError;

  return (
    <div
      onClick={(e) => {
        if (!e.defaultPrevented) {
          onSelect();
        }
      }}
      className={`group bg-white dark:bg-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] rounded-[1.5rem] transition-all duration-300 flex flex-col overflow-hidden cursor-pointer h-full active:scale-[0.98] ${isSelected ? 'ring-2 ring-blue-500 shadow-lg scale-100 border-transparent dark:border-transparent' : 'border border-gray-100/50 dark:border-white/5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
        }`}
    >
      {/* Card Header / Image Area */}
      <div className="relative aspect-[4/3] bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
        {showImage ? (
          <img
            src={imageUrl!}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full backdrop-blur-xl border shadow-sm ${asNumber(product.stock) <= (product.reorderPoint ?? storeSettings.lowStockThreshold)
            ? 'bg-rose-500/90 text-white border-rose-500/20'
            : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-white/40 dark:border-white/10'
            }`}>
            {asNumber(product.stock)} in stock
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <div className={`text-[11px] font-medium tracking-wide ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{categoryName}</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono tracking-wider">{product.sku}</div>
          </div>
          <h3 className={`font-semibold text-[15px] sm:text-[16px] leading-[1.3] mb-1 line-clamp-2 transition-colors ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
            {product.name}
          </h3>
        </div>
        <div className="text-[17px] sm:text-[19px] font-semibold tracking-tight text-gray-900 dark:text-white mt-3">
          {formatPrice(product.price)}
          {product.unitOfMeasure === 'kg' && <span className="text-sm font-medium text-gray-400 dark:text-gray-500"> / kg</span>}
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

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-[1.25rem] shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-gray-100/50 dark:border-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-300 ease-out cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] active:scale-[0.98] ${isSelected ? 'ring-2 ring-blue-500 shadow-lg scale-100 border-transparent dark:border-transparent' : ''
        }`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0 mb-3 sm:mb-0 sm:mr-4 w-full">
        <div className="flex flex-col mb-1 items-start gap-1 sm:gap-2">
          <h3 className={`font-semibold text-[16px] cursor-pointer truncate mr-2 ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-white'}`}>
            {product.name}
          </h3>
          <span className={`text-[10px] px-2 py-0.5 font-bold tracking-wide uppercase rounded-full mt-1 ${asNumber(product.stock) <= (product.reorderPoint ?? storeSettings.lowStockThreshold) ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'}`}>
            {asNumber(product.stock)} in stock
          </span>
        </div>
        <div className="text-[13px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 mt-2">
          <span className="font-mono text-[12px] text-gray-400 dark:text-gray-500">SKU: {product.sku}</span>
          <span><span className="text-gray-400 dark:text-gray-500">Category:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{categoryName}</span></span>
          <span className="font-medium text-slate-900 dark:text-white text-[14px]">{formatPrice(product.price)}{product.unitOfMeasure === 'kg' ? <span className="text-xs text-gray-500 font-normal"> / kg</span> : ''}</span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
        <button
          className={`flex-1 sm:flex-none px-4 py-2 text-[13px] font-semibold tracking-wide rounded-full transition-all duration-300 active:scale-95 ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected ? 'Viewing' : 'View Details'}
        </button>
        {canManage && (
          <button
            className="flex-1 sm:flex-none px-4 py-2 text-[13px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all duration-300 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              onAdjustStock();
            }}
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
