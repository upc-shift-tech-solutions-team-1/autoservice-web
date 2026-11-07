import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InventoryCard from '../../../../src/domains/inventory-management/presentation/components/InventoryCard.vue';

describe('InventoryCard Component (Inventory Management Presentation)', () => {
    const createWrapper = (itemProps) => {
        return mount(InventoryCard, {
            props: {
                item: itemProps
            },
            global: {
                mocks: {
                    $t: (key) => key
                },
                stubs: {
                    Card: {
                        template: `
                            <div class="p-card">
                                <div class="p-card-header"><slot name="header" /></div>
                                <div class="p-card-content"><slot name="content" /></div>
                            </div>
                        `
                    },
                    Tag: {
                        template: '<span class="p-tag" :data-severity="severity">{{ value }}</span>',
                        props: ['value', 'severity']
                    },
                    Button: {
                        template: '<button class="p-button" :data-icon="icon" @click="$emit(\'click\', $event)"><slot>{{ label }}</slot></button>',
                        props: ['icon', 'label', 'severity', 'outlined']
                    }
                }
            }
        });
    };

    it('should render item basic info, SKU, brand, category and image when image is provided', () => {
        const item = {
            id: 1,
            sku: 'SKU-001',
            name: 'Kit de Distribución Gates',
            category: 'SPARE_PART',
            brand: 'Gates',
            presentation: 'Caja',
            unitMeasure: 'KIT',
            purchasePrice: 120,
            unitPrice: 180,
            unitProfit: 60,
            marginPercentage: 33.33,
            qualityTier: 'PREMIUM',
            stock: 10,
            minStock: 3,
            image: 'https://example.com/timing-belt.jpg'
        };

        const wrapper = createWrapper(item);

        expect(wrapper.text()).toContain('Kit de Distribución Gates');
        expect(wrapper.text()).toContain('SKU: SKU-001');
        expect(wrapper.text()).toContain('Gates');
        expect(wrapper.text()).toContain('Caja');
        expect(wrapper.text()).toContain('KIT');

        const img = wrapper.find('.item-image');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://example.com/timing-belt.jpg');
    });

    it('should render placeholder icon and text when image is not provided', () => {
        const item = {
            id: 2,
            name: 'Filtro de Polen',
            stock: 5,
            minStock: 2,
            image: ''
        };

        const wrapper = createWrapper(item);

        const placeholder = wrapper.find('.image-placeholder');
        expect(placeholder.exists()).toBe(true);
        expect(wrapper.find('.item-image').exists()).toBe(false);
    });

    it('should display correct stock badges based on stock vs minStock levels', () => {
        // Out of stock
        const outOfStockWrapper = createWrapper({ stock: 0, minStock: 5 });
        expect(outOfStockWrapper.text()).toContain('Sin stock');

        // Low stock (stock <= minStock)
        const lowStockWrapper = createWrapper({ stock: 4, minStock: 5 });
        expect(lowStockWrapper.text()).toContain('Stock bajo');

        // Limited stock (stock <= minStock + 2)
        const limitedStockWrapper = createWrapper({ stock: 7, minStock: 5 });
        expect(limitedStockWrapper.text()).toContain('Stock limitado');

        // Available (stock > minStock + 2)
        const availableWrapper = createWrapper({ stock: 15, minStock: 5 });
        expect(availableWrapper.text()).toContain('Disponible');
    });

    it('should display profitability status correctly', () => {
        const profitableWrapper = createWrapper({ unitProfit: 50, purchasePrice: 100, unitPrice: 150 });
        expect(profitableWrapper.text()).toContain('Rentable');

        const zeroProfitWrapper = createWrapper({ unitProfit: 0, purchasePrice: 100, unitPrice: 100 });
        expect(zeroProfitWrapper.text()).toContain('Sin margen');

        const lossWrapper = createWrapper({ unitProfit: -20, purchasePrice: 120, unitPrice: 100 });
        expect(lossWrapper.text()).toContain('Pérdida');
    });

    it('should render compatible vehicle brand tags when provided', () => {
        const item = {
            id: 3,
            name: 'Bomba de Agua',
            stock: 8,
            minStock: 2,
            compatibleVehicleBrands: ['Toyota', 'Nissan', 'Hyundai']
        };

        const wrapper = createWrapper(item);

        expect(wrapper.text()).toContain('Toyota');
        expect(wrapper.text()).toContain('Nissan');
        expect(wrapper.text()).toContain('Hyundai');
    });

    it('should emit "edit" event when edit button is clicked', async () => {
        const item = {
            id: 4,
            name: 'Aceite Sintético 5W30',
            stock: 20,
            minStock: 5
        };

        const wrapper = createWrapper(item);
        const editButton = wrapper.find('.edit-button');
        await editButton.trigger('click');

        expect(wrapper.emitted('edit')).toBeTruthy();
        expect(wrapper.emitted('edit')[0]).toEqual([item]);
    });
});
