import React from 'react';
import { Product, Category, StoreSettings } from '../types';
import { formatCurrency } from '@/utils/currency';
import { buildAssetUrl } from '../services/api';

import UnifiedListGrid from './ui/UnifiedListGrid';
import { asNumber, stockStatus } from './inventory/stockStatus';

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
  const tone = stockStatus(product, storeSettings);

  // Minimal status chip — semantic tint, no shadow/blur (DESIGN.md status chips).
  const chipCls = tone.key === 'out'
    ? 'bg-danger-muted text-danger'
    : tone.key === 'low'
      ? 'bg-warning-muted text-warning'
      : 'bg-surface-variant text-brand-text-muted';

  return (
    <div
      onClick={(e) => { if (!e.defaultPrevented) onSelect(); }}
      className={`group relative h-full overflow-hidden rounded-lg bg-surface cursor-pointer transition-colors ${isSelected
        ? 'border-2 border-primary'
        : 'border border-brand-border hover:border-primary/50'
        }`}
    >
      {/* Image — subtle tonal tint, no gradient */}
      <div className="relative aspect-[4/3] bg-surface-variant flex items-center justify-center overflow-hidden">
        {showImage ? (
          <img
            src={imageUrl!}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg className="w-10 h-10 text-brand-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        )}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold ${chipCls}`}>
          {tone.key === 'out' ? 'Sold out' : `${stock} left`}
        </span>
      </div>

      {/* Body — price anchored bottom-right (DESIGN.md product tile) */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="truncate text-[11px] font-medium text-brand-text-muted">{categoryName}</span>
          <span className="shrink-0 font-mono text-[10px] text-brand-text-muted/70">#{product.sku?.slice(-6) || 'N/A'}</span>
        </div>
        <h3 className={`line-clamp-2 text-sm font-semibold leading-snug ${isSelected ? 'text-primary' : 'text-brand-text'}`}>
          {product.name}
        </h3>
        <p className="mt-2 text-right text-base font-bold tabular-nums text-brand-text">
          {formatPrice(product.price)}
          {product.unitOfMeasure === 'kg' && <span className="ml-1 text-[11px] font-medium text-brand-text-muted">/kg</span>}
        </p>
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
  const tone = stockStatus(product, storeSettings);

  const dotCls = tone.key === 'out' ? 'bg-danger' : tone.key === 'low' ? 'bg-warning' : 'bg-success';

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5 cursor-pointer transition-colors ${isSelected
        ? 'border-2 border-primary'
        : 'border border-brand-border hover:border-primary/50'
        }`}
    >
      {/* Status dot */}
      <span className={`shrink-0 w-2 h-2 rounded-full ${dotCls}`} title={tone.label} />

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <h3 className={`truncate text-sm font-semibold ${isSelected ? 'text-primary' : 'text-brand-text'}`}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-brand-text-muted">
          <span className="truncate">{categoryName}</span>
          <span className="text-brand-border">·</span>
          <span className="truncate font-mono">{product.sku}</span>
        </div>
      </div>

      {/* Price + stock, right-aligned */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums text-brand-text">{formatPrice(product.price)}</p>
        <p className="text-[11px] tabular-nums text-brand-text-muted">{stock} {product.unitOfMeasure === 'kg' ? 'kg' : 'units'}</p>
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
