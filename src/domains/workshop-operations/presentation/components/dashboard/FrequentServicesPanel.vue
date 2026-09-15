<script setup>
/**
 * @file FrequentServicesPanel.vue
 * @description Dashboard panel for frequent services overview.
 */

import { useI18n } from 'vue-i18n';

import Card from 'primevue/card';
import ProgressBar from 'primevue/progressbar';

const { t } = useI18n();

defineProps({
  services: {
    type: Array,
    default: () => []
  }
});
</script>

<template>
  <Card class="panel-card">
    <template #content>
      <div class="panel-heading">
        <div>
          <h2>
            {{ t('dashboard.panels.frequentServices.title') }}
          </h2>

          <p>
            {{ t('dashboard.panels.frequentServices.subtitle') }}
          </p>
        </div>
      </div>

      <div class="service-list">
        <div
            v-for="service in services"
            :key="service.name"
            class="service-item"
        >
          <div class="service-icon">
            <i :class="service.icon"></i>
          </div>

          <div class="service-info">
            <div class="service-top">
              <strong>
                {{ service.name }}
              </strong>

              <span>
                S/. {{ service.amount }}
              </span>
            </div>

            <small>
              {{
                t(
                    'dashboard.panels.frequentServices.servicesCount',
                    { count: service.count }
                )
              }}
            </small>

            <ProgressBar
                :value="service.progress"
                :showValue="false"
                class="service-progress"
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

.service-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 18px;
}

.service-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  color: #0b1680;
  background: #eef2ff;
  border-radius: 16px;
}

.service-info {
  flex: 1;
}

.service-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.service-top strong {
  color: #0f172a;
}

.service-top span {
  font-weight: 800;
  color: #0b1680;
}

.service-progress {
  height: 8px;
  margin-top: 0.75rem;
}
</style>