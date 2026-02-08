import axios from 'axios';

// Backend base URL (no /api suffix, no trailing slash)
const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').trim();
export const API_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true, // Required for cookie-based auth
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Error logging (optional, helpful for debugging)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error?.response?.status, error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;
