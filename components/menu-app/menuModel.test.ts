import { describe, expect, it } from 'vitest';
import {
    MENU_CSV_TEMPLATE,
    makeSkuMinter,
    parseMenuCsv,
    parseMenuPrice,
    sectionsIn,
    sortSections,
} from './menuModel';
import type { Category } from '../../types';

/**
 * Reading a restaurant's own menu file is the part of this feature most likely
 * to go quietly wrong, and the failure is invisible: a dish the kitchen is
 * cooking is simply not on the till, and nobody finds out until a customer
 * orders it. So the parser is tested against the shapes people actually send.
 */
describe('parseMenuPrice', () => {
    it('reads money as a person types it', () => {
        expect(parseMenuPrice('45')).toBe(45);
        expect(parseMenuPrice('45.50')).toBe(45.5);
        expect(parseMenuPrice('K45')).toBe(45);
        expect(parseMenuPrice('ZMW 45.00')).toBe(45);
        expect(parseMenuPrice('1,250')).toBe(1250);
        expect(parseMenuPrice('45/=')).toBe(45);
        expect(parseMenuPrice(' 95 ')).toBe(95);
    });

    it('refuses what is not a price', () => {
        expect(parseMenuPrice('')).toBeNull();
        expect(parseMenuPrice('free')).toBeNull();
        expect(parseMenuPrice('-')).toBeNull();
        // A negative price would let an item pay the customer.
        expect(parseMenuPrice('-20')).toBeNull();
    });
});

describe('parseMenuCsv — a proper table', () => {
    it('reads the template we hand out', () => {
        const { rows, rejected } = parseMenuCsv(MENU_CSV_TEMPLATE);
        expect(rejected).toEqual([]);
        expect(rows).toHaveLength(5);
        expect(rows[0]).toMatchObject({ section: 'Starters', name: 'Chicken Wings', price: 65 });
        // Food is made to order; the drinks said yes.
        expect(rows[0].trackStock).toBe(false);
        expect(rows.find(r => r.name === 'Mosi Lager 375ml')?.trackStock).toBe(true);
    });

    it('accepts the column names people actually use', () => {
        const { rows } = parseMenuCsv('Category,Dish,Amount\nMains,Nshima & Beef,95');
        expect(rows[0]).toMatchObject({ section: 'Mains', name: 'Nshima & Beef', price: 95 });
    });

    it('carries the section down when the cell is left blank', () => {
        const { rows } = parseMenuCsv(
            'Section,Item,Price\nMains,Beef Stew,95\n,Chicken Curry,90\n,Fish,120',
        );
        expect(rows.map(r => r.section)).toEqual(['Mains', 'Mains', 'Mains']);
    });

    it('reports an unusable row instead of dropping it', () => {
        const { rows, rejected } = parseMenuCsv(
            'Section,Item,Price\nMains,Beef Stew,95\nMains,Mystery Dish,\nMains,,50',
        );
        expect(rows).toHaveLength(1);
        expect(rejected).toHaveLength(2);
        // Named and numbered, so the owner can go and look.
        expect(rejected[0]).toMatchObject({ line: 3 });
        expect(rejected[0].reason).toContain('Mystery Dish');
        expect(rejected[1].reason).toContain('No item name');
    });

    it('says which columns it ignored', () => {
        const { unknownHeaders } = parseMenuCsv('Section,Item,Price,Allergens\nMains,Fish,120,nuts');
        expect(unknownHeaders).toEqual(['Allergens']);
    });

    it('handles a quoted name containing a comma', () => {
        const { rows } = parseMenuCsv('Section,Item,Price\nMains,"Nshima, beef and relish",95');
        expect(rows[0].name).toBe('Nshima, beef and relish');
        expect(rows[0].price).toBe(95);
    });
});

