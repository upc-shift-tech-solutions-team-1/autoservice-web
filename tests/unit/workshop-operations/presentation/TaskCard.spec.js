import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskCard from '../../../../src/domains/workshop-operations/presentation/components/tasks/TaskCard.vue';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        te: () => true
    })
}));

describe('TaskCard Component (Workshop Operations Presentation)', () => {
    const createWrapper = (taskProps) => {
        return mount(TaskCard, {
            props: {
                task: taskProps
            },
            global: {
                mocks: {
                    $t: (key) => key,
                    $te: () => true
                },
                stubs: {
                    Tag: {
                        template: '<span class="p-tag">{{ value }}</span>',
                        props: ['value', 'severity']
                    },
                    Button: {
                        template: '<button class="p-button" @click="$emit(\'click\', $event)"><slot /></button>',
                        props: ['icon']
                    }
                },
                directives: {
                    tooltip: () => {}
                }
            }
        });
    };

    it('should display task information, description and mechanic name', () => {
        // Arrange
        const taskData = {
            id: 1,
            workOrderId: 20,
            workOrderCode: 'ORD-2026-001',
            description: 'Cambio de pastillas y discos de freno',
            mechanicName: 'Mario Fernandez',
            status: 'IN_PROGRESS',
            laborPrice: 120,
            laborCost: 40,
            materialsCost: 80,
            materialsPurchaseCost: 50,
            totalRevenue: 200,
            totalCost: 90,
            profit: 110,
            marginPercentage: 55
        };

        // Act
        const wrapper = createWrapper(taskData);

        // Assert
        expect(wrapper.text()).toContain('ORD-2026-001');
        expect(wrapper.text()).toContain('Cambio de pastillas y discos de freno');
        expect(wrapper.text()).toContain('Mario Fernandez');
    });

    it('should correctly format and render profit and margin percentage in the financial summary', () => {
        // Arrange
        const taskData = {
            id: 2,
            description: 'Mantenimiento de inyectores',
            status: 'COMPLETED',
            laborPrice: 150,
            laborCost: 50,
            materialsCost: 50,
            materialsPurchaseCost: 30,
            totalRevenue: 200,
            totalCost: 80,
            profit: 120,
            marginPercentage: 60
        };

        // Act
        const wrapper = createWrapper(taskData);

        // Assert
        expect(wrapper.find('.financial-summary').exists()).toBe(true);
        expect(wrapper.text()).toContain('Margen:');
        expect(wrapper.text()).toContain('60.00%');
    });

    it('should render materials list when parts are associated with the task', () => {
        // Arrange
        const taskData = {
            id: 3,
            description: 'Cambio de embrague',
            status: 'PENDING',
            parts: [
                {
                    inventoryItemId: 5,
                    name: 'Kit de embrague LuK',
                    quantity: 1,
                    unitPrice: 450,
                    brand: 'LuK',
                    qualityTier: 'PREMIUM'
                }
            ]
        };

        // Act
        const wrapper = createWrapper(taskData);

        // Assert
        const materialsBox = wrapper.find('.materials-box');
        expect(materialsBox.exists()).toBe(true);
        expect(materialsBox.text()).toContain('Kit de embrague LuK');
        expect(materialsBox.text()).toContain('1x');
        expect(materialsBox.text()).toContain('PREMIUM');
    });
});
