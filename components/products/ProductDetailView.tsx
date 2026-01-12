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
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import CubeIcon from '../icons/CubeIcon';
import ScaleIcon from '../icons/ScaleIcon';
import BarcodeIcon from '../icons/BarcodeIcon';
import TruckIcon from '../icons/TruckIcon';
import InformationCircleIcon from '../icons/InformationCircleIcon';
import { buildAssetUrl } from '@/services/api';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import EllipsisVerticalIcon from '../icons/EllipsisVerticalIcon';
import XMarkIcon from '../icons/XMarkIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'default' | 'highlight' | 'glass';
    className?: string;
    collapsible?: boolean;
    defaultOpen?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({
    title,
    children,
    icon,
    variant = 'default',
    className = '',
    collapsible = false,
    defaultOpen = true
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const variantStyles = {
        default: 'bg-white border-slate-200/70 shadow-sm',
        highlight: 'bg-gradient-to-br from-blue-50/80 to-white border-blue-200 shadow-md shadow-blue-500/5',
        glass: 'bg-white/80 backdrop-blur-sm border-white/50 shadow-lg'
    };

    return (
        <div className={`rounded-3xl border overflow-hidden h-fit transition-all duration-300 hover:shadow-lg ${variantStyles[variant]} ${className}`}>
            <div className={`px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100/60 ${variant === 'highlight' ? 'bg-blue-50/50' : 'bg-slate-50/30'}`}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className={`p-2 rounded-2xl ${variant === 'highlight'
                                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm'
                                : 'bg-white text-slate-600 shadow-xs border border-slate-100'}`}>
                                {React.isValidElement(icon) ?
                                    React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' }) : icon}
                            </div>
                        )}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">{title}</h3>
                    </div>
                    {collapsible && (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            aria-label={isOpen ? "Collapse section" : "Expand section"}
                        >
                            <ChevronRightIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                </div>
            </div>
            <div className={`p-5 sm:p-6 transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
                {children}
            </div>
        </div>
    );
};

const DetailItem: React.FC<{
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    highlight?: boolean;
    truncate?: boolean;
    className?: string;
}> = ({ label, value, icon, highlight = false, truncate = false, className = '' }) => (
    <div className={`flex items-center justify-between py-3.5 border-b border-slate-100/60 last:border-b-0 group hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-all duration-200 ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
            {icon && (
                <div className="flex-shrink-0">
                    <div className="p-1.5 bg-slate-100/70 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                        {React.isValidElement(icon) ?
                            React.cloneElement(icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5 text-slate-500' }) : icon}
                    </div>
                </div>
            )}
            <div className="text-xs font-semibold text-slate-500 tracking-wide truncate">
                {label}
            </div>
        </div>
        <div className={`text-sm font-semibold text-right ml-4 ${highlight ? 'text-blue-600' : 'text-slate-900'} ${truncate ? 'truncate max-w-[120px] sm:max-w-[180px] lg:max-w-[200px]' : ''}`}>
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
    const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'inventory'>('overview');
    const desktopMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
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
            const target = event.target as Node;
            const inDesktop = desktopMenuRef.current && desktopMenuRef.current.contains(target);
            const inMobile = mobileMenuRef.current && mobileMenuRef.current.contains(target);

            if (!inDesktop && !inMobile) {
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

    const isKgUoM = (u?: string) => {
        const s = (u || '').toString().trim().toLowerCase();
        return s === 'kg' || s === 'kgs' || s === 'kilogram' || s === 'kilograms' || s === 'kilo';
    };

    const StatusBadge: React.FC<{ status: Product['status'] }> = ({ status }) => {
        const statusConfig = {
            active: {
                color: 'from-emerald-500 to-emerald-600',
                bg: 'bg-emerald-50',
                text: 'text-emerald-700',
                label: 'Active',
                iconColor: 'text-emerald-500'
            },
            archived: {
                color: 'from-slate-500 to-slate-600',
                bg: 'bg-slate-100',
                text: 'text-slate-700',
                label: 'Archived',
                iconColor: 'text-slate-500'
            },
        };
        const config = statusConfig[status] || statusConfig.active;

        return (
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${status === 'active' ? 'border-emerald-200' : 'border-slate-200'}`}>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${config.color}`}></div>
                {config.label}
            </span>
        );
    };

    const Tags = () => (
        <div className="flex flex-wrap items-center gap-2">
            {category && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <TagIcon className="w-3.5 h-3.5" />
                    {category.name}
                </span>
            )}
            {product.brand && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    <CubeIcon className="w-3.5 h-3.5" />
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
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-600">Available Inventory</span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold tracking-tight ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                                {product.stock}
                            </span>
                            <span className="text-sm font-medium text-slate-500">{product.unitOfMeasure || 'Units'}</span>
                        </div>
                    </div>
                    {isLowStock && !isOutOfStock && (
                        <div className="px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 animate-pulse">
                            <span className="text-xs font-semibold text-amber-700">Low Stock</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                            className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${isOutOfStock ? 'w-0' :
                                isLowStock ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                    'bg-gradient-to-r from-emerald-400 to-green-500'
                                }`}
                            style={{
                                width: `${Math.min(100, (product.stock / (Math.max(lowStockThreshold * 2, product.stock || 1))) * 100)}%`
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>Reorder at {lowStockThreshold}</span>
                        <span>Safety: {product.safetyStock || 0}</span>
                    </div>
                </div>
            </div>
        );
    };

    const MobileBottomBar = () => (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-50 lg:hidden">
            <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
                <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">{product.name}</div>
                    <div className="text-xs text-slate-500">{formatCurrency(price, storeSettings)}</div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(product)}
                        className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                        aria-label="Edit"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <div className="relative" ref={mobileMenuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            aria-label="More options"
                        >
                            <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 animate-scale-up origin-bottom-right">
                                <div className="p-2 space-y-1">
                                    {canManage && (
                                        <>
                                            <button
                                                onClick={() => { setIsMenuOpen(false); onAdjustStock(product); }}
                                                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-3"
                                            >
                                                <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-500" />
                                                Adjust Stock
                                            </button>
                                            {onPersonalUse && (
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); onPersonalUse(product); }}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-3"
                                                >
                                                    <ShoppingCartIcon className="w-4 h-4 text-emerald-500" />
                                                    Personal Use
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { setIsMenuOpen(false); onPrintLabel(product); }}
                                                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-3"
                                            >
                                                <PrinterIcon className="w-4 h-4 text-slate-500" />
                                                Print Label
                                            </button>
                                            {product.status === 'active' ? (
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 rounded-xl hover:bg-amber-50 hover:text-amber-700 transition-all flex items-center gap-3"
                                                >
                                                    <ArchiveBoxIcon className="w-4 h-4 text-slate-500" />
                                                    Archive
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-3"
                                                >
                                                    <RestoreIcon className="w-4 h-4 text-emerald-500" />
                                                    Restore
                                                </button>
                                            )}
                                            <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                            <button
                                                onClick={() => { setIsMenuOpen(false); onDelete(product); }}
                                                className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all flex items-center gap-3"
                                            >
                                                <TrashIcon className="w-4 h-4 text-red-500" />
                                                Delete
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
    );

    const DesktopActionMenu = () => (
        <div className="hidden lg:flex lg:items-center lg:gap-3">
            <button
                onClick={() => onEdit(product)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
                <PencilIcon className="w-4 h-4" />
                Edit
            </button>
            <div className="relative" ref={desktopMenuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    aria-label="More options"
                >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 animate-scale-up origin-top-right">
                        <div className="p-2 space-y-1">
                            {canManage && (
                                <>
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</div>
                                    <button
                                        onClick={() => { setIsMenuOpen(false); onAdjustStock(product); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-3"
                                    >
                                        <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-500" />
                                        Adjust Stock
                                    </button>
                                    {onPersonalUse && (
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onPersonalUse(product); }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-3"
                                        >
                                            <ShoppingCartIcon className="w-4 h-4 text-emerald-500" />
                                            Personal Use
                                        </button>
                                    )}
                                    <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Utilities</div>
                                    <button
                                        onClick={() => { setIsMenuOpen(false); onPrintLabel(product); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-3"
                                    >
                                        <PrinterIcon className="w-4 h-4 text-slate-500" />
                                        Print Label
                                    </button>
                                    {product.status === 'active' ? (
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 rounded-xl hover:bg-amber-50 hover:text-amber-700 transition-all flex items-center gap-3"
                                        >
                                            <ArchiveBoxIcon className="w-4 h-4 text-slate-500" />
                                            Archive
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-3"
                                        >
                                            <RestoreIcon className="w-4 h-4 text-emerald-500" />
                                            Restore
                                        </button>
                                    )}
                                    <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                    <button
                                        onClick={() => { setIsMenuOpen(false); onDelete(product); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all flex items-center gap-3"
                                    >
                                        <TrashIcon className="w-4 h-4 text-red-500" />
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50/50 to-white pb-24 lg:pb-12">
            {/* Header Section */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-200">
                <div className="px-4 py-3 lg:px-6 lg:py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-200/50 flex-shrink-0 active:scale-95"
                                    aria-label="Go back"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </button>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                    <h1 className="text-lg lg:text-xl font-bold text-slate-900 truncate">
                                        {product.name}
                                    </h1>
                                    <div className="hidden sm:flex items-center gap-2">
                                        <Tags />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DesktopActionMenu />
                    </div>
                </div>

                {/* Mobile Tabs - Sticky & Segmented (Integrated in Header) */}
                <div className="lg:hidden px-4 pb-3">
                    <div className="flex p-1 bg-slate-100 rounded-xl overflow-hidden">
                        {['overview', 'specs', 'inventory'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-200 ${activeTab === tab
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-32 lg:pb-8">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left Panel - Main Content */}
                    <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
                        {/* Media & Pricing Card */}
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-6 lg:p-8">
                                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                                    {/* Product Image Gallery */}
                                    <div className="lg:w-2/5">
                                        {/* Mobile Swipeable Gallery */}
                                        <div className="lg:hidden mb-6 -mx-4 sm:mx-0">
                                            <div className="relative aspect-square sm:aspect-video bg-slate-50 overflow-hidden">
                                                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full">
                                                    {(imageUrls.length > 0 ? imageUrls : ['']).map((url, idx) => (
                                                        <div key={idx} className="min-w-full snap-center flex items-center justify-center relative">
                                                            {url ? (
                                                                <img
                                                                    src={url}
                                                                    alt={`${product.name} - View ${idx + 1}`}
                                                                    className="w-full h-full object-contain"
                                                                    loading={idx === 0 ? 'eager' : 'lazy'}
                                                                />
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center text-slate-300">
                                                                    <ShoppingCartIcon className="w-12 h-12 mb-2" />
                                                                    <p className="text-xs font-medium">No image</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Dots Indicator */}
                                                {imageUrls.length > 1 && (
                                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                                                        {imageUrls.map((_, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                                    // Simple active check based on scroll could be complex, 
                                                                    // for now simplistic or just visual indication of count
                                                                    'bg-slate-900/40 backdrop-blur-sm'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold">
                                                    {imageUrls.length || 0} Photos
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Gallery */}
                                        <div className="hidden lg:block relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 group">
                                            {mainImage ? (
                                                <>
                                                    <img
                                                        src={mainImage}
                                                        alt={product.name}
                                                        className={`w-full h-full object-contain transition-all duration-500 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                                                        onLoad={() => setImageLoaded(true)}
                                                        onError={() => setImageLoaded(true)}
                                                    />
                                                    {!imageLoaded && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-8">
                                                    <div className="w-20 h-20 mb-4 rounded-full bg-white flex items-center justify-center shadow-inner border border-slate-100">
                                                        <ShoppingCartIcon className="w-10 h-10" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-400">No image available</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Thumbnail Gallery (Desktop) */}
                                        <div className="hidden lg:block">
                                            {imageUrls.length > 1 && (
                                                <div className="mt-4">
                                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                        {imageUrls.map((url: string, idx: number) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setMainImage(url)}
                                                                className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${mainImage === url
                                                                    ? 'border-blue-600 ring-2 ring-blue-200'
                                                                    : 'border-slate-200 hover:border-slate-300'
                                                                    }`}
                                                            >
                                                                <img
                                                                    src={url}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pricing & Quick Info */}
                                    <div className="lg:w-3/5">
                                        <div className="space-y-6">
                                            <div>
                                                <div className="text-sm font-medium text-slate-500 mb-2">Price</div>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-3xl lg:text-4xl font-bold text-slate-900">
                                                        {formatCurrency(price, storeSettings)}
                                                    </span>
                                                    {profitMargin !== null && profitMargin > 20 && (
                                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg">
                                                            {profitMargin.toFixed(0)}% margin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 rounded-xl p-4">
                                                    <div className="text-xs font-medium text-slate-500 mb-1">Cost</div>
                                                    <div className="text-lg font-semibold text-slate-900">
                                                        {formatCurrency(costPrice, storeSettings)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-4">
                                                    <div className="text-xs font-medium text-slate-500 mb-1">Profit</div>
                                                    <div className={`text-lg font-semibold ${profitAmount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        {formatCurrency(profitAmount, storeSettings)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Stats */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-xl border border-blue-100">
                                                    <div className="text-xs font-medium text-blue-600 mb-1">SKU</div>
                                                    <div className="font-mono text-sm font-semibold text-slate-900 truncate">
                                                        {product.sku}
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-br from-slate-50 to-white p-3 rounded-xl border border-slate-100">
                                                    <div className="text-xs font-medium text-slate-600 mb-1">Barcode</div>
                                                    <div className="font-mono text-sm font-semibold text-slate-900 truncate">
                                                        {product.barcode || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-br from-slate-50 to-white p-3 rounded-xl border border-slate-100">
                                                    <div className="text-xs font-medium text-slate-600 mb-1">Unit</div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {product.unitOfMeasure || 'Unit'}
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-br from-slate-50 to-white p-3 rounded-xl border border-slate-100">
                                                    <div className="text-xs font-medium text-slate-600 mb-1">Weight</div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {product.weight ? `${product.weight} kg` : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description & Details */}
                        <div className={`${activeTab !== 'overview' && 'lg:hidden hidden'}`}>
                            <InfoCard
                                title="Product Description"
                                icon={<InformationCircleIcon />}
                                variant="glass"
                            >
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {product.description || 'No description available for this product.'}
                                </p>
                            </InfoCard>
                        </div>

                        {/* Specifications */}
                        <div className={`${activeTab !== 'specs' && 'lg:hidden hidden'}`}>
                            <InfoCard
                                title="Specifications"
                                icon={<CubeIcon />}
                                collapsible
                            >
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <DetailItem
                                                label="SKU"
                                                value={product.sku}
                                                icon={<BarcodeIcon />}
                                            />
                                            <DetailItem
                                                label="Barcode"
                                                value={product.barcode || 'Not assigned'}
                                                icon={<BarcodeIcon />}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <DetailItem
                                                label="Unit Type"
                                                value={isKgUoM(product.unitOfMeasure) ? 'Weight-based' : 'Unit-based'}
                                                icon={<ScaleIcon />}
                                            />
                                            <DetailItem
                                                label="Dimensions"
                                                value={product.dimensions || 'N/A'}
                                                icon={<CubeIcon />}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </InfoCard>
                        </div>

                        {/* Inventory & Stock */}
                        <div className={`${activeTab !== 'inventory' && 'lg:hidden hidden'}`}>
                            <InfoCard
                                title="Inventory Status"
                                icon={<CubeIcon />}
                                variant="highlight"
                            >
                                <StockIndicator />
                            </InfoCard>
                        </div>

                        {/* Variants Section - Always visible on desktop */}
                        <div className="hidden lg:block">
                            {Array.isArray(product.variants) && product.variants.length > 0 && (
                                <InfoCard
                                    title="Product Variants"
                                    icon={<CubeIcon />}
                                    collapsible
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {product.variants.map((v, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:border-blue-300 transition-colors group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 text-sm truncate">{v.name || `Variant ${idx + 1}`}</h4>
                                                        <span className="text-xs text-slate-500 font-mono mt-0.5 block">{v.sku}</span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-blue-600">
                                                        {formatCurrency(typeof v.price === 'string' ? parseFloat(v.price) : (v.price ?? 0), storeSettings)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${v.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {v.stock} in stock
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-500">{v.unitOfMeasure || 'Unit'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </InfoCard>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Sidebar Info */}
                    <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
                        {/* Inventory Status - Desktop */}
                        <div className="hidden lg:block">
                            <InfoCard
                                title="Stock Status"
                                icon={<CubeIcon />}
                                variant="highlight"
                            >
                                <StockIndicator />
                            </InfoCard>
                        </div>

                        {/* Supplier Information */}
                        <InfoCard
                            title="Supplier Information"
                            icon={<TruckIcon />}
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold text-slate-900">
                                            {supplier?.name || 'No supplier'}
                                        </div>
                                        {supplier?.contactPerson && (
                                            <div className="text-xs text-slate-600">{supplier.contactPerson}</div>
                                        )}
                                    </div>
                                    {supplier?.email && (
                                        <a
                                            href={`mailto:${supplier.email}`}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Contact
                                        </a>
                                    )}
                                </div>
                                {supplier?.phone && (
                                    <div className="text-xs text-slate-500">
                                        📞 {supplier.phone}
                                    </div>
                                )}
                            </div>
                        </InfoCard>

                        {/* Category & Brand */}
                        <InfoCard
                            title="Classification"
                            icon={<TagIcon />}
                        >
                            <div className="space-y-3">
                                <DetailItem
                                    label="Category"
                                    value={category?.name || 'Uncategorized'}
                                    icon={<TagIcon />}
                                />
                                <DetailItem
                                    label="Brand"
                                    value={product.brand || 'Generic'}
                                    icon={<CubeIcon />}
                                />
                                <DetailItem
                                    label="Status"
                                    value={<StatusBadge status={product.status} />}
                                    icon={product.status === 'active' ? undefined : <ArchiveBoxIcon />}
                                />
                            </div>
                        </InfoCard>

                        {/* Attributes */}
                        {attributes.length > 0 && (
                            <InfoCard
                                title="Attributes"
                                icon={<TagIcon />}
                                collapsible
                                defaultOpen={false}
                            >
                                <div className="grid grid-cols-1 gap-2">
                                    {attributes.map(attr => (
                                        <div key={attr.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                            <div className="text-xs font-medium text-slate-600">
                                                {attr.name}
                                            </div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                {attr.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        )}

                        {/* Profitability Summary */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                                        <CurrencyDollarIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold">Profitability</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-2xl font-bold tracking-tight">
                                            {profitAmount > 0 ? formatCurrency(profitAmount, storeSettings) : 'N/A'}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium mt-1">Net per unit</div>
                                    </div>
                                    <div>
                                        <div className={`text-2xl font-bold tracking-tight ${profitMargin && profitMargin > 30 ? 'text-emerald-400' : 'text-blue-300'}`}>
                                            {profitMargin !== null ? `${profitMargin.toFixed(0)}%` : '0%'}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium mt-1">Margin</div>
                                    </div>
                                </div>
                                {profitMargin && profitMargin > 30 && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                        <span className="text-xs font-medium text-emerald-200">High-margin product</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <MobileBottomBar />
        </div>
    );
}

export default ProductDetailView;