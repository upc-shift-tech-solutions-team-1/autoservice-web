<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';

import { useCustomerStore } from '../../customer-management/application/customer.store';
import { useVehicleStore } from '../../fleet-management/application/vehicle.store';
import { useTaskStore } from '../application/task.store';
import { useWorkOrderStore } from '../application/work-order.store';

import WorkOrderCard from './components/work-orders/WorkOrderCard.vue';
import WorkOrderFilters from './components/work-orders/WorkOrderFilters.vue';

const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

const TASK_STATUS = {
  COMPLETED: 'COMPLETED'
};

const { t } = useI18n();
const router = useRouter();

const workOrderStore = useWorkOrderStore();
const vehicleStore = useVehicleStore();
const customerStore = useCustomerStore();
const taskStore = useTaskStore();

// ── UI State ──────────────────────────────────────────────
const viewMode = ref('list'); // 'list' | 'kanban'

// ── Filters ───────────────────────────────────────────────
const search = ref('');
const selectedStatus = ref(null);

const statusOptions = computed(() => [
  { label: t('workOrders.statusOptions.pending'), value: ORDER_STATUS.PENDING },
  { label: t('workOrders.statusOptions.in_progress'), value: ORDER_STATUS.IN_PROGRESS },
  { label: t('workOrders.statusOptions.finished'), value: ORDER_STATUS.FINISHED },
  { label: t('workOrders.statusOptions.delivered'), value: ORDER_STATUS.DELIVERED },
  { label: t('workOrders.statusOptions.cancelled'), value: ORDER_STATUS.CANCELLED }
]);

const loadData = async () => {
  await Promise.all([
    workOrderStore.fetchWorkOrders(),
    vehicleStore.fetchVehicles(),
    customerStore.fetchCustomers(),
    taskStore.fetchAllTasks()
  ]);
};

onMounted(() => loadData());

// ── Formatters ───────────────────────────────────────────
const getVehiclePlate = (id) =>
    vehicleStore.vehicles.find(vehicle => String(vehicle.id) === String(id))?.plate || '---';

const getVehicleName = (id) => {
  const vehicle = vehicleStore.vehicles.find(item => String(item.id) === String(id));
  if (!vehicle) return t('common.notFound');
  return `${vehicle.brand || t('workOrders.defaults.vehicle')} ${vehicle.model || ''} - ${vehicle.plate}`;
};

const getCustomerName = (id) => {
  if (!id) return '---';
  const customer = customerStore.customers.find(item => String(item.id) === String(id));
  return customer ? customer.fullName : t('common.notFound');
};

const calculateProgress = (orderId) => {
  const tasks = taskStore.tasks.filter(task => String(task.workOrderId) === String(orderId));
  if (!tasks.length) return 0;

  const completedTasks = tasks.filter(task => task.status === TASK_STATUS.COMPLETED).length;
  return Math.round((completedTasks / tasks.length) * 100);
};

const getSeverity = (status) => {
  if (status === ORDER_STATUS.DELIVERED) return 'success';
  if (status === ORDER_STATUS.FINISHED) return 'success';
  if (status === ORDER_STATUS.IN_PROGRESS) return 'info';
  if (status === ORDER_STATUS.PENDING) return 'warning';
  if (status === ORDER_STATUS.CANCELLED) return 'danger';
  return 'secondary';
};

const isRiskOrder = (order) => {
  if (order.status !== ORDER_STATUS.PENDING) return false;
  if (!order.estimatedDate) return false;

  const estDate = new Date(order.estimatedDate);
  const today = new Date();
  const diffTime = estDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 3;
};

// ── Computed ──────────────────────────────────────────────
const ordersView = computed(() =>
    workOrderStore.workOrders.map(order => {

      const tasks = taskStore.tasks.filter(
          task => task.workOrderId === order.id
      );

      const calculatedTotal = tasks.reduce(
          (sum, task) =>
              sum +
              Number(task.laborPrice || 0) +
              Number(task.materialsCost || 0),
          0
      );

      return {
        id: order.id,
        raw: order,

        trackingCode: order.trackingCode || `WO-${order.id}`,

        vehiclePlate: getVehicleName(order.vehicleId),
        plateOnly: getVehiclePlate(order.vehicleId),

        customerName: getCustomerName(order.customerId),

        progress: calculateProgress(order.id),

        startDate: order.startDate,
        estimatedDate: order.estimatedDate,

        status: order.status || ORDER_STATUS.PENDING,
        severity: getSeverity(order.status),

        calculatedTotal,

        isRisk: isRiskOrder(order)
      };
    })
);

