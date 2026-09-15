import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://autoservice-aw-backend.onrender.com/api/v1';

export const API_BASE_URL = baseURL;

const http = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

http.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default http;
