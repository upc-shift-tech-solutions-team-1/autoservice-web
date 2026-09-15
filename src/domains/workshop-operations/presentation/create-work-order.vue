<script setup>
/**
 * @file CreateWorkOrderPage.vue
 * @description Work order creation page.
 */

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Card from 'primevue/card';
import DatePicker from 'primevue/datepicker';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';

import { useCustomerStore } from '../../customer-management/application/customer.store';
import { useVehicleStore } from '../../fleet-management/application/vehicle.store';
import { useMechanicStore } from '../../staff-coordination/application/mechanic.store';
import { useWorkOrderStore } from '../application/work-order.store';

const { t } = useI18n();

const router = useRouter();

const vehicleStore = useVehicleStore();
const customerStore = useCustomerStore();
const mechanicStore = useMechanicStore();
const workOrderStore = useWorkOrderStore();

const form = ref({
  customerId: null,
  vehicleId: null,
  mechanicId: null,
  estimatedDate: null,
  description: ''
});

const autoCustomerName = ref('');

/**
 * Loads initial data.
 */
onMounted(async () => {
  await customerStore.fetchCustomers();
  await vehicleStore.fetchVehicles();
  await mechanicStore.fetchMechanics();
});

/**
 * Updates customer automatically
 * when vehicle changes.
 */
const handleVehicleChange = () => {
  const selectedVehicle =
      vehicleStore.vehicles.find(
          (vehicle) =>
              vehicle.id === form.value.vehicleId
      );

  if (!selectedVehicle) {
    form.value.customerId = null;
    autoCustomerName.value = '';

    return;
  }

  form.value.customerId =
      selectedVehicle.customerId;

  const customer =
      customerStore.customers.find(
          (item) =>
              String(item.id) ===
              String(selectedVehicle.customerId)
      );

  autoCustomerName.value = customer
      ? customer.fullName
      : t('workOrders.create.customerNotFound');
};

/**
 * Saves work order.
 */
const saveOrder = async () => {
  if (
      !form.value.customerId ||
      !form.value.vehicleId ||
      !form.value.mechanicId
  ) {
    return;
  }

  try {
    await workOrderStore.addWorkOrder(
        form.value
    );

    router.push('/work-orders');
  } catch (error) {
    console.error(error);
  }
};

/**
 * Cancels creation process.
 */
const cancel = () => {
  router.push('/work-orders');
};
</script>

<template>
  <div class="create-wo-container">
    <div class="header-section">
      <h1>
        {{ t('workOrders.create.title') }}
      </h1>

      <p>
        {{
          t(
              'workOrders.create.description'
          )
        }}
      </p>
    </div>

    <Card class="form-card">
      <template #content>
        <div class="form-grid">
          <div class="field">
            <label>
              {{
                t(
                    'workOrders.create.vehicle'
                )
              }}
            </label>

            <Select
                v-model="form.vehicleId"
                :options="vehicleStore.vehicles"
                optionLabel="plate"
                optionValue="id"
                filter
                :placeholder="
                t(
                  'workOrders.create.vehiclePlaceholder'
                )
              "
                class="w-full"
                @change="handleVehicleChange"
            />
          </div>

          <div class="field">
            <label>
              {{
                t(
                    'workOrders.create.customer'
                )
              }}
            </label>

            <InputText
                v-model="autoCustomerName"
                disabled
                class="w-full locked-input"
                :placeholder="
                t(
                  'workOrders.create.customerPlaceholder'
                )
              "
            />
          </div>

          <div class="field">
            <label>
              {{
                t(
                    'workOrders.create.mechanic'
                )
              }}
            </label>

            <Select
                v-model="form.mechanicId"
                :options="mechanicStore.mechanics"
                optionLabel="fullName"
                optionValue="id"
                :placeholder="
                t(
                  'workOrders.create.mechanicPlaceholder'
                )
              "
                class="w-full"
            />
          </div>

          <div class="field">
            <label>
              {{
                t(
                    'workOrders.create.estimatedDate'
                )
              }}
            </label>

            <DatePicker
                v-model="form.estimatedDate"
                dateFormat="dd/mm/yy"
                showIcon
                class="w-full"
                :placeholder="
                t(
                  'workOrders.create.datePlaceholder'
                )
              "
            />
          </div>

          <div
              class="field full-width mt-3"
          >
            <label>
              {{
                t(
                    'workOrders.create.problemDescription'
                )
              }}
            </label>

            <Textarea
                v-model="form.description"
                rows="4"
                class="w-full"
                :placeholder="
                t(
                  'workOrders.create.problemPlaceholder'
                )
              "
            />
          </div>
        </div>

        <div class="actions">
          <Button
              :label="t('actions.cancel')"
              severity="secondary"
              text
              @click="cancel"
          />

          <Button
              :label="
              t(
                'workOrders.create.createButton'
              )
            "
              icon="pi pi-check"
              class="primary-btn"
              :loading="
              workOrderStore.loading
            "
              @click="saveOrder"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.create-wo-container {
  max-width: 800px;
  padding: 2rem;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 2rem;
}

.header-section h1 {
  margin: 0;
  font-size: 2rem;
  color: #0f172a;
}

.header-section p {
  margin-top: 0.5rem;
  color: #64748b;
}

.form-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.full-width {
  grid-column: 1 / -1;
}

.locked-input {
  opacity: 1 !important;
  color: #64748b !important;
  background-color: #f1f5f9 !important;
  border-color: #e2e8f0 !important;
}

.mt-3 {
  margin-top: 1rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  margin-top: 2.5rem;
  border-top: 1px solid #e2e8f0;
}

.primary-btn {
  background: #0b1680;
  border: none;
}
</style>