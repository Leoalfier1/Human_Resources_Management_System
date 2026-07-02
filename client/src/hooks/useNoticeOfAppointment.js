import { useState, useEffect } from 'react';

export const useNoticeOfAppointment = (applicantId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedChannels, setSelectedChannels] = useState([]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/rsp/notice-of-appointment/${applicantId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setData(await res.json());
        setLoading(false);
    };

    const handlePost = async () => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/rsp/notice-of-appointment/${data.notice.appointment_id}/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ channels: selectedChannels })
        });
        fetchData();
    };

    useEffect(() => { if (applicantId) fetchData(); }, [applicantId]);

    return { data, loading, selectedChannels, setSelectedChannels, handlePost };
};