/**
 * @file work-order.store.js
 * @description Work order state management store.
 */

import { defineStore } from 'pinia';
import http from '../../../shared/infrastructure/http-common';
import { createWorkOrder } from '../domain/work-order.entity';
import { WorkOrderService } from '../infrastructure/work-order.service';

export const useWorkOrderStore = defineStore('workOrder', {
    state: () => ({
        workOrders: [],
        loading: false
    }),

    actions: {
        async fetchWorkOrders() {
            this.loading = true;
            try {
                const response = await WorkOrderService.getAll();
                this.workOrders = response.data.map((workOrder) =>
                    createWorkOrder(workOrder)
                );
            } finally {
                this.loading = false;
            }
        },

        async addWorkOrder(woData) {
            this.loading = true;
            try {
                const safeVehicleId = parseInt(woData.vehicleId, 10);
                const safeCustomerId = parseInt(woData.customerId, 10);
                const safeMechanicId = parseInt(woData.mechanicId, 10);

                let dateString = new Date().toISOString().split('T')[0];

                if (woData.estimatedDate) {
                    if (woData.estimatedDate instanceof Date) {
                        dateString = woData.estimatedDate.toISOString().split('T')[0];
                    } else {
                        dateString = String(woData.estimatedDate).split('T')[0];
                    }
                }

                const payload = {
                    vehicleId: safeVehicleId,
                    customerId: safeCustomerId,
                    mechanicId: safeMechanicId,
                    description: woData.description || '-',
                    estimatedDate: dateString,
                    status: 'PENDING'
                };

                const response = await WorkOrderService.create(payload);
                const createdOrder = response.data;

                this.workOrders.push(createWorkOrder(createdOrder));
                return createdOrder;
            } finally {
                this.loading = false;
            }
        },

        async updateOrderAutoPrice(id, calculatedTotal) {
            const existingOrder = this.workOrders.find(
                (workOrder) => String(workOrder.id) === String(id)
            );

            if (!existingOrder) {
                return;
            }

            let newStatus = existingOrder.status;
            if (newStatus === 'PENDING') {
                newStatus = 'IN_PROGRESS';
            }

            const payload = {
                description: existingOrder.description,
                estimatedDate: existingOrder.estimatedDate,
                price: parseFloat(calculatedTotal),
                status: newStatus,
                tasksCompleted: existingOrder.qaChecklist?.tasksCompleted || false,
                sparePartsChecked: existingOrder.qaChecklist?.sparePartsChecked || false,
                diagnosisValidated: existingOrder.qaChecklist?.diagnosisValidated || false,
                cleaningDone: existingOrder.qaChecklist?.cleaningDone || false,
                finalTestDone: existingOrder.qaChecklist?.finalTestDone || false
            };

            const response = await http.put(`/workorders/${id}`, payload);
            this._updateLocalOrder(id, response.data);
        },

        async updateWorkOrderChecklist(id, updateData) {
            const payload = {
                description: updateData.description,
                estimatedDate: updateData.estimatedDate,
                price: updateData.price,
                status: updateData.status,
                tasksCompleted: updateData.qaChecklist?.tasksCompleted || false,
                sparePartsChecked: updateData.qaChecklist?.sparePartsChecked || false,
                diagnosisValidated: updateData.qaChecklist?.diagnosisValidated || false,
                cleaningDone: updateData.qaChecklist?.cleaningDone || false,
                finalTestDone: updateData.qaChecklist?.finalTestDone || false
            };

            const response = await http.put(`/workorders/${id}`, payload);
            this._updateLocalOrder(id, response.data);
            return response.data;
        },

        _updateLocalOrder(id, data) {
            const index = this.workOrders.findIndex(
                (workOrder) => String(workOrder.id) === String(id)
            );
            if (index === -1) {
                return;
            }
            this.workOrders.splice(index, 1, createWorkOrder(data));
        }
    }
});