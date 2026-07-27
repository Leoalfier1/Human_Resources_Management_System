import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

export const useRRDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/rr/reports/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const json = await response.json();
                setData(json);
                setError(null);
            } else {
                const errData = await response.json().catch(() => ({}));
                if (!isSilent) setError(errData.message || 'Failed to fetch dashboard data.');
            }
        } catch (err) {
            console.error('RR Dashboard Fetch Error:', err);
            if (!isSilent) setError('Cannot reach the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('connect', () => console.log('📡 RR Dashboard connected to real-time events'));
        socket.on('rr:dashboard:update', () => fetchData(true));
        return () => socket.disconnect();
    }, [fetchData]);

    return { data, loading, error, refresh: () => fetchData(false) };
};
