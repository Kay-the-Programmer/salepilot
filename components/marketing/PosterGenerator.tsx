import React, { useRef, useEffect, useState } from 'react';
import { Product, StoreSettings } from '../../types';
import { ArrowDownTrayIcon, ShareIcon } from '../icons'; // Assuming ShareIcon exists or I'll generic it
// Checking icons: ShareIcon not explicitly in import list from sidebar, but likely available or can use generic.
// I will stick to what I know exists or generic SVG if unsure. `ArrowDownTrayIcon` exists.

interface Props {
    product: Product;
    storeSettings: StoreSettings | null;
    tone: 'professional' | 'friendly' | 'urgent';
    customText: string;
    format: 'square' | 'portrait';
}

const PosterGenerator: React.FC<Props> = ({ product, storeSettings, tone, customText, format }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Canvas dimensions
    const width = 1080;
    const height = format === 'square' ? 1080 : 1920;

    useEffect(() => {
        generatePoster();
    }, [product, storeSettings, tone, customText, format]);

    const generatePoster = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsGenerating(true);

        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // --- Background Design ---
        // Simple gradient background based on tone
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        if (tone === 'professional') {
            gradient.addColorStop(0, '#f8fafc'); // Slate-50
            gradient.addColorStop(1, '#e2e8f0'); // Slate-200
        } else if (tone === 'friendly') {
            gradient.addColorStop(0, '#fff7ed'); // Orange-50
            gradient.addColorStop(1, '#ffedd5'); // Orange-100
        } else { // Urgent
            gradient.addColorStop(0, '#fef2f2'); // Red-50
            gradient.addColorStop(1, '#fee2e2'); // Red-100
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // --- Store Header ---
        if (storeSettings) {
            ctx.fillStyle = '#1e293b'; // Slate-800
            ctx.font = 'bold 40px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(storeSettings.name, width / 2, 80);
        }

        // --- Product Image ---
        if (product.imageUrls && product.imageUrls.length > 0) {
            try {
                const img = new Image();

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = product.imageUrls[0];
                });

                // Calculate aspect-ratio fit
                const imgSize = format === 'square' ? 600 : 800;
                const scale = Math.min(imgSize / img.width, imgSize / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (width - w) / 2;
                const y = (height - h) / 2 - (format === 'square' ? 50 : 100);

                // Shadow
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 30;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 10;

                ctx.drawImage(img, x, y, w, h);

                // Reset shadow
                ctx.shadowColor = 'transparent';
            } catch (e) {
                console.error("Failed to load image for canvas", e);
                // Draw placeholder
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect((width - 400) / 2, (height - 400) / 2, 400, 400);
            }
        }

        // --- Text Content ---
        ctx.textAlign = 'center';

        // Product Name
        ctx.fillStyle = '#0f172a'; // Slate-900
        ctx.font = 'bold 60px Inter, sans-serif';
        const nameY = format === 'square' ? height - 320 : height - 500;
        ctx.fillText(product.name, width / 2, nameY);

        // Price
        ctx.fillStyle = '#2563eb'; // Blue-600
        ctx.font = 'bold 80px Inter, sans-serif';
        const priceY = nameY + 90;
        ctx.fillText(`$${product.price}`, width / 2, priceY);

        // Marketing Text / CTA
        ctx.fillStyle = '#475569'; // Slate-600
        ctx.font = 'italic 36px Inter, sans-serif';
        const textY = priceY + 70;
        ctx.fillText(customText || "Available Now!", width / 2, textY);

        // Footer / Contact
        if (storeSettings) {
            ctx.fillStyle = '#64748b'; // Slate-500
            ctx.font = '30px Inter, sans-serif';
            const footerY = height - 50;
            ctx.fillText(`${storeSettings.phone} | ${storeSettings.address}`, width / 2, footerY);
        }

        // Export to blob/url
        setPreviewUrl(canvas.toDataURL('image/png'));
        setIsGenerating(false);
    };

    const handleDownload = () => {
        if (!previewUrl) return;
        const link = document.createElement('a');
        link.download = `${product.name.replace(/\\s+/g, '_')}_poster.png`;
        link.href = previewUrl;
        link.click();
    };

    return (
        <div className="flex flex-col items-center gap-6 h-full">
            {/* Hidden Canvas */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="hidden"
            />

            {/* Preview Area */}
            <div className="relative group bg-gray-100 border border-gray-200 shadow-inner rounded-xl overflow-hidden flex items-center justify-center p-4 max-h-[600px] w-full max-w-[500px]">
                {previewUrl ? (
                    <img src={previewUrl} alt="Poster Preview" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                ) : (
                    <div className="animate-pulse flex items-center justify-center w-full h-64 text-gray-400">
                        Generating Preview...
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    onClick={handleDownload}
                    disabled={!previewUrl}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Download Poster
                </button>
            </div>
        </div>
    );
};

export default PosterGenerator;
