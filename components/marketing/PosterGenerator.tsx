import React, { useRef, useEffect, useState } from 'react';
import { Product, StoreSettings } from '../../types';
import { ArrowDownTrayIcon, SparklesIcon } from '../icons';
import { buildAssetUrl } from '../../services/api';

interface Props {
    product: Product;
    storeSettings: StoreSettings | null;
    tone: 'professional' | 'friendly' | 'urgent';
    customText: string;
    format: 'square' | 'portrait';
    aiImageUrl?: string | null;
    isGeneratingAi?: boolean;
}

const PosterGenerator: React.FC<Props> = ({
    product,
    storeSettings,
    tone,
    customText,
    format,
    aiImageUrl,
    isGeneratingAi
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoadingAiImage, setIsLoadingAiImage] = useState(false);

    // Canvas dimensions
    const width = 1080;
    const height = format === 'square' ? 1080 : 1920;

    useEffect(() => {
        if (!aiImageUrl) {
            setIsLoadingAiImage(false);
            generatePoster();
        } else {
            // For AI-generated images, verify the image loads before setting preview
            setIsLoadingAiImage(true);
            const img = new Image();
            // Since we are using same-origin proxy, we don't strictly need anonymous CORS
            // but keeping it doesn't hurt as long as the backend supports it.
            img.crossOrigin = "anonymous";
            img.onload = () => {
                setPreviewUrl(aiImageUrl);
                setIsLoadingAiImage(false);
            };
            img.onerror = () => {
                console.error("Failed to load AI image, falling back to canvas");
                setIsLoadingAiImage(false);
                generatePoster();
            };
            img.src = buildAssetUrl(aiImageUrl || '');
        }
    }, [product, storeSettings, tone, customText, format, aiImageUrl]);

    const generatePoster = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // --- Background Design ---
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        if (tone === 'professional') {
            gradient.addColorStop(0, '#f8fafc');
            gradient.addColorStop(1, '#e2e8f0');
        } else if (tone === 'friendly') {
            gradient.addColorStop(0, '#fff7ed');
            gradient.addColorStop(1, '#ffedd5');
        } else { // Urgent
            gradient.addColorStop(0, '#fef2f2');
            gradient.addColorStop(1, '#fee2e2');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // --- Store Header ---
        if (storeSettings) {
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 40px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(storeSettings.name, width / 2, 80);
        }

        // --- Product Image ---
        if (product.imageUrls && product.imageUrls.length > 0) {
            try {
                const img = new Image();
                img.crossOrigin = "anonymous"; // Handle CORS for canvas

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = product.imageUrls[0];
                });

                const imgSize = format === 'square' ? 600 : 800;
                const scale = Math.min(imgSize / img.width, imgSize / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (width - w) / 2;
                const y = (height - h) / 2 - (format === 'square' ? 50 : 100);

                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 30;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 10;
                ctx.drawImage(img, x, y, w, h);
                ctx.shadowColor = 'transparent';
            } catch (e) {
                console.error("Failed to load image for canvas", e);
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect((width - 400) / 2, (height - 400) / 2, 400, 400);
            }
        }

        // --- Text Content ---
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 60px Inter, sans-serif';
        const nameY = format === 'square' ? height - 320 : height - 500;
        ctx.fillText(product.name, width / 2, nameY);

        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 80px Inter, sans-serif';
        const priceY = nameY + 90;
        ctx.fillText(`$${product.price}`, width / 2, priceY);

        ctx.fillStyle = '#475569';
        ctx.font = 'italic 36px Inter, sans-serif';
        const textY = priceY + 70;
        ctx.fillText(customText || "Available Now!", width / 2, textY);

        if (storeSettings) {
            ctx.fillStyle = '#64748b';
            ctx.font = '30px Inter, sans-serif';
            const footerY = height - 50;
            ctx.fillText(`${storeSettings.phone} | ${storeSettings.address}`, width / 2, footerY);
        }

        setPreviewUrl(canvas.toDataURL('image/png'));
    };

    const handleDownload = () => {
        if (!previewUrl) return;
        const link = document.createElement('a');
        link.download = `${product.name.replace(/\s+/g, '_')}_poster.png`;
        link.href = previewUrl;
        link.click();
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full h-full">
            <canvas ref={canvasRef} width={width} height={height} className="hidden" />

            <div className={`
                relative group bg-slate-200 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden flex items-center justify-center p-1 sm:p-2 h-full w-full max-w-[500px] transition-all duration-500
                ${format === 'portrait' ? 'aspect-[9/16]' : 'aspect-square'}
            `}>
                {(isGeneratingAi || isLoadingAiImage) && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <SparklesIcon className="absolute inset-0 m-auto w-6 h-6 text-blue-400 animate-pulse" />
                        </div>
                        <p className="mt-4 text-blue-100 font-bold tracking-wide animate-pulse uppercase text-[10px]">
                            {isGeneratingAi ? 'Nano Banana Processing...' : 'Loading AI Image...'}
                        </p>
                    </div>
                )}
                {previewUrl ? (
                    <img
                        src={buildAssetUrl(previewUrl || '')}
                        alt="Poster Preview"
                        className={`max-w-full max-h-full object-contain shadow-2xl rounded-2xl transition-all duration-700 ${(isGeneratingAi || isLoadingAiImage) ? 'scale-95 blur-sm' : 'scale-100 blur-0'}`}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-slate-700 bg-slate-100 dark:bg-slate-950/50">
                        <div className="w-12 h-12 border-2 border-gray-300 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                        <span className="text-xs font-semibold uppercase tracking-widest">Designing Poster...</span>
                    </div>
                )}

                {aiImageUrl && !isGeneratingAi && !isLoadingAiImage && (
                    <div className="absolute top-4 right-4 bg-blue-600/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md border border-blue-400/30 flex items-center gap-1.5">
                        <SparklesIcon className="w-3 h-3" />
                        AI GENERATED
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-auto">
                <button
                    onClick={handleDownload}
                    disabled={!previewUrl || isGeneratingAi || isLoadingAiImage}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-900 dark:text-white font-bold rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Save & Download
                </button>
            </div>
        </div>
    );
};

export default PosterGenerator;
