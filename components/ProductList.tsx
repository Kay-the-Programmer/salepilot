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
        // Only trigger selection if not handled by child elements
        if (!e.defaultPrevented) {
          onSelect();
        }
      }}
      className={`group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border transition-all duration-300 flex flex-col overflow-hidden cursor-pointer h-full ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md transform scale-[1.02]' : 'border-gray-100 dark:border-white/10 hover:shadow-lg dark:hover:shadow-blue-900/20 hover:border-blue-100 dark:hover:border-blue-900/50'
        }`}
    >
      {/* Card Header / Image Area */}
      <div className="relative aspect-[4/3] bg-gray-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
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
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md border border-white/20 shadow-sm ${asNumber(product.stock) <= (product.reorderPoint ?? storeSettings.lowStockThreshold)
            ? 'bg-red-500/90 text-white'
            : 'bg-white/90 text-gray-700'
            }`}>
            {asNumber(product.stock)} in stock
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-0.5">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>{categoryName}</div>
            <div className="text-[10px] text-gray-300 dark:text-gray-600 font-mono">{product.sku}</div>
          </div>
          <h3 className={`font-bold text-sm sm:text-base mb-1 line-clamp-2 leading-tight transition-colors ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
            {product.name}
          </h3>
        </div>
        <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-2">
          {formatPrice(product.price)}
          {product.unitOfMeasure === 'kg' && <span className="text-xs text-gray-500 dark:text-gray-400 font-normal"> / kg</span>}
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
      className={`rounded-xl border shadow-sm p-4 flex items-center justify-between transition-all duration-200 cursor-pointer ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 ring-1 ring-blue-500/20' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-md'
        }`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center">
          <h3 className={`font-semibold cursor-pointer truncate mr-2 ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
            {product.name}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${asNumber(product.stock) <= (product.reorderPoint ?? storeSettings.lowStockThreshold) ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
            {asNumber(product.stock)} in stock
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4">
          <span className="font-mono text-xs">SKU: {product.sku}</span>
          <span>Category: {categoryName}</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">Price: {formatPrice(product.price)}{product.unitOfMeasure === 'kg' ? ' / kg' : ''}</span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
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
            className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
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
