<script setup>
/**
 * @file mechanic-order-execution.vue
 * @description Workspace used by mechanics to diagnose,
 * propose technical tasks, request materials and execute
 * previously approved work.
 */

import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useWorkOrderStore } from '../../workshop-operations/application/work-order.store';
import { useTaskStore } from '../../workshop-operations/application/task.store';
import { useVehicleStore } from '../../fleet-management/application/vehicle.store';
import { useAuthStore } from '../../auth/application/auth.store';
import { useInventoryStore } from '../../inventory-management/application/inventory.store';

import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import ProgressBar from 'primevue/progressbar';

const ORDER_STATUS = {
  FINISHED: 'FINISHED',
  DELIVERED: 'DELIVERED'
};

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

const { t, te } = useI18n();

const route = useRoute();
const router = useRouter();

const workOrderStore = useWorkOrderStore();
const taskStore = useTaskStore();
const vehicleStore = useVehicleStore();
const authStore = useAuthStore();
const inventoryStore = useInventoryStore();

const orderId = route.params.id;

const showTaskDialog = ref(false);
const diagnosis = ref('');
const formError = ref(null);

/**
 * Contains the last execution error associated with a task.
 *
 * @type {import('vue').Ref<null|{
 *   taskId: string|number,
 *   message: string,
 *   available: number|null,
 *   requested: number|null
 * }>}
 */
const taskActionError = ref(null);

/**
 * Returns a translated value when the key exists.
 * Otherwise, it returns the supplied fallback text.
 *
 * @param {string} key - Internationalization key.
 * @param {string} fallback - Fallback interface text.
 * @returns {string}
 */
const translateOrFallback = (key, fallback) =>
    te(key) ? t(key) : fallback;

/**
 * Converts a raw value into a valid numeric value.
 *
 * @param {*} value - Raw value.
 * @param {number} fallback - Fallback value.
 * @returns {number}
 */
const toNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
      ? parsedValue
      : fallback;
};

/**
 * Converts a raw value into a valid integer value.
 *
 * @param {*} value - Raw value.
 * @param {number} fallback - Fallback value.
 * @returns {number}
 */
const toInteger = (value, fallback = 0) => {
  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue)
      ? parsedValue
      : fallback;
};

/**
 * Rounds a numeric value to two decimal places.
 *
 * @param {*} value - Raw numeric value.
 * @returns {number}
 */
const roundToTwoDecimals = (value) =>
    Math.round(
        (toNumber(value) + Number.EPSILON) * 100
    ) / 100;

const priorities = computed(() => [
  {
    value: 'LOW',
    label: translateOrFallback(
        'priorities.low',
        'Baja'
    )
  },
  {
    value: 'MEDIUM',
    label: translateOrFallback(
        'priorities.medium',
        'Media'
    )
  },
  {
    value: 'HIGH',
    label: translateOrFallback(
        'priorities.high',
        'Alta'
    )
  }
]);

/**
 * Creates the initial technical task proposal.
 *
 * Prices and internal costs are not defined by the mechanic.
 *
 * @returns {Object}
 */
const createEmptyTaskProposal = () => ({
  description: '',
  priority: 'MEDIUM',

  /**
   * Estimated time is standardized in minutes.
   */
  estimatedTime: 60,

  /**
   * Commercial and internal labor values are defined
   * later by the administrator.
   */
  laborPrice: 0,
  laborCost: 0,

  parts: []
});

const newTask = ref(
    createEmptyTaskProposal()
);

onMounted(async () => {
  const results = await Promise.allSettled([
    workOrderStore.fetchWorkOrders(),
    taskStore.fetchAllTasks(),
    vehicleStore.fetchVehicles(),
    inventoryStore.fetchItems()
  ]);

  results
      .filter(result => result.status === 'rejected')
      .forEach(result => {
        console.error(result.reason);
      });
});

const order = computed(() =>
    workOrderStore.workOrders.find(
        currentOrder =>
            String(currentOrder.id) ===
            String(orderId)
    )
);

const vehicle = computed(() =>
    vehicleStore.vehicles.find(
        currentVehicle =>
            String(currentVehicle.id) ===
            String(order.value?.vehicleId)
    )
);

const tasks = computed(() =>
    taskStore.tasks.filter(
        task =>
            String(task.workOrderId) ===
            String(orderId)
    )
);

const isOrderClosed = computed(() =>
    [
      ORDER_STATUS.FINISHED,
      ORDER_STATUS.DELIVERED
    ].includes(order.value?.status)
);

const completedTasks = computed(() =>
    tasks.value.filter(
        task =>
            task.status ===
            TASK_STATUS.COMPLETED
    ).length
);

const progress = computed(() =>
    tasks.value.length
        ? Math.round(
            (
                completedTasks.value /
                tasks.value.length
            ) * 100
        )
        : 0
);

/**
 * The mechanic does not close the order.
 * When every task is completed, the order becomes
 * ready for administrative validation.
 */
const readyForAdministrativeReview = computed(() =>
    tasks.value.length > 0 &&
    completedTasks.value === tasks.value.length
);

/**
 * Inventory options enriched with availability status.
 */
const inventoryOptions = computed(() =>
    inventoryStore.items.map(item => ({
      ...item,
      disabled: false
    }))
);

/**
 * Counts every material unit requested for the proposal.
 */
const requestedMaterialUnits = computed(() =>
    newTask.value.parts.reduce(
        (sum, part) =>
            sum +
            Math.max(
                1,
                toInteger(part.quantity, 1)
            ),
        0
    )
);

/**
 * Calculates the commercial materials amount using
 * current inventory prices.
 *
 * The mechanic does not edit or see this value.
 */
const requestedMaterialsSaleTotal = computed(() =>
    roundToTwoDecimals(
        newTask.value.parts.reduce(
            (sum, part) =>
                sum +
                (
                    toNumber(part.unitPrice) *
                    Math.max(
                        1,
                        toInteger(part.quantity, 1)
                    )
                ),
            0
        )
    )
);

/**
 * Calculates the internal materials cost using
 * current inventory purchase prices.
 *
 * The mechanic does not edit or see this value.
 */
const requestedMaterialsPurchaseTotal = computed(() =>
    roundToTwoDecimals(
        newTask.value.parts.reduce(
            (sum, part) =>
                sum +
                (
                    toNumber(part.purchasePrice) *
                    Math.max(
                        1,
                        toInteger(part.quantity, 1)
                    )
                ),
            0
        )
    )
);

const openTaskDialog = () => {
  formError.value = null;
  newTask.value = createEmptyTaskProposal();
  showTaskDialog.value = true;
};

const closeTaskDialog = () => {
  showTaskDialog.value = false;
  formError.value = null;
  newTask.value = createEmptyTaskProposal();
};

/**
 * Adds a material request row.
 *
 * Selecting a material does not modify inventory stock.
 */
const addPart = () => {
  newTask.value.parts.push({
    inventoryItemId: null,
    name: '',
    quantity: 1,

    /**
     * Values are copied from inventory and processed
     * by the backend and administrator.
     */
    unitPrice: 0,
    purchasePrice: 0,

    brand: '',
    qualityTier: 'STANDARD'
  });
};

/**
 * Removes a material request from the proposal.
 *
 * @param {number} index - Part index.
 */
const removePart = (index) => {
  newTask.value.parts.splice(index, 1);
};

/**
 * Copies immutable inventory information into the
 * technical material request.
 *
 * @param {string|number|null} itemId - Inventory identifier.
 * @param {number} index - Part index.
 */
const onPartSelected = (itemId, index) => {
  const selectedPart = newTask.value.parts[index];

  if (!selectedPart) return;

  const item = inventoryStore.items.find(
      inventoryItem =>
          String(inventoryItem.id) ===
          String(itemId)
  );

  if (!item) {
    selectedPart.name = '';
    selectedPart.unitPrice = 0;
    selectedPart.purchasePrice = 0;
    selectedPart.brand = '';
    selectedPart.qualityTier = 'STANDARD';

    return;
  }

  selectedPart.name = item.name;

  selectedPart.unitPrice =
      roundToTwoDecimals(item.unitPrice);

  selectedPart.purchasePrice =
      roundToTwoDecimals(item.purchasePrice);

  selectedPart.brand =
      item.brand || 'GENERIC';

  selectedPart.qualityTier =
      item.qualityTier || 'STANDARD';
};

/**
 * Returns the stock available for a selected item.
 *
 * @param {string|number|null} itemId - Inventory identifier.
 * @returns {number}
 */
const getAvailableStock = (itemId) => {
  const item = inventoryStore.items.find(
      inventoryItem =>
          String(inventoryItem.id) ===
          String(itemId)
  );

  return item
      ? Math.max(0, toInteger(item.stock))
      : 1;
};

/**
 * Resolves quality tier domain codes.
 *
 * @param {string} qualityTier - Quality tier code.
 * @returns {string}
 */
const getQualityTierLabel = (qualityTier) => {
  const labels = {
    ECONOMY: 'Económica',
    STANDARD: 'Estándar',
    PREMIUM: 'Premium'
  };

  return labels[qualityTier] || 'Estándar';
};

/**
 * Creates a technical proposal for administrator review.
 *
 * The task is not automatically authorized, priced,
 * started or deducted from inventory.
 */
const createTask = async () => {
  if (
      isOrderClosed.value ||
      taskStore.saving
  ) {
    return;
  }

  const description = String(
      newTask.value.description || ''
  ).trim();

  if (!description) {
    formError.value =
        'Ingrese la descripción de la tarea.';

    return;
  }

  if (!authStore.mechanicId) {
    formError.value =
        'No se pudo identificar al mecánico autenticado.';

    return;
  }

  formError.value = null;

  try {
    await taskStore.addTask({
      workOrderId: Number(orderId),
      mechanicId: authStore.mechanicId,

      description,

      status: TASK_STATUS.PENDING,
      priority: newTask.value.priority,

      estimatedTime: Math.max(
          0,
          toInteger(
              newTask.value.estimatedTime,
              60
          )
      ),

      /**
       * The administrator will define labor prices.
       */
      laborPrice: 0,
      laborCost: 0,

      /**
       * These totals are copied from inventory only
       * as quotation information.
       */
      materialsCost:
      requestedMaterialsSaleTotal.value,

      materialsPurchaseCost:
      requestedMaterialsPurchaseTotal.value,

      technicalDiagnosis:
          String(diagnosis.value || '').trim(),

      /**
       * PENDING + SUBMITTED means this proposal
       * requires administrative quotation approval.
       */
      adminReviewStatus:
      REVIEW_STATUS.SUBMITTED,

      parts: newTask.value.parts
    });

    await taskStore.fetchAllTasks();

    closeTaskDialog();
  } catch (error) {
    formError.value =
        taskStore.error ||
        'No se pudo enviar la propuesta técnica.';

    console.error(
        'Error creando propuesta técnica:',
        error
    );
  }
};

/**
 * Determines whether a task proposal is still waiting
 * for administrator quotation approval.
 *
 * @param {Object} task - Task entity.
 * @returns {boolean}
 */
const isWaitingForApproval = (task) =>
    task.status === TASK_STATUS.PENDING &&
    task.adminReviewStatus ===
    REVIEW_STATUS.SUBMITTED;

/**
 * Determines whether the mechanic can start a task.
 *
 * Administrator-created tasks without review status and
 * approved mechanic proposals can both be started.
 *
 * @param {Object} task - Task entity.
 * @returns {boolean}
 */
const canStartTask = (task) =>
    !isOrderClosed.value &&
    task.status === TASK_STATUS.PENDING &&
    !isWaitingForApproval(task);

/**
 * Determines whether the mechanic can complete a task.
 *
 * @param {Object} task - Task entity.
 * @returns {boolean}
 */
const canCompleteTask = (task) =>
    !isOrderClosed.value &&
    task.status === TASK_STATUS.IN_PROGRESS;

/**
 * Starts an administrator-approved or assigned task.
 *
 * @param {Object} task - Task entity.
 */
const startTask = async (task) => {
  if (!canStartTask(task)) return;

  taskActionError.value = null;
  taskStore.clearError();

  try {
    await taskStore.startTask(task.id);
    await taskStore.fetchAllTasks();
    await inventoryStore.fetchItems();
  } catch (error) {
    const responseData =
        error?.response?.data || {};

    taskActionError.value = {
      taskId: task.id,

      message:
          responseData.message ||
          taskStore.error ||
          'No se pudo iniciar la tarea.',

      available:
          responseData.available !== undefined
              ? toInteger(responseData.available)
              : null,

      requested:
          responseData.requested !== undefined
              ? toInteger(responseData.requested)
              : null
    };

    console.error(
        'Error iniciando tarea:',
        error
    );
  }
};

/**
 * Completes an in-progress task and sends it back
 * to the administrator for final validation.
 *
 * @param {Object} task - Task entity.
 */
const completeTask = async (task) => {
  if (!canCompleteTask(task)) return;

  taskActionError.value = null;
  taskStore.clearError();

  try {
    await taskStore.completeTaskFromMechanic(
        task.id,
        {
          technicalDiagnosis:
              String(
                  diagnosis.value ||
                  task.technicalDiagnosis ||
                  ''
              ).trim(),

          customerExplanation:
              task.customerExplanation || '',

          internalObservation:
              task.internalObservation || '',

          evidenceRegistered:
              task.evidenceRegistered || '',

          parts: Array.isArray(task.parts)
              ? task.parts
              : []
        }
    );

    await taskStore.fetchAllTasks();
  } catch (error) {
    console.error(
        'Error completando tarea:',
        error
    );
  }
};

const getPriorityLabel = (priorityValue) => {
  const found = priorities.value.find(
      priority =>
          priority.value === priorityValue
  );

  return found
      ? found.label
      : priorityValue;
};

const getTaskStatusLabel = (task) => {
  if (isWaitingForApproval(task)) {
    return 'Esperando cotización';
  }

  if (
      task.status === TASK_STATUS.IN_PROGRESS
  ) {
    return 'En ejecución';
  }

  if (
      task.status === TASK_STATUS.COMPLETED &&
      task.adminReviewStatus ===
      REVIEW_STATUS.SUBMITTED
  ) {
    return 'Esperando validación';
  }

  if (
      task.status === TASK_STATUS.COMPLETED
  ) {
    return translateOrFallback(
        'tasks.summary.completed',
        'Completada'
    );
  }

  return translateOrFallback(
      'taskStatus.pending',
      'Pendiente'
  );
};

const getTaskSeverity = (task) => {
  if (isWaitingForApproval(task)) {
    return 'warn';
  }

  if (
      task.status === TASK_STATUS.IN_PROGRESS
  ) {
    return 'info';
  }

  if (
      task.status === TASK_STATUS.COMPLETED
  ) {
    return 'success';
  }

  return 'secondary';
};
</script>

