<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';
import RadioButton from 'primevue/radiobutton';

import { TrackingService } from '../infrastructure/tracking.service';
const { t } = useI18n();

const trackingCode = ref('');
const order = ref(null);
const vehicle = ref(null);
const customer = ref(null);
const workshop = ref(null);
const tasks = ref([]);
const loading = ref(false);
const errorMsg = ref('');

const dynamicWorkshopName = computed(() => workshop.value?.name || workshop.value?.workshopName || 'Auto-Taller');
const dynamicWorkshopEmail = computed(() => workshop.value?.email || 'contacto@taller.com');

const paymentDialogVisible = ref(false);
const paymentMethod = ref('card');
const cardNumber = ref('');
const cardExpiry = ref('');
const cardCvv = ref('');
const paymentLoading = ref(false);
const paymentSuccess = ref(false);

const searchOrder = async () => {
  const code = trackingCode.value.trim();
  if (!code) {
    errorMsg.value = t('tracking.validationError');
    return;
  }

  loading.value = true;
  errorMsg.value = '';

  try {
    console.log('Buscando orden con código:', code);

    // Llamada única al servicio
    const response = await TrackingService.getOrderByCode(code);
    console.log('Respuesta completa:', response);

    // Verificar si la respuesta tiene datos
    if (!response || !response.data) {
      errorMsg.value = t('tracking.notFound');
      loading.value = false;
      return;
    }

    // Si la respuesta es un array (como parece ser)
    let orderData;
    if (Array.isArray(response.data)) {
      if (response.data.length === 0) {
        errorMsg.value = t('tracking.notFound');
        loading.value = false;
        return;
      }
      orderData = response.data[0]; // Tomamos el primer elemento
    } else {
      orderData = response.data;
    }

    // Verificar que el orden tenga los datos necesarios
    if (!orderData || !orderData.id) {
      errorMsg.value = t('tracking.invalidId');
      loading.value = false;
      return;
    }

    order.value = orderData;
    console.log('Orden encontrada:', orderData);

    // Verificar que tenga los IDs necesarios
    if (!orderData.vehicleId) {
      console.warn('La orden no tiene vehicleId');
    }
    if (!orderData.customerId) {
      console.warn('La orden no tiene customerId');
    }
    if (!orderData.workshopId) {
      console.warn('La orden no tiene workshopId');
    }

    // Traer datos relacionados con manejo de errores individual
    const fetchPromises = [];

    // Vehículo
    if (orderData.vehicleId) {
      fetchPromises.push(
          TrackingService.getVehicle(orderData.vehicleId)
              .then(res => ({ type: 'vehicle', data: res.data }))
              .catch(err => {
                console.error('Error al obtener vehículo:', err);
                return { type: 'vehicle', data: null };
              })
      );
    } else {
      fetchPromises.push(Promise.resolve({ type: 'vehicle', data: null }));
    }

    // Tareas
    if (orderData.id) {
      fetchPromises.push(
          TrackingService.getTasksByOrder(orderData.id)
              .then(res => ({ type: 'tasks', data: res.data }))
              .catch(err => {
                console.error('Error al obtener tareas:', err);
                return { type: 'tasks', data: [] };
              })
      );
    } else {
      fetchPromises.push(Promise.resolve({ type: 'tasks', data: [] }));
    }

    // Cliente
    if (orderData.customerId) {
      fetchPromises.push(
          TrackingService.getCustomer(orderData.customerId)
              .then(res => ({ type: 'customer', data: res.data }))
              .catch(err => {
                console.error('Error al obtener cliente:', err);
                return { type: 'customer', data: { fullName: 'Cliente' } };
              })
      );
    } else {
      fetchPromises.push(Promise.resolve({ type: 'customer', data: { fullName: 'Cliente' } }));
    }

    // Taller
    if (orderData.workshopId) {
      fetchPromises.push(
          TrackingService.getWorkshop(orderData.workshopId)
              .then(res => ({ type: 'workshop', data: res.data }))
              .catch(err => {
                console.error('Error al obtener taller:', err);
                return { type: 'workshop', data: null };
              })
      );
    } else {
      fetchPromises.push(Promise.resolve({ type: 'workshop', data: null }));
    }

    // Esperar todas las promesas
    const results = await Promise.all(fetchPromises);

    // Asignar resultados
    results.forEach(result => {
      switch(result.type) {
        case 'vehicle':
          vehicle.value = result.data;
          break;
        case 'tasks':
          tasks.value = Array.isArray(result.data) ? result.data : [];
          break;
        case 'customer':
          customer.value = result.data;
          break;
        case 'workshop':
          workshop.value = result.data;
          break;
      }
    });

    console.log('Datos cargados:', { vehicle: vehicle.value, tasks: tasks.value, customer: customer.value, workshop: workshop.value });

  } catch (err) {
    console.error('Error en searchOrder:', err);
    errorMsg.value = err.response?.data?.message || t('tracking.errorConnection');
  } finally {
    loading.value = false;
  }
};

