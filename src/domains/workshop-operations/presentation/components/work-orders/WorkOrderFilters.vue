<script setup>
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';

const { t } = useI18n();

defineProps({
  search: {
    type: String,
    default: ''
  },
  status: {
    type: [String, null],
    default: null
  },
  statusOptions: {
    type: Array,
    default: () => []
  },
  showStatus: {
    type: Boolean,
    default: true
  }
});

defineEmits([
  'update:search',
  'update:status'
]);
</script>

<template>
  <div class="work-order-filters">
    <div class="search-box">
      <i class="pi pi-search search-icon"></i>
      <InputText
          :model-value="search"
          :placeholder="t('workOrders.filters.searchPlaceholder') || 'Buscar...'"
          @update:model-value="$emit('update:search', $event)"
      />
    </div>

    <Select
        v-if="showStatus"
        :model-value="status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="t('workOrders.filters.statusPlaceholder') || 'Estado'"
        showClear
        class="filter-select"
        @update:model-value="$emit('update:status', $event)"
    />
  </div>
</template>

<style scoped>
.work-order-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.search-box { position: relative; display: flex; flex: 1; align-items: center; min-width: 280px; }
.search-icon { position: absolute; left: 1.2rem; z-index: 10; color: #9ca3af; pointer-events: none; }
.search-box :deep(.p-inputtext) { width: 100%; padding-left: 2.8rem; border-radius: 16px; }
.filter-select { min-width: 210px; border-radius: 16px; }
</style>