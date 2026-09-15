/**
 * @file task.entity.js
 * @description Factory for task domain entity.
 */

const TASK_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
};

const REVIEW_STATUS = {
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
};

/**
 * Converts a value into a valid numeric value.
 *
 * @param {*} value - Raw numeric value.
 * @param {number} [fallback=0] - Value used when conversion fails.
 * @returns {number} Normalized numeric value.
 */
const toNumber = (value, fallback = 0) => {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : fallback;
};

/**
 * Converts a value into a valid integer value.
 *
 * @param {*} value - Raw integer value.
 * @param {number} [fallback=0] - Value used when conversion fails.
 * @returns {number} Normalized integer value.
 */
const toInteger = (value, fallback = 0) => {
    const parsedValue = Number.parseInt(value, 10);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : fallback;
};

/**
 * Rounds a numeric value to two decimal places.
 *
 * @param {number} value - Numeric value to round.
 * @returns {number} Rounded numeric value.
 */
const roundToTwoDecimals = (value) =>
    Math.round(
        (toNumber(value) + Number.EPSILON) * 100
    ) / 100;

/**
 * Normalizes text values used by domain states.
 *
 * @param {*} value - Raw text value.
 * @returns {string} Normalized text.
 */
const normalizeText = (value) =>
    String(value || '')
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s-]+/g, '_');

/**
 * Normalizes current and legacy task status values.
 *
 * @param {*} value - Raw task status.
 * @returns {string} Standard task status.
 */
const normalizeTaskStatus = (value) => {
    const normalizedValue = normalizeText(value);

    const statusAliases = {
        PENDING: TASK_STATUS.PENDING,
        PENDIENTE: TASK_STATUS.PENDING,

        IN_PROGRESS: TASK_STATUS.IN_PROGRESS,
        EN_PROCESO: TASK_STATUS.IN_PROGRESS,
        EN_EJECUCION: TASK_STATUS.IN_PROGRESS,

        COMPLETED: TASK_STATUS.COMPLETED,
        COMPLETADO: TASK_STATUS.COMPLETED,
        COMPLETADA: TASK_STATUS.COMPLETED,
        FINALIZADO: TASK_STATUS.COMPLETED,
        FINALIZADA: TASK_STATUS.COMPLETED
    };

    return (
        statusAliases[normalizedValue] ||
        normalizedValue ||
        TASK_STATUS.PENDING
    );
};

/**
 * Normalizes current and legacy administrative
 * review status values.
 *
 * @param {*} value - Raw review status.
 * @returns {string} Standard review status.
 */
const normalizeReviewStatus = (value) => {
    const normalizedValue = normalizeText(value);

    const reviewAliases = {
        SUBMITTED: REVIEW_STATUS.SUBMITTED,
        ENVIADO_AL_ADMINISTRADOR:
        REVIEW_STATUS.SUBMITTED,
        ENVIADA_AL_ADMINISTRADOR:
        REVIEW_STATUS.SUBMITTED,
        PENDIENTE_DE_APROBACION:
        REVIEW_STATUS.SUBMITTED,
        PENDIENTE_DE_REVISION:
        REVIEW_STATUS.SUBMITTED,
        ESPERANDO_COTIZACION:
        REVIEW_STATUS.SUBMITTED,
        PENDING_ADMIN_REVIEW:
        REVIEW_STATUS.SUBMITTED,

        APPROVED: REVIEW_STATUS.APPROVED,
        APROBADO: REVIEW_STATUS.APPROVED,
        APROBADA: REVIEW_STATUS.APPROVED,
        COTIZACION_APROBADA:
        REVIEW_STATUS.APPROVED,

        REJECTED: REVIEW_STATUS.REJECTED,
        RECHAZADO: REVIEW_STATUS.REJECTED,
        RECHAZADA: REVIEW_STATUS.REJECTED
    };

    return (
        reviewAliases[normalizedValue] ||
        normalizedValue
    );
};

/**
 * Normalizes a task part.
 *
 * @param {Object} part - Raw task part.
 * @returns {Object} Normalized task part.
 */
const normalizeTaskPart = (part = {}) => ({
    inventoryItemId:
        part.inventoryItemId ?? null,

    name: String(
        part.name || ''
    ).trim(),

    quantity: Math.max(
        1,
        toInteger(part.quantity, 1)
    ),

    unitPrice: Math.max(
        0,
        roundToTwoDecimals(
            part.unitPrice
        )
    ),

    purchasePrice: Math.max(
        0,
        roundToTwoDecimals(
            part.purchasePrice
        )
    ),

    brand: String(
        part.brand || 'GENERIC'
    ).trim(),

    qualityTier: String(
        part.qualityTier || 'STANDARD'
    ).toUpperCase()
});

/**
 * Calculates the material sale total from task parts.
 *
 * @param {Array} parts - Normalized task parts.
 * @returns {number} Material sale total.
 */
