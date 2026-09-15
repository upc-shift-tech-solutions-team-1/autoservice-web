<script setup>
/**
 * Vehicle Detail View
 * Loads vehicle, owner, orders and tasks related to a specific vehicle.
 */

import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useVehicleStore } from '../application/vehicle.store';
import { useCustomerStore } from '../../customer-management/application/customer.store';
import { useWorkOrderStore } from '../../workshop-operations/application/work-order.store';
import { useTaskStore } from '../../workshop-operations/application/task.store';

import Button from 'primevue/button';
import Card from 'primevue/card';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

// ── CONSTANTS FOR DOMAIN LOGIC ───────────────────────────
const VEHICLE_STATUS = {
  IN_WORKSHOP: 'IN_WORKSHOP',
  READY: 'READY',
  DELIVERED: 'DELIVERED'
};

const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  DELIVERED: 'DELIVERED'
};

const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

const route = useRoute();
const router = useRouter();

const { t } = useI18n();

const vehicleStore = useVehicleStore();
const customerStore = useCustomerStore();
const workOrderStore = useWorkOrderStore();
const taskStore = useTaskStore();

const vehicleId = route.params.id;

const fallbackVehicleImages = [
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop'
];

onMounted(async () => {
  await Promise.all([
    vehicleStore.fetchVehicles(),
    customerStore.fetchCustomers(),
    workOrderStore.fetchWorkOrders(),
    taskStore.fetchAllTasks()
  ]);
});

/**
 * Selected vehicle
 */
const vehicle = computed(() =>
    vehicleStore.vehicles.find((item) => String(item.id) === String(vehicleId))
);

/**
 * Vehicle image with fallback
 */
const vehicleImage = computed(() => {
  if (!vehicle.value) return '';
  if (vehicle.value.image) return vehicle.value.image;

  const index = vehicleStore.vehicles.findIndex(
      (item) => String(item.id) === String(vehicleId)
  );

  return fallbackVehicleImages[index >= 0 ? index % fallbackVehicleImages.length : 0];
});

/**
 * Vehicle owner
 */
const owner = computed(() => {
  if (!vehicle.value) return null;

  return customerStore.customers.find(
      (customer) => String(customer.id) === String(vehicle.value.customerId)
  );
});

/**
 * Orders related to vehicle
 */
const relatedOrders = computed(() =>
    workOrderStore.workOrders.filter(
        (order) => String(order.vehicleId) === String(vehicleId)
    )
);

/**
 * Last order of vehicle
 */
const lastOrder = computed(() =>
    relatedOrders.value.length
        ? relatedOrders.value[relatedOrders.value.length - 1]
        : null
);

/**
 * Tasks related to last order
 */
const relatedTasks = computed(() => {
  if (!lastOrder.value) return [];

  return taskStore.tasks.filter(
      (task) => String(task.workOrderId) === String(lastOrder.value.id)
  );
});

/**
 * Progress calculation based on tasks or vehicle status
 */
const progress = computed(() => {
  if (!relatedTasks.value.length) {
    return getProgressByStatus(vehicle.value?.status);
  }

  const completed = relatedTasks.value.filter((task) =>
      task.status === TASK_STATUS.COMPLETED
  ).length;

  return Math.round((completed / relatedTasks.value.length) * 100);
});

/**
 * Map vehicle status to progress percentage
 * @param {string} status
 */
const getProgressByStatus = (status) => {
  if ([VEHICLE_STATUS.READY, VEHICLE_STATUS.DELIVERED, ORDER_STATUS.FINISHED, ORDER_STATUS.DELIVERED].includes(status)) return 100;
  if (status === ORDER_STATUS.IN_PROGRESS) return 65;
  if (status === ORDER_STATUS.PENDING) return 15;
  return 0;
};

/**
 * Vehicle status severity
 * @param {string} status
 */
const getVehicleSeverity = (status) => {
  if ([VEHICLE_STATUS.READY, VEHICLE_STATUS.DELIVERED, ORDER_STATUS.FINISHED, ORDER_STATUS.DELIVERED].includes(status)) return 'success';
  if ([VEHICLE_STATUS.IN_WORKSHOP, ORDER_STATUS.IN_PROGRESS].includes(status)) return 'info';
  if (status === ORDER_STATUS.PENDING) return 'warning';
  return 'secondary';
};

/**
 * Task status severity
 * @param {string} status
 */
const getTaskSeverity = (status) => {
  if (status === TASK_STATUS.COMPLETED) return 'success';
  if (status === TASK_STATUS.IN_PROGRESS) return 'info';
  if (status === TASK_STATUS.PENDING) return 'warning';
  return 'secondary';
};

