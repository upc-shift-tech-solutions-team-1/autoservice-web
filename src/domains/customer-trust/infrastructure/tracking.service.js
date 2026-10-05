import axios from 'axios';
import { API_BASE_URL } from '../../../shared/infrastructure/http-common';

const publicHttp = axios.create({
    baseURL: `${API_BASE_URL}/tracking`,
    headers: { 'Content-type': 'application/json' }
});

export const TrackingService = {
    getOrderByCode(trackingCode) {
        return publicHttp.get('/workorders', { params: { trackingCode } });
    },
    getSummaryByCode(trackingCode) {
        return publicHttp.get('/summary', { params: { trackingCode } });
    },
    getVehicle(vehicleId) { return publicHttp.get(`/vehicles/${vehicleId}`); },
    getCustomer(customerId) { return publicHttp.get(`/customers/${customerId}`); },
    getWorkshop(workshopId) { return publicHttp.get(`/workshops/${workshopId}`); }
};
