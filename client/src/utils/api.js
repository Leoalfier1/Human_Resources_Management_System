const rawBase = import.meta.env.VITE_API_BASE_URL;

export const API_BASE = rawBase.replace(/\/+$/, '');
export const SERVER_BASE = API_BASE.replace(/\/api$/, '');
export const SOCKET_URL = "http://localhost:5000"; // or wherever your Socket.IO server runs

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_BASE}/api${endpoint}`, { ...options, headers });
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

// REST-style convenience wrappers around apiFetch. All of these return the
// raw Response object (same as apiFetch), so existing `response.ok` /
// `response.json()` call sites keep working unchanged.
export const apiGet = apiFetch;

export const apiPost = (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    return apiFetch(endpoint, {
        ...options,
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body),
    });
};

export const apiPut = (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    return apiFetch(endpoint, {
        ...options,
        method: 'PUT',
        body: isFormData ? body : JSON.stringify(body),
    });
};

export const apiPatch = (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    return apiFetch(endpoint, {
        ...options,
        method: 'PATCH',
        body: isFormData ? body : JSON.stringify(body),
    });
};

export const apiDelete = (endpoint, options = {}) => {
    return apiFetch(endpoint, {
        ...options,
        method: 'DELETE',
    });
};

// Consolidated object form, for files that do:
//   import { api } from '../../utils/api';
//   api.get(...) / api.post(...) / api.put(...) / api.patch(...) / api.delete(...)
export const api = {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    patch: apiPatch,
    delete: apiDelete,
};

export const downloadFile = async (endpoint, filename) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Download failed' }));
        throw new Error(err.message || 'Download failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};