<script setup>
/**
 * @file TaskDialog.vue
 * @description Dialog for task creation and editing.
 */

import {
  computed,
  onMounted,
  watch
} from 'vue';

import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';

import { useInventoryStore } from '../../../../inventory-management/application/inventory.store';

const { t, te } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },

  task: {
    type: Object,
    required: true
  },

  workOrderOptions: {
    type: Array,
    default: () => []
  },

  mechanicOptions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'update:visible',
  'save',
  'cancel'
]);

const inventoryStore = useInventoryStore();

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
 * @param {number} fallback - Fallback numeric value.
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
 * @param {number} fallback - Fallback integer value.
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

/**
 * Formats a value as Peruvian currency.
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
 * Ensures that the task contains all financial
 * and inventory properties required by the form.
 */
const initializeTaskFields = () => {
  if (!Array.isArray(props.task.parts)) {
    props.task.parts = [];
  }

  if (
      props.task.laborPrice === null ||
      props.task.laborPrice === undefined
  ) {
    props.task.laborPrice = 0;
  }

  if (
      props.task.laborCost === null ||
      props.task.laborCost === undefined
  ) {
    props.task.laborCost = 0;
  }

  if (
      props.task.materialsCost === null ||
      props.task.materialsCost === undefined
  ) {
    props.task.materialsCost = 0;
  }

  if (
      props.task.materialsPurchaseCost === null ||
      props.task.materialsPurchaseCost === undefined
  ) {
    props.task.materialsPurchaseCost = 0;
  }
};

onMounted(async () => {
  initializeTaskFields();

  if (inventoryStore.items.length === 0) {
    await inventoryStore.fetchItems();
  }
});

watch(
    () => props.visible,
    async (isVisible) => {
      if (!isVisible) return;

      initializeTaskFields();

      if (inventoryStore.items.length === 0) {
        await inventoryStore.fetchItems();
      }
    }
);

/**
 * Inventory options enriched with stock availability.
 */
const inventoryOptions = computed(() =>
    inventoryStore.items.map(item => ({
      ...item,
      disabled: false
    }))
);

/**
 * Returns the current task parts.
 */
const taskParts = computed(() =>
    Array.isArray(props.task.parts)
        ? props.task.parts
        : []
);

/**
 * Adds a new part row.
 */
const addPart = () => {
  if (!Array.isArray(props.task.parts)) {
    props.task.parts = [];
  }

  props.task.parts.push({
    inventoryItemId: null,
    name: '',
    quantity: 1,

    /**
     * Amount charged to the customer.
     */
    unitPrice: 0,

    /**
     * Purchase cost paid by the workshop.
     */
    purchasePrice: 0,

    brand: '',
    qualityTier: 'STANDARD'
  });
};

/**
 * Removes a part row.
 *
 * @param {number} index - Part index.
 */
const removePart = (index) => {
  props.task.parts.splice(index, 1);
};

/**
 * Updates selected part information.
 *
 * @param {string|number|null} itemId - Inventory item id.
 * @param {number} index - Part index.
 */
const onPartSelected = (itemId, index) => {
  const part = props.task.parts[index];

  if (!part) return;

  const item = inventoryStore.items.find(
      inventoryItem =>
          String(inventoryItem.id) ===
          String(itemId)
  );

  if (!item) {
    part.name = '';
    part.unitPrice = 0;
    part.purchasePrice = 0;
    part.brand = '';
    part.qualityTier = 'STANDARD';

    return;
  }

  part.name = item.name;

  part.unitPrice =
      roundToTwoDecimals(item.unitPrice);

  part.purchasePrice =
      roundToTwoDecimals(item.purchasePrice);

  part.brand = item.brand || 'GENERIC';

  part.qualityTier =
      item.qualityTier || 'STANDARD';
};

/**
 * Returns available inventory stock for a selected part.
 *
 * @param {string|number|null} itemId - Inventory item id.
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
 * Resolves a quality tier domain value to an interface label.
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
 * Calculates the amount charged for task materials.
 */
