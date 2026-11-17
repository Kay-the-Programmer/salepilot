import React from 'react';
import { Product, Category, Supplier, StoreSettings, User } from '@/types.ts';
import { formatCurrency } from '@/utils/currency';
import { buildAssetUrl } from '@/services/api';
import ProductDetailHeader from './detail/ProductDetailHeader';
import {
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  PrinterIcon,
  RestoreIcon,
  ShoppingCartIcon,
  TrashIcon,
  TruckIcon,
} from '@/components/icons';
import { ProductPlaceholderIcon, productImageUrl } from './productImage';
import InlineNumberEdit from './detail/InlineNumberEdit';
import { thresholdFor } from '../purchase-orders/poModel';

const asNumber = (val: any) => {
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : 0;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Design primitives (Velocity / DESIGN.md): flat tonal cards, 8px radius.
 * Defined at module level so inline editors keep their state across re-renders.
 * ──────────────────────────────────────────────────────────────────────────── */

const CARD = 'bg-surface border border-brand-border rounded-lg';

const SectionTitle: React.FC<{ children: React.ReactNode; aside?: React.ReactNode }> = ({ children, aside }) => (
  <div className="flex items-center justify-between gap-2">
    <h3 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider">{children}</h3>
    {aside}
  </div>
);

const StatTile: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="bg-surface-variant/60 rounded-lg p-3 min-w-0">
    <p className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wide mb-1 truncate">{label}</p>
    {children}
    {hint && <p className="text-[10px] text-brand-text-muted mt-0.5 truncate">{hint}</p>}
  </div>
);

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 py-2 border-b border-brand-border/40">
    <dt className="text-xs text-brand-text-muted shrink-0">{label}</dt>
    <dd className="text-xs font-semibold text-brand-text text-right tabular-nums truncate">{value}</dd>
  </div>
);

const Tag: React.FC<{ tone: 'warning' | 'success' | 'neutral'; children: React.ReactNode }> = ({ tone, children }) => {
  const cls =
    tone === 'warning'
      ? 'bg-warning-muted text-warning'
      : tone === 'success'
        ? 'bg-success-muted text-primary'
        : 'bg-surface-variant text-brand-text-muted';
  return <span className={`${cls} px-2.5 py-0.5 rounded-md text-[11px] font-semibold`}>{children}</span>;
};

/* ── Overflow menu for secondary / destructive actions ─────────────────────── */

type MenuItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: 'danger';
  dividerBefore?: boolean;
};

