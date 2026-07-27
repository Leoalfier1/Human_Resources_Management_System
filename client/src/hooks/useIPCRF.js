import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

export const useIPCRF = (periodId) => {
    const [commitment, setCommitment] = useState(null);
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = periodId ? `?period_id=${periodId}` : '';
            const res = await fetch(`${API_BASE}/api/pm/commitments/my${params}`, { headers: headers() });
            if (res.ok) {
                const rows = await res.json();
                if (rows.length > 0) {
                    const detailRes = await fetch(`${API_BASE}/api/pm/commitments/${rows[0].id}`, { headers: headers() });
                    if (detailRes.ok) {
                        const detail = await detailRes.json();
                        setCommitment(detail);
                        setTargets(detail.targets || []);
                    }
                } else {
                    setCommitment(null);
                    setTargets([]);
                }
                setError(null);
            } else setError('Failed to load IPCRF');
        } catch (e) { setError('Server unreachable'); }
        finally { setLoading(false); }
    }, [periodId]);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('pm:dashboard:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    const save = async (data) => {
        if (!commitment) {
            const createRes = await fetch(`${API_BASE}/api/pm/commitments`, {
                method: 'POST', headers: headers(), body: JSON.stringify({ period_id: periodId })
            });
            if (!createRes.ok) throw new Error((await createRes.json()).message);
            const created = await createRes.json();
            setCommitment(prev => ({ ...prev, id: created.id }));
        }
        const id = commitment?.id;
        const res = await fetch(`${API_BASE}/api/pm/commitments/${id}`, {
            method: 'PATCH', headers: headers(), body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error((await res.json()).message);
        await fetchData();
    };

    const submit = async () => {
        const res = await fetch(`${API_BASE}/api/pm/commitments/${commitment?.id}/submit`, {
            method: 'POST', headers: headers()
        });
        if (!res.ok) throw new Error((await res.json()).message);
        await fetchData();
    };

    return { commitment, targets, loading, error, refresh: fetchData, save, submit };
};
