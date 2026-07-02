export const apiFetch = async (endpoint, options = {}) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
        
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
            return;
        }

        return response;
    } catch (err) {
        // Step 5: Catch Network errors (ERR_CONNECTION_REFUSED)
        console.error("Network Error:", err);
        alert("🚨 Cannot reach the HRMIS Server. Please ensure the backend is running on port 5000.");
        throw err;
    }
};