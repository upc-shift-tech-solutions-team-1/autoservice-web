import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWorkOrderStore } from '../../../../src/domains/workshop-operations/application/work-order.store';
import { WorkOrderService } from '../../../../src/domains/workshop-operations/infrastructure/work-order.service';
import http from '../../../../src/shared/infrastructure/http-common';

vi.mock('../../../../src/domains/workshop-operations/infrastructure/work-order.service', () => ({
    WorkOrderService: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
    }
}));

vi.mock('../../../../src/shared/infrastructure/http-common', () => ({
    default: {
        put: vi.fn()
    }
}));

describe('WorkOrder Store (Workshop Operations Application)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('should fetch work orders and normalize them into the store state', async () => {
        // Arrange
        const mockApiResponse = {
            data: [
                { id: 1, trackingCode: 'TRK-101', status: 'PENDING', price: 200 },
                { id: 2, trackingCode: 'TRK-102', status: 'IN_PROGRESS', price: 500 }
            ]
        };
        WorkOrderService.getAll.mockResolvedValueOnce(mockApiResponse);

        const store = useWorkOrderStore();

        // Act
        await store.fetchWorkOrders();

        // Assert
        expect(store.loading).toBe(false);
        expect(store.workOrders).toHaveLength(2);
        expect(store.workOrders[0].id).toBe(1);
        expect(store.workOrders[0].qaChecklist).toBeDefined();
        expect(store.workOrders[1].trackingCode).toBe('TRK-102');
    });

    it('should add a new work order with safe integer IDs and formatted dates', async () => {
        // Arrange
        const store = useWorkOrderStore();
        const inputData = {
            vehicleId: '15',
            customerId: '22',
            mechanicId: '7',
            description: 'Cambio de amortiguadores',
            estimatedDate: new Date('2026-11-15T10:00:00Z')
        };

        const createdPayload = {
            id: 99,
            vehicleId: 15,
            customerId: 22,
            mechanicId: 7,
            description: 'Cambio de amortiguadores',
            estimatedDate: '2026-11-15',
            status: 'PENDING'
        };

        WorkOrderService.create.mockResolvedValueOnce({ data: createdPayload });

        // Act
        const result = await store.addWorkOrder(inputData);

        // Assert
        expect(WorkOrderService.create).toHaveBeenCalledWith(expect.objectContaining({
            vehicleId: 15,
            customerId: 22,
            mechanicId: 7,
            description: 'Cambio de amortiguadores',
            estimatedDate: '2026-11-15',
            status: 'PENDING'
        }));
        expect(result.id).toBe(99);
        expect(store.workOrders).toHaveLength(1);
        expect(store.workOrders[0].id).toBe(99);
    });

    it('should auto-update order price and transition status from PENDING to IN_PROGRESS', async () => {
        // Arrange
        const store = useWorkOrderStore();
        store.workOrders = [
            {
                id: 10,
                description: 'Alineación y balanceo',
                estimatedDate: '2026-10-25',
                status: 'PENDING',
                price: 0,
                qaChecklist: { tasksCompleted: false }
            }
        ];

        const updatedOrderResponse = {
            id: 10,
            description: 'Alineación y balanceo',
            estimatedDate: '2026-10-25',
            status: 'IN_PROGRESS',
            price: 180.5,
            tasksCompleted: false
        };

        http.put.mockResolvedValueOnce({ data: updatedOrderResponse });

        // Act
        await store.updateOrderAutoPrice(10, '180.50');

        // Assert
        expect(http.put).toHaveBeenCalledWith('/workorders/10', expect.objectContaining({
            status: 'IN_PROGRESS',
            price: 180.5
        }));
        expect(store.workOrders[0].status).toBe('IN_PROGRESS');
        expect(store.workOrders[0].price).toBe(180.5);
    });

    it('should update QA checklist flags and update local state upon response', async () => {
        // Arrange
        const store = useWorkOrderStore();
        store.workOrders = [
            {
                id: 5,
                description: 'Revisión técnica',
                status: 'IN_PROGRESS',
                qaChecklist: { tasksCompleted: false, diagnosisValidated: false }
            }
        ];

        const updateData = {
            description: 'Revisión técnica',
            status: 'IN_PROGRESS',
            price: 120,
            qaChecklist: {
                tasksCompleted: true,
                sparePartsChecked: true,
                diagnosisValidated: true,
                cleaningDone: true,
                finalTestDone: true
            }
        };

        http.put.mockResolvedValueOnce({
            data: {
                id: 5,
                ...updateData,
                tasksCompleted: true,
                sparePartsChecked: true,
                diagnosisValidated: true,
                cleaningDone: true,
                finalTestDone: true
            }
        });

        // Act
        await store.updateWorkOrderChecklist(5, updateData);

        // Assert
        expect(http.put).toHaveBeenCalledWith('/workorders/5', expect.objectContaining({
            tasksCompleted: true,
            diagnosisValidated: true
        }));
        expect(store.workOrders[0].qaChecklist.tasksCompleted).toBe(true);
        expect(store.workOrders[0].qaChecklist.finalTestDone).toBe(true);
    });
});