<template>
  <div class="mechanic-order-page">
    <header class="page-header">
      <Button
          icon="pi pi-arrow-left"
          text
          aria-label="Volver"
          @click="
            router.push('/mechanic/workspace')
          "
      />

      <div>
        <h1>
          {{
            translateOrFallback(
                'mechanicOrder.order',
                'Orden'
            )
          }}
          {{ order?.trackingCode }}
        </h1>

        <p>
          {{
            translateOrFallback(
                'mechanicOrder.manageDescription',
                'Registre el diagnóstico y ejecute las tareas autorizadas.'
            )
          }}
        </p>
      </div>
    </header>

    <Card class="vehicle-card">
      <template #content>
        <div class="vehicle-info">
          <i class="pi pi-car vehicle-icon"></i>

          <div>
            <h2>
              {{
                vehicle?.brand ||
                'Vehículo'
              }}
              {{ vehicle?.model || '' }}
            </h2>

            <span>
              {{ vehicle?.plate || 'Sin placa' }}
            </span>
          </div>
        </div>
      </template>
    </Card>

    <Card class="diagnosis-card">
      <template #content>
        <div class="card-heading">
          <div>
            <h3>
              {{
                translateOrFallback(
                    'mechanicOrder.diagnosis',
                    'Diagnóstico técnico'
                )
              }}
            </h3>

            <p>
              El diagnóstico se adjuntará a las
              propuestas y tareas completadas.
            </p>
          </div>

          <Tag
              :value=" $t('tasks.dialogExt.financialInfo') "
              severity="info"
          />
        </div>

        <Textarea
            v-model="diagnosis"
            :disabled="isOrderClosed"
            rows="4"
            class="w-full"
            :placeholder="
              translateOrFallback(
                  'mechanicOrder.diagnosisPlaceholder',
                  'Describa las fallas detectadas y el trabajo recomendado.'
              )
            "
        />
      </template>
    </Card>

    <Card class="tasks-card">
      <template #content>
        <div class="section-header">
          <div>
            <h3>
              {{
                translateOrFallback(
                    'mechanicOrder.tasks',
                    'Tareas técnicas'
                )
              }}
            </h3>

            <p>
              Ejecute las tareas asignadas o proponga
              nuevas tareas para cotización.
            </p>
          </div>

          <Button
              label="Proponer tarea"
              icon="pi pi-plus"
              :disabled="isOrderClosed"
              @click="openTaskDialog"
          />
        </div>

        <div
            v-if="tasks.length"
            class="tasks-list"
        >
          <div
              v-for="task in tasks"
              :key="task.id"
              class="task-item"
          >
            <div class="task-content">
              <div class="task-title-row">
                <h4>{{ task.description }}</h4>

                <Tag
                    :value="getTaskStatusLabel(task)"
                    :severity="getTaskSeverity(task)"
                />
              </div>

              <div class="task-meta">
                <Tag
                    :value="
                      getPriorityLabel(
                          task.priority
                      )
                    "
                    severity="info"
                />

                <span>
                  <i class="pi pi-clock"></i>

                  {{ task.estimatedTime || 0 }}
                  min
                </span>

                <span
                    v-if="
                      task.adminReviewStatus ===
                      REVIEW_STATUS.APPROVED
                    "
                    class="approved-label"
                >
                  <i class="pi pi-verified"></i>
                  Cotización aprobada
                </span>
              </div>

              <div
                  v-if="
                    task.parts &&
                    task.parts.length > 0
                  "
                  class="task-parts"
              >
                <small class="parts-title">
                  <i class="pi pi-box"></i>
                  Materiales solicitados:
                </small>

                <div class="parts-tags">
                  <Tag
                      v-for="(part, index) in task.parts"
                      :key="
                        `${part.inventoryItemId}-${index}`
                      "
                      severity="secondary"
                      :value="
                        `${part.quantity}x ${part.name}`
                      "
                  />
                </div>
              </div>

              <div
                  v-if="isWaitingForApproval(task)"
                  class="approval-message"
              >
                <i class="pi pi-clock"></i>

                El administrador debe establecer
                precios y aprobar esta propuesta antes
                de que pueda iniciarse.
              </div>

              <div
                  v-if="
                    taskActionError &&
                    String(taskActionError.taskId) ===
                    String(task.id)
                  "
                  class="task-error-message"
                  role="alert"
              >
                <i class="pi pi-exclamation-triangle"></i>

                <div>
                  <strong>
                    No se pudo iniciar la tarea
                  </strong>

                  <span>
                    {{ taskActionError.message }}
                  </span>

                  <small
                      v-if="
                        taskActionError.available !== null &&
                        taskActionError.requested !== null
                      "
                  >
                    Disponible:
                    {{ taskActionError.available }}
                    unidades · Solicitado:
                    {{ taskActionError.requested }}
                    unidades
                  </small>
                </div>
              </div>
            </div>

            <div class="task-actions">
              <Button
                  v-if="canStartTask(task)"
                  label="Iniciar"
                  icon="pi pi-play"
                  severity="info"
                  @click="startTask(task)"
              />

              <Button
                  v-if="canCompleteTask(task)"
                  label="Completar"
                  icon="pi pi-check"
                  severity="success"
                  @click="completeTask(task)"
              />
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          {{
            translateOrFallback(
                'mechanicOrder.noTasks',
                'No existen tareas registradas para esta orden.'
            )
          }}
        </div>
      </template>
    </Card>

    <Card class="summary-card">
      <template #content>
        <div class="summary-row">
          <span>
            {{
              translateOrFallback(
                  'mechanicOrder.tasksLabel',
                  'Tareas completadas'
              )
            }}
          </span>

          <strong>
            {{ completedTasks }} / {{ tasks.length }}
          </strong>
        </div>

        <div class="summary-row">
          <span>
            {{
              translateOrFallback(
                  'mechanicOrder.progress',
                  'Progreso'
              )
            }}
          </span>

          <strong>{{ progress }}%</strong>
        </div>

        <ProgressBar
            :value="progress"
            style="height: 12px"
        />

        <div
            v-if="readyForAdministrativeReview"
            class="ready-review-message"
        >
          <i class="pi pi-send"></i>

          <div>
            <strong>
              Trabajo listo para revisión
            </strong>

            <span>
              Todas las tareas fueron completadas.
              El administrador debe validar y cerrar
              la orden.
            </span>
          </div>
        </div>
      </template>
    </Card>

    <Dialog
        v-model:visible="showTaskDialog"
        modal
        header="Nueva propuesta técnica"
        :style="{
          width: '760px',
          maxWidth: '96vw'
        }"
        @hide="closeTaskDialog"
    >
      <div class="dialog-form">
        <div class="proposal-notice">
          <i class="pi pi-info-circle"></i>

          <div>
            <strong>
              {{ $t('tasks.dialogExt.proposalNoticeTitle') }}
            </strong>

            <span>
              {{ $t('tasks.dialogExt.proposalNoticeDesc') }}
            </span>
          </div>
        </div>

        <div
            v-if="formError"
            class="form-error"
        >
          <i class="pi pi-exclamation-triangle"></i>
          {{ formError }}
        </div>

        <div class="field">
          <label class="font-bold text-sm">
            Descripción de la tarea
          </label>

          <InputText
              v-model.trim="newTask.description"
              placeholder="Ej. Cambio de pastillas delanteras"
          />
        </div>

        <div class="form-grid-2">
          <div class="field">
            <label class="font-bold text-sm">
              Prioridad
            </label>

            <Dropdown
                v-model="newTask.priority"
                :options="priorities"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione la prioridad"
            />
          </div>

          <div class="field">
            <label class="font-bold text-sm">
              Tiempo estimado
            </label>

            <InputNumber
                v-model="newTask.estimatedTime"
                :min="15"
                :max="2880"
                :step="15"
                :useGrouping="false"
                showButtons
                suffix=" min"
            />
          </div>
        </div>

        <hr class="divider" />

        <div class="inventory-section">
          <div class="section-head">
            <div>
              <label>
                <i class="pi pi-box"></i>
                Materiales o repuestos
              </label>

              <small>
                La selección crea una solicitud.
                Todavía no modifica el stock.
              </small>
            </div>

            <Button
                icon="pi pi-plus"
                label="Añadir"
                size="small"
                outlined
                @click="addPart"
            />
          </div>

          <div
              v-for="(part, index) in newTask.parts"
              :key="index"
              class="part-row"
          >
            <Dropdown
                v-model="part.inventoryItemId"
                :options="inventoryOptions"
                optionLabel="name"
                optionValue="id"
                filter
                showClear
                placeholder="Buscar repuesto..."
                class="part-select"
                @change="
                  onPartSelected(
                      $event.value,
                      index
                  )
                "
            >
              <template #option="slotProps">
                <div class="inventory-option">
                  <div class="inventory-option-header">
                    <strong>
                      {{ slotProps.option.name }}
                    </strong>

                    <span
                        class="quality-badge"
                        :class="
                          String(
                              slotProps.option
                                  .qualityTier ||
                              'STANDARD'
                          ).toLowerCase()
                        "
                    >
                      {{
                        getQualityTierLabel(
                            slotProps.option
                                .qualityTier
                        )
                      }}
                    </span>
                  </div>

                  <div class="inventory-option-details">
                    <small>
                      Marca:
                      {{
                        slotProps.option.brand ||
                        'Genérica'
                      }}
                    </small>

                    <small>
                      Presentación:
                      {{
                        slotProps.option
                            .presentation ||
                        'No especificada'
                      }}
                    </small>

                    <small>
                      Stock disponible:
                      {{ slotProps.option.stock }}
                    </small>
                  </div>
                </div>
              </template>
            </Dropdown>

            <InputNumber
                v-model="part.quantity"
                :min="1"
                :max="
                  getAvailableStock(
                      part.inventoryItemId
                  )
                "
                showButtons
                class="part-qty"
            />

            <div class="selected-part-info">
              <span>
                {{ part.brand || 'Sin marca' }}
              </span>

              <small>
                {{
                  getQualityTierLabel(
                      part.qualityTier
                  )
                }}
              </small>
            </div>

            <Button
                icon="pi pi-trash"
                text
                severity="danger"
                class="part-trash"
                @click="removePart(index)"
            />
          </div>

          <div
              v-if="newTask.parts.length === 0"
              class="empty-parts"
          >
            No hay materiales solicitados.
            La tarea puede enviarse sin repuestos.
          </div>
        </div>

        <div class="request-preview">
          <div>
            <span>Tipos de materiales</span>
            <strong>
              {{ newTask.parts.length }}
            </strong>
          </div>

          <div>
            <span>Unidades solicitadas</span>
            <strong>
              {{ requestedMaterialUnits }}
            </strong>
          </div>

          <div>
            <span>Estado inicial</span>
            <strong>Pendiente de aprobación</strong>
          </div>
        </div>

        <div class="actions">
          <Button
              label="Cancelar"
              text
              severity="secondary"
              :disabled="taskStore.saving"
              @click="closeTaskDialog"
          />

          <Button
              label="Enviar propuesta"
              icon="pi pi-send"
              :loading="taskStore.saving"
              @click="createTask"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.mechanic-order-page {
  min-height: 100vh;
  padding: 1rem;
  background: #f8fafc;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0;
}

