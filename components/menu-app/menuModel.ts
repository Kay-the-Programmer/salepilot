/**
 * Menu model — the pure logic behind the Menu app.
 *
 * Kept free of React and of the API so the awkward parts (reading a
 * restaurant's spreadsheet, deciding what counts as a price) can be reasoned
 * about and tested on their own. A menu upload is one of those jobs where the
 * input is always slightly wrong — "K 45.00", "45/=", a blank row between
 * sections, a header the owner renamed — and silently dropping a dish is worse
 * than refusing the file.
 */
import type { Category, Product } from '../../types';
import { parseCsvGrid } from '../products/csv';

export interface MenuSectionView {
    category: Category | null;
    /** null is the "not in any section" bucket, which the till still sells from. */
    items: Product[];
}

/** Sections in menu order: sortOrder first, then name, as the API returns them. */
export const sortSections = (categories: Category[]): Category[] =>
    [...categories].sort((a, b) => {
        const ao = a.sortOrder ?? 0;
        const bo = b.sortOrder ?? 0;
        if (ao !== bo) return ao - bo;
        return a.name.localeCompare(b.name);
    });

/**
 * Group the catalog into menu sections.
 *
 * Items with no section are gathered at the end rather than hidden: an item
 * nobody filed is still an item the kitchen will be asked for, and a menu
 * screen that quietly omits it is how a dish ends up unsellable with no clue
 * why.
 */
export const buildMenu = (products: Product[], categories: Category[]): MenuSectionView[] => {
    const active = products.filter(p => p.status !== 'archived');
    const byCategory = new Map<string, Product[]>();
    const loose: Product[] = [];

    for (const p of active) {
        if (p.categoryId) {
            const list = byCategory.get(p.categoryId) || [];
            list.push(p);
            byCategory.set(p.categoryId, list);
        } else {
            loose.push(p);
        }
    }

    const byName = (a: Product, b: Product) => a.name.localeCompare(b.name);
    const sections: MenuSectionView[] = sortSections(categories).map(category => ({
        category,
        items: (byCategory.get(category.id) || []).sort(byName),
    }));

    if (loose.length > 0) sections.push({ category: null, items: loose.sort(byName) });
    return sections;
};

// --- Spreadsheet upload ---------------------------------------------------

export interface MenuImportRow {
    /** 1-based row in the file, so a complaint can be pointed at a line. */
    line: number;
    section: string;
    name: string;
    price: number;
    description: string;
    /** Whether this item counts stock. Drinks yes, food no. */
    trackStock: boolean;
}

export interface MenuImportResult {
    rows: MenuImportRow[];
    /** Rows that could not be used, with the reason, never silently dropped. */
    rejected: { line: number; raw: string; reason: string }[];
    /** Headers we could not place, so the owner can see we ignored them. */
    unknownHeaders: string[];
}

/** Header spellings a real restaurant's spreadsheet actually uses. */
const HEADER_ALIASES: Record<keyof Omit<MenuImportRow, 'line'>, string[]> = {
    section: ['section', 'category', 'menu section', 'course', 'group', 'type'],
    name: ['name', 'item', 'item name', 'dish', 'product', 'description of item', 'menu item'],
    price: ['price', 'amount', 'cost', 'selling price', 'unit price', 'rate'],
    description: ['description', 'details', 'notes', 'note'],
    trackStock: ['track stock', 'trackstock', 'counts stock', 'stock', 'track'],
};

const normalizeHeader = (h: string) => h.replace(/﻿/g, '').trim().toLowerCase();

/**
 * Money as typed by a person, not a machine: "K45", "45.00", "1,250", "45/=",
 * "ZMW 45". Anything with no digits in it is not a price.
 */
export const parseMenuPrice = (raw: string): number | null => {
    const cleaned = String(raw ?? '')
        .replace(/[^\d.,-]/g, '')   // drop K, ZMW, /=, spaces
        .replace(/,/g, '');          // thousands separators
    if (!cleaned || !/\d/.test(cleaned)) return null;
    const n = Number.parseFloat(cleaned);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100) / 100;
};

/** "yes"/"y"/"true"/"1" mean this item counts stock. Blank means it doesn't. */
export const parseTrackStockCell = (raw: string | undefined): boolean => {
    const s = String(raw ?? '').trim().toLowerCase();
    return ['yes', 'y', 'true', '1', 'tracked', 'track'].includes(s);
};

/**
 * Read an uploaded menu.
 *
 * Two shapes are accepted, because both are what people send:
 *
 *  1. A proper table with headers (Section, Item, Price…).
 *  2. A menu typed the way it is printed — a bare section name on its own line,
 *     then its dishes and prices under it. This has no headers at all, and
 *     rejecting it would mean telling a restaurant to retype its own menu.
 *
 * Items default to NOT counting stock, because most of a menu is made to
 * order; the Track stock column (or the switch on the item afterwards) turns
 * counting on for bottled drinks.
 */
export const parseMenuCsv = (text: string): MenuImportResult => {
    const grid = parseCsvGrid(text).filter(row => row.some(cell => String(cell ?? '').trim() !== ''));
    if (grid.length === 0) return { rows: [], rejected: [], unknownHeaders: [] };

    const headerCells = grid[0].map(normalizeHeader);
    const columnFor = (key: keyof typeof HEADER_ALIASES): number =>
        headerCells.findIndex(h => HEADER_ALIASES[key].includes(h));

    const idx = {
        section: columnFor('section'),
        name: columnFor('name'),
        price: columnFor('price'),
        description: columnFor('description'),
        trackStock: columnFor('trackStock'),
    };

    // A header row is only a header row if we can find both a name and a price
    // in it. Otherwise this is a printed menu and the first line is real data.
    const hasHeaders = idx.name >= 0 && idx.price >= 0;
    return hasHeaders
        ? parseTabular(grid, idx, headerCells)
        : parsePrintedMenu(grid);
};

