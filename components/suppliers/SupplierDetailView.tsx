import React from 'react'; // Trivial comment to trigger HMR
import { Supplier, Product, StoreSettings } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import ShoppingCartIcon from '../icons/ShoppingCartIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import UserIcon from '../icons/UserIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import MapPinIcon from '../icons/MapPinIcon';
import BanknotesIcon from '../icons/BanknotesIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import { buildAssetUrl } from '@/services/api';
import ArrowTrendingUpIcon from '../icons/ArrowTrendingUpIcon';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import { formatCurrency } from '../../utils/currency';

interface SupplierDetailViewProps {
    supplier: Supplier;
    products: Product[];
    onEdit: (supplier: Supplier) => void;
    storeSettings: StoreSettings;
}

const InfoCard: React.FC<{
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'default' | 'products';
}> = ({ title, children, icon, variant = 'default' }) => (
    <div className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[32px] shadow-sm border ${variant === 'products' ? 'border-slate-200/50 dark:border-white/5' : 'border-slate-200/50 dark:border-white/5'} overflow-hidden`}>
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3.5">
                {icon && (
                    <div className={`p-2.5 rounded-2xl ${variant === 'products' ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 shadow-inner'}`}>
                        {icon}
                    </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
            </div>
        </div>
        <div className={`${variant === 'products' ? 'p-0' : 'p-6 sm:p-8'}`}>
            {children}
        </div>
    </div>
);

const DetailItem: React.FC<{
    label: string;
    value: string | React.ReactNode;
    icon?: React.ReactNode;
    highlight?: boolean;
}> = ({ label, value, icon, highlight = false }) => (
    <div className="py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-b-0">
        <div className="flex items-start gap-3">
            {icon && (
                <div className="flex-shrink-0 mt-0.5">
                    <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        {icon}
                    </div>
                </div>
            )}
            <div className="flex-grow min-w-0">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</div>
                <div className={`${highlight ? 'font-semibold' : 'font-normal'} text-slate-900 dark:text-white ${typeof value === 'string' ? 'whitespace-pre-wrap' : ''}`}>
                    {value || <span className="text-slate-400 dark:text-slate-600">Not specified</span>}
                </div>
            </div>
        </div>
    </div>
);

const ProductItem: React.FC<{ product: Product; storeSettings: StoreSettings }> = ({ product, storeSettings }) => {
    const numericStock = typeof product.stock === 'number' ? product.stock : (parseFloat(String(product.stock)) || 0);
    const isLowStock = numericStock <= (product.reorderPoint || 10);

    return (
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100/50 dark:border-slate-800/50 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
            <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                    {product.imageUrls?.[0] ? (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 shadow-inner">
                            <img
                                src={buildAssetUrl(product.imageUrls[0])}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200/50 dark:border-white/5 flex items-center justify-center shadow-inner">
                            <ShoppingCartIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-grow min-w-0 pt-1">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white text-[15px] sm:text-base line-clamp-2">
                                {product.name}
                            </h4>
                            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-medium">{product.sku || 'No SKU'}</p>
                        </div>
                        <div className="text-right pl-4">
                            <div className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white">
                                {formatCurrency(product.price, storeSettings)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unit price</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-y-2 mt-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                                <span className={`text-[13px] font-semibold tracking-wide ${isLowStock ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                    {numericStock} in stock
                                </span>
                                {isLowStock && numericStock > 0 && (
                                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300 px-2 py-0.5 rounded-full ml-1">
                                        Low
                                    </span>
                                )}
                            </div>
                            {product.unitOfMeasure === 'kg' && (
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                                    per kg
                                </span>
                            )}
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-wider">
                            {product.status === 'active' ? (
                                <span className="text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-1 rounded-md">
                                    Active
                                </span>
                            ) : (
                                <span className="text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-md">
                                    Inactive
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({ supplier, products, onEdit, storeSettings }) => {
    const totalProductValue = products.reduce((sum, product) => {
        const stock = typeof product.stock === 'number' ? product.stock : (parseFloat(String(product.stock)) || 0);
        return sum + (stock * product.price);
    }, 0);

    const activeProducts = products.filter(p => p.status === 'active').length;
    const lowStockProducts = products.filter(p => {
        const stock = typeof p.stock === 'number' ? p.stock : (parseFloat(String(p.stock)) || 0);
        return stock <= (p.reorderPoint || 10);
    }).length;

    return (
        <div className="min-h-full pb-32 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 animate-fade-in font-google">
            {/* Header Section */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-[28px] md:text-[34px] font-bold text-slate-900 dark:text-white tracking-tight leadng-tight">
                        Supplier Profile
                    </h1>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                        Supplier details and associated inventory link.
                    </p>
                </div>
                <button
                    onClick={() => onEdit(supplier)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <PencilIcon className="w-4 h-4" />
                    Edit Supplier
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column - Supplier Details */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    {/* Supplier Information Card */}
                    <InfoCard
                        title="Supplier Information"
                        icon={<BuildingOfficeIcon className="w-6 h-6" />}
                    >
                        <div className="space-y-2">
                            <DetailItem
                                label="Company Name"
                                value={supplier.name}
                                icon={<BuildingOfficeIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                                highlight={true}
                            />
                            <DetailItem
                                label="Contact Person"
                                value={supplier.contactPerson}
                                icon={<UserIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                            />
                            <DetailItem
                                label="Email Address"
                                value={supplier.email}
                                icon={<EnvelopeIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                            />
                            <DetailItem
                                label="Phone Number"
                                value={supplier.phone}
                                icon={<PhoneIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                            />
                            <DetailItem
                                label="Address"
                                value={supplier.address}
                                icon={<MapPinIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                            />
                        </div>
                    </InfoCard>

                    {/* Financial & Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Financial Details */}
                        <InfoCard
                            title="Financial Details"
                            icon={<BanknotesIcon className="w-6 h-6" />}
                        >
                            <div className="space-y-2">
                                <DetailItem
                                    label="Payment Terms"
                                    value={supplier.paymentTerms}
                                    icon={<CurrencyDollarIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                                />
                                <DetailItem
                                    label="Banking Details"
                                    value={
                                        supplier.bankingDetails ? (
                                            <div className="whitespace-pre-wrap font-mono text-[13px] bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/50 dark:border-white/5 text-slate-800 dark:text-slate-300 shadow-inner mt-2">
                                                {supplier.bankingDetails}
                                            </div>
                                        ) : undefined
                                    }
                                    icon={<ClipboardDocumentListIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                                />
                            </div>
                        </InfoCard>

                        {/* Additional Information */}
                        <InfoCard
                            title="Additional Notes"
                            icon={<DocumentTextIcon className="w-6 h-6" />}
                        >
                            <DetailItem
                                label="Notes"
                                value={
                                    supplier.notes ? (
                                        <div className="whitespace-pre-wrap text-[15px] bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/50 dark:border-white/5 text-slate-800 dark:text-slate-300 shadow-inner mt-2 leading-relaxed">
                                            {supplier.notes}
                                        </div>
                                    ) : undefined
                                }
                            />
                        </InfoCard>
                    </div>
                </div>

                {/* Right Column - Products & Stats */}
                <div className="space-y-6 md:space-y-8">
                    {/* Supplier Stats */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50/80 dark:from-slate-800/80 dark:to-indigo-900/40 rounded-[32px] border border-blue-100/50 dark:border-blue-800/30 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
                        <h3 className="text-[20px] font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5 tracking-tight">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Inventory Overview
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-slate-900/80 rounded-[20px] border border-white/50 dark:border-white/5 shadow-sm">
                                <div>
                                    <div className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Total Products</div>
                                    <div className="text-[28px] font-bold text-slate-900 dark:text-white leading-tight">{products.length}</div>
                                </div>
                                <div className="p-3 bg-blue-100/50 dark:bg-blue-900/40 rounded-2xl text-blue-600 dark:text-blue-400">
                                    <ShoppingCartIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-slate-900/80 rounded-[20px] border border-white/50 dark:border-white/5 shadow-sm">
                                <div>
                                    <div className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Active Products</div>
                                    <div className="text-[28px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{activeProducts}</div>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-slate-900/80 rounded-[20px] border border-white/50 dark:border-white/5 shadow-sm">
                                <div>
                                    <div className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Low Stock</div>
                                    <div className="text-[28px] font-bold text-amber-600 dark:text-amber-400 leading-tight">{lowStockProducts}</div>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-slate-900/80 rounded-[20px] border border-white/50 dark:border-white/5 shadow-sm">
                                <div>
                                    <div className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Total Value</div>
                                    <div className="text-[24px] font-bold text-purple-600 dark:text-purple-400 leading-tight">
                                        {formatCurrency(totalProductValue, storeSettings)}
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-100/50 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                                    <CurrencyDollarIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Card */}
                    <InfoCard
                        title="Products from this Supplier"
                        icon={<ShoppingCartIcon className="w-5 h-5" />}
                        variant="products"
                    >
                        {products.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {products.map((product) => (
                                    <ProductItem key={product.id} product={product} storeSettings={storeSettings} />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
                                    <ShoppingCartIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">No products linked</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    This supplier doesn't have any products associated yet.
                                </p>
                            </div>
                        )}
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetailView;