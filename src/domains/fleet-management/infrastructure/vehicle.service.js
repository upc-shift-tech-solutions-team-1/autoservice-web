/**
 * @file vehicle.service.js
 * @description **Vehicle Service (Infrastructure Layer)**
 *
 * Acts as the data access layer (Repository pattern) for vehicles.
 * Encapsulates all HTTP communication with the backend related to vehicles,
 * abstracting API calls from the rest of the application.
 *
 * Part of the **Fleet Management** domain - Infrastructure Layer.
 * Follows Domain-Driven Design principles by isolating external concerns
 * (HTTP requests, API endpoints) from the Application and Domain layers.
 */

import http from '../../../shared/infrastructure/http-common';

/**
 * Vehicle Service object containing all API operations for vehicles.
 *
 * Provides a clean, centralized interface for CRUD operations on vehicles.
 * The shared HTTP interceptor automatically injects `workshopId` where needed.
 */
export const VehicleService = {
    /**
     * Retrieves all vehicles from the backend.
     *
     * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to an array of vehicles
     */
    getAll() {
        return http.get('/vehicles');
    },

    /**
     * Retrieves a single vehicle by its ID.
     *
     * @param {string|number} id - Unique identifier of the vehicle
     * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to vehicle data
     */
    getById(id) {
        return http.get(`/vehicles/${id}`);
    },

    /**
     * Creates a new vehicle in the backend.
     *
     * @param {Object} vehicleData - Vehicle entity data to be created
     * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created vehicle
     */
    create(vehicleData) {
        return http.post('/vehicles', vehicleData);
    },

    /**
     * Updates an existing vehicle's information.
     *
     * @param {string|number} id - ID of the vehicle to update
     * @param {Object} vehicleData - Updated vehicle data
     * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the updated vehicle
     */
    update(id, vehicleData) {
        return http.put(`/vehicles/${id}`, vehicleData);
    }
};
