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
import ChartBarIcon from '../icons/ChartBarIcon';
import CubeIcon from '../icons/CubeIcon';
import ScaleIcon from '../icons/ScaleIcon';
import BarcodeIcon from '../icons/BarcodeIcon';
import TruckIcon from '../icons/TruckIcon';
import InformationCircleIcon from '../icons/InformationCircleIcon';
import ShareIcon from '../icons/ShareIcon';
import EyeIcon from '../icons/EyeIcon';
import { buildAssetUrl } from '@/services/api';

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'default' | 'highlight';
    className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children, icon, variant = 'default', className }) => (
    <div className={`bg-white rounded-2xl border ${variant === 'highlight' ? 'border-blue-200 shadow-lg shadow-blue-500/5' : 'border-slate-200 shadow-sm'} overflow-hidden h-full transition-all duration-300 hover:shadow-md ${className}`}>
        <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-2 rounded-lg ${variant === 'highlight' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                        {icon}
                    </div>
                )}
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            </div>
        </div>
        <div className="p-6">
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
    <div className="flex items-start justify-between py-3 border-b border-slate-100 last:border-b-0">
        <div className="flex items-center gap-3 flex-grow min-w-0">
            {icon && (
                <div className="flex-shrink-0">
                    <div className="p-1.5 bg-slate-50 rounded-lg">
                        {icon}
                    </div>
                </div>
            )}
            <div className={`text-sm font-medium text-slate-500 ${truncate ? 'truncate' : ''}`}>
                {label}
            </div>
        </div>
        <div className={`text-sm font-semibold text-right ${highlight ? 'text-slate-900' : 'text-slate-700'} ${truncate ? 'truncate max-w-[200px]' : ''}`}>
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
}> = ({ product, category, supplier, attributes, storeSettings, user, onEdit, onDelete, onArchive, onPrintLabel, onAdjustStock, onPersonalUse }) => {

    const [mainImage, setMainImage] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);
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
                bg: 'bg-slate-50', 
                text: 'text-slate-700',
                label: 'Archived'
            },
        };
        const config = statusConfig[status] || statusConfig.active;
        
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border border-slate-200`}>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${config.color}`}></div>
                {config.label}
            </span>
        );
    };

    const ActionButtons = () => (
        <div className="flex flex-wrap gap-2">
            {canManage && (
                <>
                    <button 
                        onClick={() => onEdit(product)} 
                        type="button"
                        className="group px-4 py-2.5 text-sm font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200 flex items-center gap-2"
                    >
                        <PencilIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Edit
                    </button>
                    <button 
                        onClick={() => onAdjustStock(product)} 
                        type="button" 
                        className="group px-4 py-2.5 text-sm font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:from-slate-100 hover:to-slate-200 hover:border-slate-300 transition-all duration-200 flex items-center gap-2"
                    >
                        <AdjustmentsHorizontalIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Adjust Stock
                    </button>
                    {onPersonalUse && (
                        <button 
                            onClick={() => onPersonalUse(product)} 
                            type="button" 
                            className="group px-4 py-2.5 text-sm font-semibold text-purple-700 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-purple-200 hover:border-purple-300 transition-all duration-200 flex items-center gap-2"
                        >
                            <ShoppingCartIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Personal Use
                        </button>
                    )}
                    <button 
                        onClick={() => onPrintLabel(product)} 
                        className="group px-4 py-2.5 text-sm font-semibold text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200 hover:from-amber-100 hover:to-amber-200 hover:border-amber-300 transition-all duration-200 flex items-center gap-2"
                    >
                        <PrinterIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Print Label
                    </button>
                    {product.status === 'active' ? (
                        <button 
                            onClick={() => onArchive(product.id)} 
                            className="group px-4 py-2.5 text-sm font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:from-slate-100 hover:to-slate-200 hover:border-slate-300 transition-all duration-200 flex items-center gap-2"
                        >
                            <ArchiveBoxIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Archive
                        </button>
                    ) : (
                        <button 
                            onClick={() => onArchive(product.id)} 
                            className="group px-4 py-2.5 text-sm font-semibold text-green-700 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:from-green-100 hover:to-green-200 hover:border-green-300 transition-all duration-200 flex items-center gap-2"
                        >
                            <RestoreIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Restore
                        </button>
                    )}
                    <button 
                        onClick={() => onDelete(product)} 
                        className="group px-4 py-2.5 text-sm font-semibold text-red-700 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 hover:from-red-100 hover:to-red-200 hover:border-red-300 transition-all duration-200 flex items-center gap-2"
                    >
                        <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Delete
                    </button>
                </>
            )}
        </div>
    );

    const Tags = () => (
        <div className="flex flex-wrap items-center gap-2">
            {category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200">
                    <TagIcon className="w-3 h-3" />
                    {category.name}
                </span>
            )}
            {product.brand && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200">
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
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Current Stock</span>
                    <span className={`text-lg font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {product.stock}{isKgUoM(product.unitOfMeasure) ? ' kg' : ''}
                    </span>
                </div>
                <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                        className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                            isOutOfStock ? 'w-0 bg-red-500' : 
                            isLowStock ? 'w-1/3 bg-amber-500' : 
                            'w-2/3 bg-emerald-500'
                        }`}
                        style={{ 
                            width: `${Math.min(100, (product.stock / (lowStockThreshold * 3)) * 100)}%` 
                        }}
                    />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Reorder at {lowStockThreshold}</span>
                    <span>Safety: {product.safetyStock || 0}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6 lg:p-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
                                {product.name}
                            </h1>
                            <StatusBadge status={product.status} />
                        </div>
                        <div className="flex items-center gap-4">
                            <Tags />
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <div className="hidden lg:block">
                            <ActionButtons />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden mb-6">
                <div className="w-full overflow-x-auto pb-3">
                    <ActionButtons />
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Images & Quick Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8">
                                {/* Main Image */}
                                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200">
                                    {mainImage ? (
                                        <>
                                            <img 
                                                src={mainImage} 
                                                alt={product.name} 
                                                className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                                onLoad={() => setImageLoaded(true)}
                                            />
                                            {!imageLoaded && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                            <ShoppingCartIcon className="w-20 h-20 mb-4" />
                                            <p className="text-sm font-medium">No image available</p>
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnails */}
                                {imageUrls.length > 0 && (
                                    <div className="mt-6">
                                        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                                            {imageUrls.map((url: string, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setMainImage(url)}
                                                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${mainImage === url 
                                                        ? 'border-blue-500 ring-2 ring-blue-200' 
                                                        : 'border-transparent hover:border-slate-300 hover:scale-105'
                                                    }`}
                                                >
                                                    <img 
                                                        src={url} 
                                                        alt={`${product.name} - View ${idx + 1}`} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {mainImage === url && (
                                                        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                                                            <EyeIcon className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description Card */}
                        <InfoCard 
                            title="Product Description" 
                            icon={<InformationCircleIcon className="w-5 h-5" />}
                        >
                            <div className="prose prose-sm max-w-none">
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {product.description || 'No detailed description has been provided for this product.'}
                                </p>
                            </div>
                        </InfoCard>

                        {/* Variants */}
                        {Array.isArray(product.variants) && product.variants.length > 0 && (
                            <InfoCard 
                                title="Product Variants" 
                                icon={<CubeIcon className="w-5 h-5" />}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {product.variants.map((v, idx) => {
                                        const variantPrice = typeof v.price === 'string' ? parseFloat(v.price as any) : (v.price ?? 0);
                                        const variantCost = typeof v.costPrice === 'string' ? parseFloat(v.costPrice as any) : (v.costPrice ?? 0);
                                        const variantMargin = variantPrice > 0 && variantCost > 0 
                                            ? ((variantPrice - variantCost) / variantPrice) * 100 
                                            : null;

                                        return (
                                            <div key={idx} className="group p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-blue-200 transition-all duration-200">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 text-sm">{v.name || `Variant ${idx + 1}`}</h4>
                                                        <p className="text-xs text-slate-500 mt-1">SKU: {v.sku}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-slate-900">
                                                            {formatCurrency(variantPrice, storeSettings)}
                                                        </div>
                                                        {variantMargin !== null && (
                                                            <div className={`text-xs font-medium ${variantMargin < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                {variantMargin.toFixed(1)}% margin
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-2 py-1 rounded ${v.stock <= 0 ? 'bg-red-50 text-red-700' : v.stock <= 10 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                            {v.stock}{isKgUoM(v.unitOfMeasure) ? 'kg' : ''} stock
                                                        </div>
                                                    </div>
                                                    <div className="text-slate-500">
                                                        {v.unitOfMeasure || 'units'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </InfoCard>
                        )}
                    </div>

                    {/* Right Column: Stats & Details */}
                    <div className="space-y-6">
                        {/* Pricing Card */}
                        <InfoCard 
                            title="Pricing & Profitability" 
                            icon={<CurrencyDollarIcon className="w-5 h-5" />}
                            variant="highlight"
                        >
                            <div className="space-y-1">
                                <DetailItem 
                                    label="Retail Price" 
                                    value={
                                        <div className="text-lg font-bold text-slate-900">
                                            {formatCurrency(price, storeSettings)}
                                        </div>
                                    }
                                    icon={<CurrencyDollarIcon className="w-4 h-4 text-blue-500" />}
                                    highlight={true}
                                />
                                <DetailItem 
                                    label="Cost Price" 
                                    value={
                                        <div className="text-sm">
                                            {formatCurrency(costPrice, storeSettings)}
                                        </div>
                                    }
                                    icon={<ChartBarIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem 
                                    label="Profit Amount" 
                                    value={
                                        <div className={`text-sm font-medium ${profitAmount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {formatCurrency(profitAmount, storeSettings)}
                                        </div>
                                    }
                                    icon={<ChartBarIcon className="w-4 h-4 text-emerald-500" />}
                                />
                                <DetailItem 
                                    label="Profit Margin" 
                                    value={
                                        <div className={`text-sm font-semibold ${profitMargin === null || profitMargin < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {profitMargin !== null ? `${profitMargin.toFixed(1)}%` : 'N/A'}
                                        </div>
                                    }
                                    icon={<ChartBarIcon className="w-4 h-4 text-purple-500" />}
                                />
                            </div>
                        </InfoCard>

                        {/* Stock Card */}
                        <InfoCard 
                            title="Inventory Status" 
                            icon={<ArchiveBoxIcon className="w-5 h-5" />}
                        >
                            <StockIndicator />
                        </InfoCard>

                        {/* Specifications Card */}
                        <InfoCard 
                            title="Specifications" 
                            icon={<CubeIcon className="w-5 h-5" />}
                        >
                            <div className="space-y-1">
                                <DetailItem 
                                    label="Unit of Measure" 
                                    value={isKgUoM(product.unitOfMeasure) ? 'Kilogram (kg)' : 'Unit'}
                                    icon={<ScaleIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem 
                                    label="Weight" 
                                    value={product.weight ? `${product.weight} kg` : 'N/A'}
                                    icon={<ScaleIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem 
                                    label="Dimensions" 
                                    value={product.dimensions || 'N/A'}
                                    icon={<CubeIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem 
                                    label="SKU Code" 
                                    value={<code className="font-mono text-slate-900">{product.sku}</code>}
                                    icon={<BarcodeIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem 
                                    label="Barcode" 
                                    value={product.barcode ? (
                                        <code className="font-mono text-slate-900">{product.barcode}</code>
                                    ) : 'N/A'}
                                    icon={<BarcodeIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem 
                                    label="Supplier" 
                                    value={
                                        supplier ? (
                                            <div className="flex items-center gap-2">
                                                <TruckIcon className="w-4 h-4 text-slate-400" />
                                                <span className="truncate">{supplier.name}</span>
                                            </div>
                                        ) : 'N/A'
                                    }
                                    icon={<TruckIcon className="w-4 h-4 text-slate-500" />}
                                    truncate={true}
                                />
                            </div>
                        </InfoCard>

                        {/* Attributes Card */}
                        {attributes.length > 0 && (
                            <InfoCard 
                                title="Product Attributes" 
                                icon={<TagIcon className="w-5 h-5" />}
                            >
                                <div className="grid grid-cols-1 gap-3">
                                    {attributes.map(attr => (
                                        <div key={attr.name} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg border border-slate-200">
                                            <div className="text-sm font-medium text-slate-700">
                                                {attr.name}
                                            </div>
                                            <div className="text-sm text-slate-900 font-semibold">
                                                {attr.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        )}

                        {/* Quick Stats */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                            <h3 className="text-sm font-semibold text-slate-300 mb-4">Product Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-2xl font-bold">{product.stock}</div>
                                    <div className="text-xs text-slate-400">Units in Stock</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {profitMargin !== null ? `${profitMargin.toFixed(0)}%` : 'N/A'}
                                    </div>
                                    <div className="text-xs text-slate-400">Margin</div>
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