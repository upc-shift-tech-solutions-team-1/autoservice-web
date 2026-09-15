<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCustomerStore } from '../../application/customer.store';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import CustomerForm from './customer-form.vue';

/**
 * Customer Management Component
 * Displays a table of customers with search, add, edit, and delete functionality.
 *
 * Features:
 * - Fetches customers from the store on mount
 * - Provides search filtering
 * - Opens modals for add/edit and delete confirmation
 */
const { t } = useI18n();
const store = useCustomerStore();

const showFormModal = ref(false);
const showDeleteModal = ref(false);
const editMode = ref(false);
const selectedCustomerId = ref(null);
const customerForm = ref({ fullName: '', dni: '', email: '', phone: '' });
const searchTerm = ref('');

const filteredCustomers = computed(() => {
  if (!searchTerm.value) return store.customers;
  const search = searchTerm.value.toLowerCase();
  return store.customers.filter(customer =>
      customer.fullName.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      customer.dni.toLowerCase().includes(search) ||
      customer.phone.toLowerCase().includes(search)
  );
});

onMounted(() => { store.fetchCustomers(); });

const openAddModal = () => {
  editMode.value = false;
  customerForm.value = { fullName: '', dni: '', email: '', phone: '' };
  showFormModal.value = true;
};

const openEditModal = (customer) => {
  editMode.value = true;
  selectedCustomerId.value = customer.id;
  customerForm.value = { ...customer };
  showFormModal.value = true;
};

const saveCustomer = async () => {
  try {
    if (editMode.value) {
      await store.updateCustomer(selectedCustomerId.value, customerForm.value);
    } else {
      await store.addCustomer(customerForm.value);
    }
    showFormModal.value = false;
  } catch (error) {
    alert(t('customers.errors.createError'));
  }
};

const openDeleteModal = (customer) => {
  selectedCustomerId.value = customer.id;
  customerForm.value = customer;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  try {
    await store.deleteCustomer(selectedCustomerId.value);
    showDeleteModal.value = false;
  } catch (error) {
    alert(t('customers.errors.deleteError'));
  }
};
</script>

<template>
  <div class="customer-management">
    <div class="top-section">
      <div class="customer-header">
        <div>
          <span class="eyebrow">{{ t('customers.eyebrow') }}</span>
          <h1>{{ t('customers.title') }}</h1>
          <p>{{ t('customers.description') }}</p>
        </div>
      </div>

      <Button
          :label="t('customers.registerButton')"
          icon="pi pi-plus"
          class="add-btn"
          @click="openAddModal"
      />
    </div>

    <div class="search-container">
      <i class="pi pi-search"></i>
      <InputText v-model="searchTerm" :placeholder="t('customers.search')" />
    </div>

    <div class="table-wrapper">
      <DataTable :value="filteredCustomers" responsiveLayout="scroll">
        <Column field="fullName" :header="t('customers.columns.fullName')" />
        <Column field="dni" :header="t('customers.columns.dni')" />
        <Column field="email" :header="t('customers.columns.email')" />
        <Column field="phone" :header="t('customers.columns.phone')" />
        <Column :header="t('customers.columns.actions')">
          <template #body="slotProps">
            <div class="actions">
              <Button icon="pi pi-pencil" severity="contrast" outlined rounded @click="openEditModal(slotProps.data)" />
              <Button icon="pi pi-trash" severity="danger" outlined rounded @click="openDeleteModal(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <CustomerForm
        v-model:visible="showFormModal"
        :editMode="editMode"
        :form="customerForm"
        @save="saveCustomer"
    />

    <Dialog v-model:visible="showDeleteModal" modal :style="{ width: '28rem' }" :draggable="false">
      <div class="delete-container">
        <div class="delete-icon">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <h2>{{ t('customers.delete.title') }}</h2>
        <p>{{ t('customers.delete.description') }}</p>
        <strong>{{ customerForm.fullName }}</strong>
        <div class="delete-actions">
          <Button :label="t('customers.delete.cancel')" severity="secondary" outlined @click="showDeleteModal = false" />
          <Button :label="t('customers.delete.confirm')" severity="danger" @click="confirmDelete" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.customer-management { min-height: 100vh; }
.top-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
.customer-header { display: flex; flex-direction: column; }
.eyebrow { display: inline-flex; margin-bottom: 0.5rem; color: #0b1680; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.customer-header h1 { margin: 0; color: #0f172a; font-size: clamp(2rem,4vw,2.7rem); line-height: 1.05; letter-spacing: -0.04em; }
.customer-header p { max-width: 620px; margin: 0.75rem 0 0; color: #64748b; }
.add-btn { background: #0b1680; border-color: #0b1680; border-radius: 14px; padding: 0.8rem 1.5rem; }
.search-container { background: white; padding: 1rem; border-radius: 16px; display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; border: 1px solid #e8edf5;}
.search-container i { color: #9ca3af; }
.search-container :deep(.p-inputtext) { border: none; box-shadow: none; width: 100%; padding: 0; }
.table-wrapper { background: white; padding: 1rem; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,.03); border: 1px solid #e8edf5;}
.actions { display: flex; gap: .5rem; }
.delete-container { text-align: center; padding: 1rem; }
.delete-icon { width: 70px; height: 70px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: auto; font-size: 2rem; margin-bottom: 1rem; }
.delete-actions { display: flex; justify-content: center; gap: 1rem; margin-top: 2rem; }

@media (max-width: 768px) {
  .top-section { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
  .add-btn { width: 100%; justify-content: center; }
  .delete-actions { flex-direction: column; gap: 0.8rem; }
}
</style>
