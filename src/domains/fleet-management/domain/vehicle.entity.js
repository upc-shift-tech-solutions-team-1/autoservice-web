/**
 * @file vehicle.entity.js
 * @description **Vehicle Entity**
 *
 * Defines the Vehicle domain entity for the Fleet Management bounded context.
 * In Domain-Driven Design (DDD), the Vehicle entity represents a core business object
 * with its own identity. It acts as a factory function that normalizes and ensures
 * data consistency for all vehicle-related operations across the application.
 *
 * Responsibilities:
 * - Standardize vehicle data structure
 * - Provide default values for optional fields
 * - Act as a single source of truth for vehicle shape
 */

/**
 * Creates a normalized Vehicle entity.
 *
 * This factory function takes raw data (from forms, API responses, or local state)
 * and returns a clean, consistent vehicle object with guaranteed properties.
 *
 * @param {Object} [data={}] - Raw vehicle data
 * @param {string|number} [data.id] - Unique identifier of the vehicle
 * @param {string} [data.plate] - License plate number
 * @param {string} [data.brand] - Vehicle manufacturer
 * @param {string} [data.model] - Vehicle model
 * @param {string|number} [data.year] - Manufacturing year
 * @param {string} [data.color] - Vehicle color
 * @param {string} [data.status] - Current status (used in logic, do not replace with i18n here)
 * @param {string|number} [data.customerId] - ID of the owner customer
 * @param {string} [data.image] - URL to vehicle image
 *
 * @returns {Object} A normalized Vehicle entity
 *
 * @example
 * const newVehicle = createVehicle({
 *   plate: "ABC-123",
 *   brand: "Toyota",
 *   model: "Yaris",
 *   year: "2022",
 *   color: "Silver",
 *   customerId: "C-1"
 * });
 */
export function createVehicle(data = {}) {
    return {
        id: data.id || null,
        plate: data.plate || '',
        brand: data.brand || '',
        model: data.model || '',
        year: data.year || '',
        color: data.color || '',
        status: data.status || '',
        customerId: data.customerId || null,
        image: data.image || ''
    };
}
