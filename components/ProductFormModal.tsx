import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Category, CustomAttribute, Supplier, StoreSettings } from '../types';
import { generateDescription as fetchAIDescription } from '../services/geminiService';
import { api, buildAssetUrl } from '../services/api';
import SparklesIcon from './icons/SparklesIcon';
import XMarkIcon from './icons/XMarkIcon';
import CameraIcon from './icons/CameraIcon';
import CameraCaptureModal from './CameraCaptureModal';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import SupplierFormModal from './suppliers/SupplierFormModal';
import UnifiedScannerModal from './UnifiedScannerModal';
import { InputField } from './ui/InputField';
import { Button } from './ui/Button';
import { useProductForm } from '../hooks/useProductForm';
import { formatCurrency } from '@/utils/currency';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product | Omit<Product, 'id'>) => Promise<void>;
    productToEdit?: Product | null;
    categories: Category[];
    suppliers: Supplier[];
    storeSettings: StoreSettings;
    onAddCategory?: () => void;
    storeId?: string;
    initialValues?: Partial<Omit<Product, 'id'>>;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, productToEdit, categories, suppliers, storeSettings, onAddCategory, storeId, initialValues }) => {
    const {
        product,
        setProduct,
        images,
        isGenerating,
        isSaving,
        error,
        setError,
        setIsSaving,
        handleChange,
        handleGenerateDescription,
        handleGenerateBarcode,
        handleLookup,
        handleImageUpload,
        removeImage,
        handleCameraCapture,
        profitMargin,
        profitAmount,
        validate,
        prepareFormData,
        relevantAttributes
    } = useProductForm({
        productToEdit,
        initialValues,
        categories,
        storeSettings,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
    const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliers);
    const [activeSection, setActiveSection] = useState<string>('details'); // For mobile tabs

    useEffect(() => {
        setLocalSuppliers(suppliers);
    }, [suppliers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setIsSaving(true);

        try {
            const formData = prepareFormData();

            let result;
            if (productToEdit) {
                result = await api.putFormData<Product>(`/products/${productToEdit.id}`, formData);
            } else {
                result = await api.postFormData<Product>('/products', formData);
            }

            if ((result as any)?.offline) {
                const payload = productToEdit ? ({ ...productToEdit, ...product } as Product) : product;
                await onSave(payload as Product);
            } else {
                await onSave(result as Product);
            }
            onClose();
        } catch (error: any) {
            console.error('Save failed in modal', error);
            setError(error.message || 'Failed to save product');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateSupplier = async (newSupplier: Supplier) => {
        try {
            const payload = {
                id: newSupplier.id,
                name: newSupplier.name,
                contact_person: newSupplier.contactPerson,
                phone: newSupplier.phone,
                email: newSupplier.email,
                address: newSupplier.address,
                payment_terms: newSupplier.paymentTerms,
                banking_details: newSupplier.bankingDetails,
                notes: newSupplier.notes,
                store_id: storeId
            };

            const savedSupplier = await api.post<Supplier>('/suppliers', payload);
            setLocalSuppliers(prev => [...prev, savedSupplier || newSupplier]);
            setProduct(prev => ({ ...prev, supplierId: (savedSupplier || newSupplier).id }));
            setIsSupplierModalOpen(false);
        } catch (err: any) {
            console.error("Failed to create supplier:", err);
            setError("Failed to create supplier: " + err.message);
        }
    };

    if (!isOpen) return null;

    const renderSectionTitle = (title: string) => (
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">{title}</h3>
    );

    const renderMobileSectionTabs = () => (
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar sticky top-0 bg-white z-20">
            {mobileSections.map(s => (
                <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeSection === s.id
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {s.label}
                </button>
            ))}
        </div>
    );

    // Mobile section navigation
    const mobileSections = [
        { id: 'details', label: 'Details' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'inventory', label: 'Inventory' },
        { id: 'variants', label: 'Variants' },
        { id: 'images', label: 'Images' },
    ];


    const renderMobileSectionContent = () => {
        switch (activeSection) {
            case 'details':
                return (
                    <>
                        {renderSectionTitle('Product Details')}
                        <div className="space-y-4">
                            <InputField
                                label="Product Name"
                                name="name"
                                id="name"
                                value={product.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter product name"
                            />
                            <div>
                                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <div className="flex gap-2">
                                    <select
                                        name="categoryId"
                                        id="categoryId"
                                        value={product.categoryId || ''}
                                        onChange={handleChange}
                                        required
                                        className="flex-1 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="" disabled>Select a category</option>
                                        {categories.filter(c => c.parentId === null).map(c => (
                                            <React.Fragment key={c.id}>
                                                <option value={c.id} className="font-bold">{c.name}</option>
                                                {categories.filter(sub => sub.parentId === c.id).map(sub => (
                                                    <option key={sub.id} value={sub.id}>&nbsp;&nbsp;{sub.name}</option>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </select>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={onAddCategory}
                                        title="Add New Category"
                                        className="px-4"
                                    >
                                        <span className="text-lg font-bold text-blue-600">+</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {relevantAttributes.length > 0 && (
                            <div className="mt-4 space-y-4">
                                {relevantAttributes.map(attr => (
                                    <InputField
                                        key={attr.id}
                                        label={attr.name}
                                        name={`custom_${attr.id}`}
                                        id={`custom_${attr.id}`}
                                        value={product.customAttributes?.[attr.id] || ''}
                                        onChange={handleChange}
                                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="space-y-4 mt-4">
                            <InputField
                                label="Brand"
                                name="brand"
                                id="brand"
                                value={product.brand || ''}
                                onChange={handleChange}
                                placeholder="Enter brand name"
                            />
                            <div>
                                <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                                <div className="flex gap-2">
                                    <select
                                        name="supplierId"
                                        id="supplierId"
                                        value={product.supplierId || ''}
                                        onChange={handleChange}
                                        className="flex-1 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">No Supplier</option>
                                        {localSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setIsSupplierModalOpen(true)}
                                        title="Add New Supplier"
                                        className="px-4"
                                    >
                                        <span className="text-lg font-bold text-blue-600">+</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 relative">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <div className="relative">
                                <textarea
                                    name="description"
                                    id="description"
                                    rows={4}
                                    value={product.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all pr-32"
                                    placeholder="Enter product description..."
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={isGenerating || !product.name || !product.categoryId}
                                    className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                    {isGenerating ? 'Generating...' : 'Generate AI'}
                                </button>
                            </div>
                        </div>
                    </>
                );
            case 'pricing':
                return (
                    <>
                        {renderSectionTitle('Pricing')}
                        <div className="space-y-4">
                            <div>
                                <InputField
                                    label={`Retail Price ${product.unitOfMeasure === 'kg' ? '(per kg)' : ''}`}
                                    name="price"
                                    id="price"
                                    type="number"
                                    value={product.price}
                                    onChange={handleChange}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    icon={<span className="text-gray-500">$</span>}
                                    placeholder="0.00"
                                    helperText={product.unitOfMeasure === 'kg' ? "Enter the price per kilogram. The POS will multiply by the weight sold." : undefined}
                                />
                            </div>
                            <div>
                                <InputField
                                    label="Cost Price"
                                    name="costPrice"
                                    id="costPrice"
                                    type="number"
                                    value={product.costPrice || ''}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    icon={<span className="text-gray-500">$</span>}
                                    placeholder="0.00"
                                />
                            </div>

                            {(product.price > 0 && product.costPrice !== undefined) && (
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-500">Estimated Profit</span>
                                        <span className={`text-sm font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(profitAmount, storeSettings)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Margin</span>
                                        <span className={`text-sm font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {profitMargin.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${profitMargin >= 30 ? 'bg-green-500' : profitMargin >= 10 ? 'bg-blue-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.max(0, Math.min(100, profitMargin))}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                );
            case 'inventory':
                return (
                    <>
                        {renderSectionTitle('Inventory & Shipping')}
                        <div className="space-y-4">
                            <InputField
                                label="SKU"
                                name="sku"
                                id="sku"
                                value={product.sku}
                                onChange={handleChange}
                                required
                            />
                            <div>
                                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <InputField
                                                name="barcode"
                                                id="barcode"
                                                value={product.barcode || ''}
                                                onChange={handleChange}
                                                placeholder="Scan or enter barcode"
                                                className="mb-0"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setIsBarcodeScannerOpen(true)}
                                            title="Scan Barcode"
                                            className="px-4"
                                        >
                                            <span role="img" aria-label="scan">📷</span>
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleGenerateBarcode}
                                            className="flex-1 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-sm font-medium"
                                        >
                                            Generate from SKU
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleLookup()}
                                            disabled={isGenerating}
                                            className="flex-1 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 text-sm font-medium disabled:opacity-50"
                                        >
                                            {isGenerating ? 'Searching...' : 'Lookup Info'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <InputField
                                        label="Current Stock"
                                        name="stock"
                                        id="stock"
                                        type="number"
                                        value={product.stock}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        step={product.unitOfMeasure === 'kg' ? "0.001" : "1"}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700 mb-2">Unit of Measure</label>
                                    <select
                                        name="unitOfMeasure"
                                        id="unitOfMeasure"
                                        value={product.unitOfMeasure || 'unit'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="unit">Unit</option>
                                        <option value="kg">Kilogram (kg)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <InputField
                                        label="Reorder Point"
                                        name="reorderPoint"
                                        id="reorderPoint"
                                        type="number"
                                        value={product.reorderPoint || ''}
                                        onChange={handleChange}
                                        min="0"
                                        step="1"
                                        placeholder={`Default: ${storeSettings.lowStockThreshold}`}
                                    />
                                </div>
                                <div>
                                    <InputField
                                        label="Safety Stock"
                                        name="safetyStock"
                                        id="safetyStock"
                                        type="number"
                                        value={product.safetyStock || ''}
                                        onChange={handleChange}
                                        min="0"
                                        step="1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <InputField
                                        label="Weight (kg)"
                                        name="weight"
                                        id="weight"
                                        type="number"
                                        value={product.weight || ''}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.001"
                                    />
                                </div>
                                <div>
                                    <InputField
                                        label="Dimensions"
                                        name="dimensions"
                                        id="dimensions"
                                        value={product.dimensions || ''}
                                        onChange={handleChange}
                                        placeholder="10 x 20 x 5 cm"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                );
            case 'variants':
                return (
                    <>
                        {renderSectionTitle('Variants')}
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Add product variants (e.g., sizes or colors). Each variant should have a unique SKU, price, and stock.</p>
                            {(product.variants || []).map((v, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-gray-700">Variant {idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => setProduct(prev => ({
                                                ...prev,
                                                variants: (prev.variants || []).filter((_, i) => i !== idx)
                                            }))}
                                            className="text-red-600 hover:text-red-700 p-1"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={v.name || ''}
                                            onChange={(e) => setProduct(prev => ({
                                                ...prev,
                                                variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, name: e.target.value } : vv) || []
                                            }))}
                                            className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Name/Label"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={v.sku}
                                                onChange={(e) => setProduct(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, sku: e.target.value } : vv) || []
                                                }))}
                                                className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="SKU"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={v.price}
                                                onChange={(e) => setProduct(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, price: parseFloat(e.target.value || '0') } : vv) || []
                                                }))}
                                                className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Price"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                step={v.unitOfMeasure === 'kg' ? '0.001' : '1'}
                                                min="0"
                                                value={v.stock}
                                                onChange={(e) => setProduct(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, stock: parseFloat(e.target.value || '0') } : vv) || []
                                                }))}
                                                className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Stock"
                                            />
                                            <select
                                                value={v.unitOfMeasure || 'unit'}
                                                onChange={(e) => setProduct(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, unitOfMeasure: e.target.value as any } : vv) || []
                                                }))}
                                                className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="unit">Unit</option>
                                                <option value="kg">kg</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setProduct(prev => ({
                                    ...prev,
                                    variants: [...(prev.variants || []), {
                                        name: '',
                                        sku: `${product.sku}-${(prev.variants?.length || 0) + 1}`,
                                        price: product.price,
                                        stock: 0,
                                        unitOfMeasure: product.unitOfMeasure
                                    }]
                                }))}
                                className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                + Add Variant
                            </button>
                        </div>
                    </>
                );
            case 'images':
                return (
                    <>
                        {renderSectionTitle('Images')}
                        <div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {images.length > 0 ? (
                                    images.map((imgSrc, index) => (
                                        <div key={index} className="relative group aspect-square col-span-2">
                                            <img
                                                src={buildAssetUrl(imgSrc)}
                                                alt="Product image"
                                                className="w-full h-full object-cover rounded-lg shadow-sm border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 active:scale-95 transition-transform"
                                                aria-label="Remove image"
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                        >
                                            <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-600">Upload</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsCameraModalOpen(true)}
                                            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                        >
                                            <CameraIcon className="w-8 h-8 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-600">Camera</span>
                                        </button>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Only one image allowed per product.</p>

                            <div className="mt-6">
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Product Status</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setProduct(prev => ({ ...prev, status: 'active' }))}
                                        className={`flex-1 py-3 rounded-lg border font-medium ${product.status === 'active'
                                            ? 'bg-green-100 border-green-500 text-green-700'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProduct(prev => ({ ...prev, status: 'archived' }))}
                                        className={`flex-1 py-3 rounded-lg border font-medium ${product.status === 'archived'
                                            ? 'bg-gray-100 border-gray-500 text-gray-700'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        Archived
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center animate-fade-in">
                <div glass-effect="" className="w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-2xl">
                    {/* Header */}
                    <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-20 border-b border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-3 sm:px-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {productToEdit ? 'Edit Product' : 'Add Product'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:hidden">
                                    {mobileSections.find(s => s.id === activeSection)?.label}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Mobile Tabs */}
                        <div className="sm:hidden overflow-x-auto hide-scrollbar border-t border-gray-200 dark:border-gray-700">
                            <div className="flex">
                                {mobileSections.map((section) => (
                                    <button
                                        key={section.id}
                                        type="button"
                                        onClick={() => setActiveSection(section.id)}
                                        className={`flex-shrink-0 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeSection === section.id
                                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Mobile View - Sectioned Content */}
                            <div className="sm:hidden">
                                {renderMobileSectionContent()}
                            </div>

                            {/* Desktop View - All Sections */}
                            <div className="hidden sm:block space-y-6">
                                {/* Product Details */}
                                {renderSectionTitle('Product Details')}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={product.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                        <div className="flex gap-2">
                                            <select
                                                name="categoryId"
                                                id="categoryId"
                                                value={product.categoryId || ''}
                                                onChange={handleChange}
                                                required
                                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="" disabled>Select a category</option>
                                                {categories.filter(c => c.parentId === null).map(c => (
                                                    <React.Fragment key={c.id}>
                                                        <option value={c.id} className="font-bold">{c.name}</option>
                                                        {categories.filter(sub => sub.parentId === c.id).map(sub => (
                                                            <option key={sub.id} value={sub.id}>&nbsp;&nbsp;{sub.name}</option>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={onAddCategory}
                                                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                                                title="Add New Category"
                                            >
                                                <span className="text-lg font-bold text-blue-600">+</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                        <input
                                            type="text"
                                            name="brand"
                                            id="brand"
                                            value={product.brand || ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                        <div className="flex gap-2">
                                            <select
                                                name="supplierId"
                                                id="supplierId"
                                                value={product.supplierId || ''}
                                                onChange={handleChange}
                                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">No Supplier</option>
                                                {localSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setIsSupplierModalOpen(true)}
                                                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                                                title="Add New Supplier"
                                            >
                                                <span className="text-lg font-bold text-blue-600">+</span>
                                            </button>
                                        </div>
                                    </div>
                                    {relevantAttributes.length > 0 && (
                                        <div className="col-span-2 grid grid-cols-2 gap-4">
                                            {relevantAttributes.map(attr => (
                                                <div key={attr.id}>
                                                    <label htmlFor={`custom_${attr.id}`} className="block text-sm font-medium text-gray-700 mb-1">{attr.name}</label>
                                                    <input
                                                        type="text"
                                                        name={`custom_${attr.id}`}
                                                        id={`custom_${attr.id}`}
                                                        value={product.customAttributes?.[attr.id] || ''}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <div className="relative">
                                        <textarea
                                            name="description"
                                            id="description"
                                            rows={3}
                                            value={product.description}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-28"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGenerateDescription}
                                            disabled={isGenerating || !product.name || !product.categoryId}
                                            className="absolute top-2 right-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                                        >
                                            <SparklesIcon className="w-3 h-3" />
                                            {isGenerating ? 'Generating...' : 'Generate AI'}
                                        </button>
                                    </div>
                                </div>

                                {/* Pricing */}
                                {renderSectionTitle('Pricing')}
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label={`Retail Price ${product.unitOfMeasure === 'kg' ? '(per kg)' : ''}`}
                                        name="price"
                                        id="price"
                                        type="number"
                                        value={product.price}
                                        onChange={handleChange}
                                        required
                                        min="0.01"
                                        step="0.01"
                                        icon={<span className="text-gray-500">$</span>}
                                        placeholder="0.00"
                                    />
                                    <InputField
                                        label="Cost Price"
                                        name="costPrice"
                                        id="costPrice"
                                        type="number"
                                        value={product.costPrice || ''}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        icon={<span className="text-gray-500">$</span>}
                                        placeholder="0.00"
                                    />
                                </div>

                                {(product.price > 0 && product.costPrice !== undefined) && (
                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 mt-2">
                                        <div className="flex items-center gap-6">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-gray-500 uppercase font-semibold">Profit Margin</span>
                                                    <span className={`text-sm font-bold ${profitMargin >= 30 ? 'text-green-600' : profitMargin >= 10 ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {profitMargin.toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${profitMargin >= 30 ? 'bg-green-500' : profitMargin >= 10 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.max(0, Math.min(100, profitMargin))}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="w-px h-10 bg-gray-200"></div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 uppercase font-semibold">Estimated Profit</span>
                                                <span className={`text-lg font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(profitAmount, storeSettings)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Inventory & Shipping */}
                                {renderSectionTitle('Inventory & Shipping')}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                            <input
                                                type="text"
                                                name="sku"
                                                id="sku"
                                                value={product.sku}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    name="barcode"
                                                    id="barcode"
                                                    value={product.barcode || ''}
                                                    onChange={handleChange}
                                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsBarcodeScannerOpen(true)}
                                                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                                                    title="Scan Barcode"
                                                >
                                                    📷
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleLookup()}
                                                    disabled={isGenerating}
                                                    className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 text-sm font-medium"
                                                >
                                                    {isGenerating ? '...' : 'Lookup'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateBarcode}
                                                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm"
                                                >
                                                    Generate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                                                Stock{product.unitOfMeasure === 'kg' ? ' (kg)' : ''} *
                                            </label>
                                            <input
                                                type="number"
                                                name="stock"
                                                id="stock"
                                                value={product.stock}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                step={product.unitOfMeasure === 'kg' ? "0.001" : "1"}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                                            <select
                                                name="unitOfMeasure"
                                                id="unitOfMeasure"
                                                value={product.unitOfMeasure || 'unit'}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="unit">Unit</option>
                                                <option value="kg">Kilogram (kg)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                                            <input
                                                type="number"
                                                name="reorderPoint"
                                                id="reorderPoint"
                                                value={product.reorderPoint || ''}
                                                onChange={handleChange}
                                                min="0"
                                                step="1"
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="safetyStock" className="block text-sm font-medium text-gray-700 mb-1">Safety Stock</label>
                                            <input
                                                type="number"
                                                name="safetyStock"
                                                id="safetyStock"
                                                value={product.safetyStock || ''}
                                                onChange={handleChange}
                                                min="0"
                                                step="1"
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                            <input
                                                type="number"
                                                name="weight"
                                                id="weight"
                                                value={product.weight || ''}
                                                onChange={handleChange}
                                                min="0"
                                                step="0.001"
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                                            <input
                                                type="text"
                                                name="dimensions"
                                                id="dimensions"
                                                value={product.dimensions || ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="10 x 20 x 5 cm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Variants */}
                                {renderSectionTitle('Variants')}
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600">Add product variants (e.g., sizes or colors). Each variant should have a unique SKU, price, and stock.</p>
                                    {(product.variants || []).map((v, idx) => (
                                        <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2">
                                            <div className="grid grid-cols-5 gap-2 items-end">
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                                    <input
                                                        type="text"
                                                        value={v.name || ''}
                                                        onChange={(e) => setProduct(prev => ({
                                                            ...prev,
                                                            variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, name: e.target.value } : vv) || []
                                                        }))}
                                                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                                                    <input
                                                        type="text"
                                                        value={v.sku}
                                                        onChange={(e) => setProduct(prev => ({
                                                            ...prev,
                                                            variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, sku: e.target.value } : vv) || []
                                                        }))}
                                                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={v.price}
                                                        onChange={(e) => setProduct(prev => ({
                                                            ...prev,
                                                            variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, price: parseFloat(e.target.value || '0') } : vv) || []
                                                        }))}
                                                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProduct(prev => ({
                                                            ...prev,
                                                            variants: (prev.variants || []).filter((_, i) => i !== idx)
                                                        }))}
                                                        className="px-2 py-1.5 text-sm rounded border border-red-300 text-red-700 hover:bg-red-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                                                    <input
                                                        type="number"
                                                        step={v.unitOfMeasure === 'kg' ? '0.001' : '1'}
                                                        min="0"
                                                        value={v.stock}
                                                        onChange={(e) => setProduct(prev => ({
                                                            ...prev,
                                                            variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, stock: parseFloat(e.target.value || '0') } : vv) || []
                                                        }))}
                                                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">UoM</label>
                                                    <select
                                                        value={v.unitOfMeasure || 'unit'}
                                                        onChange={(e) => setProduct(prev => ({
                                                            ...prev,
                                                            variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, unitOfMeasure: e.target.value as any } : vv) || []
                                                        }))}
                                                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="unit">Unit</option>
                                                        <option value="kg">kg</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setProduct(prev => ({
                                            ...prev,
                                            variants: [...(prev.variants || []), {
                                                name: '',
                                                sku: `${product.sku}-${(prev.variants?.length || 0) + 1}`,
                                                price: product.price,
                                                stock: 0,
                                                unitOfMeasure: product.unitOfMeasure
                                            }]
                                        }))}
                                        className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors text-sm"
                                    >
                                        + Add Variant
                                    </button>
                                </div>

                                {/* Images */}
                                {renderSectionTitle('Images')}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-5 gap-4">
                                        {images.map((imgSrc, index) => (
                                            <div key={index} className="relative group aspect-square">
                                                <img
                                                    src={imgSrc.startsWith('data:') ? imgSrc : buildAssetUrl(imgSrc)}
                                                    alt={`Product ${index + 1}`}
                                                    className="w-full h-full object-cover rounded-xl shadow-sm border border-gray-200 group-hover:border-blue-500 transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-lg hover:bg-red-700 transition-all duration-200"
                                                    aria-label="Remove image"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {images.length < 5 && (
                                            <div className="flex gap-4 col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex-1 aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                                                >
                                                    <div className="p-3 bg-gray-50 rounded-full group-hover:bg-blue-100 transition-colors text-gray-400 group-hover:text-blue-600">
                                                        <ArrowUpTrayIcon className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-xs font-semibold">Upload</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCameraModalOpen(true)}
                                                    className="flex-1 aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                                                >
                                                    <div className="p-3 bg-gray-50 rounded-full group-hover:bg-blue-100 transition-colors text-gray-400 group-hover:text-blue-600">
                                                        <CameraIcon className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-xs font-semibold">Camera</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {images.length === 0
                                            ? "Add up to 5 high-quality images of your product."
                                            : `${images.length} of 5 images used.`}
                                    </p>
                                </div>

                                {/* Status */}
                                {renderSectionTitle('Status')}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Product Status</label>
                                        <select
                                            id="status"
                                            name="status"
                                            value={product.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none"
                                        >
                                            <option value="active">Active</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/*"
                        />

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6">
                            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSaving}
                                    isLoading={isSaving}
                                    loadingText="Saving..."
                                >
                                    {`Save ${productToEdit ? 'Changes' : 'Product'}`}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modals */}
            <CameraCaptureModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onCapture={handleCameraCapture}
            />
            <SupplierFormModal
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
                onSave={handleCreateSupplier}
            />
            <UnifiedScannerModal
                isOpen={isBarcodeScannerOpen}
                onClose={() => setIsBarcodeScannerOpen(false)}
                onScanSuccess={(code) => {
                    setProduct(prev => ({ ...prev, barcode: code }));
                    setIsBarcodeScannerOpen(false);
                    // Automatically lookup if we don't have a name yet
                    if (!product.name) {
                        handleLookup(code);
                    }
                }}
                title="Scan Product Barcode"
            />
        </>
    );
};

export default ProductFormModal;