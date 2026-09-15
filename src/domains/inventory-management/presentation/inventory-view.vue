<script setup>
/**
 * Inventory management view:
 * - CRUD inventory items
 * - Filtering by SKU/name, brand and quality tier
 * - Stock status visualization
 * - Purchase, sale and profitability indicators
 * - Controlled provider stock receipts
 */

import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useInventoryStore } from '../application/inventory.store';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import InventoryCard from './components/InventoryCard.vue';

// ── CONSTANTS FOR DOMAIN LOGIC ───────────────────────────
/** Standardized system inventory categories */
const INVENTORY_CATEGORIES = {
  SPARE_PART: 'SPARE_PART',
  OIL: 'OIL',
  SUPPLY: 'SUPPLY',
  TOOL: 'TOOL'
};

/** Standardized quality tiers supported by the inventory domain */
const QUALITY_TIERS = {
  ECONOMY: 'ECONOMY',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM'
};

/** Standardized inventory unit measures */
const UNIT_MEASURES = {
  UNIT: 'UNIT',
  LITER: 'LITER',
  KILOGRAM: 'KILOGRAM',
  SET: 'SET',
  BOX: 'BOX'
};

const { t } = useI18n();

const inventoryStore = useInventoryStore();

const search = ref('');
const selectedBrand = ref(null);
const selectedQualityTier = ref(null);

const displayDialog = ref(false);
const saving = ref(false);
const itemForm = ref({});

const displayReceiptDialog = ref(false);
const receiptItem = ref(null);
const receiptForm = ref({
  quantity: 1,
  providerName: '',
  documentNumber: '',
  notes: ''
});
const receiptFeedback = ref(null);
const receiptError = ref('');

/**
 * Indicates whether the dialog is editing an existing item.
 */
const isEditingItem = computed(() =>
    itemForm.value.id !== null &&
    itemForm.value.id !== undefined
);

/**
 * Indicates whether a provider receipt is currently being saved.
 */
const receivingStock = computed(() =>
    receiptItem.value?.id !== null &&
    receiptItem.value?.id !== undefined &&
    String(inventoryStore.receivingId) ===
    String(receiptItem.value.id)
);

/**
 * Indicates whether the provider receipt form has valid required data.
 */
const canSubmitReceipt = computed(() =>
    toInteger(receiptForm.value.quantity, 0) > 0 &&
    Boolean(
        String(receiptForm.value.providerName || '').trim()
    ) &&
    receiptItem.value?.id !== null &&
    receiptItem.value?.id !== undefined
);

/**
 * Resolves technical category domain value to localized interface text.
 * @param {string} categoryValue - Domain code key in uppercase
 * @returns {string} Translated category label
 */
const getCategoryLabel = (categoryValue) => {
  const key = String(categoryValue || '').toLowerCase();
  return t(`inventory.categories.${key}`);
};

/**
 * Inventory categories mapped with dynamic structural translations.
 */
const categories = computed(() => [
  {
    value: INVENTORY_CATEGORIES.SPARE_PART,
    label: getCategoryLabel(INVENTORY_CATEGORIES.SPARE_PART)
  },
  {
    value: INVENTORY_CATEGORIES.OIL,
    label: getCategoryLabel(INVENTORY_CATEGORIES.OIL)
  },
  {
    value: INVENTORY_CATEGORIES.SUPPLY,
    label: getCategoryLabel(INVENTORY_CATEGORIES.SUPPLY)
  },
  {
    value: INVENTORY_CATEGORIES.TOOL,
    label: getCategoryLabel(INVENTORY_CATEGORIES.TOOL)
  }
]);

/**
 * Quality tiers available for multimarca and multigama inventory items.
 */
const qualityTiers = computed(() => [
  {
    value: QUALITY_TIERS.ECONOMY,
    label: 'Económica'
  },
  {
    value: QUALITY_TIERS.STANDARD,
    label: 'Estándar'
  },
  {
    value: QUALITY_TIERS.PREMIUM,
    label: 'Premium'
  }
]);

/**
 * Units available for stock management.
 */
