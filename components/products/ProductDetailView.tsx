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
  // Superadmin counts as a manager — in Store Mode they act as the store's admin.
  const canManage = user.role === 'admin' || user.role === 'inventory_manager' || user.role === 'superadmin';

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

  // Flat tonal card + tile primitives (Velocity / DESIGN.md)
  const card = 'bg-surface border border-brand-border rounded-lg';
  const StatTile: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="bg-surface-variant rounded-lg p-3">
      <p className="text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide mb-1">{label}</p>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <ProductDetailHeader product={product} onBack={onBack} />

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-16">

          {/* ── Hero ── */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
            {/* Image */}
            <div className="md:col-span-5 lg:col-span-4">
              <div className={`${card} aspect-square overflow-hidden`}>
                {showImage ? (
                  <img
                    src={imageUrl!}
                    alt={product.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                    <CubeIcon className="w-16 h-16 text-brand-text-muted/40" />
                  </div>
                )}
              </div>
            </div>

            {/* Identity */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col">
              <div className="flex flex-wrap gap-2 mb-3">
                {category && (
                  <span className="bg-success-muted text-primary px-2.5 py-0.5 rounded-md text-[11px] font-semibold">{category.name}</span>
                )}
                {product.brand && (
                  <span className="bg-surface-variant text-brand-text-muted px-2.5 py-0.5 rounded-md text-[11px] font-semibold">{product.brand}</span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text mb-1">{product.name}</h2>
              <p className="text-sm text-brand-text-muted mb-5">SKU: {product.sku || 'N/A'}</p>

              {/* Stat grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <StatTile label="Retail Price">
                  <p className="text-xl font-bold text-primary tabular-nums">{formatCurrency(price, storeSettings)}</p>
                </StatTile>
                <StatTile label="In Stock">
                  <p className={`text-xl font-bold tabular-nums ${statTone}`}>{stock} <span className="text-xs font-semibold text-brand-text-muted">{unit}</span></p>
                </StatTile>
                <StatTile label={cost > 0 ? 'Cost Price' : 'Reorder At'}>
                  <p className="text-xl font-bold text-brand-text tabular-nums">{cost > 0 ? formatCurrency(cost, storeSettings) : `${reorder}`}</p>
                </StatTile>
                <StatTile label="Status">
                  <span className={`inline-flex items-center gap-1.5 ${isActive ? 'text-primary' : 'text-warning'}`}>
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary' : 'bg-warning'}`} />
                    <span className="text-sm font-bold">{isActive ? 'Active' : 'Archived'}</span>
                  </span>
                </StatTile>
              </div>

              {/* Primary actions */}
              {canManage && (
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={() => onAdjustStock(product)}
                    className="bg-primary hover:bg-primary/90 text-white active:scale-95 transition-colors px-5 py-3 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => onEdit(product)}
                    className="border border-brand-border text-brand-text hover:bg-surface-variant transition-colors px-5 py-3 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <PencilIcon className="w-5 h-5" />
                    Edit Product
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    className="w-11 grid place-items-center rounded-lg border border-brand-border text-brand-text-muted hover:border-danger hover:text-danger transition-colors"
                    aria-label="Delete product"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Stock status + Details ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Stock status */}
            <section className={`lg:col-span-5 ${card} p-5`}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-brand-text">Stock Status</h3>
                <span className="text-sm font-semibold text-brand-text-muted tabular-nums">{stock} {unit}</span>
              </div>

              <div className="relative h-8 w-full bg-surface-variant rounded-md overflow-hidden mb-2">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${isOut ? 'bg-danger' : isLow ? 'bg-warning' : 'bg-primary'}`}
                  style={{ width: `${Math.max(fillPct, isOut ? 0 : 4)}%` }}
                />
                {/* reorder marker */}
                <div className="absolute top-0 h-full w-0.5 bg-brand-text/40" style={{ left: `${reorderPct}%` }} title={`Reorder at ${reorder}`} />
              </div>
              <p className="text-[11px] text-brand-text-muted mb-5">Marker shows the reorder threshold ({reorder} {unit}).</p>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 rounded-lg bg-surface-variant">
                  <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                    <span className="text-sm font-medium text-brand-text">Reorder Point</span>
                  </div>
                  <span className="text-sm font-bold text-brand-text tabular-nums">{reorder} {unit}</span>
                </div>
                {product.safetyStock !== undefined && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-surface-variant">
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
                <div className="mt-5 p-3.5 bg-warning-muted rounded-lg flex gap-3 border border-warning/20">
                  <ExclamationTriangleIcon className="w-5 h-5 text-warning flex-shrink-0" />
                  <p className="text-[13px] text-warning font-medium leading-relaxed">
                    {isOut ? 'Out of stock.' : `At or below the reorder point (${reorder} ${unit}).`} Consider a restock to maintain availability.
                  </p>
                </div>
              ) : (
                <div className="mt-5 p-3.5 bg-success-muted rounded-lg flex gap-3 border border-primary/15">
                  <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-[13px] text-primary font-medium leading-relaxed">
                    Healthy stock level — comfortably above the reorder point.
                  </p>
                </div>
              )}
            </section>

            {/* Details */}
            <section className={`lg:col-span-7 ${card} overflow-hidden`}>
              <div className="p-5 border-b border-brand-border">
                <h3 className="text-base font-bold text-brand-text">Product Details</h3>
              </div>
              <div className="p-5 space-y-4">
                {product.description && (
                  <p className="text-sm text-brand-text-muted leading-relaxed">{product.description}</p>
                )}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
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
            <div className={`${card} p-5`}>
              <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide mb-4">Primary Supplier</h4>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-surface-variant rounded-lg flex items-center justify-center">
                  <TruckIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-text truncate">{supplier?.name || 'No supplier linked'}</p>
                  <p className="text-[12px] text-brand-text-muted">{category?.name || 'Uncategorized'}</p>
                </div>
              </div>
            </div>

            <div className={`${card} p-5`}>
              <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide mb-4">Pricing</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Retail</span><span className="text-sm font-bold text-brand-text tabular-nums">{formatCurrency(price, storeSettings)}</span></div>
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Cost</span><span className="text-sm font-bold text-brand-text tabular-nums">{cost > 0 ? formatCurrency(cost, storeSettings) : '—'}</span></div>
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Margin</span><span className="text-sm font-bold text-primary tabular-nums">{margin !== null ? `${margin}%` : '—'}</span></div>
              </div>
            </div>

            <div className={`${card} p-5`}>
              <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide mb-4">Quick Stats</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Inventory value</span><span className="text-sm font-bold text-brand-text tabular-nums">{formatCurrency(inventoryValue, storeSettings)}</span></div>
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">On hand</span><span className="text-sm font-bold text-brand-text tabular-nums">{stock} {unit}</span></div>
                <div className="flex justify-between"><span className="text-[13px] text-brand-text-muted">Reorder point</span><span className="text-sm font-bold text-brand-text tabular-nums">{reorder} {unit}</span></div>
              </div>
            </div>
          </section>

          {/* ── Management actions ── */}
          {canManage && (
            <div className="mt-6 space-y-2">
              <h3 className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest px-1 mb-1">Management Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => onPrintLabel(product)}
                  className="w-full flex items-center gap-3 px-5 py-3 bg-surface border border-brand-border rounded-lg text-sm font-semibold text-brand-text transition-colors active:scale-[0.98] hover:bg-surface-variant"
                >
                  <PrinterIcon className="w-5 h-5 text-brand-text-muted" />
                  Print Label
                </button>

                {onPersonalUse && (
                  <button
                    onClick={() => onPersonalUse(product)}
                    className="w-full flex items-center gap-3 px-5 py-3 bg-surface border border-brand-border rounded-lg text-sm font-semibold text-brand-text transition-colors active:scale-[0.98] hover:bg-surface-variant"
                  >
                    <ShoppingCartIcon className="w-5 h-5 text-primary" />
                    Assign to Personal Use
                  </button>
                )}

                {isActive ? (
                  <button
                    onClick={() => onArchive(product.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 bg-warning-muted border border-warning/20 rounded-lg text-sm font-semibold text-warning transition-colors active:scale-[0.98] hover:bg-warning/15"
                  >
                    <ArchiveBoxIcon className="w-5 h-5" />
                    Archive Product
                  </button>
                ) : (
                  <button
                    onClick={() => onArchive(product.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 bg-success-muted border border-primary/20 rounded-lg text-sm font-semibold text-primary transition-colors active:scale-[0.98] hover:bg-primary/15"
                  >
                    <RestoreIcon className="w-5 h-5" />
                    Restore Product
                  </button>
                )}

                <button
                  onClick={() => onDelete(product)}
                  className="w-full flex items-center gap-3 px-5 py-3 bg-danger-muted border border-danger/20 rounded-lg text-sm font-semibold text-danger transition-colors active:scale-[0.98] hover:bg-danger/15"
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
