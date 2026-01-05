import React, { useMemo } from 'react';
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

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children, className }) => (
    <div className={`bg-white shadow rounded-lg h-full ${className}`}>
        <h3 className="px-4 py-4 sm:px-6 text-base font-semibold text-gray-800 border-b border-gray-100">{title}</h3>
        <div className="p-4 sm:p-6">
            {children}
        </div>
    </div>
);

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 break-words">{value}</dd>
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

    const [mainImage, setMainImage] = React.useState('');
    const canManage = user.role === 'admin' || user.role === 'inventory_manager';

    const rawImageUrls = useMemo(() => (product.imageUrls || []).map((url: string) => url.replace(/[{}]/g, '')), [product.imageUrls]);
    const imageUrls = useMemo(() => rawImageUrls.map((url: string) => url && !url.startsWith('data:') && !/^https?:\/\//i.test(url)
        ? buildAssetUrl(url)
        : url
    ), [rawImageUrls]);

    React.useEffect(() => {
        const firstImageUrl = imageUrls[0] || '';
        setMainImage(firstImageUrl);
    }, [product.id, imageUrls]);

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

    const ActionButtons = () => (
        <div className="flex flex-wrap gap-2">
            {canManage && (
                <>
                    <button onClick={() => onEdit(product)} type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap">
                        Edit
                    </button>
                    <button onClick={() => onAdjustStock(product)} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap">
                        Stock
                    </button>
                    {onPersonalUse && (
                        <button onClick={() => onPersonalUse(product)} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap">
                            Personal Use
                        </button>
                    )}
                    <button onClick={() => onPrintLabel(product)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap">
                        Label
                    </button>
                    {product.status === 'active' ? (
                        <button onClick={() => onArchive(product.id)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors whitespace-nowrap">
                            Archive
                        </button>
                    ) : (
                        <button onClick={() => onArchive(product.id)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap">
                            Restore
                        </button>
                    )}
                    <button onClick={() => onDelete(product)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors whitespace-nowrap">
                        Delete
                    </button>
                </>
            )}
        </div>
    );

    const Tags = () => (
        <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                {category?.name || 'Uncategorized'}
            </span>
            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                {product.brand || 'No Brand'}
            </span>
            <StatusBadge status={product.status} />
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">
            {/* Desktop Actions Header */}
            <div className="hidden lg:flex items-center justify-start bg-white p-4 rounded-lg shadow space-x-4 mb-6">
                <ActionButtons />
            </div>

            {/* Mobile Header (Tags + Actions) */}
            <div className="lg:hidden flex flex-col space-y-4 mb-6">
                <div>
                    <Tags />
                </div>
                <div className="w-full overflow-x-auto pb-2">
                    <ActionButtons />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Images */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                            {mainImage ? (
                                <img src={mainImage} alt={product.name} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ShoppingCartIcon className="w-16 h-16 mx-auto mb-2" />
                                    <p className="text-sm">No image</p>
                                </div>
                            )}
                        </div>
                        {imageUrls.length > 0 && (
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                {imageUrls.map((url: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setMainImage(url)}
                                        className={`relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border-2 ${mainImage === url ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
                                    >
                                        <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                    {/* Desktop Title & Tags (Hidden on Mobile) */}
                    <div className="hidden lg:block md:col-span-2">
                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                        <Tags />
                    </div>

                    <div className="md:col-span-2">
                        <InfoCard title="Description">
                            <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{product.description || 'No description provided.'}</p>
                        </InfoCard>
                    </div>

                    <InfoCard title="Inventory & Pricing">
                        <dl className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <dt className="text-sm font-medium text-gray-500">Retail Price</dt>
                                <dd className="text-xl font-bold text-gray-900">{formatCurrency(price, storeSettings)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Cost Price</dt>
                                <dd className="text-sm text-gray-700">{formatCurrency(costPrice, storeSettings)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Margin</dt>
                                <dd className={`text-sm font-semibold ${profitMargin === null || profitMargin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {profitMargin !== null ? `${profitMargin.toFixed(1)}%` : 'N/A'}
                                </dd>
                            </div>
                            <hr className="my-2 border-gray-100" />
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Stock</dt>
                                <dd className={`text-lg font-bold ${product.stock <= (product.reorderPoint || storeSettings.lowStockThreshold) ? 'text-red-600' : 'text-gray-900'}`}>
                                    {product.stock}{isKgUoM(product.unitOfMeasure) ? ' kg' : ''}
                                </dd>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <dt>Reorder Point</dt>
                                <dd>{product.reorderPoint || storeSettings.lowStockThreshold}</dd>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <dt>Safety Stock</dt>
                                <dd>{product.safetyStock || 0}</dd>
                            </div>
                        </dl>
                    </InfoCard>

                    <InfoCard title="Specifications">
                        <dl className="space-y-3">
                            {attributes.map(attr => (
                                <div key={attr.name} className="flex justify-between">
                                    <dt className="text-sm font-medium text-gray-500">{attr.name}</dt>
                                    <dd className="text-sm text-gray-900">{attr.value}</dd>
                                </div>
                            ))}
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">UoM</dt>
                                <dd className="text-sm text-gray-900">{isKgUoM(product.unitOfMeasure) ? 'Kilogram (kg)' : 'Unit'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Weight</dt>
                                <dd className="text-sm text-gray-900">{product.weight ? `${product.weight} kg` : 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Dims</dt>
                                <dd className="text-sm text-gray-900">{product.dimensions || 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">SKU</dt>
                                <dd className="text-sm font-mono text-gray-900">{product.sku}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Barcode</dt>
                                <dd className="text-sm font-mono text-gray-900">{product.barcode || 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                                <dd className="text-sm text-gray-900 truncate max-w-[120px]">{supplier?.name || 'N/A'}</dd>
                            </div>
                        </dl>
                    </InfoCard>

                    {Array.isArray(product.variants) && product.variants.length > 0 && (
                        <div className="md:col-span-2">
                            <InfoCard title="Variants">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {product.variants.map((v, idx) => (
                                        <div key={idx} className="border rounded-md p-3 flex flex-col gap-1 bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="font-medium text-gray-900">{v.name || 'Variant'}</div>
                                                <div className="text-sm font-semibold text-gray-900">{formatCurrency(typeof v.price === 'string' ? parseFloat(v.price as any) : (v.price ?? 0), storeSettings)}</div>
                                            </div>
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <div className="flex justify-between"><span>SKU:</span> <span className="font-mono">{v.sku}</span></div>
                                                <div className="flex justify-between"><span>Stock:</span> <span>{v.stock}{isKgUoM(v.unitOfMeasure) ? ' kg' : ''}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetailView;