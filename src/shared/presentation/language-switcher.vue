<script setup>
/**
 * Language switcher component.
 * Handles locale selection and persistence.
 */

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

// ── Language options ──────────────────────────────────────
const options = [
  {
    label: 'ES',
    value: 'es',
    flag: '🇪🇸'
  },
  {
    label: 'EN',
    value: 'en',
    flag: '🇺🇸'
  }
];

// ── Computed ──────────────────────────────────────────────
const currentOption = computed(() =>
    options.find(option => option.value === locale.value) || options[0]
);

// ── Actions ───────────────────────────────────────────────

/**
 * Updates application locale and persists it.
 * @param {string} value
 */
const switchLocale = (value) => {
  locale.value = value;

  localStorage.setItem('autoservice-locale', value);
};
</script>

<template>
  <div class="lang-switcher">

    <button
        v-for="option in options"
        :key="option.value"
        :title="option.label"
        :class="[
          'lang-btn',
          { active: locale === option.value }
        ]"
        @click="switchLocale(option.value)"
    >
      <span class="flag">
        {{ option.flag }}
      </span>

      <span class="label">
        {{ option.label }}
      </span>
    </button>

  </div>
</template>

<style scoped>
.lang-switcher {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 3px;
  background: #f1f5f9;
  border-radius: 10px;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.lang-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}

.lang-btn.active {
  color: #0b1680;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.flag {
  font-size: 1rem;
  line-height: 1;
}

.label {
  font-size: 0.72rem;
}
</style>