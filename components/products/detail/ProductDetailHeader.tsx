import React, { useRef, useState, useEffect } from 'react';
import { Product, User } from '@/types.ts';
import ArrowLeftIcon from '@/components/icons/ArrowLeftIcon';
import PencilIcon from '@/components/icons/PencilIcon';
import EllipsisVerticalIcon from '@/components/icons/EllipsisVerticalIcon';
import AdjustmentsHorizontalIcon from '@/components/icons/AdjustmentsHorizontalIcon';
import ShoppingCartIcon from '@/components/icons/ShoppingCartIcon';
import PrinterIcon from '@/components/icons/PrinterIcon';
import ArchiveBoxIcon from '@/components/icons/ArchiveBoxIcon';
import RestoreIcon from '@/components/icons/RestoreIcon';
import TrashIcon from '@/components/icons/TrashIcon';

interface ProductDetailHeaderProps {
    product: Product;
    user: User;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onArchive: (productId: string) => void;
    onPrintLabel: (product: Product) => void;
    onAdjustStock: (product: Product) => void;
    onPersonalUse?: (product: Product) => void;
    onBack?: () => void;
}

const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
    product,
    user,
    onEdit,
    onDelete,
    onArchive,
    onPrintLabel,
    onAdjustStock,
    onPersonalUse,
    onBack
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const canManage = user.role === 'admin' || user.role === 'inventory_manager';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="px-5 sm:px-8 py-4 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-3xl border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between sticky top-0 z-10 w-full animate-glass-appear shadow-sm">
            <div className="flex items-center gap-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors md:hidden active:scale-95 transition-all duration-300"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                )}
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md md:max-w-lg">
                        {product.name}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">SKU: {product.sku || 'N/A'}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {canManage && (
                    <button
                        onClick={() => onEdit(product)}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800/80 rounded-[16px] shadow-sm border border-slate-200/50 dark:border-white/5 text-[13px] font-bold tracking-wide flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-all duration-300 hover:shadow-md active:scale-95"
                    >
                        <PencilIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                    </button>
                )}

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2.5 bg-white dark:bg-slate-800/80 rounded-[16px] shadow-sm border border-slate-200/50 dark:border-white/5 transition-all duration-300 hover:shadow-md active:scale-95"
                        aria-label="More options"
                    >
                        <EllipsisVerticalIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-3 w-56 bg-white/90 dark:bg-slate-800/90 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-200/50 dark:border-white/5 z-50 p-2 animate-glass-appear">
                            <div className="p-2 space-y-1">
                                {canManage && (
                                    <>
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onAdjustStock(product); }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors active:scale-95 transition-all duration-300"
                                        >
                                            <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                            Adjust Stock
                                        </button>
                                        {onPersonalUse && (
                                            <button
                                                onClick={() => { setIsMenuOpen(false); onPersonalUse(product); }}
                                                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors active:scale-95 transition-all duration-300"
                                            >
                                                <ShoppingCartIcon className="w-4 h-4" />
                                                Personal Use
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onPrintLabel(product); }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors active:scale-95 transition-all duration-300"
                                        >
                                            <PrinterIcon className="w-4 h-4" />
                                            Print Label
                                        </button>
                                        {product.status === 'active' ? (
                                            <button
                                                onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                                                className="w-full text-left px-3 py-2 text-sm text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-3 transition-colors active:scale-95 transition-all duration-300"
                                            >
                                                <ArchiveBoxIcon className="w-4 h-4" />
                                                Archive
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setIsMenuOpen(false); onArchive(product.id); }}
                                                className="w-full text-left px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 transition-colors active:scale-95 transition-all duration-300"
                                            >
                                                <RestoreIcon className="w-4 h-4" />
                                                Restore
                                            </button>
                                        )}
                                        <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onDelete(product); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-500/10 flex items-center gap-3 transition-all active:scale-95"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default ProductDetailHeader;
