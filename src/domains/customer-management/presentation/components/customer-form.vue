<script setup>
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useI18n } from 'vue-i18n'

/**
 * Customer Dialog Component
 * Handles both registration and editing of customers.
 *
 * Props:
 * - visible {boolean} → Controls dialog visibility
 * - editMode {boolean} → Switches between register and edit mode
 * - form {Object} → Reactive customer form data
 *
 * Emits:
 * - update:visible → Toggles dialog visibility
 * - save → Triggers save action
 */
const props = defineProps({
  visible: Boolean,
  editMode: Boolean,
  form: Object
})

const emit = defineEmits(['update:visible', 'save'])
const { t } = useI18n();
</script>

<template>
  <Dialog
      :visible="visible"
      :header="editMode ? t('customers.form.editTitle') : t('customers.form.registerTitle')"
      :modal="true"
      :style="{ width: '40rem' }"
      class="customer-dialog p-fluid"
      @update:visible="emit('update:visible', $event)"
  >
    <div class="customer-form">
      <div class="field">
        <label for="fullName">{{ t('customers.form.fullName') }} <span class="required">*</span></label>
        <InputText
            id="fullName"
            v-model.trim="form.fullName"
            :placeholder="t('customers.form.fullNamePlaceholder')"
            class="custom-input"
        />
      </div>

      <div class="double-grid">
        <div class="field">
          <label for="dni">{{ t('customers.form.dni') }} <span class="required">*</span></label>
          <InputText
              id="dni"
              v-model.trim="form.dni"
              :placeholder="t('customers.form.dniPlaceholder')"
              class="custom-input"
          />
        </div>

        <div class="field">
          <label for="phone">{{ t('customers.form.phone') }}</label>
          <InputText
              id="phone"
              v-model.trim="form.phone"
              :placeholder="t('customers.form.phonePlaceholder')"
              class="custom-input"
          />
        </div>
      </div>

      <div class="field">
        <label for="email">{{ t('customers.form.email') }}</label>
        <InputText
            id="email"
            v-model.trim="form.email"
            :placeholder="t('customers.form.emailPlaceholder')"
            class="custom-input"
        />
      </div>
    </div>

    <template #footer>
      <Button
          :label="t('customers.form.cancel')"
          text
          severity="secondary"
          @click="emit('update:visible', false)"
      />
      <Button
          :label="editMode ? t('customers.form.update') : t('customers.form.save')"
          icon="pi pi-check"
          class="save-btn"
          @click="emit('save')"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.customer-dialog { border-radius: 24px; overflow: hidden; }
.customer-form { display: flex; flex-direction: column; gap: 1.2rem; margin-top: 0.5rem; }
.double-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
.field { display: flex; flex-direction: column; gap: 0.5rem; }
.field label { font-size: 0.85rem; font-weight: 700; color: #374151; }
.required { color: #ef4444; }
.custom-input { border-radius: 12px; }

.save-btn { background: #0b1680 !important; border: none !important; border-radius: 12px !important; }

@media (max-width: 768px) {
  .double-grid { grid-template-columns: 1fr; }
}
</style>
