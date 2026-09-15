<script setup>
/**
 * @file MechanicFilters.vue
 * @description Filters component for mechanic list (search + specialty)
 */

import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  search: String,
  specialty: [String, null],
  specialtyOptions: Array
});

defineEmits(['update:search', 'update:specialty']);

const { t } = useI18n();
</script>

<template>
  <div class="mechanic-filters">
    <div class="search-box">
      <i class="pi pi-search search-icon"></i>

      <InputText
          :model-value="search"
          :placeholder="t('mechanics.filters.searchPlaceholder')"
          @update:model-value="$emit('update:search', $event)"
      />
    </div>

    <Select
        :model-value="specialty"
        :options="specialtyOptions"
        :placeholder="t('mechanics.filters.specialtyPlaceholder')"
        showClear
        class="filter-select"
        @update:model-value="$emit('update:specialty', $event)"
    />
  </div>
</template>

<style scoped>
.mechanic-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 280px;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.search-icon {
  position: absolute;
  left: 1.2rem;
  color: #9ca3af;
  z-index: 10;
  pointer-events: none;
}

.search-box :deep(.p-inputtext) {
  flex: 1;
  height: 100%;
  border-radius: 12px;
  padding-left: 2.8rem;
  border: none;
  font-size: 1rem;
}

.filter-select {
  min-width: 240px;
  border-radius: 16px;
  height: 50px;
  display: flex;
  align-items: center;
}
</style>