import { API_URL } from '../api/axios';

export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${API_URL}${path}`;
};
