import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Product, Category, Supplier, StoreSettings, User } from '@/types.ts';
import { formatCurrency } from '@/utils/currency.ts';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon';
import RestoreIcon from '../icons/RestoreIcon';
import PrinterIcon from '../icons/PrinterIcon';
import AdjustmentsHorizontalIcon from '../icons/AdjustmentsHorizontalIcon';
import ShoppingCartIcon from '../icons/ShoppingCartIcon';
import TagIcon from '../icons/TagIcon';
import CubeIcon from '../icons/CubeIcon';
import ScaleIcon from '../icons/ScaleIcon';
import BarcodeIcon from '../icons/BarcodeIcon';
import TruckIcon from '../icons/TruckIcon';
import { buildAssetUrl } from '@/services/api';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import EllipsisVerticalIcon from '../icons/EllipsisVerticalIcon';

const DetailItem: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, value, icon, className = '' }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-2 ${className}`}>
    <div className="flex items-center gap-2 min-w-0">
      {icon && (
        <div className="text-slate-400 flex-shrink-0">
          {React.isValidElement(icon) ?
            React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' }) : icon}
        </div>
      )}
      <span className="text-sm text-slate-600 truncate">{label}</span>
    </div>
    <div className="text-sm sm:text-base font-medium text-slate-900 text-right sm:text-left truncate pl-6 sm:pl-0">
      {value}
    </div>
  </div>
);

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
}> = ({ product, category, supplier, attributes, storeSettings, user, onEdit, onDelete, onArchive, onPrintLabel, onAdjustStock, onPersonalUse, onBack }) => {

  const [mainImage, setMainImage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'supplier' | 'classification' | 'specs' | 'inventory'>('description');
  const menuRef = useRef<HTMLDivElement>(null);
  const canManage = user.role === 'admin' || user.role === 'inventory_manager';

  const rawImageUrls = useMemo(() => (product.imageUrls || []).map((url: string) => url.replace(/[{}]/g, '')), [product.imageUrls]);
  const imageUrls = useMemo(() => rawImageUrls.map((url: string) => url && !url.startsWith('data:') && !/^https?:\/\//i.test(url)
    ? buildAssetUrl(url)
    : url
  ), [rawImageUrls]);

  useEffect(() => {
    const firstImageUrl = imageUrls[0] || '';
    setMainImage(firstImageUrl);
    setImageLoaded(false);
  }, [product.id, imageUrls]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const costPrice = typeof product.costPrice === 'string' ? parseFloat(product.costPrice || '0') : (product.costPrice || 0);
  const profitMargin = price > 0 && costPrice > 0 ? ((price - costPrice) / price) * 100 : null;
  const profitAmount = price - costPrice;

  const StatusBadge: React.FC<{ status: Product['status'] }> = ({ status }) => {
    const config = {
      active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
      archived: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Archived' },
    }[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Active' };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <div className="w-2 h-2 rounded-full bg-current"></div>
        {config.label}
      </span>
    );
  };

  const StockIndicator = () => {
    const lowStockThreshold = product.reorderPoint || storeSettings.lowStockThreshold;
    const isLowStock = product.stock <= lowStockThreshold;
    const isOutOfStock = product.stock === 0;

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {product.stock} <span className="text-base sm:text-lg text-slate-500">{product.unitOfMeasure || 'units'}</span>
            </div>
            <div className="text-sm text-slate-500 mt-1">Available stock</div>
          </div>
          {isLowStock && (
            <span className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg self-start sm:self-auto ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {isOutOfStock ? 'Out of stock' : 'Low stock'}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isOutOfStock ? 'w-0' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{
                width: `${Math.min(100, (product.stock / (Math.max(lowStockThreshold * 2, product.stock || 1))) * 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Reorder: {lowStockThreshold}</span>
            <span>Safety: {product.safetyStock || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  const ActionMenu = () => (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
        aria-label="More options"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-slate-600" />
      </button>
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 space-y-1">
            {canManage && (
              <>
                <button
                  onClick={() => { setIsMenuOpen(false); onAdjustStock(product); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                  Adjust Stock
                </button>
                {onPersonalUse && (
                  <button
                    onClick={() => { setIsMenuOpen(false); onPersonalUse(product); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <ShoppingCartIcon className="w-4 h-4" />
                    Personal Use
                  </button>
                )}
                <button
                  onClick={() => { setIsMenuOpen(false); onPrintLabel(product); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print Label
                </button>
                {product.status === 'active' ? (
                  <button
                    onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-amber-700 rounded-lg hover:bg-amber-50 flex items-center gap-3 transition-colors"
                  >
                    <ArchiveBoxIcon className="w-4 h-4" />
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center gap-3 transition-colors"
                  >
                    <RestoreIcon className="w-4 h-4" />
                    Restore
                  </button>
                )}
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => { setIsMenuOpen(false); onDelete(product); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'supplier', label: 'Supplier' },
    { id: 'classification', label: 'Classification' },
    { id: 'specs', label: 'Specs' },
    { id: 'inventory', label: 'Inventory' }
  ] as const;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-blue-100 items-center justify-center">
              <CubeIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-md md:max-w-lg">
                {product.name}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">SKU: {product.sku || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => onEdit(product)}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2 text-slate-700 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          <ActionMenu />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Top Section: Product Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Section - Full width on mobile, 1/3 on desktop */}
            <div className="lg:col-span-1">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative aspect-square group">
                {mainImage ? (
                  <>
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-8">
                    <ShoppingCartIcon className="w-16 h-16 sm:w-20 sm:h-20" />
                    <p className="text-sm text-slate-400 mt-3">No image available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing and Quick Stats - 2/3 on desktop */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Selling Price Card */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 sm:p-6 border border-blue-100 flex flex-col justify-center">
                <div className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {formatCurrency(price, storeSettings)}
                </div>
                <div className="text-sm text-slate-500 font-medium mt-1">Selling Price</div>
              </div>

              {/* Cost Card */}
              <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200">
                <div className="text-sm text-slate-500 font-medium mb-1">Cost Price</div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {formatCurrency(costPrice, storeSettings)}
                </div>
              </div>

              {/* Profit Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 sm:p-6 border border-emerald-100">
                <div className="text-sm text-slate-500 font-medium mb-1">Profit</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl sm:text-3xl font-bold ${profitAmount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {formatCurrency(profitAmount, storeSettings)}
                  </span>
                  {profitMargin !== null && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      {profitMargin.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 flex flex-col justify-center">
                <div className="text-sm text-slate-500 font-medium mb-2">Status</div>
                <StatusBadge status={product.status} />
              </div>

              {/* Stock Summary */}
              <div className="sm:col-span-2 bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200">
                <StockIndicator />
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="space-y-4">
            {/* Tab Bar - Scrollable on mobile */}
            <div className="flex overflow-x-auto border-b border-slate-200 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex-shrink-0 ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Product Details</h3>
                  <p className="text-sm text-slate-500 mt-1">Complete information about this product</p>
                </div>

                <div className="min-h-[200px]">
                  {/* Description Tab */}
                  {activeTab === 'description' && (
                    <div className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <h4 className="text-slate-900 font-medium mb-2">Product Description</h4>
                        <div className="text-slate-600 bg-slate-50 rounded-lg p-4">
                          {product.description || "No description provided."}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Supplier Tab */}
                  {activeTab === 'supplier' && (
                    <div className="space-y-6">
                      {supplier ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Supplier Details</h4>
                              <div className="space-y-3 bg-slate-50 rounded-lg p-4">
                                <DetailItem label="Company" value={supplier.name} icon={<TruckIcon />} />
                                {supplier.contactPerson && <DetailItem label="Contact Person" value={supplier.contactPerson} />}
                                {supplier.phone && (
                                  <DetailItem label="Phone" value={
                                    <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">{supplier.phone}</a>
                                  } />
                                )}
                                {supplier.email && (
                                  <DetailItem label="Email" value={
                                    <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">{supplier.email}</a>
                                  } />
                                )}
                              </div>
                            </div>
                            {supplier.address && (
                              <div className="space-y-4">
                                <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Address</h4>
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <p className="text-slate-600 whitespace-pre-line">{supplier.address}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-10 text-slate-400 italic bg-slate-50 rounded-lg">
                          No supplier associated with this product.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Classification Tab */}
                  {activeTab === 'classification' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Classification</h4>
                        <div className="space-y-3 bg-slate-50 rounded-lg p-4">
                          <DetailItem label="Category" value={category?.name || 'Uncategorized'} icon={<TagIcon />} />
                          <DetailItem label="Brand" value={product.brand || 'Generic'} />
                          <DetailItem label="Status" value={<StatusBadge status={product.status} />} />
                        </div>
                      </div>
                      {attributes.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Attributes</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {attributes.map(attr => (
                              <div key={attr.name} className="flex flex-col p-3 bg-slate-50 rounded-lg">
                                <span className="text-xs text-slate-500 mb-1">{attr.name}</span>
                                <span className="text-sm font-medium text-slate-900 truncate">{attr.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Specs Tab */}
                  {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Identification</h4>
                        <div className="space-y-3 bg-slate-50 rounded-lg p-4">
                          <DetailItem label="SKU" value={product.sku || 'N/A'} icon={<BarcodeIcon />} />
                          <DetailItem label="Barcode" value={product.barcode || 'N/A'} icon={<BarcodeIcon />} />
                          <DetailItem label="Unit of Measure" value={product.unitOfMeasure || 'Unit'} icon={<CubeIcon />} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Physical Properties</h4>
                        <div className="space-y-3 bg-slate-50 rounded-lg p-4">
                          <DetailItem label="Weight" value={product.weight ? `${product.weight} kg` : 'N/A'} icon={<ScaleIcon />} />
                          <DetailItem label="Dimensions" value={product.dimensions || 'N/A'} icon={<CubeIcon />} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Dates</h4>
                        <div className="space-y-3 bg-slate-50 rounded-lg p-4">
                          <DetailItem 
                            label="Created" 
                            value={product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            }) : 'N/A'} 
                          />
                          <DetailItem 
                            label="Last Updated" 
                            value={product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            }) : 'N/A'} 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inventory Tab */}
                  {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Stock Status</h4>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                          <StockIndicator />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Financials</h4>
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-100">
                            <div className="text-sm text-slate-500 mb-2">Total Stock Value</div>
                            <div className="text-2xl font-bold text-slate-900">
                              {formatCurrency(price * product.stock, storeSettings)}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Reorder Point</div>
                              <div className="text-sm font-medium text-slate-900">
                                {product.reorderPoint || storeSettings.lowStockThreshold}
                              </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                              <div className="text-xs text-slate-500 mb-1">Safety Stock</div>
                              <div className="text-sm font-medium text-slate-900">
                                {product.safetyStock || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailView;