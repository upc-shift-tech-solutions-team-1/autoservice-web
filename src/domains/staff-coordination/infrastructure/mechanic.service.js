/**
 * @file mechanic.service.js
 * @description Mechanic service (Infrastructure Layer - DDD)
 *
 * Repository-like service responsible for HTTP communication related to mechanics.
 * It isolates API logic from the application and presentation layers.
 */

import http from '../../../shared/infrastructure/http-common';

/**
 * Mechanic service (CRUD operations)
 */
export const MechanicService = {
    /**
     * Get all mechanics
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getAll() {
        return http.get('/mechanics');
    },

    /**
     * Create mechanic
     * @param {Object} data
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    create(data) {
        return http.post('/mechanics', data);
    },

    /**
     * Update mechanic
     * @param {string|number} id
     * @param {Object} data
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    update(id, data) {
        return http.put(`/mechanics/${id}`, data);
    },

    /**
     * Delete mechanic
     * @param {string|number} id
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    delete(id) {
        return http.delete(`/mechanics/${id}`);
    }
};