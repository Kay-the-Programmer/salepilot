import React from 'react';
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
    <div className={`bg-white rounded-2xl shadow-sm border ${variant === 'products' ? 'border-slate-200' : 'border-slate-200'} overflow-hidden`}>
        <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-2 rounded-lg ${variant === 'products' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                        {icon}
                    </div>
                )}
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            </div>
        </div>
        <div className={`${variant === 'products' ? 'p-0' : 'p-6'}`}>
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
    <div className="py-3 border-b border-slate-100 last:border-b-0">
        <div className="flex items-start gap-3">
            {icon && (
                <div className="flex-shrink-0 mt-0.5">
                    <div className="p-1.5 bg-slate-50 rounded-lg">
                        {icon}
                    </div>
                </div>
            )}
            <div className="flex-grow min-w-0">
                <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
                <div className={`${highlight ? 'font-semibold' : 'font-normal'} text-slate-900 ${typeof value === 'string' ? 'whitespace-pre-wrap' : ''}`}>
                    {value || <span className="text-slate-400">Not specified</span>}
                </div>
            </div>
        </div>
    </div>
);

const ProductItem: React.FC<{ product: Product; storeSettings: StoreSettings }> = ({ product, storeSettings }) => {
    const numericStock = typeof product.stock === 'number' ? product.stock : (parseFloat(String(product.stock)) || 0);
    const isLowStock = numericStock <= (product.reorderPoint || 10);

    return (
        <div className="px-6 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors group">
            <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                    {product.imageUrls?.[0] ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                            <img
                                src={buildAssetUrl(product.imageUrls[0])}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center">
                            <ShoppingCartIcon className="w-6 h-6 text-slate-400" />
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h4 className="font-semibold text-slate-900 text-sm line-clamp-2">
                                {product.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">{product.sku || 'No SKU'}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">
                                {formatCurrency(product.price, storeSettings)}
                            </div>
                            <div className="text-xs text-slate-500">Unit price</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                <span className={`text-xs font-medium ${isLowStock ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {numericStock} in stock
                                </span>
                                {isLowStock && numericStock > 0 && (
                                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                        Low stock
                                    </span>
                                )}
                            </div>
                            {product.unitOfMeasure === 'kg' && (
                                <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                                    Sold per kg
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-slate-500">
                            {product.status === 'active' ? (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    Active
                                </span>
                            ) : (
                                <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6 lg:p-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            {supplier.name}
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Supplier details and associated products
                        </p>
                    </div>
                    <button
                        onClick={() => onEdit(supplier)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-xl"
                    >
                        <PencilIcon className="w-4 h-4" />
                        Edit Supplier
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Supplier Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Supplier Information Card */}
                        <InfoCard
                            title="Supplier Information"
                            icon={<BuildingOfficeIcon className="w-5 h-5" />}
                        >
                            <div className="space-y-1">
                                <DetailItem
                                    label="Company Name"
                                    value={supplier.name}
                                    icon={<BuildingOfficeIcon className="w-4 h-4 text-slate-500" />}
                                    highlight={true}
                                />
                                <DetailItem
                                    label="Contact Person"
                                    value={supplier.contactPerson}
                                    icon={<UserIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem
                                    label="Email Address"
                                    value={supplier.email}
                                    icon={<EnvelopeIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem
                                    label="Phone Number"
                                    value={supplier.phone}
                                    icon={<PhoneIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem
                                    label="Address"
                                    value={supplier.address}
                                    icon={<MapPinIcon className="w-4 h-4 text-slate-500" />}
                                />
                            </div>
                        </InfoCard>

                        {/* Financial & Additional Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Financial Details */}
                            <InfoCard
                                title="Financial Details"
                                icon={<BanknotesIcon className="w-5 h-5" />}
                            >
                                <div className="space-y-1">
                                    <DetailItem
                                        label="Payment Terms"
                                        value={supplier.paymentTerms}
                                        icon={<CurrencyDollarIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                    <DetailItem
                                        label="Banking Details"
                                        value={
                                            supplier.bankingDetails ? (
                                                <div className="whitespace-pre-wrap font-mono text-sm bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                    {supplier.bankingDetails}
                                                </div>
                                            ) : undefined
                                        }
                                        icon={<ClipboardDocumentListIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                </div>
                            </InfoCard>

                            {/* Additional Information */}
                            <InfoCard
                                title="Additional Information"
                                icon={<DocumentTextIcon className="w-5 h-5" />}
                            >
                                <DetailItem
                                    label="Notes"
                                    value={
                                        supplier.notes ? (
                                            <div className="whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                {supplier.notes}
                                            </div>
                                        ) : undefined
                                    }
                                />
                            </InfoCard>
                        </div>
                    </div>

                    {/* Right Column - Products & Stats */}
                    <div className="space-y-6">
                        {/* Supplier Stats */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                                Supplier Stats
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-blue-100">
                                    <div>
                                        <div className="text-sm font-medium text-slate-600">Total Products</div>
                                        <div className="text-2xl font-bold text-slate-900">{products.length}</div>
                                    </div>
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-emerald-100">
                                    <div>
                                        <div className="text-sm font-medium text-slate-600">Active Products</div>
                                        <div className="text-2xl font-bold text-emerald-700">{activeProducts}</div>
                                    </div>
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-100">
                                    <div>
                                        <div className="text-sm font-medium text-slate-600">Low Stock</div>
                                        <div className="text-2xl font-bold text-amber-700">{lowStockProducts}</div>
                                    </div>
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-purple-100">
                                    <div>
                                        <div className="text-sm font-medium text-slate-600">Inventory Value</div>
                                        <div className="text-2xl font-bold text-purple-700">
                                            {formatCurrency(totalProductValue, storeSettings)}
                                        </div>
                                    </div>
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
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
                                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <ShoppingCartIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h4 className="font-medium text-slate-900 mb-2">No products linked</h4>
                                    <p className="text-sm text-slate-500">
                                        This supplier doesn't have any products associated yet.
                                    </p>
                                </div>
                            )}
                        </InfoCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetailView;