import { useState, useEffect, useCallback } from 'react';

export const useCongratulatoryAdvice = (vacancyId) => {
    const [eligible, setEligible] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchEligible = useCallback(async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/rsp/congratulatory-advice/eligible-appointees?vacancy_id=${vacancyId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setEligible(data);
        if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
        setLoading(false);
    }, [vacancyId]);

    const fetchDetail = async (id) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/rsp/congratulatory-advice/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setDetails(await res.json());
    };

    useEffect(() => { if (vacancyId) fetchEligible(); }, [vacancyId, fetchEligible]);
    useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId]);

    return { eligible, selectedId, setSelectedId, detail, setDetails, loading, refresh: fetchEligible };
};