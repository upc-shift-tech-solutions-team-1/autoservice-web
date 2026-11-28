
<script setup>
import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';

const { t } = useI18n();

defineProps({
  order: {
    type: Object,
    required: true
  }
});

defineEmits(['view-detail']);

// Etiqueta original del estado
const getStatusLabel = (status) => {
  if (!status) {
    return t('workOrders.statusOptions.pending');
  }

  const normalized = status
    .toString()
    .toLowerCase()
    .replace(' ', '_');

  const key = `workOrders.statusOptions.${normalized}`;
  const translated = t(key);

  return translated === key ? status : translated;
};

// Color original del estado
const getStatusSeverity = (status) => {
  if (!status) return 'secondary';

  const s = status.toString().toLowerCase();

  if (s.includes('progress')) return 'info';
  if (s.includes('finish')) return 'warn';
  if (s.includes('deliver') || s.includes('complet')) {
    return 'success';
  }
  if (s.includes('cancel')) return 'danger';

  return 'secondary';
};

// EC-07: Nombre visible de la prioridad
const getPriorityLabel = (level) => {
  const labels = {
    HIGH: 'Prioridad alta',
    REVIEW: 'Revisar planificación',
    MEDIUM: 'Prioridad media',
    LOW: 'Prioridad baja'
  };

  return labels[level] || '';
};

// EC-07: Color visible de la prioridad
const getPrioritySeverity = (level) => {
  const severities = {
    HIGH: 'danger',
    REVIEW: 'warn',
    MEDIUM: 'warn',
    LOW: 'success'
  };

  return severities[level] || 'secondary';
};

</script>

<template>
  <article
    class="order-card"
    :class="{
      'risk-card': order.isRisk,
      'priority-high': order.priority?.level === 'HIGH',
      'priority-review': order.priority?.level === 'REVIEW'
    }"
  >
    <div class="order-header">
      <div class="order-code">
        <span class="code">
          {{ order.trackingCode }}
        </span>

        <!-- Indicador original -->
        <Tag
          v-if="order.isRisk"
          :value="t('workOrders.card.riskBadge')"
          severity="danger"
          rounded
        />
      </div>

      <Tag
        :value="getStatusLabel(order.status)"
        :severity="getStatusSeverity(order.status)"
      />
    </div>

    <!-- EC-07: Etiqueta y explicación de prioridad -->
    <div
      v-if="order.priority && order.priority.level !== 'NONE'"
      class="priority-section"
    >
      <Tag
        :value="getPriorityLabel(order.priority.level)"
        :severity="getPrioritySeverity(order.priority.level)"
        rounded
      />

      <p class="priority-reason">
        <i
          :class="order.priority.needsAttention
            ? 'pi pi-exclamation-circle'
            : 'pi pi-calendar'"
        ></i>

        {{ order.priority.reason }}
      </p>
    </div>

    <div class="order-vehicle">
      <i class="pi pi-car"></i>
      <strong>{{ order.vehiclePlate }}</strong>
    </div>

    <p class="order-customer">
      <i class="pi pi-user"></i>
      {{ order.customerName }}
    </p>

    <div class="order-dates">
      <div>
        <span>{{ t('workOrders.card.arrival') }}</span>
        <strong>{{ order.startDate }}</strong>
      </div>

      <div>
        <span>{{ t('workOrders.card.delivery') }}</span>
        <strong>{{ order.estimatedDate }}</strong>
      </div>

      <div>
        <span>{{ t('workOrders.card.total') }}</span>
        <strong>
          S/. {{ Number(order.calculatedTotal || 0).toFixed(2) }}
        </strong>
      </div>
    </div>

    <div class="order-progress-row">
      <span>{{ t('workOrders.card.taskProgress') }}</span>
      <strong>{{ order.progress }}%</strong>
    </div>

    <ProgressBar
      :value="order.progress"
      :showValue="false"
      class="order-progress"
    />

    <Button
      :label="t('workOrders.card.viewDetail')"
      icon="pi pi-arrow-right"
      icon-pos="right"
      outlined
      class="detail-button"
      @click="$emit('view-detail', order)"
    />
  </article>
</template>

<style scoped>
.order-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.2rem;
  background: #ffffff;
  border: 1px solid #e8edf5;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s;
}

.order-card:hover {
  transform: translateY(-2px);
}

.risk-card,
.priority-high {
  background: #fff9f9;
  border-color: #fca5a5;
}

.priority-review {
  background: #fffbeb;
  border-color: #fcd34d;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.order-code {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.code {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

/* EC-07 */
.priority-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.75rem 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.priority-reason {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  color: #475569;
  font-size: 0.85rem;
  line-height: 1.45;
}

.priority-reason i {
  margin-top: 0.15rem;
  color: #64748b;
}

.priority-high .priority-reason i {
  color: #dc2626;
}

.priority-review .priority-reason i {
  color: #d97706;
}

.order-vehicle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  color: #0f172a;
}

.order-vehicle i {
  color: #0b1680;
}

.order-customer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: #64748b;
}

.order-dates {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
}

.order-dates div {
  padding: 0.7rem;
  background: #f8fafc;
  border-radius: 14px;
  min-width: 0;
}

.order-dates span {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #64748b;
}

.order-dates strong {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.95rem;
  color: #0f172a;
  overflow-wrap: anywhere;
}

.order-progress-row {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  color: #64748b;
}

.order-progress-row strong {
  color: #0b1680;
}

.order-progress {
  height: 8px;
}

.detail-button {
  width: 100%;
  margin-top: 0.5rem;
  border-radius: 14px;
}

@media (max-width: 480px) {
  .order-dates {
    grid-template-columns: 1fr;
  }
}
</style>
