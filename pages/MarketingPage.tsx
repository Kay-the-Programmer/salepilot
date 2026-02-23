import React, { useState, useEffect } from 'react';
import { Product, StoreSettings, Category } from '../types';
import { api } from '../services/api';
import ProductSelector from '../components/marketing/ProductSelector';
import PosterGenerator from '../components/marketing/PosterGenerator';
import CustomizationControls from '../components/marketing/CustomizationControls';
import { SparklesIcon } from '../components/icons';
import LoadingSpinner from '../components/LoadingSpinner';

const MarketingPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Layout State (Mobile only)
    const [activeTab, setActiveTab] = useState<'products' | 'style' | 'preview'>('preview');

    // Customization State
    const [tone, setTone] = useState<'professional' | 'friendly' | 'urgent'>('professional');
    const [customText, setCustomText] = useState('');
    const [format, setFormat] = useState<'square' | 'portrait'>('square');

    // Brand Agent State (Zambia-specific)
    const [shopName, setShopName] = useState('');
    const [offer, setOffer] = useState('');
    const [currency, setCurrency] = useState('ZMW');

    // AI State
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, settingsRes, categoriesRes] = await Promise.all([
                    api.get<Product[]>('/products'),
                    api.get<StoreSettings>('/settings'),
                    api.get<Category[]>('/categories')
                ]);
                setProducts(productsRes);
                setStoreSettings(settingsRes);
                setCategories(categoriesRes);
                if (productsRes.length > 0) setSelectedProduct(productsRes[0]);
            } catch (error) {
                console.error("Failed to load marketing data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!customText) {
            if (tone === 'urgent') setCustomText('Limited Stock! Order Fast.');
            else if (tone === 'friendly') setCustomText('We think you\'ll love this!');
            else setCustomText('Premium Quality. Available Now.');
        }
    }, [tone]);

    useEffect(() => {
        setAiImageUrl(null);
    }, [selectedProduct, tone, format]);

    const handleGeneratePoster = async () => {
        if (!selectedProduct) return;

        setIsGeneratingAi(true);
        // Switch to preview tab on mobile when starting generation
        if (window.innerWidth < 1024) setActiveTab('preview');

        try {
            const categoryName = categories.find(c => c.id === (selectedProduct as any).categoryId)?.name ||
                (selectedProduct as any).category || 'Product';

            const response = await api.post<{
                imageUrl: string | null;
                useFallback?: boolean;
                visualPrompt?: string;
            }>('/ai/generate-poster', {
                productName: selectedProduct.name,
                category: categoryName,
                price: selectedProduct.price,
                storeName: storeSettings?.name || 'Our Store',
                tone,
                customText,
                format,
                // Brand Agent fields for Zambian shop owners
                shopName: shopName || storeSettings?.name || 'Our Store',
                offer,
                currency
            });

            // If useFallback is true or imageUrl is null, Canvas fallback will be used
            // Setting null triggers canvas-based generation in PosterGenerator
            setAiImageUrl(response.useFallback ? null : response.imageUrl);
        } catch (error) {
            console.error("Failed to generate AI poster", error);
            // On complete failure, canvas fallback is used automatically (aiImageUrl remains null)
        } finally {
            setIsGeneratingAi(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
            {/* Main Header */}
            <header className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Marketing Studio</h1>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium tracking-tight">Generate premium cinematic product posters</p>
                    </div>
                </div>

                {/* Mobile Tabbed Navigation */}
                <div className="flex lg:hidden mt-4 sm:mt-0 w-full sm:w-auto p-1 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    {(['products', 'style', 'preview'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${activeTab === tab
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-slate-500'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">

                {/* Section 1: Product Browser (Left Sidebar on Desktop) */}
                <aside className={`
                    w-full lg:w-72 lg:border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 shrink-0
                    ${activeTab === 'products' ? 'flex animate-in slide-in-from-left duration-300' : 'hidden lg:flex'}
                `}>
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">1. Select Product</h2>
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">1</div>
                    </div>
                    <div className="flex-1 overflow-hidden pt-4">
                        {isLoading ? (
                            <LoadingSpinner fullScreen={false} text="Loading Catalog..." className="py-12" />
                        ) : (
                            <ProductSelector
                                products={products}
                                onSelect={(p) => {
                                    setSelectedProduct(p);
                                    if (window.innerWidth < 1024) setActiveTab('style');
                                }}
                                selectedProductId={selectedProduct?.id}
                            />
                        )}
                    </div>
                </aside>

                {/* Section 2: Studio Workspace (Central Hero Area) */}
                <section className={`
                    flex-1 bg-slate-100 dark:bg-slate-950 p-4 md:p-8 flex items-center justify-center overflow-auto relative pattern-dots transition-all flex-col lg:flex-row
                    ${activeTab === 'preview' ? 'flex animate-in fade-in duration-500' : 'hidden lg:flex'}
                `}>
                    {selectedProduct ? (
                        <div className="w-full h-full flex items-center justify-center max-w-4xl mx-auto">
                            <PosterGenerator
                                product={selectedProduct}
                                storeSettings={storeSettings}
                                tone={tone}
                                customText={customText}
                                format={format}
                                aiImageUrl={aiImageUrl}
                                isGeneratingAi={isGeneratingAi}
                            />
                        </div>
                    ) : (
                        <div className="text-gray-400 dark:text-slate-700 text-center flex flex-col items-center max-w-sm">
                            <div className="liquid-glass-card rounded-[2rem] p-8 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 mb-6 scale-login">
                                <SparklesIcon className="w-16 h-16 opacity-10" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400 mb-2">Workspace Empty</h3>
                            <p className="text-xs text-gray-400 dark:text-slate-500 px-6">Select a product from the sidebar to begin designing your marketing assets.</p>
                        </div>
                    )}
                </section>

                {/* Section 3: Style Inspector (Right Sidebar on Desktop) */}
                <aside className={`
                    w-full lg:w-80 lg:border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 shrink-0
                    ${activeTab === 'style' ? 'flex animate-in slide-in-from-right duration-300' : 'hidden lg:flex'}
                `}>
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">2. Fine-tune Options</h2>
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">2</div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 thin-scrollbar">
                        <CustomizationControls
                            tone={tone}
                            setTone={setTone}
                            customText={customText}
                            setCustomText={setCustomText}
                            format={format}
                            setFormat={setFormat}
                            onGenerate={handleGeneratePoster}
                            // Brand Agent fields for Zambian shop owners
                            shopName={shopName}
                            setShopName={setShopName}
                            offer={offer}
                            setOffer={setOffer}
                            currency={currency}
                            setCurrency={setCurrency}
                        />

                        {/* Help / Tip Card */}
                        <div className="mt-8 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30">
                            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                                <SparklesIcon className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">AI Recommendation</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed italic">
                                "Try the <strong>Cinematic</strong> mode for lifestyle-focused products. It creates higher engagement on Instagram and TikTok."
                            </p>
                        </div>
                    </div>
                </aside>

            </main>
        </div>
    );
};

export default MarketingPage;
