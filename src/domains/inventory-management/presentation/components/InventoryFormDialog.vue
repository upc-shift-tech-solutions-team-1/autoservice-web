<script setup>
import { computed, reactive, watch } from 'vue';

import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';

const props = defineProps({
  visible: Boolean,
  item: Object
});

const emit = defineEmits(['update:visible', 'save']);

const form = reactive({
  id: null,
  name: '',
  category: '',
  brand: '',
  compatibleVehicleBrandsText: '',
  description: '',
  unitPrice: 0,
  stock: 0,
  minStock: 0,
  image: '',
  status: 'Disponible'
});

const categories = [
  'Lubricante',
  'Filtro',
  'Frenos',
  'Batería',
  'Herramienta',
  'Repuesto',
  'Accesorio'
];

const statuses = [
  'Disponible',
  'Agotado',
  'En reposición'
];

const title = computed(() => props.item ? 'Editar material' : 'Nuevo material');

const resetForm = () => {
  form.id = null;
  form.name = '';
  form.category = '';
  form.brand = '';
  form.compatibleVehicleBrandsText = '';
  form.description = '';
  form.unitPrice = 0;
  form.stock = 0;
  form.minStock = 0;
  form.image = '';
  form.status = 'Disponible';
};

watch(
    () => props.item,
    (value) => {
      if (value) {
        form.id = value.id;
        form.name = value.name || '';
        form.category = value.category || '';
        form.brand = value.brand || '';
        form.compatibleVehicleBrandsText = (value.compatibleVehicleBrands || []).join(', ');
        form.description = value.description || '';
        form.unitPrice = Number(value.unitPrice || 0);
        form.stock = Number(value.stock || 0);
        form.minStock = Number(value.minStock || 0);
        form.image = value.image || '';
        form.status = value.status || 'Disponible';
      } else {
        resetForm();
      }
    },
    { immediate: true }
);

const closeDialog = () => {
  emit('update:visible', false);
};

const saveItem = () => {
  const payload = {
    id: form.id,
    name: form.name,
    category: form.category,
    brand: form.brand,
    compatibleVehicleBrands: form.compatibleVehicleBrandsText
        .split(',')
        .map(brand => brand.trim())
        .filter(Boolean),
    description: form.description,
    unitPrice: Number(form.unitPrice || 0),
    stock: Number(form.stock || 0),
    minStock: Number(form.minStock || 0),
    image: form.image,
    status: form.status
  };

  emit('save', payload);
  resetForm();
};
</script>