import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

export const useTNA = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchForms = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE}/api/ld/tna/my/list?${q}`, { headers: headers() });
            if (res.ok) {
                setForms(await res.json());
                setError(null);
            } else {
                setError('Failed to load TNA forms');
            }
        } catch (e) {
            setError('Server unreachable');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchForms();
        const socket = io(API_BASE);
        socket.on('ld:dashboard:update', () => fetchForms());
        return () => socket.disconnect();
    }, [fetchForms]);

    const getFormDetail = async (id) => {
        const res = await fetch(`${API_BASE}/api/ld/tna/my/${id}`, { headers: headers() });
        if (!res.ok) throw new Error('Failed to fetch form');
        return res.json();
    };

    const saveResponse = async (form_id, answers) => {
        const res = await fetch(`${API_BASE}/api/ld/tna/my/save`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify({ form_id, answers })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const submitResponse = async (form_id, answers) => {
        const res = await fetch(`${API_BASE}/api/ld/tna/my/submit`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ form_id, answers })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        fetchForms();
        return res.json();
    };

    return { forms, loading, error, refresh: fetchForms, getFormDetail, saveResponse, submitResponse };
};
