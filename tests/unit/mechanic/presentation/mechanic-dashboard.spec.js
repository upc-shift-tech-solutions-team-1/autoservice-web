import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MechanicDashboard from '../../../../src/domains/mechanic/presentation/mechanic-dashboard.vue';
import { useAuthStore } from '../../../../src/domains/auth/application/auth.store';
import { useWorkOrderStore } from '../../../../src/domains/workshop-operations/application/work-order.store';
import { useTaskStore } from '../../../../src/domains/workshop-operations/application/task.store';
import { useVehicleStore } from '../../../../src/domains/fleet-management/application/vehicle.store';

vi.mock('vue-router', () => ({
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

describe('Mechanic Dashboard (Mechanic Context Presentation)', () => {
    let pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
    });

    const createWrapper = () => {
        return mount(MechanicDashboard, {
            global: {
                plugins: [pinia],
                stubs: {
                    Card: {
                        template: '<div class="p-card"><slot name="content" /></div>'
                    },
                    Avatar: true,
                    Tag: {
                        template: '<span class="p-tag">{{ value }}</span>',
                        props: ['value', 'severity']
                    },
                    ProgressBar: {
                        template: '<div class="p-progressbar" :data-value="value"></div>',
                        props: ['value']
                    },
                    Button: true
                }
            }
        });
    };

    it('should filter orders to display only those assigned to the authenticated mechanic', async () => {
        // Arrange
        const authStore = useAuthStore();
        authStore.user = {
            email: 'carlos.mecanico@autoservice.com',
            mechanicId: '10'
        };

        const workOrderStore = useWorkOrderStore();
        workOrderStore.fetchWorkOrders = vi.fn().mockResolvedValue([]);
        const vehicleStore = useVehicleStore();
        vehicleStore.fetchVehicles = vi.fn().mockResolvedValue([]);
        const taskStore = useTaskStore();
        taskStore.fetchAllTasks = vi.fn().mockResolvedValue([]);

        workOrderStore.workOrders = [
            {
                id: 101,
                mechanicId: 10, // Assigned to this mechanic (number)
                trackingCode: 'TRK-101',
                description: 'Frenos y suspensión',
                status: 'IN_PROGRESS',
                vehicleId: 1
            },
            {
                id: 102,
                mechanicId: '10', // String comparison check
                trackingCode: 'TRK-102',
                description: 'Cambio de aceite',
                status: 'PENDING',
                vehicleId: 2
            },
            {
                id: 103,
                mechanicId: 99, // Assigned to another mechanic
                trackingCode: 'TRK-103',
                description: 'Alineación de dirección',
                status: 'PENDING',
                vehicleId: 3
            }
        ];

        // Act
        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        // Assert
        const renderedArticles = wrapper.findAll('article.order-card');
        expect(renderedArticles).toHaveLength(2); // Only order 101 and 102
        expect(wrapper.text()).toContain('TRK-101');
        expect(wrapper.text()).toContain('TRK-102');
        expect(wrapper.text()).not.toContain('TRK-103');
    });

    it('should accurately compute status metric cards (pending, in-progress, completed)', async () => {
        // Arrange
        const authStore = useAuthStore();
        authStore.user = {
            email: 'juan.perez@autoservice.com',
            mechanicId: 5
        };

        const workOrderStore = useWorkOrderStore();
        workOrderStore.fetchWorkOrders = vi.fn().mockResolvedValue([]);
        const vehicleStore = useVehicleStore();
        vehicleStore.fetchVehicles = vi.fn().mockResolvedValue([]);
        const taskStore = useTaskStore();
        taskStore.fetchAllTasks = vi.fn().mockResolvedValue([]);

        workOrderStore.workOrders = [
            { id: 1, mechanicId: 5, status: 'PENDING' },
            { id: 2, mechanicId: 5, status: 'PENDING' },
            { id: 3, mechanicId: 5, status: 'IN_PROGRESS' },
            { id: 4, mechanicId: 5, status: 'FINISHED' }
        ];

        // Act
        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        // Assert
        const summaryCards = wrapper.findAll('.summary-card');
        expect(summaryCards).toHaveLength(3);

        // Pending count: 2
        expect(summaryCards[0].text()).toContain('2');
        // In Progress count: 1
        expect(summaryCards[1].text()).toContain('1');
        // Completed count: 1
        expect(summaryCards[2].text()).toContain('1');
    });

    it('should render the logged-in mechanic profile information in the header', async () => {
        // Arrange
        const authStore = useAuthStore();
        authStore.user = {
            email: 'tecnico.master@autoservice.com',
            mechanicId: 7
        };

        const workOrderStore = useWorkOrderStore();
        workOrderStore.fetchWorkOrders = vi.fn().mockResolvedValue([]);
        useVehicleStore().fetchVehicles = vi.fn().mockResolvedValue([]);
        useTaskStore().fetchAllTasks = vi.fn().mockResolvedValue([]);

        // Act
        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        // Assert
        expect(wrapper.find('.profile-content strong').text()).toBe('tecnico.master@autoservice.com');
        expect(wrapper.find('.profile-content span').text()).toBe('Technician');
    });
});