/**
 * Resolves technical status codes to translation keys dynamically
 */
const getStatusLabel = (status, prefix = 'vehicles.statusOptions') => {
  if (!status) return '';
  const key = String(status).toLowerCase();
  return t(`${prefix}.${key}`);
};

const goBack = () => router.push('/vehicles');
const goToOrder = (orderId) => router.push(`/work-orders/${orderId}`);

</script>

<template>
  <section class="vehicle-detail-page">
    <div class="detail-header">
      <div>
        <Button icon="pi pi-arrow-left" text rounded class="back-button" @click="goBack" />
        <span class="eyebrow">{{ t('vehicleDetail.technicalDetail') }}</span>
        <h1 v-if="vehicle">{{ vehicle.brand }} {{ vehicle.model }}</h1>
        <p v-if="vehicle">{{ t('vehicleDetail.description') }}</p>
      </div>

      <Tag
          v-if="vehicle"
          :value="getStatusLabel(vehicle.status)"
          :severity="getVehicleSeverity(vehicle.status)"
          rounded
          class="status-tag"
      />
    </div>

    <div v-if="!vehicle" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>{{ t('vehicleDetail.loading') }}</p>
    </div>

    <div v-else class="detail-grid">
      <Card class="hero-card">
        <template #content>
          <img
              :src="vehicleImage"
              :alt="`${vehicle.brand} ${vehicle.model}`"
              class="vehicle-photo"
          />

          <div class="hero-info">
            <div>
              <span class="plate-badge">{{ vehicle.plate }}</span>
              <h2>{{ vehicle.brand }} {{ vehicle.model }}</h2>
            </div>

            <div class="progress-block">
              <div class="progress-label">
                <span>{{ t('vehicleDetail.operationalProgress') }}</span>
                <strong>{{ progress }}%</strong>
              </div>
              <ProgressBar :value="progress" :showValue="false" class="main-progress" />
            </div>
          </div>
        </template>
      </Card>

      <div class="side-column">
        <Card class="info-card">
          <template #content>
            <h3>{{ t('vehicleDetail.owner') }}</h3>

            <div class="info-row">
              <span>{{ t('common.name') }}</span>
              <strong>{{ owner?.fullName || t('vehicleDetail.unassigned') }}</strong>
            </div>

            <div class="info-row">
              <span>{{ t('common.phone') }}</span>
              <strong>{{ owner?.phone || t('vehicleDetail.notRegistered') }}</strong>
            </div>

            <div class="info-row">
              <span>{{ t('common.email') }}</span>
              <strong>{{ owner?.email || t('vehicleDetail.notRegistered') }}</strong>
            </div>
          </template>
        </Card>

        <Card class="info-card">
          <template #content>
            <h3>{{ t('vehicleDetail.lastOrder') }}</h3>

            <div v-if="lastOrder">
              <div class="info-row">
                <span>{{ t('common.code') }}</span>
                <strong>{{ lastOrder.trackingCode }}</strong>
              </div>

              <div class="info-row">
                <span>{{ t('vehicleDetail.estimatedDelivery') }}</span>
                <strong>{{ lastOrder.estimatedDate || t('vehicleDetail.notDefined') }}</strong>
              </div>

              <Button
                  :label="t('vehicleDetail.viewOrder')"
                  icon="pi pi-arrow-right"
                  icon-pos="right"
                  outlined
                  class="order-button"
                  @click="goToOrder(lastOrder.id)"
              />
            </div>

            <p v-else class="muted">{{ t('vehicleDetail.noOrders') }}</p>
          </template>
        </Card>
      </div>

      <Card class="orders-card">
        <template #content>
          <div class="section-heading">
            <div>
              <h3>{{ t('vehicleDetail.relatedOrders') }}</h3>
              <p>{{ t('vehicleDetail.orderHistory') }}</p>
            </div>
          </div>

          <DataTable :value="relatedOrders" responsiveLayout="scroll" class="clean-table">
            <Column field="trackingCode" :header="t('common.code')" />

            <Column field="status" :header="t('common.status')">
              <template #body="slotProps">
                <Tag
                    :value="getStatusLabel(slotProps.data.status, 'workOrders.statusOptions')"
                    :severity="getVehicleSeverity(slotProps.data.status)"
                    rounded
                />
              </template>
            </Column>

            <Column field="startDate" :header="t('vehicleDetail.entryDate')" />
            <Column field="estimatedDate" :header="t('vehicleDetail.delivery')" />

            <Column :header="t('common.action')">
              <template #body="slotProps">
                <Button
                    icon="pi pi-search"
                    text
                    rounded
                    @click="goToOrder(slotProps.data.id)"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <Card class="tasks-card">
        <template #content>
          <div class="section-heading">
            <div>
              <h3>{{ t('vehicleDetail.relatedTasks') }}</h3>
              <p>{{ t('vehicleDetail.taskDescription') }}</p>
            </div>
          </div>

          <div v-if="relatedTasks.length" class="task-list">
            <div v-for="task in relatedTasks" :key="task.id" class="task-item">
              <div>
                <h4>{{ task.description }}</h4>
                <p>{{ t('vehicleDetail.orderLabel') }} #{{ task.workOrderId }}</p>
              </div>

              <Tag :value="getStatusLabel(task.status, 'taskStatus')" :severity="getTaskSeverity(task.status)" rounded />
            </div>
          </div>

          <div v-else class="mini-empty">
            {{ t('vehicleDetail.noTasks') }}
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>

