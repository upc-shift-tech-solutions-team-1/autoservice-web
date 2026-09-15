<script setup>
/**
 * @file VehicleFilters.vue
 * @description **Vehicle Filters Component**
 *
 * Provides search, status filter, and sorting options for vehicles.
 *
 * Props:
 * - search: Current search query string
 * - status: Selected status filter
 * - sortBy: Selected sort option
 * - statusOptions: Array of available status filter options
 * - sortOptions: Array of available sort options
 *
 * Emits:
 * - update:search
 * - update:status
 * - update:sortBy
 */

import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
  search: String,
  status: [String, null],
  sortBy: [String, null],
  statusOptions: Array,
  sortOptions: Array
});

defineEmits(['update:search', 'update:status', 'update:sortBy']);
</script>

<template>
  <div class="vehicle-filters">
    <div class="search-box">
      <i class="pi pi-search search-icon"></i>
      <InputText
          :model-value="search"
          :placeholder="t('vehicles.filters.searchPlaceholder')"
          @update:model-value="$emit('update:search', $event)"
      />
    </div>

    <Select
        :model-value="status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="t('vehicles.filters.statusPlaceholder')"
        show-clear
        class="filter-select"
        @update:model-value="$emit('update:status', $event)"
    />

    <Select
        :model-value="sortBy"
        :options="sortOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="t('vehicles.filters.sortPlaceholder')"
        show-clear
        class="filter-select"
        @update:model-value="$emit('update:sortBy', $event)"
    />
  </div>
</template>

<style scoped>
.vehicle-filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
.search-box { position: relative; display: flex; align-items: center; flex: 1; min-width: 280px; }
.search-icon { position: absolute; left: 1.2rem; color: #9ca3af; z-index: 10; pointer-events: none; }
.search-box :deep(.p-inputtext) { width: 100%; border-radius: 16px; padding-left: 2.8rem; }
.filter-select { min-width: 200px; border-radius: 16px; }
</style>
