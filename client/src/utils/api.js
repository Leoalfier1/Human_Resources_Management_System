const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const cleanBase = rawBase.replace(/\/+$/, '').replace(/\/api$/, '');
export const API_BASE = cleanBase;
export const SERVER_BASE = cleanBase;

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let path = endpoint || '';
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    if (!path.startsWith('/api/') && path !== '/api') {
        path = '/api' + path;
    }

    const url = `${API_BASE}${path}`;

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            if (!path.includes('/auth/login')) {
                const existingToken = localStorage.getItem('token');
                if (existingToken) {
                    console.warn(`[Auth Auto-Heal] Stale token session returned ${response.status} for ${path}. Clearing local token cache.`);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            return response;
        }
        return response;
    } catch (err) {
        console.error("Network Error:", err);
        throw err;
    }
};
