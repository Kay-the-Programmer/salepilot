import React from 'react';
import { Product, Category, Supplier, StoreSettings, User } from '@/types.ts';
import ProductDetailHeader from './detail/ProductDetailHeader';
import ProductOverview from './detail/ProductOverview';
import ProductDetailTabs from './detail/ProductDetailTabs';

const ProductDetailView: React.FC<{
  product: Product;
  category?: Category;
  supplier?: Supplier;
  attributes: { name: string, value: string }[];
  storeSettings: StoreSettings;
  user: User;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onArchive: (productId: string) => void;
  onPrintLabel: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onPersonalUse?: (product: Product) => void;
  onBack?: () => void;
}> = ({
  product,
  category,
  supplier,
  attributes,
  storeSettings,
  user,
  onEdit,
  onDelete,
  onArchive,
  onPrintLabel,
  onAdjustStock,
  onPersonalUse,
  onBack
}) => {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <ProductDetailHeader
          product={product}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onPrintLabel={onPrintLabel}
          onAdjustStock={onAdjustStock}
          onPersonalUse={onPersonalUse}
          onBack={onBack}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Top Section: Product Overview */}
            <ProductOverview
              product={product}
              storeSettings={storeSettings}
            />

            {/* Tabs Section */}
            <ProductDetailTabs
              product={product}
              category={category}
              supplier={supplier}
              attributes={attributes}
              storeSettings={storeSettings}
            />
          </div>
        </div>
      </div>
    );
  };

export default ProductDetailView;