import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import TaskDialog from '../../../../src/domains/workshop-operations/presentation/components/tasks/TaskDialog.vue';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key, te: () => false }) }));
vi.mock('../../../../src/domains/inventory-management/application/inventory.store', () => ({
    useInventoryStore: () => ({ items: [{ id: 1, stock: 5, unitPrice: 30 }], fetchItems: vi.fn() })
}));

describe('Task material snapshots', () => {
    it.each([true, false])('locks materials only when the task is already persisted: %s', (persisted) => {
        const task = { id: persisted ? 5 : null, parts: [{ inventoryItemId: 1, quantity: 2, unitPrice: 25 }] };
        const wrapper = shallowMount(TaskDialog, {
            props: { task, visible: true },
            global: { stubs: {
                Dialog: { template: '<div><slot /><slot name="footer" /></div>' },
                Select: { props: ['disabled'], template: '<select :disabled="disabled" />' },
                InputNumber: { props: ['disabled'], template: '<input :disabled="disabled" />' }
            } }
        });
        expect(wrapper.findComponent('.part-select').props('disabled')).toBe(persisted);
        expect(wrapper.findComponent('.part-qty').props('disabled')).toBe(persisted);
        expect(wrapper.find('.part-trash').exists()).toBe(!persisted);
        expect(task.parts).toHaveLength(1);
        expect(task.parts[0].unitPrice).toBe(25);
        wrapper.unmount();
    });
});
