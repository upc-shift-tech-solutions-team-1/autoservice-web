import http from '../../../../shared/infrastructure/http-common';

export default {
    async getAll() {
        const response = await http.get('/appointments');
        return response.data;
    },
    async create(data) {
        const response = await http.post('/appointments', data);
        return response.data;
    }
}