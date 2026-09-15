<script setup>
/**
 * @file MechanicsPage.vue
 * @description Mechanics management page.
 */

import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';

import { useAuthStore } from '../../auth/application/auth.store';
import { useMechanicStore } from '../application/mechanic.store';

import MechanicCard from './components/MechanicCard.vue';
import MechanicFilters from './components/MechanicFilters.vue';

const { t } = useI18n();

const mechanicStore = useMechanicStore();
const authStore = useAuthStore();

const mechanicDialog = ref(false);
const mechanic = ref({});
const search = ref('');
const selectedSpecialty = ref(null);
const errorMessage = ref('');

/**
 * Mechanic specialties options.
 */
const specialtyOptions = computed(() => [
  t('mechanics.specialties.general'),
  t('mechanics.specialties.electrical'),
  t('mechanics.specialties.brakes'),
  t('mechanics.specialties.tires')
]);

/**
 * Computes admin email domain for mechanic accounts.
 */
const adminDomain = computed(() => {
  if (!authStore.user?.email) {
    return '@taller.com';
  }

  return `@${authStore.user.email.split('@')[1]}`;
});

/**
 * Filters mechanics by search and specialty.
 */
const filteredMechanics = computed(() => {
  const term = search.value.toLowerCase().trim();

  return mechanicStore.mechanics.filter((currentMechanic) => {
    const matchesSearch =
        !term ||
        currentMechanic.fullName?.toLowerCase().includes(term) ||
        currentMechanic.email?.toLowerCase().includes(term);

    const matchesSpecialty =
        !selectedSpecialty.value ||
        currentMechanic.specialty === selectedSpecialty.value;

    return matchesSearch && matchesSpecialty;
  });
});

onMounted(async () => {
  await mechanicStore.fetchMechanics();
});

const openNew = () => {
  mechanic.value = {
    fullName: '',
    specialty: '',
    maxCapacity: 3,
    username: '',
    password: ''
  };

  errorMessage.value = '';
  mechanicDialog.value = true;
};

const openEdit = (mech) => {
  mechanic.value = { ...mech };
  errorMessage.value = '';
  mechanicDialog.value = true;
};

const hideDialog = () => {
  mechanicDialog.value = false;
  errorMessage.value = '';
};

const confirmDelete = async (mech) => {
  const confirmed = confirm(
      t('mechanics.confirm.delete', { name: mech.fullName })
  );

  if (!confirmed) return;

  await mechanicStore.deleteMechanic(mech.id);
};

const saveMechanic = async () => {
  errorMessage.value = '';

  try {
    if (mechanic.value.id) {
      await mechanicStore.updateMechanic(
          mechanic.value.id,
          mechanic.value
      );

      hideDialog();
      return;
    }

    const hasRequiredFields =
        mechanic.value.fullName &&
        mechanic.value.username &&
        mechanic.value.password;

    if (!hasRequiredFields) return;

    const fullEmail =
        `${mechanic.value.username.trim()}${adminDomain.value}`;

    const payload = {
      fullName: mechanic.value.fullName,
      specialty: mechanic.value.specialty,
      maxCapacity: mechanic.value.maxCapacity,
      email: fullEmail,
      password: mechanic.value.password
    };

    await mechanicStore.addMechanic(payload);

    hideDialog();
  } catch (error) {
    if (error.response?.status === 400) {
      errorMessage.value = t('mechanics.errors.invalidData');
      return;
    }

    errorMessage.value = t('mechanics.errors.server');
  }
};
</script>

