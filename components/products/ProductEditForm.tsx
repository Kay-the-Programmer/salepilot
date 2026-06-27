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

    // Shared field styling (Confident Clarity, mobile-first)
    const labelCls = 'block text-[13px] font-semibold text-brand-text-muted mb-1.5';
    const fieldCls = 'w-full bg-white dark:bg-slate-800 border border-brand-border rounded-xl text-sm py-3 px-4 text-brand-text placeholder:text-brand-text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all';
    const cardCls = 'form-card bg-surface dark:bg-slate-900/60 p-5 sm:p-6 rounded-2xl shadow-sm border border-brand-border';
    const sectionTitleCls = 'text-base font-bold text-brand-text mb-4';
    const Chevron = () => (
        <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
    );
    const AddBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="flex-none w-12 grid place-items-center rounded-xl border border-brand-border hover:bg-warm-100 dark:hover:bg-slate-700 text-primary active:scale-95 transition-all"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </button>
    );

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

    const heroImage = images[0] ? (images[0].startsWith('data:') ? images[0] : buildAssetUrl(images[0])) : null;
    const sym = storeSettings.currency?.symbol || '';

    return (
        <>
            <div className="flex flex-col h-full bg-transparent overflow-hidden">
                {/* ── Top app bar ── */}
                <header className="flex-none flex items-center justify-between px-4 sm:px-6 h-16 bg-surface/80 dark:bg-slate-900/60 backdrop-blur-xl border-b border-brand-border sticky top-0 z-20">
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-2 -ml-1 rounded-full text-primary hover:bg-success-muted dark:hover:bg-primary/15 transition-colors active:scale-90"
                            aria-label="Go back"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold text-primary tracking-tight truncate">
                                {productToEdit.id ? 'Edit Product' : 'Add New Product'}
                            </h1>
                            {productToEdit.id && (
                                <p className="text-[11px] font-medium text-brand-text-muted truncate hidden sm:block">{productToEdit.name}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="p-2 rounded-full text-primary hover:bg-success-muted dark:hover:bg-primary/15 transition-colors active:scale-90 disabled:opacity-50"
                        aria-label="Save product"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-6 py-5 space-y-4 max-w-4xl mx-auto w-full">

                        {error && (
                            <div className="p-4 bg-danger-muted/60 border border-danger/20 rounded-2xl">
                                <p className="text-sm font-bold text-danger">{error}</p>
                            </div>
                        )}

                        {/* ── Visual identity ── */}
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Image */}
                            <div className="md:col-span-1">
                                <label className={labelCls}>Product Image</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative aspect-square rounded-2xl bg-warm-100 dark:bg-slate-800/40 border-2 border-dashed border-brand-border hover:border-primary flex flex-col items-center justify-center text-brand-text-muted cursor-pointer group overflow-hidden transition-colors"
                                >
                                    {heroImage ? (
                                        <img src={heroImage} alt={product.name || 'Product'} className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ArrowUpTrayIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs px-4 text-center font-medium">Tap to upload</span>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setIsCameraModalOpen(true); }}
                                        className="absolute bottom-2 right-2 p-2 rounded-full bg-surface/90 dark:bg-slate-900/90 border border-brand-border text-primary shadow-sm hover:scale-105 active:scale-95 transition-transform"
                                        aria-label="Take photo"
                                    >
                                        <CameraIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Basics */}
                            <div className={`md:col-span-2 ${cardCls} space-y-4`}>
                                <div>
                                    <label htmlFor="name" className={labelCls}>Product Name *</label>
                                    <input type="text" name="name" id="name" value={product.name} onChange={handleChange} required placeholder="e.g. Artisanal Coffee Beans" className={fieldCls} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="categoryId" className={labelCls}>Category *</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <select name="categoryId" id="categoryId" value={product.categoryId || ''} onChange={handleChange} required className={`${fieldCls} appearance-none pr-10`}>
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
                                                <Chevron />
                                            </div>
                                            {onAddCategory && <AddBtn onClick={onAddCategory} label="Add category" />}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="unitOfMeasure" className={labelCls}>Unit of Measure</label>
                                        <div className="relative">
                                            <select name="unitOfMeasure" id="unitOfMeasure" value={product.unitOfMeasure || 'unit'} onChange={handleChange} className={`${fieldCls} appearance-none pr-10`}>
                                                <option value="unit">Unit</option>
                                                <option value="kg">Kilogram (kg)</option>
                                            </select>
                                            <Chevron />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── Details ── */}
                        <section className={cardCls}>
                            <h2 className={sectionTitleCls}>Details</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="brand" className={labelCls}>Brand</label>
                                        <input type="text" name="brand" id="brand" value={product.brand || ''} onChange={handleChange} className={fieldCls} />
                                    </div>
                                    <div>
                                        <label htmlFor="supplierId" className={labelCls}>Supplier</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <select name="supplierId" id="supplierId" value={product.supplierId || ''} onChange={handleChange} className={`${fieldCls} appearance-none pr-10`}>
                                                    <option value="">No Supplier</option>
                                                    {localSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <Chevron />
                                            </div>
                                            <AddBtn onClick={() => setIsSupplierModalOpen(true)} label="Add supplier" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="description" className={labelCls}>Description</label>
                                    <div className="relative">
                                        <textarea name="description" id="description" rows={3} value={product.description} onChange={handleChange} className={`${fieldCls} pr-24 resize-none`} />
                                        <button
                                            type="button"
                                            onClick={handleGenerateDescription}
                                            disabled={isGenerating || !product.name || !product.categoryId}
                                            className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success-muted dark:bg-primary/15 text-primary hover:bg-primary/15 disabled:opacity-50 text-xs font-bold active:scale-95 transition-all"
                                        >
                                            <SparklesIcon className="w-3.5 h-3.5" />
                                            {isGenerating ? 'Generating…' : 'AI'}
                                        </button>
                                    </div>
                                </div>
                                {relevantAttributes.length > 0 && (
                                    <div className="space-y-3 pt-1">
                                        <p className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wide">Custom Attributes</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {relevantAttributes.map(attr => (
                                                <div key={attr.id}>
                                                    <label htmlFor={`custom_${attr.id}`} className={labelCls}>{attr.name}</label>
                                                    <input type="text" name={`custom_${attr.id}`} id={`custom_${attr.id}`} value={product.customAttributes?.[attr.id] || ''} onChange={handleChange} className={fieldCls} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ── Identification ── */}
                        <section className={cardCls}>
                            <h2 className={sectionTitleCls}>Identification</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="sku" className={labelCls}>SKU *</label>
                                    <input type="text" name="sku" id="sku" value={product.sku} onChange={handleChange} required placeholder="Enter or generate SKU" className={fieldCls} />
                                </div>
                                <div>
                                    <label htmlFor="barcode" className={labelCls}>Barcode</label>
                                    <div className="relative">
                                        <input type="text" name="barcode" id="barcode" value={product.barcode || ''} onChange={handleChange} placeholder="Scan or enter barcode" className={`${fieldCls} pr-14`} />
                                        <button
                                            type="button"
                                            onClick={() => setIsBarcodeScannerOpen(true)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-warm-100 dark:bg-slate-700 text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
                                            aria-label="Scan barcode"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button type="button" onClick={handleGenerateBarcode} className="flex-1 py-2.5 rounded-xl border border-brand-border bg-white dark:bg-slate-800 hover:bg-warm-100 dark:hover:bg-slate-700 text-sm font-semibold text-brand-text active:scale-95 transition-all">
                                            Generate from SKU
                                        </button>
                                        <button type="button" onClick={() => handleLookup()} disabled={isGenerating} className="flex-1 py-2.5 rounded-xl border border-primary/40 bg-success-muted dark:bg-primary/15 text-primary text-sm font-semibold hover:bg-primary/15 disabled:opacity-50 active:scale-95 transition-all">
                                            {isGenerating ? 'Searching…' : 'Lookup Info'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── Pricing ── */}
                        <section className={cardCls}>
                            <h2 className={sectionTitleCls}>Pricing</h2>
                            <div className="space-y-4">

                                {/* Carton / Bulk Pricing Premium Toggle */}
                                <div className={`rounded-2xl overflow-hidden transition-all duration-500 border ${cartonMode ? 'border-primary/50 shadow-[0_0_20px_rgba(0,128,96,0.15)] dark:shadow-[0_0_30px_rgba(0,128,96,0.1)] bg-gradient-to-br from-primary/80 to-primary/50 dark:from-primary/20 dark:to-primary/10' : 'border-brand-border bg-warm-100/50 dark:bg-slate-800/20'} backdrop-blur-md`}>
                                    <button
                                        type="button"
                                        id="carton-mode-toggle"
                                        onClick={() => toggleCartonMode(!cartonMode)}
                                        className={`w-full flex items-center justify-between px-5 py-4 transition-colors duration-200 ${cartonMode ? 'hover:bg-white/40 dark:hover:bg-slate-900/40' : 'hover:bg-warm-100/60 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm ${cartonMode ? 'bg-white dark:bg-slate-800 text-primary scale-110' : 'bg-white dark:bg-slate-800 text-brand-text-muted'}`}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-[15px] font-bold transition-colors duration-300 ${cartonMode ? 'text-white' : 'text-brand-text'}`}>Receive by Carton / Box?</p>
                                                <p className={`text-xs mt-0.5 transition-colors duration-300 ${cartonMode ? 'text-white/80' : 'text-brand-text-muted'}`}>
                                                    {cartonMode ? 'Unit cost is calculated from carton data' : 'Enter carton details to auto-calculate unit costs'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`relative w-12 h-7 rounded-full transition-all duration-300 shadow-inner ${cartonMode ? 'bg-white/30' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ease-spring ${cartonMode ? 'translate-x-5 shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'translate-x-0'}`} />
                                        </div>
                                    </button>

                                    <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${cartonMode ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-5 space-y-5 bg-white/40 dark:bg-slate-900/20 border-t border-white/30 dark:border-primary/50">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="group">
                                                    <label htmlFor="cartonPrice" className="block text-xs font-bold uppercase tracking-wider text-white dark:text-primary mb-1.5">Carton Price *</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{sym}</span>
                                                        <input type="number" id="cartonPrice" value={cartonPrice} onChange={e => handleCartonChange('cartonPrice', e.target.value)} min="0.01" step="0.01" placeholder="0.00" className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-white/40 dark:border-primary/40 bg-white/90 dark:bg-slate-800/80 text-brand-text focus:ring-2 focus:ring-white focus:border-white outline-none transition-all shadow-sm" />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label htmlFor="unitsPerCarton" className="block text-xs font-bold uppercase tracking-wider text-white dark:text-primary mb-1.5">Units per Carton *</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">#</span>
                                                        <input type="number" id="unitsPerCarton" value={unitsPerCarton} onChange={e => handleCartonChange('unitsPerCarton', e.target.value)} min="1" step="1" placeholder="24" className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-white/40 dark:border-primary/40 bg-white/90 dark:bg-slate-800/80 text-brand-text focus:ring-2 focus:ring-white focus:border-white outline-none transition-all shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label htmlFor="cartonsReceived" className="block text-xs font-bold uppercase tracking-wider text-white dark:text-primary mb-1.5 flex justify-between items-end">
                                                    <span>Cartons Received</span>
                                                    <span className="text-[10px] text-white/80 dark:text-primary/70 normal-case font-medium tracking-normal bg-white/20 dark:bg-primary/15 px-2 py-0.5 rounded">auto-syncs to stock</span>
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">📦</span>
                                                    <input type="number" id="cartonsReceived" value={cartonsReceived} onChange={e => handleCartonChange('cartonsReceived', e.target.value)} min="0" step="1" placeholder="e.g. 5" className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-white/40 dark:border-primary/40 bg-white/90 dark:bg-slate-800/80 text-brand-text focus:ring-2 focus:ring-white focus:border-white outline-none transition-all shadow-sm" />
                                                </div>
                                            </div>
                                            {parseFloat(cartonPrice) > 0 && parseInt(unitsPerCarton, 10) > 0 && (
                                                <div className="flex items-center gap-3 p-4 bg-white/90 dark:bg-slate-900/40 border border-white/40 dark:border-primary/30 rounded-xl shadow-sm">
                                                    <div className="w-10 h-10 rounded-full bg-success-muted dark:bg-primary/20 flex items-center justify-center shrink-0">
                                                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-baseline justify-between">
                                                            <p className="text-xs text-brand-text-muted font-bold uppercase tracking-wider">Unit Cost Price</p>
                                                            <span className="font-extrabold text-primary text-base">{formatCurrency(parseFloat(cartonPrice) / parseInt(unitsPerCarton, 10), storeSettings)}</span>
                                                        </div>
                                                        {cartonsReceived && parseInt(cartonsReceived, 10) > 0 && parseInt(unitsPerCarton, 10) > 0 && (
                                                            <div className="flex items-baseline justify-between mt-1.5 pt-1.5 border-t border-brand-border">
                                                                <p className="text-[11px] text-brand-text-muted font-semibold">Total Stock Added</p>
                                                                <span className="font-bold text-primary text-sm bg-success-muted dark:bg-primary/20 px-2 rounded">+{parseInt(cartonsReceived, 10) * parseInt(unitsPerCarton, 10)} units</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Cost + Selling */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`transition-all duration-300 ${cartonMode ? 'opacity-80' : ''}`}>
                                        <label htmlFor="costPrice" className={`${labelCls} flex items-center justify-between`}>
                                            <span>Cost Price</span>
                                            {cartonMode && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-success-muted text-primary">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                    Auto
                                                </span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted font-medium">{sym}</span>
                                            <input type="number" name="costPrice" id="costPrice" value={product.costPrice === 0 ? '' : product.costPrice || ''} onChange={handleChange} readOnly={cartonMode} min="0" step="0.01" placeholder="0.00"
                                                className={`w-full pl-9 pr-4 py-4 text-2xl font-bold tabular-nums rounded-xl border outline-none transition-all ${cartonMode ? 'border-primary/40 bg-warm-100/70 dark:bg-slate-800/40 text-brand-text-muted cursor-not-allowed' : 'border-brand-border bg-white dark:bg-slate-800 text-brand-text focus:border-primary focus:ring-4 focus:ring-primary/10'}`} />
                                            {cartonMode && <div className="absolute inset-0 z-10 cursor-not-allowed" title="Disable Carton Mode to edit manually" />}
                                        </div>
                                        <p className="text-[11px] text-brand-text-muted mt-1.5">What you paid for this item.</p>
                                    </div>
                                    <div>
                                        <label htmlFor="price" className={labelCls}>Selling Price {product.unitOfMeasure === 'kg' ? '(per kg)' : ''} *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-medium">{sym}</span>
                                            <input type="number" name="price" id="price" value={product.price} onChange={handleChange} required min="0.01" step="0.01" placeholder="0.00"
                                                className="w-full pl-9 pr-4 py-4 text-2xl font-bold tabular-nums rounded-xl border border-brand-border bg-white dark:bg-slate-800 text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                                        </div>
                                        {(product.price > 0 && product.costPrice !== undefined) && (
                                            <div className="flex justify-between items-center bg-success-muted/60 dark:bg-primary/10 mt-2 p-3 rounded-xl">
                                                <span className="text-[12px] font-semibold text-brand-text-muted">Est. Profit Margin</span>
                                                <span className={`text-sm font-extrabold tabular-nums ${profitMargin >= 0 ? 'text-primary' : 'text-danger'}`}>{profitMargin.toFixed(1)}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {(product.price > 0 && product.costPrice !== undefined) && (
                                    <div className="p-3.5 rounded-2xl bg-warm-100 dark:bg-slate-800/50 border border-brand-border">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs text-brand-text-muted">Estimated Profit</span>
                                            <span className={`text-sm font-bold tabular-nums ${profitAmount >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(profitAmount, storeSettings)}</span>
                                        </div>
                                        <div className="w-full bg-brand-border rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-full transition-all duration-500 ${profitMargin >= 30 ? 'bg-primary' : profitMargin >= 10 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${Math.max(0, Math.min(100, profitMargin))}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ── Inventory ── */}
                        <section className={cardCls}>
                            <h2 className={sectionTitleCls}>Inventory</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className={`transition-all duration-300 ${cartonMode ? 'opacity-80' : ''}`}>
                                    <label htmlFor="stock" className={`${labelCls} flex items-center justify-between`}>
                                        <span>Stock *</span>
                                        {cartonMode && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-success-muted text-primary">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                Auto-sync
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <input type="number" name="stock" id="stock" value={product.stock} onChange={handleChange} required min="0" readOnly={cartonMode} step={product.unitOfMeasure === 'kg' ? '0.001' : '1'}
                                            className={`${fieldCls} ${cartonMode ? '!bg-warm-100/70 dark:!bg-slate-800/40 !border-primary/40 text-brand-text-muted cursor-not-allowed' : ''}`} />
                                        {cartonMode && <div className="absolute inset-0 z-10 cursor-not-allowed" title="Update Cartons Received to change stock" />}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="reorderPoint" className={labelCls}>Reorder Point</label>
                                    <input type="number" name="reorderPoint" id="reorderPoint" value={product.reorderPoint || ''} onChange={handleChange} min="0" step="1" placeholder={`${storeSettings.lowStockThreshold}`} className={fieldCls} />
                                </div>
                                <div>
                                    <label htmlFor="safetyStock" className={labelCls}>Safety Stock</label>
                                    <input type="number" name="safetyStock" id="safetyStock" value={product.safetyStock || ''} onChange={handleChange} min="0" step="1" className={fieldCls} />
                                </div>
                                <div>
                                    <label htmlFor="weight" className={labelCls}>Weight (kg)</label>
                                    <input type="number" name="weight" id="weight" value={product.weight || ''} onChange={handleChange} min="0" step="0.001" className={fieldCls} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="dimensions" className={labelCls}>Dimensions</label>
                                    <input type="text" name="dimensions" id="dimensions" value={product.dimensions || ''} onChange={handleChange} placeholder="10 x 20 x 5 cm" className={fieldCls} />
                                </div>
                            </div>
                        </section>

                        {/* ── Images ── */}
                        <section className={cardCls}>
                            <h2 className={sectionTitleCls}>Gallery</h2>
                            <div className="flex gap-2 mb-4">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-brand-border hover:border-primary bg-warm-100 dark:bg-slate-800 text-brand-text-muted hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-semibold">
                                    <ArrowUpTrayIcon className="w-5 h-5" />
                                    Upload Image
                                </button>
                                <button type="button" onClick={() => setIsCameraModalOpen(true)} className="py-3 px-4 rounded-xl border-2 border-dashed border-brand-border hover:border-primary bg-warm-100 dark:bg-slate-800 text-brand-text-muted hover:text-primary transition-colors">
                                    <CameraIcon className="w-5 h-5" />
                                </button>
                            </div>
                            {images.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {images.map((url, index) => (
                                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-brand-border">
                                            <img src={url.startsWith('data:') ? url : buildAssetUrl(url)} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeImage(index)} className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <XMarkIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-brand-text-muted text-sm">No images uploaded</div>
                            )}
                        </section>
                    </div>

                    {/* ── Bottom action bar ── */}
                    <div className="flex-none border-t border-brand-border bg-surface/80 dark:bg-slate-900/70 backdrop-blur-xl px-4 sm:px-6 py-3 safe-area-bottom">
                        <div className="max-w-4xl mx-auto flex gap-3">
                            <button type="button" onClick={onCancel} disabled={isSaving} className="flex-1 py-3.5 rounded-xl border border-brand-border text-brand-text font-bold text-sm hover:bg-warm-100 dark:hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSaving} className="flex-[2] py-3.5 rounded-xl bg-secondary hover:bg-[#e86d12] text-white font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSaving ? 'Saving…' : (productToEdit.id ? 'Save Changes' : 'Save Product')}
                            </button>
                        </div>
                    </div>

                    {/* Hidden file input */}
                    <input ref={fileInputRef} type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
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
