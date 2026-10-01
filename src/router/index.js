/**
 * Application router configuration.
 * Handles route registration, authentication and role-based authorization.
 */

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../domains/auth/application/auth.store';

const routes = [
    {
        path: '/login',
        name: 'login',
        component: () =>
            import('../domains/auth/presentation/login-view.vue')
    },
    {
        path: '/tracking',
        name: 'tracking',
        component: () =>
            import('../domains/customer-trust/presentation/tracking-view.vue')
    },

    // ── Mechanic routes ───────────────────────────────────
    {
        path: '/mechanic/workspace',
        name: 'mechanic-dashboard',
        component: () =>
            import('../domains/mechanic/presentation/mechanic-dashboard.vue'),
        meta: {
            requiresAuth: true,
            role: 'mechanic'
        }
    },
    {
        path: '/mechanic/order/:id',
        name: 'mechanic-order',
        component: () =>
            import('../domains/mechanic/presentation/mechanic-order-execution.vue'),
        props: true,
        meta: {
            requiresAuth: true,
            role: 'mechanic'
        }
    },

    // ── Administrator routes ──────────────────────────────
    {
        path: '/',
        component: () =>
            import('../shared/presentation/admin-layout.vue'),
        meta: {
            requiresAuth: true,
            role: 'admin'
        },
        children: [
            {
                path: '',
                name: 'dashboard',
                component: () =>
                    import('../domains/workshop-operations/presentation/dashboard.vue')
            },
            {
                path: 'customers',
                name: 'customers',
                component: () =>
                    import('../domains/customer-management/presentation/pages/customer-management.page.vue')
            },
            {
                path: 'vehicles',
                name: 'vehicles',
                component: () =>
                    import('../domains/fleet-management/presentation/vehicle-list.vue')
            },
            {
                path: 'vehicles/:id',
                name: 'vehicle-detail',
                component: () =>
                    import('../domains/fleet-management/presentation/vehicle-detail.vue'),
                props: true
            },
            {
                path: 'work-orders',
                name: 'work-orders',
                component: () =>
                    import('../domains/workshop-operations/presentation/work-order-list.vue')
            },
            {
                path: 'work-orders/new',
                name: 'create-work-order',
                component: () =>
                    import('../domains/workshop-operations/presentation/create-work-order.vue')
            },
            {
                path: 'work-orders/:id',
                name: 'work-order-details',
                component: () =>
                    import('../domains/workshop-operations/presentation/work-order-detail.vue'),
                props: true
            },
            {
                path: 'tasks',
                name: 'tasks',
                component: () =>
                    import('../domains/workshop-operations/presentation/tasks-view.vue')
            },
            {
                path: 'mechanics',
                name: 'mechanics',
                component: () =>
                    import('../domains/staff-coordination/presentation/mechanics-view.vue')
            },
            {
                path: 'inventory',
                name: 'inventory',
                component: () =>
                    import('../domains/inventory-management/presentation/inventory-view.vue')
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

/**
 * Global authentication and role-based authorization guard.
 */
router.beforeEach((to) => {
    const authStore = useAuthStore();

    // Private route without a valid authenticated session.
    if (
        to.meta.requiresAuth &&
        !authStore.isAuthenticated
    ) {
        return {
            path: '/login',
            query: {
                redirect: to.fullPath
            }
        };
    }

    // Authenticated users should not return to the login screen.
    if (
        to.path === '/login' &&
        authStore.isAuthenticated
    ) {
        return authStore.userRole === 'mechanic'
            ? '/mechanic/workspace'
            : '/';
    }

    // Role-protected route.
    if (
        to.meta.role &&
        authStore.userRole !== to.meta.role
    ) {
        if (authStore.userRole === 'mechanic') {
            return '/mechanic/workspace';
        }

        if (authStore.userRole === 'admin') {
            return '/';
        }

        return '/login';
    }

    return true;
});

export default router;