describe('parseMenuCsv — a menu typed the way it is printed', () => {
    it('treats a line with no price as a section heading', () => {
        const { rows, rejected } = parseMenuCsv(
            ['Starters', 'Chicken Wings, 65', 'Soup of the day, 40', 'Main Courses', 'Beef Stew, 95'].join('\n'),
        );
        expect(rejected).toEqual([]);
        expect(rows).toEqual([
            { line: 2, section: 'Starters', name: 'Chicken Wings', price: 65, description: '', trackStock: false },
            { line: 3, section: 'Starters', name: 'Soup of the day', price: 40, description: '', trackStock: false },
            { line: 5, section: 'Main Courses', name: 'Beef Stew', price: 95, description: '', trackStock: false },
        ]);
    });

    it('does not mistake a digit in a name for the price', () => {
        const { rows } = parseMenuCsv('Drinks\n7Up 300ml, 15\nMosi Lager 375ml, 25');
        expect(rows[0]).toMatchObject({ name: '7Up 300ml', price: 15 });
        expect(rows[1]).toMatchObject({ name: 'Mosi Lager 375ml', price: 25 });
    });

    it('takes the last money-looking cell as the price', () => {
        const { rows } = parseMenuCsv('Mains\nGrilled Tilapia, whole fish with rice, 120');
        expect(rows[0]).toMatchObject({ name: 'Grilled Tilapia whole fish with rice', price: 120 });
    });

    it('ignores blank lines between sections', () => {
        const { rows } = parseMenuCsv('Starters\n\nWings, 65\n\n\nMains\n\nStew, 95');
        expect(rows.map(r => r.section)).toEqual(['Starters', 'Mains']);
    });

    it('reads an empty file as an empty menu rather than failing', () => {
        expect(parseMenuCsv('')).toEqual({ rows: [], rejected: [], unknownHeaders: [] });
        expect(parseMenuCsv('   \n  \n')).toEqual({ rows: [], rejected: [], unknownHeaders: [] });
    });
});

describe('sectionsIn', () => {
    it('lists sections once, in the order they first appear', () => {
        const { rows } = parseMenuCsv(
            'Section,Item,Price\nDrinks,Coke,15\nMains,Stew,95\ndrinks,Fanta,15\nMains,Fish,120',
        );
        // Case-insensitive, so "drinks" does not become a second section.
        expect(sectionsIn(rows)).toEqual(['Drinks', 'Mains']);
    });
});

describe('sortSections', () => {
    const cat = (id: string, name: string, sortOrder?: number): Category =>
        ({ id, name, parentId: null, attributes: [], sortOrder } as Category);

    it('puts a menu in the owner\'s order, not alphabetical', () => {
        const sorted = sortSections([
            cat('c', 'Desserts', 30),
            cat('a', 'Starters', 10),
            cat('b', 'Main Courses', 20),
        ]);
        expect(sorted.map(c => c.name)).toEqual(['Starters', 'Main Courses', 'Desserts']);
    });

    it('falls back to name order for a shop that never set one', () => {
        const sorted = sortSections([cat('b', 'Hardware'), cat('a', 'Drinks')]);
        expect(sorted.map(c => c.name)).toEqual(['Drinks', 'Hardware']);
    });
});

describe('makeSkuMinter', () => {
    it('never hands out a SKU already in use', () => {
        // The catalog has a UNIQUE index on (store, sku) and the server
        // defaults a missing one to '', so a clash is a dish that silently
        // refuses to save.
        const next = makeSkuMinter('MENU-', ['MENU-0001', 'MENU-0002', '']);
        expect(next()).toBe('MENU-0003');
        expect(next()).toBe('MENU-0004');
    });

    it('does not repeat itself across a whole menu upload', () => {
        const next = makeSkuMinter('SKU-', []);
        const minted = Array.from({ length: 80 }, () => next());
        expect(new Set(minted).size).toBe(80);
    });

    it('matches an existing SKU regardless of case', () => {
        const next = makeSkuMinter('menu-', ['MENU-0001']);
        expect(next()).toBe('menu-0002');
    });

    it('falls back to a usable prefix when the store has none', () => {
        expect(makeSkuMinter('', [])()).toBe('SKU-0001');
        expect(makeSkuMinter('   ', [])()).toBe('SKU-0001');
    });
});
