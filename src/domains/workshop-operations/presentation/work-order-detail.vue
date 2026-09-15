<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Message from 'primevue/message';
import Tag from 'primevue/tag';

import { useAuthStore } from '../../auth/application/auth.store';
import { useMechanicStore } from '../../staff-coordination/application/mechanic.store';
import { useTaskStore } from '../application/task.store';
import { useWorkOrderStore } from '../application/work-order.store';
import TaskDialog from './components/tasks/TaskDialog.vue';
import { useCustomerStore} from "../../customer-management/application/customer.store.js";
import { useVehicleStore} from "../../fleet-management/application/vehicle.store.js";
import {Menu} from "primevue";

const shareMenu = ref(null);

const shareItems = ref([
  {label: 'Guardar orden como PDF', icon: 'pi pi-file-pdf', command: () => exportToPDF()},
  {label: 'Guardar informe como PDF', icon: 'pi pi-file-pdf', command: () => exportToPDF(true) // true = informe detallado
  },
  { separator: true },
  {label: 'Enviar orden por correo', icon: 'pi pi-envelope', command: () => sendByEmail()},
  {label: 'Enviar informe por correo', icon: 'pi pi-envelope', command: () => sendByEmail(true)},
  { separator: true },
  {label: 'Notificar por WhatsApp', icon: 'pi pi-whatsapp', command: () => shareByWhatsApp()}
]);

const toggleShareMenu = (event) => {
  shareMenu.value.toggle(event);
};

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const workOrderStore = useWorkOrderStore();
const taskStore = useTaskStore();
const mechanicStore = useMechanicStore();
const authStore = useAuthStore();
const customerStore = useCustomerStore();
const vehicleStore = useVehicleStore();

const orderId = route.params.id;
const taskDialogVisible = ref(false);

const isMechanic = computed(() => authStore.userRole === 'mechanic');

const currentOrder = computed(() =>
    workOrderStore.workOrders.find(order => String(order.id) === String(orderId)) || null
);

const orderTasks = computed(() =>
    taskStore.tasks.filter(task => String(task.workOrderId) === String(orderId))
);
/*const calculatedTotal = computed(() => {
  let total = 0;
  orderTasks.value.forEach(task => {
    const labor = parseFloat(task.laborPrice || 0);
    const partsTotal = (task.parts || []).reduce((sum, p) => sum + (parseFloat(p.unitPrice || 0) * parseInt(p.quantity || 1)), 0);
    total += labor + partsTotal;
  });
  console.log(orderTasks.value);
  return total.toFixed(2);
});*/
const calculatedTotal = computed(() => {
  let total = 0;

  orderTasks.value.forEach(task => {
    total +=
        Number(task.laborPrice || 0) +
        Number(task.materialsCost || 0);
  });

  return total.toFixed(2);
});


const loadData = async () => {
  await Promise.all([
    workOrderStore.fetchWorkOrders(),
    taskStore.fetchAllTasks(),
    mechanicStore.fetchMechanics(),
      vehicleStore.fetchVehicles(),
      customerStore.fetchCustomers()
  ]);
};

onMounted(() => loadData());

const openTaskDialog = () => { taskDialogVisible.value = true; };

const handleTaskSave = async (taskData) => {
  taskDialogVisible.value = false;
  await taskStore.addTask({
    ...taskData,
    workOrderId: parseInt(orderId, 10),
    mechanicId: parseInt(currentOrder.value.mechanicId, 10),
    estimatedTime: parseFloat(taskData.estimatedTime || 0),
    laborPrice: parseFloat(taskData.laborPrice || 0)
  });
  await workOrderStore.updateOrderAutoPrice(orderId, calculatedTotal.value);
};

const deliverOrder = async () => {
  if (!currentOrder.value) return;
  await workOrderStore.updateWorkOrderChecklist(orderId, {
    ...currentOrder.value,
    status: 'DELIVERED'
  });
  await workOrderStore.fetchWorkOrders();
};

