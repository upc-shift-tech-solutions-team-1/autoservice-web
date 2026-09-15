<script setup>
/**
 * Vehicles List Page
 * Handles listing, filtering, creation and edition of vehicles.
 */

import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { useVehicleStore } from '../application/vehicle.store';
import { useCustomerStore } from '../../customer-management/application/customer.store';
import { useWorkOrderStore } from '../../workshop-operations/application/work-order.store';
import { useTaskStore } from '../../workshop-operations/application/task.store';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';

import VehicleFilters from './components/VehicleFilters.vue';
import VehicleCard from './components/VehicleCard.vue';

// ── CONSTANTS FOR DOMAIN LOGIC ───────────────────────────
const VEHICLE_STATUS = {
  IN_WORKSHOP: 'IN_WORKSHOP',
  READY: 'READY',
  DELIVERED: 'DELIVERED'
};

const ORDER_STATUS = {
  FINISHED: 'FINISHED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

const REVIEW_STATUS = {
  APPROVED: 'APPROVED'
};

const { t } = useI18n();
const router = useRouter();

const vehicleStore = useVehicleStore();
const customerStore = useCustomerStore();
const workOrderStore = useWorkOrderStore();
const taskStore = useTaskStore();

const vehicleDialog = ref(false);
const vehicle = ref({});
const search = ref('');
const selectedStatus = ref(null);
const selectedSort = ref(null);

/**
 * Status filter options mapped to standardized constants
 */
const statusOptions = computed(() => [
  { label: t('vehicles.statusOptions.in_workshop'), value: VEHICLE_STATUS.IN_WORKSHOP },
  { label: t('vehicles.statusOptions.ready'), value: VEHICLE_STATUS.READY },
  { label: t('vehicles.statusOptions.delivered'), value: VEHICLE_STATUS.DELIVERED }
]);

/**
 * Sort options (i18n)
 */
const sortOptions = computed(() => [
  { label: t('vehicles.sortOptions.progressDesc'), value: 'progress-desc' },
  { label: t('vehicles.sortOptions.progressAsc'), value: 'progress-asc' }
]);

const carImages = [
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop'
];

onMounted(async () => {
  try {
    await customerStore.fetchCustomers();
    await vehicleStore.fetchVehicles();
    await workOrderStore.fetchWorkOrders();
    await taskStore.fetchAllTasks();
  } catch (error) {
    console.error(error);
  }
});

/**
 * Get customer name by id
 * @param {string|number} id
 */
const getCustomerName = (id) => {
  const customer = customerStore.customers.find((c) => String(c.id) === String(id));
  return customer ? customer.fullName : t('common.noAssigned');
};

/**
 * Get severity by vehicle status using constants
 * @param {string} status
 */
const getSeverity = (status) => {
  switch (status) {
    case VEHICLE_STATUS.IN_WORKSHOP: return 'info';
    case VEHICLE_STATUS.READY: return 'success';
    case VEHICLE_STATUS.DELIVERED: return 'secondary';
    default: return 'warning';
  }
};

/**
 * Resolves technical status codes to translation keys dynamically
 */
const getStatusLabel = (status) => {
  const key = String(status).toLowerCase();
  return t(`vehicles.statusOptions.${key}`);
};

/**
 * Calculate progress per vehicle using standardized codes
 * @param {string|number} vehicleId
 * @param {string} status
 */
const getProgress = (vehicleId, status) => {
  if ([VEHICLE_STATUS.READY, VEHICLE_STATUS.DELIVERED].includes(status)) return 100;

  const activeOrder = workOrderStore.workOrders.find(
      o =>
          String(o.vehicleId) === String(vehicleId) &&
          ![ORDER_STATUS.FINISHED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(o.status)
  );

  if (!activeOrder) return 0;

  const orderTasks = taskStore.tasks.filter(
      t => String(t.workOrderId) === String(activeOrder.id)
  );

  if (!orderTasks.length) return 0;

  const approvedTasks = orderTasks.filter(
      t => t.adminReviewStatus === REVIEW_STATUS.APPROVED
  ).length;

  return Math.round((approvedTasks / orderTasks.length) * 100);
};

/**
 * Vehicles mapped for UI
 */
const vehiclesView = computed(() =>
    vehicleStore.vehicles.map((item, index) => ({
      id: item.id,
      raw: item,
      name: `${item.brand} ${item.model || ''}`,
      plate: item.plate,
      owner: getCustomerName(item.customerId),
      status: getStatusLabel(item.status || VEHICLE_STATUS.IN_WORKSHOP),
      rawStatus: item.status,
      severity: getSeverity(item.status),
      progress: getProgress(item.id, item.status),
      year: item.year || 'N/A',
      color: item.color || 'N/A',
      image: item.image || carImages[index % carImages.length]
    }))
);

/**
 * Filtered and sorted vehicles
 */
const filteredVehicles = computed(() => {
  const term = search.value.toLowerCase().trim();

  let result = vehiclesView.value.filter((item) => {
    const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.plate.toLowerCase().includes(term) ||
        item.owner.toLowerCase().includes(term);

    const matchesStatus =
        !selectedStatus.value || item.rawStatus === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });

  if (selectedSort.value === 'progress-desc') {
    result.sort((a, b) => b.progress - a.progress);
  } else if (selectedSort.value === 'progress-asc') {
    result.sort((a, b) => a.progress - b.progress);
  }

  return result;
});

/**
 * Open create vehicle dialog with clean code
 */
const openNew = () => {
  vehicle.value = {
    status: VEHICLE_STATUS.IN_WORKSHOP,
    plate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    image: '',
    imageFile: null,
    customerId: null
  };
  vehicleDialog.value = true;
};

const hideDialog = () => {
  vehicleDialog.value = false;
};

/**
 * Open edit vehicle dialog
 */
const editVehicle = (selectedVehicle) => {
  vehicle.value = { ...selectedVehicle, imageFile: null };
  vehicleDialog.value = true;
};

/**
 * Save vehicle (create or update)
 */
const saveVehicle = async () => {
  try {
    if (vehicle.value.plate && vehicle.value.customerId) {
      if (vehicle.value.id) {
        await vehicleStore.updateVehicle(vehicle.value.id, vehicle.value);
      } else {
        await vehicleStore.addVehicle(vehicle.value);
      }

      vehicleDialog.value = false;
      vehicle.value = {};
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * Handle image upload
 */
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  vehicle.value.imageFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    vehicle.value.image = reader.result;
  };
  reader.readAsDataURL(file);
};

/**
 * Navigate to vehicle detail
 */
const viewVehicleDetail = (selectedVehicle) => {
  router.push(`/vehicles/${selectedVehicle.id}`);
};

/** Count active vehicles based on standard status */
const activeVehicleCount = computed(() => {
  return vehicleStore.vehicles.filter(v => v.status === VEHICLE_STATUS.IN_WORKSHOP).length;
});

const readyVehicleCount = computed(() => {
  return vehicleStore.vehicles.filter(v => v.status === VEHICLE_STATUS.READY).length;
});
</script>

<template>
  <section class="vehicle-page">
    <div class="vehicle-header">
      <div>
        <span class="eyebrow">{{ t('vehicles.eyebrow') }}</span>
        <h1>{{ t('vehicles.title') }}</h1>
        <p>{{ t('vehicles.description') }}</p>
      </div>

      <Button
          :label="t('vehicles.addButton')"
          icon="pi pi-plus"
          class="add-button"
          @click="openNew"
      />
    </div>

    <div class="summary-row">
      <div class="summary-card">
        <span>{{ t('vehicles.summary.total') }}</span>
        <strong>{{ vehicleStore.vehicles.length }}</strong>
      </div>

      <div class="summary-card">
        <span>{{ t('vehicles.summary.inWorkshop') }}</span>
        <strong>{{ activeVehicleCount }}</strong>
      </div>

      <div class="summary-card">
        <span>{{ t('vehicles.summary.ready') }}</span>
        <strong>{{ readyVehicleCount }}</strong>
      </div>
    </div>

    <VehicleFilters
        v-model:search="search"
        v-model:status="selectedStatus"
        v-model:sortBy="selectedSort"
        :status-options="statusOptions"
        :sort-options="sortOptions"
    />

    <div v-if="vehicleStore.loading" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>{{ t('vehicles.loading') }}</p>
    </div>

    <div v-else-if="filteredVehicles.length" class="vehicles-grid">
      <VehicleCard
          v-for="item in filteredVehicles"
          :key="item.id"
          :vehicle="item"
          @edit="editVehicle"
          @view-detail="viewVehicleDetail"
      />
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-car"></i>
      <h3>{{ t('vehicles.empty.title') }}</h3>
      <p>{{ t('vehicles.empty.description') }}</p>
    </div>

    <Dialog
        v-model:visible="vehicleDialog"
        :header="vehicle.id ? t('vehicles.form.editTitle') : t('vehicles.form.newTitle')"
        modal
        class="vehicle-dialog p-fluid"
    >
      <div class="vehicle-form">
        <div class="field">
          <label for="customer">
            {{ t('vehicles.form.owner') }} <span class="required">*</span>
          </label>

          <Select
              id="customer"
              v-model="vehicle.customerId"
              :options="customerStore.customers"
              optionLabel="fullName"
              optionValue="id"
              :placeholder="t('vehicles.form.selectCustomer')"
              filter
              class="custom-input"
          />
        </div>

        <div class="double-grid">
          <div class="field">
            <label for="plate">
              {{ t('vehicles.form.plate') }} <span class="required">*</span>
            </label>
            <InputText id="plate" v-model.trim="vehicle.plate" class="custom-input" />
          </div>

          <div class="field">
            <label for="status">{{ t('vehicles.form.status') }}</label>

            <Select
                id="status"
                v-model="vehicle.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('vehicles.form.status')"
                class="custom-input"
            />
          </div>
        </div>

        <div class="field">
          <label>{{ t('vehicles.form.image') }}</label>

          <div class="file-upload-container">
            <label for="file-upload" class="file-upload-btn">
              <i class="pi pi-upload"></i>
              {{ t('vehicles.form.selectImage') }}
            </label>

            <input
                id="file-upload"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="hidden-input"
            />

            <div v-if="vehicle.image" class="preview-box">
              <img :src="vehicle.image" alt="preview" />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
            :label="t('vehicles.form.cancel')"
            text
            severity="secondary"
            @click="hideDialog"
        />

        <Button
            :label="t('vehicles.form.save')"
            icon="pi pi-check"
            class="save-btn"
            @click="saveVehicle"
        />
      </template>
    </Dialog>
  </section>
</template>

<style scoped>
.vehicle-page { min-height: 100%; }
.vehicle-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; margin-bottom: 1.5rem; }
.eyebrow { display: inline-flex; margin-bottom: 0.5rem; color: #0b1680; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.vehicle-header h1 { margin: 0; color: #0f172a; font-size: clamp(2rem,4vw,2.7rem); line-height: 1.05; letter-spacing: -0.04em; }
.vehicle-header p { max-width: 620px; margin: 0.75rem 0 0; color: #64748b; }
.add-button { background: #0b1680; border-color: #0b1680; border-radius: 14px; padding: 0.8rem 1.5rem; }

.summary-row { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.summary-card { padding: 1rem 1.2rem; border: 1px solid #e8edf5; border-radius: 20px; background: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,.03); }
.summary-card span { display: block; color: #64748b; font-weight: 700; }
.summary-card strong { display: block; margin-top: 0.25rem; color: #0b1680; font-size: 1.8rem; }

.vehicles-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }

.empty-state { display: grid; place-items: center; min-height: 260px; text-align: center; color: #64748b; border: 1px dashed #cbd5e1; border-radius: 24px; background: #ffffff; }
.empty-state i { color: #0b1680; font-size: 2.5rem; margin-bottom: 0.75rem; }
.empty-state h3 { margin: 0; color: #0f172a; }

.vehicle-dialog { border-radius: 24px; overflow: hidden; }
.vehicle-form { display: flex; flex-direction: column; gap: 1.2rem; margin-top: 0.5rem; }
.double-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
.field { display: flex; flex-direction: column; gap: 0.5rem; }
.field label { font-size: 0.85rem; font-weight: 700; color: #374151; }
.required { color: #ef4444; }
.custom-input { border-radius: 12px; }

.file-upload-container { display: flex; flex-direction: column; gap: 1rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 1.5rem; align-items: center; }
.hidden-input { display: none; }
.file-upload-btn { background: #eef2ff; color: #0b1680; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
.file-upload-btn:hover { background: #e0e7ff; }
.preview-box { width: 100%; max-height: 200px; border-radius: 12px; overflow: hidden; display: flex; justify-content: center; }
.preview-box img { width: 100%; height: 100%; object-fit: cover; }

.save-btn { background: #0b1680 !important; border: none !important; border-radius: 12px !important; }

@media (max-width: 1200px) { .vehicles-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 768px) {
  .vehicle-header { flex-direction: column; }
  .add-button { width: 100%; justify-content: center; }
  .summary-row, .vehicles-grid, .double-grid { grid-template-columns: 1fr; }
}
</style>