export interface ScannedProductData {
    name?: string;
    description?: string;
    imageUrls?: string[];
    brand?: string;
    categories?: string[];
    weight?: number;
    unitOfMeasure?: 'unit' | 'kg';
    source?: string;
}

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

const lookupOpenFoodFacts = async (barcode: string): Promise<ScannedProductData | null> => {
    try {
        const response = await fetchWithTimeout(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        if (!response.ok) return null;

        const data = await response.json();
        if (data.status === 1 && data.product) {
            const product = data.product;
            const imageUrls: string[] = [];
            if (product.image_url) imageUrls.push(product.image_url);
            if (product.image_front_url && !imageUrls.includes(product.image_front_url)) imageUrls.push(product.image_front_url);

            let weight = 0;
            let unitOfMeasure: 'unit' | 'kg' = 'unit';

            if (product.product_quantity && !isNaN(parseFloat(product.product_quantity))) {
                if (product.quantity && product.quantity.toLowerCase().includes('kg')) {
                    weight = parseFloat(product.product_quantity);
                    unitOfMeasure = 'kg';
                } else if (product.quantity && product.quantity.toLowerCase().includes('g')) {
                    weight = parseFloat(product.product_quantity) / 1000;
                    if (weight > 0) unitOfMeasure = 'kg';
                }
            }

            return {
                name: product.product_name || product.product_name_en,
                description: product.generic_name || product.generic_name_en,
                imageUrls,
                brand: product.brands,
                categories: product.categories_tags,
                weight: weight > 0 ? weight : undefined,
                unitOfMeasure,
                source: 'OpenFoodFacts'
            };
        }
    } catch (e) {
        console.error('OpenFoodFacts lookup failed:', e);
    }
    return null;
};

const lookupUPCItemDB = async (barcode: string): Promise<ScannedProductData | null> => {
    try {
        // Trial endpoint
        const response = await fetchWithTimeout(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
        if (!response.ok) return null;

        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
                name: item.title,
                description: item.description,
                imageUrls: item.images || [],
                brand: item.brand,
                categories: item.category ? [item.category] : [],
                source: 'UPCItemDB'
            };
        }
    } catch (e) {
        console.error('UPCItemDB lookup failed:', e);
    }
    return null;
};

const lookupGoogleBooks = async (barcode: string): Promise<ScannedProductData | null> => {
    // Basic ISBN check (10 or 13 digits)
    if (!/^\d{10}(\d{3})?$/.test(barcode)) return null;

    try {
        const response = await fetchWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=isbn:${barcode}`);
        if (!response.ok) return null;

        const data = await response.json();
        if (data.totalItems > 0 && data.items && data.items.length > 0) {
            const volumeInfo = data.items[0].volumeInfo;
            const imageUrls: string[] = [];
            if (volumeInfo.imageLinks) {
                if (volumeInfo.imageLinks.thumbnail) imageUrls.push(volumeInfo.imageLinks.thumbnail);
                if (volumeInfo.imageLinks.smallThumbnail) imageUrls.push(volumeInfo.imageLinks.smallThumbnail);
            }

            return {
                name: volumeInfo.title + (volumeInfo.authors ? ` by ${volumeInfo.authors.join(', ')}` : ''),
                description: volumeInfo.description,
                imageUrls,
                categories: volumeInfo.categories || [],
                source: 'Google Books'
            };
        }
    } catch (e) {
        console.error('Google Books lookup failed:', e);
    }
    return null;
};

export const barcodeService = {
    /**
     * Look up a product by barcode using multiple providers
     * @param barcode The barcode to look up
     * @returns Parsed product data or null if not found
     */
    lookupProduct: async (barcode: string): Promise<ScannedProductData | null> => {
        // 1. Try Google Books if it looks like an ISBN
        if (/^(978|979)\d{10}$|^\d{10}$/.test(barcode)) {
            const bookData = await lookupGoogleBooks(barcode);
            if (bookData) return bookData;
        }

        // 2. Try OpenFoodFacts (good for grocery)
        const foodData = await lookupOpenFoodFacts(barcode);
        if (foodData) return foodData;

        // 3. Try UPCItemDB (good for general retail)
        const retailData = await lookupUPCItemDB(barcode);
        if (retailData) return retailData;

        return null;
    }
};
