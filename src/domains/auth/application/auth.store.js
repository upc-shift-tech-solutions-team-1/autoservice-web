import { defineStore } from 'pinia';
import http from '../../../shared/infrastructure/http-common';

const SUPPORTED_ROLES = ['admin', 'mechanic'];

/**
 * Pinia store for authentication management.
 * Handles user state, token persistence, and authentication actions.
 */
export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        loading: false,
        error: null
    }),

    getters: {
        /**
         * Returns true only when both token and user data exist.
         */
        isAuthenticated: (state) =>
            !!state.token &&
            !!state.user &&
            SUPPORTED_ROLES.includes(
                state.user?.role?.toLowerCase()
            ),

        /**
         * Returns the current workshop ID of the authenticated user.
         */
        currentWorkshopId: (state) =>
            state.user?.workshopId || null,

        /**
         * Returns the authenticated user's role.
         * No administrative role is assumed when the session is missing.
         */
        userRole: (state) =>
            state.user?.role?.toLowerCase() || null,

        /**
         * Returns the mechanic ID when the authenticated user
         * belongs to the mechanic role.
         */
        mechanicId: (state) =>
            state.user?.mechanicId || null
    },

    actions: {
        /**
         * Logs in a user with email and password.
         *
         * @param {string} email User email.
         * @param {string} password User password.
         * @returns {Promise<boolean>} True when login succeeds.
         */
        async login(email, password) {
            this.loading = true;
            this.error = null;

            try {
                const response = await http.post(
                    '/auth/sign-in',
                    {
                        email: email.trim(),
                        password
                    }
                );

                const role =
                    response.data.role?.toLowerCase();

                if (!SUPPORTED_ROLES.includes(role)) {
                    this.clearSession();
                    this.error =
                        'El usuario tiene un rol no reconocido.';
                    return false;
                }

                if (!response.data.token) {
                    this.clearSession();
                    this.error =
                        'No se recibió un token de autenticación.';
                    return false;
                }

                const userData = {
                    id: response.data.id,
                    email: response.data.email,
                    role,
                    workshopId:
                    response.data.workshopId,
                    mechanicId:
                    response.data.mechanicId
                };

                this.user = userData;
                this.token = response.data.token;

                localStorage.setItem(
                    'user',
                    JSON.stringify(userData)
                );

                localStorage.setItem(
                    'token',
                    this.token
                );

                return true;
            } catch (err) {
                this.clearSession();

                this.error =
                    err.response?.data?.message ||
                    'Error al iniciar sesión';

                return false;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Registers a new workshop and its administrator account.
         *
         * @param {string} workshopName Workshop name.
         * @param {string} email Administrator email.
         * @param {string} password Administrator password.
         * @returns {Promise<boolean>} True when registration succeeds.
         */
        async registerWorkshop(
            workshopName,
            email,
            password
        ) {
            this.loading = true;
            this.error = null;

            try {
                await http.post(
                    '/auth/register-workshop',
                    {
                        workshopName:
                            workshopName.trim(),
                        email: email.trim(),
                        password
                    }
                );

                return true;
            } catch (error) {
                this.error =
                    error.response?.data?.message ||
                    'Error al registrar el taller';

                return false;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Clears the current authentication session.
         */
        clearSession() {
            this.user = null;
            this.token = null;

            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },

        /**
         * Logs out the current user.
         */
        logout() {
            this.clearSession();
            this.error = null;
        }
    }
});