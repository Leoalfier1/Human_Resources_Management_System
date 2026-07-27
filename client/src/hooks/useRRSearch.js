import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

export const useRRSearch = (searchId) => {
    const [search, setSearch] = useState(null);
    const [nominations, setNominations] = useState([]);
    const [rankedList, setRankedList] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = () => localStorage.getItem('token');
    const authHeader = () => ({ 'Authorization': `Bearer ${token()}` });

    const fetchSearch = useCallback(async () => {
        if (!searchId) return;
        setLoading(true);
        try {
            const [searchRes, nomRes, rankRes] = await Promise.all([
                fetch(`${API_BASE}/api/rr/searches/${searchId}`, { headers: authHeader() }),
                fetch(`${API_BASE}/api/rr/nominations?search_id=${searchId}`, { headers: authHeader() }),
                fetch(`${API_BASE}/api/rr/deliberation/ranked-list?search_id=${searchId}`, { headers: authHeader() })
            ]);
            if (searchRes.ok) setSearch(await searchRes.json());
            if (nomRes.ok) setNominations(await nomRes.json());
            if (rankRes.ok) setRankedList(await rankRes.json());
        } catch (e) {
            console.error('Failed to load RR search:', e);
        } finally {
            setLoading(false);
        }
    }, [searchId]);

    useEffect(() => {
        fetchSearch();
        if (!searchId) return;
        const socket = io(API_BASE);
        socket.on(`rr:search:${searchId}:status`, () => fetchSearch());
        socket.on(`rr:ca:scoreUpdate:${searchId}`, () => fetchSearch());
        socket.on('rr:dashboard:update', () => fetchSearch());
        return () => socket.disconnect();
    }, [searchId, fetchSearch]);

    return { search, nominations, rankedList, loading, refresh: fetchSearch };
};