const unitMeasures = computed(() => [
  {
    value: UNIT_MEASURES.UNIT,
    label: 'Unidad'
  },
  {
    value: UNIT_MEASURES.LITER,
    label: 'Litro'
  },
  {
    value: UNIT_MEASURES.KILOGRAM,
    label: 'Kilogramo'
  },
  {
    value: UNIT_MEASURES.SET,
    label: 'Juego'
  },
  {
    value: UNIT_MEASURES.BOX,
    label: 'Caja'
  }
]);

/**
 * Default images used when the user does not upload an image.
 */
const categoryImages = {
  SPARE_PART:
      'https://images.unsplash.com/photo-1613214149922-f1809c99b414',

  OIL:
      'https://images.unsplash.com/photo-1632823471565-1ecdf7d8c1b8',

  SUPPLY:
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc',

  TOOL:
      'https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac'
};

const toNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const toInteger = (value, fallback = 0) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const formatCurrency = (value) =>
    toNumber(value).toLocaleString('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    });

const inventoryItems = computed(() =>
    Array.isArray(inventoryStore.items)
        ? inventoryStore.items
        : []
);

onMounted(async () => {
  await inventoryStore.fetchItems();
});

/**
 * Returns the unique brands registered in the inventory.
 */
const brandOptions = computed(() => {
  const brands = inventoryItems.value
      .map(item => String(item.brand || '').trim())
      .filter(Boolean);

  return [...new Set(brands)]
      .sort((firstBrand, secondBrand) =>
          firstBrand.localeCompare(secondBrand)
      )
      .map(brand => ({
        value: brand,
        label: brand
      }));
});

/**
 * Filters inventory items by name, SKU, brand or quality tier.
 */
const filteredItems = computed(() => {
  const term = search.value.toLowerCase().trim();

  return inventoryItems.value.filter(item => {
    const name = String(item.name || '').toLowerCase();
    const sku = String(item.sku || '').toLowerCase();
    const brand = String(item.brand || '').toLowerCase();
    const specification = String(
        item.specification || ''
    ).toLowerCase();

    const matchesSearch =
        !term ||
        name.includes(term) ||
        sku.includes(term) ||
        brand.includes(term) ||
        specification.includes(term);

    const matchesBrand =
        !selectedBrand.value ||
        item.brand === selectedBrand.value;

    const matchesQualityTier =
        !selectedQualityTier.value ||
        item.qualityTier === selectedQualityTier.value;

    return (
        matchesSearch &&
        matchesBrand &&
        matchesQualityTier
    );
  });
});

/**
 * Total number of different inventory products.
 */
const totalItems = computed(() =>
    inventoryItems.value.length
);

/**
 * Total purchase cost of the current stock.
 */
const inventoryPurchaseValue = computed(() =>
    inventoryItems.value.reduce(
        (sum, item) =>
            sum +
            (
                toNumber(item.stock) *
                toNumber(item.purchasePrice)
            ),
        0
    )
);

/**
 * Potential sales value of the current stock.
 */
const inventorySaleValue = computed(() =>
    inventoryItems.value.reduce(
        (sum, item) =>
            sum +
            (
                toNumber(item.stock) *
                toNumber(item.unitPrice)
            ),
        0
    )
);

/**
 * Potential gross profit if the available stock is sold.
 */
const potentialInventoryProfit = computed(() =>
    inventorySaleValue.value -
    inventoryPurchaseValue.value
);

/**
 * Number of products that require stock replenishment.
 */
const lowStockItems = computed(() =>
    inventoryItems.value.filter(item =>
        toNumber(item.stock) <= toNumber(item.minStock)
    ).length
);

/**
 * Estimated unit profit of the item currently being edited.
 */
const formUnitProfit = computed(() =>
    toNumber(itemForm.value.unitPrice) -
    toNumber(itemForm.value.purchasePrice)
);

/**
 * Estimated sales margin of the item currently being edited.
 */
const formMarginPercentage = computed(() => {
  const unitPrice = toNumber(itemForm.value.unitPrice);

  if (unitPrice <= 0) return 0;

  return (
      formUnitProfit.value /
      unitPrice
  ) * 100;
});

/**
 * Creates the default state for a new inventory item.
 */
const createEmptyItemForm = () => ({
  id: null,
  sku: null,
  name: '',
  category: INVENTORY_CATEGORIES.SPARE_PART,
  brand: '',
  purchasePrice: 0,
  unitPrice: 0,
  qualityTier: QUALITY_TIERS.STANDARD,
  specification: '',
  presentation: '',
  unitMeasure: UNIT_MEASURES.UNIT,
  stock: 0,
  minStock: 3,
  image: ''
});

const openNew = () => {
  itemForm.value = createEmptyItemForm();
  displayDialog.value = true;
};

const closeDialog = () => {
  displayDialog.value = false;
  itemForm.value = {};
};

const clearFilters = () => {
  search.value = '';
  selectedBrand.value = null;
  selectedQualityTier.value = null;
};

const handleImageUpload = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = (loadEvent) => {
    itemForm.value.image =
        loadEvent.target?.result || '';
  };

  reader.readAsDataURL(file);
};

