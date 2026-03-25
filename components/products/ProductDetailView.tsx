import React from 'react';
import { Product, Category, Supplier, StoreSettings, User } from '@/types.ts';
import ProductDetailHeader from './detail/ProductDetailHeader';
import ProductOverview from './detail/ProductOverview';
import ProductDetailTabs from './detail/ProductDetailTabs';
import PencilIcon from '@/components/icons/PencilIcon';
import AdjustmentsHorizontalIcon from '@/components/icons/AdjustmentsHorizontalIcon';
import ShoppingCartIcon from '@/components/icons/ShoppingCartIcon';
import PrinterIcon from '@/components/icons/PrinterIcon';
import ArchiveBoxIcon from '@/components/icons/ArchiveBoxIcon';
import RestoreIcon from '@/components/icons/RestoreIcon';
import TrashIcon from '@/components/icons/TrashIcon';

const ProductDetailView: React.FC<{
  product: Product;
  category?: Category;
  supplier?: Supplier;
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
  const canManage = user.role === 'admin' || user.role === 'inventory_manager';

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      {/* Header */}
      <ProductDetailHeader
        product={product}
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-2 sm:p-4 space-y-4">
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
            storeSettings={storeSettings}
          />

          {/* New Actions Section (Stacked) */}
          {canManage && (
            <div className="mt-8 space-y-3 pb-24">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Management Actions</h3>
              
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => onAdjustStock(product)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-2xl text-[14px] font-bold text-slate-800 dark:text-slate-200 transition-all active:scale-[0.98] hover:bg-white dark:hover:bg-slate-800"
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" />
                  Adjust Stock Level
                </button>

                {onPersonalUse && (
                  <button
                    onClick={() => onPersonalUse(product)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-2xl text-[14px] font-bold text-slate-800 dark:text-slate-200 transition-all active:scale-[0.98] hover:bg-white dark:hover:bg-slate-800"
                  >
                    <ShoppingCartIcon className="w-5 h-5 text-indigo-500" />
                    Assign to Personal Use
                  </button>
                )}

                <button
                  onClick={() => onPrintLabel(product)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-2xl text-[14px] font-bold text-slate-800 dark:text-slate-200 transition-all active:scale-[0.98] hover:bg-white dark:hover:bg-slate-800"
                >
                  <PrinterIcon className="w-5 h-5 text-slate-500" />
                  Print Label (Barcode/Tags)
                </button>

                {product.status === 'active' ? (
                  <button
                    onClick={() => onArchive(product.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 bg-amber-50/50 dark:bg-amber-900/10 backdrop-blur-xl border border-amber-100/50 dark:border-amber-900/20 rounded-2xl text-[14px] font-bold text-amber-700 dark:text-amber-400 transition-all active:scale-[0.98] hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    <ArchiveBoxIcon className="w-5 h-5" />
                    Archive Product
                  </button>
                ) : (
                  <button
                    onClick={() => onArchive(product.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 bg-emerald-50/50 dark:bg-emerald-900/10 backdrop-blur-xl border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl text-[14px] font-bold text-emerald-700 dark:text-emerald-400 transition-all active:scale-[0.98] hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    <RestoreIcon className="w-5 h-5" />
                    Restore Product
                  </button>
                )}

                <button
                  onClick={() => onDelete(product)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 bg-rose-50/50 dark:bg-rose-900/10 backdrop-blur-xl border border-rose-100/50 dark:border-rose-900/20 rounded-2xl text-[14px] font-bold text-rose-600 dark:text-rose-400 transition-all active:scale-[0.98] hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <TrashIcon className="w-5 h-5" />
                  Delete Product Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Edit Button */}
      {canManage && (
        <button
          onClick={() => onEdit(product)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 dark:bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.1)] flex items-center justify-center text-white dark:text-slate-900 transition-all hover:scale-110 active:scale-90 z-50 group overflow-hidden"
          aria-label="Edit Product"
        >
          <PencilIcon className="w-6 h-6 relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      )}
    </div>
  );
};

export default ProductDetailView;