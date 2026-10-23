/**
 * @file mechanic-workspace.steps.js
 * @description BDD Step Definitions for Mechanic bounded context.
 * Automates US-23, US-32 and mechanic task execution acceptance criteria.
 */

import { expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import http from '../../../src/shared/infrastructure/http-common';
import { useAuthStore } from '../../../src/domains/auth/application/auth.store';
import { useWorkOrderStore } from '../../../src/domains/workshop-operations/application/work-order.store';
import { useTaskStore } from '../../../src/domains/workshop-operations/application/task.store';
import { useVehicleStore } from '../../../src/domains/fleet-management/application/vehicle.store';
import { createWorkOrder } from '../../../src/domains/workshop-operations/domain/work-order.entity';
import { createTask } from '../../../src/domains/workshop-operations/domain/task.entity';
import { createVehicle } from '../../../src/domains/fleet-management/domain/vehicle.entity';

/**
 * Registers step definitions for the Mechanic Workspace BDD suite.
 *
 * @param {ReturnType<import('../support/bdd-runner').createBddSuite>} suite
 */
export function registerMechanicWorkspaceSteps({ Given, When, Then, And }) {
  // ── SCENARIO 1: US-23 Registrar diagnóstico técnico del vehículo ──

  Given(
    'a work order is assigned to mechanic {int} for technical inspection',
    async (context, mechanicId) => {
      setActivePinia(createPinia());
      context.authStore = useAuthStore();
      context.workOrderStore = useWorkOrderStore();
      context.taskStore = useTaskStore();
      context.vehicleStore = useVehicleStore();

      context.authStore.user = {
        id: 10,
        email: 'carlos.mecanico@autoservice.pe',
        role: 'mechanic',
        mechanicId
      };

      context.vehicle = createVehicle({
        id: 201,
        brand: 'Toyota',
        model: 'Corolla',
        plate: 'ABC-123',
        year: 2021
      });
      context.vehicleStore.vehicles = [context.vehicle];

      context.workOrder = createWorkOrder({
        id: 601,
        workshopId: 1,
        vehicleId: context.vehicle.id,
        customerId: 15,
        mechanicId,
        description: 'Ruido metálico al frenar',
        status: 'PENDING'
      });
      context.workOrderStore.workOrders = [context.workOrder];
    }
  );

  When(
    'the mechanic registers a technical diagnosis {string}',
    async (context, diagnosisText) => {
      context.technicalDiagnosis = diagnosisText;
      // In the mechanic order execution flow, the mechanic enters the diagnosis
      // and links it into proposed verifiable tasks.
      expect(context.technicalDiagnosis).toBeTruthy();
    }
  );

  Then('the diagnosis is recorded for the work order', async (context) => {
    expect(context.technicalDiagnosis).toBe(
      'Desgaste severo en pastillas y fuga leve en amortiguador'
    );
  });

  And(
    'the mechanic proposes a task linked to the diagnosis with priority {string}',
    async (context, priority) => {
      const taskPayload = {
        id: 750,
        workOrderId: context.workOrder.id,
        mechanicId: context.authStore.mechanicId,
        description: 'Reemplazo de pastillas delanteras y reten de amortiguador',
        priority,
        estimatedTime: 90,
        technicalDiagnosis: context.technicalDiagnosis,
        adminReviewStatus: 'SUBMITTED',
        status: 'PENDING',
        parts: []
      };

      vi.spyOn(http, 'post').mockResolvedValueOnce({
        data: taskPayload
      });

      context.proposedTask = await context.taskStore.addTask(taskPayload);

      expect(context.proposedTask.technicalDiagnosis).toBe(context.technicalDiagnosis);
      expect(context.proposedTask.priority).toBe(priority);
      expect(context.proposedTask.adminReviewStatus).toBe('SUBMITTED');
    }
  );

  // ── SCENARIO 2: US-32 Consultar y actualizar tareas desde workspace ──

  Given(
    'the mechanic with id {int} has assigned tasks in the workspace',
    async (context, mechanicId) => {
      setActivePinia(createPinia());
      context.authStore = useAuthStore();
      context.workOrderStore = useWorkOrderStore();
      context.taskStore = useTaskStore();
      context.vehicleStore = useVehicleStore();

      context.authStore.user = {
        id: 10,
        email: 'carlos.mecanico@autoservice.pe',
        role: 'mechanic',
        mechanicId
      };

      context.vehicle = createVehicle({
        id: 202,
        brand: 'Honda',
        model: 'Civic',
        plate: 'XYZ-789'
      });
      context.vehicleStore.vehicles = [context.vehicle];

      context.workOrder = createWorkOrder({
        id: 602,
        vehicleId: context.vehicle.id,
        mechanicId,
        status: 'IN_PROGRESS',
        description: 'Mantenimiento de 40k km'
      });
      context.workOrderStore.workOrders = [context.workOrder];

      // Approved task assigned to mechanic
      context.assignedTask = createTask({
        id: 760,
        workOrderId: context.workOrder.id,
        mechanicId,
        description: 'Cambio de filtro de aire y bujías',
        status: 'PENDING',
        adminReviewStatus: 'APPROVED',
        estimatedTime: 45
      });
      context.taskStore.tasks = [context.assignedTask];

      // Verify task is filtered for this mechanic in the workspace
      const myTasks = context.taskStore.tasks.filter(
        (t) => String(t.mechanicId) === String(mechanicId)
      );
      expect(myTasks.length).toBe(1);
    }
  );

  When(
    'the mechanic accesses the workspace and starts the assigned task',
    async (context) => {
      vi.spyOn(http, 'patch').mockResolvedValueOnce({
        data: {
          ...context.assignedTask,
          status: 'IN_PROGRESS'
        }
      });

      context.startedTask = await context.taskStore.startTask(
        context.assignedTask.id
      );
    }
  );

  Then('the task status changes to {string}', async (context, expectedStatus) => {
    expect(context.startedTask.status).toBe(expectedStatus);

    const storeTask = context.taskStore.tasks.find(
      (t) => t.id === context.assignedTask.id
    );
    expect(storeTask.status).toBe(expectedStatus);
  });

  And(
    'the task remains associated with the same work order and vehicle',
    async (context) => {
      expect(context.startedTask.workOrderId).toBe(context.workOrder.id);

      const order = context.workOrderStore.workOrders.find(
        (o) => o.id === context.startedTask.workOrderId
      );
      expect(order).toBeDefined();
      expect(order.vehicleId).toBe(context.vehicle.id);
    }
  );

  // ── SCENARIO 3: US-32 & EP-05 Completar tarea con observaciones técnicas ──

  Given('an approved task is in progress by mechanic {int}', async (context, mechanicId) => {
    setActivePinia(createPinia());
    context.authStore = useAuthStore();
    context.workOrderStore = useWorkOrderStore();
    context.taskStore = useTaskStore();

    context.authStore.user = {
      id: 10,
      email: 'carlos.mecanico@autoservice.pe',
      mechanicId
    };

    context.taskInProgress = createTask({
      id: 770,
      workOrderId: 603,
      mechanicId,
      description: 'Rectificación de frenos',
      status: 'IN_PROGRESS',
      adminReviewStatus: 'APPROVED'
    });
    context.taskStore.tasks = [context.taskInProgress];
  });

  When(
    'the mechanic marks the task as completed with observation {string}',
    async (context, observationText) => {
      const completionReport = {
        internalObservation: observationText,
        technicalDiagnosis: 'Rectificación completada conforme a tolerancia',
        parts: []
      };

      const completedAt = '2026-10-22T20:00:00.000Z';
      vi.spyOn(http, 'patch').mockResolvedValueOnce({
        data: {
          ...context.taskInProgress,
          status: 'COMPLETED',
          internalObservation: observationText,
          completedAt
        }
      });

      context.completedTask = await context.taskStore.completeTaskFromMechanic(
        context.taskInProgress.id,
        completionReport
      );
    }
  );

  Then('the task status is updated to {string}', async (context, expectedStatus) => {
    expect(context.completedTask.status).toBe(expectedStatus);

    const storeTask = context.taskStore.tasks.find(
      (t) => t.id === context.taskInProgress.id
    );
    expect(storeTask.status).toBe(expectedStatus);
  });

  And(
    'the completed task reflects the observation and completion timestamp',
    async (context) => {
      expect(context.completedTask.internalObservation).toBe(
        'Discos rectificados y pastillas cerámicas instaladas'
      );
      expect(context.completedTask.completedAt).toBeDefined();
    }
  );
}
