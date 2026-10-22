import { describe, it, expect } from 'vitest';
import { createWorkOrder } from '../../../../src/domains/workshop-operations/domain/work-order.entity';

describe('WorkOrder Entity', () => {
    it('should create a work order with default qaChecklist values when empty data is provided', () => {
        const workOrder = createWorkOrder();

        expect(workOrder).toBeDefined();
        expect(workOrder.qaChecklist).toEqual({
            tasksCompleted: false,
            sparePartsChecked: false,
            diagnosisValidated: false,
            cleaningDone: false,
            finalTestDone: false
        });
    });

    it('should normalize work order properties and preserve QA checklist flags when provided', () => {
        const rawData = {
            id: 101,
            workshopId: 1,
            trackingCode: 'TRACK-2026-99',
            vehicleId: 5,
            customerId: 12,
            mechanicId: 8,
            description: 'Mantenimiento preventivo 20k km',
            status: 'IN_PROGRESS',
            price: 450.0,
            estimatedDate: '2026-10-30',
            startDate: '2026-10-22',
            tasksCompleted: true,
            sparePartsChecked: true,
            diagnosisValidated: true,
            cleaningDone: false,
            finalTestDone: false
        };

        const workOrder = createWorkOrder(rawData);

        expect(workOrder.id).toBe(101);
        expect(workOrder.trackingCode).toBe('TRACK-2026-99');
        expect(workOrder.mechanicId).toBe(8);
        expect(workOrder.status).toBe('IN_PROGRESS');
        expect(workOrder.qaChecklist.tasksCompleted).toBe(true);
        expect(workOrder.qaChecklist.sparePartsChecked).toBe(true);
        expect(workOrder.qaChecklist.diagnosisValidated).toBe(true);
        expect(workOrder.qaChecklist.cleaningDone).toBe(false);
        expect(workOrder.qaChecklist.finalTestDone).toBe(false);
    });
});
