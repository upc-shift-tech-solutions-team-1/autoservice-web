/**
 * @file work-order.entity.js
 * @description Factory for work order domain entity.
 */

/**
 * Creates a normalized work order entity.
 *
 * @param {Object} data - Raw work order data.
 * @returns {Object} Normalized work order entity.
 */
export const createWorkOrder = (data = {}) => ({
    id: data.id,

    workshopId: data.workshopId,

    trackingCode: data.trackingCode,

    vehicleId: data.vehicleId,

    customerId: data.customerId,

    mechanicId: data.mechanicId,

    description: data.description,

    status: data.status,

    price: data.price,

    estimatedDate: data.estimatedDate,

    startDate: data.startDate,

    qaChecklist: {
        tasksCompleted:
            data.tasksCompleted || false,

        sparePartsChecked:
            data.sparePartsChecked || false,

        diagnosisValidated:
            data.diagnosisValidated || false,

        cleaningDone:
            data.cleaningDone || false,

        finalTestDone:
            data.finalTestDone || false
    }
});