.page-header p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.vehicle-card,
.tasks-card,
.summary-card,
.diagnosis-card {
  margin-bottom: 1rem;
  border-radius: 20px;
}

.vehicle-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.vehicle-info h2 {
  margin: 0;
}

.vehicle-info span {
  display: block;
  margin-top: 0.25rem;
  color: #64748b;
}

.vehicle-icon {
  color: #0b1680;
  font-size: 2rem;
}

.card-heading,
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-heading h3,
.section-header h3 {
  margin: 0;
}

.card-heading p,
.section-header p {
  margin: 0.3rem 0 0;
  color: #64748b;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: white;
}

.task-content {
  min-width: 0;
  flex: 1;
}

.task-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.task-content h4 {
  margin: 0;
  color: #1e293b;
  font-size: 1.1rem;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.7rem;
  color: #64748b;
  font-size: 0.9rem;
}

.approved-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #15803d;
  font-weight: 700;
}

.task-parts {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.parts-title {
  display: block;
  margin-bottom: 0.5rem;
  color: #475569;
  font-weight: bold;
}

.parts-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.approval-message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  border: 1px solid #fde68a;
  border-radius: 12px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.88rem;
  line-height: 1.45;
}

.task-error-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
  color: #b91c1c;
}

.task-error-message i {
  margin-top: 0.15rem;
  font-size: 1.1rem;
}

