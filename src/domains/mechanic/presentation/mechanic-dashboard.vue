<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../auth/application/auth.store';
import { useVehicleStore } from '../../fleet-management/application/vehicle.store';
import { useWorkOrderStore } from '../../workshop-operations/application/work-order.store';
import { useTaskStore } from '../../workshop-operations/application/task.store';

// ── CONSTANTS FOR DOMAIN LOGIC ───────────────────────────
/** Standardized system order states */
const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED'
};

/** Standardized system task states */
const TASK_STATUS = {
  COMPLETED: 'COMPLETED'
};

const { t } = useI18n();
const router = useRouter();

const authStore = useAuthStore();
const vehicleStore = useVehicleStore();
const workOrderStore = useWorkOrderStore();
const taskStore = useTaskStore();

onMounted(async () => {
  await Promise.all([
    vehicleStore.fetchVehicles(),
    workOrderStore.fetchWorkOrders(),
    taskStore.fetchAllTasks()
  ]);
});

const currentMechanic = computed(() => ({
  fullName: authStore.user?.email || 'Mechanic',
  specialty: 'Technician'
}));

const myOrders = computed(() =>
    workOrderStore.workOrders.filter(
        order =>
            String(order.mechanicId) === String(authStore.mechanicId)
    )
);

/** Filters assigned orders matching the standard pending status */
const pendingOrders = computed(() =>
    myOrders.value.filter(order =>
        order.status === ORDER_STATUS.PENDING
    ).length
);

/** Filters assigned orders matching the standard in progress status */
const inProgressOrders = computed(() =>
    myOrders.value.filter(order =>
        order.status === ORDER_STATUS.IN_PROGRESS
    ).length
);

/** Filters assigned orders matching the standard finished status */
const completedOrders = computed(() =>
    myOrders.value.filter(order =>
        order.status === ORDER_STATUS.FINISHED
    ).length
);

const getVehicleDetails = vehicleId => {
  const vehicle = vehicleStore.vehicles.find(
      v => String(v.id) === String(vehicleId)
  );

  if (!vehicle) return t('common.vehicle');

  return `${vehicle.brand} ${vehicle.model}`;
};

const getTaskCount = orderId => {
  return taskStore.tasks.filter(
      task => String(task.workOrderId) === String(orderId)
  ).length;
};
const getOrderTotal = orderId => {
  const tasks = taskStore.tasks.filter(
      task => String(task.workOrderId) === String(orderId)
  )

  return tasks.reduce(
      (sum, task) =>
          sum +
          Number(task.laborPrice || 0) +
          Number(task.materialsCost || 0),
      0
  );
};

/**
 * Maps system standard status codes to PrimeVue severity contexts
 * @param {string} status - Clean domain code status
 * @returns {string} Severity flavor string
 */
const getSeverity = status => {
  if (status === ORDER_STATUS.FINISHED) return 'success';
  if (status === ORDER_STATUS.IN_PROGRESS) return 'info';
  return 'warning';
};

/**
 * Resolves technical status codes to translation keys dynamically
 * @param {string} status - Clean domain code status
 * @returns {string} Translated interface string
 */
const getStatusLabel = status => {
  const key = String(status).toLowerCase();
  return t(`orderStatus.${key}`);
};

const goToOrder = orderId => {
  router.push(`/mechanic/order/${orderId}`);
};



const logout = () => {
  authStore.logout();
  router.push('/login');
};

/** Calculates tasks matching the global system completion code */
const getCompletedTasks = orderId => {
  return taskStore.tasks.filter(
      t =>
          String(t.workOrderId) === String(orderId) &&
          t.status === TASK_STATUS.COMPLETED
  ).length;
};

const getTotalTasks = orderId => {
  return taskStore.tasks.filter(
      t => String(t.workOrderId) === String(orderId)
  ).length;
};
/*const getTotalTasks = (task) => {
  const labor = Number(task.laborPrice || 0);

  const partsCost = (task.parts || []).reduce(
      (sum, part) =>
          sum +
          Number(part.unitPrice || 0) *
          Number(part.quantity || 1),
      0
  );

  return labor + partsCost;
};*/
const getTaskTotalCost = (task) => {
  const labor = Number(task.laborPrice || 0);

  const partsCost = (task.parts || []).reduce(
      (sum, part) =>
          sum +
          Number(part.unitPrice || 0) *
          Number(part.quantity || 1),
      0
  );

  return labor + partsCost;
};
const getProgress = orderId => {
  const total = getTotalTasks(orderId);
  if (!total) return 0;

  return Math.round(
      (getCompletedTasks(orderId) / total) * 100
  );
};
</script>

