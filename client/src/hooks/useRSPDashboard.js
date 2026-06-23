import { useState, useEffect } from 'react';
import io from 'socket.io-client';

export const useRSPDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/rsp/dashboard/consolidated', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (res.ok) setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); // Initial load

        // Real-time Socket.io connection
        const socket = io('http://localhost:5000');
        socket.on('rsp:dashboard:update', () => {
            console.log("⚡ Live update received! Silently refreshing dashboard...");
            fetchData(); // Silently swap data without spinner
        });

        return () => socket.disconnect();
    }, []);

    return { data, loading };
};