const filteredOrders = computed(() => {
  const term = search.value.toLowerCase().trim();
  return ordersView.value.filter(order => {
    const matchesSearch =
        !term ||
        order.trackingCode.toLowerCase().includes(term) ||
        order.vehiclePlate.toLowerCase().includes(term) ||
        order.plateOnly.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term);

    const matchesStatus = !selectedStatus.value || order.status === selectedStatus.value;
    return matchesSearch && matchesStatus;
  });
});

// Kanban Columns Builder
const kanbanColumns = computed(() => [
  { id: 'pending', title: t('workOrders.statusOptions.pending'), status: ORDER_STATUS.PENDING, items: filteredOrders.value.filter(o => o.status === ORDER_STATUS.PENDING) },
  { id: 'in_progress', title: t('workOrders.statusOptions.in_progress'), status: ORDER_STATUS.IN_PROGRESS, items: filteredOrders.value.filter(o => o.status === ORDER_STATUS.IN_PROGRESS) },
  { id: 'finished', title: t('workOrders.statusOptions.finished'), status: ORDER_STATUS.FINISHED, items: filteredOrders.value.filter(o => o.status === ORDER_STATUS.FINISHED) },
  { id: 'delivered', title: t('workOrders.statusOptions.delivered'), status: ORDER_STATUS.DELIVERED, items: filteredOrders.value.filter(o => o.status === ORDER_STATUS.DELIVERED) }
]);

const activeOrders = computed(() => workOrderStore.workOrders.filter(order => order.status === ORDER_STATUS.IN_PROGRESS).length);
const riskOrders = computed(() => ordersView.value.filter(order => order.isRisk).length);
const finishedOrders = computed(() => workOrderStore.workOrders.filter(order => order.status === ORDER_STATUS.FINISHED).length);
const deliveredOrders = computed(() => workOrderStore.workOrders.filter(order => order.status === ORDER_STATUS.DELIVERED).length);

const viewDetail = (order) => {
  router.push(`/work-orders/${order.id}`);
};

watch(viewMode, (newMode) => {
  if (newMode === 'kanban') {
    selectedStatus.value = null;
  }
});
const ordersWithTotal = computed(() =>
    workOrderStore.workOrders.map(order => {

      const tasks = taskStore.tasks.filter(
          task => task.workOrderId === order.id
      );

      const total = tasks.reduce(
          (sum, task) =>
              sum +
              Number(task.laborPrice || 0) +
              Number(task.materialsCost || 0),
          0
      );

      return {
        ...order,
        calculatedTotal: total
      };
    })
);
</script>

