import { defineComponent } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TrackingView from '../../../../src/domains/customer-trust/presentation/tracking-view.vue';
import { TrackingService } from '../../../../src/domains/customer-trust/infrastructure/tracking.service';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: { value: 'es' }
    })
}));

vi.mock('../../../../src/domains/customer-trust/infrastructure/tracking.service', () => ({
    TrackingService: {
        getSummaryByCode: vi.fn(),
        getOrderByCode: vi.fn(),
        getVehicle: vi.fn(),
        getCustomer: vi.fn(),
        getWorkshop: vi.fn()
    }
}));

const InputTextStub = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />'
});

const ButtonStub = defineComponent({
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\', $event)">{{ label }}</button>'
});

const CardStub = defineComponent({
    template: '<section><h3><slot name="title" /></h3><slot name="content" /><slot /></section>'
});

const MessageStub = defineComponent({ template: '<div><slot /></div>' });
const ProgressBarStub = defineComponent({ template: '<div />' });
const TagStub = defineComponent({ props: ['value'], template: '<span>{{ value }}</span>' });

const makeSummary = (overrides = {}) => ({
    trackingCode: 'WO-123ABC',
    status: 'IN_PROGRESS',
    progressPercentage: 50,
    estimatedDate: '2026-11-15',
    tasks: [{
        description: 'Revisión de frenos',
        status: 'IN_PROGRESS',
        laborPrice: 100,
        materialsCost: 50,
        parts: []
    }],
    costs: { laborSubtotal: 100, materialsSubtotal: 50, total: 150 },
    history: [{ status: 'IN_PROGRESS', changedAtUtc: '2026-10-30T12:00:00Z' }],
    estimatedDateHistory: [],
    primaryMechanic: null,
    ...overrides
});

const searchTrackingCode = async (summary) => {
    TrackingService.getSummaryByCode.mockResolvedValueOnce({ data: summary });
    TrackingService.getOrderByCode.mockResolvedValueOnce({
        data: [{ vehicleId: 1, customerId: 2, workshopId: 'shop-1' }]
    });
    TrackingService.getVehicle.mockResolvedValueOnce({ data: { brand: 'Toyota', model: 'Corolla', plate: 'ABC-123' } });
    TrackingService.getCustomer.mockResolvedValueOnce({ data: { fullName: 'Cliente' } });
    TrackingService.getWorkshop.mockResolvedValueOnce({ data: { name: 'Taller' } });

    const wrapper = mount(TrackingView, {
        global: {
            stubs: {
                InputText: InputTextStub,
                Button: ButtonStub,
                Card: CardStub,
                Message: MessageStub,
                ProgressBar: ProgressBarStub,
                Tag: TagStub
            }
        }
    });

    await wrapper.get('input').setValue('WO-123ABC');
    await wrapper.find('button').trigger('click');
    await flushPromises();
    return wrapper;
};

describe('Customer tracking view', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows the estimated-date history and public delay reason without identifying staff', async () => {
        const wrapper = await searchTrackingCode(makeSummary({
            estimatedDateHistory: [
                {
                    previousEstimatedDate: null,
                    estimatedDate: '2026-11-15',
                    reason: null,
                    changedAtUtc: '2026-10-20T12:00:00Z'
                },
                {
                    previousEstimatedDate: '2026-11-15',
                    estimatedDate: '2026-11-20',
                    reason: 'El repuesto solicitado aún no llegó.',
                    changedAtUtc: '2026-10-30T12:00:00Z'
                }
            ]
        }));

        expect(wrapper.findAll('[data-testid="tracking-estimated-date-history-item"]')).toHaveLength(2);
        expect(wrapper.get('[data-testid="tracking-delay-reason"]').text())
            .toContain('El repuesto solicitado aún no llegó.');
        expect(wrapper.find('[data-testid="tracking-estimated-date-changed-by"]').exists()).toBe(false);
    });

    it('shows the primary mechanic and the total calculated by the public backend summary', async () => {
        const wrapper = await searchTrackingCode(makeSummary({
            costs: { laborSubtotal: 100, materialsSubtotal: 50, total: 987.65 },
            primaryMechanic: { fullName: 'Ana García', specialty: 'Electricidad automotriz' }
        }));

        expect(wrapper.get('[data-testid="tracking-primary-mechanic-name"]').text()).toContain('Ana García');
        expect(wrapper.get('[data-testid="tracking-primary-mechanic-specialty"]').text())
            .toContain('Electricidad automotriz');
        expect(wrapper.get('[data-testid="tracking-primary-mechanic"]').find('img').exists()).toBe(false);
        expect(wrapper.get('[data-testid="tracking-cost-total"]').text()).toMatch(/987[,.]65/);
    });
});
