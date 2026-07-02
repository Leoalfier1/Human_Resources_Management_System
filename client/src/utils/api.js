const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const API_BASE = rawBase.replace(/\/+$/, '');
export const SERVER_BASE = API_BASE.replace(/\/api$/, 'http://localhost:5000');

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
            return;
        }
        return response;
    } catch (err) {
        console.error("Network Error:", err);
        alert("Cannot reach the HRMIS Server. Please ensure the backend is running on port 5000.");
        throw err;
    }
};
