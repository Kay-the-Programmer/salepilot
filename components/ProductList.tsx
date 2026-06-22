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

const asNumber = (val: any) => {
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : 0;
};

// Shared stock status → Confident Clarity semantics (green / amber / red)
const stockTone = (product: Product, storeSettings: StoreSettings) => {
  const stock = asNumber(product.stock);
  const reorder = product.reorderPoint ?? storeSettings.lowStockThreshold;
  if (stock <= 0) return { key: 'out', label: 'Out of stock' as const };
  if (stock <= reorder) return { key: 'low', label: 'Low stock' as const };
  return { key: 'ok', label: 'In stock' as const };
};

const ProductCard: React.FC<{
  product: Product;
  categoryName: string;
  storeSettings: StoreSettings;
  onSelect: () => void;
  isSelected?: boolean;
}> = React.memo(({ product, categoryName, storeSettings, onSelect, isSelected }) => {
  const [imgError, setImgError] = React.useState(false);
  const formatPrice = (val: any): string => formatCurrency(val, storeSettings);

  const imageUrl = React.useMemo(() => {
    if (!product.imageUrls || product.imageUrls.length === 0) return null;
    let url = product.imageUrls[0];
    url = url.replace(/[{}]/g, '');
    if (!url) return null;
    if (url.startsWith('data:') || /^https?:\/\//i.test(url)) return url;
    return buildAssetUrl(url);
  }, [product.imageUrls]);

  const showImage = imageUrl && !imgError;
  const stock = asNumber(product.stock);
  const tone = stockTone(product, storeSettings);

  const badgeCls = tone.key === 'out'
    ? 'bg-danger text-white'
    : tone.key === 'low'
      ? 'bg-warning text-white'
      : 'bg-brand-text/80 dark:bg-white/90 text-white dark:text-brand-text';

  return (
    <div
      onClick={(e) => { if (!e.defaultPrevented) onSelect(); }}
      className={`group relative bg-surface/70 dark:bg-slate-900/40 backdrop-blur-2xl border rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer h-full active:scale-[0.98] ${isSelected
        ? 'border-primary ring-2 ring-primary/40 shadow-[0_12px_40px_rgba(0,128,96,0.15)] bg-success-muted/40'
        : 'border-brand-border shadow-sm hover:shadow-[0_18px_40px_rgba(26,26,46,0.08)] dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:border-primary/40'
        }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-warm-100 to-warm-200 dark:from-slate-800/30 dark:to-slate-900/50 flex items-center justify-center overflow-hidden">
        {showImage ? (
          <img
            src={imageUrl!}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-brand-text-muted/40">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}

        {/* Stock badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] rounded-full backdrop-blur-md shadow-sm ${badgeCls}`}>
            {tone.key === 'out' ? 'Sold Out' : `${stock} left`}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-[10px] font-black tracking-[0.12em] uppercase px-2 py-0.5 rounded-md ${isSelected ? 'bg-success-muted dark:bg-primary/20 text-primary' : 'bg-warm-100 dark:bg-white/5 text-brand-text-muted'}`}>{categoryName}</span>
            <span className="text-[9px] text-brand-text-muted/60 font-mono font-bold tracking-tighter">#{product.sku?.slice(-6) || 'N/A'}</span>
          </div>
          <h3 className={`font-semibold text-[15px] leading-snug mb-1 line-clamp-2 transition-colors ${isSelected ? 'text-primary dark:text-white' : 'text-brand-text group-hover:text-primary'}`}>
            {product.name}
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[18px] font-black tracking-tight text-brand-text tabular-nums">
            {formatPrice(product.price)}
            {product.unitOfMeasure === 'kg' && <span className="text-[11px] font-bold text-brand-text-muted ml-1">/kg</span>}
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
  isSelected?: boolean;
}> = React.memo(({ product, categoryName, storeSettings, onSelect, isSelected }) => {
  const formatPrice = (val: any): string => formatCurrency(val, storeSettings);
  const stock = asNumber(product.stock);
  const tone = stockTone(product, storeSettings);

  const pillCls = tone.key === 'out'
    ? 'bg-danger-muted text-danger'
    : tone.key === 'low'
      ? 'bg-warning-muted text-warning'
      : 'bg-success-muted text-primary';

  return (
    <div
      className={`group relative bg-surface/70 dark:bg-slate-900/40 backdrop-blur-2xl border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all duration-300 cursor-pointer active:scale-[0.99] ${isSelected
        ? 'border-primary ring-2 ring-primary/40 shadow-[0_8px_30px_rgba(0,128,96,0.12)] bg-success-muted/40'
        : 'border-brand-border shadow-sm hover:shadow-[0_12px_30px_rgba(26,26,46,0.06)] dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:border-primary/40'
        }`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-1.5">
          <h3 className={`font-bold text-[16px] tracking-tight truncate transition-colors ${isSelected ? 'text-primary dark:text-white' : 'text-brand-text group-hover:text-primary'}`}>
            {product.name}
          </h3>
          <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 font-black tracking-widest uppercase rounded-full ${pillCls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {stock} {product.unitOfMeasure === 'kg' ? 'kg' : 'units'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[11px] font-semibold tracking-widest text-brand-text-muted uppercase">{categoryName}</span>
          <div className="h-3 w-px bg-brand-border hidden sm:block"></div>
          <span className="text-[11px] font-mono text-brand-text-muted">SKU: {product.sku}</span>
          <div className="h-3 w-px bg-brand-border hidden sm:block"></div>
          <span className="text-[15px] font-black tracking-tight text-brand-text tabular-nums">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
    </div>
  );
});

const ProductList: React.FC<Props> = React.memo(({
  products,
  categories,
  onSelectProduct,
  isLoading,
  error,
  storeSettings,
  viewMode = 'grid',
  selectedProductId
}) => {
  const getCategoryName = (categoryId?: string) =>
    categoryId ? (categories.find(c => c.id === categoryId)?.name || '-') : '-';

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
      className="!p-0"
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
          isSelected={isSelected}
        />
      )}
    />
  );
});

export default ProductList;
