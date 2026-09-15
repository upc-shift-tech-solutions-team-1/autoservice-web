<script setup>
/**
 * @file MechanicCard.vue
 * @description Mechanic presentation card component
 * Displays mechanic info, workload status and actions.
 */

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';

const props = defineProps({ mechanic: Object });
defineEmits(['edit', 'delete']);

const { t } = useI18n();

/**
 * Computes mechanic initials for avatar display
 */
const initials = computed(() => {
  if (!props.mechanic.fullName) return 'M';
  const names = props.mechanic.fullName.split(' ');
  if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
  return names[0].substring(0, 2).toUpperCase();
});

/**
 * Calculates workload percentage
 */
const loadPercentage = computed(() => {
  if (!props.mechanic.maxCapacity) return 0;
  const percentage =
      ((props.mechanic.currentLoad || 0) / props.mechanic.maxCapacity) * 100;

  return Math.min(Math.round(percentage), 100);
});

/**
 * Progress bar status class
 */
const statusClass = computed(() => {
  if (loadPercentage.value >= 100) return 'status-danger';
  if (loadPercentage.value >= 75) return 'status-warning';
  return 'status-safe';
});

/**
 * Capacity status tag (i18n-based)
 */
const capacityStatus = computed(() => {
  if (loadPercentage.value >= 100) {
    return { label: t('mechanic.capacity.full'), severity: 'danger' };
  }
  if (loadPercentage.value >= 75) {
    return { label: t('mechanic.capacity.high'), severity: 'warning' };
  }
  return { label: t('mechanic.capacity.available'), severity: 'success' };
});
</script>

<template>
  <article class="mechanic-card">
    <div class="avatar-wrapper">
      <div class="mechanic-avatar">
        {{ initials }}
      </div>
    </div>

    <div class="mechanic-content">
      <div class="mechanic-top">
        <div class="name-container">
          <h3>{{ mechanic.fullName }}</h3>

          <div class="tags-group">
            <Tag
                :value="mechanic.specialty"
                severity="info"
                rounded
                class="mini-tag"
            />

            <Tag
                :value="capacityStatus.label"
                :severity="capacityStatus.severity"
                rounded
                class="mini-tag"
            />
          </div>
        </div>
      </div>

      <div class="mechanic-account" v-if="mechanic.email">
        <span>
          <i class="pi pi-envelope"></i>
          {{ mechanic.email }}
        </span>
      </div>

      <div class="workload-container">
        <div class="workload-labels">
          <span>
            <i class="pi pi-briefcase"></i>
            {{ t('mechanic.workload.label') }}
          </span>

          <strong>
            {{ mechanic.currentLoad || 0 }} / {{ mechanic.maxCapacity }}
          </strong>
        </div>

        <ProgressBar
            :value="loadPercentage"
            :showValue="false"
            class="workload-bar"
            :class="statusClass"
        />
      </div>

      <div class="mechanic-actions">
        <Button
            icon="pi pi-pencil"
            text
            rounded
            severity="info"
            @click="$emit('edit', mechanic)"
            v-tooltip.top="t('actions.editProfile')"
        />

        <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            @click="$emit('delete', mechanic)"
            v-tooltip.top="t('actions.deleteMechanic')"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.mechanic-card {
  display: flex;
  gap: 1.25rem;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.mechanic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
}

.avatar-wrapper {
  flex-shrink: 0;
}

.mechanic-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 1px;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15);
}

.mechanic-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.mechanic-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.name-container {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #1e293b;
  line-height: 1.2;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tags-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mini-tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  letter-spacing: 0.3px;
}

.mechanic-account {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #64748b;
}

.mechanic-account span {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.workload-container {
  background: #f8fafc;
  padding: 0.8rem;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  margin-top: 0.25rem;
}

.workload-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.workload-labels span {
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.workload-labels strong {
  color: #0f172a;
  font-weight: 800;
}

.workload-bar {
  height: 8px;
  border-radius: 6px;
  background: #e2e8f0;
}

:deep(.status-safe .p-progressbar-value) {
  background: #10b981;
}

:deep(.status-warning .p-progressbar-value) {
  background: #f59e0b;
}

:deep(.status-danger .p-progressbar-value) {
  background: #ef4444;
}

.mechanic-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.5rem;
  margin-top: 0.2rem;
}

@media (max-width: 640px) {
  .mechanic-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .name-container {
    align-items: center;
  }

  .tags-group {
    justify-content: center;
  }

  .mechanic-actions {
    justify-content: center;
    width: 100%;
  }
}
</style>