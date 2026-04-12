import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, Supplier, StoreSettings } from '../../types';
import { api, buildAssetUrl } from '../../services/api';
import SparklesIcon from '../icons/SparklesIcon';
import XMarkIcon from '../icons/XMarkIcon';
import CameraIcon from '../icons/CameraIcon';
import CameraCaptureModal from '../CameraCaptureModal';
import ArrowUpTrayIcon from '../icons/ArrowUpTrayIcon';
import SupplierFormModal from '../suppliers/SupplierFormModal';
import UnifiedScannerModal from '../UnifiedScannerModal';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import { useProductForm } from '../../hooks/useProductForm';
import { formatCurrency } from '@/utils/currency';
import { useToast } from '../../contexts/ToastContext';

interface ProductEditFormProps {
    product: Product;
    categories: Category[];
    suppliers: Supplier[];
    storeSettings: StoreSettings;
    onSave: (product: Product | Omit<Product, 'id'>) => Promise<void>;
    onCancel: () => void;
    onAddCategory?: () => void;
    onDirtyChange?: (isDirty: boolean) => void;
}

const ProductEditForm: React.FC<ProductEditFormProps> = ({
    product: productToEdit,
    categories,
    suppliers,
    storeSettings,
    onSave,
    onCancel,
    onAddCategory,
    onDirtyChange
}) => {
    const {
        product,
        setProduct, // Still needed for some direct updates
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
        relevantAttributes,
        // Carton mode
        cartonMode,
        toggleCartonMode,
        cartonPrice,
        unitsPerCarton,
        cartonsReceived,
        handleCartonChange,
    } = useProductForm({
        productToEdit,
        categories,
        storeSettings,
        onSaveSuccess: onCancel // Close on success
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
    const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliers);
    const [activeSection, setActiveSection] = useState<string>('details');

    useEffect(() => {
        setLocalSuppliers(suppliers);
    }, [suppliers]);

    useEffect(() => {
        if (onDirtyChange) {
            const isDirty = product.name.trim() !== '' || 
                product.description.trim() !== '' || 
                product.price > 0 || 
                product.categoryId !== undefined || 
                product.barcode !== '' || 
                images.length > 0;
            onDirtyChange(isDirty);
        }
    }, [product.name, product.description, product.price, product.categoryId, product.barcode, images.length, onDirtyChange]);

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

            if (productToEdit.id) {
                result = await api.putFormData<Product>(`/products/${productToEdit.id}`, formData);
            } else {
                result = await api.postFormData<Product>('/products', formData);
            }

            if ((result as any)?.offline) {
                const tempId = productToEdit.id || `temp_${Date.now()}`;
                const payload = { ...productToEdit, ...product, id: tempId } as Product;
                await onSave(payload);
            } else {
                await onSave(result as Product);
            }
        } catch (error: any) {
            console.error('Save failed', error);
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
            };

            const savedSupplier = await api.post<Supplier>('/suppliers', payload);
            setLocalSuppliers(prev => [...prev, savedSupplier || newSupplier]);
            setProduct(prev => ({ ...prev, supplierId: (savedSupplier || newSupplier).id }));
            setIsSupplierModalOpen(false);
        } catch (err: any) {
            console.error("Failed to create supplier:", err);
            alert("Failed to create supplier: " + err.message);
        }
    };

    const sections = [
        { id: 'details', label: 'Details' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'inventory', label: 'Inventory' },
        { id: 'images', label: 'Images' },
    ];

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'details':
                return (
                    <div className="p-0">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={product.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                            <div className="flex gap-2">
                                <select
                                    name="categoryId"
                                    id="categoryId"
                                    value={product.categoryId || ''}
                                    onChange={handleChange}
                                    required
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                {onAddCategory && (
                                    <button
                                        type="button"
                                        onClick={onAddCategory}
                                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold active:scale-95 transition-all duration-300"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="brand" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Brand</label>
                            <input
                                type="text"
                                name="brand"
                                id="brand"
                                value={product.brand || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label htmlFor="supplierId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                            <div className="flex gap-2">
                                <select
                                    name="supplierId"
                                    id="supplierId"
                                    value={product.supplierId || ''}
                                    onChange={handleChange}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">No Supplier</option>
                                    {localSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsSupplierModalOpen(true)}
                                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold active:scale-95 transition-all duration-300"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                            <div className="relative">
                                <textarea
                                    name="description"
                                    id="description"
                                    rows={3}
                                    value={product.description}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-28"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={isGenerating || !product.name || !product.categoryId}
                                    className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 text-xs font-medium active:scale-95 transition-all duration-300"
                                >
                                    <SparklesIcon className="w-3 h-3" />
                                    {isGenerating ? 'Generating...' : 'AI'}
                                </button>
                            </div>
                        </div>

                        {relevantAttributes.length > 0 && (
                            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Custom Attributes</p>
                                {relevantAttributes.map(attr => (
                                    <div key={attr.id}>
                                        <label htmlFor={`custom_${attr.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{attr.name}</label>
                                        <input
                                            type="text"
                                            name={`custom_${attr.id}`}
                                            id={`custom_${attr.id}`}
                                            value={product.customAttributes?.[attr.id] || ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'pricing':
                return (
                    <div className="space-y-4">

                        {/* ── Carton / Bulk Pricing Premium Toggle ── */}
                        <div className={`rounded-2xl overflow-hidden transition-all duration-500 border ${cartonMode ? 'border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:shadow-[0_0_30px_rgba(59,130,246,0.1)] bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10' : 'border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20'} backdrop-blur-md`}>
                            {/* Toggle header */}
                            <button
                                type="button"
                                id="carton-mode-toggle"
                                onClick={() => toggleCartonMode(!cartonMode)}
                                className={`w-full flex items-center justify-between px-5 py-4 transition-colors duration-200 ${cartonMode ? 'hover:bg-white/40 dark:hover:bg-slate-900/40' : 'hover:bg-slate-100/50 dark:hover:bg-slate-700/50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm ${cartonMode ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 scale-110' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-[15px] font-bold transition-colors duration-300 ${cartonMode ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>Receive by Carton / Box?</p>
                                        <p className={`text-xs mt-0.5 transition-colors duration-300 ${cartonMode ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {cartonMode ? 'Unit cost is calculated from carton data' : 'Enter carton details to auto-calculate unit costs'}
                                        </p>
                                    </div>
                                </div>
                                {/* Pill toggle switch */}
                                <div className={`relative w-12 h-7 rounded-full transition-all duration-300 shadow-inner ${cartonMode ? 'bg-blue-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}>
                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ease-spring ${cartonMode ? 'translate-x-5 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'translate-x-0'
                                        }`} />
                                </div>
                            </button>

                            {/* Carton fields — animated slide-down */}
                            <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${cartonMode ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-5 space-y-5 bg-white/40 dark:bg-slate-900/20 border-t border-blue-100 dark:border-blue-800/50">

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label htmlFor="cartonPrice" className="block text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                Carton Price *
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{storeSettings.currency?.symbol || ''}</span>
                                                <input
                                                    type="number"
                                                    id="cartonPrice"
                                                    value={cartonPrice}
                                                    onChange={e => handleCartonChange('cartonPrice', e.target.value)}
                                                    min="0.01"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-blue-200 dark:border-blue-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label htmlFor="unitsPerCarton" className="block text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                Units per Carton *
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">#</span>
                                                <input
                                                    type="number"
                                                    id="unitsPerCarton"
                                                    value={unitsPerCarton}
                                                    onChange={e => handleCartonChange('unitsPerCarton', e.target.value)}
                                                    min="1"
                                                    step="1"
                                                    placeholder="24"
                                                    className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-blue-200 dark:border-blue-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="cartonsReceived" className="block text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                                            <span>Cartons Received</span>
                                            <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 normal-case font-medium tracking-normal bg-blue-100/50 dark:bg-blue-900/30 px-2 py-0.5 rounded">auto-syncs to stock</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">📦</span>
                                            <input
                                                type="number"
                                                id="cartonsReceived"
                                                value={cartonsReceived}
                                                onChange={e => handleCartonChange('cartonsReceived', e.target.value)}
                                                min="0"
                                                step="1"
                                                placeholder="e.g. 5"
                                                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-blue-200 dark:border-blue-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Auto-calculated unit cost preview */}
                                    {parseFloat(cartonPrice) > 0 && parseInt(unitsPerCarton, 10) > 0 && (
                                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/10 border border-emerald-200/60 dark:border-emerald-700/40 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.06)] animate-glass-appear">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center shrink-0 shadow-sm">
                                                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline justify-between">
                                                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider">
                                                        Unit Cost Price
                                                    </p>
                                                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-base drop-shadow-sm">
                                                        {formatCurrency(parseFloat(cartonPrice) / parseInt(unitsPerCarton, 10), storeSettings)}
                                                    </span>
                                                </div>
                                                {cartonsReceived && parseInt(cartonsReceived, 10) > 0 && parseInt(unitsPerCarton, 10) > 0 && (
                                                    <div className="flex items-baseline justify-between mt-1.5 pt-1.5 border-t border-emerald-200/50 dark:border-emerald-800/40">
                                                        <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500/80 font-semibold">
                                                            Total Stock Added
                                                        </p>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-100/50 dark:bg-emerald-800/30 px-2 rounded">
                                                            +{parseInt(cartonsReceived, 10) * parseInt(unitsPerCarton, 10)} units
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Retail Price ── */}
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Retail Price {product.unitOfMeasure === 'kg' ? '(per kg)' : ''} *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{storeSettings.currency?.symbol || ''}</span>
                                <input
                                    type="number"
                                    name="price"
                                    id="price"
                                    value={product.price}
                                    onChange={handleChange}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* ── Cost Price (auto or manual) ── */}
                        <div className={`transition-all duration-300 ${cartonMode ? 'opacity-80' : ''}`}>
                            <label htmlFor="costPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                                <span>Cost Price</span>
                                {cartonMode && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        Auto-calculated
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{storeSettings.currency?.symbol || ''}</span>
                                <input
                                    type="number"
                                    name="costPrice"
                                    id="costPrice"
                                    value={product.costPrice === 0 ? '' : product.costPrice || ''}
                                    onChange={handleChange}
                                    readOnly={cartonMode}
                                    min="0"
                                    step="0.01"
                                    className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${cartonMode
                                        ? 'border-blue-200/60 dark:border-blue-800/40 bg-slate-100/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-inner'
                                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                        }`}
                                />
                                {cartonMode && (
                                    <div className="absolute inset-0 z-10 cursor-not-allowed" title="Disable Carton Mode to edit manually"></div>
                                )}
                            </div>
                        </div>

                        {(product.price > 0 && product.costPrice !== undefined) && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 mt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Estimated Profit</span>
                                    <span className={`text-sm font-bold ${profitAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(profitAmount, storeSettings)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Margin</span>
                                    <span className={`text-sm font-bold ${profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {profitMargin.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${profitMargin >= 30 ? 'bg-green-500' : profitMargin >= 10 ? 'bg-blue-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.max(0, Math.min(100, profitMargin))}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'inventory':
                return (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="sku" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU *</label>
                            <input
                                type="text"
                                name="sku"
                                id="sku"
                                value={product.sku}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label htmlFor="barcode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Barcode</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="barcode"
                                    id="barcode"
                                    value={product.barcode || ''}
                                    onChange={handleChange}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsBarcodeScannerOpen(true)}
                                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all duration-300"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                    </svg>

                                </button>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={handleGenerateBarcode}
                                    className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm active:scale-95 transition-all duration-300"
                                >
                                    Generate from SKU
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleLookup()}
                                    disabled={isGenerating}
                                    className="flex-1 py-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-sm disabled:opacity-50 active:scale-95 transition-all duration-300"
                                >
                                    {isGenerating ? 'Searching...' : 'Lookup Info'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className={`transition-all duration-300 ${cartonMode ? 'opacity-80' : ''}`}>
                                <label htmlFor="stock" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                                    <span>Stock</span>
                                    {cartonMode && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            Auto-sync
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="stock"
                                        id="stock"
                                        value={product.stock}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        readOnly={cartonMode}
                                        step={product.unitOfMeasure === 'kg' ? "0.001" : "1"}
                                        className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${cartonMode
                                            ? 'border-blue-200/60 dark:border-blue-800/40 bg-slate-100/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-inner'
                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                            }`}
                                    />
                                    {cartonMode && (
                                        <div className="absolute inset-0 z-10 cursor-not-allowed" title="Update Cartons Received to change stock"></div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                                <select
                                    name="unitOfMeasure"
                                    id="unitOfMeasure"
                                    value={product.unitOfMeasure || 'unit'}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="unit">Unit</option>
                                    <option value="kg">Kilogram (kg)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="reorderPoint" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reorder Point</label>
                                <input
                                    type="number"
                                    name="reorderPoint"
                                    id="reorderPoint"
                                    value={product.reorderPoint || ''}
                                    onChange={handleChange}
                                    min="0"
                                    step="1"
                                    placeholder={`${storeSettings.lowStockThreshold}`}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="safetyStock" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Safety Stock</label>
                                <input
                                    type="number"
                                    name="safetyStock"
                                    id="safetyStock"
                                    value={product.safetyStock || ''}
                                    onChange={handleChange}
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="weight" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    id="weight"
                                    value={product.weight || ''}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.001"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="dimensions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dimensions</label>
                                <input
                                    type="text"
                                    name="dimensions"
                                    id="dimensions"
                                    value={product.dimensions || ''}
                                    onChange={handleChange}
                                    placeholder="10 x 20 x 5 cm"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'images':
                return (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowUpTrayIcon className="w-5 h-5" />
                                Upload Image
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCameraModalOpen(true)}
                                className="py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <CameraIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {images.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {images.map((url, index) => (
                                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img
                                            src={url.startsWith('data:') ? url : buildAssetUrl(url)}
                                            alt={`Product ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {images.length === 0 && (
                            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                                <p className="text-sm">No images uploaded</p>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <div className="flex flex-col h-full bg-transparent overflow-hidden">
                {/* Header */}
                <div className="px-5 sm:px-8 py-4 liquid-glass-header flex items-center justify-between sticky top-0 z-10 w-full shadow-none">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors md:hidden active:scale-95 transition-all duration-300"
                            aria-label="Go back"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-[17px] md:text-2xl font-semibold text-brand-text tracking-tight">
                                {productToEdit.id ? 'Edit Product' : 'Add New Product'}
                            </h1>
                            {productToEdit.id && (
                                <p className="text-[11px] font-medium text-brand-text-muted hidden sm:block truncate max-w-xs mt-0.5">
                                    {productToEdit.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="px-5 py-2 liquid-glass-pill rounded-xl border text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300 transition-all duration-200 active:scale-95 hidden sm:block"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold tracking-wide hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : (productToEdit.id ? 'Save Changes' : 'Create Product')}
                        </button>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="p-2 border-b border-slate-200 dark:border-white/10 overflow-x-auto scrollbar-hide bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-md">
                    <div className="flex gap-2">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => setActiveSection(section.id)}
                                className={`px-6 py-2 text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-300 rounded-xl active:scale-95 ${activeSection === section.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-0 ">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                        <div className="liquid-glass-card rounded-none p-1 sm:p-8 animate-glass-appear">
                            {renderSectionContent()}
                        </div>
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                    />
                </form>
            </div>

            {/* Modals */}
            <CameraCaptureModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onCapture={(image) => {
                    handleCameraCapture(image);
                    setIsCameraModalOpen(false);
                    showToast('Photo captured', 'success');
                }}
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
                    if (!product.name) {
                        handleLookup(code);
                    }
                }}
                title="Scan Product Barcode"
            />
        </>
    );
};

export default ProductEditForm;
