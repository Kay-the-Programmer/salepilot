import React from 'react';
import { Product, Category, StoreSettings } from '../types';
import { formatCurrency } from '@/utils/currency';
import { buildAssetUrl } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

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
}> = ({ product, categoryName, storeSettings, onSelect, isSelected }) => {
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
      onClick={onSelect}
      className={`group bg-white rounded-2xl shadow-sm border transition-all duration-300 flex flex-col overflow-hidden cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md transform scale-[1.02]' : 'border-gray-100 hover:shadow-lg hover:border-blue-100'
        }`}
    >
      {/* Card Header / Image Area */}
      <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
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
            <div className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>{categoryName}</div>
            <div className="text-[10px] text-gray-300 font-mono">{product.sku}</div>
          </div>
          <h3 className={`font-bold text-sm sm:text-base mb-1 line-clamp-2 leading-tight transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'}`}>
            {product.name}
          </h3>
        </div>
        <div className="text-lg sm:text-xl font-black text-gray-900 mt-2">
          {formatPrice(product.price)}
          {product.unitOfMeasure === 'kg' && <span className="text-xs text-gray-500 font-normal"> / kg</span>}
        </div>
      </div>
    </div>
  );
};

const ProductList: React.FC<Props> = ({
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
  if (isLoading) return <LoadingSpinner fullScreen={false} text="Loading products..." className="py-12" />;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const getCategoryName = (categoryId?: string) =>
    categoryId ? (categories.find(c => c.id === categoryId)?.name || '-') : '-';

  const canManage = userRole === 'admin' || userRole === 'inventory_manager';

  const formatPrice = (val: any): string => formatCurrency(val, storeSettings);
  const asNumber = (val: any) => {
    const n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="p-4">
      {products.length === 0 ? (
        <div className="text-gray-600">No products to display.</div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div
              className="grid gap-4 sm:gap-6"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))'
              }}
            >
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  categoryName={getCategoryName(p.categoryId)}
                  storeSettings={storeSettings}
                  onSelect={() => onSelectProduct(p)}
                  isSelected={selectedProductId === p.id}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((p) => {
                const isSelected = selectedProductId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border shadow-sm p-4 flex items-center justify-between transition-all duration-200 cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/20' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'
                      }`}
                    onClick={() => onSelectProduct(p)}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center">
                        <h3 className={`font-semibold cursor-pointer truncate mr-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {p.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${asNumber(p.stock) <= (p.reorderPoint ?? storeSettings.lowStockThreshold) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {asNumber(p.stock)} in stock
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-x-4">
                        <span className="font-mono text-xs">SKU: {p.sku}</span>
                        <span>Category: {getCategoryName(p.categoryId)}</span>
                        <span className="font-medium text-gray-700">Price: {formatPrice(p.price)}{p.unitOfMeasure === 'kg' ? ' / kg' : ''}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(p);
                        }}
                      >
                        {isSelected ? 'Viewing' : 'View Details'}
                      </button>
                      {canManage && (
                        <button
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAdjustStock(p);
                          }}
                        >
                          Adjust
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;