<template>
  <div class="mechanics-page">
    <div class="header-section">
      <h1>{{ t('mechanics.title') }}</h1>

      <Button
          :label="t('mechanics.actions.new')"
          icon="pi pi-plus"
          @click="openNew"
      />
    </div>

    <MechanicFilters
        v-model:search="search"
        v-model:specialty="selectedSpecialty"
        :specialty-options="specialtyOptions"
    />

    <div v-if="mechanicStore.loading" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>{{ t('mechanics.loading') }}</p>
    </div>

    <div v-else-if="filteredMechanics.length > 0" class="mechanics-grid">
      <MechanicCard
          v-for="mech in filteredMechanics"
          :key="mech.id"
          :mechanic="mech"
          @edit="openEdit"
          @delete="confirmDelete"
      />
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-users"></i>
      <h3>{{ t('mechanics.empty.title') }}</h3>
      <p>{{ t('mechanics.empty.description') }}</p>
    </div>

    <!-- DIALOG -->
    <Dialog
        v-model:visible="mechanicDialog"
        :header="
        mechanic.id
          ? t('mechanics.dialog.editTitle')
          : t('mechanics.dialog.registerTitle')
      "
        modal
        class="p-fluid mechanic-dialog"
    >
      <Message
          v-if="errorMessage"
          severity="error"
          :closable="false"
          class="form-field"
      >
        {{ errorMessage }}
      </Message>

      <div class="field form-field">
        <label for="fullName">
          {{ t('mechanics.dialog.fullName') }}
        </label>
        <InputText
            id="fullName"
            v-model.trim="mechanic.fullName"
            required
            autofocus
        />
      </div>

      <div class="field form-field">
        <label for="specialty">
          {{ t('mechanics.dialog.specialty') }}
        </label>
        <Select
            id="specialty"
            v-model="mechanic.specialty"
            :options="specialtyOptions"
            :placeholder="t('mechanics.dialog.selectSpecialty')"
        />
      </div>

      <div class="field form-field">
        <label for="maxCapacity">
          {{ t('mechanics.dialog.maxCapacity') }}
        </label>
        <InputNumber
            id="maxCapacity"
            v-model="mechanic.maxCapacity"
            showButtons
            :min="1"
            :max="10"
        />
      </div>

      <div v-if="!mechanic.id" class="field form-field">
        <label for="username">
          {{ t('mechanics.dialog.username') }}
        </label>

        <div class="p-inputgroup flex-1">
          <InputText
              id="username"
              v-model.trim="mechanic.username"
              :placeholder="t('mechanics.dialog.usernamePlaceholder')"
          />

          <span class="p-inputgroup-addon">
            {{ adminDomain }}
          </span>
        </div>

        <small class="text-color-secondary">
          {{ t('mechanics.dialog.usernameHelp') }}
        </small>
      </div>

      <div v-if="!mechanic.id" class="field form-field">
        <label for="password">
          {{ t('mechanics.dialog.password') }}
        </label>

        <InputText
            id="password"
            v-model.trim="mechanic.password"
            type="password"
            required
        />
      </div>

      <template #footer>
        <Button
            :label="t('actions.cancel')"
            icon="pi pi-times"
            text
            @click="hideDialog"
        />

        <Button
            :label="
            mechanic.id
              ? t('mechanics.actions.saveChanges')
              : t('mechanics.actions.create')
          "
            icon="pi pi-check"
            @click="saveMechanic"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.mechanics-page {
  min-height: 100%;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.mechanics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 260px;
  padding: 1rem;
  text-align: center;
  color: #64748b;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 24px;
}

.empty-state i {
  margin-bottom: 0.75rem;
  font-size: 2.5rem;
  color: #0b1680;
}

/* STANDARD FORM SPACING */
.form-field {
  margin-bottom: 1rem;
}

/* DIALOG IMPROVEMENTS */
.mechanic-dialog {
  width: 450px;
  max-width: 95vw;
}

.mechanic-dialog :deep(.p-dialog-content) {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
}

.mechanic-dialog :deep(.p-dialog-header) {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.mechanic-dialog :deep(.p-dialog-footer) {
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.field {
  display: flex;
  flex-direction: column;
}

.field label {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 500;
}

.field input,
.field .p-inputtext,
.field .p-select,
.field .p-inputnumber {
  width: 100%;
}
</style>