const editItem = (item) => {
  itemForm.value = {
    ...createEmptyItemForm(),
    ...item
  };

  displayDialog.value = true;
};

/**
 * Opens the controlled provider receipt form for an existing item.
 */
const openReceiptDialog = (item) => {
  if (
      item?.id === null ||
      item?.id === undefined
  ) {
    return;
  }

  receiptItem.value = { ...item };
  receiptForm.value = {
    quantity: 1,
    providerName: '',
    documentNumber: '',
    notes: ''
  };
  receiptFeedback.value = null;
  receiptError.value = '';
  inventoryStore.clearError();

  displayDialog.value = false;
  displayReceiptDialog.value = true;
};

const closeReceiptDialog = () => {
  if (receivingStock.value) return;

  displayReceiptDialog.value = false;
  receiptItem.value = null;
  receiptFeedback.value = null;
  receiptError.value = '';
};

/**
 * Registers a provider receipt and refreshes the stock in Pinia.
 */
const submitReceipt = async () => {
  if (!canSubmitReceipt.value || receivingStock.value) {
    return;
  }

  const quantity = toInteger(
      receiptForm.value.quantity,
      0
  );

  const providerName = String(
      receiptForm.value.providerName || ''
  ).trim();

  receiptError.value = '';
  receiptFeedback.value = null;

  try {
    const result = await inventoryStore.receiveStock(
        receiptItem.value.id,
        {
          quantity,
          providerName,
          documentNumber: String(
              receiptForm.value.documentNumber || ''
          ).trim(),
          notes: String(
              receiptForm.value.notes || ''
          ).trim()
        }
    );

    const updatedItem = result?.item ||
        inventoryItems.value.find(item =>
            String(item.id) ===
            String(receiptItem.value.id)
        );

    if (updatedItem) {
      receiptItem.value = { ...updatedItem };
    }

    receiptFeedback.value = {
      message:
          result?.message ||
          'Recepción registrada correctamente.',
      previousStock: toInteger(
          result?.previousStock,
          0
      ),
      quantityReceived: toInteger(
          result?.quantityReceived,
          quantity
      ),
      currentStock: toInteger(
          result?.currentStock,
          updatedItem?.stock || 0
      )
    };

    receiptForm.value = {
      quantity: 1,
      providerName: '',
      documentNumber: '',
      notes: ''
    };
  } catch (error) {
    receiptError.value =
        inventoryStore.error ||
        error?.response?.data?.message ||
        'No se pudo registrar la recepción del proveedor.';
  }
};

