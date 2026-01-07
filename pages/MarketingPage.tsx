import React, { useState, useEffect } from 'react';
import { Product, StoreSettings } from '../types';
import { api } from '../services/api';
import ProductSelector from '../components/marketing/ProductSelector';
import PosterGenerator from '../components/marketing/PosterGenerator';
import CustomizationControls from '../components/marketing/CustomizationControls';
import { SparklesIcon } from '../components/icons';
import LoadingSpinner from '../components/LoadingSpinner';

const MarketingPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Customization State
    const [tone, setTone] = useState<'professional' | 'friendly' | 'urgent'>('professional');
    const [customText, setCustomText] = useState('');
    const [format, setFormat] = useState<'square' | 'portrait'>('square');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, settingsRes] = await Promise.all([
                    api.get<Product[]>('/products'),
                    api.get<StoreSettings>('/settings')
                ]);
                setProducts(productsRes);
                setStoreSettings(settingsRes);
                // Pre-select first product if available
                if (productsRes.length > 0) setSelectedProduct(productsRes[0]);
            } catch (error) {
                console.error("Failed to load marketing data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Set default text based on tone if empty
    useEffect(() => {
        if (!customText) {
            if (tone === 'urgent') setCustomText('Limited Stock! Order Fast.');
            else if (tone === 'friendly') setCustomText('We think you\'ll love this!');
            else setCustomText('Premium Quality. Available Now.');
        }
    }, [tone]);

    return (
        <div className="p-4 md:p-6 lg:h-full flex flex-col overflow-y-auto lg:overflow-hidden bg-gray-50/50">
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Marketing Studio</h1>
                    <p className="text-xs md:text-sm text-gray-500">Create professional social media posters for your products in seconds.</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:overflow-hidden min-h-0">
                {/* Left Panel: Selection & Controls */}
                <div className="w-full lg:w-1/3 lg:min-w-[320px] lg:max-w-sm flex flex-col gap-4 lg:overflow-hidden">
                    {/* Product Selection */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px] lg:h-auto lg:flex-1 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">1. Select Product</h2>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {isLoading ? (
                                <LoadingSpinner fullScreen={false} text="Loading products..." className="py-8" />
                            ) : (
                                <ProductSelector
                                    products={products}
                                    onSelect={setSelectedProduct}
                                    selectedProductId={selectedProduct?.id}
                                />
                            )}
                        </div>
                    </div>

                    {/* Customization Controls */}
                    <CustomizationControls
                        tone={tone}
                        setTone={setTone}
                        customText={customText}
                        setCustomText={setCustomText}
                        format={format}
                        setFormat={setFormat}
                        onGenerate={() => { }}
                    />
                </div>

                {/* Right Panel: Preview & Actions */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[500px] lg:min-h-0 lg:overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">2. Live Preview</h2>
                        {selectedProduct && <span className="text-xs text-gray-400 font-mono hidden sm:block">{selectedProduct.name}</span>}
                    </div>
                    <div className="flex-1 p-4 md:p-8 bg-slate-50 flex items-center justify-center lg:overflow-y-auto">
                        {selectedProduct ? (
                            <PosterGenerator
                                product={selectedProduct}
                                storeSettings={storeSettings}
                                tone={tone}
                                customText={customText}
                                format={format}
                            />
                        ) : (
                            <div className="text-gray-400 text-center flex flex-col items-center">
                                <SparklesIcon className="w-12 h-12 mb-2 opacity-20" />
                                <p>Select a product to start designing</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingPage;
