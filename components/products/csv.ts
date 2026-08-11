/**
 * Minimal RFC 4180 CSV reader.
 *
 * Written by hand rather than pulling in a parser dependency: the file is a few
 * dozen lines, and the cases that actually break naive `split(',')` — quoted
 * fields containing commas, escaped quotes, newlines inside quotes, and the
 * BOM Excel prepends — are all handled here.
 */

export interface ParsedCsv {
    headers: string[];
    rows: Record<string, string>[];
    /** Rows whose column count didn't match the header, reported not dropped. */
    malformed: { line: number; reason: string }[];
}

/** Splits raw CSV text into a grid, honouring quotes and embedded newlines. */
export const parseCsvGrid = (input: string): string[][] => {
    // Excel writes a UTF-8 BOM; left in place it becomes part of the first header.
    const text = input.replace(/^﻿/, '');
    const grid: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (inQuotes) {
            if (c === '"') {
                // "" inside a quoted field is a literal quote.
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else {
                field += c;
            }
            continue;
        }

        if (c === '"') { inQuotes = true; continue; }
        if (c === ',') { row.push(field); field = ''; continue; }
        if (c === '\r') continue; // CRLF → handled on the \n
        if (c === '\n') { row.push(field); grid.push(row); row = []; field = ''; continue; }
        field += c;
    }

    // Whatever is left after the last newline is the final row.
    if (field !== '' || row.length > 0) { row.push(field); grid.push(row); }
    return grid.filter(r => r.some(cell => cell.trim() !== ''));
};

/** Header text → canonical field name. Generous about how people label columns. */
const HEADER_ALIASES: Record<string, string> = {
    name: 'name', 'product': 'name', 'product name': 'name', 'item': 'name', 'item name': 'name', 'description name': 'name',
    sku: 'sku', code: 'sku', 'product code': 'sku', 'item code': 'sku',
    barcode: 'barcode', ean: 'barcode', upc: 'barcode',
    category: 'category', 'category name': 'category', group: 'category', department: 'category',
    price: 'price', 'selling price': 'price', 'sell price': 'price', 'unit price': 'price', 'retail price': 'price',
    'cost': 'costPrice', 'cost price': 'costPrice', 'buying price': 'costPrice', 'purchase price': 'costPrice',
    stock: 'stock', qty: 'stock', quantity: 'stock', 'stock qty': 'stock', 'on hand': 'stock', 'opening stock': 'stock',
    description: 'description', notes: 'description',
    brand: 'brand', make: 'brand',
    unit: 'unitOfMeasure', 'unit of measure': 'unitOfMeasure', uom: 'unitOfMeasure',
    'reorder point': 'reorderPoint', reorder: 'reorderPoint', 'reorder level': 'reorderPoint', 'min stock': 'reorderPoint',
};

export const canonicalField = (header: string): string | null =>
    HEADER_ALIASES[header.trim().toLowerCase()] ?? null;

/** The fields the importer understands, in the order the template writes them. */
export const IMPORT_FIELDS = [
    'name', 'sku', 'barcode', 'category', 'price', 'costPrice',
    'stock', 'description', 'brand', 'unitOfMeasure', 'reorderPoint',
] as const;

export type ImportField = typeof IMPORT_FIELDS[number];

export const FIELD_LABELS: Record<ImportField, string> = {
    name: 'Name *',
    sku: 'SKU',
    barcode: 'Barcode',
    category: 'Category',
    price: 'Selling price *',
    costPrice: 'Cost price',
    stock: 'Stock',
    description: 'Description',
    brand: 'Brand',
    unitOfMeasure: 'Unit',
    reorderPoint: 'Reorder point',
};

/**
 * Parses a CSV file into rows keyed by canonical field name, using the header
 * row to work out which column is which. Columns it doesn't recognise are
 * ignored rather than rejected, so an export from another system can be fed in
 * unedited as long as the essentials are present.
 */
export const parseProductCsv = (input: string, mapping?: Record<number, ImportField | ''>): ParsedCsv => {
    const grid = parseCsvGrid(input);
    if (grid.length === 0) return { headers: [], rows: [], malformed: [] };

    const headers = grid[0].map(h => h.trim());
    const columnField: (ImportField | null)[] = headers.map((h, i) => {
        if (mapping) return (mapping[i] || null) as ImportField | null;
        return canonicalField(h) as ImportField | null;
    });

    const rows: Record<string, string>[] = [];
    const malformed: { line: number; reason: string }[] = [];

    for (let r = 1; r < grid.length; r++) {
        const cells = grid[r];
        if (cells.length > headers.length) {
            malformed.push({
                line: r,
                reason: `Has ${cells.length} values but the header has ${headers.length} columns.`,
            });
            continue;
        }
        const row: Record<string, string> = {};
        columnField.forEach((field, i) => {
            if (!field) return;
            row[field] = (cells[i] ?? '').trim();
        });
        rows.push(row);
    }

    return { headers, rows, malformed };
};

/** A ready-to-fill template, so nobody has to guess the column names. */
export const buildTemplateCsv = (): string => {
    const header = 'name,sku,barcode,category,price,costPrice,stock,description,brand,unitOfMeasure,reorderPoint';
    const examples = [
        'Rice 5kg,RICE-5KG,6001234567890,Groceries,120.50,90,25,Long grain white rice,Sun Valley,unit,5',
        '"Cooking Oil, 2L",OIL-2L,,Groceries,85,60,10,,Golden,unit,3',
        'Tomatoes,,,Fresh Produce,15.99,,40,Sold by weight,,kg,10',
    ];
    return [header, ...examples].join('\n');
};