const saveItem = async () => {
  const normalizedName = String(
      itemForm.value.name || ''
  ).trim();

  if (!normalizedName || saving.value) return;

  saving.value = true;

  try {
    const category =
        itemForm.value.category ||
        INVENTORY_CATEGORIES.SPARE_PART;

    const isEditing =
        itemForm.value.id !== null &&
        itemForm.value.id !== undefined;

    /**
     * Physical stock is intentionally omitted from this payload.
     * It can only change through provider receipts or approved
     * task consumption.
     */
    const payload = {
      ...itemForm.value,

      name: normalizedName,

      category: String(category).toUpperCase(),

      brand: String(
          itemForm.value.brand || 'GENERIC'
      ).trim(),

      purchasePrice: Math.max(
          0,
          toNumber(itemForm.value.purchasePrice)
      ),

      unitPrice: Math.max(
          0,
          toNumber(itemForm.value.unitPrice)
      ),

      qualityTier: String(
          itemForm.value.qualityTier ||
          QUALITY_TIERS.STANDARD
      ).toUpperCase(),

      specification: String(
          itemForm.value.specification || ''
      ).trim(),

      presentation: String(
          itemForm.value.presentation || ''
      ).trim(),

      unitMeasure: String(
          itemForm.value.unitMeasure ||
          UNIT_MEASURES.UNIT
      ).toUpperCase(),


      minStock: Math.max(
          0,
          toInteger(itemForm.value.minStock, 3)
      ),

      image:
          itemForm.value.image ||
          categoryImages[category] ||
          ''
    };

    if (isEditing) {
      await inventoryStore.updateItem(
          itemForm.value.id,
          payload
      );
    } else {
      await inventoryStore.addItem(payload);
    }

    closeDialog();
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (item) => {
  if (
      item.id === null ||
      item.id === undefined
  ) {
    return;
  }

  const confirmed = confirm(
      t('inventory.deleteConfirm', {
        name: item.name
      })
  );

  if (!confirmed) return;

  await inventoryStore.deleteItem(item.id);
  closeDialog();
};
</script>

<template>
  <section class="inventory-page">
    <div class="page-header">
      <div>
        <span class="eyebrow">
          {{ t('inventory.eyebrow') }}
        </span>

        <h1>{{ t('inventory.title') }}</h1>

        <p>{{ t('inventory.description') }}</p>
      </div>

      <Button
          :label="t('inventory.newButton')"
          icon="pi pi-plus"
          class="add-button"
          @click="openNew"
      />
    </div>

    <!-- rodrigo -->
    <div class="inventory-kpis">
      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="pi pi-box"></i>
        </div>

        <div>
          <span>{{ $t('inventory.kpis.totalProducts') }}</span>
          <h2>{{ totalItems }}</h2>
          <small>{{ $t('inventory.kpis.totalProductsDesc') }}</small>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="pi pi-wallet"></i>
        </div>

        <div>
          <span>{{ $t('inventory.kpis.inventoryCost') }}</span>
          <h2>{{ formatCurrency(inventoryPurchaseValue) }}</h2>
          <small>{{ $t('inventory.kpis.inventoryCostDesc') }}</small>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="pi pi-chart-line"></i>
        </div>

        <div>
          <span>{{ $t('inventory.kpis.potentialValue') }}</span>
          <h2>{{ formatCurrency(inventorySaleValue) }}</h2>
          <small>{{ $t('inventory.kpis.potentialValueDesc') }}</small>
        </div>
      </div>

      <div
          class="kpi-card"
          :class="{
            'profit-positive': potentialInventoryProfit >= 0,
            'profit-negative': potentialInventoryProfit < 0
          }"
      >
        <div class="kpi-icon">
          <i class="pi pi-dollar"></i>
        </div>

        <div>
          <span>{{ $t('inventory.kpis.potentialProfit') }}</span>
          <h2>
            {{ formatCurrency(potentialInventoryProfit) }}
          </h2>

          <small>
            {{ lowStockItems }} {{ $t('inventory.kpis.lowStockCount') }}
          </small>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <i class="pi pi-search search-icon"></i>

        <InputText
            v-model="search"
            :placeholder="t('inventory.searchPlaceholder')"
        />
      </div>

      <Select
          v-model="selectedBrand"
          :options="brandOptions"
          optionLabel="label"
          optionValue="value"
          :placeholder=" $t('inventory.filters.allTiers') "
          showClear
          class="filter-select"
      />

      <Select
          v-model="selectedQualityTier"
          :options="qualityTiers"
          optionLabel="label"
          optionValue="value"
          :placeholder=" $t('inventory.filters.allTiers') "
          showClear
          class="filter-select"
      />

      <Button
          :label=" $t('inventory.filters.clear') "
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          class="clear-button"
          @click="clearFilters"
      />
    </div>

    <div class="results-summary">
      <span>
        Mostrando {{ filteredItems.length }}
        de {{ totalItems }} productos
      </span>

      <span v-if="lowStockItems > 0" class="stock-warning">
        <i class="pi pi-exclamation-triangle"></i>
        {{ lowStockItems }} productos requieren reposición
      </span>
    </div>

    <div class="table-card">
      <div
          v-if="filteredItems.length > 0"
          class="inventory-grid"
      >
        <InventoryCard
            v-for="item in filteredItems"
            :key="item.id"
            :item="item"
            @edit="editItem"
        />
      </div>

      <div v-else class="empty-state">
        <i class="pi pi-search"></i>
        <h3>No se encontraron materiales</h3>

        <p>
          No existen productos que coincidan con los filtros
          seleccionados.
        </p>

        <Button
            label="Limpiar filtros"
            icon="pi pi-filter-slash"
            text
            @click="clearFilters"
        />
      </div>
    </div>

    <Dialog
        v-model:visible="displayDialog"
        :header="
          itemForm.id
            ? t('inventory.editTitle')
            : t('inventory.newTitle')
        "
        :modal="true"
        :style="{
          width: '760px',
          maxWidth: '95vw'
        }"
        class="p-fluid inventory-dialog"
        @hide="itemForm = {}"
    >
      <div class="form-grid">
        <div class="field">
          <label>
            {{ t('inventory.form.name') }}
            <span class="required">*</span>
          </label>

          <InputText
              v-model.trim="itemForm.name"
              :placeholder="t('inventory.form.namePlaceholder')"
          />
        </div>

        <div class="row-grid">
          <div class="field">
            <label>
              {{ t('inventory.form.category') }}
            </label>

            <Select
                v-model="itemForm.category"
                :options="categories"
                optionLabel="label"
                optionValue="value"
            />
          </div>

          <div class="field">
            <label>
              {{ t('inventory.form.brand') }}
            </label>

            <InputText
                v-model.trim="itemForm.brand"
                :placeholder="t('inventory.form.brandPlaceholder')"
            />
          </div>
        </div>

        <div class="row-grid">
          <div class="field">
            <label>{{ $t('inventory.labels.qualityTier') }}</label>

            <Select
                v-model="itemForm.qualityTier"
                :options="qualityTiers"
                optionLabel="label"
                optionValue="value"
            />
          </div>

          <div class="field">
            <label>{{ $t('inventory.labels.presentation') }}</label>

            <InputText
                v-model.trim="itemForm.presentation"
                placeholder="Ej. Botella de 4 litros"
            />
          </div>
        </div>

        <div class="row-grid">
          <div class="field">
            <label>{{ $t('inventory.labels.unitMeasure') }}</label>

            <Select
                v-model="itemForm.unitMeasure"
                :options="unitMeasures"
                optionLabel="label"
                optionValue="value"
            />
          </div>

          <div class="field">
            <label>{{ $t('inventory.labels.technicalSpec') }}</label>

            <InputText
                v-model.trim="itemForm.specification"
                placeholder="Ej. SAE 5W-30 sintético"
            />
          </div>
        </div>

        <div class="financial-form-section">
          <div class="section-header">
            <div>
              <span>{{ $t('inventory.labels.financialInfo') }}</span>
              <small>
                {{ $t('inventory.labels.financialInfoDesc') }}
              </small>
            </div>
          </div>

          <div class="row-grid">
            <div class="field">
              <label>{{ $t('inventory.labels.purchasePrice') }}</label>

              <InputNumber
                  v-model="itemForm.purchasePrice"
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  :min="0"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
              />
            </div>

            <div class="field">
              <label>
                {{ t('inventory.form.unitPrice') }}
              </label>

              <InputNumber
                  v-model="itemForm.unitPrice"
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  :min="0"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
              />
            </div>
          </div>

          <div class="profit-preview">
            <div>
              <span>{{ $t('inventory.labels.unitProfit') }}</span>

              <strong
                  :class="{
                    positive: formUnitProfit > 0,
                    negative: formUnitProfit < 0
                  }"
              >
                {{ formatCurrency(formUnitProfit) }}
              </strong>
            </div>

            <div>
              <span>{{ $t('inventory.labels.estimatedMargin') }}</span>

              <strong
                  :class="{
                    positive: formMarginPercentage > 0,
                    negative: formMarginPercentage < 0
                  }"
              >
                {{ formMarginPercentage.toFixed(2) }}%
              </strong>
            </div>
          </div>
        </div>

        <div class="row-grid">
          <div class="field">
            <label>{{ $t('inventory.labels.currentStock') }}</label>

            <div class="stock-readonly-panel">
              <div class="stock-readonly-value">
                <i class="pi pi-lock"></i>

                <strong>
                  {{ Math.max(0, toInteger(itemForm.stock, 0)) }}
                </strong>
              </div>

              <small>
                {{
                  isEditingItem
                      ? 'Se actualiza únicamente mediante recepciones de proveedor y consumo de tareas aprobadas.'
                      : 'El artículo se registrará con stock 0. El ingreso se realizará mediante una recepción de proveedor.'
                }}
              </small>
            </div>
          </div>

          <div class="field">
            <label>
              {{ t('inventory.form.minStock') }}
            </label>

            <InputNumber
                v-model="itemForm.minStock"
                :min="0"
                showButtons
                class="w-full"
            />
          </div>
        </div>

        <div class="field">
          <label>{{ $t('inventory.labels.itemImage') }}</label>

          <div class="file-upload-container">
            <label
                for="inventory-image-upload"
                class="file-upload-btn"
            >
              <i class="pi pi-upload"></i>
              {{ $t('inventory.labels.selectImage') }}
            </label>

            <input
                id="inventory-image-upload"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleImageUpload"
            />

            <div
                v-if="itemForm.image"
                class="preview-box"
            >
              <img
                  :src="itemForm.image"
                  :alt="itemForm.name || 'Vista previa'"
              />
            </div>

            <small v-else>
              {{ $t('inventory.labels.defaultImageWarning') }}
            </small>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <div
              v-if="isEditingItem"
              class="dialog-footer-left"
          >
            <Button
                :label=" $t('inventory.labels.delete') "
                icon="pi pi-trash"
                severity="danger"
                text
                :disabled="saving"
                @click="deleteItem(itemForm)"
            />

            <Button
                :label=" $t('inventory.labels.registerReceipt') "
                icon="pi pi-truck"
                severity="success"
                outlined
                :disabled="saving"
                @click="openReceiptDialog(itemForm)"
            />
          </div>

          <div class="dialog-footer-actions">
            <Button
                :label="t('common.cancel')"
                text
                severity="secondary"
                :disabled="saving"
                @click="closeDialog"
            />

            <Button
                :label="t('common.save')"
                icon="pi pi-save"
                :loading="saving"
                :disabled="!String(itemForm.name || '').trim()"
                @click="saveItem"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <Dialog
        v-model:visible="displayReceiptDialog"
        :header=" $t('inventory.receipt.title') "
        :modal="true"
        :closable="!receivingStock"
        :style="{
          width: '620px',
          maxWidth: '95vw'
        }"
        class="p-fluid receipt-dialog"
        @hide="closeReceiptDialog"
    >
      <div v-if="receiptItem" class="receipt-content">
        <div class="receipt-item-summary">
          <div class="receipt-item-icon">
            <i class="pi pi-box"></i>
          </div>

          <div>
            <span>{{ receiptItem.sku }}</span>
            <h3>{{ receiptItem.name }}</h3>
            <small>
              {{ receiptItem.brand || 'Sin marca' }}
              · Stock actual:
              <strong>{{ receiptItem.stock }}</strong>
            </small>
          </div>
        </div>

        <div
            v-if="receiptFeedback"
            class="receipt-feedback receipt-feedback-success"
        >
          <i class="pi pi-check-circle"></i>

          <div>
            <strong>{{ receiptFeedback.message }}</strong>
            <span>
              {{ receiptFeedback.previousStock }}
              + {{ receiptFeedback.quantityReceived }}
              = {{ receiptFeedback.currentStock }} unidades
            </span>
          </div>
        </div>

        <div
            v-if="receiptError"
            class="receipt-feedback receipt-feedback-error"
        >
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ receiptError }}</span>
        </div>

        <div class="form-grid receipt-form">
          <div class="row-grid">
            <div class="field">
              <label>
                {{ $t('inventory.receipt.receivedQuantity') }}
                <span class="required">*</span>
              </label>

              <InputNumber
                  v-model="receiptForm.quantity"
                  :min="1"
                  showButtons
                  :disabled="receivingStock"
              />
            </div>

            <div class="field">
              <label>
                {{ $t('inventory.receipt.provider') }}
                <span class="required">*</span>
              </label>

              <InputText
                  v-model.trim="receiptForm.providerName"
                  placeholder="Ej. Distribuidora Mobil Perú"
                  :disabled="receivingStock"
              />
            </div>
          </div>

          <div class="field">
            <label>{{ $t('inventory.receipt.documentNumber') }}</label>

            <InputText
                v-model.trim="receiptForm.documentNumber"
                placeholder="Ej. FAC-001-4587"
                :disabled="receivingStock"
            />
          </div>

          <div class="field">
            <label>{{ $t('inventory.receipt.notes') }}</label>

            <Textarea
                v-model.trim="receiptForm.notes"
                rows="4"
                autoResize
                placeholder="Estado de la entrega u observaciones adicionales"
                :disabled="receivingStock"
            />
          </div>

          <div class="receipt-stock-preview">
            <span>{{ $t('inventory.receipt.stockAfter') }}</span>
            <strong>
              {{
                toInteger(receiptItem.stock, 0) +
                Math.max(0, toInteger(receiptForm.quantity, 0))
              }}
            </strong>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer-actions receipt-footer">
          <Button
              :label=" $t('inventory.receipt.close') "
              text
              severity="secondary"
              :disabled="receivingStock"
              @click="closeReceiptDialog"
          />

          <Button
              :label=" $t('inventory.receipt.submit') "
              icon="pi pi-check"
              severity="success"
              :loading="receivingStock"
              :disabled="!canSubmitReceipt"
              @click="submitReceipt"
          />
        </div>
      </template>
    </Dialog>
  </section>
