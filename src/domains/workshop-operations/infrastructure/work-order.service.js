/**
 * @file work-order.service.js
 * @description Work order API service layer.
 */

import http from '../../../shared/infrastructure/http-common';

export const WorkOrderService = {
    /**
     * Retrieves all work orders.
     *
     * @returns {Promise<Object>}
     */
    getAll() {
        return http.get('/workorders');
    },

    /**
     * Retrieves a work order by id.
     *
     * @param {string|number} id - Work order identifier.
     * @returns {Promise<Object>}
     */
    getById(id) {
        return http.get(`/workorders/${id}`);
    },

    /**
     * Creates a new work order.
     *
     * @param {Object} data - Work order payload.
     * @returns {Promise<Object>}
     */
    create(data) {
        return http.post('/workorders', data);
    },

    /**
     * Updates an existing work order.
     *
     * @param {string|number} id - Work order identifier.
     * @param {Object} data - Updated work order payload.
     * @returns {Promise<Object>}
     */
    update(id, data) {
        return http.put(`/workorders/${id}`, data);
    },

    /**
     * Deletes a work order.
     *
     * @param {string|number} id - Work order identifier.
     * @returns {Promise<Object>}
     */
    delete(id) {
        return http.delete(`/workorders/${id}`);
    }
};