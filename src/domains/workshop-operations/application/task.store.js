/**
 * @file task.store.js
 * @description Task state management store.
 */

import { defineStore } from 'pinia';
import http from '../../../shared/infrastructure/http-common';
import { createTask } from '../domain/task.entity';

// ── CONSTANTS FOR DOMAIN LOGIC ───────────────────────────
/** Standardized system task states for backend syncing */
const TASK_STATUS = {
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
};

/** Standardized administrative review workflow statuses */
const REVIEW_STATUS = {
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
};

/** Standardized visibility levels for customer interaction */
const CUSTOMER_VISIBILITY = {
    HIDDEN: 'HIDDEN',
    VISIBLE: 'VISIBLE'
};

/**
 * Converts a raw value into a valid numeric value.
 *
 * @param {*} value - Raw value.
 * @param {number} fallback - Fallback numeric value.
 * @returns {number}
 */
const toNumber = (value, fallback = 0) => {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : fallback;
};

/**
 * Converts a raw value into a valid integer value.
 *
 * @param {*} value - Raw value.
 * @param {number} fallback - Fallback integer value.
 * @returns {number}
 */
const toInteger = (value, fallback = 0) => {
    const parsedValue = Number.parseInt(value, 10);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : fallback;
};

/**
 * Returns a user-friendly error message.
 *
 * @param {Object} error - HTTP or JavaScript error.
 * @param {string} fallbackMessage - Default message.
 * @returns {string}
 */
const getErrorMessage = (
    error,
    fallbackMessage = 'Ocurrió un error procesando la tarea.'
) =>
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    fallbackMessage;

/**
 * Normalizes task parts before sending them to the backend.
 *
 * Stock changes are not performed in the frontend.
 * The backend remains responsible for validating stock
 * and registering the corresponding inventory movement.
 *
 * @param {Array} parts - Raw task parts.
 * @returns {Array}
 */
const normalizeTaskParts = (parts = []) =>
    (Array.isArray(parts) ? parts : [])
        .filter(part =>
            part.inventoryItemId !== null &&
            part.inventoryItemId !== undefined
        )
        .map(part => ({
            inventoryItemId: part.inventoryItemId,

            name: String(
                part.name || ''
            ).trim(),

            quantity: Math.max(
                1,
                toInteger(part.quantity, 1)
            ),

            unitPrice: Math.max(
                0,
                toNumber(part.unitPrice)
            ),

            purchasePrice: Math.max(
                0,
                toNumber(part.purchasePrice)
            ),

            brand: String(
                part.brand || 'GENERIC'
            ).trim(),

            qualityTier: String(
                part.qualityTier || 'STANDARD'
            ).toUpperCase()
        }));

/**
 * Creates the payload used for task creation and update.
 *
 * @param {Object} taskData - Raw task information.
 * @returns {Object}
 */
const createTaskPayload = (taskData = {}) => {
    const task = createTask(taskData);

    return {
        workOrderId: task.workOrderId,
        mechanicId: task.mechanicId,

        description: task.description,
        status: task.status,
        priority: task.priority,
        estimatedTime: task.estimatedTime,

        /**
         * Amount charged to the customer for labor.
         */
        laborPrice: task.laborPrice,

        /**
         * Internal workshop labor cost.
         */
        laborCost: task.laborCost,

        /**
         * Amount charged to the customer for materials.
         */
        materialsCost: task.materialsCost,

        /**
         * Purchase cost paid by the workshop for materials.
         */
        materialsPurchaseCost:
        task.materialsPurchaseCost,

        technicalDiagnosis:
        task.technicalDiagnosis,

        customerExplanation:
        task.customerExplanation,

        internalObservation:
        task.internalObservation,

        evidenceRegistered:
        task.evidenceRegistered,

        adminReviewStatus:
        task.adminReviewStatus,

        parts: normalizeTaskParts(task.parts)
    };
};

/**
 * Normalizes an API task collection.
 *
 * @param {*} data - API response data.
 * @returns {Array}
 */
const normalizeTaskCollection = (data) =>
    (Array.isArray(data) ? data : [])
        .map(task => createTask(task));

