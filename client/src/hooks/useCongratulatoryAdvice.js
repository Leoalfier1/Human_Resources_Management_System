import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../utils/api';

const defaultLetterForm = {
    salutation: 'Mr.',
    last_name: '',
    first_name: '',
    address: '',
    letter_date: new Date().toISOString().split('T')[0]
};

export const useCongratulatoryAdvice = (vacancyId) => {
    const [queue, setQueue] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [annexEData, setAnnexEData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [annexFetching, setAnnexFetching] = useState(false);
    const [error, setError] = useState(null);
    const [letterForm, setLetterForm] = useState(defaultLetterForm);
    const [savingOverrides, setSavingOverrides] = useState(false);

    const autoSelectedRef = useRef(false);

    const fetchQueue = useCallback(async () => {
        if (!vacancyId) return;
        const token = localStorage.getItem('token');
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/queue?vacancy_id=${vacancyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Failed to load evaluation queue (HTTP ${res.status})`);
            const data = await res.json();
            const applicants = (data.queue || []).filter(a =>
                ['qualified', 'disqualified'].includes(a.status)
            );
            setQueue(applicants);
            setError(null);
            if (applicants.length > 0 && !autoSelectedRef.current) {
                setSelectedId(applicants[0].id);
                autoSelectedRef.current = true;
            } else if (applicants.length === 0) {
                setSelectedId(null);
                setAnnexEData(null);
            }
        } catch (err) {
            console.error('Evaluation queue fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [vacancyId]);

    const fetchAnnexE = useCallback(async (applicationId, showSpinner = false) => {
        if (!applicationId) return;
        if (showSpinner) {
            setLoading(true);
        } else {
            setAnnexFetching(true);
        }
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/${applicationId}/annex-e`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Failed to load Annex E data.');
            setAnnexEData(json);
            setError(null);
            // Pre-fill letter form from server data
            if (json.letter) {
                setLetterForm({
                    salutation: json.letter.salutation || 'Mr.',
                    last_name: json.letter.last_name || '',
                    first_name: json.letter.first_name || '',
                    address: json.letter.address || '',
                    letter_date: json.letter.letter_date ? String(json.letter.letter_date).split('T')[0] : new Date().toISOString().split('T')[0]
                });
            }
        } catch (err) {
            console.error('Annex E data fetch error:', err);
            setError(err.message);
            setAnnexEData(null);
        } finally {
            setLoading(false);
            setAnnexFetching(false);
        }
    }, []);

    useEffect(() => {
        if (vacancyId) {
            autoSelectedRef.current = false;
            setSelectedId(null);
            setAnnexEData(null);
            fetchQueue();
        }
    }, [vacancyId, fetchQueue]);

    useEffect(() => {
        if (selectedId) fetchAnnexE(selectedId);
        else setAnnexEData(null);
    }, [selectedId, fetchAnnexE]);

    const refresh = useCallback(() => {
        fetchQueue().then(() => {
            const id = selectedId;
            if (id) fetchAnnexE(id);
        });
    }, [fetchQueue, selectedId, fetchAnnexE]);

    const refreshAnnexE = useCallback(() => {
        if (selectedId) fetchAnnexE(selectedId);
    }, [selectedId, fetchAnnexE]);

    const saveOverrides = useCallback(async () => {
        if (!selectedId) return;
        setSavingOverrides(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/${selectedId}/annex-e/overrides`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    letter_salutation: letterForm.salutation || null,
                    letter_last_name: letterForm.last_name || null,
                    letter_first_name: letterForm.first_name || null,
                    letter_address: letterForm.address || null,
                    letter_date: letterForm.letter_date || null
                })
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.message || 'Failed to save letter details.');
            }
            // Refresh Annex E data to reflect saved overrides
            await fetchAnnexE(selectedId);
            return true;
        } catch (err) {
            console.error('Save overrides error:', err);
            setError(err.message);
            return false;
        } finally {
            setSavingOverrides(false);
        }
    }, [selectedId, letterForm, fetchAnnexE]);

    const saveTableRows = useCallback(async (tableRows) => {
        if (!selectedId) return false;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/${selectedId}/annex-e/table-rows`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ table_rows: tableRows })
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.message || 'Failed to save QS table rows.');
            }
            await fetchAnnexE(selectedId);
            return true;
        } catch (err) {
            console.error('Save table rows error:', err);
            setError(err.message);
            return false;
        }
    }, [selectedId, fetchAnnexE]);

    const clearTableRows = useCallback(async () => {
        if (!selectedId) return false;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/${selectedId}/annex-e/table-rows`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.message || 'Failed to clear overrides.');
            }
            await fetchAnnexE(selectedId);
            return true;
        } catch (err) {
            console.error('Clear table rows error:', err);
            setError(err.message);
            return false;
        }
    }, [selectedId, fetchAnnexE]);

    return {
        queue,
        selectedId,
        setSelectedId,
        annexEData,
        loading,
        annexFetching,
        error,
        setError,
        refresh,
        refreshAnnexE,
        letterForm,
        setLetterForm,
        saveOverrides,
        savingOverrides,
        saveTableRows,
        clearTableRows
    };
};
