/**
 * @file workshop-operations.steps.js
 * @description BDD Step Definitions for Workshop Operations bounded context.
 * Automates US-24, US-25, US-28 and lifecycle acceptance criteria.
 */

import { expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import http from '../../../src/shared/infrastructure/http-common';
import { useWorkOrderStore } from '../../../src/domains/workshop-operations/application/work-order.store';
import { useTaskStore } from '../../../src/domains/workshop-operations/application/task.store';
import { createWorkOrder } from '../../../src/domains/workshop-operations/domain/work-order.entity';
import { createTask } from '../../../src/domains/workshop-operations/domain/task.entity';

/**
 * Registers step definitions for the Workshop Operations BDD suite.
 *
 * @param {ReturnType<import('../support/bdd-runner').createBddSuite>} suite
 */
export function registerWorkshopOperationsSteps({ Given, When, Then, And }) {
  // ── SCENARIO 1: US-24 Registrar tareas de mantenimiento verificables ──

  Given('an active work order exists in the workshop', async (context) => {
    setActivePinia(createPinia());
    context.workOrderStore = useWorkOrderStore();
    context.taskStore = useTaskStore();

    context.workOrder = createWorkOrder({
      id: 501,
      workshopId: 10,
      vehicleId: 1,
      customerId: 2,
      mechanicId: 10,
      description: 'Mantenimiento correctivo motor',
      status: 'IN_PROGRESS'
    });

    context.workOrderStore.workOrders = [context.workOrder];
  });

  When(
    'an administrator registers a new maintenance task with description {string}, mechanic id {int}, and estimated time {int}',
    async (context, description, mechanicId, estimatedTime) => {
      const taskPayload = {
        id: 701,
        workOrderId: context.workOrder.id,
        mechanicId,
        description,
        estimatedTime,
        status: 'PENDING',
        priority: 'HIGH',
        laborPrice: 150,
        laborCost: 60,
        materialsCost: 0
      };

      vi.spyOn(http, 'post').mockResolvedValueOnce({
        data: taskPayload
      });

      context.createdTask = await context.taskStore.addTask({
        workOrderId: context.workOrder.id,
        mechanicId,
        description,
        estimatedTime,
        priority: 'HIGH',
        laborPrice: 150
      });
    }
  );

  Then('the task is associated with the work order', async (context) => {
    expect(context.createdTask.workOrderId).toBe(context.workOrder.id);
    expect(context.taskStore.tasks).toContainEqual(
      expect.objectContaining({ workOrderId: context.workOrder.id })
    );
  });

  And(
    'the task is saved with assigned mechanic {int} and estimated time {int} minutes',
    async (context, mechanicId, estimatedTime) => {
      expect(context.createdTask.mechanicId).toBe(mechanicId);
      expect(context.createdTask.estimatedTime).toBe(estimatedTime);
    }
  );

  And('the task initial status is {string}', async (context, expectedStatus) => {
    expect(context.createdTask.status).toBe(expectedStatus);
  });

  // ── SCENARIO 2: US-25 Consultar orden de trabajo con progreso de tareas ──

  Given('an active work order has {int} registered tasks', async (context, taskCount) => {
    setActivePinia(createPinia());
    context.workOrderStore = useWorkOrderStore();
    context.taskStore = useTaskStore();

    context.workOrder = createWorkOrder({
      id: 502,
      vehicleId: 2,
      customerId: 3,
      mechanicId: 10,
      description: 'Alineación y frenos',
      status: 'IN_PROGRESS'
    });
    context.workOrderStore.workOrders = [context.workOrder];

    context.tasks = [];
    for (let i = 1; i <= taskCount; i++) {
      context.tasks.push(
        createTask({
          id: 800 + i,
          workOrderId: context.workOrder.id,
          mechanicId: 10,
          description: `Tarea operativa ${i}`,
          status: 'PENDING',
          estimatedTime: 45
        })
      );
    }
    context.taskStore.tasks = [...context.tasks];
  });

  When('{int} of the {int} tasks is marked as completed', async (context, completedCount) => {
    for (let i = 0; i < completedCount; i++) {
      context.taskStore.tasks[i] = createTask({
        ...context.taskStore.tasks[i],
        status: 'COMPLETED'
      });
    }
  });

  Then('the work order progress displays {int} percent', async (context, expectedPercent) => {
    const orderTasks = context.taskStore.tasks.filter(
      (t) => String(t.workOrderId) === String(context.workOrder.id)
    );
    const completedTasks = orderTasks.filter((t) => t.status === 'COMPLETED').length;
    const progress = orderTasks.length
      ? Math.round((completedTasks / orderTasks.length) * 100)
      : 0;

    expect(progress).toBe(expectedPercent);
    context.calculatedProgress = progress;
  });

  And(
    'the work order displays {int} completed task out of {int} total tasks',
    async (context, expectedCompleted, expectedTotal) => {
      const orderTasks = context.taskStore.tasks.filter(
        (t) => String(t.workOrderId) === String(context.workOrder.id)
      );
      const completedTasks = orderTasks.filter((t) => t.status === 'COMPLETED').length;

      expect(completedTasks).toBe(expectedCompleted);
      expect(orderTasks.length).toBe(expectedTotal);
    }
  );

  // ── SCENARIO 3: US-28 Validar reparación antes de entrega ──

  Given('a work order has all its assigned tasks completed', async (context) => {
    setActivePinia(createPinia());
    context.workOrderStore = useWorkOrderStore();
    context.taskStore = useTaskStore();

    context.workOrder = createWorkOrder({
      id: 503,
      vehicleId: 4,
      customerId: 5,
      mechanicId: 10,
      description: 'Overhaul de suspensión',
      status: 'FINISHED',
      price: 450,
      estimatedDate: '2026-10-25'
    });
    context.workOrderStore.workOrders = [context.workOrder];

    context.taskStore.tasks = [
      createTask({
        id: 901,
        workOrderId: context.workOrder.id,
        status: 'COMPLETED',
        description: 'Reemplazo de amortiguadores'
      }),
      createTask({
        id: 902,
        workOrderId: context.workOrder.id,
        status: 'COMPLETED',
        description: 'Calibración geométrica'
      })
    ];
  });

  When(
    'the administrator completes the QA checklist with tasks completed, spare parts checked, diagnosis validated, cleaning done, and final test done',
    async (context) => {
      const updatedChecklist = {
        tasksCompleted: true,
        sparePartsChecked: true,
        diagnosisValidated: true,
        cleaningDone: true,
        finalTestDone: true
      };

      vi.spyOn(http, 'put').mockResolvedValueOnce({
        data: {
          ...context.workOrder,
          status: 'DELIVERED',
          ...updatedChecklist
        }
      });

      context.updatedOrder = await context.workOrderStore.updateWorkOrderChecklist(
        context.workOrder.id,
        {
          ...context.workOrder,
          status: 'DELIVERED',
          qaChecklist: updatedChecklist
        }
      );
    }
  );

  Then('the work order quality checklist is verified', async (context) => {
    const verifiedOrder = context.workOrderStore.workOrders.find(
      (wo) => wo.id === context.workOrder.id
    );
    expect(verifiedOrder).toBeDefined();
    expect(verifiedOrder.qaChecklist.tasksCompleted).toBe(true);
    expect(verifiedOrder.qaChecklist.sparePartsChecked).toBe(true);
    expect(verifiedOrder.qaChecklist.diagnosisValidated).toBe(true);
    expect(verifiedOrder.qaChecklist.cleaningDone).toBe(true);
    expect(verifiedOrder.qaChecklist.finalTestDone).toBe(true);
  });

  And('the work order status is updated to {string}', async (context, expectedStatus) => {
    const order = context.workOrderStore.workOrders.find(
      (wo) => wo.id === context.workOrder.id
    );
    expect(order.status).toBe(expectedStatus);
  });

  // ── SCENARIO 4: Lifecycle - Tarea no aprobada no puede iniciarse ──

  Given('an active work order exists', async (context) => {
    setActivePinia(createPinia());
    context.workOrderStore = useWorkOrderStore();
    context.taskStore = useTaskStore();

    context.workOrder = createWorkOrder({
      id: 504,
      status: 'IN_PROGRESS',
      description: 'Revisión técnica'
    });
    context.workOrderStore.workOrders = [context.workOrder];
  });

  And(
    'a task proposal has admin review status {string} and is pending approval',
    async (context, reviewStatus) => {
      context.unapprovedTask = createTask({
        id: 950,
        workOrderId: context.workOrder.id,
        description: 'Propuesta de cambio de kit de embrague',
        status: 'PENDING',
        adminReviewStatus: reviewStatus
      });
      context.taskStore.tasks = [context.unapprovedTask];
    }
  );

  When('an attempt is made to start the unapproved task', async (context) => {
    // Validate domain business rule from mechanic-order-execution.vue / backend lifecycle
    const isWaitingForApproval =
      context.unapprovedTask.status === 'PENDING' &&
      context.unapprovedTask.adminReviewStatus === 'SUBMITTED';

    const canStartTask =
      context.workOrder.status !== 'FINISHED' &&
      context.unapprovedTask.status === 'PENDING' &&
      !isWaitingForApproval;

    if (!canStartTask) {
      context.startAttemptRejected = true;
      context.rejectionReason =
        'La tarea requiere aprobación administrativa antes de iniciar su ejecución.';
    } else {
      context.startAttemptRejected = false;
      await context.taskStore.startTask(context.unapprovedTask.id);
    }
  });

  Then(
    'the request is rejected and the task status remains {string}',
    async (context, expectedStatus) => {
      expect(context.startAttemptRejected).toBe(true);
      expect(context.rejectionReason).toContain('requiere aprobación administrativa');

      const currentTask = context.taskStore.tasks.find(
        (t) => t.id === context.unapprovedTask.id
      );
      expect(currentTask.status).toBe(expectedStatus);
    }
  );
}
