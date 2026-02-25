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
            {/* Tab Bar */}
            <div className="flex overflow-x-auto gap-0.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-full w-fit scrollbar-hide shadow-inner">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 text-[13px] font-bold tracking-wide whitespace-nowrap transition-all duration-200 rounded-full active:scale-95 ${activeTab === tab.id
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="py-6">
                <div className="min-h-[200px]">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="space-y-12 animate-glass-appear">
                            {/* Description */}
                            {product.description && (
                                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-slate-200/40 dark:border-white/5 shadow-sm">
                                    <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Description</h4>
                                    <div className="text-[16px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-google">
                                        {product.description}
                                    </div>
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-slate-200/40 dark:border-white/5 shadow-sm">
                                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">{product.description ? 'Technical Specs' : 'Product Details'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <DetailItem label="SKU" value={product.sku || 'N/A'} icon={<BarcodeIcon />} />
                                        <DetailItem label="Barcode" value={product.barcode || 'N/A'} icon={<BarcodeIcon />} />
                                        <DetailItem label="Category" value={category?.name || 'Uncategorized'} icon={<TagIcon />} />
                                    </div>
                                    <div className="space-y-6">
                                        <DetailItem label="Brand" value={product.brand || 'Generic'} />
                                        <DetailItem label="Unit" value={product.unitOfMeasure || 'Unit'} icon={<CubeIcon />} />
                                        <DetailItem label="Status" value={<span className="inline-block"><StatusBadge status={product.status} /></span>} />
                                    </div>
                                </div>
                            </div>

                            {/* Supplier & Physical Info */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {supplier && (
                                    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-slate-200/40 dark:border-white/5 shadow-sm">
                                        <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Supplier</h4>
                                        <div className="space-y-6">
                                            <DetailItem label="Company" value={supplier.name} icon={<TruckIcon />} />
                                            {supplier.contactPerson && <DetailItem label="Contact" value={supplier.contactPerson} />}
                                            {supplier.phone && (
                                                <DetailItem label="Phone" value={
                                                    <a href={`tel:${supplier.phone}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all">{supplier.phone}</a>
                                                } />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(product.weight || product.dimensions) && (
                                    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-slate-200/40 dark:border-white/5 shadow-sm">
                                        <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Dimensions</h4>
                                        <div className="space-y-6">
                                            {product.weight && <DetailItem label="Weight" value={`${product.weight} kg`} icon={<ScaleIcon />} />}
                                            {product.dimensions && <DetailItem label="Dimensions" value={product.dimensions} icon={<CubeIcon />} />}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Inventory Tab */}
                    {activeTab === 'inventory' && (
                        <div className="space-y-12 animate-glass-appear">
                            {/* Stock Status */}
                            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-slate-200/40 dark:border-white/5 shadow-sm">
                                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Stock Status</h4>
                                <div>
                                    <StockIndicator product={product} storeSettings={storeSettings} />
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-slate-200/40 dark:border-white/5 shadow-sm">
                                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Financial Summary</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
                                    <div className="flex flex-col">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 opacity-60">Total Stock Value</div>
                                        <div className="text-4xl font-black text-blue-600 dark:text-blue-400 font-google tracking-tight">
                                            {formatCurrency(price * product.stock, storeSettings)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 opacity-60">Reorder Point</div>
                                        <div className="text-3xl font-black text-slate-900 dark:text-white font-google">
                                            {product.reorderPoint || storeSettings.lowStockThreshold}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 opacity-60">Safety Stock</div>
                                        <div className="text-3xl font-black text-slate-900 dark:text-white font-google">
                                            {product.safetyStock || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailTabs;
