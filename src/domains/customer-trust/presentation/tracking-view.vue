<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';

import { TrackingService } from '../infrastructure/tracking.service';
const { t, locale } = useI18n();

const trackingCode = ref('');
const order = ref(null);
const vehicle = ref(null);
const customer = ref(null);
const workshop = ref(null);
const tasks = ref([]);
const history = ref([]);
const loading = ref(false);
const errorMsg = ref('');

const dynamicWorkshopName = computed(() => workshop.value?.name || workshop.value?.workshopName || 'Auto-Taller');
const standardStages = ['PENDING', 'IN_PROGRESS', 'FINISHED', 'DELIVERED'];

const searchOrder = async () => {
  const code = trackingCode.value.trim();
  if (!code) {
    errorMsg.value = t('tracking.validationError');
    return;
  }

  loading.value = true;
  errorMsg.value = '';

  try {
    const [summaryResult, orderResult] = await Promise.allSettled([
      TrackingService.getSummaryByCode(code),
      TrackingService.getOrderByCode(code)
    ]);

    if (summaryResult.status === 'rejected') {
      throw summaryResult.reason;
    }

    const summary = summaryResult.value?.data;
    if (!summary || !summary.costs || !Array.isArray(summary.tasks) || !Array.isArray(summary.history)) {
      throw new Error('Invalid tracking summary response');
    }

    order.value = summary;
    tasks.value = summary.tasks;
    history.value = summary.history;

    if (orderResult.status === 'rejected') {
      console.warn('No se pudieron cargar los identificadores públicos relacionados:', orderResult.reason);
      return;
    }

    const orderData = Array.isArray(orderResult.value?.data)
      ? orderResult.value.data[0]
      : null;

    if (!orderData) {
      console.warn('La respuesta pública de la orden no contiene datos relacionados.');
      return;
    }

    const relatedRequests = [
      orderData.vehicleId
        ? TrackingService.getVehicle(orderData.vehicleId)
            .then(response => ({ type: 'vehicle', data: response.data }))
            .catch(error => {
              console.error('Error al obtener vehículo:', error);
              return { type: 'vehicle', data: null };
            })
        : Promise.resolve({ type: 'vehicle', data: null }),
      orderData.customerId
        ? TrackingService.getCustomer(orderData.customerId)
            .then(response => ({ type: 'customer', data: response.data }))
            .catch(error => {
              console.error('Error al obtener cliente:', error);
              return { type: 'customer', data: { fullName: 'Cliente' } };
            })
        : Promise.resolve({ type: 'customer', data: { fullName: 'Cliente' } }),
      orderData.workshopId
        ? TrackingService.getWorkshop(orderData.workshopId)
            .then(response => ({ type: 'workshop', data: response.data }))
            .catch(error => {
              console.error('Error al obtener taller:', error);
              return { type: 'workshop', data: null };
            })
        : Promise.resolve({ type: 'workshop', data: null })
    ];

    const relatedResults = await Promise.all(relatedRequests);
    relatedResults.forEach(result => {
      if (result.type === 'vehicle') vehicle.value = result.data;
      if (result.type === 'customer') customer.value = result.data;
      if (result.type === 'workshop') workshop.value = result.data;
    });

  } catch (err) {
    console.error('Error en searchOrder:', err);
    errorMsg.value = err.response?.status === 404
      ? t('tracking.notFound')
      : err.response?.data?.message || t('tracking.errorConnection');
  } finally {
    loading.value = false;
  }
};

const resetSearch = () => {
  order.value = null;
  trackingCode.value = '';
  vehicle.value = null;
  customer.value = null;
  workshop.value = null;
  tasks.value = [];
  history.value = [];
};

const getStatusMessage = computed(() => {
  if (!order.value) return '';
  const status = order.value.status;
  if (status === 'PENDING') return t('tracking.statusMessages.pending', { workshop: dynamicWorkshopName.value });
  if (status === 'IN_PROGRESS') return t('tracking.statusMessages.in_progress', { workshop: dynamicWorkshopName.value });
  if (status === 'FINISHED') return t('tracking.statusMessages.finished', { workshop: dynamicWorkshopName.value });
  if (status === 'DELIVERED') return t('tracking.statusMessages.delivered', { workshop: dynamicWorkshopName.value });
  if (status === 'CANCELLED') return t('tracking.statusMessages.cancelled', { workshop: dynamicWorkshopName.value });
  return '';
});

const getProgressValue = computed(() => {
  if (!order.value) return 0;
  return Number(order.value.progressPercentage) || 0;
});

