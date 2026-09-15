<script setup>
/**
 * @file DashboardHeader.vue
 * @description Dashboard main header component.
 */

import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';

const { t } = useI18n();

defineEmits([
  'create-order',
  'view-orders'
]);
</script>

<template>
  <div class="dashboard-header">
    <div>
      <span class="eyebrow">
        {{ t('dashboard.eyebrow') }}
      </span>

      <h1>
        {{ t('dashboard.title') }}
      </h1>

      <p>
        {{ t('dashboard.description') }}
      </p>
    </div>

    <div class="header-actions">
      <Button
          :label="t('dashboard.newOrder')"
          icon="pi pi-plus"
          class="primary-action"
          @click="$emit('create-order')"
      />

      <Button
          :label="t('dashboard.viewOrders')"
          icon="pi pi-list"
          outlined
          @click="$emit('view-orders')"
      />
    </div>
  </div>
</template>

<style scoped>
.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0b1680;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.8rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: #0f172a;
}

p {
  max-width: 680px;
  margin: 0.75rem 0 0;
  color: #64748b;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.primary-action {
  background: #0b1680;
  border-color: #0b1680;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .p-button {
    flex: 1;
  }
}
</style>