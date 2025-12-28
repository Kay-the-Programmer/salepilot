export const toSnakeCase = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(toSnakeCase);
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    const snakeCaseObj: any = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            const value = obj[key];

            // Handle special cases for optional fields - convert empty strings to null
            if (value === '' || value === undefined) {
                if (['cost_price', 'supplier_id', 'category_id', 'reorder_point'].includes(snakeKey)) {
                    snakeCaseObj[snakeKey] = null;
                } else if (snakeKey === 'image_urls' && (value === '' || value === undefined)) {
                    snakeCaseObj[snakeKey] = [];
                } else {
                    snakeCaseObj[snakeKey] = value === '' ? null : value;
                }
            } else {
                snakeCaseObj[snakeKey] = toSnakeCase(value);
            }
        }
    }
    return snakeCaseObj;
};