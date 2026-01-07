import React, { useMemo, useState, useEffect } from 'react';
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
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import CubeIcon from '../icons/CubeIcon';
import ScaleIcon from '../icons/ScaleIcon';
import BarcodeIcon from '../icons/BarcodeIcon';
import TruckIcon from '../icons/TruckIcon';
import InformationCircleIcon from '../icons/InformationCircleIcon';
import { buildAssetUrl } from '@/services/api';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import EllipsisVerticalIcon from '../icons/EllipsisVerticalIcon';

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'default' | 'highlight';
    className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children, icon, variant = 'default', className }) => (
    <div className={`bg-white rounded-3xl border ${variant === 'highlight' ? 'border-blue-100 shadow-xl shadow-blue-500/5' : 'border-slate-200/60'} overflow-hidden h-full transition-all duration-300 hover:shadow-md ${className}`}>
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100/60 bg-slate-50/30">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-2 rounded-2xl ${variant === 'highlight' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 shadow-sm border border-slate-100'}`}>
                        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' }) : icon}
                    </div>
                )}
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">{title}</h3>
            </div>
        </div>
        <div className="p-5 sm:p-6">
            {children}
        </div>
    </div>
);

const DetailItem: React.FC<{
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    highlight?: boolean;
    truncate?: boolean;
}> = ({ label, value, icon, highlight = false, truncate = false }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100/60 last:border-b-0 group hover:bg-slate-50/50 px-2 -mx-2 rounded-2xl transition-all duration-200">
        <div className="flex items-center gap-3 min-w-0">
            {icon && (
                <div className="flex-shrink-0">
                    <div className="p-1.5 bg-slate-100/80 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5' }) : icon}
                    </div>
                </div>
            )}
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest truncate">
                {label}
            </div>
        </div>
        <div className={`text-sm font-bold text-right ml-4 ${highlight ? 'text-blue-600' : 'text-slate-900'} ${truncate ? 'truncate max-w-[150px] sm:max-w-[200px]' : ''}`}>
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

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMenuOpen && !(event.target as Element).closest('.menu-trigger') && !(event.target as Element).closest('.menu-content')) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const costPrice = typeof product.costPrice === 'string' ? parseFloat(product.costPrice || '0') : (product.costPrice || 0);
    const profitMargin = price > 0 && costPrice > 0 ? ((price - costPrice) / price) * 100 : null;
    const profitAmount = price - costPrice;

    const isKgUoM = (u?: string) => {
        const s = (u || '').toString().trim().toLowerCase();
        return s === 'kg' || s === 'kgs' || s === 'kilogram' || s === 'kilograms' || s === 'kilo';
    };

    const StatusBadge: React.FC<{ status: Product['status'] }> = ({ status }) => {
        const statusConfig = {
            active: {
                color: 'from-emerald-500 to-green-500',
                bg: 'bg-emerald-50',
                text: 'text-emerald-700',
                label: 'Active'
            },
            archived: {
                color: 'from-slate-400 to-slate-500',
                bg: 'bg-slate-100',
                text: 'text-slate-700',
                label: 'Archived'
            },
        };
        const config = statusConfig[status] || statusConfig.active;

        return (
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.bg} ${config.text} border border-slate-200/50`}>
                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${config.color}`}></div>
                {config.label}
            </span>
        );
    };

    const Tags = () => (
        <div className="flex flex-wrap items-center gap-2">
            {category && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-blue-50 text-blue-700 border border-blue-100">
                    <TagIcon className="w-3 h-3" />
                    {category.name}
                </span>
            )}
            {product.brand && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-purple-50 text-purple-700 border border-purple-100">
                    <CubeIcon className="w-3 h-3" />
                    {product.brand}
                </span>
            )}
            <StatusBadge status={product.status} />
        </div>
    );

    const StockIndicator = () => {
        const lowStockThreshold = product.reorderPoint || storeSettings.lowStockThreshold;
        const isLowStock = product.stock <= lowStockThreshold;
        const isOutOfStock = product.stock === 0;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Inventory</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black tracking-tighter ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                                {product.stock}
                            </span>
                            <span className="text-sm font-bold text-slate-400 uppercase">{product.unitOfMeasure || 'Units'}</span>
                        </div>
                    </div>
                    {isLowStock && !isOutOfStock && (
                        <div className="px-3 py-1 bg-amber-50 rounded-lg border border-amber-100 animate-pulse">
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-tighter">Low Stock Alert</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                            className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${isOutOfStock ? 'w-0' :
                                isLowStock ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                    'bg-gradient-to-r from-emerald-400 to-green-600'
                                }`}
                            style={{
                                width: `${Math.min(100, (product.stock / (Math.max(lowStockThreshold * 2, product.stock || 1))) * 100)}%`
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                        <span>Reorder at {lowStockThreshold}</span>
                        <span>Safety: {product.safetyStock || 0}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20 sm:pb-12">
            {/* Header Section */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm px-4 py-3 sm:px-6 sm:py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2.5 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-200/50"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-2xl font-black text-slate-900 truncate tracking-tight">
                                {product.name}
                            </h1>
                            <div className="hidden sm:block mt-1">
                                <Tags />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="menu-trigger flex items-center gap-2 px-3 py-2.5 sm:px-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 focus:outline-none"
                            >
                                <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Manage</span>
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </button>

                            {isMenuOpen && (
                                <div className="menu-content absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-scale-up origin-top-right ring-1 ring-black/5">
                                    <div className="p-2 space-y-1">
                                        {canManage && (
                                            <>
                                                <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</div>
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); onEdit(product); }}
                                                    className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 rounded-2xl hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center gap-3 group"
                                                >
                                                    <PencilIcon className="w-4 h-4 text-blue-500" />
                                                    Edit Details
                                                </button>
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); onAdjustStock(product); }}
                                                    className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-3 group"
                                                >
                                                    <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-500" />
                                                    Inventory Adjustment
                                                </button>
                                                {onPersonalUse && (
                                                    <button
                                                        onClick={() => { setIsMenuOpen(false); onPersonalUse(product); }}
                                                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 rounded-2xl hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-3 group"
                                                    >
                                                        <ShoppingCartIcon className="w-4 h-4 text-emerald-500" />
                                                        Personal Use
                                                    </button>
                                                )}
                                                <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                                <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Utilities</div>
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); onPrintLabel(product); }}
                                                    className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-3 group"
                                                >
                                                    <PrinterIcon className="w-4 h-4 text-slate-500" />
                                                    Print Product Label
                                                </button>
                                                {product.status === 'active' ? (
                                                    <button
                                                        onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                                                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 rounded-2xl hover:bg-amber-50 hover:text-amber-700 transition-all flex items-center gap-3 group"
                                                    >
                                                        <ArchiveBoxIcon className="w-4 h-4 text-slate-500" />
                                                        Archive Item
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                                                        className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-600 rounded-2xl hover:bg-emerald-50 transition-all flex items-center gap-3 group"
                                                    >
                                                        <RestoreIcon className="w-4 h-4 text-emerald-500" />
                                                        Restore to Active
                                                    </button>
                                                )}
                                                <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); onDelete(product); }}
                                                    className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 rounded-2xl hover:bg-red-50 transition-all flex items-center gap-3 group"
                                                >
                                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                                    Delete permanently
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
                {/* Mobile Tags Display */}
                <div className="sm:hidden mb-2">
                    <Tags />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    {/* Left Panel: Primary Content */}
                    <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6 sm:gap-8">

                        {/* Main Media Section */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col md:flex-row">
                            <div className="md:w-3/5 p-4 sm:p-8">
                                <div className="relative aspect-square sm:aspect-video md:aspect-square w-full rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 group">
                                    {mainImage ? (
                                        <>
                                            <img
                                                src={mainImage}
                                                alt={product.name}
                                                className={`w-full h-full object-contain transition-all duration-700 ease-in-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                                                onLoad={() => setImageLoaded(true)}
                                            />
                                            {!imageLoaded && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <div className="w-24 h-24 mb-4 rounded-full bg-white flex items-center justify-center shadow-inner border border-slate-50">
                                                <ShoppingCartIcon className="w-12 h-12" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest">No Visual Data</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="md:w-2/5 p-6 sm:p-8 flex flex-col gap-6 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100">
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Overview</span>
                                        <div className="flex flex-col gap-1">
                                            <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                                {formatCurrency(price, storeSettings)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 line-through opacity-50">
                                                    {formatCurrency(price * 1.2, storeSettings)}
                                                </span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-md uppercase tracking-tighter">
                                                    MSRP Ref
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/60">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost</span>
                                            <div className="text-lg font-black text-slate-700">{formatCurrency(costPrice, storeSettings)}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margin</span>
                                            <div className={`text-lg font-black ${profitMargin && profitMargin > 20 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                {profitMargin !== null ? `${profitMargin.toFixed(1)}%` : 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-auto">
                                        {imageUrls.length > 1 && (
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gallery Assets</span>
                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                    {imageUrls.map((url: string, idx: number) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setMainImage(url)}
                                                            className={`relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${mainImage === url
                                                                ? 'border-blue-600'
                                                                : 'border-white hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description & Core Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <InfoCard
                                title="Insights & Story"
                                icon={<InformationCircleIcon />}
                            >
                                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                                    {product.description || 'No detailed documentation has been recorded for this asset yet.'}
                                </p>
                            </InfoCard>

                            <InfoCard
                                title="Technical Specifications"
                                icon={<CubeIcon />}
                            >
                                <div className="space-y-1">
                                    <DetailItem
                                        label="System SKU"
                                        value={<code className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-md">{product.sku}</code>}
                                        icon={<BarcodeIcon />}
                                    />
                                    <DetailItem
                                        label="Barcode ID"
                                        value={product.barcode || 'Not Assigned'}
                                        icon={<BarcodeIcon />}
                                    />
                                    <DetailItem
                                        label="Unit Logic"
                                        value={isKgUoM(product.unitOfMeasure) ? 'Weighted (KG)' : 'Unit Count'}
                                        icon={<ScaleIcon />}
                                    />
                                    <DetailItem
                                        label="Weight Ref"
                                        value={product.weight ? `${product.weight} kg` : 'N/A'}
                                        icon={<ScaleIcon />}
                                    />
                                </div>
                            </InfoCard>
                        </div>

                        {/* Variants Panel */}
                        {Array.isArray(product.variants) && product.variants.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="p-1.5 bg-slate-900 text-white rounded-lg">
                                        <CubeIcon className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Available Variations</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {product.variants.map((v, idx) => (
                                        <div key={idx} className="bg-white rounded-[2rem] p-5 border border-slate-200/60 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-slate-900 text-sm truncate">{v.name || `Var-${idx + 1}`}</h4>
                                                    <span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 block">{v.sku}</span>
                                                </div>
                                                <div className="text-sm font-black text-blue-600">
                                                    {formatCurrency(typeof v.price === 'string' ? parseFloat(v.price) : (v.price ?? 0), storeSettings)}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${v.stock <= 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-700'}`}>
                                                    {v.stock} in stock
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{v.unitOfMeasure || 'U'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Sidebars Content */}
                    <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6 sm:gap-8">

                        {/* Status & Supply Section */}
                        <div className="flex flex-col gap-6">
                            <InfoCard
                                title="Supply Velocity"
                                icon={<TruckIcon />}
                            >
                                <div className="space-y-4">
                                    <DetailItem
                                        label="Primary Partner"
                                        value={supplier?.name || 'In-House'}
                                        icon={<TruckIcon />}
                                        truncate
                                    />
                                    {supplier && (
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier Intel</div>
                                            <div className="text-sm font-bold text-slate-900">{supplier.contactPerson}</div>
                                            <div className="text-xs text-slate-500">{supplier.email}</div>
                                        </div>
                                    )}
                                </div>
                            </InfoCard>

                            <InfoCard
                                title="Store Positioning"
                                icon={<TagIcon />}
                            >
                                <div className="space-y-1">
                                    <DetailItem
                                        label="Categorization"
                                        value={category?.name || 'General'}
                                        icon={<TagIcon />}
                                    />
                                    <DetailItem
                                        label="Brand Auth"
                                        value={product.brand || 'Universal'}
                                        icon={<CubeIcon />}
                                    />
                                    <DetailItem
                                        label="Dimension Ref"
                                        value={product.dimensions || 'Dynamic'}
                                        icon={<CubeIcon />}
                                    />
                                </div>
                            </InfoCard>

                            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/60 shadow-sm overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <StockIndicator />
                            </div>

                            {/* Attribute Grid */}
                            {attributes.length > 0 && (
                                <InfoCard
                                    title="Dynamic Matrix"
                                    icon={<TagIcon />}
                                >
                                    <div className="grid grid-cols-1 gap-3">
                                        {attributes.map(attr => (
                                            <div key={attr.name} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-all shadow-sm">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {attr.name}
                                                </div>
                                                <div className="text-xs font-black text-slate-900 uppercase">
                                                    {attr.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </InfoCard>
                            )}

                            {/* Profitability Index */}
                            <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-12 group-hover:scale-105 transition-transform duration-700"></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black">AI</div>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Profitability Index</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <div className="text-3xl font-black tracking-tighter">{profitAmount < 0 ? 'N/A' : formatCurrency(profitAmount, storeSettings)}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Net Per Unit</div>
                                        </div>
                                        <div>
                                            <div className={`text-3xl font-black tracking-tighter ${profitMargin && profitMargin > 30 ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                {profitMargin !== null ? `${profitMargin.toFixed(0)}%` : '0%'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Return Ratio</div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">System healthy: high margin asset</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailView;