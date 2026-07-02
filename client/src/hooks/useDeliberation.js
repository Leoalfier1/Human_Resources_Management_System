import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../utils/api';

export const useDeliberation = (vacancyId) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEndorsing, setIsEndorsing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!vacancyId) return;
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/rsp/deliberation/ranked-list?vacancy_id=${vacancyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setData(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error('Failed to load deliberation list:', e);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [vacancyId]);

    const updateBI = async (applicant_id, notes) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/rsp/deliberation/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ applicant_id, background_investigation_notes: notes })
            });
            if (!res.ok) {
                const err = await res.json();
                console.error('Failed to save notes:', err.message);
                return false;
            }
            return true;
        } catch (e) {
            console.error('Failed to save notes:', e);
            return false;
        }
    };

    const recommend = async (applicant_id, val) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/rsp/deliberation/recommend`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ applicant_id, is_recommended: val })
            });
            if (!res.ok) {
                const err = await res.json();
                console.error('Failed to update recommendation:', err.message);
                return false;
            }
            await fetchData();
            return true;
        } catch (e) {
            console.error('Failed to update recommendation:', e);
            return false;
        }
    };

    const endorse = async () => {
        if (!vacancyId) return { success: false, message: 'No vacancy selected.' };
        setIsEndorsing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/rsp/deliberation/endorse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ vacancy_id: vacancyId })
            });
            const json = await res.json();
            if (!res.ok) {
                return { success: false, message: json.message || 'Failed to endorse shortlist.' };
            }
            await fetchData();
            return { success: true, message: json.message };
        } catch (e) {
            console.error('Failed to endorse shortlist:', e);
            return { success: false, message: 'Network error while endorsing shortlist.' };
        } finally {
            setIsEndorsing(false);
        }
    };

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, loading, updateBI, recommend, endorse, isEndorsing, refresh: fetchData };
};