import React from 'react';
import { Product, Category, Supplier, StoreSettings, User } from '@/types.ts';
import { formatCurrency } from '@/utils/currency';
import { buildAssetUrl } from '@/services/api';
import ProductDetailHeader from './detail/ProductDetailHeader';
import PencilIcon from '@/components/icons/PencilIcon';
import AdjustmentsHorizontalIcon from '@/components/icons/AdjustmentsHorizontalIcon';
import ShoppingCartIcon from '@/components/icons/ShoppingCartIcon';
import PrinterIcon from '@/components/icons/PrinterIcon';
import ArchiveBoxIcon from '@/components/icons/ArchiveBoxIcon';
import RestoreIcon from '@/components/icons/RestoreIcon';
import TrashIcon from '@/components/icons/TrashIcon';
import CubeIcon from '@/components/icons/CubeIcon';
import TruckIcon from '@/components/icons/TruckIcon';
import ChartBarIcon from '@/components/icons/ChartBarIcon';
import ExclamationTriangleIcon from '@/components/icons/ExclamationTriangleIcon';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon';

const asNumber = (val: any) => {
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : 0;
};

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

  const price = asNumber(product.price);
  const cost = asNumber(product.costPrice);
  const stock = asNumber(product.stock);
  const reorder = product.reorderPoint ?? storeSettings.lowStockThreshold;
  const unit = product.unitOfMeasure === 'kg' ? 'kg' : 'units';
  const isOut = stock <= 0;
  const isLow = stock <= reorder;
  const isActive = product.status === 'active';

  const margin = cost > 0 && price > 0 ? Math.round(((price - cost) / price) * 100) : null;
  const inventoryValue = price * stock;

  // Heuristic capacity bar: stock relative to a sensible target above the reorder point.
  const target = Math.max(reorder * 4, stock, 1);
  const fillPct = Math.min(100, Math.round((stock / target) * 100));
  const reorderPct = Math.min(100, Math.round((reorder / target) * 100));

  const imageUrl = React.useMemo(() => {
    if (!product.imageUrls || product.imageUrls.length === 0) return null;
    let url = product.imageUrls[0].replace(/[{}]/g, '');
    if (!url) return null;
    if (url.startsWith('data:') || /^https?:\/\//i.test(url)) return url;
    return buildAssetUrl(url);
  }, [product.imageUrls]);
  const [imgError, setImgError] = React.useState(false);
  const showImage = imageUrl && !imgError;

  const statTone = isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-primary';

  const StatTile: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="bg-warm-100 dark:bg-slate-800/40 p-4 rounded-2xl border border-brand-border">
      <p className="text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide mb-1">{label}</p>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      <ProductDetailHeader product={product} onBack={onBack} />

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-6xl mx-auto p-3 sm:p-6 pb-16">

          {/* ── Hero ── */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
            {/* Image */}
            <div className="md:col-span-5 lg:col-span-4">
              <div className="bg-surface dark:bg-slate-900/60 rounded-3xl p-3 shadow-sm border border-brand-border aspect-square overflow-hidden">
                {showImage ? (
                  <img
                    src={imageUrl!}
                    alt={product.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-warm-100 to-warm-200 dark:from-slate-800/40 dark:to-slate-900/60 flex items-center justify-center">
                    <CubeIcon className="w-16 h-16 text-brand-text-muted/40" />
                  </div>
                )}
              </div>
            </div>

            {/* Identity */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col">
              <div className="flex flex-wrap gap-2 mb-3">
                {category && (
                  <span className="bg-success-muted dark:bg-primary/15 text-primary px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">{category.name}</span>
                )}
                {product.brand && (
                  <span className="bg-warm-100 dark:bg-white/5 text-brand-text-muted px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">{product.brand}</span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-text mb-1.5">{product.name}</h2>
              <p className="text-sm text-brand-text-muted font-medium mb-6">SKU: {product.sku || 'N/A'}</p>

              {/* Stat grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatTile label="Retail Price">
                  <p className="text-xl font-extrabold text-primary tabular-nums">{formatCurrency(price, storeSettings)}</p>
                </StatTile>
                <StatTile label="In Stock">
                  <p className={`text-xl font-extrabold tabular-nums ${statTone}`}>{stock} <span className="text-xs font-bold text-brand-text-muted">{unit}</span></p>
                </StatTile>
                <StatTile label={cost > 0 ? 'Cost Price' : 'Reorder At'}>
                  <p className="text-xl font-extrabold text-brand-text tabular-nums">{cost > 0 ? formatCurrency(cost, storeSettings) : `${reorder}`}</p>
                </StatTile>
                <StatTile label="Status">
                  <span className={`inline-flex items-center gap-1.5 ${isActive ? 'text-primary' : 'text-warning'}`}>
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary animate-pulse' : 'bg-warning'}`} />
                    <span className="text-sm font-bold">{isActive ? 'Active' : 'Archived'}</span>
                  </span>
                </StatTile>
              </div>

              {/* Primary actions */}
              {canManage && (
                <div className="flex flex-wrap gap-3 mt-auto">
                  <button
                    onClick={() => onAdjustStock(product)}
                    className="bg-primary hover:bg-primary-dark text-white active:scale-95 transition-all px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => onEdit(product)}
                    className="border border-brand-border text-brand-text hover:bg-warm-100 dark:hover:bg-slate-800 transition-colors px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2"
                  >
                    <PencilIcon className="w-5 h-5" />
                    Edit Product
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    className="p-3.5 rounded-2xl border border-brand-border text-brand-text-muted hover:border-danger hover:text-danger transition-all"
                    aria-label="Delete product"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Bento: Stock status + Details ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Stock status */}
            <section className="lg:col-span-5 bg-surface dark:bg-slate-900/60 p-6 rounded-3xl border border-brand-border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-brand-text">Stock Status</h3>
                <span className="text-sm font-semibold text-brand-text-muted tabular-nums">{stock} {unit}</span>
              </div>

              <div className="relative h-10 w-full bg-warm-100 dark:bg-slate-800/60 rounded-full overflow-hidden mb-2">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${isOut ? 'bg-danger' : isLow ? 'bg-warning' : 'bg-primary'}`}
                  style={{ width: `${Math.max(fillPct, isOut ? 0 : 4)}%` }}
                />
                {/* reorder marker */}
                <div className="absolute top-0 h-full w-0.5 bg-brand-text/30" style={{ left: `${reorderPct}%` }} title={`Reorder at ${reorder}`} />
              </div>
              <p className="text-[11px] text-brand-text-muted mb-6">Marker shows the reorder threshold ({reorder} {unit}).</p>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-warm-100 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                    <span className="text-sm font-medium text-brand-text">Reorder Point</span>
                  </div>
                  <span className="text-sm font-bold text-brand-text tabular-nums">{reorder} {unit}</span>
                </div>
                {product.safetyStock !== undefined && (
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-warm-100 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <ChartBarIcon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-brand-text">Safety Stock</span>
                    </div>
                    <span className="text-sm font-bold text-brand-text tabular-nums">{product.safetyStock} {unit}</span>
                  </div>
                )}
              </div>

              {/* Alert */}
              {isLow ? (
                <div className="mt-6 p-4 bg-warning-muted dark:bg-warning/10 rounded-2xl flex gap-3 border border-warning/20">
                  <ExclamationTriangleIcon className="w-5 h-5 text-warning flex-shrink-0" />
                  <p className="text-[13px] text-warning font-medium leading-relaxed">
                    {isOut ? 'Out of stock.' : `At or below the reorder point (${reorder} ${unit}).`} Consider a restock to maintain availability.
                  </p>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-success-muted dark:bg-primary/10 rounded-2xl flex gap-3 border border-primary/15">
                  <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-[13px] text-primary font-medium leading-relaxed">
                    Healthy stock level — comfortably above the reorder point.
                  </p>
                </div>
              )}
            </section>

            {/* Details */}
            <section className="lg:col-span-7 bg-surface dark:bg-slate-900/60 rounded-3xl border border-brand-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-brand-border">
                <h3 className="text-lg font-bold text-brand-text">Product Details</h3>
              </div>
              <div className="p-6 space-y-5">
                {product.description && (
                  <p className="text-sm text-brand-text-muted leading-relaxed">{product.description}</p>
                )}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    ['Barcode', product.barcode || '—'],
                    ['Weight', product.weight ? `${product.weight} kg` : '—'],
                    ['Dimensions', product.dimensions || '—'],
                    ['Unit of Measure', product.unitOfMeasure === 'kg' ? 'Kilogram' : 'Unit'],
                    ...(product.unitsPerCarton ? [['Units / Carton', String(product.unitsPerCarton)] as [string, string]] : []),
                    ...(product.cartonPrice ? [['Carton Price', formatCurrency(product.cartonPrice, storeSettings)] as [string, string]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center gap-3 py-2.5 border-b border-brand-border/60 last:border-0">
                      <dt className="text-sm text-brand-text-muted">{label}</dt>
                      <dd className="text-sm font-semibold text-brand-text text-right tabular-nums truncate">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          </div>

          {/* ── Supplier / Pricing / Quick stats ── */}
          <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface dark:bg-slate-900/60 p-6 rounded-3xl border border-brand-border shadow-sm">
              <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide mb-4">Primary Supplier</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warm-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-brand-border">
                  <TruckIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-text truncate">{supplier?.name || 'No supplier linked'}</p>
                  <p className="text-[12px] text-brand-text-muted">{category?.name || 'Uncategorized'}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface dark:bg-slate-900/60 p-6 rounded-3xl border border-brand-border shadow-sm">
              <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide mb-4">Pricing</h4>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Retail</span><span className="text-sm font-bold text-brand-text tabular-nums">{formatCurrency(price, storeSettings)}</span></div>
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Cost</span><span className="text-sm font-bold text-brand-text tabular-nums">{cost > 0 ? formatCurrency(cost, storeSettings) : '—'}</span></div>
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Margin</span><span className="text-sm font-bold text-primary tabular-nums">{margin !== null ? `${margin}%` : '—'}</span></div>
              </div>
            </div>

            <div className="bg-surface dark:bg-slate-900/60 p-6 rounded-3xl border border-brand-border shadow-sm">
              <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Inventory value</span><span className="text-sm font-bold text-brand-text tabular-nums">{formatCurrency(inventoryValue, storeSettings)}</span></div>
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">On hand</span><span className="text-sm font-bold text-brand-text tabular-nums">{stock} {unit}</span></div>
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Reorder point</span><span className="text-sm font-bold text-brand-text tabular-nums">{reorder} {unit}</span></div>
              </div>
            </div>
          </section>

          {/* ── Management actions ── */}
          {canManage && (
            <div className="mt-8 space-y-3">
              <h3 className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest px-1 mb-1">Management Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => onPrintLabel(product)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 bg-surface dark:bg-slate-900/40 border border-brand-border rounded-2xl text-sm font-bold text-brand-text transition-all active:scale-[0.98] hover:bg-warm-100 dark:hover:bg-slate-800"
                >
                  <PrinterIcon className="w-5 h-5 text-brand-text-muted" />
                  Print Label
                </button>

                {onPersonalUse && (
                  <button
                    onClick={() => onPersonalUse(product)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 bg-surface dark:bg-slate-900/40 border border-brand-border rounded-2xl text-sm font-bold text-brand-text transition-all active:scale-[0.98] hover:bg-warm-100 dark:hover:bg-slate-800"
                  >
                    <ShoppingCartIcon className="w-5 h-5 text-primary" />
                    Assign to Personal Use
                  </button>
                )}

                {isActive ? (
                  <button
                    onClick={() => onArchive(product.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 bg-warning-muted/50 dark:bg-warning/10 border border-warning/20 rounded-2xl text-sm font-bold text-warning transition-all active:scale-[0.98] hover:bg-warning-muted dark:hover:bg-warning/20"
                  >
                    <ArchiveBoxIcon className="w-5 h-5" />
                    Archive Product
                  </button>
                ) : (
                  <button
                    onClick={() => onArchive(product.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 bg-success-muted/60 dark:bg-primary/10 border border-primary/20 rounded-2xl text-sm font-bold text-primary transition-all active:scale-[0.98] hover:bg-success-muted dark:hover:bg-primary/20"
                  >
                    <RestoreIcon className="w-5 h-5" />
                    Restore Product
                  </button>
                )}

                <button
                  onClick={() => onDelete(product)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 bg-danger-muted/50 dark:bg-danger/10 border border-danger/20 rounded-2xl text-sm font-bold text-danger transition-all active:scale-[0.98] hover:bg-danger-muted dark:hover:bg-danger/20"
                >
                  <TrashIcon className="w-5 h-5" />
                  Delete Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailView;