</template>

<style scoped>
.inventory-page {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.eyebrow {
  color: #0b1680;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 2.2rem;
  line-height: 1.1;
}

.page-header p {
  margin: 0.5rem 0 0;
  color: #64748b;
}

.add-button {
  flex-shrink: 0;
  background: #0b1680;
  border-radius: 12px;
}

.toolbar {
  display: grid;
  grid-template-columns:
      minmax(260px, 1fr)
      minmax(180px, 220px)
      minmax(180px, 220px)
      auto;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}

.search-icon {
  position: absolute;
  left: 1rem;
  z-index: 10;
  color: #9ca3af;
}

.search-box :deep(.p-inputtext) {
  width: 100%;
  flex: 1;
  padding-left: 2.5rem;
  border: none;
  box-shadow: none;
}

.filter-select,
.clear-button {
  width: 100%;
}

.clear-button {
  white-space: nowrap;
  border-radius: 12px;
}

.results-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 600;
}

.stock-warning {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #b45309;
}

.table-card {
  min-height: 220px;
  overflow: hidden;
  border: 1px solid #e8edf5;
  border-radius: 20px;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}

.row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  color: #374151;
  font-size: 0.85rem;
  font-weight: 700;
}

.required {
  color: #ef4444;
}

:deep(.p-inputtext),
:deep(.p-inputnumber),
:deep(.p-select) {
  width: 100%;
  border-radius: 10px;
}

