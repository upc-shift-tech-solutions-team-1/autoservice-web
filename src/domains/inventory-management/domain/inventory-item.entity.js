const QUALITY_TIERS = ['ECONOMY', 'STANDARD', 'PREMIUM'];

const toNumber = (value, fallback = 0) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const toInteger = (value, fallback = 0) => {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const roundToTwoDecimals = (value) =>
    Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Creates a normalized inventory item entity.
 * @param {Object} data
 * @returns {Object}
 */
export const createInventoryItem = (data = {}) => {
    const purchasePrice = toNumber(data.purchasePrice);
    const unitPrice = toNumber(data.unitPrice);

    const calculatedUnitProfit = roundToTwoDecimals(
        unitPrice - purchasePrice
    );

    const unitProfit =
        data.unitProfit !== undefined && data.unitProfit !== null
            ? toNumber(data.unitProfit)
            : calculatedUnitProfit;

    const calculatedMarginPercentage =
        unitPrice > 0
            ? roundToTwoDecimals((unitProfit / unitPrice) * 100)
            : 0;

    const marginPercentage =
        data.marginPercentage !== undefined &&
        data.marginPercentage !== null
            ? toNumber(data.marginPercentage)
            : calculatedMarginPercentage;

    const normalizedQualityTier = String(
        data.qualityTier || 'STANDARD'
    ).toUpperCase();

    return {
        id: data.id ?? null,
        sku: data.sku ?? null,
        name: String(data.name || '').trim(),
        category: String(data.category || 'SPARE_PART').toUpperCase(),
        brand: String(data.brand || 'GENERIC').trim(),

        purchasePrice: roundToTwoDecimals(purchasePrice),
        unitPrice: roundToTwoDecimals(unitPrice),
        unitProfit: roundToTwoDecimals(unitProfit),
        marginPercentage: roundToTwoDecimals(marginPercentage),

        qualityTier: QUALITY_TIERS.includes(normalizedQualityTier)
            ? normalizedQualityTier
            : 'STANDARD',

        specification: String(data.specification || '').trim(),
        presentation: String(data.presentation || '').trim(),
        unitMeasure: String(data.unitMeasure || 'UNIT').toUpperCase(),

        stock: toInteger(data.stock),
        minStock: toInteger(data.minStock, 5),

        image: data.image || data.imageUrl || ''
    };
};