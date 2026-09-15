<template>
  <Dialog
      :visible="visible"
      modal
      :style="{ width: '500px' }"
      :header="t('tracking.payment.title')"
      class="payment-dialog"
      @update:visible="$emit('update:visible', false)"
  >
    <div class="payment-container">
      <div class="payment-total">
        <span>{{ t('tracking.payment.total') }}</span>
        <h2>S/. {{ amount }}</h2>
      </div>

      <div class="methods-grid">
        <div class="method-card" :class="{ active: selectedMethod === 'Yape' }" @click="selectedMethod = 'Yape'">
          <img src="https://img.logo.dev/name/Yape?token=pk_N7BjeKbxQY2n_ta1Keni5Q&retina=true" alt="Yape"/>
          <span>Yape</span>
        </div>

        <div class="method-card" :class="{ active: selectedMethod === 'Plin' }" @click="selectedMethod = 'Plin'">
          <img src="https://thf.bing.com/th/id/OIP.CE4sOegvUrcoWtMDwQfGDQHaHa?w=179&h=180&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3" alt="Plin"/>
          <span>Plin</span>
        </div>

        <div class="method-card" :class="{ active: selectedMethod === 'Tarjeta' }" @click="selectedMethod = 'Tarjeta'">
          <img src="https://img.logo.dev/name/Bcp?token=pk_N7BjeKbxQY2n_ta1Keni5Q&retina=true" alt="Tarjeta" />
          <span>{{ t('tracking.payment.card') }}</span>
        </div>

        <div class="method-card" :class="{ active: selectedMethod === 'Efectivo' }" @click="selectedMethod = 'Efectivo'">
          <i class="pi pi-money-bill"></i>
          <span>{{ t('tracking.payment.cash') }}</span>
        </div>
      </div>

      <div v-if="selectedMethod === 'Tarjeta'" class="card-form">
        <div class="form-group">
          <label>{{ t('tracking.payment.cvv') }}</label>
          <InputText :placeholder="t('tracking.payment.cvvPlaceholder')" />
        </div>

        <div class="row">
          <div class="form-group">
            <label>{{ t('tracking.payment.date') }}</label>
            <InputText placeholder="MM/YY" />
          </div>
          <div class="form-group">
            <label>CVV</label>
            <InputText placeholder="123" />
          </div>
        </div>
      </div>

      <div v-if="selectedMethod === 'Yape' || selectedMethod === 'Plin'" class="qr-box">
        <i class="pi pi-qrcode"></i>
        <p>{{ t('tracking.payment.scanQr') }}</p>
      </div>

      <Button
          :label="t('tracking.payment.confirm')"
          icon="pi pi-check"
          class="pay-btn"
          :loading="isProcessing"
          @click="handlePayment"
      />
    </div>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const { t } = useI18n();

const props = defineProps({
  visible: Boolean,
  amount: Number
});

const emit = defineEmits(['update:visible', 'success']);

const selectedMethod = ref('Tarjeta');
const isProcessing = ref(false);

const handlePayment = () => {
  isProcessing.value = true;
  setTimeout(() => {
    isProcessing.value = false;
    alert(t('tracking.payment.success', { method: selectedMethod.value }));
    emit('success');
    emit('update:visible', false);
  }, 1500);
};
</script>

<style scoped>
.payment-container{ display:flex; flex-direction:column; gap:1.5rem; }
.payment-total{ text-align:center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:white; padding:1.5rem; border-radius:18px; }
.payment-total span{ opacity:0.8; }
.payment-total h2{ margin:0.5rem 0 0; font-size:2.3rem; }
.methods-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; }
.method-card{ display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:140px; border: 2px solid transparent; border-radius: 14px; cursor: pointer; transition: 0.2s;}
.method-card:hover{ transform:translateY(-2px); }
.method-card.active{ border-color:#2563eb; background:#eff6ff; }
.method-card img{ width:60px; height:60px; object-fit:contain; margin-bottom:0.7rem; }
.method-card i{ font-size: 3rem; color: #10b981; margin-bottom: 0.7rem; }
.card-form{ display:flex; flex-direction:column; gap:1rem; }
.form-group{ display:flex; flex-direction:column; gap:0.5rem; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: #475569; }
.row{ display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.qr-box{ height:180px; border:2px dashed #cbd5e1; border-radius:18px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:1rem; color:#64748b; }
.qr-box i{ font-size:4rem; }
.pay-btn{ width:100%; padding:1rem; border-radius: 14px; }
</style>