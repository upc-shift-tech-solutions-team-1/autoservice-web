import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MechanicOrderExecution from '../../src/domains/mechanic/presentation/mechanic-order-execution.vue';
import MechanicDashboard from '../../src/domains/mechanic/presentation/mechanic-dashboard.vue';
import { useAuthStore } from '../../src/domains/auth/application/auth.store';
import { useWorkOrderStore } from '../../src/domains/workshop-operations/application/work-order.store';
import { useTaskStore } from '../../src/domains/workshop-operations/application/task.store';
import { useVehicleStore } from '../../src/domains/fleet-management/application/vehicle.store';
import { useInventoryStore } from '../../src/domains/inventory-management/application/inventory.store';
import http from '../../src/shared/infrastructure/http-common';

vi.mock('vue-router', () => ({
    useRoute: () => ({
        params: { id: '500' }
    }),
    useRouter: () => ({
        push: vi.fn()
    })
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        te: () => true
    })
}));

vi.mock('../../src/shared/infrastructure/http-common', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn()
    }
}));

describe('Mechanic & Workshop-Operations Cross-Domain Integration', () => {
    let pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const createExecutionWrapper = () => {
        return mount(MechanicOrderExecution, {
            global: {
                plugins: [pinia],
                mocks: {
                    $t: (key) => key,
                    $te: () => true
                },
                stubs: {
                    Card: { template: '<div class="p-card"><slot name="content" /></div>' },
                    Dialog: { template: '<div class="p-dialog" v-if="visible"><slot /><slot name="footer" /></div>', props: ['visible'] },
                    ProgressBar: { template: '<div class="p-progressbar" :data-value="value"></div>', props: ['value'] },
                    Button: { template: '<button class="p-button" @click="$emit(\'click\', $event)"><slot /></button>' },
                    Tag: { template: '<span class="p-tag">{{ value }}</span>', props: ['value'] },
                    InputText: true,
                    InputNumber: true,
                    Dropdown: true,
                    Textarea: true
                }
            }
        });
    };

    const createDashboardWrapper = () => {
        return mount(MechanicDashboard, {
            global: {
                plugins: [pinia],
                mocks: {
                    $t: (key) => key,
                    $te: () => true
                },
                stubs: {
                    Card: { template: '<div class="p-card"><slot name="content" /></div>' },
                    Avatar: true,
                    Tag: { template: '<span class="p-tag">{{ value }}</span>', props: ['value'] },
                    ProgressBar: { template: '<div class="p-progressbar" :data-value="value"></div>', props: ['value'] },
                    Button: true
                }
            }
        });
    };

    it('should integrate task proposal from mechanic workspace into workshop operations store and update progress reactively', async () => {
        // Arrange
        const authStore = useAuthStore();
        authStore.user = { email: 'tecnico.juan@autoservice.com', mechanicId: 10 };

        const workOrderStore = useWorkOrderStore();
        workOrderStore.fetchWorkOrders = vi.fn().mockResolvedValue([]);
        workOrderStore.workOrders = [
            { id: 500, vehicleId: 1, mechanicId: 10, status: 'IN_PROGRESS', description: 'Reparación de motor' }
        ];

        const taskStore = useTaskStore();
        taskStore.fetchAllTasks = vi.fn().mockResolvedValue([]);
        taskStore.tasks = []; // Start with 0 tasks

        const vehicleStore = useVehicleStore();
        vehicleStore.fetchVehicles = vi.fn().mockResolvedValue([]);

        const inventoryStore = useInventoryStore();
        inventoryStore.fetchItems = vi.fn().mockResolvedValue([]);

        // Mock backend HTTP response when proposing a task
        http.post.mockResolvedValueOnce({
            data: {
                id: 1001,
                workOrderId: 500,
                mechanicId: 10,
                description: 'Cambio de correa de distribución',
                status: 'PENDING',
                priority: 'HIGH',
                estimatedTime: 120,
                laborPrice: 0,
                adminReviewStatus: 'SUBMITTED'
            }
        });

        // Act 1: Mount mechanic execution workspace
        const executionWrapper = createExecutionWrapper();
        await executionWrapper.vm.$nextTick();

        expect(executionWrapper.vm.tasks).toHaveLength(0);
        expect(executionWrapper.vm.progress).toBe(0);

        // Act 2: Fill proposal form and propose task
        executionWrapper.vm.newTask.description = 'Cambio de correa de distribución';
        executionWrapper.vm.newTask.priority = 'HIGH';
        executionWrapper.vm.newTask.estimatedTime = 120;
        await executionWrapper.vm.createTask();

        // Assert 1: Task propagated into workshop operations store
        expect(taskStore.tasks).toHaveLength(1);
        expect(taskStore.tasks[0].id).toBe(1001);
        expect(taskStore.tasks[0].adminReviewStatus).toBe('SUBMITTED');

        // Act 3: Complete the task in the workshop operations store
        http.patch.mockResolvedValueOnce({
            data: {
                id: 1001,
                workOrderId: 500,
                mechanicId: 10,
                description: 'Cambio de correa de distribución',
                status: 'COMPLETED'
            }
        });
        taskStore.tasks[0].status = 'COMPLETED';
        await executionWrapper.vm.$nextTick();

        // Assert 2: Progress in mechanic execution automatically reaches 100% and signals ready for review
        expect(executionWrapper.vm.progress).toBe(100);
        expect(executionWrapper.vm.readyForAdministrativeReview).toBe(true);
    });

    it('should reflect task operations and cost recalculations seamlessly in mechanic dashboard metrics', async () => {
        // Arrange
        const authStore = useAuthStore();
        authStore.user = { email: 'tecnico.juan@autoservice.com', mechanicId: 10 };

        const workOrderStore = useWorkOrderStore();
        workOrderStore.fetchWorkOrders = vi.fn().mockResolvedValue([]);
        workOrderStore.workOrders = [
            { id: 500, vehicleId: 1, mechanicId: 10, status: 'IN_PROGRESS', description: 'Revisión técnica' }
        ];

        const taskStore = useTaskStore();
        taskStore.fetchAllTasks = vi.fn().mockResolvedValue([]);
        // Populate workshop-operations tasks with labor and materials revenue
        taskStore.tasks = [
            {
                id: 1001,
                workOrderId: 500,
                mechanicId: 10,
                description: 'Cambio de aceite y filtro',
                status: 'COMPLETED',
                laborPrice: 80,
                materialsCost: 70
            },
            {
                id: 1002,
                workOrderId: 500,
                mechanicId: 10,
                description: 'Alineación computarizada',
                status: 'IN_PROGRESS',
                laborPrice: 90,
                materialsCost: 0
            }
        ];

        useVehicleStore().fetchVehicles = vi.fn().mockResolvedValue([]);

        // Act: Mount mechanic dashboard
        const dashboardWrapper = createDashboardWrapper();
        await dashboardWrapper.vm.$nextTick();

        // Assert: Dashboard calculates integrated order total (80 + 70 + 90 = 240)
        expect(dashboardWrapper.vm.getOrderTotal(500)).toBe(240);
        expect(dashboardWrapper.vm.getCompletedTasks(500)).toBe(1);
        expect(dashboardWrapper.vm.getTotalTasks(500)).toBe(2);
        expect(dashboardWrapper.vm.getProgress(500)).toBe(50);
    });
});
