<script setup>
/**
 * @file WeeklyIncomePanel.vue
 * @description Dashboard panel for weekly income analytics.
 */

import { useI18n } from 'vue-i18n';

import Card from 'primevue/card';
import Chart from 'primevue/chart';

const { t } = useI18n();

defineProps({
  weeklyIncome: {
    type: [Number, String],
    default: 0
  },

  chartData: {
    type: Object,
    required: true
  },

  chartOptions: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <Card class="panel-card income-card">
    <template #content>
      <div class="panel-heading">
        <div>
          <h2>
            {{ t('dashboard.panels.weeklyIncome.title') }}
          </h2>

          <p>
            {{ t('dashboard.panels.weeklyIncome.subtitle') }}
          </p>
        </div>

        <strong>
          S/. {{ weeklyIncome }}
        </strong>
      </div>

      <Chart
          type="bar"
          :data="chartData"
          :options="chartOptions"
          class="income-chart"
      />
    </template>
  </Card>
</template>

<style scoped>
.panel-card {
  border: 1px solid #e8edf5;
  border-radius: 24px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.income-card {
  background: linear-gradient(
      180deg,
      #ffffff 0%,
      #f8fbff 100%
  );
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

.panel-heading > strong {
  font-size: 1.4rem;
  color: #0b1680;
}

.income-chart {
  height: 250px;
}
</style>