.inventory-grid {
  display: grid;
  grid-template-columns:
      repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.empty-state {
  display: flex;
  min-height: 280px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

.empty-state > i {
  margin-bottom: 0.8rem;
  color: #94a3b8;
  font-size: 2.5rem;
}

.empty-state h3 {
  margin: 0;
  color: #334155;
}

.empty-state p {
  max-width: 420px;
  margin: 0.5rem 0 1rem;
}

.file-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
}

.file-upload-container small {
  color: #64748b;
  text-align: center;
}

.hidden-input {
  display: none;
}

.file-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  background: #eef2ff;
  color: #0b1680;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.file-upload-btn:hover {
  background: #e0e7ff;
}

.preview-box {
  display: flex;
  width: 100%;
  max-height: 220px;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: white;
}

.preview-box img {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
}

:deep(.p-inputnumber.w-full),
:deep(.p-inputnumber.w-full .p-inputtext) {
  width: 100%;
}

.stock-readonly-panel {
  display: flex;
  min-height: 74px;
  flex-direction: column;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
}

.stock-readonly-value {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: #0f172a;
}

.stock-readonly-value i {
  color: #64748b;
}

.stock-readonly-value strong {
  font-size: 1.05rem;
}

.stock-readonly-panel small {
  color: #64748b;
  line-height: 1.35;
}

