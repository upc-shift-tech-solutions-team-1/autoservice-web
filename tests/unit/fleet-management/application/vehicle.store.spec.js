import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useVehicleStore } from '../../../../src/domains/fleet-management/application/vehicle.store';
import { VehicleService } from '../../../../src/domains/fleet-management/infrastructure/vehicle.service';

vi.mock('../../../../src/domains/fleet-management/infrastructure/vehicle.service', () => ({
    VehicleService: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
    }
}));

describe('Vehicle Store (Fleet Management Application)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const store = useVehicleStore();
        expect(store.vehicles).toEqual([]);
        expect(store.loading).toBe(false);
    });

    it('should fetch vehicles, normalize them through createVehicle, and update store state', async () => {
        const rawVehicles = [
            { id: 1, plate: 'ABC-123', brand: 'Toyota', model: 'Corolla', year: 2021 },
            { id: 2, plate: 'XYZ-789', brand: 'Nissan', model: 'Sentra', year: 2020 }
        ];
        VehicleService.getAll.mockResolvedValueOnce({ data: rawVehicles });

        const store = useVehicleStore();
        await store.fetchVehicles();

        expect(VehicleService.getAll).toHaveBeenCalledTimes(1);
        expect(store.loading).toBe(false);
        expect(store.vehicles).toHaveLength(2);
        expect(store.vehicles[0].plate).toBe('ABC-123');
        expect(store.vehicles[0].color).toBe('');
        expect(store.vehicles[1].brand).toBe('Nissan');
    });

    it('should handle errors during fetchVehicles and reset loading state', async () => {
        const error = new Error('Network error');
        VehicleService.getAll.mockRejectedValueOnce(error);

        const store = useVehicleStore();

        await expect(store.fetchVehicles()).rejects.toThrow('Network error');
        expect(store.loading).toBe(false);
        expect(store.vehicles).toHaveLength(0);
    });

    it('should add a new vehicle and append it to store.vehicles', async () => {
        const inputData = {
            plate: 'NEW-001',
            brand: 'Hyundai',
            model: 'Tucson',
            year: 2024,
            customerId: 10
        };

        const createdVehicle = {
            id: 15,
            plate: 'NEW-001',
            brand: 'Hyundai',
            model: 'Tucson',
            year: 2024,
            color: '',
            status: '',
            customerId: 10,
            image: ''
        };

        VehicleService.create.mockResolvedValueOnce({ data: createdVehicle });

        const store = useVehicleStore();
        const result = await store.addVehicle(inputData);

        expect(VehicleService.create).toHaveBeenCalledWith(expect.objectContaining({
            plate: 'NEW-001',
            brand: 'Hyundai',
            model: 'Tucson',
            year: 2024,
            customerId: 10
        }));
        expect(result).toEqual(createdVehicle);
        expect(store.vehicles).toHaveLength(1);
        expect(store.vehicles[0].id).toBe(15);
    });

    it('should throw error and not mutate state when addVehicle fails', async () => {
        VehicleService.create.mockRejectedValueOnce(new Error('Validation failed'));

        const store = useVehicleStore();

        await expect(store.addVehicle({ plate: 'BAD-01' })).rejects.toThrow('Validation failed');
        expect(store.vehicles).toHaveLength(0);
    });

    it('should update an existing vehicle in store.vehicles in place', async () => {
        const store = useVehicleStore();
        store.vehicles = [
            { id: 1, plate: 'ABC-123', brand: 'Toyota', model: 'Corolla', status: 'IN_WORKSHOP' },
            { id: 2, plate: 'XYZ-789', brand: 'Nissan', model: 'Sentra', status: 'READY' }
        ];

        const updatedData = {
            id: 1,
            plate: 'ABC-123',
            brand: 'Toyota',
            model: 'Corolla GR',
            status: 'READY'
        };

        VehicleService.update.mockResolvedValueOnce({ data: updatedData });

        await store.updateVehicle(1, updatedData);

        expect(VehicleService.update).toHaveBeenCalledWith(1, updatedData);
        expect(store.vehicles[0].model).toBe('Corolla GR');
        expect(store.vehicles[0].status).toBe('READY');
        expect(store.vehicles[1].status).toBe('READY');
    });

    it('should throw error when updateVehicle fails', async () => {
        VehicleService.update.mockRejectedValueOnce(new Error('Update failed'));

        const store = useVehicleStore();
        store.vehicles = [{ id: 1, plate: 'ABC-123' }];

        await expect(store.updateVehicle(1, { plate: 'ABC-999' })).rejects.toThrow('Update failed');
    });
});