const materialsSaleTotal = computed(() =>
    roundToTwoDecimals(
        taskParts.value.reduce(
            (sum, part) => {
              const quantity = Math.max(
                  1,
                  toInteger(part.quantity, 1)
              );

              return (
                  sum +
                  toNumber(part.unitPrice) *
                  quantity
              );
            },
            0
        )
    )
);

/**
 * Calculates the internal purchase cost of task materials.
 */
const materialsPurchaseTotal = computed(() =>
    roundToTwoDecimals(
        taskParts.value.reduce(
            (sum, part) => {
              const quantity = Math.max(
                  1,
                  toInteger(part.quantity, 1)
              );

              return (
                  sum +
                  toNumber(part.purchasePrice) *
                  quantity
              );
            },
            0
        )
    )
);

/**
 * Calculates total task revenue.
 */
const totalRevenue = computed(() =>
    roundToTwoDecimals(
        toNumber(props.task.laborPrice) +
        materialsSaleTotal.value
    )
);

/**
 * Calculates total internal task cost.
 */
const totalCost = computed(() =>
    roundToTwoDecimals(
        toNumber(props.task.laborCost) +
        materialsPurchaseTotal.value
    )
);

/**
 * Calculates estimated task profit or loss.
 */
const estimatedProfit = computed(() =>
    roundToTwoDecimals(
        totalRevenue.value -
        totalCost.value
    )
);

/**
 * Calculates estimated task profit margin.
 */
const estimatedMarginPercentage = computed(() => {
  if (totalRevenue.value <= 0) return 0;

  return roundToTwoDecimals(
      (
          estimatedProfit.value /
          totalRevenue.value
      ) * 100
  );
});

/**
 * Synchronizes calculated financial values with the
 * task object that will be sent by the parent component.
 */
watch(
    [
      materialsSaleTotal,
      materialsPurchaseTotal,
      totalRevenue,
      totalCost,
      estimatedProfit,
      estimatedMarginPercentage
    ],
    ([
       materialsRevenue,
       materialsPurchaseCost,
       revenue,
       cost,
       profit,
       marginPercentage
     ]) => {
      props.task.materialsCost =
          materialsRevenue;

      props.task.materialsPurchaseCost =
          materialsPurchaseCost;

      props.task.totalRevenue = revenue;
      props.task.totalCost = cost;
      props.task.profit = profit;

      props.task.marginPercentage =
          marginPercentage;
    },
    {
      immediate: true
    }
);
const handleSave = () => {
  if (!props.task.status || props.task.status === 'PENDING') {
    props.task.adminReviewStatus = 'APPROVED';
    props.task.customerReportStatus = 'VISIBLE';
  }
  emit('save');
};

watch(
    () => props.task.estimatedTime,
    (newTime) => {
      if (!props.task.id && newTime > 0) {
        const costPerMinute = 0.50;

        props.task.laborCost = roundToTwoDecimals(newTime * costPerMinute);

        props.task.laborPrice = roundToTwoDecimals(props.task.laborCost * 2);
      }
    }
);
</script>