.task-error-message strong,
.task-error-message span,
.task-error-message small {
  display: block;
}

.task-error-message span {
  margin-top: 0.2rem;
  line-height: 1.4;
}

.task-error-message small {
  margin-top: 0.35rem;
  color: #991b1b;
  font-weight: 700;
}

.task-actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 1.05rem;
}

.ready-review-message {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  margin-top: 1.25rem;
  padding: 1rem;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  background: #f0fdf4;
  color: #166534;
}

.ready-review-message i {
  margin-top: 0.15rem;
  font-size: 1.2rem;
}

.ready-review-message strong,
.ready-review-message span {
  display: block;
}

.ready-review-message span {
  margin-top: 0.2rem;
  color: #15803d;
  line-height: 1.4;
}

.empty-state {
  padding: 2rem;
  color: #64748b;
  text-align: center;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}

.proposal-notice,
.form-error {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
}

.proposal-notice {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1e40af;
}

.proposal-notice strong,
.proposal-notice span {
  display: block;
}

.proposal-notice span {
  margin-top: 0.2rem;
  color: #475569;
  line-height: 1.4;
}

.form-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.font-bold {
  color: #334155;
  font-weight: 700;
}

.text-sm {
  font-size: 0.88rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.divider {
  margin: 0.5rem 0;
  border: none;
  border-top: 1px dashed #cbd5e1;
}

.inventory-section {
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-head label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #1e293b;
  font-weight: bold;
}

.section-head small {
  display: block;
  margin-top: 0.3rem;
  color: #64748b;
}

.part-row {
  display: grid;
  grid-template-columns:
      minmax(260px, 1fr)
      110px
      130px
      40px;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
}

.part-select {
  width: 100%;
}

.part-qty :deep(.p-inputnumber-input) {
  width: 100%;
  text-align: center;
}

.inventory-option {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.35rem;
}

.inventory-option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.inventory-option-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  color: #64748b;
}

