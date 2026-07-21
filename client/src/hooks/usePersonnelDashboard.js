import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../utils/api';
import { usePersonnelRealtime } from './usePersonnelRealtime';

/**
 * Custom Hook for the Personnel Admin Dashboard & Navigation Badges.
 * Subscribes to the real-time 'personnel:update' socket event and performs silent refetches.
 */
export const usePersonnelDashboard = () => {
    const [badgeCounts, setBadgeCounts] = useState({
        pending_profile_changes: 0,
        pending_leave: 0,
        pending_documents: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBadgeCounts = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/personnel/reports/badge-counts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const json = await response.json();
                setBadgeCounts(json);
                setError(null);
            } else {
                const errData = await response.json().catch(() => ({}));
                if (!isSilent) setError(errData.message || 'Failed to fetch badge counts.');
            }
        } catch (err) {
            console.error('Personnel Dashboard Fetch Error:', err);
            if (!isSilent) setError('Cannot reach the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBadgeCounts();
    }, [fetchBadgeCounts]);

    usePersonnelRealtime(['personnel:update'], () => {
        fetchBadgeCounts(true);
    });

    return {
        badgeCounts,
        loading,
        error,
        refreshBadges: () => fetchBadgeCounts(false)
    };
};
