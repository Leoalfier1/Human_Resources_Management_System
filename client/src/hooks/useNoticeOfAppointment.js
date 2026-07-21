import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../utils/api';

export const useNoticeOfAppointment = (applicantId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedChannels, setSelectedChannels] = useState([]);

    const fetchData = useCallback(async (isSilent = false) => {
        const token = localStorage.getItem('token');
        if (!isSilent) setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/rsp/notice-of-appointment/${applicantId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Failed to load appointment notice (HTTP ${res.status})`);
            setData(await res.json());
            setError(null);
        } catch (err) {
            console.error('Notice of appointment fetch error:', err);
            setError(err.message);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [applicantId]);

    const handlePost = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/rsp/notice-of-appointment/${data.notice.appointment_id}/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ channels: selectedChannels })
            });
            if (!res.ok) throw new Error(`Failed to post appointment notice (HTTP ${res.status})`);
            await fetchData(true);
        } catch (err) {
            console.error('Notice of appointment post error:', err);
            setError(err.message);
            throw err;
        }
    }, [data, selectedChannels, fetchData]);

    useEffect(() => { if (applicantId) { fetchData(); } }, [applicantId, fetchData]);

    return { data, loading, error, selectedChannels, setSelectedChannels, handlePost };
};
