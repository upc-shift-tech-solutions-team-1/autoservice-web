/**
 * @file mechanic.entity.js
 * @description Mechanic entity (Staff Coordination - DDD)
 *
 * Factory function that normalizes mechanic data from API, forms, or local state.
 * Ensures consistent structure and safe defaults across the application.
 */

/**
 * Creates a normalized Mechanic entity.
 *
 * @param {Object} [data={}]
 * @param {string|number} [data.id]
 * @param {string} [data.fullName]
 * @param {string} [data.specialty]
 * @param {number} [data.maxCapacity]
 * @param {string} [data.email]
 * @param {string} [data.password]
 *
 * @returns {Object}
 */
export const createMechanic = (data = {}) => ({
    id: data.id,
    fullName: data.fullName,
    specialty: data.specialty,
    maxCapacity: data.maxCapacity || 0,
    email: data.email || '',
    password: data.password || ''
});