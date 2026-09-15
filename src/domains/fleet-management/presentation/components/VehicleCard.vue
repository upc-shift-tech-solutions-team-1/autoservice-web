<script setup>
/**
 * @file VehicleCard.vue
 * @description **Vehicle Card Component**
 *
 * Displays a single vehicle's information in a card format.
 * Includes image, metadata, progress indicator, and action buttons.
 *
 * Props:
 * - vehicle: Object containing vehicle data
 *
 * Emits:
 * - edit: Triggered when the edit button is clicked
 * - view-detail: Triggered when the details button is clicked
 */

import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
defineProps({ vehicle: Object });
defineEmits(['edit', 'view-detail']);
</script>

<template>
  <article class="vehicle-card">
    <div class="image-wrapper">
      <img :src="vehicle.image" :alt="vehicle.name" class="vehicle-image" />
      <Tag :value="vehicle.status" :severity="vehicle.severity" rounded class="status-badge" />
    </div>

    <div class="vehicle-content">
      <div class="vehicle-header">
        <div>
          <h3>{{ vehicle.name }}</h3>
          <p>{{ vehicle.owner }}</p>
        </div>
        <Button icon="pi pi-pencil" rounded text severity="secondary" @click="$emit('edit', vehicle.raw)" />
      </div>

      <div class="vehicle-meta">
        <span><i class="pi pi-id-card"></i>{{ vehicle.plate }}</span>
      </div>

      <div class="vehicle-progress-container">
        <div class="progress-label">
          <span>{{ t('vehicles.card.progress') }}</span>
          <strong>{{ vehicle.progress }}%</strong>
        </div>
        <ProgressBar :value="vehicle.progress" :showValue="false" class="vehicle-progress" />
      </div>

      <Button
          :label="t('vehicles.card.viewDetails')"
          icon="pi pi-arrow-right"
          icon-pos="right"
          outlined
          class="details-button"
          @click="$emit('view-detail', vehicle.raw)"
      />
    </div>
  </article>
</template>

<style scoped>
.vehicle-card { display: flex; flex-direction: column; padding: 1rem; border: 1px solid #e8edf5; border-radius: 24px; background: #ffffff; box-shadow: 0 12px 28px rgba(15,23,42,0.06); transition: transform 0.2s; }
.vehicle-card:hover { transform: translateY(-2px); }
.image-wrapper { position: relative; width: 100%; height: 180px; margin-bottom: 1rem; }
.vehicle-image { width: 100%; height: 100%; border-radius: 16px; object-fit: cover; background: #e2e8f0; }
.status-badge { position: absolute; top: 0.8rem; right: 0.8rem; }
.vehicle-content { display: flex; flex-direction: column; flex: 1; }
.vehicle-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
.vehicle-header h3 { margin: 0; color: #0f172a; font-size: 1.15rem; }
.vehicle-header p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem; }
.vehicle-meta { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 1.2rem; color: #64748b; font-size: 0.92rem; }
.vehicle-meta span { display: inline-flex; align-items: center; gap: 0.4rem; background: #f8fafc; padding: 0.4rem 0.8rem; border-radius: 8px; }
.vehicle-meta i { color: #0b1680; }
.vehicle-progress-container { margin-bottom: 1.2rem; }
.progress-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.9rem; color: #64748b; }
.progress-label strong { color: #0b1680; }
.vehicle-progress { height: 8px; }
.details-button { width: 100%; border-radius: 14px; margin-top: auto; }
</style>
