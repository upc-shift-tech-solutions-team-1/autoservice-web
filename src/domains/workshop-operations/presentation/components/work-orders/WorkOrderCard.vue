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

// Normaliza el estado para la traducción
const getStatusLabel = (status) => {
  if (!status) return t('workOrders.statusOptions.pending');
  // Convierte "IN_PROGRESS" a "in_progress", "FINISHED" a "finished", etc.
  const normalized = status.toString().toLowerCase().replace(' ', '_');
  const key = `workOrders.statusOptions.${normalized}`;
  const translated = t(key);
  // Si no encuentra traducción, devuelve el texto original capitalizado
  return translated === key ? status : translated;
};

// Asigna color según el estado
const getStatusSeverity = (status) => {
  if (!status) return 'secondary';
  const s = status.toString().toLowerCase();
  if (s.includes('progress')) return 'info';
  if (s.includes('finish')) return 'warning';
  if (s.includes('deliver') || s.includes('complet')) return 'success';
  if (s.includes('cancel')) return 'danger';
  return 'secondary';
};

</script>

<template>
  <article class="order-card" :class="{ 'risk-card': order.isRisk }">
    <div class="order-header">
      <div class="order-code">
        <span class="code">{{ order.trackingCode }}</span>
        <Tag v-if="order.isRisk" :value="t('workOrders.card.riskBadge')" severity="danger" rounded />
      </div>

      <Tag
          :value="getStatusLabel(order.status)"
          :severity="getStatusSeverity(order.status)"
      />
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
        <strong> S/. {{ Number(order.calculatedTotal || 0).toFixed(2) }}</strong>
      </div>
    </div>

    <div class="order-progress-row">
      <span>{{ t('workOrders.card.taskProgress') }}</span>
      <strong>{{ order.progress }}%</strong>
    </div>

    <ProgressBar :value="order.progress" :showValue="false" class="order-progress" />

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
.order-card { display: flex; flex-direction: column; gap: 0.9rem; padding: 1.2rem; background: #ffffff; border: 1px solid #e8edf5; border-radius: 24px; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); transition: transform 0.2s; }
.order-card:hover { transform: translateY(-2px); }
.risk-card { background: #fff9f9; border-color: #fca5a5; }
.order-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.order-code { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.code { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
.order-vehicle { display: flex; align-items: center; gap: 0.6rem; font-size: 1rem; color: #0f172a; }
.order-vehicle i { color: #0b1680; }
.order-customer { display: flex; align-items: center; gap: 0.5rem; margin: 0; color: #64748b; }
.order-dates { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; }
.order-dates div { padding: 0.7rem; background: #f8fafc; border-radius: 14px; }
.order-dates span { display: block; font-size: 0.82rem; font-weight: 700; color: #64748b; }
.order-dates strong { display: block; margin-top: 0.2rem; font-size: 0.95rem; color: #0f172a; }
.order-progress-row { display: flex; justify-content: space-between; font-weight: 700; color: #64748b; }
.order-progress-row strong { color: #0b1680; }
.order-progress { height: 8px; }
.detail-button { width: 100%; margin-top: 0.5rem; border-radius: 14px; }
</style>