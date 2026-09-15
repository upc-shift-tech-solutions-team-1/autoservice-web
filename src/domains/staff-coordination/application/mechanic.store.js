/**
 * @file mechanic.store.js
 * @description Mechanic Store (Pinia)
 *
 * Manages mechanic state and operations in the AutoService application.
 * Domain: Staff Coordination (DDD)
 * - Acts as application layer orchestrating data between UI and infrastructure services.
 *
 * Responsibilities:
 * - Fetch mechanics from backend
 * - Create, update, delete mechanics
 * - Maintain reactive mechanic list for assignment and management
 */

import { defineStore } from 'pinia';
import { MechanicService } from '../infrastructure/mechanic.service';
import { createMechanic } from '../domain/mechanic.entity';

/**
 * Mechanic store (Pinia)
 *
 * @typedef {Object} MechanicStoreState
 * @property {Array<Object>} mechanics
 * @property {boolean} loading
 */
export const useMechanicStore = defineStore('mechanic', {
    state: () => ({
        mechanics: [],
        loading: false
    }),

    actions: {
        /**
         * Fetch all mechanics from backend
         * @returns {Promise<void>}
         */
        async fetchMechanics() {
            this.loading = true;

            try {
                const response = await MechanicService.getAll();
                this.mechanics = response.data.map(createMechanic);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Add a new mechanic
         * @param {Object} mechanicData
         * @returns {Promise<Object>}
         */
        async addMechanic(mechanicData) {
            const payload = createMechanic(mechanicData);
            const response = await MechanicService.create(payload);

            this.mechanics.push(response.data);
            return response.data;
        },

        /**
         * Update an existing mechanic
         * @param {string|number} id
         * @param {Object} mechanicData
         * @returns {Promise<void>}
         */
        async updateMechanic(id, mechanicData) {
            const payload = createMechanic(mechanicData);
            const response = await MechanicService.update(id, payload);

            const index = this.mechanics.findIndex(m => String(m.id) === String(id));

            if (index !== -1) {
                this.mechanics.splice(index, 1, response.data);
            }
        },

        /**
         * Delete mechanic by ID
         * @param {string|number} id
         * @returns {Promise<void>}
         */
        async deleteMechanic(id) {
            await MechanicService.delete(id);
            this.mechanics = this.mechanics.filter(m => String(m.id) !== String(id));
        }
    }
});