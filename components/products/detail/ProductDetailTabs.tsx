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
            <div className="flex overflow-x-auto gap-1 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-full w-fit scrollbar-hide shadow-inner border border-white/10 dark:border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-8 py-2.5 text-[13px] font-black tracking-widest uppercase transition-all duration-300 rounded-full active:scale-95 ${activeTab === tab.id
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                                <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Product Narrative</h4>
                                    <div className="text-[16px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                                        {product.description}
                                    </div>
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-10">{product.description ? 'Technical Specifications' : 'Product Fundamentals'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    <div className="space-y-8">
                                        <DetailItem label="SKU Identification" value={<span className="font-mono tracking-tight">{product.sku || 'N/A'}</span>} icon={<BarcodeIcon className="w-4 h-4" />} />
                                        <DetailItem label="Global Barcode" value={<span className="font-mono tracking-tight">{product.barcode || 'N/A'}</span>} icon={<BarcodeIcon className="w-4 h-4" />} />
                                        <DetailItem label="Class Assignment" value={category?.name || 'Uncategorized'} icon={<TagIcon className="w-4 h-4" />} />
                                    </div>
                                    <div className="space-y-8">
                                        <DetailItem label="Manufacturer/Brand" value={product.brand || 'Generic Branding'} />
                                        <DetailItem label="Measuring Unit" value={product.unitOfMeasure || 'Standard Unit'} icon={<CubeIcon className="w-4 h-4" />} />
                                        <DetailItem label="Lifecycle Status" value={<span className="inline-block mt-1"><StatusBadge status={product.status} /></span>} />
                                    </div>
                                </div>
                            </div>

                            {/* Supplier & Physical Info */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {supplier && (
                                    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500">
                                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-10">Supply Logistics</h4>
                                        <div className="space-y-8">
                                            <DetailItem label="Entity Name" value={supplier.name} icon={<TruckIcon className="w-4 h-4" />} />
                                            {supplier.contactPerson && <DetailItem label="Authorized Representative" value={supplier.contactPerson} />}
                                            {supplier.phone && (
                                                <DetailItem label="Direct Line" value={
                                                    <a href={`tel:${supplier.phone}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all">{supplier.phone}</a>
                                                } />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(product.weight || product.dimensions) && (
                                    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500">
                                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-10">Physical Characteristics</h4>
                                        <div className="space-y-8">
                                            {product.weight && <DetailItem label="Net Weight" value={`${product.weight} kg`} icon={<ScaleIcon className="w-4 h-4" />} />}
                                            {product.dimensions && <DetailItem label="Volumetric Scale" value={product.dimensions} icon={<CubeIcon className="w-4 h-4" />} />}
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
                            <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-10">Asset Valuation</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">Current Asset Value</div>
                                        <div className="text-[36px] font-black text-blue-600 dark:text-blue-400 tracking-tighter leading-none">
                                            {formatCurrency(price * product.stock, storeSettings)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">Reorder Index</div>
                                        <div className="text-[32px] font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                            {product.reorderPoint || storeSettings.lowStockThreshold}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">Safety Buffer</div>
                                        <div className="text-[32px] font-black text-slate-900 dark:text-white tracking-tighter leading-none">
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
