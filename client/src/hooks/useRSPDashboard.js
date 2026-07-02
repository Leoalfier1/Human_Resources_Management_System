// client/src/hooks/useRSPDashboard.js

import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// NOTE: Matches the hardcoded pattern used by every other RSP hook
// (useComparativeAssessment, useDeliberation, etc.) instead of apiFetch(),
// which depended on VITE_API_BASE_URL — an env var that was never defined
// anywhere in the project, causing every dashboard request to silently fail.
const API = 'http://localhost:5000';

/**
 * Custom Hook for the Admin RSP Dashboard
 * Handles initial data fetching and real-time socket updates.
 */
export const useRSPDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. DATA FETCHING LOGIC
    // Wrapped in useCallback so it can be safely used in the useEffect dependency array
    const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/api/rsp/dashboard/consolidated`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const json = await response.json();
            setData(json);
            setError(null);   // ← clears stale error on successful silent refresh too
        } else {
            const errData = await response.json().catch(() => ({}));
            if (!isSilent) setError(errData.message || "Failed to fetch dashboard data.");
            // silent refresh failure: keep showing old data, don't flash error
        }
    } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        if (!isSilent) setError("Cannot reach the server. Please check your connection.");
    } finally {
        setLoading(false);   // ← always reset loading, even for silent refresh
    }
}, []);

    // 2. SOCKET & INITIAL LOAD
    useEffect(() => {
        fetchData(); // Run initial fetch on mount

        // Connect to the backend socket
        const socket = io(API);

        socket.on('connect', () => {
            console.log("📡 Admin Dashboard connected to real-time events");
        });

        // REFRESH EVENTS:
        // These events are triggered by various controllers (Evaluation, CA, Deliberation)
        const refreshEvents = [
            'rsp:dashboard:update', // General updates
            'application:new',       // When an applicant submits a form
            'vacancy:updated'       // When a vacancy changes stage
        ];

        refreshEvents.forEach(eventName => {
            socket.on(eventName, () => {
                console.log(`⚡ Live update received [${eventName}] - Refreshing dashboard...`);
                fetchData(true); // 'true' means silent refresh (no spinner)
            });
        });

        // Cleanup connection on unmount
        return () => {
            socket.disconnect();
            console.log("📡 Dashboard socket disconnected");
        };
    }, [fetchData]);

    return { 
        data, 
        loading, 
        error, 
        refresh: () => fetchData(false) // Allows UI to trigger manual refresh with spinner
    };
};