import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../utils/api';

export const useInitialEvaluation = (vacancyId) => {
    const [queueData, setQueueData] = useState(null);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [details, setDetails] = useState({ criteria: [], documents: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchQueue = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/queue?vacancy_id=${vacancyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Failed to load evaluation queue (HTTP ${res.status})`);
            const data = await res.json();
            setQueueData(data);
            setError(null);
            if (data.queue.length > 0 && !selectedApplicant) {
                setSelectedApplicant(data.queue[0]);
            }
        } catch (err) {
            console.error('Evaluation queue fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [vacancyId, selectedApplicant]);

    const fetchDetails = useCallback(async (id) => {
        const token = localStorage.getItem('token');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/applicant/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Failed to load applicant details (HTTP ${res.status})`);
            const data = await res.json();
            setDetails(data);
            setError(null);
        } catch (err) {
            console.error('Applicant details fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const silentFetchDetails = useCallback(async (id) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/applicant/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            setDetails(data);
        } catch { /* silent — best-effort background refresh */ }
    }, []);

    useEffect(() => { if (vacancyId) { setLoading(true); setError(null); fetchQueue(); } }, [vacancyId, fetchQueue]);
    useEffect(() => { if (selectedApplicant) fetchDetails(selectedApplicant.id); }, [selectedApplicant, fetchDetails]);

    return { queueData, selectedApplicant, setSelectedApplicant, details, setDetails, fetchQueue, fetchDetails, silentFetchDetails, loading, error };
};
