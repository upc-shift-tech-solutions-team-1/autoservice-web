<script setup>
/**
 * @file MetricCard.vue
 * @description Dashboard metric summary card.
 */

import Card from 'primevue/card';

defineProps({
  title: {
    type: String,
    default: ''
  },

  value: {
    type: [String, Number],
    default: ''
  },

  subtitle: {
    type: String,
    default: ''
  },

  icon: {
    type: String,
    default: ''
  },

  color: {
    type: String,
    default: 'blue'
  }
});
</script>

<template>
  <Card :class="['metric-card', `metric-card--${color}`]">
    <template #content>
      <div class="metric-content">
        <div>
          <span>
            {{ title }}
          </span>

          <strong>
            {{ value }}
          </strong>

          <small>
            {{ subtitle }}
          </small>
        </div>

        <i :class="icon"></i>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.metric-card {
  overflow: hidden;
  border: 1px solid #e8edf5;
  border-radius: 22px;
}

.metric-card :deep(.p-card-body),
.metric-card :deep(.p-card-content) {
  padding: 0;
}

.metric-content {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  min-height: 132px;
  padding: 1.25rem;
  border-left: 6px solid transparent;
}

.metric-content span {
  display: block;
  font-size: 0.92rem;
  font-weight: 700;
  color: #64748b;
}

.metric-content strong {
  display: block;
  margin: 0.35rem 0 0.25rem;
  font-size: 2rem;
  line-height: 1;
  color: #0f172a;
}

.metric-content small {
  color: #94a3b8;
}

.metric-content i {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  font-size: 1.3rem;
  border-radius: 16px;
}

.metric-card--blue .metric-content {
  border-left-color: #2563eb;
}

.metric-card--blue i {
  color: #2563eb;
  background: #dbeafe;
}

.metric-card--indigo .metric-content {
  border-left-color: #0b1680;
}

.metric-card--indigo i {
  color: #0b1680;
  background: #e0e7ff;
}

.metric-card--green .metric-content {
  border-left-color: #16a34a;
}

.metric-card--green i {
  color: #16a34a;
  background: #dcfce7;
}

.metric-card--violet .metric-content {
  border-left-color: #7c3aed;
}

.metric-card--violet i {
  color: #7c3aed;
  background: #ede9fe;
}
</style>