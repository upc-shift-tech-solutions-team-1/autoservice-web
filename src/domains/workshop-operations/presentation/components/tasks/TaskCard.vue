<script setup>
/**
 * @file TaskCard.vue
 * @description Administrative task card with quotation,
 * execution and final review workflow information.
 */

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Tag from 'primevue/tag';

const { t, te } = useI18n();

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

defineEmits([
  'edit',
  'delete',
  'go-order',
  'review'
]);

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
 * @param {*} value - Raw numeric value.
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
 * Rounds a numeric value to two decimal places.
 *
 * @param {*} value - Raw numeric value.
 * @returns {number}
 */
const roundToTwoDecimals = (value) =>
    Math.round(
        (toNumber(value) + Number.EPSILON) * 100
    ) / 100;

/**
 * Formats an amount using Peruvian currency.
 *
 * @param {*} value - Raw monetary value.
 * @returns {string}
 */
const formatCurrency = (value) =>
    toNumber(value).toLocaleString('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    });

/**
 * Normalizes values for reliable comparisons.
 *
 * @param {*} value - Raw status value.
 * @returns {string}
 */
const normalizeText = (value) =>
    String(value || '')
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s-]+/g, '_');

/**
 * Normalizes current and legacy task status values.
 *
 * @param {*} value - Raw task status.
 * @returns {string}
 */
const normalizeTaskStatus = (value) => {
  const normalized = normalizeText(value);

  const aliases = {
    PENDIENTE: TASK_STATUS.PENDING,
    PENDING: TASK_STATUS.PENDING,

    EN_PROCESO: TASK_STATUS.IN_PROGRESS,
    EN_EJECUCION: TASK_STATUS.IN_PROGRESS,
    IN_PROGRESS: TASK_STATUS.IN_PROGRESS,

    COMPLETADA: TASK_STATUS.COMPLETED,
    COMPLETADO: TASK_STATUS.COMPLETED,
    FINALIZADA: TASK_STATUS.COMPLETED,
    COMPLETED: TASK_STATUS.COMPLETED
  };

  return aliases[normalized] || normalized;
};

/**
 * Normalizes current and legacy review status values.
 *
 * @param {*} value - Raw administrative review status.
 * @returns {string}
 */
const normalizeReviewStatus = (value) => {
  const normalized = normalizeText(value);

  const aliases = {
    SUBMITTED: REVIEW_STATUS.SUBMITTED,
    ENVIADO_AL_ADMINISTRADOR:
    REVIEW_STATUS.SUBMITTED,
    ENVIADA_AL_ADMINISTRADOR:
    REVIEW_STATUS.SUBMITTED,
    PENDIENTE_DE_APROBACION:
    REVIEW_STATUS.SUBMITTED,
    PENDIENTE_DE_REVISION:
    REVIEW_STATUS.SUBMITTED,

    APPROVED: REVIEW_STATUS.APPROVED,
    APROBADO: REVIEW_STATUS.APPROVED,
    APROBADA: REVIEW_STATUS.APPROVED,

    REJECTED: REVIEW_STATUS.REJECTED,
    RECHAZADO: REVIEW_STATUS.REJECTED,
    RECHAZADA: REVIEW_STATUS.REJECTED
  };

  return aliases[normalized] || normalized;
};

/**
 * Returns the complete task entity stored inside
 * the visual task model.
 */
const rawTask = computed(() =>
    props.task.raw || props.task
);

const taskStatus = computed(() =>
    normalizeTaskStatus(
        rawTask.value.status
    )
);

const reviewStatus = computed(() =>
    normalizeReviewStatus(
        rawTask.value.adminReviewStatus
    )
);

/**
 * Returns task materials safely.
 */
const materials = computed(() =>
    Array.isArray(rawTask.value.parts)
        ? rawTask.value.parts
        : []
);

const hasMaterials = computed(() =>
    materials.value.length > 0
);

/**
 * Calculates material sale value when the backend
 * total is not available.
 */
const calculatedMaterialsRevenue = computed(() =>
    roundToTwoDecimals(
        materials.value.reduce(
            (sum, part) =>
                sum +
                (
                    toNumber(part.unitPrice) *
                    Math.max(
                        1,
                        toNumber(part.quantity, 1)
                    )
                ),
            0
        )
    )
);

/**
 * Calculates material purchase cost when the backend
 * total is not available.
 */
const calculatedMaterialsPurchaseCost = computed(() =>
    roundToTwoDecimals(
        materials.value.reduce(
            (sum, part) =>
                sum +
                (
                    toNumber(part.purchasePrice) *
                    Math.max(
                        1,
                        toNumber(part.quantity, 1)
                    )
                ),
            0
        )
    )
);