<style scoped>
.vehicle-detail-page { min-height: 100%; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
.back-button { margin-bottom: 0.75rem; }
.eyebrow { display: block; margin-bottom: 0.5rem; color: #0b1680; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.detail-header h1 { margin: 0; color: #0f172a; font-size: clamp(2rem, 4vw, 2.7rem); line-height: 1.05; letter-spacing: -0.04em; }
.detail-header p { max-width: 680px; margin: 0.75rem 0 0; color: #64748b; }
.status-tag { margin-top: 1rem; }

.detail-grid { display: grid; grid-template-columns: 1.4fr 0.8fr; gap: 1.25rem; }
.hero-card, .info-card, .orders-card, .tasks-card { border-radius: 24px; border: 1px solid #e8edf5; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); }
.hero-card :deep(.p-card-content), .info-card :deep(.p-card-content), .orders-card :deep(.p-card-content), .tasks-card :deep(.p-card-content) { padding: 0; }

.vehicle-photo { width: 100%; height: 330px; object-fit: cover; border-radius: 20px; margin-bottom: 1.25rem; }
.hero-info { display: flex; justify-content: space-between; gap: 1rem; }
.plate-badge { display: inline-flex; margin-bottom: 0.5rem; padding: 0.3rem 0.7rem; border-radius: 999px; background: #eef2ff; color: #0b1680; font-size: 0.82rem; font-weight: 800; }
.hero-info h2 { margin: 0; color: #0f172a; }
.hero-info p { margin: 0.35rem 0 0; color: #64748b; }

.progress-block { min-width: 240px; }
.progress-label { display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #64748b; font-weight: 700; }
.progress-label strong { color: #0b1680; }
.main-progress { height: 10px; }

.side-column { display: flex; flex-direction: column; gap: 1.25rem; }
.info-card h3, .section-heading h3 { margin: 0 0 1rem; color: #0f172a; }
.info-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.8rem 0; border-bottom: 1px solid #eef2f7; }
.info-row span { color: #64748b; }
.info-row strong { color: #0f172a; text-align: right; }
.order-button { width: 100%; margin-top: 1rem; border-radius: 14px; }

.orders-card, .tasks-card { grid-column: span 2; }
.section-heading { margin-bottom: 1rem; }
.section-heading p { margin: 0.2rem 0 0; color: #64748b; }

.clean-table { overflow: hidden; border-radius: 16px; }
.task-list { display: grid; gap: 0.8rem; }
.task-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 1rem; border: 1px solid #edf2f7; border-radius: 18px; background: #f8fafc; }
.task-item h4 { margin: 0; color: #0f172a; }
.task-item p { margin: 0.25rem 0 0; color: #64748b; }

.empty-state, .mini-empty { display: grid; place-items: center; min-height: 220px; text-align: center; color: #64748b; border: 1px dashed #cbd5e1; border-radius: 24px; background: #ffffff; }
.empty-state i { color: #0b1680; font-size: 2rem; margin-bottom: 0.75rem; }
.muted { color: #64748b; }

@media (max-width: 1100px) {
  .detail-grid { grid-template-columns: 1fr; }
  .orders-card, .tasks-card { grid-column: span 1; }
  .hero-info { flex-direction: column; }
  .progress-block { min-width: 100%; }
}

@media (max-width: 768px) {
  .detail-header { flex-direction: column; }
  .vehicle-photo { height: 240px; }
  .info-row { flex-direction: column; }
  .info-row strong { text-align: left; }
}
</style>