const calculateMaterialsRevenue = (parts) =>
    roundToTwoDecimals(
        parts.reduce(
            (total, part) =>
                total +
                (
                    part.unitPrice *
                    part.quantity
                ),
            0
        )
    );

/**
 * Calculates the material purchase total from task parts.
 *
 * @param {Array} parts - Normalized task parts.
 * @returns {number} Material purchase total.
 */
const calculateMaterialsPurchaseCost = (parts) =>
    roundToTwoDecimals(
        parts.reduce(
            (total, part) =>
                total +
                (
                    part.purchasePrice *
                    part.quantity
                ),
            0
        )
    );

/**
 * Uses a stored financial value when it contains useful
 * information. Otherwise, it uses the calculated value.
 *
 * @param {*} storedValue - Stored backend value.
 * @param {number} calculatedValue - Calculated fallback.
 * @returns {number} Resolved financial value.
 */
const resolveBaseFinancialValue = (
    storedValue,
    calculatedValue
) => {
    const storedNumber =
        roundToTwoDecimals(storedValue);

    if (
        storedNumber !== 0 ||
        calculatedValue === 0
    ) {
        return storedNumber;
    }

    return calculatedValue;
};

/**
 * Creates a normalized task entity.
 *
 * Derived financial values are always recalculated from
 * labor and material amounts to preserve domain consistency.
 *
 * @param {Object} [data={}] - Raw task data.
 * @returns {Object} Normalized task entity.
 */
export const createTask = (data = {}) => {
    const parts = Array.isArray(data.parts)
        ? data.parts.map(normalizeTaskPart)
        : [];

    const calculatedMaterialsRevenue =
        calculateMaterialsRevenue(parts);

    const calculatedMaterialsPurchaseCost =
        calculateMaterialsPurchaseCost(parts);

    /**
     * Amount charged to the customer for labor.
     */
    const laborPrice = Math.max(
        0,
        roundToTwoDecimals(
            data.laborPrice
        )
    );

    /**
     * Internal labor cost assumed by the workshop.
     */
    const laborCost = Math.max(
        0,
        roundToTwoDecimals(
            data.laborCost
        )
    );

    /**
     * Amount charged to the customer for materials.
     */
    const materialsCost =
        resolveBaseFinancialValue(
            data.materialsCost,
            calculatedMaterialsRevenue
        );

    /**
     * Purchase cost paid by the workshop for materials.
     */
    const materialsPurchaseCost =
        resolveBaseFinancialValue(
            data.materialsPurchaseCost,
            calculatedMaterialsPurchaseCost
        );

    /**
     * Derived financial values must not depend on
     * potentially outdated backend totals.
     */
    const totalRevenue =
        roundToTwoDecimals(
            laborPrice +
            materialsCost
        );

    const totalCost =
        roundToTwoDecimals(
            laborCost +
            materialsPurchaseCost
        );

    const profit =
        roundToTwoDecimals(
            totalRevenue -
            totalCost
        );

    const marginPercentage =
        totalRevenue > 0
            ? roundToTwoDecimals(
                (
                    profit /
                    totalRevenue
                ) * 100
            )
            : 0;

    const rawReviewStatus =
        data.adminReviewStatus ??
        data.reviewStatus ??
        data.adminStatus ??
        data.taskReviewStatus ??
        '';

    return {
        id: data.id ?? null,

        workOrderId:
            data.workOrderId ?? null,

        mechanicId:
            data.mechanicId ?? null,

        description: String(
            data.description || ''
        ).trim(),

        status: normalizeTaskStatus(
            data.status
        ),

        priority: String(
            data.priority || 'MEDIUM'
        ).toUpperCase(),

        estimatedTime: Math.max(
            0,
            toInteger(
                data.estimatedTime
            )
        ),

        /**
         * Amount charged to the customer for labor.
         */
        laborPrice,

        /**
         * Internal labor cost assumed by the workshop.
         */
        laborCost,

        /**
         * Amount charged to the customer for materials.
         */
        materialsCost,

        /**
         * Purchase cost paid by the workshop for materials.
         */
        materialsPurchaseCost,

        /**
         * Total amount charged to the customer.
         */
        totalRevenue,

        /**
         * Total internal workshop cost.
         */
        totalCost,

        /**
         * Estimated profit or loss generated by the task.
         */
        profit,

        /**
         * Estimated profit margin over total revenue.
         */
        marginPercentage,

        technicalDiagnosis: String(
            data.technicalDiagnosis || ''
        ).trim(),

        customerExplanation: String(
            data.customerExplanation || ''
        ).trim(),

        internalObservation: String(
            data.internalObservation || ''
        ).trim(),

        evidenceRegistered:
            data.evidenceRegistered || '',

        adminReviewStatus:
            normalizeReviewStatus(
                rawReviewStatus
            ),

        customerReportStatus: String(
            data.customerReportStatus || ''
        ).toUpperCase(),

        materialRequestStatus: String(
            data.materialRequestStatus || ''
        ).toUpperCase(),

        completedAt:
            data.completedAt || null,

        photo:
            data.photo || null,

        parts
    };
};