/**
 * Uses the stored value when it contains meaningful
 * information. Otherwise, it uses the calculated value.
 *
 * This protects older records whose derived totals
 * were saved as zero.
 *
 * @param {*} storedValue - Stored backend value.
 * @param {*} calculatedValue - Calculated fallback.
 * @returns {number}
 */
const resolveFinancialValue = (
    storedValue,
    calculatedValue
) => {
  const stored = roundToTwoDecimals(storedValue);
  const calculated =
      roundToTwoDecimals(calculatedValue);

  if (stored !== 0 || calculated === 0) {
    return stored;
  }

  return calculated;
};

/**
 * Consolidated task financial information.
 */
const financialSummary = computed(() => {
  const laborRevenue = roundToTwoDecimals(
      rawTask.value.laborPrice
  );

  const laborCost = roundToTwoDecimals(
      rawTask.value.laborCost
  );

  const materialsRevenue =
      resolveFinancialValue(
          rawTask.value.materialsCost,
          calculatedMaterialsRevenue.value
      );

  const materialsCost =
      resolveFinancialValue(
          rawTask.value.materialsPurchaseCost,
          calculatedMaterialsPurchaseCost.value
      );

  const calculatedRevenue = roundToTwoDecimals(
      laborRevenue + materialsRevenue
  );

  const calculatedCost = roundToTwoDecimals(
      laborCost + materialsCost
  );

  const totalRevenue =
      resolveFinancialValue(
          rawTask.value.totalRevenue,
          calculatedRevenue
      );

  const totalCost =
      resolveFinancialValue(
          rawTask.value.totalCost,
          calculatedCost
      );

  const calculatedProfit = roundToTwoDecimals(
      totalRevenue - totalCost
  );

  const profit =
      resolveFinancialValue(
          rawTask.value.profit,
          calculatedProfit
      );

  const calculatedMargin =
      totalRevenue > 0
          ? roundToTwoDecimals(
              (profit / totalRevenue) * 100
          )
          : 0;

  const marginPercentage =
      resolveFinancialValue(
          rawTask.value.marginPercentage,
          calculatedMargin
      );

  return {
    laborRevenue,
    laborCost,
    materialsRevenue,
    materialsCost,
    totalRevenue,
    totalCost,
    profit,
    marginPercentage
  };
});

/**
 * Indicates that a mechanic proposal is waiting
 * for administrator quotation.
 */
const isWaitingForQuotation = computed(() =>
    taskStatus.value === TASK_STATUS.PENDING &&
    reviewStatus.value ===
    REVIEW_STATUS.SUBMITTED
);

/**
 * Indicates that the quotation was approved and
 * the mechanic can begin execution.
 */
const isQuotationApproved = computed(() =>
    taskStatus.value === TASK_STATUS.PENDING &&
    reviewStatus.value ===
    REVIEW_STATUS.APPROVED
);

/**
 * Indicates that the mechanic is executing the task.
 */
const isInProgress = computed(() =>
    taskStatus.value ===
    TASK_STATUS.IN_PROGRESS
);

/**
 * Indicates that the completed task is waiting
 * for final administrator validation.
 */
const isWaitingForFinalReview = computed(() =>
    taskStatus.value === TASK_STATUS.COMPLETED &&
    reviewStatus.value ===
    REVIEW_STATUS.SUBMITTED
);

/**
 * Indicates that the task was completed and approved.
 */
const isCompletedAndApproved = computed(() =>
    taskStatus.value === TASK_STATUS.COMPLETED &&
    reviewStatus.value ===
    REVIEW_STATUS.APPROVED
);

/**
 * Indicates that the administrator rejected the last
 * mechanic submission or quotation state.
 */
const isRejected = computed(() =>
    reviewStatus.value ===
    REVIEW_STATUS.REJECTED
);

/**
 * Returns the current workflow label.
 */
const workflowLabel = computed(() => {
  if (isWaitingForQuotation.value) {
    return 'Esperando cotización';
  }

  if (isQuotationApproved.value) {
    return 'Cotización aprobada';
  }

  if (isInProgress.value) {
    return 'En ejecución';
  }

  if (isWaitingForFinalReview.value) {
    return 'Esperando validación';
  }

  if (isCompletedAndApproved.value) {
    return 'Completada y validada';
  }

  if (isRejected.value) {
    return 'Requiere corrección';
  }

  if (
      taskStatus.value ===
      TASK_STATUS.COMPLETED
  ) {
    return translateOrFallback(
        'taskStatus.completed',
        'Completada'
    );
  }

  return translateOrFallback(
      'taskStatus.pending',
      'Pendiente'
  );
});

