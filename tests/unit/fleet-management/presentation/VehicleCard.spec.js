import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VehicleCard from '../../../../src/domains/fleet-management/presentation/components/VehicleCard.vue';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

describe('VehicleCard Component (Fleet Management Presentation)', () => {
    const createWrapper = (vehicleProps) => {
        return mount(VehicleCard, {
            props: {
                vehicle: vehicleProps
            },
            global: {
                stubs: {
                    Tag: {
                        template: '<span class="p-tag" :data-severity="severity">{{ value }}</span>',
                        props: ['value', 'severity']
                    },
                    ProgressBar: {
                        template: '<div class="p-progressbar" :data-value="value"></div>',
                        props: ['value', 'showValue']
                    },
                    Button: {
                        template: '<button class="p-button" :data-icon="icon" @click="$emit(\'click\', $event)"><slot>{{ label }}</slot></button>',
                        props: ['icon', 'label', 'severity', 'text', 'rounded', 'outlined', 'iconPos']
                    }
                }
            }
        });
    };

    it('should render vehicle name, owner, plate, progress and image properly', () => {
        const vehicleData = {
            id: 1,
            name: 'Toyota Corolla 2022',
            owner: 'Carlos Mendoza',
            plate: 'ABC-1234',
            status: 'En Taller',
            severity: 'info',
            progress: 65,
            image: 'https://example.com/car.jpg',
            raw: { id: 1, plate: 'ABC-1234' }
        };

        const wrapper = createWrapper(vehicleData);

        expect(wrapper.text()).toContain('Toyota Corolla 2022');
        expect(wrapper.text()).toContain('Carlos Mendoza');
        expect(wrapper.text()).toContain('ABC-1234');
        expect(wrapper.text()).toContain('65%');

        const img = wrapper.find('.vehicle-image');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://example.com/car.jpg');
        expect(img.attributes('alt')).toBe('Toyota Corolla 2022');

        const tag = wrapper.find('.status-badge');
        expect(tag.text()).toBe('En Taller');
        expect(tag.attributes('data-severity')).toBe('info');
    });

    it('should emit "edit" event with raw vehicle payload when edit button is clicked', async () => {
        const rawVehicle = { id: 1, plate: 'ABC-1234', brand: 'Toyota' };
        const vehicleData = {
            name: 'Toyota Corolla',
            owner: 'Carlos Mendoza',
            plate: 'ABC-1234',
            status: 'Listo',
            severity: 'success',
            progress: 100,
            image: '',
            raw: rawVehicle
        };

        const wrapper = createWrapper(vehicleData);
        const editButton = wrapper.find('.vehicle-header button');
        await editButton.trigger('click');

        expect(wrapper.emitted('edit')).toBeTruthy();
        expect(wrapper.emitted('edit')[0]).toEqual([rawVehicle]);
    });

    it('should emit "view-detail" event with raw vehicle payload when view details button is clicked', async () => {
        const rawVehicle = { id: 2, plate: 'XYZ-987', brand: 'Honda' };
        const vehicleData = {
            name: 'Honda Civic',
            owner: 'Ana Perez',
            plate: 'XYZ-987',
            status: 'Entregado',
            severity: 'secondary',
            progress: 100,
            image: '',
            raw: rawVehicle
        };

        const wrapper = createWrapper(vehicleData);
        const detailsButton = wrapper.find('.details-button');
        await detailsButton.trigger('click');

        expect(wrapper.emitted('view-detail')).toBeTruthy();
        expect(wrapper.emitted('view-detail')[0]).toEqual([rawVehicle]);
    });
});
