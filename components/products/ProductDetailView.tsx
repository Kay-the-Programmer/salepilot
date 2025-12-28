import React from 'react';
import { Product, Category, Supplier, StoreSettings, User } from '@/types.ts';
import { formatCurrency } from '@/utils/currency.ts';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon';
import RestoreIcon from '../icons/RestoreIcon';
import PrinterIcon from '../icons/PrinterIcon';
import AdjustmentsHorizontalIcon from '../icons/AdjustmentsHorizontalIcon';
import ShoppingCartIcon from '../icons/ShoppingCartIcon';
import { buildAssetUrl } from '@/services/api';

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white shadow rounded-lg ${className}`}>
        <h3 className="px-4 py-4 sm:px-6 text-base font-semibold text-gray-800">{title}</h3>
        <div className="p-4 sm:p-6">
            {children}
        </div>
    </div>
);

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
);

const ProductDetailView: React.FC<{
    product: Product;
    category?: Category;
    supplier?: Supplier;
    attributes: {name: string, value: string}[];
    storeSettings: StoreSettings;
    user: User;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onArchive: (productId: string) => void;
    onPrintLabel: (product: Product) => void;
    onAdjustStock: (product: Product) => void;
    onPersonalUse?: (product: Product) => void;
}> = ({ product, category, supplier, attributes, storeSettings, user, onEdit, onDelete, onArchive, onPrintLabel, onAdjustStock, onPersonalUse }) => {

    const [mainImage, setMainImage] = React.useState('');
    const canManage = user.role === 'admin' || user.role === 'inventory_manager';

    // Ensure image_urls is always an array and clean up the curly braces
    const rawImageUrls = (product.imageUrls || []).map((url: string) => url.replace(/[{}]/g, ''));
    // Normalize to absolute URLs for backend-served assets
    const imageUrls = rawImageUrls.map((url: string) => url && !url.startsWith('data:') && !/^https?:\/\//i.test(url)
        ? buildAssetUrl(url)
        : url
    );

    React.useEffect(() => {
        const firstImageUrl = imageUrls[0] || '';
        setMainImage(firstImageUrl);
    }, [product, imageUrls]);

    // Convert string prices to numbers for calculations
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const costPrice = typeof product.costPrice === 'string' ? parseFloat(product.costPrice || '0') : (product.costPrice || 0);
    const profitMargin = price > 0 && costPrice > 0 ? ((price - costPrice) / price) * 100 : null;

    const isKgUoM = (u?: string) => {
        const s = (u || '').toString().trim().toLowerCase();
        return s === 'kg' || s === 'kgs' || s === 'kilogram' || s === 'kilograms' || s === 'kilo';
    };

    const StatusBadge: React.FC<{ status: Product['status'] }> = ({ status }) => {
        const statusStyles = {
            active: 'bg-green-100 text-green-800',
            archived: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
            {/* Top section with name and actions */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-3xl font-bold leading-7 py-2 text-gray-900 sm:truncate sm:tracking-tight">{product.name}</h2>
                    <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                        <div className="mt-2 flex items-center text-sm text-gray-500">{category?.name || 'Uncategorized'}</div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">{product.brand || 'No Brand'}</div>
                        <div className="mt-2 flex items-center text-sm text-gray-500"><StatusBadge status={product.status}/></div>
                    </div>
                </div>
                {canManage && (
                    <div className="mt-5 flex lg:ml-4 lg:mt-0 gap-x-2">
                        <button onClick={() => onEdit(product)} type="button"
                                className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            <PencilIcon className="-ml-0.5 h-5 w-5 text-gray-400" /> Edit
                        </button>
                        <button onClick={() => onAdjustStock(product)} type="button" className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            <AdjustmentsHorizontalIcon className="-ml-0.5 h-5 w-5 text-gray-400" /> Adjust Stock
                        </button>
                        {onPersonalUse && (
                            <button onClick={() => onPersonalUse(product)} type="button" className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                <AdjustmentsHorizontalIcon className="-ml-0.5 h-5 w-5 text-gray-400" /> Personal Use
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-3">
                                {mainImage ? (
                                    <img src={mainImage} alt={product.name} className="w-full h-auto object-cover rounded-lg shadow-sm aspect-square"/>
                                ) : (
                                    <div className="w-full aspect-square flex items-center justify-center rounded-lg bg-gray-50 border border-dashed border-gray-300">
                                        <div className="text-center text-gray-400">
                                            <ShoppingCartIcon className="w-16 h-16 mx-auto mb-2" />
                                            <p className="text-sm">No image uploaded</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {imageUrls.length > 0 && (
                                <div className="md:col-span-2 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[26rem]">
                                    {imageUrls.map((url: string, idx: number) => (
                                        <img key={idx} src={url} alt={`${product.name} thumbnail ${idx+1}`}
                                             onClick={() => setMainImage(url)}
                                             className={`w-20 h-20 md:w-full md:h-auto flex-shrink-0 object-cover rounded-md cursor-pointer aspect-square ${url === mainImage ? 'ring-2 ring-offset-2 ring-blue-500' : 'hover:opacity-80'}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <InfoCard title="Product Description">
                        <p className="text-gray-600 whitespace-pre-wrap">{product.description || 'No description provided.'}</p>
                    </InfoCard>

                    {(attributes.length > 0 || product.weight || product.dimensions || product.unitOfMeasure) && (
                        <InfoCard title="Specifications">
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {attributes.map(attr => (
                                    <DetailItem key={attr.name} label={attr.name} value={attr.value} />
                                ))}
                                <DetailItem label="Unit of Measure" value={isKgUoM(product.unitOfMeasure) ? 'Kilogram (kg)' : 'Unit'} />
                                <DetailItem label="Weight" value={product.weight ? `${product.weight} kg` : 'N/A'} />
                                <DetailItem label="Dimensions" value={product.dimensions || 'N/A'} />
                            </dl>
                        </InfoCard>
                    )}

                    {Array.isArray(product.variants) && product.variants.length > 0 && (
                        <InfoCard title="Variants">
                            <div className="grid grid-cols-1 gap-3">
                                {product.variants.map((v, idx) => (
                                    <div key={idx} className="border rounded-md p-3 flex flex-col gap-1 bg-gray-50">
                                        <div className="flex justify-between flex-wrap gap-2">
                                            <div className="font-medium text-gray-900">{v.name || 'Variant'}</div>
                                            <div className="text-sm text-gray-700">{formatCurrency(typeof v.price === 'string' ? parseFloat(v.price as any) : (v.price ?? 0), storeSettings)}</div>
                                        </div>
                                        <div className="text-xs text-gray-600 flex flex-wrap gap-4">
                                            <span>SKU: <span className="font-mono">{v.sku}</span></span>
                                            <span>Stock: <span className="font-semibold">{v.stock}{isKgUoM(v.unitOfMeasure) ? ' kg' : ''}</span></span>
                                            {v.unitOfMeasure && (
                                                <span>UoM: {isKgUoM(v.unitOfMeasure) ? 'kg' : 'unit'}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </InfoCard>
                    )}
                </div>

                {/* Right side */}
                <div className="lg:col-span-1 space-y-8">
                    <InfoCard title="Inventory & Pricing">
                        <dl className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <dt className="text-sm font-medium text-gray-500">Retail Price</dt>
                                <dd className="text-2xl font-bold text-gray-900">{formatCurrency(price, storeSettings)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Cost Price</dt>
                                <dd className="text-sm text-gray-700">{formatCurrency(costPrice, storeSettings)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Profit Margin</dt>
                                <dd className={`text-sm font-semibold ${profitMargin === null || profitMargin < 0 ? 'text-red-600' : 'text-green-600'}`}>{profitMargin !== null ? `${profitMargin.toFixed(1)}%` : 'N/A'}</dd>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between">
                                    <dt className="text-sm font-medium text-gray-500">Stock on Hand</dt>
                                    <dd className={`text-lg font-bold ${product.stock <= (product.reorderPoint || storeSettings.lowStockThreshold) ? 'text-red-600' : 'text-gray-900'}`}>{product.stock}{isKgUoM(product.unitOfMeasure) ? ' kg' : ''}</dd>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <dt>Reorder Point:</dt>
                                    <dd>
                                        {product.reorderPoint != null && product.reorderPoint !== undefined && product.reorderPoint !== 0
                                            ? `${product.reorderPoint}${isKgUoM(product.unitOfMeasure) ? ' kg' : ''}`
                                            : `(Default: ${storeSettings.lowStockThreshold}${isKgUoM(product.unitOfMeasure) ? ' kg' : ''})`}
                                    </dd>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <dt>Safety Stock:</dt>
                                    <dd>{(product.safetyStock || 0)}{isKgUoM(product.unitOfMeasure) ? ' kg' : ''}</dd>
                                </div>
                            </div>
                            <DetailItem label="SKU" value={<span className="font-mono">{product.sku}</span>} />
                            <DetailItem label="Barcode (UPC/EAN)" value={<span className="font-mono">{product.barcode || 'N/A'}</span>} />
                            <DetailItem label="Supplier" value={supplier?.name || 'N/A'} />
                        </dl>
                    </InfoCard>

                    {canManage && (
                        <InfoCard title="Actions">
                            <div className="space-y-3">
                                <button onClick={() => onPrintLabel(product)} className="w-full text-left p-3 rounded-md hover:bg-gray-100 flex justify-between items-center text-sm font-medium text-gray-700"><span>Print Label</span><PrinterIcon className="w-5 h-5"/></button>
                                {product.status === 'active' ? (
                                    <button onClick={() => onArchive(product.id)} className="w-full text-left p-3 rounded-md hover:bg-gray-100 flex justify-between items-center text-sm font-medium text-gray-700"><span>Archive Product</span><ArchiveBoxIcon className="w-5 h-5"/></button>
                                ) : (
                                    <button onClick={() => onArchive(product.id)} className="w-full text-left p-3 rounded-md hover:bg-gray-100 flex justify-between items-center text-sm font-medium text-gray-700"><span>Restore Product</span><RestoreIcon className="w-5 h-5"/></button>
                                )}
                                <button onClick={() => onDelete(product)} className="w-full text-left p-3 rounded-md hover:bg-gray-100 flex justify-between items-center text-sm font-medium text-gray-700"><span>Delete Product</span><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </InfoCard>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetailView;