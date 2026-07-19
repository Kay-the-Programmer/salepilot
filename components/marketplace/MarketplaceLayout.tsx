import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineBuildingStorefront, HiOutlineShoppingBag, HiOutlineClipboardDocumentList, HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2';

// B2B wholesale marketplace sections. The old mock B2B tabs (quick offers /
// requests / activity / retailers) were demo scaffolding with dead links —
// unlinked until those flows are real.
const SECTIONS = [
    { id: 'shop', label: 'Browse products', icon: HiOutlineShoppingBag },
    { id: 'suppliers', label: 'Suppliers', icon: HiOutlineBuildingStorefront },
    { id: 'my-orders', label: 'My orders', icon: HiOutlineClipboardDocumentList },
];

/**
 * Marketplace section nav as a hamburger menu: a burger button for the navy
 * header that opens a left slide-over drawer (same portal/backdrop/Escape/
 * scroll-lock conventions as the shop CartDrawer) listing the sections.
 */
export function MarketplaceNavMenu() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const searchParams = new URLSearchParams(location.search);
    const activeView = searchParams.get('view') || 'shop';
    const activeSection = SECTIONS.find(s => s.id === activeView) || SECTIONS[0];

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        window.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        panelRef.current?.focus();
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    const goTo = (viewId: string) => {
        // Preserve the current search (q) when hopping between views.
        const next = new URLSearchParams(location.search);
        next.set('view', viewId);
        setIsOpen(false);
        navigate(`/marketplace?${next.toString()}`);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Open marketplace menu"
                aria-expanded={isOpen}
                className="flex-none flex items-center gap-2 h-11 px-2.5 sm:px-3 rounded-lg text-white hover:bg-white/10 transition-colors active:scale-95"
            >
                <HiOutlineBars3 className="w-6 h-6" />
                <span className="hidden xl:flex items-center gap-1.5 text-sm font-semibold text-white/85">
                    <activeSection.icon className="w-[18px] h-[18px]" />
                    {activeSection.label}
                </span>
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-label="Marketplace menu">
                    {/* Backdrop (DESIGN.md overlays: dim + blur to focus the task) */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div
                        ref={panelRef}
                        tabIndex={-1}
                        className="absolute left-0 top-0 h-full w-full max-w-xs bg-surface shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 outline-none"
                    >
                        <div className="flex-none flex items-center justify-between pl-5 pr-3 h-16 bg-sp-navy text-white">
                            <h2 className="text-base font-bold uppercase tracking-[0.14em]">Marketplace</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                aria-label="Close menu"
                                className="w-12 h-12 flex items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
                            >
                                <HiOutlineXMark className="w-5 h-5" />
                            </button>
                        </div>

                        <nav aria-label="Marketplace sections" className="flex-1 overflow-y-auto p-3">
                            <ul className="space-y-1">
                                {SECTIONS.map(section => (
                                    <li key={section.id}>
                                        <button
                                            onClick={() => goTo(section.id)}
                                            aria-current={activeView === section.id ? 'page' : undefined}
                                            className={`
                                                w-full flex items-center gap-3 h-12 px-3.5 rounded-lg text-sm font-semibold transition-colors active:scale-[0.98]
                                                ${activeView === section.id
                                                    ? 'bg-sp-navy text-white'
                                                    : 'text-brand-text hover:bg-surface-variant'}
                                            `}
                                        >
                                            <section.icon className={`w-5 h-5 ${activeView === section.id ? 'text-sp-amber' : 'text-brand-text-muted'}`} />
                                            {section.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <div className="flex-none border-t border-brand-border p-4">
                            <p className="text-xs text-brand-text-muted mb-2.5">Have a business? Get your store online.</p>
                            <button
                                onClick={() => { setIsOpen(false); navigate('/register'); }}
                                className="w-full h-11 rounded-lg bg-sp-amber text-white text-sm font-bold hover:brightness-95 transition-all active:scale-[0.98]"
                            >
                                Sell on SalePilot
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

interface MarketplaceLayoutProps {
    children: React.ReactNode;
}

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
    return (
        <div className="min-h-[60vh] bg-background">
            {children}
        </div>
    );
}
