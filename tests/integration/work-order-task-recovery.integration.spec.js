import { createPinia, setActivePinia } from 'pinia';
import { useTaskStore } from '../../src/domains/workshop-operations/application/task.store';
import { useWorkOrderStore } from '../../src/domains/workshop-operations/application/work-order.store';
import { createTask } from '../../src/domains/workshop-operations/domain/task.entity';
import http from '../../src/shared/infrastructure/http-common';

vi.mock('../../src/shared/infrastructure/http-common', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn()
    }
}));

describe('Work order and task integration: price update recovery', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.resetAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('preserves a completed task and allows retrying the failed order price update', async () => {
        const taskStore = useTaskStore();
        const orderStore = useWorkOrderStore();

        const originalTask = {
            id: 71,
            workOrderId: 300,
            description: 'Cambio de componentes de freno',
            status: 'IN_PROGRESS',
            laborPrice: 150,
            laborCost: 60,
            parts: [
                {
                    inventoryItemId: 9,
                    name: 'Componente de freno',
                    quantity: 2,
                    unitPrice: 100,
                    purchasePrice: 60
                }
            ]
        };

        taskStore.tasks = [createTask(originalTask)];

        orderStore.workOrders = [
            {
                id: 300,
                description: 'Mantenimiento de frenos',
                estimatedDate: '2026-11-01',
                status: 'IN_PROGRESS',
                price: 100,
                qaChecklist: {
                    tasksCompleted: false
                }
            }
        ];

        const originalOrders = JSON.parse(
            JSON.stringify(orderStore.workOrders)
        );

        http.patch.mockResolvedValueOnce({
            data: {
                ...originalTask,
                status: 'COMPLETED',
                technicalDiagnosis: 'Componentes reemplazados',
                adminReviewStatus: 'SUBMITTED',
                customerReportStatus: 'HIDDEN'
            }
        });

        const completedTask = await taskStore.completeTaskFromMechanic(
            71,
            {
                technicalDiagnosis: 'Componentes reemplazados',
                customerExplanation: 'Reparación realizada',
                internalObservation: 'Pendiente de revisión',
                evidenceRegistered: 'frenos-final.jpg',
                parts: originalTask.parts
            }
        );

        expect(completedTask.totalRevenue).toBe(350);
        expect(completedTask.totalCost).toBe(180);
        expect(completedTask.profit).toBe(170);

        const failure = new Error('Actualización de precio no disponible');
        http.put.mockRejectedValueOnce(failure);

        await expect(
            orderStore.updateOrderAutoPrice(
                300,
                completedTask.totalRevenue
            )
        ).rejects.toBe(failure);

        expect(orderStore.workOrders).toEqual(originalOrders);
        expect(taskStore.tasks[0].status).toBe('COMPLETED');
        expect(taskStore.tasks[0].adminReviewStatus).toBe('SUBMITTED');
        expect(taskStore.saving).toBe(false);

        http.put.mockResolvedValueOnce({
            data: {
                id: 300,
                description: 'Mantenimiento de frenos',
                estimatedDate: '2026-11-01',
                status: 'IN_PROGRESS',
                price: 350,
                tasksCompleted: false
            }
        });

        await orderStore.updateOrderAutoPrice(
            300,
            completedTask.totalRevenue
        );

        expect(http.put).toHaveBeenCalledTimes(2);
        expect(http.put).toHaveBeenLastCalledWith(
            '/workorders/300',
            expect.objectContaining({
                price: 350,
                status: 'IN_PROGRESS'
            })
        );

        expect(orderStore.workOrders[0].price).toBe(350);
        expect(taskStore.tasks).toHaveLength(1);
        expect(taskStore.tasks[0].status).toBe('COMPLETED');

        // El reintento del precio no vuelve a completar la tarea.
        expect(http.patch).toHaveBeenCalledTimes(1);
    });
});