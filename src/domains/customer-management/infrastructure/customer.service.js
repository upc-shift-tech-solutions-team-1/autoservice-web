/**
 * @file customer.service.js
 * @description **Customer Service (Infrastructure Layer)**
 *
 * This service acts as the bridge between the Application Layer and the external API.
 * It encapsulates all HTTP requests related to customers, following the Repository pattern
 * in Domain-Driven Design (DDD).
 *
 * Responsibilities:
 * - Handle all CRUD (Create, Read, Update, Delete) operations for customers
 * - Abstract the HTTP client implementation (Axios via http-common)
 * - Provide a clean interface for the Customer Store to consume
 */
import http from '../../../shared/infrastructure/http-common.js';

/**
 * Customer Service object containing all API operations for customers.
 *
 * This is a static service (not a class) that provides reusable methods
 * to interact with the backend customer endpoints.
 */
export const CustomerService = {
    /**
     * Retrieves all customers from the backend.
     *
     * Note: The shared HTTP interceptor automatically adds `workshopId`
     * to the request parameters for multi-workshop filtering.
     *
     * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to API response containing array of customers
     */
    getAll() {
        return http.get('/customers');
    },
    /**
     * Retrieves a single customer by its ID.
     *
     * @param {string|number} id - The unique identifier of the customer
     * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to API response with customer data
     */
    getById(id) {
        return http.get(`/customers/${id}`);
    },
    /**
     * Creates a new customer in the backend.
     *
     * @param {Object} customerData - Customer entity data to be created
     * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to API response with the created customer
     */
    create(customerData) {
        return http.post('/customers', customerData);
    },
    /**
     * Updates an existing customer's information.
     *
     * @param {string|number} id - ID of the customer to update
     * @param {Object} data - Updated customer data
     * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to API response with updated customer
     */
    update(id, data) {
        return http.put(`/customers/${id}`, data);
    },

    /**
     * Deletes a customer by ID.
     *
     * @param {string|number} id - ID of the customer to delete
     * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to API response (usually empty on success)
     */
    delete(id) {
        return http.delete(`/customers/${id}`);
    }
};