<template>
  <section class="work-orders-page">

    <div class="work-orders-header">
      <div>
        <span class="eyebrow">{{ t('workOrders.eyebrow') }}</span>
        <h1>{{ t('workOrders.title') }}</h1>
        <p>{{ t('workOrders.description') }}</p>
      </div>

      <div class="header-actions">
        <div class="view-toggles">
          <Button icon="pi pi-list" :severity="viewMode === 'list' ? 'primary' : 'secondary'" :outlined="viewMode !== 'list'" @click="viewMode = 'list'" />
          <Button icon="pi pi-th-large" :severity="viewMode === 'kanban' ? 'primary' : 'secondary'" :outlined="viewMode !== 'kanban'" @click="viewMode = 'kanban'" />
        </div>
        <Button :label="t('workOrders.newButton')" icon="pi pi-plus" class="add-button" @click="router.push('/work-orders/new')" />
      </div>
    </div>

    <div class="summary-row">
      <div class="summary-card">
        <span>{{ t('workOrders.summary.total') }}</span>
        <strong>{{ workOrderStore.workOrders.length }}</strong>
      </div>
      <div class="summary-card">
        <span>{{ t('workOrders.summary.inProgress') }}</span>
        <strong>{{ activeOrders }}</strong>
      </div>
      <div class="summary-card warning">
        <span>{{ t('workOrders.summary.riskDelay') }}</span>
        <strong>{{ riskOrders }}</strong>
      </div>
      <div class="summary-card">
        <span>{{ t('workOrders.summary.finished') }}</span>
        <strong>{{ finishedOrders }}</strong>
      </div>
      <div class="summary-card success">
        <span>{{ t('workOrders.summary.delivered') }}</span>
        <strong>{{ deliveredOrders }}</strong>
      </div>
    </div>

    <WorkOrderFilters
        v-model:search="search"
        v-model:status="selectedStatus"
        :status-options="statusOptions"
        :show-status="viewMode === 'list'"
    />
    <div v-if="workOrderStore.loading" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>{{ t('workOrders.loading') }}</p>
    </div>

    <template v-else-if="filteredOrders.length">

      <div v-if="viewMode === 'list'" class="orders-grid">
        <WorkOrderCard v-for="order in filteredOrders"
                       :key="order.id"
                       :order="order"
                       @view-detail="viewDetail" />
      </div>


      <div v-else class="kanban-board">
        <div v-for="column in kanbanColumns" :key="column.id" class="kanban-column">
          <div class="column-header">
            <h3>{{ column.title }}</h3>
            <span class="column-count">{{ column.items.length }}</span>
          </div>

          <div class="column-content">
            <WorkOrderCard v-for="order in column.items" :key="order.id" :order="order" @view-detail="viewDetail" class="kanban-card" />
            <div v-if="column.items.length === 0" class="empty-column">
              {{ t('common.emptyColumn') || 'Sin órdenes' }}
            </div>
          </div>
        </div>
      </div>

    </template>

    <div v-else class="empty-state">
      <i class="pi pi-file-edit"></i>
      <h3>{{ t('workOrders.empty.title') }}</h3>
      <p>{{ t('workOrders.empty.description') }}</p>
    </div>

  </section>
</template>

<style scoped>
.work-orders-page { min-height: 100%; display: flex; flex-direction: column; }
.work-orders-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; margin-bottom: 1.5rem; }
.eyebrow { display: inline-flex; margin-bottom: 0.5rem; color: #0b1680; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.work-orders-header h1 { margin: 0; color: #0f172a; font-size: clamp(2rem, 4vw, 2.7rem); line-height: 1.05; letter-spacing: -0.04em; }
.work-orders-header p { max-width: 680px; margin: 0.75rem 0 0; color: #64748b; }

.header-actions { display: flex; gap: 1rem; align-items: center; }
.view-toggles { display: flex; background: #f8fafc; border-radius: 8px; padding: 4px; border: 1px solid #e2e8f0; }
.view-toggles :deep(.p-button) { padding: 0.5rem; border-radius: 6px; border: none; }
.add-button { background: #0b1680; border-color: #0b1680; border-radius: 14px; }

.summary-row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.summary-card { padding: 1rem 1.2rem; background: #ffffff; border: 1px solid #e8edf5; border-radius: 20px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05); }
.summary-card span { display: block; color: #64748b; font-weight: 700; font-size: 0.9rem; }
.summary-card strong { display: block; margin-top: 0.25rem; color: #0b1680; font-size: 1.8rem; }
.summary-card.warning strong { color: #c2410c; }
.summary-card.success strong { color: #16a34a; }

.orders-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }

/* KANBAN STYLES */
.kanban-board { display: flex; gap: 1.25rem; overflow-x: auto; padding-bottom: 1rem; flex: 1; align-items: flex-start; }
.kanban-column { flex: 0 0 340px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; max-height: 100%; }
.column-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 2px solid #e2e8f0; }
.column-header h3 { margin: 0; font-size: 1rem; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
.column-count { background: #e2e8f0; color: #475569; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.85rem; font-weight: bold; }
.column-content { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 65vh; }
.kanban-card { cursor: grab; }
.kanban-card:active { cursor: grabbing; }
.empty-column { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.9rem; border: 2px dashed #cbd5e1; border-radius: 12px; }

.empty-state { display: grid; place-items: center; min-height: 260px; text-align: center; color: #64748b; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 24px; }
.empty-state i { margin-bottom: 0.75rem; color: #0b1680; font-size: 2rem; }
.empty-state h3 { margin: 0; color: #0f172a; }

@media (max-width: 1100px) {
  .summary-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .orders-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .work-orders-header { flex-direction: column; }
  .header-actions { width: 100%; justify-content: space-between; }
  .summary-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .orders-grid { grid-template-columns: 1fr; }
}
</style>