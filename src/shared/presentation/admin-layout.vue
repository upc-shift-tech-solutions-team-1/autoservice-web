<script setup>
/**
 * Main admin layout.
 * Contains sidebar navigation, topbar and routed content.
 */

import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import Button from 'primevue/button';

import { useAuthStore } from '../../domains/auth/application/auth.store';

import LanguageSwitcher from './language-switcher.vue';

const { t } = useI18n();

const router = useRouter();
const authStore = useAuthStore();

/**
 * Logs out current user and redirects to login page.
 */
const handleLogout = () => {
  authStore.logout();

  window.location.href = '/login';
};
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const sidebarOpen = ref(false);
const isMobile = ref(false);

const checkScreen = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkScreen();
  window.addEventListener('resize', checkScreen);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreen);
});

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  if (isMobile.value) {
    sidebarOpen.value = false;
  }
};
</script>

<template>
  <div class="admin-layout">
    <div
        v-if="isMobile && sidebarOpen"
        class="sidebar-overlay"
        @click="closeSidebar"
    />
    <!-- SIDEBAR -->
    <aside
        class="sidebar"
        :class="{
    'sidebar-mobile': isMobile,
    'sidebar-open': sidebarOpen
  }"
    >

      <div class="logo-area">
        <img
            src="/AutoService-logo.jpg"
            alt="AutoService Logo"
            class="logo"
        />

        <div class="logo-text">
          <h2>{{ t('layout.brand') }}</h2>

          <span class="subtitle">
            {{ t('nav.controlPanel') }}
          </span>
        </div>
      </div>

      <nav class="menu">

        <router-link
            to="/"
            class="menu-item"
            @click="closeSidebar"
        >
          <i class="pi pi-home"></i>

          <span>{{ t('nav.dashboard') }}</span>
        </router-link>

        <router-link
            to="/customers"
            class="menu-item"
            @click="closeSidebar"
        >
          <i class="pi pi-users"></i>

          <span>{{ t('nav.customers') }}</span>
        </router-link>

        <router-link
            to="/vehicles"
            class="menu-item"
            @click="closeSidebar"
        >
          <i class="pi pi-car"></i>

          <span>{{ t('nav.vehicles') }}</span>
        </router-link>

        <router-link
            to="/work-orders"
            class="menu-item"
            @click="closeSidebar"
        >
          <i class="pi pi-address-book"></i>

          <span>{{ t('nav.workOrders') }}</span>
        </router-link>

        <router-link
            to="/tasks"
            class="menu-item"
            @click="closeSidebar"
        >
          <i class="pi pi-check-square"></i>

          <span>{{ t('nav.tasks') }}</span>
        </router-link>

        <router-link
            to="/mechanics"
            class="menu-item"
            @click="closeSidebar"
        >
          <i class="pi pi-users"></i>

          <span>{{ t('nav.mechanics') }}</span>
        </router-link>

        <router-link
            to="/inventory"
            class="menu-item"
            @click="closeSidebar"
        >
          <i class="pi pi-box"></i>

          <span>{{ t('nav.inventory') }}</span>
        </router-link>

      </nav>

    </aside>

    <!-- MAIN -->
    <main class="main-content">

      <!-- TOPBAR -->
      <header class="topbar">

        <div class="topbar-left">
          <Button
              v-if="isMobile"
              icon="pi pi-bars"
              text
              rounded
              @click="toggleSidebar"
          />
          <span class="welcome-text">
            {{ t('topbar.welcome') }}

            <strong>
              {{ authStore.user?.name || t('topbar.admin') }}
            </strong>
          </span>
        </div>

        <div class="topbar-right">


          <LanguageSwitcher />
          <div
              class="user-info"
              v-if="!isMobile"
          >
          <div class="user-info">

            <i class="pi pi-user user-icon"></i>

            <span>
              {{ authStore.user?.name || t('topbar.admin') }}
            </span>

          </div>
          </div>

          <Button
              :label="t('topbar.logout')"
              icon="pi pi-sign-out"
              severity="danger"
              rounded
              outlined
              @click="handleLogout"
          />

        </div>

      </header>

      <!-- CONTENT -->
      <section class="content">
        <router-view />
      </section>

    </main>

  </div>
</template>

<style scoped>
/* Layout */
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  color: #ffffff;
  background: #0f172a;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;

  padding: 1.5rem;
  border-bottom: 1px solid #1e293b;
}
.logo {
  width: 48px;
  height: 48px;

  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}
.logo-text {
  display: flex;
  flex-direction: column;
}
.logo-area h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
}

/* Menu */
.menu {
  flex: 1;
  padding: 1rem 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.9rem 1.5rem;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s ease;
}

.menu-item:hover {
  color: #ffffff;
  background: #1e293b;
}

.router-link-exact-active {
  color: #ffffff;
  background: #1e293b;
  border-left: 4px solid #14b8a6;
}

/* Main */
.main-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  background: #f1f5f9;
}

/* Topbar */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
  padding: 0 2rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.topbar-left {
  display: flex;
  flex-direction: column;
}

.welcome-text {
  color: #64748b;
  font-size: 0.9rem;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* User info */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.user-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  color: #ffffff;
  background: #14b8a6;
  border-radius: 50%;
}

/* Content */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(2px);
}
@media (max-width: 768px) {

  .sidebar {
    position: fixed;
    top: 0;
    left: -280px;

    z-index: 999;

    width: 260px;
    height: 100vh;

    transition: left .3s ease;
  }

  .sidebar-open {
    left: 0;
  }

  .main-content {
    width: 100%;
  }

  .topbar {
    padding: 0 1rem;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  }
  .menu-toggle {
    flex-shrink: 0;
  }

  .welcome-text {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: #64748b;
    font-size: 0.9rem;
    white-space: nowrap;
  }
  .topbar-right {
    gap: .5rem;
  }

  .user-info span {
    display: none;
  }

  .content {
    padding: 1rem;
  }
  @media (max-width: 768px) {

    .welcome-text {
      font-size: 0.8rem;
      overflow: hidden;
      text-overflow: ellipsis;
    }

  }
  @media (max-width: 576px) {

    .welcome-text {
      display: none;
    }

  }
}
</style>