<template>
  <section class="mechanic-page">

    <header class="mechanic-header">

      <div>
        <span class="eyebrow">
          {{ t('mechanicDashboard.eyebrow') }}
        </span>

        <h1>
          {{ t('mechanicDashboard.title') }}
        </h1>

        <p>
          {{ t('mechanicDashboard.description') }}
        </p>
      </div>

      <Card class="profile-card">
        <template #content>

          <div class="profile-content">

            <Avatar
                icon="pi pi-user"
                size="large"
                shape="circle"
            />

            <div>
              <strong>
                {{ currentMechanic.fullName }}
              </strong>

              <span>
                {{ currentMechanic.specialty }}
              </span>

              <small>
                {{ t('mechanicDashboard.shiftActive') }}
              </small>
            </div>

          </div>

        </template>
      </Card>

    </header>

    <section class="summary-grid">

      <Card class="summary-card">
        <template #content>
          <span>{{ t('mechanicDashboard.pending') }}</span>
          <strong>{{ pendingOrders }}</strong>
        </template>
      </Card>

      <Card class="summary-card">
        <template #content>
          <span>{{ t('mechanicDashboard.inProgress') }}</span>
          <strong>{{ inProgressOrders }}</strong>
        </template>
      </Card>

      <Card class="summary-card">
        <template #content>
          <span>{{ t('mechanicDashboard.completed') }}</span>
          <strong>{{ completedOrders }}</strong>
        </template>
      </Card>

    </section>

    <Card class="orders-card">

      <template #content>

        <div class="section-header">
          <h2>{{ t('mechanicDashboard.assignedOrders') }}</h2>
        </div>

        <div v-if="myOrders.length" class="orders-grid">

          <article
              v-for="order in myOrders"
              :key="order.id"
              class="order-card"
          >

            <div class="order-top">

              <Tag
                  :value="order.trackingCode"
                  severity="secondary"
              />

              <Tag
                  :value="getStatusLabel(order.status)"
                  :severity="getSeverity(order.status)"
              />

            </div>

            <h3>
              {{ getVehicleDetails(order.vehicleId) }}
            </h3>

            <p class="description">
              {{ order.description }}
            </p>

            <div class="progress-block">

              <div class="progress-label">
                {{ getCompletedTasks(order.id) }}
                /
                {{ getTotalTasks(order.id) }}
                {{ t('mechanicDashboard.tasksCompletedLabel') }}
              </div>

              <ProgressBar
                  :value="getProgress(order.id)"
                  style="height:8px"
              />

            </div>

            <div class="order-metrics">

              <div>
                <small>{{ t('mechanicDashboard.tasks') }}</small>
                <strong>{{ getTaskCount(order.id) }}</strong>
              </div>

              <div>
                <small>{{ t('mechanicDashboard.labor') }}</small>
                <strong>S/ {{ getOrderTotal(order.id).toFixed(2) }}</strong>
              </div>

            </div>

            <Button
                :label="t('mechanicDashboard.viewOrder')"
                icon="pi pi-eye"
                fluid
                @click="goToOrder(order.id)"
            />

          </article>

        </div>

        <div v-else class="empty-state">
          {{ t('mechanicDashboard.empty') }}
        </div>

      </template>

    </Card>

    <Button
        :label="t('mechanicDashboard.logout')"
        icon="pi pi-sign-out"
        severity="danger"
        outlined
        class="logout-button"
        @click="logout"
    />

  </section>
</template>

<style scoped>
.mechanic-page{
  min-height:100vh;
  padding:2rem;
  background:#f8fafc;
}

.mechanic-header{
  display:grid;
  grid-template-columns:1fr 320px;
  gap:1.5rem;
  margin-bottom:1.5rem;
}

.eyebrow{
  color:#0b1680;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.08em;
}

.mechanic-header h1{
  margin:.4rem 0;
  font-size:3rem;
}

.mechanic-header p{
  color:#64748b;
}

.profile-card{
  border-radius:24px;
}

.profile-content{
  display:flex;
  gap:1rem;
  align-items:center;
}

.profile-content span{
  display:block;
  color:#64748b;
}

.profile-content small{
  color:#16a34a;
  font-weight:700;
}

.summary-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:1rem;
  margin-bottom:1.5rem;
}

.summary-card strong{
  display:block;
  margin-top:.5rem;
  font-size:2rem;
  color:#0b1680;
}

.orders-card{
  border-radius:24px;
}

.section-header{
  margin-bottom:1rem;
}

.orders-grid{
  display:grid;
  gap:1rem;
}

.order-card{
  border:1px solid #e2e8f0;
  border-radius:20px;
  padding:1rem;
  background:white;
}

.order-top{
  display:flex;
  justify-content:space-between;
  margin-bottom:1rem;
}

.order-card h3{
  margin:0 0 .5rem;
}

.description{
  color:#64748b;
}

.order-metrics{
  display:flex;
  justify-content:space-between;
  margin:1rem 0;
}

.order-metrics small{
  display:block;
  color:#64748b;
}

.order-metrics strong{
  font-size:1.1rem;
}

.empty-state{
  padding:2rem;
  text-align:center;
  color:#64748b;
}

.logout-button{
  position:fixed;
  right:2rem;
  bottom:2rem;
}

@media(max-width:900px){
  .mechanic-header{ grid-template-columns:1fr; }
  .summary-grid{ grid-template-columns:1fr; }
}

.progress-block{
  margin:1rem 0;
}

.progress-label{
  font-size:.85rem;
  color:#64748b;
  margin-bottom:.5rem;
}
</style>