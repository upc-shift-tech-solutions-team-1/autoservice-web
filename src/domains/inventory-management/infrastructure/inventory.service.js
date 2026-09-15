import http from '../../../shared/infrastructure/http-common';

const toNumber = (value, fallback = 0) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const toInteger = (value, fallback = 0) => {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

/**
 * Builds the inventory catalog request expected by the backend.
 *
 * Physical stock is intentionally excluded because it can only
 * change through provider receipts or approved task consumption.
 *
 * Calculated properties such as unit profit and margin percentage
 * are not sent because the backend calculates them.
 *
 * @param {Object} data
 * @returns {Object}
 */
const createInventoryPayload = (data = {}) => ({
    name: String(data.name || '').trim(),
    category: String(data.category || 'SPARE_PART')
        .trim()
        .toUpperCase(),
    brand: String(data.brand || 'GENERIC').trim(),

    purchasePrice: toNumber(data.purchasePrice),
    unitPrice: toNumber(data.unitPrice),

    qualityTier: String(data.qualityTier || 'STANDARD')
        .trim()
        .toUpperCase(),
    specification: String(data.specification || '').trim(),
    presentation: String(data.presentation || '').trim(),
    unitMeasure: String(data.unitMeasure || 'UNIT')
        .trim()
        .toUpperCase(),

    minStock: toInteger(data.minStock, 5),
    image: data.image || data.imageUrl || ''
});

/**
 * Builds the request used to register a provider receipt.
 *
 * @param {Object} data
 * @returns {Object}
 */
const createReceiptPayload = (data = {}) => ({
    quantity: toInteger(data.quantity),
    providerName: String(data.providerName || '').trim(),
    documentNumber: String(data.documentNumber || '').trim() || null,
    notes: String(data.notes || '').trim() || null
});

export const InventoryService = {
    /**
     * Fetch all inventory items.
     *
     * @returns {Promise}
     */
    getAll() {
        return http.get('/inventoryitems');
    },

    /**
     * Fetch a single inventory item by ID.
     *
     * @param {number|string} id
     * @returns {Promise}
     */
    getById(id) {
        return http.get(`/inventoryitems/${id}`);
    },

    /**
     * Create a new inventory catalog item.
     *
     * New items are created with zero physical stock.
     *
     * @param {Object} data
     * @returns {Promise}
     */
    create(data) {
        return http.post(
            '/inventoryitems',
            createInventoryPayload(data)
        );
    },

    /**
     * Update catalog, technical and financial information.
     *
     * Physical stock is preserved by the backend.
     *
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise}
     */
    update(id, data) {
        return http.put(
            `/inventoryitems/${id}`,
            createInventoryPayload(data)
        );
    },

    /**
     * Register a provider receipt and increase physical stock.
     *
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise}
     */
    receiveStock(id, data) {
        return http.post(
            `/inventoryitems/${id}/receipts`,
            createReceiptPayload(data)
        );
    },

    /**
     * Delete an inventory item by ID.
     *
     * @param {number|string} id
     * @returns {Promise}
     */
    delete(id) {
        return http.delete(`/inventoryitems/${id}`);
    }
};