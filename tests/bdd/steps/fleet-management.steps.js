import { expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useVehicleStore } from '../../../src/domains/fleet-management/application/vehicle.store';
import { VehicleService } from '../../../src/domains/fleet-management/infrastructure/vehicle.service';
import { createVehicle } from '../../../src/domains/fleet-management/domain/vehicle.entity';

/**
 * Registers step definitions for the Fleet Management BDD suite.
 *
 * @param {ReturnType<import('../support/bdd-runner').createBddSuite>} suite
 */
export function registerFleetManagementSteps({ Given, When, Then, And }) {
    // ── SCENARIO 1: Register a new vehicle in the fleet ──

    Given('the fleet management system is initialized', async (context) => {
        setActivePinia(createPinia());
        context.vehicleStore = useVehicleStore();
        vi.spyOn(VehicleService, 'create').mockReset();
        vi.spyOn(VehicleService, 'getAll').mockReset();
        vi.spyOn(VehicleService, 'update').mockReset();
    });

    When(
        'an administrator registers a vehicle with plate {string}, brand {string}, model {string}, year {string}, and customer id {int}',
        async (context, plate, brand, model, year, customerId) => {
            const vehiclePayload = {
                id: 101,
                plate,
                brand,
                model,
                year,
                customerId,
                status: 'IN_WORKSHOP',
                color: 'Black',
                image: ''
            };

            vi.spyOn(VehicleService, 'create').mockResolvedValueOnce({
                data: vehiclePayload
            });

            context.createdVehicle = await context.vehicleStore.addVehicle({
                plate,
                brand,
                model,
                year,
                customerId,
                status: 'IN_WORKSHOP'
            });
        }
    );

    Then('the vehicle is added to the fleet', async (context) => {
        expect(context.createdVehicle).toBeDefined();
        expect(context.vehicleStore.vehicles).toHaveLength(1);
        expect(context.vehicleStore.vehicles[0].id).toBe(101);
    });

    And('the vehicle has plate {string} and brand {string}', async (context, expectedPlate, expectedBrand) => {
        expect(context.createdVehicle.plate).toBe(expectedPlate);
        expect(context.createdVehicle.brand).toBe(expectedBrand);
    });

    // ── SCENARIO 2: Filter and query vehicles by workshop status ──

    Given('the workshop has vehicles with statuses {string}, {string}, and {string}', async (context, status1, status2, status3) => {
        setActivePinia(createPinia());
        context.vehicleStore = useVehicleStore();

        context.mockVehicles = [
            createVehicle({ id: 1, plate: 'ABC-1234', brand: 'Toyota', status: status1 }),
            createVehicle({ id: 2, plate: 'DEF-5678', brand: 'Nissan', status: status2 }),
            createVehicle({ id: 3, plate: 'GHI-9012', brand: 'Hyundai', status: status3 })
        ];

        vi.spyOn(VehicleService, 'getAll').mockResolvedValueOnce({
            data: context.mockVehicles
        });
    });

    When('an administrator queries the vehicles in the fleet', async (context) => {
        await context.vehicleStore.fetchVehicles();
    });

    Then('the fleet contains {int} vehicles', async (context, expectedCount) => {
        expect(context.vehicleStore.vehicles).toHaveLength(expectedCount);
    });

    And('the vehicle with plate {string} has status {string}', async (context, plate, expectedStatus) => {
        const vehicle = context.vehicleStore.vehicles.find(v => v.plate === plate);
        expect(vehicle).toBeDefined();
        expect(vehicle.status).toBe(expectedStatus);
    });

    // ── SCENARIO 3: Update vehicle details in the fleet ──

    Given('a vehicle with id {int} exists in the fleet with plate {string} and status {string}', async (context, id, plate, status) => {
        setActivePinia(createPinia());
        context.vehicleStore = useVehicleStore();

        const initialVehicle = createVehicle({
            id,
            plate,
            brand: 'Toyota',
            model: 'Corolla',
            status
        });

        context.vehicleStore.vehicles = [initialVehicle];
        context.targetVehicleId = id;
    });

    When('the vehicle status is updated to {string}', async (context, newStatus) => {
        const updatedVehicle = {
            id: context.targetVehicleId,
            plate: 'ABC-1234',
            brand: 'Toyota',
            model: 'Corolla',
            status: newStatus
        };

        vi.spyOn(VehicleService, 'update').mockResolvedValueOnce({
            data: updatedVehicle
        });

        await context.vehicleStore.updateVehicle(context.targetVehicleId, updatedVehicle);
    });

    Then('the vehicle status in the fleet is {string}', async (context, expectedStatus) => {
        const vehicle = context.vehicleStore.vehicles.find(v => v.id === context.targetVehicleId);
        expect(vehicle).toBeDefined();
        expect(vehicle.status).toBe(expectedStatus);
    });
}
