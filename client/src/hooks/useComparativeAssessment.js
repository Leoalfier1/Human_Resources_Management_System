import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const API = 'http://localhost:5000';

export const useComparativeAssessment = () => {
    const [vacancies, setVacancies] = useState([]);
    const [vacancyId, setVacancyId] = useState(null);
    const [criteria, setCriteria] = useState([]);
    const [applicants, setApplicants] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [scores, setScores] = useState({}); // { criterion_id: score_given }
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const socketRef = useRef(null);

    const token = () => localStorage.getItem('token');
    const authHeader = () => ({ 'Authorization': `Bearer ${token()}` });

    // Fetch vacancies on mount
    useEffect(() => {
        const fetchVacancies = async () => {
            try {
                const res = await fetch(`${API}/api/rsp/vacancies`, { headers: authHeader() });
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setVacancies(list);
                if (list.length > 0) setVacancyId(list[0].id);
            } catch (e) {
                console.error('Failed to fetch vacancies:', e);
                setError('Could not load vacancies.');
                setLoading(false);
            }
        };
        fetchVacancies();
    }, []);

    // Fetch criteria + applicants + rankings when vacancyId changes
    // isSilent=true skips the loading flag so socket-triggered refreshes don't blank the screen
    const fetchCriteriaAndApplicants = useCallback(async (isSilent = false) => {
        if (!vacancyId) return;
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const [critRes, appRes, rankRes] = await Promise.all([
                fetch(`${API}/api/rsp/comparative-assessment/criteria?vacancy_id=${vacancyId}`, { headers: authHeader() }),
                fetch(`${API}/api/rsp/applicants?vacancy_id=${vacancyId}&status=qualified`, { headers: authHeader() }),
                fetch(`${API}/api/rsp/comparative-assessment/rankings?vacancy_id=${vacancyId}`, { headers: authHeader() })
            ]);

            const criteriaData = critRes.ok ? await critRes.json() : [];
            setCriteria(Array.isArray(criteriaData) ? criteriaData : []);

            const appData = appRes.ok ? await appRes.json() : {};
            const apps = Array.isArray(appData.applicants) ? appData.applicants : [];
            setApplicants(apps);

            const rankData = rankRes.ok ? await rankRes.json() : [];
            setRankings(Array.isArray(rankData) ? rankData : []);

            // Auto-select first applicant
            if (apps.length > 0) {
                setSelectedAppId(prev => prev !== null && apps.find(a => a.id === prev) ? prev : apps[0].id);
            } else {
                setSelectedAppId(null);
            }
        } catch (e) {
            console.error('Failed to load assessment data:', e);
            setError('Could not load assessment data.');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [vacancyId]);

    useEffect(() => {
        fetchCriteriaAndApplicants();
    }, [fetchCriteriaAndApplicants]);

    // Fetch individual criterion scores when selected applicant changes
    useEffect(() => {
        if (!selectedAppId) { setScores({}); return; }
        const fetchScores = async () => {
            try {
                const res = await fetch(`${API}/api/rsp/comparative-assessment/scores?applicant_id=${selectedAppId}`, { headers: authHeader() });
                const data = res.ok ? await res.json() : {};
                setScores(typeof data === 'object' && !Array.isArray(data) ? data : {});
            } catch (e) {
                console.error('Failed to load scores:', e);
                setScores({});
            }
        };
        fetchScores();
    }, [selectedAppId]);

    // Socket.IO for live updates — runs silently so it doesn't blank the screen on every score submit
    useEffect(() => {
        if (!vacancyId) return;
        if (socketRef.current) socketRef.current.disconnect();
        const socket = io(API);
        socketRef.current = socket;
        socket.on(`rsp:ca:scoreUpdate:${vacancyId}`, () => fetchCriteriaAndApplicants(true));
        return () => socket.disconnect();
    }, [vacancyId, fetchCriteriaAndApplicants]);

    const refreshRankings = useCallback(async () => {
        if (!vacancyId) return;
        try {
            const res = await fetch(`${API}/api/rsp/comparative-assessment/rankings?vacancy_id=${vacancyId}`, { headers: authHeader() });
            const data = res.ok ? await res.json() : [];
            setRankings(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
    }, [vacancyId]);

    const refreshScores = useCallback(async () => {
        if (!selectedAppId) return;
        try {
            const res = await fetch(`${API}/api/rsp/comparative-assessment/scores?applicant_id=${selectedAppId}`, { headers: authHeader() });
            const data = res.ok ? await res.json() : {};
            setScores(typeof data === 'object' && !Array.isArray(data) ? data : {});
        } catch (e) { console.error(e); }
    }, [selectedAppId]);

    // Finalize the assessment: advances the vacancy to Stage 7 (Results Posting)
    const submitAssessment = useCallback(async () => {
        if (!vacancyId) return { success: false, message: 'No vacancy selected.' };
        try {
            const res = await fetch(`${API}/api/rsp/comparative-assessment/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ vacancy_id: vacancyId })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, message: data.message || 'Failed to submit assessment.' };
            await fetchCriteriaAndApplicants(true);
            return { success: true, message: data.message };
        } catch (e) {
            console.error('Failed to submit assessment:', e);
            return { success: false, message: 'Network error while submitting assessment.' };
        }
    }, [vacancyId, fetchCriteriaAndApplicants]);

    // Clears all scores for the current vacancy so HRMPSB can re-score from scratch
    const resetScores = useCallback(async () => {
        if (!vacancyId) return { success: false, message: 'No vacancy selected.' };
        try {
            const res = await fetch(`${API}/api/rsp/comparative-assessment/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ vacancy_id: vacancyId })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, message: data.message || 'Failed to reset scores.' };
            await fetchCriteriaAndApplicants(true);
            return { success: true, message: data.message };
        } catch (e) {
            console.error('Failed to reset scores:', e);
            return { success: false, message: 'Network error while resetting scores.' };
        }
    }, [vacancyId, fetchCriteriaAndApplicants]);

    return {
        vacancies, vacancyId, setVacancyId,
        criteria, applicants, rankings, scores,
        selectedAppId, setSelectedAppId,
        loading, error,
        refresh: fetchCriteriaAndApplicants,
        refreshRankings,
        refreshScores,
        submitAssessment,
        resetScores,
    };
};