<script setup>
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

defineProps({
  item: {
    type: Object,
    required: true
  }
});

defineEmits(['edit']);

const toNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatCurrency = (value) =>
    toNumber(value).toLocaleString('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    });

const formatPercentage = (value) =>
    `${toNumber(value).toFixed(2)}%`;

const getStockSeverity = (item) => {
  const stock = toNumber(item.stock);
  const minStock = toNumber(item.minStock);

  if (stock <= minStock) return 'danger';
  if (stock <= minStock + 2) return 'warning';

  return 'success';
};

const getStockLabel = (item) => {
  const stock = toNumber(item.stock);
  const minStock = toNumber(item.minStock);

  if (stock <= 0) return 'Sin stock';
  if (stock <= minStock) return 'Stock bajo';
  if (stock <= minStock + 2) return 'Stock limitado';

  return 'Disponible';
};

const getQualityTierLabel = (qualityTier) => {
  const labels = {
    ECONOMY: 'Económica',
    STANDARD: 'Estándar',
    PREMIUM: 'Premium'
  };

  return labels[qualityTier] || 'Estándar';
};

const getQualityTierSeverity = (qualityTier) => {
  const severities = {
    ECONOMY: 'secondary',
    STANDARD: 'info',
    PREMIUM: 'warn'
  };

  return severities[qualityTier] || 'info';
};

const getProfitSeverity = (unitProfit) => {
  const profit = toNumber(unitProfit);

  if (profit < 0) return 'danger';
  if (profit === 0) return 'warning';

  return 'success';
};

const getProfitLabel = (unitProfit) => {
  const profit = toNumber(unitProfit);

  if (profit < 0) return 'Pérdida';
  if (profit === 0) return 'Sin margen';

  return 'Rentable';
};
</script>

<template>
  <Card class="inventory-card">
    <template #header>
      <div class="image-wrapper">
        <img
            v-if="item.image"
            :src="item.image"
            :alt="item.name"
            class="item-image"
        />

        <div v-else class="image-placeholder">
          <i class="pi pi-box"></i>
          <span>{{ $t('inventory.labels.noImage') }}</span>
        </div>

        <div class="header-tags">
          <Tag
              :value="item.category"
              severity="info"
              rounded
          />

          <Tag
              :value="getQualityTierLabel(item.qualityTier)"
              :severity="getQualityTierSeverity(item.qualityTier)"
              rounded
          />
        </div>
      </div>
    </template>

    <template #content>
      <div class="item-header">
        <div class="item-title-row">
          <div>
            <h3>{{ item.name }}</h3>
            <small v-if="item.sku">SKU: {{ item.sku }}</small>
          </div>

          <Tag
              :value="getProfitLabel(item.unitProfit)"
              :severity="getProfitSeverity(item.unitProfit)"
              rounded
          />
        </div>

        <p>
          {{
            item.specification ||
            item.description ||
            'Material disponible para los servicios del taller.'
          }}
        </p>
      </div>

      <div class="product-details">
        <div>
          <span>{{ $t('inventory.labels.brand') }}</span>
          <strong>{{ item.brand || 'Genérica' }}</strong>
        </div>

        <div>
          <span>{{ $t('inventory.labels.presentation') }}</span>
          <strong>{{ item.presentation || 'Unidad' }}</strong>
        </div>

        <div>
          <span>{{ $t('inventory.labels.unitMeasure') }}</span>
          <strong>{{ item.unitMeasure || 'UNIT' }}</strong>
        </div>
      </div>

      <div class="financial-section">
        <div class="financial-header">
          <div>
            <span>{{ $t('inventory.labels.financialInfo') }}</span>
            <small>{{ $t('inventory.labels.unitProfit') }}</small>
          </div>

          <Tag
              :value="formatPercentage(item.marginPercentage)"
              :severity="getProfitSeverity(item.unitProfit)"
              rounded
          />
        </div>

        <div class="financial-grid">
          <div>
            <span>{{ $t('inventory.labels.purchasePrice') }}</span>
            <strong>{{ formatCurrency(item.purchasePrice) }}</strong>
          </div>

          <div>
            <span>{{ $t('inventory.labels.salePrice') }}</span>
            <strong>{{ formatCurrency(item.unitPrice) }}</strong>
          </div>

          <div class="profit-box">
            <span>{{ $t('inventory.labels.unitProfit') }}</span>
            <strong
                :class="{
                  'positive-profit': toNumber(item.unitProfit) > 0,
                  'negative-profit': toNumber(item.unitProfit) < 0
                }"
            >
              {{ formatCurrency(item.unitProfit) }}
            </strong>
          </div>
        </div>
      </div>

      <div class="stock-section">
        <div class="stock-summary">
          <div>
            <span>{{ $t('inventory.labels.currentStock') }}</span>
            <strong>
              {{ item.stock }}
              {{ item.unitMeasure || 'UNIT' }}
            </strong>
          </div>

          <Tag
              :value="getStockLabel(item)"
              :severity="getStockSeverity(item)"
              rounded
          />
        </div>

        <div class="stock-progress">
          <div
              class="stock-progress-value"
              :class="getStockSeverity(item)"
              :style="{
                width: `${Math.min(
                  100,
                  (toNumber(item.stock) /
                    Math.max(toNumber(item.minStock) * 2, 1)) *
                    100
                )}%`
              }"
          ></div>
        </div>

        <small>
          {{ $t('inventory.labels.stockMinRecommended') }} {{ item.minStock }}
        </small>
      </div>

      <div
          v-if="item.compatibleVehicleBrands?.length"
          class="compatibility"
      >
        <span>{{ $t('inventory.labels.compatibleWith') }}</span>

        <div class="brand-tags">
          <Tag
              v-for="brand in item.compatibleVehicleBrands"
              :key="brand"
              :value="brand"
              severity="secondary"
              rounded
          />
        </div>
      </div>

      <div class="card-actions">
        <Button
            :label="$t('inventory.labels.updateStock')"
            icon="pi pi-refresh"
            outlined
            class="stock-button"
            @click="$emit('edit', item)"
        />

        <Button
            icon="pi pi-pencil"
            severity="info"
            outlined
            class="edit-button"
            aria-label="Editar producto"
            @click="$emit('edit', item)"
        />
      </div>
    </template>
  </Card>
