import { useState, useEffect } from 'react';

export const useInitialEvaluation = (vacancyId) => {
    const [queueData, setQueueData] = useState(null);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [details, setDetails] = useState({ criteria: [], documents: [] });
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/rsp/evaluation/queue?vacancy_id=${vacancyId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setQueueData(data);
        if (data.queue.length > 0 && !selectedApplicant) {
            setSelectedApplicant(data.queue[0]);
        }
    };

    const fetchDetails = async (id) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/rsp/evaluation/applicant/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setDetails(data);
    };

    useEffect(() => { if (vacancyId) fetchQueue(); }, [vacancyId]);
    useEffect(() => { if (selectedApplicant) fetchDetails(selectedApplicant.id); }, [selectedApplicant]);

    return { queueData, selectedApplicant, setSelectedApplicant, details, fetchQueue, fetchDetails, loading };
};
