const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const api = (path, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
};

export const apiGet = (path) => api(path);

export const apiPost = (path, body) =>
  api(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });

export const apiPut = (path, body) =>
  api(path, { method: 'PUT', body: JSON.stringify(body) });

export const apiDelete = (path) => api(path, { method: 'DELETE' });

export { API_BASE, SOCKET_URL };
