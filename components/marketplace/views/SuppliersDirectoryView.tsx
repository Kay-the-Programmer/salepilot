import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineBuildingStorefront, HiOutlineMapPin, HiOutlinePhone, HiOutlineArrowRight, HiCheckBadge } from 'react-icons/hi2';
import { shopService, PublicStore } from '../../../services/shop.service';
import { waChatLink } from '../../../utils/whatsapp';

/**
 * Wholesale supplier directory: every store that opted into the B2B
 * marketplace, with contact details and a link into its live catalog.
 */
const SuppliersDirectoryView: React.FC = () => {
    const [stores, setStores] = useState<PublicStore[] | null>(null);

    useEffect(() => {
        shopService.getPublicStores({ wholesale: true })
            .then(setStores)
            .catch(() => setStores([]));
    }, []);

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-brand-text mb-1">Suppliers</h1>
            <p className="text-sm text-brand-text-muted mb-6">
                Wholesalers and distributors selling on the marketplace. Open a catalog to browse live stock and order.
            </p>

            {stores === null ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-40 rounded-lg border border-brand-border bg-surface animate-pulse" />
                    ))}
                </div>
            ) : stores.length === 0 ? (
                <div className="rounded-lg border border-brand-border bg-surface py-16 text-center px-6">
                    <p className="font-semibold text-brand-text mb-1">No wholesale suppliers listed yet</p>
                    <p className="text-sm text-brand-text-muted mb-5 max-w-md mx-auto">
                        Are you a wholesaler on SalePilot? Turn on “Wholesale supplier” in your Online Store settings to appear here.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            to="/store"
                            className="inline-flex items-center h-11 px-6 rounded-lg bg-sp-navy text-white font-semibold text-sm hover:bg-sp-navy-light transition-colors active:scale-[0.98]"
                        >
                            Open Online Store settings
                        </Link>
                        <Link
                            to="/register?type=supplier"
                            className="inline-flex items-center h-11 px-6 rounded-lg border border-sp-navy text-sp-navy font-semibold text-sm hover:bg-sp-navy/5 transition-colors active:scale-[0.98]"
                        >
                            New here? Register as a supplier
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stores.map(store => (
                        <div key={store.id} className="bg-surface border border-brand-border rounded-lg p-5 flex flex-col">
                            <div className="flex items-center gap-3.5 mb-4">
                                <div className="w-12 h-12 flex-none rounded-lg bg-sp-navy flex items-center justify-center text-white font-bold text-xl">
                                    {store.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-brand-text truncate flex items-center gap-1.5">
                                        <span className="truncate">{store.name}</span>
                                        {store.isVerified && <HiCheckBadge className="w-5 h-5 flex-none text-sp-navy" title="Verified supplier" />}
                                    </p>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-sp-amber">Wholesale supplier</p>
                                </div>
                            </div>
                            {store.storeDescription && (
                                <p className="text-sm text-brand-text-muted leading-relaxed mb-3 line-clamp-3">{store.storeDescription}</p>
                            )}
                            <ul className="space-y-1.5 text-sm text-brand-text-muted mb-5 flex-1">
                                <li className="flex items-start gap-2">
                                    <HiOutlineMapPin className="w-4 h-4 mt-0.5 flex-none" />
                                    <span className="min-w-0">{store.address || 'Online store'}</span>
                                </li>
                                {store.phone && (
                                    <li className="flex items-center gap-2">
                                        <HiOutlinePhone className="w-4 h-4 flex-none" />
                                        {store.phone}
                                    </li>
                                )}
                            </ul>
                            <div className="flex gap-2">
                                <Link
                                    to={`/shop/${store.id}`}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-lg bg-sp-navy text-white text-sm font-semibold hover:bg-sp-navy-light transition-colors active:scale-[0.98]"
                                >
                                    <HiOutlineBuildingStorefront className="w-4 h-4" />
                                    View catalog
                                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                                </Link>
                                {waChatLink(store.phone) && (
                                    <a
                                        href={waChatLink(store.phone, `Hi ${store.name}! I found you on the SalePilot marketplace.`)!}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={`Chat with ${store.name} on WhatsApp`}
                                        className="w-11 h-11 flex-none rounded-lg border-2 border-[#25D366] text-[#128C7E] flex items-center justify-center hover:bg-[#25D366]/10 transition-colors active:scale-95"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.83 14.12c-.25.7-1.45 1.33-2 1.38-.51.05-1.15.24-3.88-.81-3.27-1.29-5.38-4.62-5.54-4.83-.16-.22-1.33-1.77-1.33-3.38 0-1.61.85-2.4 1.15-2.73.3-.33.65-.41.87-.41h.62c.2 0 .47-.08.73.56.27.65.91 2.24.99 2.4.08.16.13.36.02.58-.11.22-.16.35-.32.54-.16.19-.34.43-.49.57-.16.16-.33.34-.14.66.19.32.85 1.4 1.83 2.27 1.25 1.12 2.31 1.46 2.64 1.62.33.16.52.14.71-.08.19-.22.82-.96 1.04-1.29.22-.33.44-.27.73-.16.3.11 1.9.9 2.23 1.06.33.16.54.24.62.38.08.13.08.78-.17 1.48z"/></svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuppliersDirectoryView;
