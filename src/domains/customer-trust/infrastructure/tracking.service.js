import axios from 'axios';
import { API_BASE_URL } from '../../../shared/infrastructure/http-common';

const publicHttp = axios.create({
    baseURL: `${API_BASE_URL}/tracking`,
    headers: { 'Content-type': 'application/json' }
});

export const TrackingService = {
    getOrderByCode(trackingCode) { return publicHttp.get(`/workorders?trackingCode=${trackingCode}`); },
    getVehicle(vehicleId) { return publicHttp.get(`/vehicles/${vehicleId}`); },
    getTasksByOrder(workOrderId) { return publicHttp.get(`/tasks?workOrderId=${workOrderId}`); },
    getCustomer(customerId) { return publicHttp.get(`/customers/${customerId}`); },
    getWorkshop(workshopId) { return publicHttp.get(`/workshops/${workshopId}`); },
    processPayment(workOrderId) { return publicHttp.patch(`/workorders/${workOrderId}`, { status: 'DELIVERED' }); }
};