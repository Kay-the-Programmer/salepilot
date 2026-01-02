import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Category, CustomAttribute, Supplier, StoreSettings } from '../types';
import { generateDescription as fetchAIDescription } from '../services/geminiService';
import { api, buildAssetUrl } from '../services/api';
import SparklesIcon from './icons/SparklesIcon';
import XMarkIcon from './icons/XMarkIcon';
import CameraIcon from './icons/CameraIcon';
import CameraCaptureModal from './CameraCaptureModal';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import { toSnakeCase } from "@/utils/helpers.ts";
import SupplierFormModal from './suppliers/SupplierFormModal';
import BarcodeScannerModal from './BarcodeScannerModal';



interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product | Omit<Product, 'id'>) => Promise<void>;
    productToEdit?: Product | null;
    categories: Category[];
    suppliers: Supplier[];
    storeSettings: StoreSettings;
    onAddCategory?: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, productToEdit, categories, suppliers, storeSettings, onAddCategory }) => {

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

    const [product, setProduct] = useState<Omit<Product, 'id'>>(getInitialProductState());
    const [images, setImages] = useState<string[]>([]);
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


    useEffect(() => {
        setLocalSuppliers(suppliers);
    }, [suppliers]);


    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setProduct({ ...getInitialProductState(), ...productToEdit });
                setImages(productToEdit.imageUrls || []);
            } else {
                setProduct(getInitialProductState());
                setImages([]);
            }
            // Reset file-related states
            setImageFiles([]);
            setImagesToDelete([]);
            setError('');
            setIsSaving(false);
        }
    }, [productToEdit, isOpen, storeSettings]);

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
                // Handle select fields properly - empty string should become null
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

    // Add these functions to handle file operations
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImageFiles(prev => [...prev, ...files]);
    };

    const removeSelectedFile = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const markImageForDeletion = (imageUrl: string) => {
        setImagesToDelete(prev => [...prev, imageUrl]);
        setImages(prev => prev.filter(url => url !== imageUrl));
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
            console.log('Submitting product:', product);
            console.log('Image files:', imageFiles);
            console.log('Images to delete:', imagesToDelete);
            console.log('Current images:', images);

            // Create FormData for file upload
            const formData = new FormData();

            // Add product data - convert camelCase to snake_case for backend
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

            // Process existing images - separate data URLs from server images
            const dataUrlImages = images.filter(url => url.startsWith('data:'));
            const serverImages = images.filter(url => !url.startsWith('data:'));

            // Add existing server images (those we want to keep)
            const imagesToKeep = productToEdit
                ? productToEdit.imageUrls.filter(url =>
                    !imagesToDelete.includes(url) && !url.startsWith('data:'))
                : [];
            formData.append('existing_images', JSON.stringify(imagesToKeep));

            // Add images to delete
            if (imagesToDelete.length > 0) {
                formData.append('images_to_delete', JSON.stringify(imagesToDelete));
            }

            // Convert data URLs to File objects and add them
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

            // Add new image files
            // imageFiles.forEach(file => {
            //     formData.append('images', file);
            // });

            // Log FormData contents for debugging
            console.log('FormData contents:', formData);
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            // Use the appropriate API method
            let result;
            if (productToEdit) {
                result = await api.putFormData<Product>(`/products/${productToEdit.id}`, formData);
            } else {
                result = await api.postFormData<Product>('/products', formData);
            }

            console.log('Save result:', result);
            if ((result as any)?.offline) {
                // When offline, propagate the original product data so the app can optimistically update UI
                const payload = productToEdit ? ({ ...productToEdit, ...product } as Product) : product;
                await onSave(payload);
            } else {
                await onSave(result as Product);
            }

            // Reset form state
            setImageFiles([]);
            setImagesToDelete([]);

        } catch (error: any) {
            console.error('Save failed in modal', error);
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
            // Store the actual File objects
            const newFiles = Array.from(files);
            setImageFiles(prev => [...prev, ...newFiles]);

            // Create preview URLs for display
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        setImages(prev => [...prev, reader.result as string]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (indexToRemove: number) => {
        // Remove from preview images
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));

        // If it's a newly added image (has a corresponding File object)
        if (indexToRemove < imageFiles.length) {
            setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        }
        // If it's an existing image from the server (for product edit)
        else if (productToEdit && productToEdit.imageUrls) {
            const imageToRemove = productToEdit.imageUrls[indexToRemove - imageFiles.length];
            if (imageToRemove) {
                setImagesToDelete(prev => [...prev, imageToRemove]);
            }
        }
    };

    const handleCameraCapture = (imageDataUrl: string) => {
        // Add to preview images
        setImages(prev => [...prev, imageDataUrl]);

        // Convert data URL to File object
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

        // Add to image files
        setImageFiles(prev => [...prev, file]);

        setIsCameraModalOpen(false);
    };

    const handleBarcodeScan = (code: string) => {
        setProduct(prev => ({ ...prev, barcode: code }));
        setIsBarcodeScannerOpen(false);
    };

    const handleCreateSupplier = async (newSupplier: Supplier) => {
        try {
            // Optimistic update or API call? Usually API call to get real ID if not provided.
            // But SupplierFormModal generates an ID if needed.
            // Let's assume we need to persist it now.

            // Map frontend model to backend fields if necessary (SupplierFormModal seems to use camelCase internally, backend needs snake_case?)
            // Looking at SupplierFormModal it returns a Supplier object.
            // Let's use api.post to save it.

            // NOTE: We need to convert camelCase Supplier to snake_case payload if backend expects it.
            // Assuming api.post handles it or we send as is. 
            // Based on previous code, ProductFormModal manually converts to FormData. 
            // Let's try sending JSON.

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
                store_id: storeSettings.storeId // Assuming storeSettings has storeId or similar context if needed. Warning: Check StoreSettings type.
            };

            // Check StoreSettings type in next step if needed, but for now we'll rely on backend likely inferring store_id or it being optional/handled.
            // Actually, let's just send what we have.

            const savedSupplier = await api.post<Supplier>('/suppliers', payload);

            setLocalSuppliers(prev => [...prev, savedSupplier || newSupplier]); // Fallback to newSupplier logic if offline
            setProduct(prev => ({ ...prev, supplierId: (savedSupplier || newSupplier).id }));
            setIsSupplierModalOpen(false);
        } catch (err: any) {
            console.error("Failed to create supplier:", err);
            // Optionally show error in Product modal or alert
            alert("Failed to create supplier: " + err.message);
        }
    };




    if (!isOpen) return null;

    const renderSectionTitle = (title: string) => <h4 className="text-md font-semibold text-gray-800 mt-6 mb-2 border-b pb-1">{title}</h4>;

    return (
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl w-full m-4">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[95vh]">
                        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                {productToEdit ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="px-4 sm:px-6 py-4 flex-grow overflow-y-auto">
                            {error && <div className="rounded-md bg-red-50 p-4 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

                            {renderSectionTitle('Product Details')}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name *</label>
                                    <input type="text" name="name" id="name" value={product.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category *</label>
                                    <div className="flex gap-2">
                                        <select name="categoryId" id="categoryId" value={product.categoryId || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
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
                                            className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            title="Add New Category"
                                        >
                                            <span className="text-lg font-bold text-blue-600">+</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {relevantAttributes.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {relevantAttributes.map(attr => (
                                        <div key={attr.id}>
                                            <label htmlFor={`custom_${attr.id}`} className="block text-sm font-medium text-gray-700">{attr.name}</label>
                                            <input
                                                type="text"
                                                name={`custom_${attr.id}`}
                                                id={`custom_${attr.id}`}
                                                value={product.customAttributes?.[attr.id] || ''}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand</label>
                                    <input type="text" name="brand" id="brand" value={product.brand || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Supplier</label>
                                    <div className="flex gap-2">
                                        <select name="supplierId" id="supplierId" value={product.supplierId || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                            <option value="">No Supplier</option>
                                            {localSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setIsSupplierModalOpen(true)}
                                            className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            title="Add New Supplier"
                                        >
                                            <span className="text-lg font-bold text-blue-600">+</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                <div className="mt-1 relative">
                                    <textarea name="description" id="description" rows={3} value={product.description} onChange={handleChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-28" />
                                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating || !product.name || !product.categoryId} className="absolute top-2 right-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isGenerating ? 'Generating...' : <> <SparklesIcon className="w-4 h-4 mr-1.5" /> Generate </>}
                                    </button>
                                </div>
                            </div>

                            {renderSectionTitle('Pricing')}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Retail Price {product.unitOfMeasure === 'kg' ? '(per kg)' : ''} *</label>
                                    <input type="number" name="price" id="price" value={product.price} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    {product.unitOfMeasure === 'kg' && (
                                        <p className="mt-1 text-xs text-gray-500">Enter the price for each kilogram (kg). The POS will multiply by the weight sold.</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700">Cost Price</label>
                                    <input type="number" name="costPrice" id="costPrice" value={product.costPrice || ''} onChange={handleChange} min="0" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                            </div>

                            {renderSectionTitle('Inventory & Shipping')}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label>
                                    <input type="text" name="sku" id="sku" value={product.sku} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">Barcode (UPC, EAN, etc.)</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <input type="text" name="barcode" id="barcode" value={product.barcode || ''} onChange={handleChange} className="flex-1 min-w-0 block border border-gray-300 w-full px-3 py-2 rounded-none rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm " />
                                        <button type="button" onClick={() => setIsBarcodeScannerOpen(true)} className="-ml-px relative inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 text-sm font-medium bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" title="Scan Barcode">
                                            <span role="img" aria-label="scan">📷</span>
                                        </button>
                                        <button type="button" onClick={handleGenerateBarcode} className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                            <span>Generate</span>
                                        </button>
                                    </div>
                                </div>

                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock Quantity{product.unitOfMeasure === 'kg' ? ' (kg)' : ''} *</label>
                                    <input type="number" name="stock" id="stock" value={product.stock} onChange={handleChange} required min="0" step={product.unitOfMeasure === 'kg' ? "0.001" : "1"} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700">Unit of Measure</label>
                                    <select name="unitOfMeasure" id="unitOfMeasure" value={product.unitOfMeasure || 'unit'} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        <option value="unit">Unit</option>
                                        <option value="kg">Kilogram (kg)</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-700">Reorder Point</label>
                                    <input type="number" name="reorderPoint" id="reorderPoint" value={product.reorderPoint || ''} onChange={handleChange} min="0" step="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder={`Default: ${storeSettings.lowStockThreshold}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label htmlFor="safetyStock" className="block text-sm font-medium text-gray-700">Safety Stock Level</label>
                                    <input type="number" name="safetyStock" id="safetyStock" value={product.safetyStock || ''} onChange={handleChange} min="0" step="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                    <input type="number" name="weight" id="weight" value={product.weight || ''} onChange={handleChange} min="0" step="0.001" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700">Dimensions</label>
                                    <input type="text" name="dimensions" id="dimensions" value={product.dimensions || ''} onChange={handleChange} placeholder="e.g., 10 x 20 x 5 cm" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                            </div>

                            {renderSectionTitle('Variants')}
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">Add product variants (e.g., sizes or colors). Each variant should have a unique SKU, price, and stock.</p>
                                {(product.variants || []).map((v, idx) => (
                                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Name/Label</label>
                                            <input
                                                type="text"
                                                value={v.name || ''}
                                                onChange={(e) => setProduct(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, name: e.target.value } : vv) || []
                                                }))}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">SKU</label>
                                            <input
                                                type="text"
                                                value={v.sku}
                                                onChange={(e) => setProduct(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, sku: e.target.value } : vv) || []
                                                }))}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Price</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={v.price}
                                                onChange={(e) => setProduct(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, price: parseFloat(e.target.value || '0') } : vv) || []
                                                }))}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Stock</label>
                                            <input
                                                type="number"
                                                step={v.unitOfMeasure === 'kg' ? '0.001' : '1'}
                                                min="0"
                                                value={v.stock}
                                                onChange={(e) => setProduct(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, stock: parseFloat(e.target.value || '0') } : vv) || []
                                                }))}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">UoM</label>
                                            <select
                                                value={v.unitOfMeasure || 'unit'}
                                                onChange={(e) => setProduct(prev => ({
                                                    ...prev,
                                                    variants: prev.variants?.map((vv, i) => i === idx ? { ...vv, unitOfMeasure: e.target.value as any } : vv) || []
                                                }))}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                <option value="unit">Unit</option>
                                                <option value="kg">kg</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setProduct(prev => ({ ...prev, variants: (prev.variants || []).filter((_, i) => i !== idx) }))} className="px-3 py-2 rounded-md border text-sm bg-white">Remove</button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setProduct(prev => ({
                                        ...prev,
                                        variants: [...(prev.variants || []), { name: '', sku: `${product.sku}-${(prev.variants?.length || 0) + 1}`, price: product.price, stock: 0, unitOfMeasure: product.unitOfMeasure }]
                                    }))}
                                    className="mt-2 inline-flex items-center px-3 py-1.5 rounded-md border text-sm bg-white"
                                >
                                    Add Variant
                                </button>
                            </div>


                            {renderSectionTitle('Images')}
                            <div>
                                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {images.map((imgSrc, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <img src={buildAssetUrl(imgSrc)} alt={`Product image ${index + 1}`} className="w-full h-full object-cover rounded-md shadow-sm border border-gray-200" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                                aria-label="Remove image"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex flex-col gap-2 aspect-square border-2 border-dashed border-gray-300 rounded-md items-center justify-center p-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full text-xs inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-2 py-1.5 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                        >
                                            <ArrowUpTrayIcon className="w-4 h-4 text-gray-500" /> Upload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsCameraModalOpen(true)}
                                            className="w-full text-xs inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-2 py-1.5 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                        >
                                            <CameraIcon className="w-4 h-4 text-gray-500" /> Camera
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                />
                                <p className="text-xs text-gray-500 mt-2">The first image will be the primary display image.</p>
                            </div>

                            {renderSectionTitle('Status')}
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Product Status</label>
                                <select id="status" name="status" value={product.status} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                            <button type="submit" disabled={isSaving} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-400 disabled:cursor-not-allowed">
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : 'Save Product'}
                            </button>
                            <button type="button" onClick={onClose} disabled={isSaving} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:bg-gray-200">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
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
            <BarcodeScannerModal
                isOpen={isBarcodeScannerOpen}
                onClose={() => setIsBarcodeScannerOpen(false)}
                onScanSuccess={handleBarcodeScan}
            />


        </>
    );
};

export default ProductFormModal;
