import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useVehicleStore } from '../../src/domains/fleet-management/application/vehicle.store';
import { useWorkOrderStore } from '../../src/domains/workshop-operations/application/work-order.store';
import { useTaskStore } from '../../src/domains/workshop-operations/application/task.store';
import { createVehicle } from '../../src/domains/fleet-management/domain/vehicle.entity';
import { createWorkOrder } from '../../src/domains/workshop-operations/domain/work-order.entity';
import http from '../../src/shared/infrastructure/http-common';
import { VehicleService } from '../../src/domains/fleet-management/infrastructure/vehicle.service';

vi.mock('../../src/shared/infrastructure/http-common', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn()
    }
}));

vi.mock('../../src/domains/fleet-management/infrastructure/vehicle.service', () => ({
    VehicleService: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
    }
}));

describe('Fleet Management & Workshop Operations Integration', () => {
    let pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should link a vehicle to an active work order and coordinate status transition across stores', async () => {
        // Arrange: 1. Setup vehicle in Fleet Management store
        const vehicleStore = useVehicleStore();
        const vehicle = createVehicle({
            id: 10,
            plate: 'ABC-1234',
            brand: 'Toyota',
            model: 'Corolla',
            year: 2022,
            customerId: 5,
            status: 'IN_WORKSHOP'
        });
        vehicleStore.vehicles = [vehicle];

        // 2. Setup active work order in Workshop Operations linked to vehicle
        const workOrderStore = useWorkOrderStore();
        const workOrder = createWorkOrder({
            id: 100,
            vehicleId: 10,
            customerId: 5,
            description: 'Mantenimiento general 30,000 km',
            status: 'IN_PROGRESS',
            price: 350
        });
        workOrderStore.workOrders = [workOrder];

        const taskStore = useTaskStore();

        // 3. Add tasks to the work order
        taskStore.tasks = [
            {
                id: 1,
                workOrderId: 100,
                description: 'Cambio de aceite',
                status: 'COMPLETED'
            },
            {
                id: 2,
                workOrderId: 100,
                description: 'Alineación y balanceo',
                status: 'COMPLETED'
            }
        ];

        // Act 1: Verify all tasks for the vehicle's work order are completed
        const vehicleTasks = taskStore.tasks.filter(t => t.workOrderId === workOrder.id);
        const allCompleted = vehicleTasks.every(t => t.status === 'COMPLETED');
        expect(allCompleted).toBe(true);

        // Act 2: Transition work order to FINISHED and vehicle to READY
        http.put.mockResolvedValueOnce({
            data: {
                ...workOrder,
                status: 'DELIVERED',
                tasksCompleted: true,
                sparePartsChecked: true,
                diagnosisValidated: true,
                cleaningDone: true,
                finalTestDone: true
            }
        });

        await workOrderStore.updateWorkOrderChecklist(100, {
            status: 'DELIVERED',
            qaChecklist: {
                tasksCompleted: true,
                sparePartsChecked: true,
                diagnosisValidated: true,
                cleaningDone: true,
                finalTestDone: true
            }
        });

        const updatedVehicle = {
            ...vehicle,
            status: 'READY'
        };
        VehicleService.update.mockResolvedValueOnce({ data: updatedVehicle });

        await vehicleStore.updateVehicle(10, updatedVehicle);

        // Assert: Vehicle status is READY and Work Order is DELIVERED
        expect(workOrderStore.workOrders[0].status).toBe('DELIVERED');
        expect(workOrderStore.workOrders[0].qaChecklist.finalTestDone).toBe(true);
        expect(vehicleStore.vehicles[0].status).toBe('READY');
    });

    it('should find vehicle active work orders and associated tasks', () => {
        const vehicleStore = useVehicleStore();
        const workOrderStore = useWorkOrderStore();
        const taskStore = useTaskStore();

        vehicleStore.vehicles = [
            createVehicle({ id: 1, plate: 'AAA-111', brand: 'Nissan' }),
            createVehicle({ id: 2, plate: 'BBB-222', brand: 'Mazda' })
        ];

        workOrderStore.workOrders = [
            createWorkOrder({ id: 50, vehicleId: 1, status: 'IN_PROGRESS' }),
            createWorkOrder({ id: 51, vehicleId: 2, status: 'PENDING' })
        ];

        taskStore.tasks = [
            { id: 10, workOrderId: 50, description: 'Revisión frenos' },
            { id: 11, workOrderId: 50, description: 'Cambio líquido' },
            { id: 12, workOrderId: 51, description: 'Diagnóstico eléctrico' }
        ];

        // Find work order for vehicle 1
        const activeOrderVehicle1 = workOrderStore.workOrders.find(o => o.vehicleId === 1);
        expect(activeOrderVehicle1).toBeDefined();
        expect(activeOrderVehicle1.id).toBe(50);

        // Find tasks for vehicle 1
        const tasksVehicle1 = taskStore.tasks.filter(t => t.workOrderId === activeOrderVehicle1.id);
        expect(tasksVehicle1).toHaveLength(2);
        expect(tasksVehicle1.map(t => t.id)).toEqual([10, 11]);
    });
});
