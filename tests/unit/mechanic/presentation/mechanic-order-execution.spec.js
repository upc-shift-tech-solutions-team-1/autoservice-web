import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MechanicOrderExecution from '../../../../src/domains/mechanic/presentation/mechanic-order-execution.vue';
import { useAuthStore } from '../../../../src/domains/auth/application/auth.store';
import { useWorkOrderStore } from '../../../../src/domains/workshop-operations/application/work-order.store';
import { useTaskStore } from '../../../../src/domains/workshop-operations/application/task.store';
import { useVehicleStore } from '../../../../src/domains/fleet-management/application/vehicle.store';
import { useInventoryStore } from '../../../../src/domains/inventory-management/application/inventory.store';

vi.mock('vue-router', () => ({
    useRoute: () => ({
        params: { id: '100' }
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

describe('Mechanic Order Execution (Mechanic Context Presentation)', () => {
    let pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
    });

    const createWrapper = () => {
        return mount(MechanicOrderExecution, {
            global: {
                plugins: [pinia],
                mocks: {
                    $t: (key) => key,
                    $te: () => true
                },
                stubs: {
                    Card: {
                        template: '<div class="p-card"><slot name="content" /></div>'
                    },
                    Dialog: {
                        template: '<div class="p-dialog" v-if="visible"><slot /><slot name="footer" /></div>',
                        props: ['visible', 'header']
                    },
                    ProgressBar: {
                        template: '<div class="p-progressbar" :data-value="value"></div>',
                        props: ['value']
                    },
                    Button: {
                        template: '<button class="p-button" @click="$emit(\'click\', $event)"><slot /></button>'
                    },
                    Tag: {
                        template: '<span class="p-tag">{{ value }}</span>',
                        props: ['value', 'severity']
                    },
                    InputText: true,
                    InputNumber: true,
                    Dropdown: true,
                    Textarea: true
                }
            }
        });
    };

    it('should calculate order task completion progress accurately', async () => {
        // Arrange
        const authStore = useAuthStore();
        authStore.user = { email: 'mecanico@autoservice.com', mechanicId: 10 };

        const workOrderStore = useWorkOrderStore();
        workOrderStore.fetchWorkOrders = vi.fn().mockResolvedValue([]);
        workOrderStore.workOrders = [
            { id: 100, vehicleId: 1, mechanicId: 10, status: 'IN_PROGRESS' }
        ];

        const taskStore = useTaskStore();
        taskStore.fetchAllTasks = vi.fn().mockResolvedValue([]);
        taskStore.tasks = [
            { id: 1, workOrderId: 100, status: 'COMPLETED' },
            { id: 2, workOrderId: 100, status: 'IN_PROGRESS' },
            { id: 3, workOrderId: 100, status: 'PENDING' }
        ];

        const vehicleStore = useVehicleStore();
        vehicleStore.fetchVehicles = vi.fn().mockResolvedValue([]);

        const inventoryStore = useInventoryStore();
        inventoryStore.fetchItems = vi.fn().mockResolvedValue([]);

        // Act
        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        // Assert: 1 out of 3 tasks completed = 33% progress
        const progressBar = wrapper.find('.p-progressbar');
        expect(progressBar.exists()).toBe(true);
        expect(progressBar.attributes('data-value')).toBe('33');
    });

    it('should validate that task description is required when a mechanic proposes a new task', async () => {
        // Arrange
        const authStore = useAuthStore();
        authStore.user = { email: 'mecanico@autoservice.com', mechanicId: 10 };

        const workOrderStore = useWorkOrderStore();
        workOrderStore.fetchWorkOrders = vi.fn().mockResolvedValue([]);
        workOrderStore.workOrders = [
            { id: 100, vehicleId: 1, mechanicId: 10, status: 'IN_PROGRESS' }
        ];

        const taskStore = useTaskStore();
        taskStore.fetchAllTasks = vi.fn().mockResolvedValue([]);
        taskStore.addTask = vi.fn();

        const vehicleStore = useVehicleStore();
        vehicleStore.fetchVehicles = vi.fn().mockResolvedValue([]);

        const inventoryStore = useInventoryStore();
        inventoryStore.fetchItems = vi.fn().mockResolvedValue([]);

        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        // Act: Attempt to create task with empty description
        wrapper.vm.newTask.description = '   ';
        await wrapper.vm.createTask();

        // Assert: Task was NOT sent to store because description was empty
        expect(taskStore.addTask).not.toHaveBeenCalled();
        expect(wrapper.vm.formError).toBe('Ingrese la descripción de la tarea.');
    });

    it('should submit a proposed task with SUBMITTED review status and 0 initial commercial labor price', async () => {
        // Arrange
        const authStore = useAuthStore();
        authStore.user = { email: 'mecanico@autoservice.com', mechanicId: 10 };

        const workOrderStore = useWorkOrderStore();
        workOrderStore.fetchWorkOrders = vi.fn().mockResolvedValue([]);
        workOrderStore.workOrders = [
            { id: 100, vehicleId: 1, mechanicId: 10, status: 'IN_PROGRESS' }
        ];

        const taskStore = useTaskStore();
        taskStore.fetchAllTasks = vi.fn().mockResolvedValue([]);
        taskStore.addTask = vi.fn().mockResolvedValue({ id: 999 });

        const vehicleStore = useVehicleStore();
        vehicleStore.fetchVehicles = vi.fn().mockResolvedValue([]);

        const inventoryStore = useInventoryStore();
        inventoryStore.fetchItems = vi.fn().mockResolvedValue([]);

        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        // Simulate filling task proposal
        wrapper.vm.newTask.description = 'Cambio de pastillas delanteras';
        wrapper.vm.newTask.priority = 'HIGH';
        wrapper.vm.newTask.estimatedTime = 90;

        // Act: Call createTask directly
        await wrapper.vm.createTask();

        // Assert
        expect(taskStore.addTask).toHaveBeenCalledWith(expect.objectContaining({
            workOrderId: 100,
            mechanicId: 10,
            description: 'Cambio de pastillas delanteras',
            status: 'PENDING',
            priority: 'HIGH',
            estimatedTime: 90,
            laborPrice: 0,
            adminReviewStatus: 'SUBMITTED'
        }));
    });
});
