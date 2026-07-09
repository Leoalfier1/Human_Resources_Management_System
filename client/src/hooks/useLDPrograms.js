import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

export const useLDPrograms = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPrograms = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE}/api/ld/programs?${q}`, { headers: headers() });
            if (res.ok) {
                setPrograms(await res.json());
                setError(null);
            } else {
                setError('Failed to load programs');
            }
        } catch (e) {
            setError('Server unreachable');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrograms();
        const socket = io(API_BASE);
        socket.on('ld:dashboard:update', () => fetchPrograms());
        return () => socket.disconnect();
    }, [fetchPrograms]);

    const getProgramById = async (id) => {
        const res = await fetch(`${API_BASE}/api/ld/programs/${id}`, { headers: headers() });
        if (!res.ok) throw new Error('Failed to fetch program');
        return res.json();
    };

    const createProgram = async (data) => {
        const res = await fetch(`${API_BASE}/api/ld/programs`, {
            method: 'POST', headers: headers(), body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error((await res.json()).message);
        fetchPrograms();
        return res.json();
    };

    const updateProgram = async (id, data) => {
        const res = await fetch(`${API_BASE}/api/ld/programs/${id}`, {
            method: 'PATCH', headers: headers(), body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error((await res.json()).message);
        fetchPrograms();
        return res.json();
    };

    const updateStatus = async (id, status) => {
        const res = await fetch(`${API_BASE}/api/ld/programs/${id}/status`, {
            method: 'PATCH', headers: headers(), body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        fetchPrograms();
        return res.json();
    };

    const markAttendance = async (id, status) => {
        const res = await fetch(`${API_BASE}/api/ld/programs/attendance/${id}`, {
            method: 'PATCH', headers: headers(), body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    };

    const uploadFile = async (url, file, fieldName = 'file') => {
        const formData = new FormData();
        formData.append(fieldName, file);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token()}` },
            body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    };

    return { programs, loading, error, refresh: fetchPrograms, getProgramById, createProgram, updateProgram, updateStatus, markAttendance, uploadFile };
};