export const useTaskStore = defineStore('task', {
    state: () => ({
        tasks: [],
        loading: false,
        saving: false,
        error: null
    }),

    actions: {
        /**
         * Clears the last task operation error.
         */
        clearError() {
            this.error = null;
        },

        /**
         * Fetches all tasks.
         *
         * @returns {Promise<Array>}
         */
        async fetchAllTasks() {
            this.loading = true;
            this.error = null;

            try {
                const response = await http.get('/tasks');

                this.tasks = normalizeTaskCollection(
                    response.data
                );

                return this.tasks;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudieron cargar las tareas.'
                );

                console.error(
                    'Error cargando tareas:',
                    error
                );

                return [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Fetches tasks assigned to a mechanic.
         *
         * @param {string|number} mechanicId - Mechanic identifier.
         * @returns {Promise<Array>}
         */
        async fetchTasksByMechanic(mechanicId) {
            this.loading = true;
            this.error = null;

            try {
                const response = await http.get('/tasks', {
                    params: { mechanicId }
                });

                this.tasks = normalizeTaskCollection(
                    response.data
                );

                return this.tasks;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudieron cargar las tareas del mecánico.'
                );

                console.error(
                    'Error cargando tareas del mecánico:',
                    error
                );

                return [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Fetches tasks associated with a work order.
         *
         * @param {string|number} workOrderId - Work order identifier.
         * @returns {Promise<Array>}
         */
        async fetchTasksByOrder(workOrderId) {
            this.loading = true;
            this.error = null;

            try {
                const response = await http.get('/tasks', {
                    params: { workOrderId }
                });

                this.tasks = normalizeTaskCollection(
                    response.data
                );

                return this.tasks;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudieron cargar las tareas de la orden.'
                );

                console.error(
                    'Error cargando tareas de la orden:',
                    error
                );

                return [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Creates a new task.
         *
         * @param {Object} taskData - Task payload.
         * @returns {Promise<Object>}
         */
        async addTask(taskData) {
            this.saving = true;
            this.error = null;

            try {
                const response = await http.post(
                    '/tasks',
                    createTaskPayload(taskData)
                );

                const createdTask = createTask(
                    response.data
                );

                this.tasks.push(createdTask);

                return createdTask;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo crear la tarea.'
                );

                console.error(
                    'Error creando tarea:',
                    error
                );

                throw error;
            } finally {
                this.saving = false;
            }
        },

        /**
         * Updates an existing task.
         *
         * @param {string|number} id - Task identifier.
         * @param {Object} taskData - Updated task payload.
         * @returns {Promise<Object>}
         */
        async updateTask(id, taskData) {
            this.saving = true;
            this.error = null;

            try {
                const response = await http.put(
                    `/tasks/${id}`,
                    createTaskPayload({
                        ...taskData,
                        id
                    })
                );

                const updatedTask = createTask(
                    response.data
                );

                this._updateLocalTask(
                    id,
                    updatedTask
                );

                return updatedTask;
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo actualizar la tarea.'
                );

                console.error(
                    'Error actualizando tarea:',
                    error
                );

                throw error;
            } finally {
                this.saving = false;
            }
        },

        /**
         * Deletes a task.
         *
         * @param {string|number} id - Task identifier.
         * @returns {Promise<void>}
         */
        async deleteTask(id) {
            this.saving = true;
            this.error = null;

            try {
                await http.delete(`/tasks/${id}`);

                this.tasks = this.tasks.filter(
                    task =>
                        String(task.id) !==
                        String(id)
                );
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo eliminar la tarea.'
                );

                console.error(
                    'Error eliminando tarea:',
                    error
                );

                throw error;
            } finally {
                this.saving = false;
            }
        },

        /**
         * Starts a task.
         * Sets state code to operational in-progress value.
         *
         * @param {string|number} id - Task identifier.
         * @returns {Promise<Object>}
         */
        async startTask(id) {
            this.error = null;

            try {
                const response = await http.patch(
                    `/tasks/${id}`,
                    {
                        status:
                        TASK_STATUS.IN_PROGRESS
                    }
                );

                this._updateLocalTask(
                    id,
                    response.data
                );

                return createTask(response.data);
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo iniciar la tarea.'
                );

                console.error(
                    'Error iniciando tarea:',
                    error
                );

                throw error;
            }
        },

        /**
         * Completes a task from mechanic workflow.
         * Escalates to admin approval queue with standard system values.
         *
         * @param {string|number} id - Task identifier.
         * @param {Object} reportData - Completion report payload.
         * @returns {Promise<Object>}
         */
        async completeTaskFromMechanic(
            id,
            reportData
        ) {
            this.saving = true;
            this.error = null;

            try {
                const payload = {
                    status:
                    TASK_STATUS.COMPLETED,

                    technicalDiagnosis:
                    reportData.technicalDiagnosis,

                    customerExplanation:
                    reportData.customerExplanation,

                    internalObservation:
                    reportData.internalObservation,

                    evidenceRegistered:
                    reportData.evidenceRegistered,

                    parts: normalizeTaskParts(
                        reportData.parts
                    ),

                    adminReviewStatus:
                    REVIEW_STATUS.SUBMITTED,

                    customerReportStatus:
                    CUSTOMER_VISIBILITY.HIDDEN,

                    completedAt:
                        new Date().toISOString()
                };

                const response = await http.patch(
                    `/tasks/${id}`,
                    payload
                );

                this._updateLocalTask(
                    id,
                    response.data
                );

                return createTask(response.data);
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo completar la tarea.'
                );

                console.error(
                    'Error completando tarea:',
                    error
                );

                throw error;
            } finally {
                this.saving = false;
            }
        },

        /**
         * Saves mechanic task progress.
         *
         * @param {string|number} id - Task identifier.
         * @param {Object} reportData - Partial report payload.
         * @returns {Promise<Object>}
         */
        async saveMechanicAdvance(id, reportData) {
            this.saving = true;
            this.error = null;

            try {
                const payload = {
                    technicalDiagnosis:
                    reportData.technicalDiagnosis,

                    customerExplanation:
                    reportData.customerExplanation,

                    internalObservation:
                    reportData.internalObservation,

                    evidenceRegistered:
                    reportData.evidenceRegistered,

                    parts: normalizeTaskParts(
                        reportData.parts
                    )
                };

                const response = await http.patch(
                    `/tasks/${id}`,
                    payload
                );

                this._updateLocalTask(
                    id,
                    response.data
                );

                return createTask(response.data);
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo guardar el avance de la tarea.'
                );

                console.error(
                    'Error guardando avance de tarea:',
                    error
                );

                throw error;
            } finally {
                this.saving = false;
            }
        },

        /**
         * Approves a completed task.
         * Sets visibility to active client view mode.
         *
         * @param {string|number} id - Task identifier.
         * @returns {Promise<Object>}
         */
        async approveTask(id) {
            this.error = null;

            try {
                const payload = {
                    adminReviewStatus:
                    REVIEW_STATUS.APPROVED,

                    customerReportStatus:
                    CUSTOMER_VISIBILITY.VISIBLE
                };

                const response = await http.patch(
                    `/tasks/${id}`,
                    payload
                );

                this._updateLocalTask(
                    id,
                    response.data
                );

                return createTask(response.data);
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo aprobar la tarea.'
                );

                console.error(
                    'Error aprobando tarea:',
                    error
                );

                throw error;
            }
        },

        /**
         * Rejects a completed task.
         * Sends task back to production workflow under review status.
         *
         * @param {string|number} id - Task identifier.
         * @returns {Promise<Object>}
         */
        async rejectTask(id) {
            this.error = null;

            try {
                const payload = {
                    status:
                    TASK_STATUS.IN_PROGRESS,

                    adminReviewStatus:
                    REVIEW_STATUS.REJECTED
                };

                const response = await http.patch(
                    `/tasks/${id}`,
                    payload
                );

                this._updateLocalTask(
                    id,
                    response.data
                );

                return createTask(response.data);
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo rechazar la tarea.'
                );

                console.error(
                    'Error rechazando tarea:',
                    error
                );

                throw error;
            }
        },

        /**
         * Updates the material request workflow status.
         *
         * @param {string|number} id - Task identifier.
         * @param {string} materialRequestStatus - Material request status.
         * @returns {Promise<Object>}
         */
        async updateMaterialRequestStatus(
            id,
            materialRequestStatus
        ) {
            this.error = null;

            try {
                const response = await http.patch(
                    `/tasks/${id}`,
                    {
                        materialRequestStatus
                    }
                );

                this._updateLocalTask(
                    id,
                    response.data
                );

                return createTask(response.data);
            } catch (error) {
                this.error = getErrorMessage(
                    error,
                    'No se pudo actualizar la solicitud de materiales.'
                );

                console.error(
                    'Error actualizando solicitud de materiales:',
                    error
                );

                throw error;
            }
        },

        /**
         * Updates task locally inside store state.
         *
         * @private
         * @param {string|number} id - Task identifier.
         * @param {Object} data - Updated task data.
         */
        _updateLocalTask(id, data) {
            const index = this.tasks.findIndex(
                task =>
                    String(task.id) ===
                    String(id)
            );

            if (index === -1) {
                return;
            }

            this.tasks.splice(
                index,
                1,
                createTask(data)
            );
        }
    }
});