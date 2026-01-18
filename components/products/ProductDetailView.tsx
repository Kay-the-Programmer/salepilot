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
  grid?: boolean;
}> = ({ label, value, icon, className = '', grid = false }) => (
  <div className={`flex items-start justify-between py-2 ${grid ? 'md:flex-col md:items-start md:gap-1' : ''} ${className}`}>
    <div className={`flex items-center gap-2 min-w-0 ${grid ? 'md:w-full' : ''}`}>
      {icon && (
        <div className="text-slate-400 flex-shrink-0">
          {React.isValidElement(icon) ?
            React.cloneElement(icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5' }) : icon}
        </div>
      )}
      <span className="text-sm text-slate-600 truncate">{label}</span>
    </div>
    <div className={`text-sm font-medium text-slate-900 ${grid ? 'md:w-full md:text-left' : 'ml-2 text-right truncate max-w-[50%]'}`}>
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
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
        {config.label}
      </span>
    );
  };

  const StockIndicator = () => {
    const lowStockThreshold = product.reorderPoint || storeSettings.lowStockThreshold;
    const isLowStock = product.stock <= lowStockThreshold;
    const isOutOfStock = product.stock === 0;

    return (
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-lg md:text-xl font-semibold text-slate-900">
              {product.stock} <span className="text-sm md:text-base text-slate-500">{product.unitOfMeasure || 'units'}</span>
            </div>
            <div className="text-xs md:text-sm text-slate-500 mt-1">Available stock</div>
          </div>
          {isLowStock && (
            <span className={`text-xs md:text-sm font-medium px-3 py-1.5 rounded-lg self-start md:self-auto ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {isOutOfStock ? 'Out of stock' : 'Low stock'}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isOutOfStock ? 'w-0' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{
                width: `${Math.min(100, (product.stock / (Math.max(lowStockThreshold * 2, product.stock || 1))) * 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs md:text-sm text-slate-500">
            <span>Reorder: {lowStockThreshold}</span>
            <span>Safety: {product.safetyStock || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  const ActionMenu = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`relative ${mobile ? 'block lg:hidden' : 'hidden lg:block'}`} ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`p-2 rounded-lg hover:bg-slate-100 ${mobile ? '' : 'border'}`}
        aria-label="More options"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-slate-600" />
      </button>
      {isMenuOpen && (
        <div className={`absolute ${mobile ? 'bottom-full right-0 mb-2' : 'right-0 top-full mt-2'} w-56 bg-white rounded-lg shadow-lg border z-50`}>
          <div className="p-2 space-y-1">
            {canManage && (
              <>
                <button
                  onClick={() => { setIsMenuOpen(false); onAdjustStock(product); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded hover:bg-slate-50 flex items-center gap-2"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                  Adjust Stock
                </button>
                {onPersonalUse && (
                  <button
                    onClick={() => { setIsMenuOpen(false); onPersonalUse(product); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ShoppingCartIcon className="w-4 h-4" />
                    Personal Use
                  </button>
                )}
                <button
                  onClick={() => { setIsMenuOpen(false); onPrintLabel(product); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded hover:bg-slate-50 flex items-center gap-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print Label
                </button>
                {product.status === 'active' ? (
                  <button
                    onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                    className="w-full text-left px-3 py-2 text-sm text-amber-700 rounded hover:bg-amber-50 flex items-center gap-2"
                  >
                    <ArchiveBoxIcon className="w-4 h-4" />
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                    className="w-full text-left px-3 py-2 text-sm text-emerald-700 rounded hover:bg-emerald-50 flex items-center gap-2"
                  >
                    <RestoreIcon className="w-4 h-4" />
                    Restore
                  </button>
                )}
                <div className="border-t my-1"></div>
                <button
                  onClick={() => { setIsMenuOpen(false); onDelete(product); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-700 rounded hover:bg-red-50 flex items-center gap-2"
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
    { id: 'inventory', label: 'Inventory status' }
  ] as const;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 border-b flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 hover:bg-slate-100 rounded-full md:hidden"
            >
              <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-slate-900 truncate max-w-[200px] md:max-w-md">
            {product.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(product)}
            className="px-4 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2 text-slate-700"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <ActionMenu />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* Top Section: Photo & Quick Pricing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Section */}
            <div className="flex justify-center">
              <div className="w-full max-w-md aspect-square bg-slate-50 rounded-2xl border overflow-hidden relative group">
                {mainImage ? (
                  <>
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ShoppingCartIcon className="w-20 h-20" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Pricing and Summary */}
            <div className="flex flex-col gap-6">
              {/* Selling Price Box */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
                <div className="text-3xl md:text-4xl font-bold text-slate-900">
                  {formatCurrency(price, storeSettings)}
                </div>
                <div className="text-sm text-slate-500 font-medium mt-1">Selling Price</div>
              </div>

              {/* Cost and Profit Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="text-sm text-slate-500 font-medium mb-1">Cost</div>
                  <div className="text-xl font-bold text-slate-900">
                    {formatCurrency(costPrice, storeSettings)}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="text-sm text-slate-500 font-medium mb-1">Profit</div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold ${profitAmount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {formatCurrency(profitAmount, storeSettings)}
                    </span>
                    {profitMargin !== null && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {profitMargin.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* General Summary Box */}
              <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 italic text-slate-500 text-sm">
                {product.description ? (
                  <p className="line-clamp-4 overflow-hidden">{product.description}</p>
                ) : (
                  "Product description will appear here. Add details about this product to help your team."
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section: Tabs */}
          <div className="space-y-4">
            {/* Tab Bar */}
            <div className="flex overflow-x-auto border-b border-slate-200 no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dynamic Content */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white">
                    <CubeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Product info</h3>
                    <p className="text-xs text-slate-500">View and manage product details</p>
                  </div>
                </div>

                <div className="min-h-[200px]">
                  {activeTab === 'description' && (
                    <div className="prose prose-sm max-w-none text-slate-600">
                      {product.description || "No description provided."}
                    </div>
                  )}

                  {activeTab === 'supplier' && (
                    <div className="space-y-6">
                      {supplier ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Contact Details</h4>
                            <div className="space-y-3">
                              <DetailItem label="Name" value={supplier.name} icon={<TruckIcon />} />
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
                        </div>
                      ) : (
                        <div className="text-center py-10 text-slate-400 italic">No supplier associated with this product.</div>
                      )}
                    </div>
                  )}

                  {activeTab === 'classification' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Classification</h4>
                        <div className="space-y-3">
                          <DetailItem label="Category" value={category?.name || 'Uncategorized'} icon={<TagIcon />} />
                          <DetailItem label="Brand" value={product.brand || 'Generic'} />
                          <DetailItem label="Status" value={<StatusBadge status={product.status} />} />
                        </div>
                      </div>
                      {attributes.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Attributes</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {attributes.map(attr => (
                              <div key={attr.name} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                <span className="text-xs text-slate-500">{attr.name}</span>
                                <span className="text-sm font-medium text-slate-900">{attr.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Standard Specs</h4>
                        <div className="space-y-3">
                          <DetailItem label="SKU" value={product.sku} icon={<BarcodeIcon />} />
                          <DetailItem label="Barcode" value={product.barcode || 'N/A'} icon={<BarcodeIcon />} />
                          <DetailItem label="Unit" value={product.unitOfMeasure || 'Unit'} icon={<CubeIcon />} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Physical Properties</h4>
                        <div className="space-y-3">
                          <DetailItem label="Weight" value={product.weight ? `${product.weight} kg` : 'N/A'} icon={<ScaleIcon />} />
                          <DetailItem label="Dimensions" value={product.dimensions || 'N/A'} icon={<CubeIcon />} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Stock Level</h4>
                        <StockIndicator />
                      </div>
                      <div className="space-y-4 pt-8 md:pt-0">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="text-sm text-slate-500 mb-1">Total Stock Value</div>
                          <div className="text-2xl font-bold text-slate-900">
                            {formatCurrency(price * product.stock, storeSettings)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3">
                            <div className="text-xs text-slate-500">Created</div>
                            <div className="text-sm font-medium text-slate-900">
                              {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="text-xs text-slate-500">Last Update</div>
                            <div className="text-sm font-medium text-slate-900">
                              {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
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