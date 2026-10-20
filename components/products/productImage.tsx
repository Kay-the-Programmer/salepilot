import React from 'react';
import { Product } from '../../types';

/**
 * What to draw where a product's picture goes.
 *
 * Two things were tangled up here. Ten screens each decided for themselves
 * what an image-less product looks like — a shopping cart on the POS tiles, a
 * box glyph in the alerts list, nothing at all in the detail view — so the
 * same product looked like three different kinds of missing depending on where
 * you saw it.
 *
 * And most products never reached those fallbacks anyway: the seed writes
 * `/images/salepilot.png` into `image_urls`, so a shop full of unphotographed
 * stock renders as a wall of identical SalePilot logos. That is worse than an
 * empty frame — it reads as a product photo, just a wrong one, and it hides
 * which items actually still need photographing.
 *
 * So the placeholder URL is treated as what it is — no image — and every
 * screen draws the same icon when there is nothing to show.
 */

/**
 * Stand-ins the server ships that mean "no picture yet". Matched on the path
 * so it holds whether the row stored a relative or an absolute URL.
 */
const PLACEHOLDER_PATHS = ['/images/salepilot.png'];

const isPlaceholder = (url: string): boolean => {
    const path = url.replace(/[{}]/g, '').split('?')[0];
    return PLACEHOLDER_PATHS.some(p => path.endsWith(p));
};

/**
 * The product's own picture, or null when it has none.
 *
 * Postgres array literals occasionally arrive with their braces still on, so
 * those are stripped here rather than at each call site.
 */
export const productImageUrl = (product: Pick<Product, 'imageUrls'> | null | undefined): string | null => {
    const raw = product?.imageUrls?.[0];
    if (!raw) return null;
    const url = String(raw).replace(/[{}]/g, '').trim();
    if (!url || isPlaceholder(url)) return null;
    return url;
};

/** True when there is a real picture to show. */
export const hasProductImage = (product: Pick<Product, 'imageUrls'> | null | undefined): boolean =>
    productImageUrl(product) !== null;

/**
 * The one placeholder mark: a shopping bag with a tick, which reads as "stock
 * item" rather than as a brand. Inherits `currentColor` and the font size, so
 * a caller sizes it with `className` like any other icon.
 */
export const ProductPlaceholderIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        className={className ?? 'w-6 h-6'}
        {...props}
    >
        <path d="M269-120q-30 0-52-20t-27-49l-70-491h120v-80q0-33 23.5-56.5T320-840h320q33 0 56.5 23.5T720-760v80h120l-70 491q-5 29-27.5 49T690-120H269Zm-57-480 57 400h422l57-400H212Zm226 320 198-198-57-56-141 141-57-57-57 57 114 113ZM320-680h320v-80H320v80Zm160 280Z" />
    </svg>
);

export default ProductPlaceholderIcon;