.quality-badge {
  display: inline-flex;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
}

.quality-badge.economy {
  background: #f1f5f9;
  color: #475569;
}

.quality-badge.standard {
  background: #dbeafe;
  color: #1d4ed8;
}

.quality-badge.premium {
  background: #ffedd5;
  color: #c2410c;
}

.selected-part-info {
  display: flex;
  flex-direction: column;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 700;
}

.selected-part-info small {
  margin-top: 0.15rem;
  color: #64748b;
  font-weight: 500;
}

.part-trash {
  margin: 0 auto;
}

.empty-parts {
  padding: 0.75rem 0;
  color: #94a3b8;
  font-size: 0.9rem;
  text-align: center;
}

.request-preview {
  display: grid;
  grid-template-columns:
      repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.request-preview > div {
  padding: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: #ffffff;
}

.request-preview span {
  display: block;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
}

.request-preview strong {
  display: block;
  margin-top: 0.25rem;
  color: #0f172a;
  overflow-wrap: anywhere;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

:deep(.p-inputnumber),
:deep(.p-dropdown),
:deep(.p-inputtext),
:deep(.p-textarea) {
  width: 100%;
}

@media (min-width: 900px) {
  .mechanic-order-page {
    max-width: 1000px;
    margin: auto;
  }
}

@media (max-width: 760px) {
  .card-heading,
  .section-header,
  .task-item,
  .section-head {
    flex-direction: column;
  }

  .task-actions {
    width: 100%;
  }

  .task-actions :deep(.p-button) {
    flex: 1;
  }

  .form-grid-2,
  .request-preview,
  .part-row {
    grid-template-columns: 1fr;
  }

  .part-trash {
    margin-left: auto;
  }
}
</style>