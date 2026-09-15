import { defineStore } from 'pinia';
import http from '../../../shared/infrastructure/http-common';

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
        /** Returns true if a token exists */
        isAuthenticated: (state) => !!state.token,

        /** Returns the current workshop ID of the user */
        currentWorkshopId: (state) => state.user ? state.user.workshopId : null,

        /** Returns the role of the user, defaults to 'admin' */
        userRole: (state) => state.user?.role || 'admin',

        /** Returns the mechanic ID of the user */
        mechanicId: (state) => state.user?.mechanicId || null
    },

    actions: {
        /**
         * Logs in a user with email and password.
         * @param {string} email - User email
         * @param {string} password - User password
         * @returns {Promise<boolean>} True if login successful, false otherwise
         */
        async login(email, password) {
            this.loading = true;
            this.error = null;
            try {
                const response = await http.post('/auth/sign-in', {
                    email,
                    password
                });

                const userData = {
                    id: response.data.id,
                    email: response.data.email,
                    role: response.data.role,
                    workshopId: response.data.workshopId,
                    mechanicId: response.data.mechanicId
                };

                this.user = userData;
                this.token = response.data.token;

                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', this.token);

                return true;
            } catch (err) {
                this.error = err.response?.data?.message || 'Error al iniciar sesión';
                return false;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Registers a new workshop with credentials.
         * @param {string} workshopName - Name of the workshop
         * @param {string} email - Admin email
         * @param {string} password - Admin password
         * @returns {Promise<boolean>} True if registration successful, false otherwise
         */
        async registerWorkshop(workshopName, email, password) {
            this.loading = true;
            this.error = null;
            try {
                await http.post('/auth/register-workshop', {
                    workshopName,
                    email,
                    password
                });
                return true;
            } catch (error) {
                this.error = error.response?.data?.message || 'Error al registrar el taller';
                return false;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Logs out the current user and clears local storage.
         */
        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },

        async forgotPassword(email) {
            this.loading = true;
            this.error = null;
            try {
                await http.post('/auth/forgot-password', { email });
                return { success: true, message: 'Se ha enviado un enlace de recuperación a tu correo.' };
            } catch (err) {
                this.error = err.response?.data?.message || 'No se pudo procesar la solicitud.';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
    }
});
