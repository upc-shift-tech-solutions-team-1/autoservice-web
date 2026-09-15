/**
 * @file customer.entity.js
 * @description **Customer Entity**
 *
 * Defines the Customer domain entity following Domain-Driven Design (DDD).
 * An Entity represents a core business object with identity and encapsulates
 * business rules and data structure for customers.
 *
 * The Customer entity acts as a factory function that normalizes and validates
 * customer data coming from forms, API responses, or local state.
 */

/**
 * Creates a normalized Customer entity.
 *
 * Ensures consistency in customer data structure throughout the application.
 * Provides default values for missing properties, preventing undefined errors
 * and maintaining data integrity across layers (Presentation → Application → Infrastructure).
 *
 * @param {Object} [data={}] - Raw customer data (from form, API, or database)
 * @param {string|number|null} [data.id] - Unique identifier for the customer
 * @param {string} [data.workshopId] - ID of the workshop this customer belongs to
 * @param {string} [data.fullName] - Customer's full name
 * @param {string} [data.dni] - National ID / Document number (e.g., DNI in Peru)
 * @param {string} [data.email] - Customer's email address
 * @param {string} [data.phone] - Customer's phone number
 *
 * @returns {Object} A normalized Customer entity with guaranteed properties
 *
 * @example
 * const newCustomer = Customer({
 *   fullName: "Juan Pérez",
 *   dni: "72345678",
 *   email: "juan.perez@email.com",
 *   phone: "987654321"
 * });
 */
export const Customer = (data = {}) => ({
    /** @type {string|number|null} Unique identifier of the customer */
    id: data.id || null,

    /** @type {string} ID of the workshop this customer is associated with */
    workshopId: data.workshopId || '',

    /** @type {string} Customer's complete name */
    fullName: data.fullName || '',

    /** @type {string} National identification document number (DNI, Passport, etc.) */
    dni: data.dni || '',

    /** @type {string} Customer's email address */
    email: data.email || '',

    /** @type {string} Customer's contact phone number */
    phone: data.phone || ''
});
