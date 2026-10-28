import { describe, it, expect } from 'vitest';
import { createVehicle } from '../../../../src/domains/fleet-management/domain/vehicle.entity';

describe('Vehicle Entity (Fleet Management Domain)', () => {
    it('should create a vehicle with default values when empty data or no argument is provided', () => {
        const vehicleFromEmpty = createVehicle();

        expect(vehicleFromEmpty).toBeDefined();
        expect(vehicleFromEmpty).toEqual({
            id: null,
            plate: '',
            brand: '',
            model: '',
            year: '',
            color: '',
            status: '',
            customerId: null,
            image: ''
        });

        const vehicleFromEmptyObject = createVehicle({});
        expect(vehicleFromEmptyObject).toEqual({
            id: null,
            plate: '',
            brand: '',
            model: '',
            year: '',
            color: '',
            status: '',
            customerId: null,
            image: ''
        });
    });

    it('should normalize vehicle properties and preserve provided attributes', () => {
        const rawData = {
            id: 'V-101',
            plate: 'ABC-1234',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2023',
            color: 'Red Metallic',
            status: 'IN_WORKSHOP',
            customerId: 'CUST-88',
            image: 'https://example.com/toyota.jpg'
        };

        const vehicle = createVehicle(rawData);

        expect(vehicle.id).toBe('V-101');
        expect(vehicle.plate).toBe('ABC-1234');
        expect(vehicle.brand).toBe('Toyota');
        expect(vehicle.model).toBe('Corolla');
        expect(vehicle.year).toBe('2023');
        expect(vehicle.color).toBe('Red Metallic');
        expect(vehicle.status).toBe('IN_WORKSHOP');
        expect(vehicle.customerId).toBe('CUST-88');
        expect(vehicle.image).toBe('https://example.com/toyota.jpg');
    });

    it('should handle partial input by filling unspecified fields with defaults', () => {
        const partialData = {
            plate: 'XYZ-987',
            brand: 'Honda'
        };

        const vehicle = createVehicle(partialData);

        expect(vehicle.plate).toBe('XYZ-987');
        expect(vehicle.brand).toBe('Honda');
        expect(vehicle.id).toBeNull();
        expect(vehicle.model).toBe('');
        expect(vehicle.year).toBe('');
        expect(vehicle.color).toBe('');
        expect(vehicle.status).toBe('');
        expect(vehicle.customerId).toBeNull();
        expect(vehicle.image).toBe('');
    });
});
