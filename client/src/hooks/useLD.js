import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

// ───── TNA FORMS ───────────────────────────────────────────────

export const useTNAForms = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE}/api/ld/tna${q ? '?' + q : ''}`, { headers: headers() });
            if (res.ok) { setForms(await res.json()); setError(null); }
            else setError('Failed to load TNA forms');
        } catch (e) { setError('Server unreachable'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('ld:dashboard:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    const getById = async (id) => {
        const res = await fetch(`${API_BASE}/api/ld/tna/${id}`, { headers: headers() });
        if (!res.ok) throw new Error('Failed to fetch form');
        return res.json();
    };

    const create = async (data) => {
        const res = await fetch(`${API_BASE}/api/ld/tna`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const update = async (id, data) => {
        const res = await fetch(`${API_BASE}/api/ld/tna/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const remove = async (id) => {
        const res = await fetch(`${API_BASE}/api/ld/tna/${id}`, { method: 'DELETE', headers: headers() });
        if (!res.ok) throw new Error('Failed to delete');
        fetchData();
    };

    return { forms, loading, error, fetch: fetchData, getById, create, update, remove };
};

// ───── TNA RESPONSES ───────────────────────────────────────────

export const useTNAResponses = () => {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchResponses = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE}/api/ld/tna-responses${q ? '?' + q : ''}`, { headers: headers() });
            if (res.ok) setResponses(await res.json());
        } catch (e) { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    return { responses, loading, fetchResponses };
};

// ───── OBJECTIVES ──────────────────────────────────────────────

export const useObjectives = () => {
    const [objectives, setObjectives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE}/api/ld/objectives${q ? '?' + q : ''}`, { headers: headers() });
            if (res.ok) { setObjectives(await res.json()); setError(null); }
            else setError('Failed to load objectives');
        } catch (e) { setError('Server unreachable'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('ld:dashboard:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    const create = async (data) => {
        const res = await fetch(`${API_BASE}/api/ld/objectives`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const update = async (id, data) => {
        const res = await fetch(`${API_BASE}/api/ld/objectives/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const remove = async (id) => {
        await fetch(`${API_BASE}/api/ld/objectives/${id}`, { method: 'DELETE', headers: headers() });
        fetchData();
    };

    return { objectives, loading, error, fetch: fetchData, create, update, remove };
};

// ───── PLANS ───────────────────────────────────────────────────

export const usePlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE}/api/ld/plans${q ? '?' + q : ''}`, { headers: headers() });
            if (res.ok) { setPlans(await res.json()); setError(null); }
            else setError('Failed to load plans');
        } catch (e) { setError('Server unreachable'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('ld:dashboard:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    const create = async (data) => {
        const res = await fetch(`${API_BASE}/api/ld/plans`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const update = async (id, data) => {
        const res = await fetch(`${API_BASE}/api/ld/plans/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const remove = async (id) => {
        await fetch(`${API_BASE}/api/ld/plans/${id}`, { method: 'DELETE', headers: headers() });
        fetchData();
    };

    return { plans, loading, error, fetch: fetchData, create, update, remove };
};

// ───── TRAININGS (IMPLEMENTATION) ─────────────────────────────

export const useTrainings = () => {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE}/api/ld/trainings${q ? '?' + q : ''}`, { headers: headers() });
            if (res.ok) { setTrainings(await res.json()); setError(null); }
            else setError('Failed to load trainings');
        } catch (e) { setError('Server unreachable'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('ld:dashboard:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    const getById = async (id) => {
        const res = await fetch(`${API_BASE}/api/ld/trainings/${id}`, { headers: headers() });
        if (!res.ok) throw new Error('Failed to fetch training');
        return res.json();
    };

    const create = async (data) => {
        const res = await fetch(`${API_BASE}/api/ld/trainings`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const update = async (id, data) => {
        const res = await fetch(`${API_BASE}/api/ld/trainings/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const remove = async (id) => {
        await fetch(`${API_BASE}/api/ld/trainings/${id}`, { method: 'DELETE', headers: headers() });
        fetchData();
    };

    return { trainings, loading, error, fetch: fetchData, getById, create, update, remove };
};

// ───── EVALUATIONS ────────────────────────────────────────────

export const useEvaluations = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE}/api/ld/evaluations${q ? '?' + q : ''}`, { headers: headers() });
            if (res.ok) setEvaluations(await res.json());
        } catch (e) { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    const submit = async (data) => {
        const res = await fetch(`${API_BASE}/api/ld/evaluations`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    return { evaluations, loading, fetch: fetchData, submit };
};

// ───── APPLICANT-FACING ───────────────────────────────────────

export const useLDApplicant = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/ld/applicant/dashboard`, { headers: headers() });
            if (res.ok) setData(await res.json());
        } catch (e) { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('ld:dashboard:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    const submitTNA = async (payload) => {
        const res = await fetch(`${API_BASE}/api/ld/submit-tna`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).message);
        fetchData();
        return res.json();
    };

    const getMyTnaResponse = async (tna_form_id) => {
        const res = await fetch(`${API_BASE}/api/ld/my-tna-response?tna_form_id=${tna_form_id}`, { headers: headers() });
        if (!res.ok) return null;
        return res.json();
    };

    const registerTraining = async (training_id) => {
        const res = await fetch(`${API_BASE}/api/ld/register-training`, { method: 'POST', headers: headers(), body: JSON.stringify({ training_id }) });
        if (!res.ok) throw new Error((await res.json()).message);
        fetchData();
        return res.json();
    };

    const submitEval = async (payload) => {
        const res = await fetch(`${API_BASE}/api/ld/evaluations`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    return { data, loading, fetch: fetchData, submitTNA, getMyTnaResponse, registerTraining, submitEval };
};
