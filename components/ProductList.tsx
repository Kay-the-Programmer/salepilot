import React from 'react';
import { Product, Category, StoreSettings } from '../types';
import { formatCurrency } from '@/utils/currency';

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
}

const ProductList: React.FC<Props> = ({
  products,
  categories,
  onSelectProduct,
  onStockChange,
  onAdjustStock,
  isLoading,
  error,
  storeSettings,
  userRole,
}) => {
  if (isLoading) return <div className="p-6">Loading products...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const categoryName = (categoryId?: string) =>
    categoryId ? (categories.find(c => c.id === categoryId)?.name || '-') : '-';

  const canManage = userRole === 'admin' || userRole === 'inventory_manager';

  const formatPrice = (val: any): string => formatCurrency(val, storeSettings);

  const asNumber = (val: any): number => {
    const n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="p-4">
      {products.length === 0 ? (
        <div className="text-gray-600">No products to display.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded shadow p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 cursor-pointer" onClick={() => onSelectProduct(p)}>
                    {p.name}
                  </h3>
                  <div className="text-sm text-gray-500">SKU: {p.sku}</div>
                  <div className="text-sm text-gray-500">Category: {categoryName(p.categoryId)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-700">Price: {formatPrice(p.price)}{p.unitOfMeasure === 'kg' ? ' / kg' : ''}</div>
                  <div className={`text-sm ${asNumber(p.stock) <= (p.reorderPoint ?? storeSettings.lowStockThreshold) ? 'text-red-600' : 'text-gray-700'}`}>
                    Stock: {asNumber(p.stock)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => onSelectProduct(p)}
                >
                  View
                </button>
                {canManage && (
                  <>
                    <button
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      onClick={() => onAdjustStock(p)}
                    >
                      Adjust Stock
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
