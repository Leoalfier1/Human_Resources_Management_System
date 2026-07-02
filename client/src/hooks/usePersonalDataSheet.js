import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:5000';

export const usePersonalDataSheet = () => {
    const [pds, setPds] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isComplete, setIsComplete] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const token = () => localStorage.getItem('token');
    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`
    });

    const fetchPDS = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/applicant/pds`, { headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not load your PDS.');
            setPds(data.pds);
            setIsComplete(data.isComplete);
        } catch (e) {
            console.error('fetchPDS error:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPDS(); }, [fetchPDS]);

    const save = useCallback(async (fields) => {
        setSaving(true);
        try {
            const res = await fetch(`${API}/api/applicant/pds`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify(fields)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not save progress.');
            setPds(data.pds);
            setIsComplete(data.isComplete);
            setLastSavedAt(new Date());
            return { success: true };
        } catch (e) {
            console.error('PDS save error:', e);
            return { success: false, message: e.message };
        } finally {
            setSaving(false);
        }
    }, []);

    const submit = useCallback(async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/api/applicant/pds/submit`, {
                method: 'POST',
                headers: authHeaders()
            });
            const data = await res.json();
            if (!res.ok) return { success: false, message: data.message, missing: data.missing };
            await fetchPDS();
            return { success: true, message: data.message };
        } catch (e) {
            console.error('PDS submit error:', e);
            return { success: false, message: 'Network error while submitting.' };
        } finally {
            setSubmitting(false);
        }
    }, [fetchPDS]);

    return { pds, setPds, loading, saving, submitting, error, isComplete, lastSavedAt, save, submit, refresh: fetchPDS };
};