const historySteps = computed(() => {
  if (!order.value) return [];

  const currentStatus = order.value.status;
  const recordedStages = new Map();
  history.value.forEach(stage => recordedStages.set(stage.status, stage.changedAtUtc));

  if (currentStatus === 'CANCELLED') {
    const recorded = history.value.map(stage => ({
      status: stage.status,
      changedAtUtc: stage.changedAtUtc,
      state: 'completed'
    }));
    const cancelledStage = recorded.find(stage => stage.status === currentStatus);
    if (!cancelledStage) {
      recorded.push({ status: currentStatus, changedAtUtc: null, state: 'current' });
    } else {
      cancelledStage.state = 'current';
    }
    return recorded;
  }

  const currentIndex = standardStages.indexOf(currentStatus);
  if (currentIndex < 0) {
    return history.value.map(stage => ({
      status: stage.status,
      changedAtUtc: stage.changedAtUtc,
      state: stage.status === currentStatus ? 'current' : 'completed'
    }));
  }

  return standardStages.map((status, index) => ({
    status,
    changedAtUtc: recordedStages.get(status) || null,
    state: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending'
  }));
});

const formatHistoryDate = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const formatCurrency = value => new Intl.NumberFormat(locale.value, {
  style: 'currency',
  currency: 'PEN'
}).format(Number(value) || 0);

const stageLabel = status => t(`tracking.stages.${status.toLowerCase()}`);