<template>
  <Dialog
      :visible="visible"
      :header="
        task?.id
          ? t('tasks.dialog.editTitle')
          : t('tasks.dialog.createTitle')
      "
      :modal="true"
      :closable="true"
      :style="{
        width: '860px',
        maxWidth: '96vw'
      }"
      class="p-fluid"
      @update:visible="
        $emit('update:visible', $event)
      "
  >
    <div class="dialog-body">
      <div class="field">
        <label>
          {{ t('tasks.dialog.workOrder') }}

          <span class="required">
            *
          </span>
        </label>

        <Select
            v-model="task.workOrderId"
            :options="workOrderOptions"
            option-label="trackingCode"
            option-value="id"
            :placeholder="
              t('tasks.dialog.selectWorkOrder')
            "
            filter
        />
      </div>

      <div class="field">
        <label>
          {{ t('tasks.dialog.description') }}

          <span class="required">
            *
          </span>
        </label>

        <InputText
            v-model.trim="task.description"
            :placeholder="
              t(
                'tasks.dialog.descriptionPlaceholder'
              )
            "
        />
      </div>

      <div class="row-grid">
        <div class="field">
          <label>
            {{
              t(
                  'tasks.dialog.assignedMechanic'
              )
            }}
          </label>

          <Select
              v-model="task.mechanicId"
              :options="mechanicOptions"
              option-label="fullName"
              option-value="id"
              :placeholder="
                t(
                    'tasks.dialog.selectMechanic'
                )
              "
              filter
              showClear
          />
        </div>

        <div class="field">
          <label>
            {{
              translateOrFallback(
                  'tasks.dialog.estimatedTime',
                  'Tiempo estimado en minutos'
              )
            }}
          </label>

          <InputNumber
              v-model="task.estimatedTime"
              :min="0"
              :useGrouping="false"
              suffix=" min"
          />
        </div>
      </div>

      <section class="financial-section">
        <div class="section-title">
          <div>
            <i class="pi pi-wallet"></i>

            <div>
              <strong>
                Información financiera
              </strong>

              <small>
                Diferencia entre el precio cobrado
                y el costo asumido por el taller.
              </small>
            </div>
          </div>
        </div>

        <div class="row-grid">
          <div class="field">
            <label>
              {{
                translateOrFallback(
                    'tasks.dialog.laborPrice',
                    'Precio de mano de obra'
                )
              }}
            </label>

            <InputNumber
                v-model="task.laborPrice"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :min="0"
                :minFractionDigits="2"
                :maxFractionDigits="2"
            />

            <small class="field-help">
              Importe cobrado al cliente.
            </small>
          </div>

          <div class="field">
            <label>
              {{
                translateOrFallback(
                    'tasks.dialog.internalLaborCost',
                    'Costo interno de mano de obra'
                )
              }}
            </label>

            <InputNumber
                v-model="task.laborCost"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :min="0"
                :minFractionDigits="2"
                :maxFractionDigits="2"
            />

            <small class="field-help">
              Costo interno asumido por el taller.
            </small>
          </div>
        </div>
      </section>

      <hr class="divider" />

      <div class="inventory-section">
        <div class="section-head">
          <div>
            <label>
              <i class="pi pi-box"></i>

              {{ t('tasks.dialog.partsTitle') }}
            </label>

            <small>
              Seleccione marca y gama según
              disponibilidad del inventario.
            </small>
          </div>

          <Button
              icon="pi pi-plus"
              :label="t('actions.add')"
              size="small"
              outlined
              @click="addPart"
          />
        </div>

        <div
            v-for="(part, index) in task.parts"
            :key="index"
            class="part-row"
        >
          <Select
              v-model="part.inventoryItemId"
              :options="inventoryOptions"
              optionLabel="name"
              optionValue="id"
              filter
              showClear
              :placeholder="
                t(
                    'tasks.dialog.searchInventory'
                )
              "
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
                    Stock:
                    {{ slotProps.option.stock }}
                  </small>

                  <small>
                    Venta:
                    {{
                      formatCurrency(
                          slotProps.option
                              .unitPrice
                      )
                    }}
                  </small>

                  <small>
                    Compra:
                    {{
                      formatCurrency(
                          slotProps.option
                              .purchasePrice
                      )
                    }}
                  </small>
                </div>
              </div>
            </template>
          </Select>

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

          <div class="part-subtotal">
            <span>
              Venta
            </span>

            <strong>
              {{
                formatCurrency(
                    toNumber(part.unitPrice) *
                    Math.max(
                        1,
                        toInteger(
                            part.quantity,
                            1
                        )
                    )
                )
              }}
            </strong>

            <small>
              Costo:
              {{
                formatCurrency(
                    toNumber(
                        part.purchasePrice
                    ) *
                    Math.max(
                        1,
                        toInteger(
                            part.quantity,
                            1
                        )
                    )
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
            v-if="
              !task.parts ||
              task.parts.length === 0
            "
            class="empty-parts"
        >
          {{ t('tasks.dialog.emptyParts') }}
        </div>
      </div>

      <div class="financial-summary">
        <div class="summary-item">
          <span>
            Venta de materiales
          </span>

          <strong>
            {{
              formatCurrency(
                  materialsSaleTotal
              )
            }}
          </strong>
        </div>

        <div class="summary-item">
          <span>
            Costo de materiales
          </span>

          <strong>
            {{
              formatCurrency(
                  materialsPurchaseTotal
              )
            }}
          </strong>
        </div>

        <div class="summary-item">
          <span>
            Ingreso total
          </span>

          <strong>
            {{ formatCurrency(totalRevenue) }}
          </strong>
        </div>

        <div class="summary-item">
          <span>
            Costo total
          </span>

          <strong>
            {{ formatCurrency(totalCost) }}
          </strong>
        </div>
      </div>

      <div
          class="total-preview"
          :class="{
            profit: estimatedProfit >= 0,
            loss: estimatedProfit < 0
          }"
      >
        <div>
          <span>
            {{
              estimatedProfit >= 0
                  ? 'Utilidad estimada'
                  : 'Pérdida estimada'
            }}
          </span>

          <small>
            Margen:
            {{
              estimatedMarginPercentage
                  .toFixed(2)
            }}%
          </small>
        </div>

        <h2>
          {{ formatCurrency(estimatedProfit) }}
        </h2>
      </div>
    </div>

    <template #footer>
      <Button
          :label="t('actions.cancel')"
          text
          severity="secondary"
          @click="$emit('cancel')"
      />

      <Button
          :label="
            task?.id
              ? t('tasks.actions.saveChanges')
              : t('tasks.actions.create')
          "
          icon="pi pi-check"
          class="save-btn"
          @click="handleSave"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  color: #475569;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
}

.field-help {
  color: #94a3b8;
  line-height: 1.35;
}

.required {
  color: #ef4444;
}

.row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.divider {
  margin: 0.5rem 0;
  border: 0;
  border-top: 1px solid #e2e8f0;
}

.financial-section {
  padding: 1.25rem;
  border: 1px solid #c7d2fe;
  border-radius: 16px;
  background: #f8faff;
}

.section-title {
  margin-bottom: 1rem;
}

.section-title > div {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title i {
  display: flex;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: #e0e7ff;
  color: #0b1680;
  font-size: 1.1rem;
}

.section-title strong {
  display: block;
  color: #0f172a;
}

.section-title small {
  display: block;
  margin-top: 0.2rem;
  color: #64748b;
}

.inventory-section {
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
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
  gap: 0.5rem;
  color: #0f172a;
  font-weight: 700;
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
  border-radius: 12px;
  background: #ffffff;
}

.part-select,
.part-qty {
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
  gap: 0.7rem;
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

.part-subtotal {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #0b1680;
}

.part-subtotal span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.part-subtotal strong {
  margin-top: 0.15rem;
  font-size: 0.95rem;
}

.part-subtotal small {
  margin-top: 0.2rem;
  color: #94a3b8;
}

.part-trash {
  margin: 0 auto;
}

.empty-parts {
  padding: 1rem 0;
  color: #94a3b8;
  font-size: 0.9rem;
  text-align: center;
}

.financial-summary {
  display: grid;
  grid-template-columns:
      repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
}

.summary-item {
  padding: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
}

.summary-item span {
  display: block;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
}

.summary-item strong {
  display: block;
  margin-top: 0.25rem;
  color: #0f172a;
  overflow-wrap: anywhere;
}

.total-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
  padding: 1.25rem;
  border-radius: 16px;
}

.total-preview.profit {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
}

.total-preview.loss {
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.total-preview span {
  display: block;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
}

.total-preview.profit span,
.total-preview.profit h2 {
  color: #15803d;
}

.total-preview.loss span,
.total-preview.loss h2 {
  color: #dc2626;
}

.total-preview small {
  display: block;
  margin-top: 0.25rem;
  color: #64748b;
}

.total-preview h2 {
  margin: 0;
  font-size: 1.8rem;
}

.save-btn {
  border: none;
  background: #0b1680 !important;
}

:deep(.p-inputnumber),
:deep(.p-select),
:deep(.p-inputtext) {
  width: 100%;
}

@media (max-width: 800px) {
  .row-grid,
  .financial-summary {
    grid-template-columns: 1fr;
  }

  .part-row {
    grid-template-columns: 1fr;
  }

  .part-subtotal {
    align-items: flex-start;
  }

  .part-trash {
    margin-left: auto;
  }

  .section-head,
  .total-preview {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>