// Resto de métodos sin cambios...
const resetSearch = () => {
  order.value = null;
  trackingCode.value = '';
  vehicle.value = null;
  customer.value = null;
  workshop.value = null;
  tasks.value = [];
  paymentSuccess.value = false;
};

const openPaymentModal = () => {
  paymentDialogVisible.value = true;
};

const executeSimulatedPayment = async () => {
  paymentLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 2000));
  paymentLoading.value = false;
  paymentSuccess.value = true;

  if (paymentMethod.value !== 'cash') {
    order.value.status = 'DELIVERED';
  }
};

const printReceipt = () => {
  window.print();
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
  if (order.value.status === 'DELIVERED' || order.value.status === 'FINISHED') return 100;
  if (!tasks.value.length) return 0;

  const completed = tasks.value.filter(t => t.status === 'COMPLETED').length;
  return Math.round((completed / tasks.value.length) * 100);
});
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

          <Button
              v-if="order.status === 'FINISHED' || order.status === 'DELIVERED'"
              icon="pi pi-download"
              severity="secondary"
              outlined
              :label="t('tracking.payment.downloadReceipt') || 'Comprobante PDF'"
              @click="printReceipt"
          />
        </div>

        <Card class="status-card mb-4">
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

            <div class="progress-container mt-4 pt-3 border-top-1 border-white-alpha-20">
              <div class="flex justify-content-between mb-2">
                <span class="font-semibold">{{ t('tracking.progress') }}</span>
                <strong>{{ getProgressValue }}%</strong>
              </div>
              <ProgressBar :value="getProgressValue" :showValue="false" class="custom-progress" />
            </div>
          </template>
        </Card>

        <Card class="tasks-card">
          <template #title>{{ t('tracking.tasksTitle') }}</template>
          <template #content>
            <div class="tasks-list">
              <div v-for="task in tasks" :key="task.id" class="task-item">
                <div class="flex justify-content-between align-items-start mb-2">
                  <span class="font-bold text-lg color-title">{{ task.description }}</span>
                  <Tag
                      :value="$t(`taskStatus.${task.status.toLowerCase()}`)"
                      :severity="task.status === 'COMPLETED' ? 'success' : 'warning'"
                  />
                </div>

                <div v-if="task.parts && task.parts.length" class="materials-box mt-3">
                  <span class="text-sm font-bold uppercase color-subtitle"><i class="pi pi-box"></i> {{ t('tracking.materialsUsed') }}</span>
                  <ul class="p-0 m-0 mt-2 list-none">
                    <li v-for="(part, i) in task.parts" :key="i" class="flex justify-content-between text-sm py-2 border-bottom-1 border-gray-200">
                      <span>{{ part.quantity }}x {{ part.name }}</span>
                      <span class="font-medium">S/. {{ ((part.unitPrice || 0) * part.quantity).toFixed(2) }}</span>
                    </li>
                  </ul>
                </div>

                <div class="flex justify-content-end mt-3">
                  <span class="font-bold" style="color: #0b1680;">S/. {{ task.laborPrice }} <span class="font-normal text-sm text-gray-500">({{ t('tracking.labor') }})</span></span>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-top-1 border-gray-300 flex justify-content-between align-items-center">
              <span class="text-xl font-bold color-title">{{ t('tracking.totalCost') }}</span>
              <span class="text-3xl font-bold" style="color: #0b1680;">S/. {{ order.price }}</span>
            </div>

            <div v-if="order.status === 'FINISHED'" class="mt-4">
              <Button
                  :label="t('tracking.payment.payButton')"
                  icon="pi pi-credit-card"
                  class="w-full payment-trigger-btn"
                  @click="openPaymentModal"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <Dialog v-model:visible="paymentDialogVisible" modal :header="t('tracking.payment.dialogTitle')" :style="{ width: '500px' }" class="payment-dialog">
      <div v-if="!paymentSuccess" class="payment-flow-container">
        <div class="total-badge mb-4">
          <span>{{ t('tracking.totalCost') }}</span>
          <h2>S/. {{ order?.price }}</h2>
        </div>

        <label class="block font-bold text-sm mb-3 text-gray-700 uppercase tracking-wider">{{ t('tracking.payment.selectMethod') }}</label>

        <div class="methods-grid mb-4">
          <div class="method-option" :class="{ active: paymentMethod === 'card' }" @click="paymentMethod = 'card'">
            <RadioButton v-model="paymentMethod" inputId="methodCard" name="payment" value="card" />
            <label for="methodCard" class="ml-2"><i class="pi pi-credit-card mr-2"></i>{{ t('tracking.payment.card') }}</label>
          </div>
          <div class="method-option" :class="{ active: paymentMethod === 'qr' }" @click="paymentMethod = 'qr'">
            <RadioButton v-model="paymentMethod" inputId="methodQr" name="payment" value="qr" />
            <label for="methodQr" class="ml-2"><i class="pi pi-qrcode mr-2"></i>{{ t('tracking.payment.qr') }}</label>
          </div>
          <div class="method-option" :class="{ active: paymentMethod === 'cash' }" @click="paymentMethod = 'cash'">
            <RadioButton v-model="paymentMethod" inputId="methodCash" name="payment" value="cash" />
            <label for="methodCash" class="ml-2"><i class="pi pi-money-bill mr-2"></i>{{ t('tracking.payment.cash') }}</label>
          </div>
        </div>

        <div v-if="paymentMethod === 'card'" class="card-form fade-in">
          <div class="field mb-3">
            <label class="text-sm font-bold block mb-1 text-gray-600">{{ t('tracking.payment.cardNumber') }}</label>
            <InputText v-model="cardNumber" placeholder="0000 0000 0000 0000" class="w-full" />
          </div>
          <div class="form-grid-2">
            <div class="field">
              <label class="text-sm font-bold block mb-1 text-gray-600">{{ t('tracking.payment.expiry') }}</label>
              <InputText v-model="cardExpiry" placeholder="MM/AA" class="w-full" />
            </div>
            <div class="field">
              <label class="text-sm font-bold block mb-1 text-gray-600">{{ t('tracking.payment.cvv') }}</label>
              <InputText v-model="cardCvv" placeholder="123" class="w-full" />
            </div>
          </div>
        </div>

        <div v-else-if="paymentMethod === 'qr'" class="qr-container text-center py-3 fade-in">
          <div class="qr-mock-box mx-auto mb-3">
            <i class="pi pi-qrcode" style="font-size: 8rem; color: #1e293b;"></i>
          </div>
          <p class="text-sm text-gray-600 px-3">{{ t('tracking.payment.qrInstructions') }}</p>
        </div>

        <div v-else-if="paymentMethod === 'cash'" class="cash-container fade-in">
          <Message severity="info" :closable="false" class="m-0">
            {{ t('tracking.payment.cashMessage') }}
          </Message>
        </div>

        <div class="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 border-gray-200">
          <Button :label="t('tracking.payment.cancel')" text severity="secondary" @click="paymentDialogVisible = false" />
          <Button :label="paymentMethod === 'cash' ? t('tracking.payment.confirmAction') : t('tracking.payment.payAction', { total: order?.price })" :icon="paymentMethod === 'cash' ? 'pi pi-check' : 'pi pi-lock'" :loading="paymentLoading" @click="executeSimulatedPayment" />
        </div>
      </div>

      <div v-else class="payment-success-screen text-center py-5 fade-in">
        <i class="pi pi-check-circle text-7xl text-green-500 mb-3"></i>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('tracking.payment.successTitle') }}</h2>
        <p class="text-gray-600 mt-2 px-4">{{ paymentMethod === 'cash' ? t('tracking.payment.successSubtitleCash') : t('tracking.payment.successSubtitleOnline') }}</p>
        <Button :label="t('tracking.payment.close')" class="mt-4" severity="success" @click="paymentDialogVisible = false" />
      </div>
    </Dialog>
  </div>

  <div v-if="order" class="print-receipt-sheet only-print">
    <div class="receipt-header">
      <div>
        <h1>{{ dynamicWorkshopName }}</h1>
        <p>{{ $t('tracking.receipt.contact') }} {{ dynamicWorkshopEmail }}</p>
      </div>
      <div class="receipt-meta">
        <h2>{{ $t('tracking.receipt.title') }}</h2>
        <p><strong>Código:</strong> {{ order.trackingCode || order.code || '---' }}</p>
        <p><strong>{{ $t('tracking.receipt.issueDate') }}</strong> {{ new Date().toLocaleDateString() }}</p>
      </div>
    </div>

    <hr class="receipt-divider" />

    <div class="receipt-section">
      <h3>{{ $t('tracking.receipt.customerVehicleData') }}</h3>
      <table class="receipt-table-info">
        <tbody> <!-- Envolver las filas en tbody -->
        <tr>
          <td><strong>{{ $t('tracking.receipt.customer') }}</strong></td>
          <td>{{ customer?.fullName || '---' }}</td>
          <td><strong>{{ $t('tracking.receipt.vehicle') }}</strong></td>
          <td>{{ vehicle ? `${vehicle.brand} ${vehicle.model}` : '---' }}</td>
        </tr>
        <tr>
          <td><strong>{{ $t('tracking.receipt.orderStatus') }}</strong></td>
          <td>{{ order.status }}</td>
          <td><strong>{{ $t('tracking.receipt.plate') }}</strong></td>
          <td>{{ vehicle?.plate || '---' }}</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="receipt-section mt-4">
      <h3>{{ $t('tracking.receipt.serviceDetail') }}</h3>
      <table class="receipt-main-table">
        <thead>
        <tr>
          <th>{{ $t('tracking.receipt.taskMaterialsDesc') }}</th>
          <th class="text-right">{{ $t('tracking.receipt.labor') }}</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="task in tasks" :key="task.id">
          <tr class="task-row">
            <td>
              <strong>{{ task.description }}</strong>
              <div v-if="task.parts && task.parts.length" class="print-parts-detail">
                <ul>
                  <li v-for="(part, i) in task.parts" :key="i">
                    » {{ part.quantity }}x {{ part.name }} (S/. {{ (part.unitPrice * part.quantity).toFixed(2) }})
                  </li>
                </ul>
              </div>
            </td>
            <td class="text-right font-mono">S/. {{ parseFloat(task.laborPrice).toFixed(2) }}</td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>

    <div class="receipt-summary">
      <div class="summary-box">
        <div class="summary-line">
          <span>$t('tracking.receipt.complementaryTotal') }}</span>
          <strong>S/. {{ parseFloat(order.price).toFixed(2) }}</strong>
        </div>
      </div>
    </div>

    <div class="receipt-footer">
      <p>{{ $t('tracking.receipt.thankYou') }} {{ dynamicWorkshopName }}.</p>
      <p>{{ $t('tracking.receipt.footerDisclaimer') }}</p>
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
.payment-trigger-btn { background: #10b981; border-color: #10b981; border-radius: 14px; padding: 1rem; font-size: 1.1rem; font-weight: bold; width: 100%; }
.payment-trigger-btn:hover { background: #059669 !important; }

/* Modal de Pago */
.total-badge { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; }
.total-badge span { color: #166534; font-weight: bold; text-transform: uppercase; font-size: 0.85rem; }
.total-badge h2 { margin: 0; color: #14532d; font-size: 1.6rem; font-weight: 800; }
.methods-grid { display: flex; flex-direction: column; gap: 0.75rem; }
.method-option { display: flex; align-items: center; padding: 1rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; }
.method-option:hover { border-color: #cbd5e1; background: #f8fafc; }
.method-option.active { border-color: #0b1680; background: #eff6ff; }
.method-option label { cursor: pointer; font-weight: 600; color: #334155; display: flex; align-items: center; }
.method-option label i { font-size: 1.2rem; color: #475569; }
.method-option.active label i { color: #0b1680; }
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.qr-mock-box { width: 160px; height: 160px; background: white; border: 1px solid #e2e8f0; border-radius: 16px; display: grid; place-items: center; }

/* Cards de Resultados */
.status-card { border-radius: 24px; background: linear-gradient(135deg, #0b1680 0%, #1e3a8a 100%); color: white; box-shadow: 0 14px 34px rgba(11, 22, 128, 0.2); }
.status-header h2 { margin: 0; font-size: 1.8rem; }
.status-msg { font-size: 1.1rem; line-height: 1.5; margin-top: 0.5rem; color: #e0e7ff; }
.vehicle-info { display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.1); padding: 1.2rem; border-radius: 16px; }
.text-white-alpha-70 { color: rgba(255,255,255,0.7); }
.border-white-alpha-20 { border-color: rgba(255,255,255,0.2) !important; }
.custom-progress { height: 10px; background: rgba(255,255,255,0.2); border-radius: 8px; }
.custom-progress :deep(.p-progressbar-value) { background: #4ade80; }
.tasks-card { border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
.task-item { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.materials-box { background: #f8fafc; border-radius: 12px; padding: 1rem; border: 1px dashed #cbd5e1; }
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

/* Ocultar la estructura del PDF por defecto en pantalla */
.only-print { display: none; }

/* REGLAS CSS MÁGICAS PARA LA IMPRESIÓN (WINDOW.PRINT) */
@media print {
  .no-print, .p-dialog-mask, .p-component-overlay { display: none !important; }
  .only-print { display: block !important; }
  body { background: #ffffff !important; color: #000000 !important; font-size: 12pt; margin: 0; padding: 0; }
  .print-receipt-sheet { max-width: 100%; padding: 20mm 15mm; box-sizing: border-box; }
  .receipt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
  .receipt-header h1 { margin: 0; font-size: 24pt; color: #0b1680; font-weight: bold; text-transform: uppercase;}
  .receipt-header p { margin: 2px 0; font-size: 10pt; color: #475569; }
  .receipt-meta { text-align: right; }
  .receipt-meta h2 { margin: 0 0 5px 0; font-size: 16pt; color: #0f172a; letter-spacing: 1px; }
  .receipt-meta p { margin: 2px 0; font-size: 10pt; }
  .receipt-divider { border: none; border-top: 2px solid #0b1680; margin: 15px 0; }
  .receipt-section h3 { font-size: 12pt; margin: 0 0 8px 0; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
  .receipt-table-info { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10.5pt; }
  .receipt-table-info td { padding: 4px 8px; vertical-align: top; }
  .receipt-main-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .receipt-main-table th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-size: 11pt; border-bottom: 2px solid #cbd5e1; }
  .receipt-main-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 10.5pt; }
  .task-row { page-break-inside: avoid; }
  .print-parts-detail { margin-top: 4px; background: #f8fafc; padding: 6px; border-radius: 4px; }
  .print-parts-detail ul { list-style: none; padding: 0; margin: 0; font-size: 9.5pt; color: #334155; }
  .text-right { text-align: right !important; }
  .font-mono { font-family: monospace; }
  .receipt-summary { display: flex; justify-content: flex-end; margin-top: 20px; }
  .summary-box { width: 280px; border-top: 2px solid #0b1680; padding-top: 8px; }
  .summary-line { display: flex; justify-content: space-between; font-size: 12pt; }
  .summary-line strong { font-size: 14pt; color: #0b1680; }
  .receipt-footer { margin-top: 40px; text-align: center; font-size: 9pt; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
  .receipt-footer p { margin: 2px 0; }
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>