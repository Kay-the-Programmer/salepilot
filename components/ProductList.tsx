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
}

// Subcomponent to handle individual product card logic, especially image loading
const ProductCard: React.FC<{
  product: Product;
  categoryName: string;
  storeSettings: StoreSettings;
  canManage: boolean;
  onSelect: () => void;
  onAdjust: () => void;
}> = ({ product, categoryName, storeSettings, canManage, onSelect, onAdjust }) => {
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
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Card Header / Image Area */}
      <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer" onClick={onSelect}>
        {showImage ? (
          <img
            src={imageUrl!}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-lg backdrop-blur-md border border-white/20 shadow-sm ${asNumber(product.stock) <= (product.reorderPoint ?? storeSettings.lowStockThreshold)
            ? 'bg-red-500/90 text-white'
            : 'bg-white/90 text-gray-700'
            }`}>
            {asNumber(product.stock)} left
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{categoryName}</div>
            <div className="text-xs text-gray-400 font-mono">{product.sku}</div>
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors cursor-pointer" onClick={onSelect}>
            {product.name}
          </h3>
          <div className="text-xl font-bold text-gray-900 mb-4">
            {formatPrice(product.price)}
            {product.unitOfMeasure === 'kg' && <span className="text-sm text-gray-500 font-normal"> / kg</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={onSelect}
            className="py-2 px-4 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors text-sm"
          >
            View
          </button>
          {canManage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdjust();
              }}
              className="py-2 px-4 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors text-sm"
            >
              Adjust
            </button>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  categoryName={getCategoryName(p.categoryId)}
                  storeSettings={storeSettings}
                  canManage={canManage}
                  onSelect={() => onSelectProduct(p)}
                  onAdjust={() => onAdjustStock(p)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded shadow p-4 flex items-center justify-between hover:shadow-md transition">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-gray-900 cursor-pointer truncate mr-2" onClick={() => onSelectProduct(p)}>
                        {p.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${asNumber(p.stock) <= (p.reorderPoint ?? storeSettings.lowStockThreshold) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {asNumber(p.stock)} in stock
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-x-4">
                      <span>SKU: {p.sku}</span>
                      <span>Category: {getCategoryName(p.categoryId)}</span>
                      <span>Price: {formatPrice(p.price)}{p.unitOfMeasure === 'kg' ? ' / kg' : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => onSelectProduct(p)}
                    >
                      View
                    </button>
                    {canManage && (
                      <button
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        onClick={() => onAdjustStock(p)}
                      >
                        Adj
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;
