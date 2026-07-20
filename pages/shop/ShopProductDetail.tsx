import React, { useEffect, useState } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlinePlus, HiOutlineMinus, HiOutlineShoppingBag, HiOutlinePhoto, HiOutlineChevronRight } from 'react-icons/hi2';
import { shopService } from '../../services/shop.service';
import { buildAssetUrl } from '../../services/api';
import { Product, Category } from '../../types';
import { logEvent } from '../../src/utils/analytics';
import { addToCart, useShopCart, effectiveUnitPrice } from './cartStore';
import ShopProductCard from './ShopProductCard';
import type { ShopOutletContext } from './ShopLayout';

/**
 * Product page: breadcrumbs → gallery + buy panel → description → related.
 */
const ShopProductDetail: React.FC = () => {
    const { storeId, productId } = useParams<{ storeId: string; productId: string }>();
    const { formatPrice, openCart, shopInfo } = useOutletContext<ShopOutletContext>();
    const isWholesale = !!shopInfo.settings?.isWholesaleSupplier;
    const [product, setProduct] = useState<Product | null>(null);
    const [related, setRelated] = useState<Product[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [justAdded, setJustAdded] = useState(false);
    const { qtyOf } = useShopCart(storeId);
    const inCartQty = product ? qtyOf(product.id) : 0;

    useEffect(() => {
        if (!storeId || !productId) return;
        let cancelled = false;
        setLoading(true);
        setQuantity(1);
        setActiveImage(0);
        window.scrollTo({ top: 0 });

        const load = async () => {
            try {
                const prod = await shopService.getProductById(storeId, productId);
                if (cancelled) return;
                setProduct(prod);
                // Wholesale MOQ: start the qty picker at the minimum.
                if (isWholesale && prod.minOrderQuantity && prod.minOrderQuantity > 1) {
                    setQuantity(prod.minOrderQuantity);
                }

                // Category name (breadcrumb) + related items from the same category.
                const [cats, rel] = await Promise.all([
                    shopService.getCategories(storeId).catch(() => [] as Category[]),
                    prod.categoryId
                        ? shopService.getProducts(storeId, { categoryId: prod.categoryId, page: 1, limit: 5 }).catch(() => null)
                        : Promise.resolve(null),
                ]);
                if (cancelled) return;
                setCategory(cats.find(c => c.id === prod.categoryId) || null);
                setRelated((rel?.items || []).filter(p => p.id !== prod.id).slice(0, 4));
            } catch (err) {
                console.error('Failed to load product', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [storeId, productId]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-lg border border-brand-border bg-surface aspect-square animate-pulse" />
                <div className="space-y-4">
                    <div className="h-8 w-3/4 rounded bg-surface-variant animate-pulse" />
                    <div className="h-12 w-1/2 rounded bg-surface-variant animate-pulse" />
                    <div className="h-24 rounded bg-surface-variant animate-pulse" />
                </div>
            </div>
        );
    }

    if (!product || !storeId) {
        return (
            <div className="rounded-lg border border-brand-border bg-surface py-20 text-center">
                <p className="font-semibold text-brand-text mb-2">Product not found</p>
                <Link to={`/shop/${storeId}/products`} className="text-sm font-semibold text-sp-navy hover:underline">
                    Back to catalog
                </Link>
            </div>
        );
    }

    const images = product.imageUrls || [];
    const inStock = product.stock > 0;
    const wholesalePriced = isWholesale && product.wholesalePrice != null;
    const unitPrice = effectiveUnitPrice(product, isWholesale);
    const moqMin = isWholesale && product.minOrderQuantity && product.minOrderQuantity > 1 ? product.minOrderQuantity : 1;

    const handleAddToCart = () => {
        addToCart(storeId, {
            id: product.id,
            name: product.name,
            price: unitPrice,
            image: images[0],
            stock: product.stock,
            unitOfMeasure: product.unitOfMeasure,
            moq: moqMin > 1 ? moqMin : undefined,
        }, quantity);
        logEvent('Shop', 'Add to Cart', product.name);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1800);
        openCart();
    };

    return (
        <div className="space-y-12 pb-20 md:pb-0">
            {/* ── Breadcrumbs ── */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-brand-text-muted flex-wrap">
                <Link to={`/shop/${storeId}`} className="hover:text-sp-navy transition-colors">Home</Link>
                <HiOutlineChevronRight className="w-3.5 h-3.5 flex-none" />
                <Link to={`/shop/${storeId}/products`} className="hover:text-sp-navy transition-colors">Shop</Link>
                {category && (
                    <>
                        <HiOutlineChevronRight className="w-3.5 h-3.5 flex-none" />
                        <Link to={`/shop/${storeId}/products?category=${category.id}`} className="hover:text-sp-navy transition-colors">
                            {category.name}
                        </Link>
                    </>
                )}
                <HiOutlineChevronRight className="w-3.5 h-3.5 flex-none" />
                <span className="text-brand-text font-medium truncate max-w-[200px]">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
                {/* ── Gallery ── */}
                <div className="space-y-3">
                    <div className="aspect-square rounded-lg border border-brand-border bg-warm-100 overflow-hidden flex items-center justify-center">
                        {images.length > 0 ? (
                            <img
                                src={buildAssetUrl(images[activeImage] || images[0])}
                                alt={product.name}
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <HiOutlinePhoto className="w-16 h-16 text-warm-400" />
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    aria-label={`View image ${i + 1}`}
                                    className={`w-16 h-16 flex-none rounded-lg overflow-hidden bg-warm-100 transition-all ${activeImage === i ? 'border-2 border-sp-navy' : 'border border-brand-border hover:border-warm-400'}`}
                                >
                                    <img
                                        src={buildAssetUrl(img)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Buy panel ── */}
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-[32px] sm:leading-10 font-semibold tracking-tight text-brand-text mb-2">
                        {product.name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-brand-text-muted mb-5">
                        {product.brand && <span className="font-medium">{product.brand}</span>}
                        {product.brand && product.sku && <span aria-hidden>·</span>}
                        {product.sku && <span>SKU {product.sku}</span>}
                    </div>

                    {/* Price — display-price role */}
                    <div className="mb-5">
                        <p className="text-4xl sm:text-5xl font-bold tracking-tight text-sp-navy">
                            {formatPrice(unitPrice)}
                        </p>
                        {wholesalePriced && (
                            <p className="mt-1.5 text-sm text-brand-text-muted">
                                <span className="font-bold uppercase tracking-wider text-sp-amber text-[11px] mr-2">Wholesale price</span>
                                Retail {formatPrice(product.price)}
                            </p>
                        )}
                    </div>

                    {/* Stock + in-cart chips */}
                    <div className="mb-6 flex items-center gap-2 flex-wrap">
                        {inStock ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/15 text-success text-sm font-bold">
                                <HiOutlineCheckCircle className="w-4 h-4" />
                                In stock{product.stock <= 10 ? ` — only ${product.stock} left` : ''}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-danger/15 text-danger text-sm font-bold">
                                Out of stock
                            </span>
                        )}
                        {moqMin > 1 && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-sp-amber/15 text-amber-700 text-sm font-bold">
                                Minimum order: {moqMin}
                            </span>
                        )}
                        {inCartQty > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sp-navy/10 text-sp-navy text-sm font-bold">
                                <HiOutlineShoppingBag className="w-4 h-4" />
                                {inCartQty} in cart
                            </span>
                        )}
                    </div>

                    {/* Quantity + add to cart */}
                    {inStock && (
                        <div className="flex items-stretch gap-3 mb-8">
                            <div className="flex items-center border border-brand-border rounded-lg overflow-hidden bg-surface">
                                <button
                                    onClick={() => setQuantity(q => Math.max(moqMin, q - 1))}
                                    aria-label="Decrease quantity"
                                    className="w-12 h-12 flex items-center justify-center text-brand-text-muted hover:bg-surface-variant transition-colors"
                                >
                                    <HiOutlineMinus className="w-4 h-4" />
                                </button>
                                <input
                                    type="number"
                                    min={moqMin}
                                    max={product.stock}
                                    value={quantity}
                                    onChange={e => setQuantity(Math.max(moqMin, Math.min(product.stock, parseInt(e.target.value) || moqMin)))}
                                    aria-label="Quantity"
                                    className="w-14 h-12 text-center font-bold text-brand-text bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                    aria-label="Increase quantity"
                                    className="w-12 h-12 flex items-center justify-center text-brand-text-muted hover:bg-surface-variant transition-colors"
                                >
                                    <HiOutlinePlus className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                className={`flex-1 h-12 rounded-lg font-bold text-sm uppercase tracking-wide text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${justAdded ? 'bg-success' : 'bg-sp-amber hover:brightness-95'}`}
                            >
                                {justAdded ? (
                                    <><HiOutlineCheckCircle className="w-5 h-5" /> Added</>
                                ) : (
                                    <><HiOutlineShoppingBag className="w-5 h-5" /> Add to cart</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Description */}
                    <div className="border-t border-brand-border pt-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-brand-text-muted mb-3">Description</h2>
                        <p className="text-[15px] leading-relaxed text-brand-text whitespace-pre-wrap">
                            {product.description || 'No description available for this product.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Related products ── */}
            {related.length > 0 && (
                <section>
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-brand-text mb-4">You may also like</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {related.map(p => (
                            <ShopProductCard key={p.id} product={p} storeId={storeId} formatPrice={formatPrice} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Sticky mobile buy bar (thumb-reach add on phones) ── */}
            {inStock && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-t border-brand-border px-4 py-3 flex items-center gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted leading-none mb-1">Total</p>
                        <p className="text-xl font-bold tracking-tight text-sp-navy leading-none truncate">
                            {formatPrice(unitPrice * quantity)}
                        </p>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className={`flex-1 h-12 rounded-lg font-bold text-sm uppercase tracking-wide text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${justAdded ? 'bg-success' : 'bg-sp-amber hover:brightness-95'}`}
                    >
                        {justAdded ? (
                            <><HiOutlineCheckCircle className="w-5 h-5" /> Added</>
                        ) : (
                            <><HiOutlineShoppingBag className="w-5 h-5" /> Add {quantity > 1 ? `${quantity} ` : ''}to cart</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShopProductDetail;
