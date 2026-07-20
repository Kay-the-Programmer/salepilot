import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineBuildingStorefront, HiOutlineMapPin, HiOutlinePhone, HiOutlineArrowRight } from 'react-icons/hi2';
import { shopService, PublicStore } from '../../../services/shop.service';

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
                                    <p className="text-base font-bold text-brand-text truncate">{store.name}</p>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-sp-amber">Wholesale supplier</p>
                                </div>
                            </div>
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
                            <Link
                                to={`/shop/${store.id}`}
                                className="inline-flex items-center justify-center gap-1.5 h-11 rounded-lg bg-sp-navy text-white text-sm font-semibold hover:bg-sp-navy-light transition-colors active:scale-[0.98]"
                            >
                                <HiOutlineBuildingStorefront className="w-4 h-4" />
                                View catalog
                                <HiOutlineArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuppliersDirectoryView;