</template>

<style scoped>
.inventory-card {
  height: 100%;
  overflow: hidden;
  border: 1px solid #e8edf5;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
}

.inventory-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);
}

.image-wrapper {
  position: relative;
  height: 190px;
  background: #eef2ff;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: #64748b;
}

.image-placeholder i {
  font-size: 2.6rem;
  color: #94a3b8;
}

.image-placeholder span {
  font-size: 0.9rem;
  font-weight: 700;
}

.header-tags {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.item-header {
  margin-bottom: 1rem;
}

.item-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.item-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.2rem;
}

.item-header small {
  display: block;
  margin-top: 0.25rem;
  color: #94a3b8;
  font-weight: 700;
}

.item-header p {
  min-height: 44px;
  margin: 0.8rem 0 0;
  color: #64748b;
  line-height: 1.45;
}

.product-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
  margin-bottom: 1rem;
}

.product-details div {
  padding: 0.75rem;
  border-radius: 16px;
  background: #f8fafc;
}

.product-details span,
.financial-grid span,
.financial-header span,
.stock-section span,
.compatibility > span {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.product-details strong,
.financial-grid strong,
.stock-section strong {
  display: block;
  margin-top: 0.25rem;
  color: #0f172a;
  word-break: break-word;
}

.financial-section {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #f8fafc;
}

.financial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.9rem;
}

.financial-header span {
  color: #0f172a;
  font-size: 0.9rem;
}

.financial-header small {
  display: block;
  margin-top: 0.2rem;
  color: #94a3b8;
}

.financial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

.financial-grid > div {
  padding: 0.7rem;
  border-radius: 14px;
  background: #ffffff;
}

.profit-box {
  border: 1px solid #e2e8f0;
}

.positive-profit {
  color: #16a34a !important;
}

.negative-profit {
  color: #dc2626 !important;
}

.stock-section {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 18px;
  background: #f8fafc;
}

.stock-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.stock-progress {
  height: 8px;
  margin: 0.8rem 0 0.55rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.stock-progress-value {
  height: 100%;
  min-width: 3%;
  border-radius: inherit;
  transition: width 0.3s ease;
}

.stock-progress-value.success {
  background: #22c55e;
}

.stock-progress-value.warning {
  background: #f59e0b;
}

.stock-progress-value.danger {
  background: #ef4444;
}

.stock-section small {
  color: #64748b;
}

.compatibility {
  margin-top: 1rem;
}

.brand-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.55rem;
}

.card-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 1.1rem;
}

.stock-button {
  flex: 1;
  border-radius: 14px;
}

.edit-button {
  width: 46px;
  border-radius: 14px;
}

@media (max-width: 720px) {
  .product-details,
  .financial-grid {
    grid-template-columns: 1fr;
  }

  .item-title-row,
  .stock-summary,
  .financial-header {
    align-items: flex-start;
  }
}
</style>