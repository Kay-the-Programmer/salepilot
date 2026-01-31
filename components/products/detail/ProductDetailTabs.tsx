import React, { useState } from 'react';
import { Product, Category, Supplier, StoreSettings } from '@/types.ts';
import { formatCurrency } from '@/utils/currency.ts';
import TruckIcon from '@/components/icons/TruckIcon';
import TagIcon from '@/components/icons/TagIcon';
import BarcodeIcon from '@/components/icons/BarcodeIcon';
import CubeIcon from '@/components/icons/CubeIcon';
import ScaleIcon from '@/components/icons/ScaleIcon';
import DetailItem from './DetailItem';
import StatusBadge from './StatusBadge';
import StockIndicator from './StockIndicator';

interface ProductDetailTabsProps {
    product: Product;
    category?: Category;
    supplier?: Supplier;
    storeSettings: StoreSettings;
}

const ProductDetailTabs: React.FC<ProductDetailTabsProps> = ({
    product,
    category,
    supplier,
    storeSettings
}) => {
    const [activeTab, setActiveTab] = useState<'details' | 'inventory'>('details');

    const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'inventory', label: 'Inventory' }
    ] as const;


    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

    return (
        <div className="space-y-4">
            {/* Tab Bar - Scrollable on mobile */}
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-white/10 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex-shrink-0 ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div glass-effect="" className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="p-6">
                    <div className="min-h-[200px]">
                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                {/* Description */}
                                {product.description && (
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Description</h4>
                                        <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                            {product.description}
                                        </div>
                                    </div>
                                )}

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <DetailItem label="SKU" value={product.sku || 'N/A'} icon={<BarcodeIcon />} />
                                        <DetailItem label="Barcode" value={product.barcode || 'N/A'} icon={<BarcodeIcon />} />
                                        <DetailItem label="Category" value={category?.name || 'Uncategorized'} icon={<TagIcon />} />
                                    </div>
                                    <div className="space-y-3">
                                        <DetailItem label="Brand" value={product.brand || 'Generic'} />
                                        <DetailItem label="Unit" value={product.unitOfMeasure || 'Unit'} icon={<CubeIcon />} />
                                        <DetailItem label="Status" value={<StatusBadge status={product.status} />} />
                                    </div>
                                </div>

                                {/* Supplier Info (if exists) */}
                                {supplier && (
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Supplier</h4>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                                            <DetailItem label="Company" value={supplier.name} icon={<TruckIcon />} />
                                            {supplier.contactPerson && <DetailItem label="Contact" value={supplier.contactPerson} />}
                                            {supplier.phone && (
                                                <DetailItem label="Phone" value={
                                                    <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">{supplier.phone}</a>
                                                } />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Additional Info (if exists) */}
                                {(product.weight || product.dimensions) && (
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Physical Properties</h4>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 grid grid-cols-2 gap-3">
                                            {product.weight && <DetailItem label="Weight" value={`${product.weight} kg`} icon={<ScaleIcon />} />}
                                            {product.dimensions && <DetailItem label="Dimensions" value={product.dimensions} icon={<CubeIcon />} />}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Inventory Tab */}
                        {activeTab === 'inventory' && (
                            <div className="space-y-6">
                                {/* Stock Status */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Stock Status</h4>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                        <StockIndicator product={product} storeSettings={storeSettings} />
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Financial Summary</h4>
                                    <div className="space-y-3">
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Stock Value</div>
                                            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                                {formatCurrency(price * product.stock, storeSettings)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Reorder Point</div>
                                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {product.reorderPoint || storeSettings.lowStockThreshold}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Safety Stock</div>
                                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
    );
};

export default ProductDetailTabs;
