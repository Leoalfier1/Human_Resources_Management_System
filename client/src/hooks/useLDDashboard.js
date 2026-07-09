import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

export const useLDDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [plansRes, programsRes] = await Promise.all([
                fetch(`${API_BASE}/api/ld/plans`, { headers: headers() }),
                fetch(`${API_BASE}/api/ld/programs`, { headers: headers() })
            ]);
            if (plansRes.ok && programsRes.ok) {
                const plans = await plansRes.json();
                const programs = await programsRes.json();
                const totalHours = programs.reduce((s, p) => s + (parseFloat(p.duration_hours) || 0), 0);
                const statusCounts = { planned: 0, ongoing: 0, completed: 0, cancelled: 0 };
                programs.forEach(p => { if (statusCounts[p.status] !== undefined) statusCounts[p.status]++; });
                const personnelTrained = programs.filter(p => p.status === 'completed').length > 0
                    ? programs.filter(p => p.status === 'completed').reduce((s, p) => s + (parseInt(p.present_count) || 0), 0) : 0;
                setData({
                    plans,
                    programs,
                    stats: {
                        activeTnaForms: 0,
                        programsInLDP: plans.reduce((s, p) => s + (parseInt(p.program_count) || 0), 0),
                        totalTrainingHours: totalHours,
                        personnelTrained
                    },
                    statusCounts,
                    planCount: plans.length,
                    programCount: programs.length
                });
                setError(null);
            } else {
                if (!silent) setError('Failed to load L&D data');
            }
        } catch (e) {
            if (!silent) setError('Server unreachable');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('ld:dashboard:update', () => fetchData(true));
        return () => socket.disconnect();
    }, [fetchData]);

    return { data, loading, error, refresh: () => fetchData(false) };
};