.financial-form-section {
  padding: 1rem;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  background: #f8fbff;
}

.section-header {
  margin-bottom: 1rem;
}

.section-header span {
  display: block;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 800;
}

.section-header small {
  display: block;
  margin-top: 0.25rem;
  color: #64748b;
}

.profit-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-top: 1rem;
}

.profit-preview > div {
  padding: 0.8rem;
  border-radius: 14px;
  background: white;
}

.profit-preview span {
  display: block;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
}

.profit-preview strong {
  display: block;
  margin-top: 0.25rem;
  color: #0f172a;
  font-size: 1.05rem;
}

.positive {
  color: #15803d !important;
}

.negative {
  color: #dc2626 !important;
}

.dialog-footer {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dialog-footer-left,
.dialog-footer-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dialog-footer-actions {
  margin-left: auto;
}

.receipt-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.receipt-item-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: #f8fbff;
}

.receipt-item-icon {
  display: flex;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #e0e7ff;
  color: #0b1680;
  font-size: 1.25rem;
}

.receipt-item-summary span,
.receipt-item-summary small {
  color: #64748b;
}

.receipt-item-summary h3 {
  margin: 0.2rem 0;
  color: #0f172a;
}

.receipt-feedback {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  line-height: 1.4;
}

.receipt-feedback i {
  margin-top: 0.15rem;
}

