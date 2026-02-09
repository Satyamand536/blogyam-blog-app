import axios from 'axios';

// Backend base URL (Automatic detection for monorepo deployment)
const rawUrl = (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')).trim();
export const API_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true, // Required for cookie-based auth
    timeout: 30000,        // Increased to 30s for production resilience and cold starts
    headers: {
        // Axios will automatically set the correct Content-Type for FormData
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
