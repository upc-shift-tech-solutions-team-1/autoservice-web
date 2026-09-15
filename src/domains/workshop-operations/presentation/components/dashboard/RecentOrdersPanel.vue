<script setup>
/**
 * @file RecentOrdersPanel.vue
 * @description Dashboard panel for recent work orders.
 */

import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Tag from 'primevue/tag';

const { t } = useI18n();

defineProps({
  orders: {
    type: Array,
    default: () => []
  }
});

defineEmits(['view-orders']);

/**
 * Returns PrimeVue severity based on order status.
 *
 * @param {string} status - Work order status.
 * @returns {string} Tag severity.
 */
const getOrderSeverity = (status) => {
  if (
      status === 'Finalizado' ||
      status === 'Completado'
  ) {
    return 'success';
  }

  if (status === 'En Proceso') {
    return 'info';
  }

  if (status === 'Pendiente') {
    return 'warning';
  }

  if (status === 'Cancelado') {
    return 'danger';
  }

  return 'secondary';
};
</script>

<template>
  <Card class="panel-card">
    <template #content>
      <div class="panel-heading">
        <div>
          <h2>
            {{ t('dashboard.panels.recentOrders.title') }}
          </h2>

          <p>
            {{ t('dashboard.panels.recentOrders.subtitle') }}
          </p>
        </div>

        <Button
            icon="pi pi-arrow-right"
            rounded
            text
            @click="$emit('view-orders')"
        />
      </div>

      <DataTable
          :value="orders"
          class="p-datatable-sm clean-table"
          responsiveLayout="scroll"
      >
        <Column
            field="trackingCode"
            :header="t('dashboard.panels.recentOrders.code')"
        />

        <Column
            field="status"
            :header="t('dashboard.panels.recentOrders.status')"
        >
          <template #body="slotProps">
            <Tag
                :value="slotProps.data.status"
                :severity="
                getOrderSeverity(slotProps.data.status)
              "
                rounded
            />
          </template>
        </Column>

        <Column
            :header="t('dashboard.panels.recentOrders.amount')"
        >
          <template #body="slotProps">
            S/. {{ Number(slotProps.data.calculatedTotal || 0).toFixed(2) }}
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<style scoped>
.panel-card {
  border: 1px solid #e8edf5;
  border-radius: 24px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.panel-heading h2 {
  margin: 0;
  font-size: 1.28rem;
  color: #0f172a;
}

.panel-heading p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.clean-table {
  overflow: hidden;
  border-radius: 16px;
}

.clean-table :deep(.p-datatable-thead > tr > th) {
  font-size: 0.82rem;
  color: #475569;
  background: #f8fafc;
}
</style>