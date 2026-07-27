import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

export const usePMDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [periodsRes, summaryRes] = await Promise.all([
                fetch(`${API_BASE}/api/pm/periods`, { headers: headers() }),
                fetch(`${API_BASE}/api/pm/ratings/summary`, { headers: headers() }),
            ]);
            if (periodsRes.ok && summaryRes.ok) {
                const periods = await periodsRes.json();
                const summary = await summaryRes.json();
                setData({ periods, summary });
                setError(null);
            } else if (!silent) setError('Failed to load PM data');
        } catch (e) { if (!silent) setError('Server unreachable'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('pm:dashboard:update', () => fetchData(true));
        return () => socket.disconnect();
    }, [fetchData]);

    return { data, loading, error, refresh: () => fetchData(false) };
};
