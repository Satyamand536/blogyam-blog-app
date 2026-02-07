import axios from 'axios';

// 🔹 Backend base URL (NO /api here, NO trailing slash)
const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').trim();

export const API_URL = rawUrl
  .replace(/\/api\/?$/, '') // remove accidental /api
  .replace(/\/$/, '');      // remove trailing slash

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // ✅ REQUIRED for cookie-based auth
  timeout: 15000,        // ✅ safety: avoid hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔹 Optional: global response error visibility (debug friendly)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      '❌ API ERROR:',
      error?.response?.status,
      error?.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default api;
