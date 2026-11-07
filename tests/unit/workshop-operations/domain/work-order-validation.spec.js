import { describe, expect, it } from 'vitest';
import { qualityChecklistComplete, qualityChecklistFields, tasksApprovedForDelivery } from '../../../../src/domains/workshop-operations/domain/work-order-validation';

describe('Repair quality validation', () => {
    it('does not close an order with no tasks, pending tasks or unapproved quotations', () => {
        expect(tasksApprovedForDelivery([])).toBe(false);
        expect(tasksApprovedForDelivery([{ status: 'IN_PROGRESS', adminReviewStatus: 'APPROVED' }])).toBe(false);
        expect(tasksApprovedForDelivery([{ status: 'COMPLETED', adminReviewStatus: 'SUBMITTED' }])).toBe(false);
        expect(tasksApprovedForDelivery([{ status: 'COMPLETED', adminReviewStatus: 'APPROVED' }])).toBe(true);
    });

    it('requires every quality checkpoint before delivery', () => {
        const checklist = Object.fromEntries(qualityChecklistFields.map(field => [field, true]));
        expect(qualityChecklistComplete(checklist)).toBe(true);
        for (const field of qualityChecklistFields) {
            expect(qualityChecklistComplete({ ...checklist, [field]: false })).toBe(false);
        }
        expect(qualityChecklistComplete(undefined)).toBe(false);
    });
});
