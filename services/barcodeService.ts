interface ScannedProductData {
    name?: string;
    description?: string;
    imageUrls?: string[];
    brand?: string;
    categories?: string[];
    weight?: number;
    unitOfMeasure?: 'unit' | 'kg';
}

export const barcodeService = {
    /**
     * Look up a product by barcode using OpenFoodFacts API
     * @param barcode The barcode to look up
     * @returns Parsed product data or null if not found
     */
    lookupProduct: async (barcode: string): Promise<ScannedProductData | null> => {
        try {
            // Using Open Food Facts API (free, no key required)
            const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            if (data.status === 1 && data.product) {
                const product = data.product;

                // Extract best available image
                const imageUrls: string[] = [];
                if (product.image_url) imageUrls.push(product.image_url);
                if (product.image_front_url && !imageUrls.includes(product.image_front_url)) imageUrls.push(product.image_front_url);

                // Parse quantity/weight
                let weight = 0;
                let unitOfMeasure: 'unit' | 'kg' = 'unit';

                if (product.product_quantity && !isNaN(parseFloat(product.product_quantity))) {
                    // Simple heuristic: if quantity mentions kg or g
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
                    unitOfMeasure
                };
            }

            return null;
        } catch (error) {
            console.error('Error looking up barcode:', error);
            return null;
        }
    }
};
