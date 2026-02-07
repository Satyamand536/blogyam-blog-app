import axios from 'axios';

export const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;
