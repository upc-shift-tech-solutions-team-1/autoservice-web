<script setup>
/**
 * @file ActiveVehiclesPanel.vue
 * @description Dashboard panel for active vehicles overview.
 */

import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Card from 'primevue/card';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';

const { t } = useI18n();

defineProps({
  vehicles: {
    type: Array,
    default: () => []
  }
});

defineEmits(['view-vehicles']);
</script>

<template>
  <Card class="panel-card">
    <template #content>
      <div class="panel-heading">
        <div>
          <h2>
            {{ t('dashboard.panels.activeVehicles.title') }}
          </h2>

          <p>
            {{ t('dashboard.panels.activeVehicles.subtitle') }}
          </p>
        </div>

        <Button
            :label="t('dashboard.panels.activeVehicles.viewAll')"
            text
            size="small"
            @click="$emit('view-vehicles')"
        />
      </div>

      <div class="vehicle-list">
        <div
            v-for="vehicle in vehicles"
            :key="vehicle.id"
            class="vehicle-item"
        >
          <img
              :src="vehicle.image"
              :alt="vehicle.name"
              class="vehicle-image"
          />

          <div class="vehicle-info">
            <div class="vehicle-top">
              <div>
                <span class="order-code">{{ vehicle.orderCode }}</span>
                <h3 class="plate-text">
                  {{ vehicle.plate }}
                </h3>
                <small class="model-text">{{ vehicle.name }}</small>

                <div class="mt-1">
                  <Tag
                      :value="vehicle.status"
                      :severity="vehicle.severity"
                      rounded
                  />
                </div>
              </div>

              <strong>
                {{ vehicle.progress }}%
              </strong>
            </div>

            <ProgressBar
                :value="vehicle.progress"
                :showValue="false"
                class="vehicle-progress"
            />
          </div>
        </div>
      </div>
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
  align-items: flex-start;
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

.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vehicle-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 18px;
}

.vehicle-image {
  width: 74px;
  height: 58px;
  object-fit: cover;
  background: #e2e8f0;
  border-radius: 14px;
}

.vehicle-info {
  flex: 1;
}

.vehicle-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.vehicle-top h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  color: #0f172a;
}

.vehicle-top strong {
  font-weight: 800;
  color: #0b1680;
}

.vehicle-progress {
  height: 8px;
  margin-top: 0.75rem;
}
.order-code {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  display: block;
}

.plate-text {
  margin: 0 !important;
  font-size: 1.1rem !important;
  color: #0f172a;
}

.model-text {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.mt-1 { margin-top: 0.25rem; }
</style>