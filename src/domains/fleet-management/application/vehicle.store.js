/**
 * @file vehicle.store.js
 * @description **Vehicle Store (Pinia)**
 *
 * This store manages all vehicle-related state and operations in the AutoService application.
 * Responsibilities:
 * - Fetching vehicles from the backend
 * - Creating and updating vehicles
 * - Maintaining the list of vehicles in a reactive state
 */

import { defineStore } from 'pinia';
import { VehicleService } from '../infrastructure/vehicle.service';
import { createVehicle } from '../domain/vehicle.entity';

/**
 * Vehicle Management Store using Pinia.
 *
 * @typedef {Object} VehicleStoreState
 * @property {Array<Object>} vehicles - List of all vehicles
 * @property {boolean} loading - Loading state for async operations
 */
export const useVehicleStore = defineStore('vehicle', {
    state: () => ({
        vehicles: [],
        loading: false
    }),

    actions: {
        /**
         * Fetches all vehicles from the backend and updates the store.
         *
         * Each vehicle is transformed using the Vehicle entity to ensure
         * data consistency and business rules are applied.
         *
         * @returns {Promise<void>}
         */
        async fetchVehicles() {
            this.loading = true;
            try {
                const response = await VehicleService.getAll();
                this.vehicles = response.data.map(v => createVehicle(v));
            } catch (error) {
                console.error('vehicles.errors.load', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Creates a new vehicle and adds it to the store.
         *
         * @param {Object} vehicleData - Raw vehicle data from the form
         * @returns {Promise<Object>} The newly created vehicle (as entity)
         */
        async addVehicle(vehicleData) {
            try {
                const vehicle = createVehicle(vehicleData);
                const response = await VehicleService.create(vehicle);
                this.vehicles.push(response.data);
                return response.data;
            } catch (error) {
                console.error('vehicles.errors.create', error);
                throw error;
            }
        },

        /**
         * Updates an existing vehicle's information.
         *
         * @param {string|number} id - ID of the vehicle to update
         * @param {Object} vehicleData - Updated vehicle data
         * @returns {Promise<void>}
         */
        async updateVehicle(id, vehicleData) {
            try {
                const response = await VehicleService.update(id, vehicleData);
                const index = this.vehicles.findIndex(v => String(v.id) === String(id));
                if (index !== -1) {
                    this.vehicles.splice(index, 1, response.data);
                }
            } catch (error) {
                console.error('vehicles.errors.update', error);
                throw error;
            }
        }
    }
});
