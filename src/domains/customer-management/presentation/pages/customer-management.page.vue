<script setup>
/**
 * @file customer-management.page.vue
 * @description **Customer Management Page - Main Entry Point**
 *
 * Primary page component for the Customer Management section.
 * Acts as a lightweight container that renders the main CustomerList component.
 *
 * Architecture Role:
 * - Part of the **Presentation Layer** in the Customer Management domain.
 * - Registered as a route in `src/router/index.js` under `/customers`.
 * - Follows the pattern of using small wrapper pages for better organization and scalability.
 *
 * Benefits:
 * - Keeps routing clean
 * - Allows adding page-level layout, metadata, or global actions in the future
 * - Separates concerns between routing and the actual list logic
 */
import CustomerList from "../components/customer-list.vue";
</script>

<template>
  <div class="customer-page">
    <CustomerList />
  </div>
</template>

<style scoped>
.customer-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