const goBack = () => {
  if (isMechanic.value) {
    router.push('/mechanic/workspace');
    return;
  }
  router.push('/work-orders');
};
const printOrder = () => {
  const order = currentOrder.value;
  if (!order) return;

  // Buscar vehículo y cliente relacionados
  const vehicle = vehicleStore.vehicles.find(v =>
      String(v.id) === String(order.vehicleId)
  ) || {};

  const customer = customerStore.customers.find(c =>
      String(c.id) === String(order.customerId || vehicle.customerId)
  ) || {};

  const tasks = orderTasks.value;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Orden de Trabajo #${order.trackingCode || order.id}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 4px solid #0b1680; padding-bottom: 20px; }
        .logo { font-size: 32px; font-weight: bold; color: #0b1680; margin: 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin: 25px 0; }
        .info-box { background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #0b1680; color: white; }
        .total-row { font-size: 1.4em; font-weight: bold; background-color: #f0f4ff; text-align: right; padding: 15px; }
        .footer { margin-top: 60px; text-align: center; font-size: 0.9em; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">AutoService AW</div>
        <h2>Orden de Trabajo #${order.trackingCode || order.id}</h2>
        <p>Fecha: ${new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</p>
      </div>

      <div class="info-grid">
        <!-- Cliente -->
        <div class="info-box">
          <h3>Cliente</h3>
          <p><strong>Nombre:</strong> ${customer.fullName || 'No registrado'}</p>
          <p><strong>DNI:</strong> ${customer.dni || 'N/A'}</p>
          <p><strong>Teléfono:</strong> ${customer.phone || 'N/A'}</p>
          <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
        </div>

        <!-- Vehículo -->
        <div class="info-box">
          <h3>Vehículo</h3>
          <p><strong>Placa:</strong> ${vehicle.plate || 'N/A'}</p>
          <p><strong>Marca / Modelo:</strong> ${vehicle.brand || ''} ${vehicle.model || ''}</p>
          <p><strong>Año:</strong> ${vehicle.year || 'N/A'}</p>
          <p><strong>Color:</strong> ${vehicle.color || 'N/A'}</p>
        </div>
      </div>

      <h3>Descripción del Problema</h3>
      <p style="background:#f9fafb; padding:18px; border-radius:6px; border-left:4px solid #0b1680;">
        ${order.description || 'Sin descripción registrada.'}
      </p>

      <h3>Tareas / Servicios</h3>
      <table>
        <thead>
          <tr>
            <th>Tarea</th>
            <th>Estado</th>
            <th>Mano de Obra</th>
            <th>Materiales</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(task => `
            <tr>
              <td>${task.description || ''}</td>
              <td>${task.status === 'COMPLETED' ? '✅ Completado' : '⏳ Pendiente'}</td>
              <td>S/. ${Number(task.laborPrice || 0).toFixed(2)}</td>
              <td>S/. ${Number(task.materialsCost || 0).toFixed(2)}</td>
              <td><strong>S/. ${(Number(task.laborPrice || 0) + Number(task.materialsCost || 0)).toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-row">
        <strong>Total a Pagar: S/. ${calculatedTotal.value}</strong>
      </div>

      <div class="footer">
        Gracias por confiar en <strong>AutoService AW</strong><br>
        Este documento es una copia impresa oficial de la orden de trabajo.
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  setTimeout(() => printWindow.print(), 700);
};
const exportToPDF = (isReport = false) => {
  printOrder();
};

const sendByEmail = (isReport = false) => {
  const order = currentOrder.value;
  alert(`Se abrirá el cliente de correo para enviar la orden #${order.trackingCode || order.id}`);
};

const shareByWhatsApp = () => {
  const order = currentOrder.value;
  const message = `Orden de Trabajo #${order.trackingCode || order.id} - Total: S/. ${calculatedTotal.value}`;
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
</script>

<template>
  <div v-if="currentOrder" class="detail-container">
    <div class="header-actions">
      <Button icon="pi pi-arrow-left" text :label="t('workOrderDetail.actions.back')" @click="goBack" />

      <h2>{{ t('workOrderDetail.title', { code: currentOrder.trackingCode || currentOrder.id }) }}</h2>
      <div class="actions-right">
        <Button
            icon="pi pi-print"
            :label="t('workOrderDetail.actions.print')"
            class="p-button-outlined mr-2"
            @click="printOrder" />

        <Button
            icon="pi pi-share-alt"
            :label="t('workOrderDetail.actions.share')"
            class="p-button-outlined"
            @click="toggleShareMenu($event)" />
      </div>
    </div>
    <Menu ref="shareMenu" :model="shareItems" :popup="true" />

    <div class="layout-grid">
      <div class="main-column">
        <Card class="info-card">
          <template #title>{{ t('workOrderDetail.initialDescription') }}</template>
          <template #content><p>{{ currentOrder.description }}</p></template>
        </Card>

        <Card class="tasks-card mt-4">
          <template #title>
            <div class="flex justify-content-between align-items-center">
              <span>{{ t('workOrderDetail.tasks.title') }}</span>
              <Button v-if="isMechanic" :label="t('workOrderDetail.tasks.addTask')" icon="pi pi-plus" size="small" class="p-button-outlined" @click="openTaskDialog" />
            </div>
          </template>
          <template #content>
            <DataTable :value="orderTasks" :empty-message="t('workOrderDetail.tasks.empty')">

              <Column field="description" :header="t('workOrderDetail.tasks.columns.task')" />

              <Column field="status" :header="t('workOrderDetail.tasks.columns.status')">
                <template #body="slotProps">
                  <Tag
                      :value="$t(`taskStatus.${(slotProps.data.status || 'pending').toLowerCase()}`)"
                      :severity="slotProps.data.status === 'COMPLETED' ? 'success' : 'warning'"
                  />
                </template>
              </Column>

              <Column :header="t('workOrderDetail.tasks.columns.materials')">
                <template #body="slotProps">
                  <div v-if="slotProps.data.parts && slotProps.data.parts.length > 0" class="materials-list">
                    <div v-for="(p, i) in slotProps.data.parts" :key="i" class="material-item">
                      {{ p.quantity }}x {{ p.name }} <span class="material-price">(S/. {{ ((p.unitPrice || 0) * (p.quantity || 1)).toFixed(2) }})</span>
                    </div>
                  </div>
                  <span v-else class="text-gray">{{ t('workOrderDetail.tasks.noMaterials') }}</span>
                </template>
              </Column>

              <Column field="laborPrice" :header="t('workOrderDetail.tasks.columns.labor')">
                <template #body="slotProps">
                  <span class="font-bold">S/. {{ slotProps.data.laborPrice }}</span>
                </template>
              </Column>
              <Column
                  field="materialsCost"
                  header="Materiales">
                <template #body="slotProps">
                  <span class="font-bold">S/. {{ Number(slotProps.data.materialsCost || 0).toFixed(2) }}</span>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>

      <div class="side-column">
        <Card class="price-card">
          <template #title>{{ t('workOrderDetail.quote.title') }}</template>
          <template #content>
            <div class="total-display">
              <span>S/. {{ calculatedTotal }}</span>
            </div>

            <div v-if="!isMechanic && currentOrder.status === 'FINISHED'" class="admin-validation mt-4">
              <Message severity="success" :closable="false" class="mb-3">
                {{ t('workOrderDetail.validation.readyMessage') }}
              </Message>
              <Button
                  :label="t('workOrderDetail.validation.deliverButton')"
                  icon="pi pi-check-square"
                  severity="success"
                  class="w-full"
                  @click="deliverOrder"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <TaskDialog v-if="isMechanic" v-model:visible="taskDialogVisible" :work-order-options="[currentOrder]" :mechanic-options="mechanicStore.mechanics" @save="handleTaskSave" @cancel="taskDialogVisible = false" />
  </div>
</template>

<style scoped>
.detail-container { padding: 2rem; }
.header-actions { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.header-actions h2 { margin: 0; }
.layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
.mt-4 { margin-top: 1.5rem; }
.mb-3 { margin-bottom: 1rem; }
.flex { display: flex; }
.justify-content-between { justify-content: space-between; }
.align-items-center { align-items: center; }

.materials-list { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; }
.material-item { display: inline-block; background: #f8fafc; padding: 0.2rem 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0; }
.material-price { color: #64748b; margin-left: 0.25rem; }
.text-gray { color: #94a3b8; font-style: italic; font-size: 0.9rem; }
.font-bold { font-weight: bold; }

.total-display { padding: 1.5rem 0; color: #0b1680; font-size: 2.5rem; font-weight: bold; text-align: center; }
.w-full { width: 100%; }
.admin-validation { padding-top: 1rem; border-top: 1px solid #e2e8f0; }
@media (max-width: 768px) { .layout-grid { grid-template-columns: 1fr; } }
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.header-actions .ml-auto {
  margin-left: auto;
}
.actions-right {
  margin-left: auto;
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  .actions-right {
    margin-left: 0;
    margin-top: 1rem;
  }
}
</style>