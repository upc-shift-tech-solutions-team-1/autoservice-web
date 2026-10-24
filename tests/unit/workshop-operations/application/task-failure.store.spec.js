import { createPinia, setActivePinia } from 'pinia';
import { useTaskStore } from '../../../../src/domains/workshop-operations/application/task.store';
import { createTask } from '../../../../src/domains/workshop-operations/domain/task.entity';
import http from '../../../../src/shared/infrastructure/http-common';

vi.mock('../../../../src/shared/infrastructure/http-common', () => ({
    default: {
        patch: vi.fn()
    }
}));

describe('Task store: rejected updates', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.resetAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('keeps the task pending when the server rejects its start', async () => {
        const store = useTaskStore();

        store.tasks = [
            createTask({
                id: 20,
                workOrderId: 5,
                description: 'Revisión del sistema de frenos',
                status: 'PENDING',
                adminReviewStatus: 'SUBMITTED'
            })
        ];

        const previousTasks = JSON.parse(JSON.stringify(store.tasks));

        const rejection = {
            response: {
                status: 403,
                data: {
                    message: 'La tarea requiere aprobación administrativa.'
                }
            }
        };

        http.patch.mockRejectedValueOnce(rejection);

        await expect(store.startTask(20)).rejects.toBe(rejection);

        expect(http.patch).toHaveBeenCalledTimes(1);
        expect(http.patch).toHaveBeenCalledWith('/tasks/20', {
            status: 'IN_PROGRESS'
        });

        expect(store.tasks).toEqual(previousTasks);
        expect(store.tasks[0].status).toBe('PENDING');
        expect(store.error).toBe(
            'La tarea requiere aprobación administrativa.'
        );
    });

    it('keeps the task in progress and releases saving after a failed completion', async () => {
        const store = useTaskStore();

        store.tasks = [
            createTask({
                id: 21,
                workOrderId: 5,
                description: 'Cambio de pastillas',
                status: 'IN_PROGRESS',
                technicalDiagnosis: 'Diagnóstico inicial',
                adminReviewStatus: 'APPROVED'
            })
        ];

        const previousTasks = JSON.parse(JSON.stringify(store.tasks));
        const failure = new Error('No se pudo guardar el reporte técnico');

        http.patch.mockRejectedValueOnce(failure);

        const report = {
            technicalDiagnosis: 'Pastillas reemplazadas y frenos revisados',
            customerExplanation: 'Se corrigió el desgaste de las pastillas',
            internalObservation: 'Pendiente de revisión administrativa',
            evidenceRegistered: 'evidencia-frenos.jpg',
            parts: []
        };

        await expect(
            store.completeTaskFromMechanic(21, report)
        ).rejects.toBe(failure);

        expect(http.patch).toHaveBeenCalledTimes(1);
        expect(http.patch).toHaveBeenCalledWith(
            '/tasks/21',
            expect.objectContaining({
                status: 'COMPLETED',
                technicalDiagnosis: report.technicalDiagnosis,
                adminReviewStatus: 'SUBMITTED',
                customerReportStatus: 'HIDDEN'
            })
        );

        expect(store.tasks).toEqual(previousTasks);
        expect(store.tasks[0].status).toBe('IN_PROGRESS');
        expect(store.saving).toBe(false);
        expect(store.error).toBe(failure.message);
    });
});