const safeEvidenceUrl = evidence => {
  if (!evidence) return null;
  try {
    const url = new URL(evidence);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};
</script>

<template>
  <div class="tracking-layout no-print" :class="{ 'has-results': order }">
    <div class="tracking-container">

      <div v-if="!order" class="tracking-header">
        <i class="pi pi-wrench text-6xl mb-3" style="color: #0b1680;"></i>
        <h1>Portal de Seguimiento</h1>
        <p>{{ t('tracking.welcomeSubtitle') }}</p>
      </div>

      <Card v-if="!order" class="search-card">
        <template #content>
          <div class="search-form-layout">
            <InputText
                v-model="trackingCode"
                :placeholder="t('tracking.inputPlaceholder')"
                class="w-full p-inputtext-lg text-center"
                @keyup.enter="searchOrder"
            />
            <Button
                icon="pi pi-search"
                :label="t('tracking.searchButton')"
                size="large"
                class="w-full justify-content-center search-btn"
                @click="searchOrder"
                :loading="loading"
            />
          </div>
          <Message v-if="errorMsg" severity="error" :closable="false" class="mt-4">{{ errorMsg }}</Message>
        </template>
      </Card>

      <div v-else class="result-section fade-in">
        <div class="flex justify-content-between align-items-center mb-3">
          <Button icon="pi pi-arrow-left" text :label="t('tracking.backButton')" @click="resetSearch" />
        </div>

        <Card class="status-card mb-4" data-testid="tracking-status">
          <template #content>
            <div class="status-header">
              <h2>{{ t('tracking.greeting', { name: customer?.fullName || 'Cliente' }) }}</h2>
              <p class="status-msg">{{ getStatusMessage }}</p>
            </div>

            <div class="vehicle-info mt-4">
              <i class="pi pi-car text-3xl"></i>
              <div>
                <strong class="block text-lg">{{ vehicle ? `${vehicle.brand} ${vehicle.model}` : t('tracking.yourVehicle') }}</strong>
                <span class="block text-white-alpha-70">{{ vehicle?.plate }}</span>
              </div>
            </div>

            <div class="estimated-date mt-3" data-testid="tracking-estimated-date">
              <i class="pi pi-calendar mr-2"></i>
              <span class="font-semibold">{{ t('tracking.estimatedDate') }}:</span>
              <span>{{ order.estimatedDate || t('tracking.estimatedDateUnavailable') }}</span>
            </div>

            <div class="progress-container mt-4 pt-3 border-top-1 border-white-alpha-20">
              <div class="flex justify-content-between mb-2">
                <span class="font-semibold">{{ t('tracking.progress') }}</span>
                <strong data-testid="tracking-progress-value">{{ getProgressValue }}%</strong>
              </div>
              <ProgressBar :value="getProgressValue" :showValue="false" class="custom-progress" />
            </div>
          </template>
        </Card>

        <Card class="history-card mb-4" data-testid="tracking-history">
          <template #title>{{ t('tracking.history.title') }}</template>
          <template #content>
            <ol v-if="historySteps.length" class="history-timeline" data-testid="tracking-history-list">
              <li
                  v-for="(stage, index) in historySteps"
                  :key="`${stage.status}-${index}`"
                  class="history-item"
                  :class="`history-item--${stage.state}`"
                  data-testid="tracking-history-item"
              >
                <span class="history-marker" aria-hidden="true">
                  <i :class="stage.state === 'completed' ? 'pi pi-check' : stage.state === 'current' ? 'pi pi-circle-fill' : 'pi pi-circle'" />
                </span>
                <div>
                  <strong>{{ stageLabel(stage.status) }}</strong>
                  <span v-if="stage.state === 'current'" class="history-state">{{ t('tracking.history.current') }}</span>
                  <span v-else-if="stage.state === 'pending'" class="history-state">{{ t('tracking.history.pending') }}</span>
                  <time v-if="stage.changedAtUtc" class="history-date">{{ formatHistoryDate(stage.changedAtUtc) }}</time>
                </div>
              </li>
            </ol>
            <Message v-else severity="info" :closable="false">{{ t('tracking.history.empty') }}</Message>
          </template>
        </Card>

        <Card class="tasks-card">
          <template #title>{{ t('tracking.tasksTitle') }}</template>
          <template #content>
            <div v-if="tasks.length" class="tasks-list">
              <div v-for="(task, index) in tasks" :key="`${task.description}-${index}`" class="task-item" data-testid="tracking-task">
                <div class="flex justify-content-between align-items-start mb-2">
                  <span class="font-bold text-lg color-title">{{ task.description }}</span>
                  <Tag
                      :value="t(`taskStatus.${task.status.toLowerCase()}`)"
                      :severity="task.status === 'COMPLETED' ? 'success' : 'warning'"
                  />
                </div>

                <div v-if="task.technicalDiagnosis" class="task-public-detail">
                  <strong>{{ t('tracking.taskDetails.diagnosis') }}</strong>
                  <p>{{ task.technicalDiagnosis }}</p>
                </div>
                <div v-if="task.customerExplanation" class="task-public-detail">
                  <strong>{{ t('tracking.taskDetails.explanation') }}</strong>
                  <p>{{ task.customerExplanation }}</p>
                </div>
                <div v-if="task.evidenceRegistered" class="task-public-detail">
                  <strong>{{ t('tracking.taskDetails.evidence') }}</strong>
                  <p v-if="!safeEvidenceUrl(task.evidenceRegistered)">{{ task.evidenceRegistered }}</p>
                  <a
                      v-else
                      :href="safeEvidenceUrl(task.evidenceRegistered)"
                      target="_blank"
                      rel="noopener noreferrer"
                  >{{ t('tracking.taskDetails.openEvidence') }}</a>
                </div>

                <div v-if="task.parts && task.parts.length" class="materials-box mt-3">
                  <span class="text-sm font-bold uppercase color-subtitle"><i class="pi pi-box"></i> {{ t('tracking.materialsUsed') }}</span>
                  <ul class="p-0 m-0 mt-2 list-none">
                    <li v-for="(part, i) in task.parts" :key="i" class="flex justify-content-between text-sm py-2 border-bottom-1 border-gray-200">
                      <span>{{ part.quantity }}x {{ part.name }}</span>
                      <span class="font-medium">{{ formatCurrency((part.unitPrice || 0) * part.quantity) }}</span>
                    </li>
                  </ul>
                </div>

                <div class="task-costs mt-3">
                  <span>{{ t('tracking.costs.labor') }}: <strong>{{ formatCurrency(task.laborPrice) }}</strong></span>
                  <span>{{ t('tracking.costs.materials') }}: <strong>{{ formatCurrency(task.materialsCost) }}</strong></span>
                </div>
              </div>
            </div>
            <Message v-else severity="info" :closable="false">{{ t('tracking.tasksEmpty') }}</Message>

            <div class="cost-breakdown mt-4 pt-3 border-top-1 border-gray-300" data-testid="tracking-costs">
              <div class="cost-line">
                <span>{{ t('tracking.costs.laborSubtotal') }}</span>
                <strong>{{ formatCurrency(order.costs.laborSubtotal) }}</strong>
              </div>
              <div class="cost-line">
                <span>{{ t('tracking.costs.materialsSubtotal') }}</span>
                <strong>{{ formatCurrency(order.costs.materialsSubtotal) }}</strong>
              </div>
              <div class="cost-line cost-line--total">
                <span>{{ t('tracking.costs.total') }}</span>
                <strong>{{ formatCurrency(order.costs.total) }}</strong>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

  </div>

</template>
<style scoped>
/* Estilos normales de pantalla */
.tracking-layout { min-height: 100vh; background: #f8fafc; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem 1rem; transition: all 0.3s ease; }
.tracking-layout.has-results { justify-content: flex-start; padding-top: 3rem; }
.tracking-container { width: 100%; max-width: 520px; }
.tracking-layout.has-results .tracking-container { max-width: 640px; }
.tracking-header { text-align: center; margin-bottom: 2rem; }
.tracking-header h1 { color: #0b1680; font-size: 2.6rem; font-weight: 900; margin: 0 0 0.5rem 0; letter-spacing: -1px; }
.tracking-header p { color: #64748b; margin: 0; font-size: 1.1rem; line-height: 1.4; }
.search-card { border-radius: 24px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0; width: 100%; }
.search-form-layout { display: flex; flex-direction: column; gap: 1rem; align-items: center; }
.search-btn { background: #0b1680; border-color: #0b1680; border-radius: 14px; padding: 0.85rem; }

/* Cards de Resultados */
.status-card { border-radius: 24px; background: linear-gradient(135deg, #0b1680 0%, #1e3a8a 100%); color: white; box-shadow: 0 14px 34px rgba(11, 22, 128, 0.2); }
.status-header h2 { margin: 0; font-size: 1.8rem; }
.status-msg { font-size: 1.1rem; line-height: 1.5; margin-top: 0.5rem; color: #e0e7ff; }
.vehicle-info { display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.1); padding: 1.2rem; border-radius: 16px; }
.estimated-date { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; color: #e0e7ff; }
.text-white-alpha-70 { color: rgba(255,255,255,0.7); }
.border-white-alpha-20 { border-color: rgba(255,255,255,0.2) !important; }
.custom-progress { height: 10px; background: rgba(255,255,255,0.2); border-radius: 8px; }
.custom-progress :deep(.p-progressbar-value) { background: #4ade80; }
.history-card { border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
.history-timeline { list-style: none; margin: 0; padding: 0; }
.history-item { position: relative; display: flex; gap: 0.9rem; padding: 0 0 1.2rem; color: #64748b; }
.history-item:not(:last-child)::before { content: ''; position: absolute; left: 0.55rem; top: 1.25rem; bottom: 0; border-left: 2px solid #cbd5e1; }
.history-marker { position: relative; z-index: 1; width: 1.2rem; height: 1.2rem; display: grid; place-items: center; border-radius: 50%; background: white; color: #94a3b8; }
.history-item--completed .history-marker { color: #16a34a; }
.history-item--current { color: #0b1680; }
.history-item--current .history-marker { color: #0b1680; }
.history-state { display: inline-block; margin-left: 0.5rem; font-size: 0.8rem; color: #64748b; }
.history-date { display: block; margin-top: 0.25rem; font-size: 0.85rem; color: #64748b; }
.tasks-card { border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
.task-item { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.materials-box { background: #f8fafc; border-radius: 12px; padding: 1rem; border: 1px dashed #cbd5e1; }
.task-public-detail { margin-top: 0.75rem; color: #475569; }
.task-public-detail p { margin: 0.25rem 0 0; line-height: 1.5; }
.task-public-detail a { display: inline-block; margin-top: 0.25rem; color: #0b1680; text-decoration: underline; }
.task-costs, .cost-line { display: flex; justify-content: space-between; gap: 1rem; color: #475569; }
.task-costs { flex-wrap: wrap; }
.cost-breakdown { display: grid; gap: 0.75rem; }
.cost-line--total { padding-top: 0.75rem; border-top: 1px solid #cbd5e1; color: #0b1680; font-size: 1.2rem; }
.color-title { color: #0f172a; }
.color-subtitle { color: #64748b; }
.flex { display: flex; }
.justify-content-between { justify-content: space-between; }
.justify-content-end { justify-content: flex-end; }
.justify-content-center { justify-content: center; }
.align-items-start { align-items: flex-start; }
.align-items-center { align-items: center; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.pt-3 { padding-top: 1rem; }
.py-3 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-5 { padding-top: 3rem; padding-bottom: 3rem; }
.px-3 { padding-left: 1rem; padding-right: 1rem; }
.px-4 { padding-left: 1.5rem; padding-right: 1.5rem; }
.p-0 { padding: 0; }
.m-0 { margin: 0; }
.mx-auto { margin-left: auto; margin-right: auto; }
.list-none { list-style: none; }
.border-top-1 { border-top: 1px solid; }
.border-bottom-1 { border-bottom: 1px solid; }
.border-gray-200 { border-color: #e2e8f0; }
.border-gray-300 { border-color: #cbd5e1; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }
.text-6xl { font-size: 3.5rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-normal { font-weight: 400; }
.uppercase { text-transform: uppercase; }
.tracking-wider { letter-spacing: 0.05em; }
.text-center { text-align: center; }
.block { display: block; }
.fade-in { animation: fadeIn 0.3s ease-in; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
