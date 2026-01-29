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
    attributes: { name: string; value: string }[];
    storeSettings: StoreSettings;
}

const ProductDetailTabs: React.FC<ProductDetailTabsProps> = ({
    product,
    category,
    supplier,
    attributes,
    storeSettings
}) => {
    const [activeTab, setActiveTab] = useState<'description' | 'supplier' | 'classification' | 'specs' | 'inventory'>('description');

    const tabs = [
        { id: 'description', label: 'Description' },
        { id: 'supplier', label: 'Supplier' },
        { id: 'classification', label: 'Classification' },
        { id: 'specs', label: 'Specs' },
        { id: 'inventory', label: 'Inventory' }
    ] as const;

    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

    return (
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
                                        <StockIndicator product={product} storeSettings={storeSettings} />
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
    );
};

export default ProductDetailTabs;
