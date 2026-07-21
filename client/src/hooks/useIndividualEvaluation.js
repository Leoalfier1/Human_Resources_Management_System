import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../utils/api';

const API = API_BASE;

const debounce = (fn, ms) => {
    let timer;
    const debounced = (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
};

export const useIndividualEvaluation = () => {
    const [activeCategory, setActiveCategory] = useState('teaching');
    const [queue, setQueue] = useState([]);
    const [selectedApplicantId, setSelectedApplicantId] = useState(null);
    const [evaluation, setEvaluation] = useState(null);
    const [localScores, setLocalScores] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [loadingEvaluation, setLoadingEvaluation] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const socketRef = useRef(null);
    const localScoresRef = useRef({});

    const token = () => localStorage.getItem('token');
    const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

    // ─── Fetch queue for active category ───
    const fetchQueue = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/rsp/ies/queue?category=${activeCategory}`, { headers: authHeaders() });
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to load queue');
            const data = await res.json();
            setQueue(data);
            if (data.length > 0) {
                setSelectedApplicantId(prev => {
                    const stillExists = data.find(q => q.applicationId === prev);
                    return stillExists ? prev : data[0].applicationId;
                });
            } else {
                setSelectedApplicantId(null);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [activeCategory]);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    // ─── Fetch evaluation when applicant is selected ───
    const fetchEvaluation = useCallback(async (applicationId) => {
        if (!applicationId) { setEvaluation(null); return; }
        setLoadingEvaluation(true);
        setError(null);
        try {
            // First try GET by application ID (finds or returns null)
            let res = await fetch(`${API}/api/rsp/ies/applicant/${applicationId}`, { headers: authHeaders() });
            if (res.status === 404) {
                // Create a new evaluation for this application
                res = await fetch(`${API}/api/rsp/ies/${applicationId}`, { method: 'POST', headers: authHeaders() });
            }
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to load evaluation');
            const data = await res.json();
            setEvaluation(data);
            localScoresRef.current = {};
            setLocalScores({});
        } catch (e) {
            setError(e.message);
            setEvaluation(null);
        } finally {
            setLoadingEvaluation(false);
        }
    }, []);

    useEffect(() => {
        if (selectedApplicantId) fetchEvaluation(selectedApplicantId);
    }, [selectedApplicantId, fetchEvaluation]);

    // ─── Socket.IO for live updates ───
    useEffect(() => {
        const socket = io(API);
        socketRef.current = socket;

        socket.on('ies:status-changed', (payload) => {
            if (evaluation && payload.iesId === evaluation.id) {
                setEvaluation(prev => prev ? { ...prev, status: payload.status, total_score: payload.totalScore ?? prev.total_score } : prev);
            }
            fetchQueue(true);
        });

        socket.on('ies:score-updated', (payload) => {
            if (evaluation && payload.iesId === evaluation.id) {
                setEvaluation(prev => prev ? { ...prev, total_score: payload.totalScore } : prev);
            }
        });

        return () => { socket.disconnect(); };
    }, [evaluation?.id, fetchQueue]);

    // Join IES room when evaluation is loaded
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !evaluation) return;
        socket.emit('join-ies-room', `ies-${evaluation.id}`);
        return () => { socket.emit('leave-ies-room', `ies-${evaluation.id}`); };
    }, [evaluation?.id]);

    // ─── Score change (local) ───
    const handleScoreChange = useCallback((criteriaKey, field, value) => {
        setLocalScores(prev => ({
            ...prev,
            [criteriaKey]: { ...(prev[criteriaKey] || {}), [field]: value }
        }));
        localScoresRef.current = {
            ...localScoresRef.current,
            [criteriaKey]: { ...(localScoresRef.current[criteriaKey] || {}), [field]: value }
        };
    }, []);

    // ─── Commit scores to server (debounced) ───
    const commitScores = useCallback(async () => {
        if (!evaluation) return;
        const edits = localScoresRef.current;
        if (Object.keys(edits).length === 0) return;

        const scoresPayload = evaluation.criteria.map(c => {
            const edit = edits[c.criteria_key] || {};
            const finalScore = edit.actual_score !== undefined 
                ? (edit.actual_score === null || edit.actual_score === '' ? null : Number(edit.actual_score))
                : (c.actual_score !== null ? Number(c.actual_score) : null);
            return {
                criteria_key: c.criteria_key,
                qualification_notes: edit.qualification_notes !== undefined ? edit.qualification_notes : (c.qualification_notes || ''),
                computation_notes: edit.computation_notes !== undefined ? edit.computation_notes : (c.computation_notes || ''),
                actual_score: finalScore
            };
        });

        setSaving(true);
        try {
            const res = await fetch(`${API}/api/rsp/ies/${evaluation.id}/scores`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ scores: scoresPayload })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Save failed');
            setEvaluation(data);
            localScoresRef.current = {};
            setLocalScores({});
            fetchQueue(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }, [evaluation, fetchQueue]);

    const debouncedSave = useMemo(() => debounce(commitScores, 800), [commitScores]);

    const handleSaveNow = useCallback(() => {
        debouncedSave.cancel();
        commitScores();
    }, [debouncedSave, commitScores]);

    // ─── Get effective value (local edit or server value) ───
    const getCriterionValue = useCallback((criteriaKey, field) => {
        const local = localScores[criteriaKey];
        if (local && local[field] !== undefined) return local[field];
        if (!evaluation) return '';
        const criterion = evaluation.criteria.find(c => c.criteria_key === criteriaKey);
        return criterion ? criterion[field] : '';
    }, [localScores, evaluation]);

    const getActualScore = useCallback((criteriaKey) => {
        const local = localScores[criteriaKey];
        if (local && local.actual_score !== undefined) {
            return local.actual_score === null || local.actual_score === '' ? '' : Number(local.actual_score);
        }
        if (!evaluation) return '';
        const criterion = evaluation.criteria.find(c => c.criteria_key === criteriaKey);
        return criterion?.actual_score !== null && criterion?.actual_score !== undefined ? Number(criterion.actual_score) : '';
    }, [localScores, evaluation]);

    // ─── Status transitions ───
    const submitEvaluation = useCallback(async () => {
        if (!evaluation) return;
        setSaving(true);
        setError(null);
        try {
            debouncedSave.cancel();
            await commitScores();
            
            const res = await fetch(`${API}/api/rsp/ies/${evaluation.id}/status`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ action: 'submit' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Submit failed');
            setEvaluation(data);
            fetchQueue(true);
            setSuccess('Evaluation submitted successfully.');
            setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }, [evaluation, fetchQueue]);

    const attestAsApplicant = useCallback(async (signatureName) => {
        if (!evaluation) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/rsp/ies/${evaluation.id}/status`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ action: 'attest_applicant', signatureName })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Attestation failed');
            setEvaluation(data);
            fetchQueue(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }, [evaluation, fetchQueue]);

    const attestAsChair = useCallback(async (signatureName) => {
        if (!evaluation) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/rsp/ies/${evaluation.id}/status`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ action: 'attest_chair', signatureName })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Attestation failed');
            setEvaluation(data);
            fetchQueue(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }, [evaluation, fetchQueue]);

    // ─── Download PDF ───
    const downloadPDF = useCallback(async (iesId, applicantName = 'Applicant') => {
        const idToDownload = iesId || evaluation?.id;
        if (!idToDownload) return;
        setDownloading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/rsp/ies/${idToDownload}/pdf`, {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (!res.ok) throw new Error('Failed to generate PDF. Make sure the evaluation is attested.');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `IES_${applicantName.replace(/\\s+/g, '_')}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            setError(e.message);
        } finally {
            setDownloading(false);
        }
    }, [evaluation]);

    // ─── Derived: total score from local edits ───
    const runningTotal = useMemo(() => {
        if (!evaluation) return 0;
        return evaluation.criteria.reduce((sum, c) => {
            const local = localScores[c.criteria_key];
            const score = local && local.actual_score !== undefined ? Number(local.actual_score) : Number(c.actual_score || 0);
            return sum + score;
        }, 0);
    }, [evaluation, localScores]);

    const isLocked = evaluation?.status === 'attested';

    return {
        activeCategory, setActiveCategory,
        queue, selectedApplicantId, setSelectedApplicantId,
        evaluation, runningTotal, isLocked,
        loading, loadingEvaluation, saving, downloading, error, success,
        getCriterionValue, getActualScore,
        handleScoreChange, handleSaveNow, debouncedSave,
        submitEvaluation, attestAsApplicant, attestAsChair, downloadPDF,
        fetchQueue, setError
    };
};