const MoreMenu: React.FC<{ items: MenuItem[]; openUp?: boolean }> = ({ items, openUp }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-10 px-3 inline-flex items-center gap-1.5 rounded-lg border border-brand-border text-brand-text hover:bg-surface-variant transition-colors text-sm font-semibold"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
        <span className="hidden sm:inline">More</span>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-30 w-56 py-1 bg-surface border border-brand-border rounded-lg shadow-lg ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
        >
          {items.map(item => (
            <React.Fragment key={item.label}>
              {item.dividerBefore && <div className="my-1 border-t border-brand-border" />}
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-left transition-colors ${item.tone === 'danger'
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-brand-text hover:bg-surface-variant'
                  }`}
              >
                <span className="w-4 h-4 shrink-0 [&>svg]:w-4 [&>svg]:h-4">{item.icon}</span>
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── The one action bar: inline on desktop, pinned to the bottom on mobile ──── */

const ActionBar: React.FC<{
  isLow: boolean;
  menuItems: MenuItem[];
  openUp?: boolean;
  onAdjustStock: () => void;
  onEdit: () => void;
  onReorder?: () => void;
}> = ({ isLow, menuItems, openUp, onAdjustStock, onEdit, onReorder }) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onAdjustStock}
      className="flex-1 sm:flex-none h-10 px-4 bg-primary hover:bg-primary/90 text-white active:scale-95 transition-all rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2"
    >
      <AdjustmentsHorizontalIcon className="w-4 h-4" />
      Adjust stock
    </button>

    {onReorder && (
      <button
        type="button"
        onClick={onReorder}
        className={`flex-1 sm:flex-none h-10 px-4 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${isLow
            ? 'bg-sp-orange hover:bg-sp-orange/90 text-white'
            : 'border border-brand-border text-brand-text hover:bg-surface-variant'
          }`}
      >
        <ShoppingCartIcon className="w-4 h-4" />
        Reorder
      </button>
    )}

    <button
      type="button"
      onClick={onEdit}
      className="h-10 px-3 sm:px-4 border border-brand-border text-brand-text hover:bg-surface-variant transition-colors rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2"
      aria-label="Edit product"
    >
      <PencilIcon className="w-4 h-4" />
      <span className="hidden sm:inline">Edit</span>
    </button>

    <MoreMenu items={menuItems} openUp={openUp} />
  </div>
);

/* ── Main view ─────────────────────────────────────────────────────────────── */

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
  /** Saves a single field in place (price, cost, reorder level). Omit to make them read-only. */
  onQuickEdit?: (patch: Partial<Product>) => Promise<void>;
  /** Opens the reorder sheet (buy more from a supplier). */
  onReorder?: (product: Product) => void;
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
  onQuickEdit,
  onReorder,
  onBack
}) => {
    // Superadmin counts as a manager — in Store Mode they act as the store's admin.
    const canManage = user.role === 'admin' || user.role === 'inventory_manager' || user.role === 'superadmin';
    const canQuickEdit = !!onQuickEdit && canManage;

    const price = asNumber(product.price);
    const cost = asNumber(product.costPrice);
    const stock = asNumber(product.stock);
    const reorder = thresholdFor(product, storeSettings);
    const unit = product.unitOfMeasure === 'kg' ? 'kg' : 'units';
    const isOut = stock <= 0;
    const isLow = stock <= reorder;
    const isActive = product.status === 'active';

    const margin = cost > 0 && price > 0 ? Math.round(((price - cost) / price) * 100) : null;
    // Stock on hand valued at cost, the same rule the books and every other
    // inventory total use. Valuing it at the retail price counted profit that
    // hasn't been earned yet, and didn't add up to the store's total.
    const inventoryValue = cost * stock;
    // What this shelf is expected to bring in if it all sells at the current price.
    const expectedSalesValue = price * stock;
    const potentialProfit = cost > 0 ? expectedSalesValue - inventoryValue : null;

    // Heuristic capacity bar: stock relative to a sensible target above the reorder point.
    const target = Math.max(reorder * 4, stock, 1);
    const fillPct = Math.min(100, Math.round((stock / target) * 100));
    const reorderPct = Math.min(100, Math.round((reorder / target) * 100));

    const imageUrl = React.useMemo(() => {
      const url = productImageUrl(product);
      if (!url) return null;
      if (url.startsWith('data:') || /^https?:\/\//i.test(url)) return url;
      return buildAssetUrl(url);
    }, [product.imageUrls]);
    const [imgError, setImgError] = React.useState(false);
    React.useEffect(() => setImgError(false), [imageUrl]);
    const showImage = imageUrl && !imgError;

    const statTone = isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-primary';
    const barTone = isOut ? 'bg-danger' : isLow ? 'bg-warning' : 'bg-primary';
    const marginTone = margin !== null && margin < 0 ? 'text-danger' : 'text-primary';

    // Secondary + destructive actions live in one predictable place: the "More" menu.
    const menuItems: MenuItem[] = [
      { label: 'Print label', icon: <PrinterIcon />, onClick: () => onPrintLabel(product) },
      ...(onPersonalUse
        ? [{ label: 'Record personal use', icon: <ShoppingCartIcon />, onClick: () => onPersonalUse(product) }]
        : []),
      {
        label: isActive ? 'Archive product' : 'Restore product',
        icon: isActive ? <ArchiveBoxIcon /> : <RestoreIcon />,
        onClick: () => onArchive(product.id),
      },
      { label: 'Delete product', icon: <TrashIcon />, onClick: () => onDelete(product), tone: 'danger', dividerBefore: true },
    ];

    const detailRows: Array<[string, React.ReactNode]> = [
      ['Barcode', product.barcode || '—'],
      ['Weight', product.weight ? `${product.weight} kg` : '—'],
      ['Dimensions', product.dimensions || '—'],
      ['Unit of measure', product.unitOfMeasure === 'kg' ? 'Kilogram' : 'Unit'],
      ...(product.unitsPerCarton ? [['Units / carton', String(product.unitsPerCarton)] as [string, string]] : []),
      ...(product.cartonPrice
        ? [['Carton price', formatCurrency(product.cartonPrice, storeSettings)] as [string, string]]
        : []),
    ];

    return (
      <div className="flex flex-col h-full bg-background overflow-hidden relative">
        <ProductDetailHeader product={product} onBack={onBack} />

        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-7xl mx-auto p-4 lg:p-6 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

              {/* ───────── Identity + actions (first on mobile, top-right on desktop) ───────── */}
              <header className="lg:col-start-5 lg:col-span-8 lg:row-start-1 order-2 lg:order-none min-w-0">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {!isActive && <Tag tone="warning">Archived</Tag>}
                      {category && <Tag tone="success">{category.name}</Tag>}
                      {product.brand && <Tag tone="neutral">{product.brand}</Tag>}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-brand-text break-words">{product.name}</h2>
                    <p className="text-sm text-brand-text-muted mt-0.5">SKU: {product.sku || 'N/A'}</p>
                  </div>

                  {/* Desktop action bar — on mobile this moves to the pinned bottom bar */}
                  {canManage && (
                    <div className="hidden lg:block shrink-0">
                      <ActionBar
                        isLow={isLow}
                        menuItems={menuItems}
                        onAdjustStock={() => onAdjustStock(product)}
                        onEdit={() => onEdit(product)}
                        onReorder={onReorder ? () => onReorder(product) : undefined}
                      />
                    </div>
                  )}
                </div>
              </header>

              {/* ───────── Left rail: image + stock status ───────── */}
              <aside className="lg:col-span-4 lg:row-start-1 lg:row-span-3 order-1 lg:order-none space-y-4 min-w-0">
                <div className={`${CARD} aspect-[4/3] sm:aspect-square max-h-[360px] lg:max-h-none overflow-hidden`}>
                  {showImage ? (
                    <img
                      src={imageUrl!}
                      alt={product.name}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                      <ProductPlaceholderIcon className="w-16 h-16 text-brand-text-muted/40" />
                    </div>
                  )}
                </div>

                <section className={`${CARD} p-4 hidden lg:block`}>
                  <StockPanel
                    stock={stock}
                    unit={unit}
                    reorder={reorder}
                    fillPct={fillPct}
                    reorderPct={reorderPct}
                    isOut={isOut}
                    isLow={isLow}
                    statTone={statTone}
                    barTone={barTone}
                  />
                </section>
              </aside>

              {/* ───────── Right column body ───────── */}
              <div className="lg:col-span-8 lg:col-start-5 lg:row-start-2 order-3 lg:order-none space-y-4 min-w-0">

                {/* Stock panel for mobile (desktop shows it in the left rail) */}
                <section className={`${CARD} p-4 lg:hidden`}>
                  <StockPanel
                    stock={stock}
                    unit={unit}
                    reorder={reorder}
                    fillPct={fillPct}
                    reorderPct={reorderPct}
                    isOut={isOut}
                    isLow={isLow}
                    statTone={statTone}
                    barTone={barTone}
                  />
                </section>

                {/* Key numbers */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <StatTile label="Retail price">
                    <InlineNumberEdit
                      label="Retail price"
                      value={price}
                      disabled={!canQuickEdit}
                      onSave={(v) => onQuickEdit!({ price: v })}
                      display={<span className="text-lg font-bold text-primary tabular-nums">{formatCurrency(price, storeSettings)}</span>}
                    />
                  </StatTile>
                  <StatTile label="Cost price">
                    <InlineNumberEdit
                      label="Cost price"
                      value={cost}
                      disabled={!canQuickEdit}
                      onSave={(v) => onQuickEdit!({ costPrice: v })}
                      display={<span className="text-lg font-bold text-brand-text tabular-nums">{cost > 0 ? formatCurrency(cost, storeSettings) : '—'}</span>}
                    />
                  </StatTile>
                  <StatTile label="Margin" hint={potentialProfit !== null ? `${formatCurrency(price - cost, storeSettings)} per ${product.unitOfMeasure === 'kg' ? 'kg' : 'unit'}` : undefined}>
                    <span className={`text-lg font-bold tabular-nums ${marginTone}`}>{margin !== null ? `${margin}%` : '—'}</span>
                  </StatTile>
                  <StatTile label="Reorder at">
                    <InlineNumberEdit
                      label="Reorder point"
                      value={reorder}
                      decimals={product.unitOfMeasure === 'kg' ? 2 : 0}
                      disabled={!canQuickEdit}
                      onSave={(v) => onQuickEdit!({ reorderPoint: v })}
                      display={<span className="text-lg font-bold text-brand-text tabular-nums">{reorder} <span className="text-xs font-semibold text-brand-text-muted">{unit}</span></span>}
                    />
                  </StatTile>
                </section>

                {canQuickEdit && (
                  <p className="text-[11px] text-brand-text-muted -mt-2 flex items-center gap-1.5">
                    <PencilIcon className="w-3 h-3" />
                    Tap a price or the reorder level to edit it in place.
                  </p>
                )}

                {/* Details */}
                <section className={`${CARD} overflow-hidden`}>
                  <div className="px-4 py-3 border-b border-brand-border">
                    <SectionTitle>Product details</SectionTitle>
                  </div>
                  <div className="p-4">
                    {product.description && (
                      <p className="text-sm text-brand-text-muted leading-relaxed mb-3">{product.description}</p>
                    )}
                    <dl className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8">
                      {detailRows.map(([label, value]) => (
                        <DetailRow key={label} label={label} value={value} />
                      ))}
                    </dl>
                  </div>
                </section>

                {/* Sourcing + inventory value */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`${CARD} p-4`}>
                    <SectionTitle aside={<TruckIcon className="w-4 h-4 text-brand-text-muted" />}>Sourcing</SectionTitle>
                    <dl className="mt-1">
                      <DetailRow label="Supplier" value={supplier?.name || 'No supplier'} />
                      <DetailRow label="Category" value={category?.name || 'Uncategorized'} />
                    </dl>
                  </div>
                  <div className={`${CARD} p-4`}>
                    <SectionTitle>Inventory value</SectionTitle>
                    <dl className="mt-1">
                      <DetailRow label="At cost" value={formatCurrency(inventoryValue, storeSettings)} />
                      <DetailRow label="At retail" value={formatCurrency(expectedSalesValue, storeSettings)} />
                      {potentialProfit !== null && (
                        <DetailRow label="Potential profit" value={<span className="text-primary">{formatCurrency(potentialProfit, storeSettings)}</span>} />
                      )}
                    </dl>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: actions are pinned to the bottom, always one thumb-reach away */}
        {canManage && (
          <div className="lg:hidden shrink-0 bg-surface border-t border-brand-border px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
            <ActionBar
              isLow={isLow}
              menuItems={menuItems}
              openUp
              onAdjustStock={() => onAdjustStock(product)}
              onEdit={() => onEdit(product)}
              onReorder={onReorder ? () => onReorder(product) : undefined}
            />
          </div>
        )}
      </div>
    );
  };

/* ── Stock status panel (shared by the mobile and desktop placements) ──────── */

const StockPanel: React.FC<{
  stock: number;
  unit: string;
  reorder: number;
  fillPct: number;
  reorderPct: number;
  isOut: boolean;
  isLow: boolean;
  statTone: string;
  barTone: string;
}> = ({ stock, unit, reorder, fillPct, reorderPct, isOut, isLow, statTone, barTone }) => (
  <>
    <SectionTitle>Stock status</SectionTitle>
    <p className={`mt-2 text-3xl font-bold tabular-nums leading-none ${statTone}`}>
      {stock} <span className="text-sm font-semibold text-brand-text-muted">{unit} on hand</span>
    </p>

    <div className="relative h-3 w-full bg-surface-variant rounded-full overflow-hidden mt-4">
      <div
        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${barTone}`}
        style={{ width: `${Math.max(fillPct, isOut ? 0 : 4)}%` }}
      />
      <div className="absolute top-0 h-full w-0.5 bg-brand-text/50" style={{ left: `${reorderPct}%` }} title={`Reorder at ${reorder}`} />
    </div>
    <div className="relative h-4 mt-1">
      <span className="absolute text-[10px] text-brand-text-muted -translate-x-1/2 whitespace-nowrap" style={{ left: `${Math.min(Math.max(reorderPct, 10), 90)}%` }}>
        Reorder at {reorder}
      </span>
    </div>

    {isLow ? (
      <div className="mt-2 p-3 bg-warning-muted rounded-lg flex gap-2 border border-warning/20">
        <ExclamationTriangleIcon className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-warning font-medium leading-snug">
          {isOut ? 'Out of stock.' : `At or below the reorder point (${reorder} ${unit}).`} Restock soon.
        </p>
      </div>
    ) : (
      <div className="mt-2 p-3 bg-success-muted rounded-lg flex gap-2 border border-primary/15">
        <CheckCircleIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-primary font-medium leading-snug">Healthy stock level.</p>
      </div>
    )}
  </>
);

export default ProductDetailView;