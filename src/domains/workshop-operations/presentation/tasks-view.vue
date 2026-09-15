<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import { useTaskStore } from '../application/task.store';
import { useWorkOrderStore } from '../application/work-order.store';
import { useMechanicStore } from '../../staff-coordination/application/mechanic.store';
import { useVehicleStore } from '../../fleet-management/application/vehicle.store';

import TaskCard from './components/tasks/TaskCard.vue';
import TaskDialog from './components/tasks/TaskDialog.vue';
import TaskFilters from './components/tasks/TaskFilters.vue';

const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

const REVIEW_STATUS = {
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const router = useRouter();

const taskStore = useTaskStore();
const workOrderStore = useWorkOrderStore();
const mechanicStore = useMechanicStore();
const vehicleStore = useVehicleStore();

const { t, te } = useI18n();

// ── UI State ──────────────────────────────────────────────
const viewMode = ref('list'); // 'list' | 'kanban'

// ── Dialog state ──────────────────────────────────────────
const displayDialog = ref(false);
const reviewDialog = ref(false);

// ── Forms ─────────────────────────────────────────────────
const taskForm = ref({});
const taskToReview = ref(null);

// ── Filters ───────────────────────────────────────────────
const search = ref('');
const selectedStatus = ref(null);
const selectedMechanicId = ref(null);

/**
 * Returns the translated value when the key exists.
 * Otherwise, it returns the fallback interface text.
 *
 * @param {string} key - Internationalization key.
 * @param {string} fallback - Fallback text.
 * @returns {string}
 */
const translateOrFallback = (key, fallback) =>
    te(key) ? t(key) : fallback;

const statusOptions = computed(() => [
  {
    value: TASK_STATUS.PENDING,
    label: t('taskStatus.pending')
  },
  {
    value: TASK_STATUS.IN_PROGRESS,
    label: t('taskStatus.in_progress')
  },
  {
    value: TASK_STATUS.COMPLETED,
    label: t('taskStatus.completed')
  }
]);

const priorityOptions = computed(() => [
  {
    value: 'LOW',
    label: t('priorities.low')
  },
  {
    value: 'MEDIUM',
    label: t('priorities.medium')
  },
  {
    value: 'HIGH',
    label: t('priorities.high')
  },
  {
    value: 'CRITICAL',
    label: t('priorities.critical')
  }
]);

const loadAllData = async () => {
  await Promise.all([
    taskStore.fetchAllTasks(),
    workOrderStore.fetchWorkOrders(),
    mechanicStore.fetchMechanics(),
    vehicleStore.fetchVehicles()
  ]);
};

onMounted(() => loadAllData());

const getWorkOrderCode = (workOrderId) => {
  if (!workOrderId) {
    return t('tasks.fallbacks.notAvailable');
  }

  const workOrder = workOrderStore.workOrders.find(
      order =>
          String(order.id) ===
          String(workOrderId)
  );

  return workOrder
      ? workOrder.trackingCode
      : t('tasks.fallbacks.unknown');
};

const getMechanicName = (mechanicId) => {
  if (!mechanicId) {
    return t('tasks.fallbacks.unassigned');
  }

  const mechanic = mechanicStore.mechanics.find(
      item =>
          String(item.id) ===
          String(mechanicId)
  );

  return mechanic
      ? mechanic.fullName
      : t('tasks.fallbacks.notFound');
};

const getSeverity = (status) => {
  if (status === TASK_STATUS.COMPLETED) {
    return 'success';
  }

  if (status === TASK_STATUS.IN_PROGRESS) {
    return 'info';
  }

  if (status === TASK_STATUS.PENDING) {
    return 'warning';
  }

  return 'secondary';
};

const getPriorityLabel = (priority) => {
  const key = String(priority).toLowerCase();

  return t(`priorities.${key}`);
};

/**
 * Creates the initial task form state.
 *
 * Stock is not modified directly from this form.
 * Inventory consumption will be handled by the backend
 * according to the materials assigned to the task.
 *
 * @returns {Object}
 */
const createEmptyTaskForm = () => ({
  id: null,
  workOrderId: null,
  mechanicId: null,

  description: '',

  status: TASK_STATUS.PENDING,
  priority: 'MEDIUM',
  estimatedTime: 0,

  laborPrice: 0,
  laborCost: 0,

  materialsCost: 0,
  materialsPurchaseCost: 0,

  totalRevenue: 0,
  totalCost: 0,
  profit: 0,
  marginPercentage: 0,

  technicalDiagnosis: '',
  customerExplanation: '',
  internalObservation: '',
  evidenceRegistered: '',
  adminReviewStatus: '',

  parts: []
});

// ── Computed ──────────────────────────────────────────────
const tasksView = computed(() =>
    taskStore.tasks.map(task => ({
      id: task.id,
      raw: task,

      description:
          task.description ||
          t('tasks.fallbacks.noDescription'),

      workOrderId: task.workOrderId,

      workOrderCode:
          getWorkOrderCode(task.workOrderId),

      vehiclePlate: (() => {
        const workOrder =
            workOrderStore.workOrders.find(
                order =>
                    String(order.id) ===
                    String(task.workOrderId)
            );

        const vehicle = workOrder
            ? vehicleStore.vehicles.find(
                item =>
                    String(item.id) ===
                    String(workOrder.vehicleId)
            )
            : null;

        return vehicle ? vehicle.plate : '---';
      })(),

      mechanicId: task.mechanicId,

      mechanicName:
          getMechanicName(task.mechanicId),

      status:
          task.status ||
          TASK_STATUS.PENDING,

      severity:
          getSeverity(task.status),

      priority:
          task.priority || 'MEDIUM',

      priorityLabel:
          getPriorityLabel(
              task.priority || 'MEDIUM'
          ),

      estimatedTime:
          task.estimatedTime ?? 0,

      laborPrice:
          task.laborPrice || 0,

      laborCost:
          task.laborCost || 0,

      materialsCost:
          task.materialsCost || 0,

      materialsPurchaseCost:
          task.materialsPurchaseCost || 0,

      totalRevenue:
          task.totalRevenue || 0,

      totalCost:
          task.totalCost || 0,

      profit:
          task.profit || 0,

      marginPercentage:
          task.marginPercentage || 0,

      parts:
          Array.isArray(task.parts)
              ? task.parts
              : [],

      photo: task.photo
    }))
);

const filteredTasks = computed(() => {
  const term =
      search.value.toLowerCase().trim();

  return tasksView.value.filter(task => {
    const description = String(
        task.description || ''
    ).toLowerCase();

    const workOrderCode = String(
        task.workOrderCode || ''
    ).toLowerCase();

    const mechanicName = String(
        task.mechanicName || ''
    ).toLowerCase();

    const matchesSearch =
        !term ||
        description.includes(term) ||
        workOrderCode.includes(term) ||
        mechanicName.includes(term);

    const matchesStatus =
        !selectedStatus.value ||
        task.status === selectedStatus.value;

    const matchesMechanic =
        !selectedMechanicId.value ||
        String(task.mechanicId) ===
        String(selectedMechanicId.value);

    return (
        matchesSearch &&
        matchesStatus &&
        matchesMechanic
    );
  });
});

// Kanban Columns Builder
const kanbanColumns = computed(() => [
  {
    id: 'pending',
    title: t('taskStatus.pending'),
    status: TASK_STATUS.PENDING,
    items: filteredTasks.value.filter(
        task =>
            task.status ===
            TASK_STATUS.PENDING
    )
  },
  {
    id: 'in_progress',
    title: t('taskStatus.in_progress'),
    status: TASK_STATUS.IN_PROGRESS,
    items: filteredTasks.value.filter(
        task =>
            task.status ===
            TASK_STATUS.IN_PROGRESS
    )
  },
  {
    id: 'completed',
    title: t('taskStatus.completed'),
    status: TASK_STATUS.COMPLETED,
    items: filteredTasks.value.filter(
        task =>
            task.status ===
            TASK_STATUS.COMPLETED
    )
  }
]);

const pendingTasks = computed(() =>
    taskStore.tasks.filter(
        task =>
            task.status ===
            TASK_STATUS.PENDING
    ).length
);

const inProgressTasks = computed(() =>
    taskStore.tasks.filter(
        task =>
            task.status ===
            TASK_STATUS.IN_PROGRESS
    ).length
);

const completedTasks = computed(() =>
    taskStore.tasks.filter(
        task =>
            task.status ===
            TASK_STATUS.COMPLETED
    ).length
);

// ── Actions ───────────────────────────────────────────────
/**
 * Opens the dialog with a clean task form.
 */
const openNewTask = () => {
  taskStore.clearError();
  taskForm.value = createEmptyTaskForm();
  displayDialog.value = true;
};

/**
 * Opens an existing task for editing.
 *
 * @param {Object} task - Task view or raw task.
 */
const editTask = (task) => {
  const sourceTask = task.raw || task;

  const clonedTask = JSON.parse(
      JSON.stringify(sourceTask)
  );

  taskForm.value = {
    ...createEmptyTaskForm(),
    ...clonedTask,

    parts: Array.isArray(clonedTask.parts)
        ? clonedTask.parts
        : []
  };

  taskStore.clearError();
  displayDialog.value = true;
};

const hideDialog = () => {
  displayDialog.value = false;
  taskForm.value = {};
  taskStore.clearError();
};

/**
 * Creates or updates a task according to the form identifier.
 *
 * A pending mechanic proposal with SUBMITTED review status
 * becomes APPROVED after the administrator defines and saves
 * its quotation.
 *
 * Completed tasks submitted for final validation are not
 * approved here. They continue through the review dialog.
 */
const saveTask = async () => {
  const description = String(
      taskForm.value.description || ''
  ).trim();

  if (
      !description ||
      !taskForm.value.workOrderId ||
      taskStore.saving
  ) {
    return;
  }

  const isEditing =
      taskForm.value.id !== null &&
      taskForm.value.id !== undefined;

  const isPendingMechanicProposal =
      isEditing &&
      taskForm.value.status ===
      TASK_STATUS.PENDING &&
      taskForm.value.adminReviewStatus ===
      REVIEW_STATUS.SUBMITTED;

  const taskPayload = {
    ...taskForm.value,
    description,

    adminReviewStatus:
        isPendingMechanicProposal
            ? REVIEW_STATUS.APPROVED
            : taskForm.value.adminReviewStatus
  };

  try {
    if (isEditing) {
      await taskStore.updateTask(
          taskPayload.id,
          taskPayload
      );
    } else {
      await taskStore.addTask(
          taskPayload
      );
    }

    await taskStore.fetchAllTasks();

    hideDialog();
  } catch (error) {
    console.error(
        'Error guardando tarea:',
        error
    );
  }
};

const deleteTask = async (task) => {
  const sourceTask = task.raw || task;

  const confirmed = window.confirm(
      t(
          'tasks.messages.deleteConfirmation',
          {
            description:
            sourceTask.description
          }
      )
  );

  if (!confirmed) return;

  await taskStore.deleteTask(
      sourceTask.id
  );
};

const goToWorkOrder = (workOrderId) => {
  if (workOrderId) {
    router.push(
        `/work-orders/${workOrderId}`
    );
  }
};

// ── Review workflow ───────────────────────────────────────
const openReview = (rawTask) => {
  const sourceTask =
      rawTask.raw || rawTask;

  taskToReview.value = {
    ...sourceTask
  };

  reviewDialog.value = true;
};

const approveTask = async () => {
  await taskStore.approveTask(
      taskToReview.value.id
  );

  reviewDialog.value = false;
  taskToReview.value = null;
};

const rejectTask = async () => {
  await taskStore.rejectTask(
      taskToReview.value.id
  );

  reviewDialog.value = false;
  taskToReview.value = null;
};

watch(viewMode, (newMode) => {
  if (newMode === 'kanban') {
    selectedStatus.value = null;
  }
});
</script>

<template>
  <section class="tasks-page">
    <div class="tasks-header">
      <div>
        <span class="eyebrow">
          {{ t('tasks.eyebrow') }}
        </span>

        <h1>{{ t('tasks.title') }}</h1>

        <p>{{ t('tasks.description') }}</p>
      </div>

      <div class="header-actions">
        <Button
            :label="
              translateOrFallback(
                  'tasks.actions.new',
                  'Nueva tarea'
              )
            "
            icon="pi pi-plus"
            class="new-task-button"
            @click="openNewTask"
        />

        <div class="view-toggles">
          <Button
              icon="pi pi-list"
              :severity="
                viewMode === 'list'
                  ? 'primary'
                  : 'secondary'
              "
              :outlined="viewMode !== 'list'"
              aria-label="Vista de lista"
              @click="viewMode = 'list'"
          />

          <Button
              icon="pi pi-th-large"
              :severity="
                viewMode === 'kanban'
                  ? 'primary'
                  : 'secondary'
              "
              :outlined="viewMode !== 'kanban'"
              aria-label="Vista kanban"
              @click="viewMode = 'kanban'"
          />
        </div>

        <Button
            icon="pi pi-refresh"
            rounded
            outlined
            :loading="taskStore.loading"
            aria-label="Actualizar tareas"
            @click="loadAllData"
        />
      </div>
    </div>

    <div
        v-if="taskStore.error"
        class="store-error"
    >
      <i class="pi pi-exclamation-triangle"></i>

      <span>{{ taskStore.error }}</span>

      <Button
          icon="pi pi-times"
          text
          rounded
          severity="danger"
          aria-label="Cerrar error"
          @click="taskStore.clearError"
      />
    </div>

    <div class="summary-row">
      <div class="summary-card">
        <span>
          {{ t('tasks.summary.total') }}
        </span>

        <strong>
          {{ taskStore.tasks.length }}
        </strong>
      </div>

      <div class="summary-card">
        <span>
          {{ t('tasks.summary.pending') }}
        </span>

        <strong>{{ pendingTasks }}</strong>
      </div>

      <div class="summary-card">
        <span>
          {{ t('tasks.summary.inProgress') }}
        </span>

        <strong>{{ inProgressTasks }}</strong>
      </div>

      <div class="summary-card success">
        <span>
          {{ t('tasks.summary.completed') }}
        </span>

        <strong>{{ completedTasks }}</strong>
      </div>
    </div>

    <TaskFilters
        v-model:search="search"
        v-model:status="selectedStatus"
        v-model:mechanicId="selectedMechanicId"
        :status-options="statusOptions"
        :mechanic-options="mechanicStore.mechanics"
        :show-status="viewMode === 'list'"
    />

    <div
        v-if="taskStore.loading"
        class="empty-state"
    >
      <div>
        <i class="pi pi-spin pi-spinner"></i>
        <p>{{ t('tasks.loading') }}</p>
      </div>
    </div>

    <template v-else-if="filteredTasks.length">
      <div
          v-if="viewMode === 'list'"
          class="tasks-grid"
      >
        <TaskCard
            v-for="task in filteredTasks"
            :key="task.id"
            :task="task"
            @review="openReview"
            @edit="editTask"
            @delete="deleteTask"
            @go-order="goToWorkOrder"
        />
      </div>

      <div v-else class="kanban-board">
        <div
            v-for="column in kanbanColumns"
            :key="column.id"
            class="kanban-column"
        >
          <div class="column-header">
            <h3>{{ column.title }}</h3>

            <span class="column-count">
              {{ column.items.length }}
            </span>
          </div>

          <div class="column-content">
            <TaskCard
                v-for="task in column.items"
                :key="task.id"
                :task="task"
                class="kanban-card"
                @review="openReview"
                @edit="editTask"
                @delete="deleteTask"
                @go-order="goToWorkOrder"
            />

            <div
                v-if="column.items.length === 0"
                class="empty-column"
            >
              {{
                translateOrFallback(
                    'common.emptyColumn',
                    'Sin tareas'
                )
              }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <div>
        <i class="pi pi-check-square"></i>

        <h3>
          {{ t('tasks.empty.title') }}
        </h3>

        <p>
          {{ t('tasks.empty.description') }}
        </p>

        <Button
            :label="
              translateOrFallback(
                  'tasks.actions.new',
                  'Crear primera tarea'
              )
            "
            icon="pi pi-plus"
            class="empty-create-button"
            @click="openNewTask"
        />
      </div>
    </div>

    <TaskDialog
        v-model:visible="displayDialog"
        :task="taskForm"
        :work-order-options="
          workOrderStore.workOrders
        "
        :mechanic-options="
          mechanicStore.mechanics
        "
        @save="saveTask"
        @cancel="hideDialog"
    />

    <Dialog
        v-model:visible="reviewDialog"
        :header="t('tasks.review.dialogTitle')"
        :modal="true"
        :style="{ width: '500px' }"
    >
      <div
          v-if="taskToReview"
          class="review-body"
      >
        <div class="review-field">
          <label>
            {{
              t(
                  'tasks.review.technicalDiagnosis'
              )
            }}
          </label>

          <p>
            {{
              taskToReview.technicalDiagnosis ||
              t('tasks.review.notRegistered')
            }}
          </p>
        </div>

        <div class="review-field">
          <label>
            {{
              t(
                  'tasks.review.customerExplanation'
              )
            }}
          </label>

          <p>
            {{
              taskToReview.customerExplanation ||
              t('tasks.review.notRegistered')
            }}
          </p>
        </div>

        <div class="review-field">
          <label>
            {{
              t(
                  'tasks.review.internalObservation'
              )
            }}
          </label>

          <p>
            {{
              taskToReview.internalObservation ||
              t('tasks.review.notRegistered')
            }}
          </p>
        </div>

        <div
            v-if="
              taskToReview.evidenceRegistered
            "
            class="review-field"
        >
          <label>
            {{ t('tasks.review.evidence') }}
          </label>

          <p class="evidence-link">
            {{
              taskToReview.evidenceRegistered
            }}
          </p>
        </div>

        <div
            v-if="
              taskToReview.parts &&
              taskToReview.parts.length > 0
            "
            class="review-field"
        >
          <label>
            <i class="pi pi-box"></i>

            {{
              t(
                  'tasks.review.requestedMaterials'
              )
            }}
          </label>

          <div class="parts-summary">
            <div
                v-for="part in taskToReview.parts"
                :key="
                  `${part.inventoryItemId}-${part.name}`
                "
                class="part-summary-item"
            >
              <div>
                <strong>
                  {{ part.quantity }}x
                </strong>

                {{ part.name }}
              </div>

              <span>
                S/.
                {{
                  (
                      (Number(part.unitPrice) || 0) *
                      (Number(part.quantity) || 0)
                  ).toFixed(2)
                }}
              </span>
            </div>

            <div class="parts-total">
              {{
                t(
                    'tasks.review.partsSubtotal'
                )
              }}

              <strong>
                S/.
                {{
                  taskToReview.parts
                      .reduce(
                          (sum, part) =>
                              sum +
                              (
                                  (Number(
                                      part.unitPrice
                                  ) || 0) *
                                  (Number(
                                      part.quantity
                                  ) || 0)
                              ),
                          0
                      )
                      .toFixed(2)
                }}
              </strong>
            </div>
          </div>
        </div>

        <div class="review-actions">
          <Button
              :label="
                t(
                    'tasks.review.rejectButton'
                )
              "
              icon="pi pi-times"
              severity="danger"
              outlined
              @click="rejectTask"
          />

          <Button
              :label="
                t(
                    'tasks.review.approveButton'
                )
              "
              icon="pi pi-check"
              severity="success"
              @click="approveTask"
          />
        </div>
      </div>
    </Dialog>
  </section>
</template>

<style scoped>
.tasks-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #0b1680;
  text-transform: uppercase;
}

.tasks-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 2.7rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.tasks-header p {
  max-width: 620px;
  margin: 0.75rem 0 0;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.new-task-button {
  border: none;
  border-radius: 12px;
  background: #0b1680;
  white-space: nowrap;
}

.view-toggles {
  display: flex;
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.view-toggles :deep(.p-button) {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
}

.store-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fef2f2;
  color: #b91c1c;
  font-weight: 600;
}

.store-error span {
  flex: 1;
}

.summary-row {
  display: grid;
  grid-template-columns:
      repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  padding: 1rem 1.2rem;
  border: 1px solid #e8edf5;
  border-radius: 20px;
  background: #ffffff;
  box-shadow:
      0 4px 15px rgba(0, 0, 0, 0.03);
}

.summary-card span {
  display: block;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 700;
}

.summary-card strong {
  display: block;
  margin-top: 0.25rem;
  color: #0b1680;
  font-size: 1.8rem;
  line-height: 1;
}

.summary-card.success strong {
  color: #16a34a;
}

.tasks-grid {
  display: grid;
  grid-template-columns:
      repeat(auto-fit, minmax(560px, 1fr));
  align-items: start;
  gap: 1.5rem;
}

.tasks-grid > * {
  min-width: 0;
}

/* KANBAN STYLES */
.kanban-board {
  display: flex;
  flex: 1;
  align-items: flex-start;
  gap: 1.25rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.kanban-column {
  display: flex;
  flex: 0 0 560px;
  max-width: calc(100vw - 4rem);
  max-height: 100%;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 2px solid #e2e8f0;
}

.column-header h3 {
  margin: 0;
  color: #334155;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.column-count {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.85rem;
  font-weight: bold;
}

.column-content {
  display: flex;
  max-height: 65vh;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
}

.kanban-card {
  cursor: grab;
}

.kanban-card:active {
  cursor: grabbing;
}

.empty-column {
  padding: 2rem;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 0.9rem;
  text-align: center;
}

.empty-state {
  display: grid;
  min-height: 260px;
  place-items: center;
  border: 1px dashed #cbd5e1;
  border-radius: 24px;
  background: #ffffff;
  color: #64748b;
  text-align: center;
}

.empty-state > div {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-state i {
  margin-bottom: 0.75rem;
  color: #0b1680;
  font-size: 2.5rem;
}

.empty-state h3 {
  margin: 0;
  color: #0f172a;
}

.empty-state p {
  margin: 0.75rem 0 1rem;
}

.empty-create-button {
  border: none;
  border-radius: 12px;
  background: #0b1680;
}

.review-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.review-field label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.35rem;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.review-field p {
  margin: 0;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 0.95rem;
  line-height: 1.6;
}

.evidence-link {
  color: #0b1680 !important;
  font-weight: 600;
  word-break: break-all;
}

.parts-summary {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}

.part-summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px dashed #e2e8f0;
  color: #334155;
  font-size: 0.95rem;
}

.part-summary-item strong {
  margin-right: 0.4rem;
  color: #0b1680;
  font-weight: 800;
}

.parts-total {
  margin-top: 0.5rem;
  padding-top: 1rem;
  color: #64748b;
  font-size: 0.9rem;
  text-align: right;
}

.parts-total strong {
  margin-left: 0.5rem;
  color: #0f172a;
  font-size: 1.15rem;
}

.review-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

@media (max-width: 900px) {
  .tasks-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .new-task-button {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .summary-row {
    grid-template-columns:
        repeat(2, 1fr);
  }

  .tasks-grid {
    grid-template-columns: 1fr;
  }

  .kanban-column {
    flex-basis: calc(100vw - 3rem);
    max-width: calc(100vw - 3rem);
  }

  .header-actions {
    justify-content: space-between;
  }
}

@media (max-width: 520px) {
  .summary-row {
    grid-template-columns: 1fr;
  }

  .new-task-button {
    width: 100%;
    flex-basis: 100%;
  }
}
</style>