.receipt-feedback strong,
.receipt-feedback span {
  display: block;
}

.receipt-feedback-success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.receipt-feedback-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.receipt-form {
  padding-top: 0;
}

.receipt-stock-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-radius: 14px;
  background: #eef2ff;
  color: #312e81;
}

.receipt-stock-preview span {
  font-weight: 700;
}

.receipt-stock-preview strong {
  font-size: 1.35rem;
}

.receipt-footer {
  width: 100%;
  justify-content: flex-end;
}

/*rodrigo*/
.inventory-kpis {
  display: grid;
  grid-template-columns:
      repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.kpi-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  min-width: 0;
  padding: 1.2rem;
  border: 1px solid #e8edf5;
  border-radius: 18px;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.kpi-icon {
  display: flex;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #eef2ff;
  color: #0b1680;
  font-size: 1.2rem;
}

.kpi-card > div:last-child {
  min-width: 0;
}

.kpi-card span {
  display: block;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
}

.kpi-card h2 {
  margin: 0.5rem 0 0;
  overflow-wrap: anywhere;
  color: #0b1680;
  font-size: 1.55rem;
  font-weight: 800;
}

.kpi-card small {
  display: block;
  margin-top: 0.35rem;
  color: #94a3b8;
  line-height: 1.35;
}

.kpi-card.profit-positive h2 {
  color: #15803d;
}

.kpi-card.profit-negative h2 {
  color: #dc2626;
}

@media (max-width: 1050px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .search-box {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .page-header {
    flex-direction: column;
  }

  .add-button {
    width: 100%;
  }

  .toolbar,
  .row-grid,
  .profit-preview {
    grid-template-columns: 1fr;
  }

  .search-box {
    grid-column: auto;
  }

  .results-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .inventory-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .dialog-footer-left,
  .dialog-footer-actions {
    width: 100%;
    margin-left: 0;
  }

  .dialog-footer-left,
  .dialog-footer-actions {
    flex-direction: column;
  }

  .dialog-footer-left :deep(.p-button),
  .dialog-footer-actions :deep(.p-button) {
    width: 100%;
  }

  .receipt-item-summary {
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .inventory-kpis {
    grid-template-columns: 1fr;
  }
}
</style>