/**
 * Returns the severity associated with the current
 * task workflow.
 */
const workflowSeverity = computed(() => {
  if (
      isWaitingForQuotation.value ||
      isWaitingForFinalReview.value
  ) {
    return 'warn';
  }

  if (
      isQuotationApproved.value ||
      isCompletedAndApproved.value
  ) {
    return 'success';
  }

  if (isInProgress.value) {
    return 'info';
  }

  if (isRejected.value) {
    return 'danger';
  }

  if (
      taskStatus.value ===
      TASK_STATUS.COMPLETED
  ) {
    return 'success';
  }

  return 'secondary';
});

/**
 * Determines whether the administrator can edit
 * task quotation information.
 */
const canEditQuotation = computed(() =>
    taskStatus.value === TASK_STATUS.PENDING
);

/**
 * Formats estimated time stored in minutes.
 *
 * @param {*} value - Estimated minutes.
 * @returns {string}
 */
const formatEstimatedTime = (value) => {
  const totalMinutes = Math.max(
      0,
      Math.round(toNumber(value))
  );

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(
      totalMinutes / 60
  );

  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

/**
 * Returns the material section label according
 * to the current execution state.
 */
const materialsTitle = computed(() =>
    taskStatus.value === TASK_STATUS.COMPLETED
        ? 'Materiales utilizados'
        : 'Materiales solicitados'
);
</script>

<template>
  <article class="task-card">
    <div
        v-if="task.photo"
        class="image-wrapper"
    >
      <img
          :src="task.photo"
          :alt="
            translateOrFallback(
                'tasks.card.imageAlt',
                'Evidencia de la tarea'
            )
          "
          class="task-image"
      />
    </div>

    <div class="task-content">
      <div class="task-top">
        <div class="task-title-group">
          <Tag
              :value="task.workOrderCode"
              severity="secondary"
              rounded
          />

          <h3>{{ task.description }}</h3>
        </div>

        <Tag
            :value="workflowLabel"
            :severity="workflowSeverity"
            rounded
            class="workflow-tag"
        />
      </div>

      <div class="task-meta">
        <span>
          <i class="pi pi-user"></i>
          {{ task.mechanicName }}
        </span>

        <span>
          <i class="pi pi-clock"></i>

          {{
            formatEstimatedTime(
                task.estimatedTime
            )
          }}
        </span>

        <span v-if="task.priority">
          <i class="pi pi-flag"></i>

          {{
            translateOrFallback(
                `priorities.${String(
                    task.priority
                ).toLowerCase()}`,
                task.priority
            )
          }}
        </span>
      </div>

      <div class="approval-flow">
        <div
            v-if="isWaitingForQuotation"
            class="flow-badge flow-badge--warning"
        >
          <i class="pi pi-file-edit"></i>

          <div>
            <strong>
              Propuesta técnica recibida
            </strong>

            <span>
              Define la mano de obra y revisa los
              materiales antes de aprobarla.
            </span>
          </div>

          <Button
              label="Cotizar"
              icon="pi pi-calculator"
              size="small"
              severity="warn"
              outlined
              @click.stop="$emit('edit', task)"
          />
        </div>

        <div
            v-else-if="isQuotationApproved"
            class="flow-badge flow-badge--success"
        >
          <i class="pi pi-check-circle"></i>

          <div>
            <strong>
              Cotización aprobada
            </strong>

            <span>
              La tarea está disponible para que el
              mecánico la inicie.
            </span>
          </div>

          <Button
              label="Ajustar"
              icon="pi pi-pencil"
              size="small"
              severity="success"
              outlined
              @click.stop="$emit('edit', task)"
          />
        </div>

        <div
            v-else-if="isInProgress"
            class="flow-badge flow-badge--progress"
        >
          <i class="pi pi-cog pi-spin"></i>

          <div>
            <strong>Trabajo en ejecución</strong>

            <span>
              El mecánico está realizando esta tarea.
            </span>
          </div>
        </div>

        <div
            v-else-if="isWaitingForFinalReview"
            class="flow-badge flow-badge--warning"
        >
          <i class="pi pi-exclamation-circle"></i>

          <div>
            <strong>
              Revisión final requerida
            </strong>

            <span>
              El mecánico completó el trabajo y espera
              la validación administrativa.
            </span>
          </div>

          <Button
              :label="
                translateOrFallback(
                    'tasks.actions.review',
                    'Revisar'
                )
              "
              icon="pi pi-search"
              size="small"
              severity="warn"
              outlined
              @click.stop="
                $emit('review', rawTask)
              "
          />
        </div>

        <div
            v-else-if="isCompletedAndApproved"
            class="flow-badge flow-badge--success"
        >
          <i class="pi pi-verified"></i>

          <div>
            <strong>
              Trabajo validado
            </strong>

            <span>
              La tarea fue completada y aprobada.
            </span>
          </div>
        </div>

        <div
            v-else-if="isRejected"
            class="flow-badge flow-badge--danger"
        >
          <i class="pi pi-times-circle"></i>

          <div>
            <strong>
              Requiere corrección
            </strong>

            <span>
              La tarea fue devuelta para realizar
              ajustes.
            </span>
          </div>
        </div>

        <div
            v-else
            class="flow-badge flow-badge--neutral"
        >
          <i class="pi pi-clock"></i>

          <div>
            <strong>Tarea pendiente</strong>

            <span>
              Está registrada y pendiente de ejecución.
            </span>
          </div>
        </div>
      </div>

      <div
          v-if="hasMaterials"
          class="materials-box"
      >
        <h4>
          <i class="pi pi-box"></i>
          {{ materialsTitle }}
        </h4>

        <div class="materials-list">
          <div
              v-for="(part, index) in materials"
              :key="
                `${part.inventoryItemId}-${index}`
              "
              class="material-item"
          >
            <div class="material-description">
              <div>
                <strong>
                  {{ part.quantity }}x
                </strong>

                <span>{{ part.name }}</span>
              </div>

              <small>
                {{ part.brand || 'Sin marca' }}
                ·
                {{
                  part.qualityTier ||
                  'STANDARD'
                }}
              </small>
            </div>

            <span class="material-sale-value">
              {{
                formatCurrency(
                    toNumber(part.unitPrice) *
                    Math.max(
                        1,
                        toNumber(
                            part.quantity,
                            1
                        )
                    )
                )
              }}
            </span>
          </div>
        </div>
      </div>

      <div class="financial-summary">
        <div class="financial-column">
          <span>Ingresos</span>

          <div>
            <label>Mano de obra</label>

            <strong>
              {{
                formatCurrency(
                    financialSummary
                        .laborRevenue
                )
              }}
            </strong>
          </div>

          <div>
            <label>Materiales</label>

            <strong>
              {{
                formatCurrency(
                    financialSummary
                        .materialsRevenue
                )
              }}
            </strong>
          </div>

          <div class="financial-total">
            <label>Total</label>

            <strong>
              {{
                formatCurrency(
                    financialSummary
                        .totalRevenue
                )
              }}
            </strong>
          </div>
        </div>

        <div class="financial-column">
          <span>Costos internos</span>

          <div>
            <label>Mano de obra</label>

            <strong>
              {{
                formatCurrency(
                    financialSummary.laborCost
                )
              }}
            </strong>
          </div>

          <div>
            <label>Materiales</label>

            <strong>
              {{
                formatCurrency(
                    financialSummary
                        .materialsCost
                )
              }}
            </strong>
          </div>

          <div class="financial-total">
            <label>Total</label>

            <strong>
              {{
                formatCurrency(
                    financialSummary.totalCost
                )
              }}
            </strong>
          </div>
        </div>

        <div
            class="financial-result"
            :class="{
              profit:
                  financialSummary.profit >= 0,
              loss:
                  financialSummary.profit < 0
            }"
        >
          <div>
            <span>
              {{
                financialSummary.profit >= 0
                    ? 'Utilidad estimada'
                    : 'Pérdida estimada'
              }}
            </span>

            <small>
              Margen:
              {{
                financialSummary
                    .marginPercentage
                    .toFixed(2)
              }}%
            </small>
          </div>

          <strong>
            {{
              formatCurrency(
                  financialSummary.profit
              )
            }}
          </strong>
        </div>
      </div>

      <div class="task-actions">
        <Button
            v-tooltip.top="
              translateOrFallback(
                  'tasks.actions.viewOrder',
                  'Ver orden'
              )
            "
            icon="pi pi-external-link"
            text
            rounded
            @click.stop="
              $emit(
                  'go-order',
                  task.workOrderId
              )
            "
        />

        <Button
            v-if="
              canEditQuotation &&
              !isWaitingForQuotation &&
              !isQuotationApproved
            "
            v-tooltip.top="
              translateOrFallback(
                  'actions.edit',
                  'Editar'
              )
            "
            icon="pi pi-pencil"
            text
            rounded
            severity="info"
            @click.stop="$emit('edit', task)"
        />

        <Button
            v-tooltip.top="
              translateOrFallback(
                  'actions.delete',
                  'Eliminar'
              )
            "
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            @click.stop="$emit('delete', task)"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.task-card {
  display: flex;
  width: 100%;
  min-width: 0;
  gap: 1.25rem;
  padding: 1.4rem;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #ffffff;
  box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition:
      box-shadow 0.2s ease,
      transform 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow:
      0 8px 20px rgba(15, 23, 42, 0.08);
}

