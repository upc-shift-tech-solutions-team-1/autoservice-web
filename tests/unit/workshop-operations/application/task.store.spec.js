import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTaskStore } from '../../../../src/domains/workshop-operations/application/task.store';
import http from '../../../../src/shared/infrastructure/http-common';

vi.mock('../../../../src/shared/infrastructure/http-common', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn()
    }
}));

describe('Task Store (Workshop Operations Application)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should fetch all tasks and normalize financial fields', async () => {
        // Arrange
        const store = useTaskStore();
        http.get.mockResolvedValueOnce({
            data: [
                {
                    id: 1,
                    description: 'Cambio de bujías',
                    status: 'PENDIENTE',
                    laborPrice: 60,
                    laborCost: 20
                }
            ]
        });

        // Act
        const tasks = await store.fetchAllTasks();

        // Assert
        expect(http.get).toHaveBeenCalledWith('/tasks');
        expect(store.loading).toBe(false);
        expect(tasks).toHaveLength(1);
        expect(tasks[0].status).toBe('PENDING'); // Normalized from PENDIENTE
        expect(tasks[0].totalRevenue).toBe(60);
        expect(tasks[0].totalCost).toBe(20);
        expect(tasks[0].profit).toBe(40);
    });

    it('should capture errors and update error state if fetchAllTasks fails', async () => {
        // Arrange
        const store = useTaskStore();
        const networkError = new Error('Network error');
        http.get.mockRejectedValueOnce(networkError);

        // Act
        const result = await store.fetchAllTasks();

        // Assert
        expect(result).toEqual([]);
        expect(store.loading).toBe(false);
        expect(store.error).toBe('Network error');
    });

    it('should fetch tasks filtered by mechanic ID', async () => {
        // Arrange
        const store = useTaskStore();
        http.get.mockResolvedValueOnce({
            data: [
                { id: 2, mechanicId: 10, description: 'Limpieza de inyectores', status: 'IN_PROGRESS' }
            ]
        });

        // Act
        await store.fetchTasksByMechanic(10);

        // Assert
        expect(http.get).toHaveBeenCalledWith('/tasks', {
            params: { mechanicId: 10 }
        });
        expect(store.tasks[0].mechanicId).toBe(10);
    });

    it('should add a task and append it to local tasks array with saving state management', async () => {
        // Arrange
        const store = useTaskStore();
        const newTaskData = {
            workOrderId: 5,
            description: 'Purga de frenos',
            laborPrice: 80,
            laborCost: 30
        };

        http.post.mockResolvedValueOnce({
            data: {
                id: 105,
                workOrderId: 5,
                description: 'Purga de frenos',
                laborPrice: 80,
                laborCost: 30,
                status: 'PENDING'
            }
        });

        // Act
        const created = await store.addTask(newTaskData);

        // Assert
        expect(store.saving).toBe(false);
        expect(created.id).toBe(105);
        expect(store.tasks).toHaveLength(1);
        expect(store.tasks[0].id).toBe(105);
        expect(store.tasks[0].profit).toBe(50);
    });

    it('should start a task by transitioning its status to IN_PROGRESS via PATCH', async () => {
        // Arrange
        const store = useTaskStore();
        store.tasks = [
            { id: 20, description: 'Revisión eléctrica', status: 'PENDING' }
        ];

        http.patch.mockResolvedValueOnce({
            data: {
                id: 20,
                description: 'Revisión eléctrica',
                status: 'IN_PROGRESS'
            }
        });

        // Act
        const updated = await store.startTask(20);

        // Assert
        expect(http.patch).toHaveBeenCalledWith('/tasks/20', {
            status: 'IN_PROGRESS'
        });
        expect(updated.status).toBe('IN_PROGRESS');
        expect(store.tasks[0].status).toBe('IN_PROGRESS');
    });

    it('should delete a task and remove it from store tasks array', async () => {
        // Arrange
        const store = useTaskStore();
        store.tasks = [
            { id: 1, description: 'Tarea 1' },
            { id: 2, description: 'Tarea 2' }
        ];

        http.delete.mockResolvedValueOnce({});

        // Act
        await store.deleteTask(1);

        // Assert
        expect(http.delete).toHaveBeenCalledWith('/tasks/1');
        expect(store.tasks).toHaveLength(1);
        expect(store.tasks[0].id).toBe(2);
    });
});
