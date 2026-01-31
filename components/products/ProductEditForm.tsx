import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Category, CustomAttribute, Supplier, StoreSettings } from '../../types';
import { generateDescription as fetchAIDescription } from '../../services/geminiService';
import { api, buildAssetUrl } from '../../services/api';
import SparklesIcon from '../icons/SparklesIcon';
import XMarkIcon from '../icons/XMarkIcon';
import CameraIcon from '../icons/CameraIcon';
import CameraCaptureModal from '../CameraCaptureModal';
import ArrowUpTrayIcon from '../icons/ArrowUpTrayIcon';
import SupplierFormModal from '../suppliers/SupplierFormModal';
import UnifiedScannerModal from '../UnifiedScannerModal';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';


interface ProductEditFormProps {
    product: Product;
    categories: Category[];
    suppliers: Supplier[];
    storeSettings: StoreSettings;
    onSave: (product: Product | Omit<Product, 'id'>) => Promise<void>;
    onCancel: () => void;
    onAddCategory?: () => void;
}

const ProductEditForm: React.FC<ProductEditFormProps> = ({
    product: productToEdit,
    categories,
    suppliers,
    storeSettings,
    onSave,
    onCancel,
    onAddCategory
}) => {
    const getInitialProductState = (): Omit<Product, 'id'> => ({
        name: '',
        description: '',
        sku: `${storeSettings.skuPrefix}${Math.floor(10000 + Math.random() * 90000)}`,
        categoryId: undefined,
        price: 0,
        stock: 0,
        imageUrls: [],
        status: 'active',
        barcode: '',
        costPrice: 0,
        supplierId: undefined,
        brand: '',
        reorderPoint: 0,
        safetyStock: 0,
        weight: 0,
        dimensions: '',
        variants: [],
        customAttributes: {},
        unitOfMeasure: 'unit',
    });

    const [product, setProduct] = useState<Omit<Product, 'id'>>({ ...getInitialProductState(), ...productToEdit });
    const [images, setImages] = useState<string[]>(productToEdit.imageUrls || []);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
    const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliers);
    const [activeSection, setActiveSection] = useState<string>('details');

    useEffect(() => {
        setLocalSuppliers(suppliers);
    }, [suppliers]);

    useEffect(() => {
        setProduct({ ...getInitialProductState(), ...productToEdit });
        setImages(productToEdit.imageUrls || []);
        setImageFiles([]);
        setImagesToDelete([]);
        setError('');
        setIsSaving(false);
        setActiveSection('details');
    }, [productToEdit.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['reorderPoint', 'safetyStock'];
        const decimalFields = ['stock', 'weight'];
        const stringNumericFields = ['price', 'costPrice'];

        if (name.startsWith('custom_')) {
            const attributeId = name.slice(7);
            setProduct(prev => ({
                ...prev,
                customAttributes: {
                    ...prev.customAttributes,
                    [attributeId]: value
                }
            }));
        } else {
            if (numericFields.includes(name)) {
                setProduct(prev => ({ ...prev, [name]: value === '' ? 0 : parseInt(value) }));
            } else if (decimalFields.includes(name)) {
                setProduct(prev => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) }));
            } else if (stringNumericFields.includes(name)) {
                setProduct(prev => ({ ...prev, [name]: value }));
            } else if (name === 'categoryId' || name === 'supplierId') {
                setProduct(prev => ({ ...prev, [name]: value === '' ? undefined : value }));
            } else {
                setProduct(prev => ({ ...prev, [name]: value }));
            }
        }
    };

    const categoryName = useMemo(() => {
        return categories.find(c => c.id === product.categoryId)?.name || '';
    }, [product.categoryId, categories]);

    const handleGenerateDescription = async () => {
        if (!product.name || !product.categoryId) {
            setError('Please enter a Product Name and select a Category to generate a description.');
            return;
        }
        setError('');
        setIsGenerating(true);
        try {
            const description = await fetchAIDescription(product.name, categoryName);
            setProduct(prev => ({ ...prev, description }));
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateBarcode = () => {
        setProduct(prev => ({ ...prev, barcode: prev.sku }));
    };

    const handleLookup = async (barcodeToUse?: string) => {
        const code = barcodeToUse || product.barcode;
        if (!code) {
            if (!barcodeToUse) setError("Please enter a barcode to lookup.");
            return;
        }

        setIsGenerating(true);
        try {
            const data = await api.get<any>(`/products/external-lookup/${code}`);
            if (data) {
                setProduct(prev => ({
                    ...prev,
                    barcode: code,
                    name: prev.name || data.name,
                    description: prev.description || data.description,
                    brand: prev.brand || data.brand,
                    weight: (prev.weight === 0 && data.weight) ? data.weight : prev.weight,
                    unitOfMeasure: (prev.unitOfMeasure === 'unit' && data.unitOfMeasure) ? data.unitOfMeasure : prev.unitOfMeasure,
                }));

                if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
                    setImages(prev => {
                        const existing = new Set(prev);
                        const newImgs = data.imageUrls.filter((url: string) => !existing.has(url));
                        return [...prev, ...newImgs];
                    });
                }
                setError('');
            }
        } catch (err: any) {
            console.error("Lookup failed", err);
            if (!barcodeToUse) {
                setError('Product not found in database');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        const priceNum = parseFloat(product.price.toString());
        if (!product.name || !product.categoryId || priceNum <= 0) {
            setError("Please fill in all required fields: Name, Category, and Price.");
            return;
        }
        setError('');
        setIsSaving(true);

        try {
            const formData = new FormData();
            formData.append('name', product.name);
            formData.append('description', product.description);
            formData.append('sku', product.sku);
            formData.append('barcode', product.barcode || '');
            formData.append('category_id', product.categoryId || '');
            formData.append('supplier_id', product.supplierId || '');
            formData.append('price', product.price.toString());
            formData.append('cost_price', product.costPrice?.toString() || '');
            formData.append('stock', product.stock.toString());
            formData.append('unit_of_measure', (product.unitOfMeasure || 'unit'));
            formData.append('brand', product.brand || '');
            formData.append('status', product.status);
            formData.append('reorder_point', product.reorderPoint?.toString() || '');
            formData.append('safety_stock', product.safetyStock?.toString() || '');
            formData.append('weight', product.weight?.toString() || '');
            formData.append('dimensions', product.dimensions || '');
            formData.append('variants', JSON.stringify(product.variants || []));
            formData.append('custom_attributes', JSON.stringify(product.customAttributes || {}));

            const dataUrlImages = images.filter(url => url.startsWith('data:'));

            const imagesToKeep = productToEdit.imageUrls.filter(url =>
                !imagesToDelete.includes(url) && !url.startsWith('data:'));
            formData.append('existing_images', JSON.stringify(imagesToKeep));

            if (imagesToDelete.length > 0) {
                formData.append('images_to_delete', JSON.stringify(imagesToDelete));
            }

            for (let i = 0; i < dataUrlImages.length; i++) {
                const dataUrl = dataUrlImages[i];
                const byteString = atob(dataUrl.split(',')[1]);
                const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);

                for (let j = 0; j < byteString.length; j++) {
                    ia[j] = byteString.charCodeAt(j);
                }

                const blob = new Blob([ab], { type: mimeString });
                const fileName = `data-url-image-${Date.now()}-${i}.${mimeString.split('/')[1]}`;
                const file = new File([blob], fileName, { type: mimeString });

                formData.append('images', file);
            }

            const result = await api.putFormData<Product>(`/products/${productToEdit.id}`, formData);

            if ((result as any)?.offline) {
                const payload = { ...productToEdit, ...product } as Product;
                await onSave(payload);
            } else {
                await onSave(result as Product);
            }

            setImageFiles([]);
            setImagesToDelete([]);
        } catch (error: any) {
            console.error('Save failed', error);
            setError(error.message || 'Failed to save product');
        } finally {
            setIsSaving(false);
        }
    };

    const relevantAttributes = useMemo(() => {
        if (!product.categoryId) return [];

        const allAttributes = new Map<string, CustomAttribute>();
        let currentId: string | null | undefined = product.categoryId;

        while (currentId) {
            const category = categories.find(c => c.id === currentId);
            if (category) {
                category.attributes.forEach(attr => {
                    if (!allAttributes.has(attr.id)) {
                        allAttributes.set(attr.id, attr);
                    }
                });
                currentId = category.parentId;
            } else {
                currentId = null;
            }
        }
        return Array.from(allAttributes.values());
    }, [product.categoryId, categories]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newFiles = Array.from(files);
            setError('');

            const MAX_FILE_SIZE = 5 * 1024 * 1024;
            const validFiles = newFiles.filter(file => {
                if (!file.type.startsWith('image/')) {
                    setError('Please select only image files');
                    return false;
                }
                if (file.size > MAX_FILE_SIZE) {
                    setError(`Image ${file.name} is too large. Maximum size is 5MB`);
                    return false;
                }
                return true;
            });

            if (validFiles.length === 0) {
                event.target.value = '';
                return;
            }

            setImageFiles(validFiles.slice(0, 1));
            setImages([]);
            setImagesToDelete(productToEdit?.imageUrls || []);

            const file = validFiles[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setImages([reader.result as string]);
                }
            };
            reader.onerror = () => {
                setError(`Failed to read file: ${file.name}`);
            };
            reader.readAsDataURL(file);

            event.target.value = '';
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));

        if (indexToRemove < imageFiles.length) {
            setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        } else if (productToEdit && productToEdit.imageUrls) {
            const imageToRemove = productToEdit.imageUrls[indexToRemove - imageFiles.length];
            if (imageToRemove) {
                setImagesToDelete(prev => [...prev, imageToRemove]);
            }
        }
    };

    const handleCameraCapture = (imageDataUrl: string) => {
        setImages([imageDataUrl]);
        setImagesToDelete(productToEdit?.imageUrls || []);

        const byteString = atob(imageDataUrl.split(',')[1]);
        const mimeString = imageDataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: mimeString });
        const fileName = `camera-capture-${Date.now()}.${mimeString.split('/')[1]}`;
        const file = new File([blob], fileName, { type: mimeString });

        setImageFiles([file]);
        setIsCameraModalOpen(false);
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
                    <div className="space-y-4">
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
                                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold"
                                    >
                                        +
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
                                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold"
                                >
                                    +
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
                                    className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 text-xs font-medium"
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
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Retail Price {product.unitOfMeasure === 'kg' ? '(per kg)' : ''} *
                            </label>
                            <input
                                type="number"
                                name="price"
                                id="price"
                                value={product.price}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="0.01"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="costPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost Price</label>
                            <input
                                type="number"
                                name="costPrice"
                                id="costPrice"
                                value={product.costPrice || ''}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
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
                                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    📷
                                </button>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={handleGenerateBarcode}
                                    className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                                >
                                    Generate from SKU
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleLookup()}
                                    disabled={isGenerating}
                                    className="flex-1 py-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-sm disabled:opacity-50"
                                >
                                    {isGenerating ? 'Searching...' : 'Lookup Info'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="stock" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock</label>
                                <input
                                    type="number"
                                    name="stock"
                                    id="stock"
                                    value={product.stock}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step={product.unitOfMeasure === 'kg' ? "0.001" : "1"}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
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
            <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors md:hidden"
                            aria-label="Go back"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                                {productToEdit.id ? 'Edit Product' : 'Add New Product'}
                            </h1>
                            {productToEdit.id && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-xs">
                                    {productToEdit.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 transition-colors hidden sm:block"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : (productToEdit.id ? 'Save Changes' : 'Create Product')}
                        </button>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar bg-white dark:bg-slate-900">
                    <div className="flex px-4 sm:px-6">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => setActiveSection(section.id)}
                                className={`flex-shrink-0 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeSection === section.id
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {renderSectionContent()}
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