.image-wrapper {
  width: 90px;
  flex-shrink: 0;
}

.task-image {
  width: 90px;
  height: 90px;
  border-radius: 14px;
  object-fit: cover;
}

.task-content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
}

.task-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.task-title-group {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
}

.task-title-group h3 {
  width: 100%;
  margin: 0;
  overflow-wrap: anywhere;
  color: #1e293b;
  font-size: 1.15rem;
  font-weight: 750;
  line-height: 1.45;
  white-space: normal;
}

.workflow-tag {
  max-width: 220px;
  flex-shrink: 0;
  text-align: center;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  color: #64748b;
  font-size: 0.92rem;
}

.task-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.approval-flow {
  display: flex;
  align-items: center;
}

.flow-badge {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-radius: 13px;
  font-size: 0.88rem;
}

.flow-badge > i {
  flex-shrink: 0;
  font-size: 1.1rem;
}

.flow-badge > div {
  min-width: 0;
  flex: 1;
}

.flow-badge strong,
.flow-badge span {
  display: block;
}

.flow-badge span {
  margin-top: 0.2rem;
  opacity: 0.86;
  line-height: 1.45;
}

.flow-badge :deep(.p-button) {
  flex-shrink: 0;
}

.flow-badge--warning {
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.flow-badge--success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.flow-badge--progress {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1e40af;
}

.flow-badge--danger {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.flow-badge--neutral {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
}

.materials-box {
  padding: 1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 13px;
  background: #f8fafc;
}

.materials-box h4 {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.8rem;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.material-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #1e293b;
  font-size: 0.95rem;
}

.material-description {
  min-width: 0;
  flex: 1;
}

.material-description > div {
  overflow-wrap: anywhere;
}

.material-description strong {
  margin-right: 0.35rem;
  color: #0b1680;
}

.material-description small {
  display: block;
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.76rem;
}

.material-sale-value {
  flex-shrink: 0;
  color: #0b1680;
  font-weight: 800;
}

.financial-summary {
  display: grid;
  grid-template-columns:
      repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.financial-column,
.financial-result {
  min-width: 0;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: #f8fafc;
}

.financial-column > span {
  display: block;
  margin-bottom: 0.7rem;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.financial-column > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.45rem;
  color: #64748b;
  font-size: 0.86rem;
}

.financial-column label {
  min-width: 0;
}

.financial-column strong {
  flex-shrink: 0;
  color: #0f172a;
  white-space: nowrap;
}

.financial-total {
  margin-top: 0.7rem !important;
  padding-top: 0.7rem;
  border-top: 1px solid #e2e8f0;
  color: #334155 !important;
  font-weight: 800;
}

.financial-result {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.financial-result > div {
  min-width: 0;
}

.financial-result span,
.financial-result small {
  display: block;
}

.financial-result span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.financial-result small {
  margin-top: 0.3rem;
  color: #64748b;
}

.financial-result > strong {
  flex-shrink: 0;
  font-size: 1.4rem;
  white-space: nowrap;
}

.financial-result.profit {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.financial-result.profit > strong {
  color: #15803d;
}

.financial-result.loss {
  border-color: #fecaca;
  background: #fef2f2;
}

.financial-result.loss > strong {
  color: #dc2626;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-top: auto;
  padding-top: 0.7rem;
  border-top: 1px solid #f1f5f9;
}

@media (max-width: 680px) {
  .task-card,
  .task-top,
  .material-item {
    flex-direction: column;
  }

  .task-top {
    align-items: stretch;
  }

  .workflow-tag {
    max-width: 100%;
    align-self: flex-start;
  }

  .financial-summary {
    grid-template-columns: 1fr;
  }

  .financial-result {
    grid-column: auto;
  }

  .flow-badge {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .flow-badge :deep(.p-button) {
    width: 100%;
  }

  .material-item {
    align-items: stretch;
  }

  .material-sale-value {
    align-self: flex-end;
  }
}
</style>