const parseTabular = (
    grid: string[][],
    idx: Record<string, number>,
    headerCells: string[],
): MenuImportResult => {
    const rows: MenuImportRow[] = [];
    const rejected: MenuImportResult['rejected'] = [];

    const known = new Set(Object.values(idx).filter(i => i >= 0));
    const unknownHeaders = headerCells
        .map((h, i) => (known.has(i) || !h ? null : grid[0][i]))
        .filter((h): h is string => !!h);

    // The last section seen carries down, so a spreadsheet that names the
    // section once and leaves the cell blank for the rest of the dishes works.
    let carriedSection = '';

    for (let r = 1; r < grid.length; r++) {
        const row = grid[r];
        const line = r + 1;
        const at = (i: number) => (i >= 0 ? String(row[i] ?? '').trim() : '');

        const name = at(idx.name);
        const sectionCell = at(idx.section);
        if (sectionCell) carriedSection = sectionCell;

        if (!name) {
            rejected.push({ line, raw: row.join(', '), reason: 'No item name' });
            continue;
        }
        const price = parseMenuPrice(at(idx.price));
        if (price === null) {
            rejected.push({ line, raw: row.join(', '), reason: `No price for “${name}”` });
            continue;
        }

        rows.push({
            line,
            section: carriedSection,
            name: name.slice(0, 120),
            price,
            description: at(idx.description).slice(0, 500),
            trackStock: idx.trackStock >= 0 ? parseTrackStockCell(at(idx.trackStock)) : false,
        });
    }

    return { rows, rejected, unknownHeaders };
};

/**
 * A menu typed as it is printed: section headings on their own line, dishes
 * and prices beneath.
 *
 * A line is a heading when it has no price anywhere on it. That is the same cue
 * a customer uses reading the physical menu, and it means "Desserts" with an
 * empty price column is understood rather than thrown away.
 */
const parsePrintedMenu = (grid: string[][]): MenuImportResult => {
    const rows: MenuImportRow[] = [];
    const rejected: MenuImportResult['rejected'] = [];
    let section = '';

    for (let r = 0; r < grid.length; r++) {
        const cells = grid[r].map(c => String(c ?? '').trim()).filter(Boolean);
        const line = r + 1;
        if (cells.length === 0) continue;

        // The price is the LAST cell that reads as money, so "Nshima, beef,
        // 85" works and so does "Nshima 85".
        let priceIndex = -1;
        let price: number | null = null;
        for (let c = cells.length - 1; c >= 0; c--) {
            const parsed = parseMenuPrice(cells[c]);
            // A bare number is a price; a name containing digits ("7Up") is not,
            // which is why only a cell that is ENTIRELY money counts.
            if (parsed !== null && /^[^A-Za-z]*\d[^A-Za-z]*$/.test(cells[c])) {
                priceIndex = c;
                price = parsed;
                break;
            }
        }

        if (price === null) {
            // No money on this line: it is a section heading.
            section = cells.join(' ').slice(0, 120);
            continue;
        }

        const name = cells.filter((_, i) => i !== priceIndex).join(' ').trim();
        if (!name) {
            rejected.push({ line, raw: cells.join(', '), reason: 'A price with no item name' });
            continue;
        }

        rows.push({
            line,
            section,
            name: name.slice(0, 120),
            price,
            description: '',
            trackStock: false,
        });
    }

    return { rows, rejected, unknownHeaders: [] };
};

/** The template handed to someone who asks what the file should look like. */
export const MENU_CSV_TEMPLATE = [
    'Section,Item,Price,Description,Track stock',
    'Starters,Chicken Wings,65,Six wings with a dip,no',
    'Main Courses,Beef Stew & Nshima,95,,no',
    'Main Courses,Grilled Tilapia,120,Whole fish with rice,no',
    'Soft Drinks,Coca-Cola 300ml,15,,yes',
    'Beers & Ciders,Mosi Lager 375ml,25,,yes',
].join('\n');

/**
 * Mint SKUs for menu items.
 *
 * Every product needs one: the catalog has a UNIQUE index on (store, sku) and
 * the server defaults a missing sku to the empty string, so the second item
 * saved without one is rejected. The rest of the app mints `PREFIX + 5 random
 * digits`, which is fine for a product typed one at a time and not fine for a
 * sixty-line menu upload — at that size a clash is likely rather than rare, and
 * it would surface as a dish that mysteriously refused to save.
 *
 * So this counts upward from the SKUs already in use and hands out the next
 * free one. Deterministic, collision-free against what we can see, and the
 * server's own 409 still stands behind it.
 */
export const makeSkuMinter = (prefix: string, existing: Iterable<string>) => {
    const taken = new Set<string>();
    for (const sku of existing) {
        if (sku) taken.add(sku.trim().toLowerCase());
    }
    const base = (prefix || 'SKU-').trim() || 'SKU-';
    let n = 1;
    return (): string => {
        for (;;) {
            const candidate = `${base}${String(n).padStart(4, '0')}`;
            n += 1;
            if (!taken.has(candidate.toLowerCase())) {
                taken.add(candidate.toLowerCase());
                return candidate;
            }
        }
    };
};

/** Distinct section names in the upload, in first-seen order. */
export const sectionsIn = (rows: MenuImportRow[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of rows) {
        const name = r.section.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(name);
    }
    return out;
};
