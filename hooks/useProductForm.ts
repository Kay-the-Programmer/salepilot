import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Category, StoreSettings, CustomAttribute } from '../types';
import { generateDescription as fetchAIDescription } from '../services/geminiService';
import { api } from '../services/api';

interface UseProductFormProps {
    productToEdit?: Product | null;
    initialValues?: Partial<Omit<Product, 'id'>>;
    categories: Category[];
    storeSettings: StoreSettings;
    onSaveSuccess?: () => void;
}

export const useProductForm = ({
    productToEdit,
    initialValues,
    categories,
    storeSettings,
    onSaveSuccess
}: UseProductFormProps) => {
    const getInitialProductState = useCallback((): Omit<Product, 'id'> => ({
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
    }), [storeSettings.skuPrefix]);

    const [product, setProduct] = useState<Omit<Product, 'id'>>(getInitialProductState());
    const [images, setImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Pre-calculate profit margin
    const profitMargin = useMemo(() => {
        const price = parseFloat(product.price.toString());
        const cost = parseFloat(product.costPrice?.toString() || '0');
        if (price > 0) {
            return ((price - cost) / price) * 100;
        }
        return 0;
    }, [product.price, product.costPrice]);

    const profitAmount = useMemo(() => {
        const price = parseFloat(product.price.toString());
        const cost = parseFloat(product.costPrice?.toString() || '0');
        return price - cost;
    }, [product.price, product.costPrice]);

    useEffect(() => {
        if (productToEdit) {
            setProduct({ ...getInitialProductState(), ...productToEdit });
            setImages(productToEdit.imageUrls || []);
        } else if (initialValues) {
            setProduct({ ...getInitialProductState(), ...initialValues });
            setImages(initialValues.imageUrls || []);
        } else {
            setProduct(getInitialProductState());
            setImages([]);
        }
        setImageFiles([]);
        setImagesToDelete([]);
        setError('');
        setIsSaving(false);
    }, [productToEdit, initialValues, getInitialProductState]);

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

    const handleGenerateDescription = async () => {
        const categoryName = categories.find(c => c.id === product.categoryId)?.name || '';
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

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newFiles = Array.from(files);
            setError('');

            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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

            // Support multiple images (up to 5)
            setImageFiles(prev => [...prev, ...validFiles].slice(0, 5));

            validFiles.slice(0, 5).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        setImages(prev => [...prev, reader.result as string].slice(0, 5));
                    }
                };
                reader.readAsDataURL(file);
            });

            event.target.value = '';
        }
    };

    const removeImage = (indexToRemove: number) => {
        const imageToRemove = images[indexToRemove];
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));

        if (imageToRemove.startsWith('data:')) {
            // Find which file this was
            // This is a bit tricky if multiple files uploaded at once, 
            // but usually we can match by index if we manage both together
            setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        } else if (productToEdit && productToEdit.imageUrls) {
            if (productToEdit.imageUrls.includes(imageToRemove)) {
                setImagesToDelete(prev => [...prev, imageToRemove]);
            }
        }
    };

    const handleCameraCapture = (imageDataUrl: string) => {
        setImages(prev => [...prev, imageDataUrl].slice(0, 5));

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

        setImageFiles(prev => [...prev, file].slice(0, 5));
    };

    const validate = () => {
        const priceNum = parseFloat(product.price.toString());
        if (!product.name) return "Product Name is required.";
        if (!product.categoryId) return "Category is required.";
        if (priceNum <= 0) return "Price must be greater than zero.";
        return null;
    };

    const prepareFormData = () => {
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

        const _dataUrlImages = images.filter(url => url.startsWith('data:'));
        const imagesToKeep = productToEdit
            ? productToEdit.imageUrls.filter(url => !imagesToDelete.includes(url))
            : [];

        formData.append('existing_images', JSON.stringify(imagesToKeep));

        if (imagesToDelete.length > 0) {
            formData.append('images_to_delete', JSON.stringify(imagesToDelete));
        }

        // Add new image files
        imageFiles.forEach((file, _i) => {
            formData.append('images', file);
        });

        return formData;
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

    return {
        product,
        setProduct,
        images,
        imageFiles,
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
    };
};
