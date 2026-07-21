import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../utils/api';
import { usePersonnelRealtime } from './usePersonnelRealtime';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export const useEmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changeRequests, setChangeRequests] = useState([]);

  const fetchProfile = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/personnel/employees/my-profile`, {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setError(null);
      } else {
        const err = await res.json();
        if (!isSilent && res.status !== 404) setError(err.message);
      }
    } catch {
      if (!isSilent) setError('Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChangeRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/personnel/employees/change-requests/mine`, {
        headers: authHeaders()
      });
      if (res.ok) setChangeRequests(await res.json());
    } catch { /* ignore */ }
  }, []);

  const submitChangeRequest = useCallback(async (changes, reason) => {
    const res = await fetch(`${API_BASE}/api/personnel/employees/change-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ changes, reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    await fetchChangeRequests();
    return data;
  }, [fetchChangeRequests]);

  const revokeRequest = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/api/personnel/employees/change-requests/${id}/revoke`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
    await fetchChangeRequests();
  }, [fetchChangeRequests]);

  const uploadPhoto = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_BASE}/api/personnel/employees/my-profile/photo`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    await fetchProfile();
    return data;
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
    fetchChangeRequests();
  }, [fetchProfile, fetchChangeRequests]);

  usePersonnelRealtime(['personnel:update', 'personnel:profile-change:update'], () => {
    fetchProfile(true);
    fetchChangeRequests();
  });

  return { profile, loading, error, refresh: fetchProfile, changeRequests, submitChangeRequest, revokeRequest, uploadPhoto };
};

export const useHREmployees = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastParamsRef = useRef({});

  const fetchEmployees = useCallback(async (params = {}, isSilent = false) => {
    lastParamsRef.current = params;
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/api/personnel/employees?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else {
        const err = await res.json();
        if (!isSilent) setError(err.message);
      }
    } catch {
      if (!isSilent) setError('Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  usePersonnelRealtime(['personnel:update', 'personnel:employee:update'], () => {
    console.log('⚡ Live update received [personnel:update] - Refreshing employee directory...');
    fetchEmployees(lastParamsRef.current, true);
  });

  return { data, loading, error, fetchEmployees };
};

