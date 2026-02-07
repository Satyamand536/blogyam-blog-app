import axios from 'axios';

// API_URL is used for static assets (images) and should NOT have /api suffix or trailing slash
const rawUrl = (import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim();
export const API_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;
