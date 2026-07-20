import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineArrowRight, HiOutlineTruck, HiOutlineShieldCheck, HiOutlinePhone } from 'react-icons/hi2';
import { shopService } from '../../services/shop.service';
import { Product, Category } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { addToCart, updateQuantity, useShopCart, effectiveUnitPrice } from './cartStore';
import { getCurrentUser } from '../../services/authService';
import ShopProductCard from './ShopProductCard';
import type { ShopOutletContext } from './ShopLayout';

/**
 * Storefront landing: hero → categories → featured grid → new arrivals.
 * The structure every shopper already knows from mainstream e-commerce.
 */
const ShopHomePage: React.FC = () => {
    const { shopInfo, formatPrice } = useOutletContext<ShopOutletContext>();
    const [featured, setFeatured] = useState<Product[]>([]);
    const [newest, setNewest] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const { qtyOf } = useShopCart(shopInfo.id);
    const { showToast } = useToast();
    // Trade pricing is account-gated: guests browse a wholesale storefront at
    // retail prices; signed-in buyers see wholesale prices + MOQs.
    const isWholesale = !!shopInfo.settings?.isWholesaleSupplier && !!getCurrentUser();

    /** One-tap add / stepper wiring for a grid card. */
    const quickAddFor = (p: Product) => ({
        qty: qtyOf(p.id),
        onAdd: () => {
            addToCart(shopInfo.id, {
                id: p.id, name: p.name, price: effectiveUnitPrice(p, isWholesale),
                image: p.imageUrls?.[0], stock: p.stock, unitOfMeasure: p.unitOfMeasure,
                moq: isWholesale ? p.minOrderQuantity || undefined : undefined,
            });
            showToast(`${p.name} added to cart`, 'success');
        },
        onSetQty: (q: number) => updateQuantity(shopInfo.id, p.id, q),
    });

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [feat, fresh, cats] = await Promise.all([
                    shopService.getProducts(shopInfo.id, { sort: 'name', page: 1, limit: 8 }),
                    shopService.getProducts(shopInfo.id, { sort: 'newest', page: 1, limit: 4 }),
                    shopService.getCategories(shopInfo.id),
                ]);
                if (cancelled) return;
                setFeatured(feat.items);
                setNewest(fresh.items);
                setCategories(cats.slice(0, 8));
            } catch (err) {
                console.error('Failed to load storefront home', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [shopInfo.id]);

    const storeName = shopInfo.settings.name || shopInfo.name;

    return (
        <div className="space-y-12">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden rounded-xl bg-sp-navy text-white">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{ background: 'radial-gradient(ellipse at 80% 0%, #FF7F27 0%, transparent 55%), radial-gradient(ellipse at 10% 100%, #1A428A 0%, transparent 60%)' }}
                />
                <div className="relative px-6 py-14 sm:px-12 sm:py-20 max-w-3xl">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-3">Welcome to</p>
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">{storeName}</h1>
                    <p className="text-base sm:text-lg text-white/75 leading-relaxed mb-8 max-w-xl">
                        {shopInfo.settings.storeDescription || 'Browse the catalog, add to your cart and order in minutes — pay on delivery or pickup.'}
                    </p>
                    <Link
                        to={`/shop/${shopInfo.id}/products`}
                        className="inline-flex items-center gap-2 h-12 px-7 rounded-lg bg-sp-amber text-white font-bold text-sm uppercase tracking-wide hover:brightness-95 transition-all active:scale-[0.98]"
                    >
                        <HiOutlineShoppingBag className="w-5 h-5" />
                        Shop now
                    </Link>
                </div>
            </section>

            {/* ── Trust strip ── */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { icon: HiOutlineTruck, title: 'Delivery & pickup', body: 'Choose what works for you at checkout' },
                    { icon: HiOutlineShieldCheck, title: 'Order with confidence', body: 'Live stock — what you see is available' },
                    { icon: HiOutlinePhone, title: 'Direct support', body: shopInfo.settings.phone ? `Call us: ${shopInfo.settings.phone}` : 'The store confirms every order' },
                ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="flex items-center gap-3.5 bg-surface border border-brand-border rounded-lg px-5 py-4">
                        <div className="w-10 h-10 flex-none rounded-lg bg-sp-navy-soft flex items-center justify-center text-sp-navy">
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-brand-text">{title}</p>
                            <p className="text-xs text-brand-text-muted truncate">{body}</p>
                        </div>
                    </div>
                ))}
            </section>

            {/* ── Categories ── */}
            {categories.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-brand-text">Shop by category</h2>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                        {categories.map(cat => (
                            <Link
                                key={cat.id}
                                to={`/shop/${shopInfo.id}/products?category=${cat.id}`}
                                className="flex-none h-12 px-5 inline-flex items-center rounded-full bg-surface border border-brand-border text-sm font-semibold text-brand-text hover:border-sp-navy hover:text-sp-navy transition-colors active:scale-95"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Featured products ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-brand-text">Featured products</h2>
                    <Link
                        to={`/shop/${shopInfo.id}/products`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-sp-navy hover:underline"
                    >
                        View all <HiOutlineArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-lg border border-brand-border bg-surface h-64 animate-pulse" />
                        ))}
                    </div>
                ) : featured.length === 0 ? (
                    <div className="rounded-lg border border-brand-border bg-surface py-16 text-center">
                        <p className="text-brand-text-muted">No products listed yet — check back soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {featured.map(p => (
                            <ShopProductCard key={p.id} product={p} storeId={shopInfo.id} formatPrice={formatPrice} quickAdd={quickAddFor(p)} wholesale={isWholesale} />
                        ))}
                    </div>
                )}
            </section>

            {/* ── New arrivals ── */}
            {!loading && newest.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-brand-text">New arrivals</h2>
                        <Link
                            to={`/shop/${shopInfo.id}/products?sort=newest`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sp-navy hover:underline"
                        >
                            View all <HiOutlineArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {newest.map(p => (
                            <ShopProductCard key={p.id} product={p} storeId={shopInfo.id} formatPrice={formatPrice} quickAdd={quickAddFor(p)} wholesale={isWholesale} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ShopHomePage;
