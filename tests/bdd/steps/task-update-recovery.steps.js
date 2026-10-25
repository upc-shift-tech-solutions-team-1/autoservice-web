import { createPinia, setActivePinia } from 'pinia';
import { useTaskStore } from '../../../src/domains/workshop-operations/application/task.store';
import { createTask } from '../../../src/domains/workshop-operations/domain/task.entity';
import http from '../../../src/shared/infrastructure/http-common';

export function registerTaskUpdateRecoverySteps({
                                                    Given,
                                                    When,
                                                    Then,
                                                    And
                                                }) {
    Given(
        'a pending task is awaiting administrative approval',
        (context) => {
            setActivePinia(createPinia());
            context.store = useTaskStore();

            context.store.tasks = [
                createTask({
                    id: 81,
                    workOrderId: 300,
                    description: 'Revisión del sistema eléctrico',
                    status: 'PENDING',
                    adminReviewStatus: 'SUBMITTED'
                })
            ];

            context.originalTasks = JSON.parse(
                JSON.stringify(context.store.tasks)
            );
        }
    );

    When(
        'the server rejects the request to start the task',
        async (context) => {
            context.rejection = {
                response: {
                    status: 403,
                    data: {
                        message: 'La tarea requiere aprobación administrativa.'
                    }
                }
            };

            http.patch.mockRejectedValueOnce(context.rejection);

            try {
                await context.store.startTask(81);
            } catch (error) {
                context.caughtError = error;
            }
        }
    );

    Then(
        'the task remains pending with its original information',
        (context) => {
            expect(context.caughtError).toBe(context.rejection);
            expect(http.patch).toHaveBeenCalledWith('/tasks/81', {
                status: 'IN_PROGRESS'
            });
            expect(context.store.tasks).toEqual(context.originalTasks);
            expect(context.store.tasks[0].status).toBe('PENDING');
        }
    );

    And(
        'the server rejection message is available to the interface',
        (context) => {
            expect(context.store.error).toBe(
                context.rejection.response.data.message
            );
        }
    );

    Given('an assigned task is in progress', (context) => {
        setActivePinia(createPinia());
        context.store = useTaskStore();

        context.initialTask = {
            id: 82,
            workOrderId: 300,
            mechanicId: 10,
            description: 'Cambio de pastillas',
            status: 'IN_PROGRESS',
            adminReviewStatus: 'APPROVED',
            technicalDiagnosis: 'Desgaste identificado'
        };

        context.store.tasks = [createTask(context.initialTask)];

        context.originalTasks = JSON.parse(
            JSON.stringify(context.store.tasks)
        );

        context.report = {
            technicalDiagnosis: 'Pastillas reemplazadas',
            customerExplanation: 'Se realizó el mantenimiento de frenos',
            internalObservation: 'Pendiente de control de calidad',
            evidenceRegistered: 'frenos-final.jpg',
            parts: []
        };
    });

    When(
        'the server fails to save the completion report',
        async (context) => {
            context.failure = new Error('Servicio temporalmente no disponible');
            http.patch.mockRejectedValueOnce(context.failure);

            try {
                await context.store.completeTaskFromMechanic(
                    82,
                    context.report
                );
            } catch (error) {
                context.caughtError = error;
            }
        }
    );

    Then(
        'the task remains in progress and saving is released',
        (context) => {
            expect(context.caughtError).toBe(context.failure);
            expect(context.store.tasks).toEqual(context.originalTasks);
            expect(context.store.tasks[0].status).toBe('IN_PROGRESS');
            expect(context.store.saving).toBe(false);
            expect(context.store.error).toBe(context.failure.message);
        }
    );

    When(
        'the operator retries completion and the server accepts',
        async (context) => {
            http.patch.mockResolvedValueOnce({
                data: {
                    ...context.initialTask,
                    ...context.report,
                    status: 'COMPLETED',
                    adminReviewStatus: 'SUBMITTED',
                    customerReportStatus: 'HIDDEN'
                }
            });

            await context.store.completeTaskFromMechanic(
                82,
                context.report
            );
        }
    );

    Then(
        'the task is completed and submitted for administrative review',
        (context) => {
            expect(http.patch).toHaveBeenLastCalledWith(
                '/tasks/82',
                expect.objectContaining({
                    status: 'COMPLETED',
                    technicalDiagnosis: context.report.technicalDiagnosis,
                    adminReviewStatus: 'SUBMITTED',
                    customerReportStatus: 'HIDDEN'
                })
            );

            const task = context.store.tasks[0];

            expect(task.status).toBe('COMPLETED');
            expect(task.adminReviewStatus).toBe('SUBMITTED');
            expect(task.technicalDiagnosis).toBe(
                context.report.technicalDiagnosis
            );
            expect(context.store.error).toBeNull();
            expect(context.store.saving).toBe(false);
        }
    );

    And(
        'the completion request was sent twice without duplicating the task',
        (context) => {
            expect(http.patch).toHaveBeenCalledTimes(2);
            expect(context.store.tasks).toHaveLength(1);
            expect(context.store.tasks[0].id).toBe(82);
        }
    );
}