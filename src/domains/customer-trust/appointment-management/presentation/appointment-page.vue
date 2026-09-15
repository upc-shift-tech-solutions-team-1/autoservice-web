<script setup>
import { ref } from 'vue';
import {useAppointmentStore} from "../application/appointment.store.js";
import {useVehicleStore} from "../../../fleet-management/application/vehicle.store.js";
const vehicleStore = useVehicleStore();
const appointmentStore = useAppointmentStore();
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const form = ref({
  customerId: '',
  vehicleId: '',
  workshopId: '',
  serviceType: '',
  description: '',
  appointmentDate: '',
  appointmentTime: '',
  status: 'Pendiente'
});

const saveAppointment = async () => {

  const vehicle = vehicleStore.vehicles.find(
      v => v.id === form.value.vehicleId
  );

  form.value.workshopId = vehicle?.workshopId || '';

  await appointmentStore.createAppointment(form.value);

  alert(t('appointments.successMessage'));
};

</script>

<template>

  <section class="appointment-page">

    <div class="appointment-card">

      <h1>{{ $t('appointments.title') }}</h1>

      <div class="form-group">
        <label>{{ $t('appointments.serviceType') }}</label>

        <input
            v-model="form.serviceType"
            :placeholder="$t('appointments.serviceTypePlaceholder')"
        >
      </div>

      <div class="form-group">
        <label>{{ $t('appointments.description') }}</label>

        <textarea
            v-model="form.description"
            :placeholder="$t('appointments.descriptionPlaceholder')">
      </textarea>
      </div>

      <div class="form-row">

        <div class="form-group">
          <label>{{ $t('appointments.date') }}</label>

          <input
              type="date"
              v-model="form.appointmentDate">
        </div>

        <div class="form-group">
          <label>{{ $t('appointments.time') }}</label>

          <input
              type="time"
              v-model="form.appointmentTime">
        </div>

      </div>

      <button
          class="save-btn"
          @click="saveAppointment">

        {{ $t('appointments.submit') }}

      </button>

    </div>

  </section>

</template>

<style scoped>

.appointment-page{
  display:flex;
  justify-content:center;
  padding:2rem;
}

.appointment-card{
  width:100%;
  max-width:600px;
  background:white;
  padding:2rem;
  border-radius:20px;
  box-shadow:0 10px 30px rgba(0,0,0,.08);
}

h1{
  margin-bottom:1.5rem;
}

.form-group{
  display:flex;
  flex-direction:column;
  margin-bottom:1rem;
}

.form-group label{
  margin-bottom:.5rem;
  font-weight:600;
}

.form-group input,
.form-group textarea{
  padding:.9rem;
  border-radius:12px;
  border:1px solid #dbe2ea;
}

.form-row{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:1rem;
}

.save-btn{
  width:100%;
  margin-top:1rem;
  padding:1rem;
  border:none;
  border-radius:14px;
  background:#0b1680;
  color:white;
  font-weight:700;
  cursor:pointer;
}

</style>