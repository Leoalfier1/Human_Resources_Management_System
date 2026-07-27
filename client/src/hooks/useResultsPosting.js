import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

export const useResultsPosting = (vacancyId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/rsp/results/preview?vacancy_id=${vacancyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setData(json);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const publish = async () => {
        setIsPublishing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/rsp/results/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ vacancy_id: vacancyId })
            });
            if (res.ok) fetchData();
        } catch (e) { console.error(e); }
        finally { setIsPublishing(false); }
    };

    useEffect(() => { if (vacancyId) fetchData(); }, [vacancyId]);

    return { data, loading, publish, isPublishing };
};