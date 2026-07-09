import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../utils/api';

export const useLeave = () => {
  const [credits, setCredits] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [creditsRes, appsRes] = await Promise.all([
        fetch(`${API_BASE}/api/personnel/leave/my-credits`, { headers }),
        fetch(`${API_BASE}/api/personnel/leave/my-applications`, { headers })
      ]);

      if (creditsRes.ok) setCredits(await creditsRes.json());
      if (appsRes.ok) setApplications(await appsRes.json());
      setError(null);
    } catch (err) {
      setError('Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitLeave = async (data) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) { await fetchData(); return { success: true }; }
    const err = await res.json();
    return { success: false, message: err.message };
  };

  const cancelLeave = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/leave/${id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) { await fetchData(); return { success: true }; }
    return { success: false };
  };

  return { credits, applications, loading, error, submitLeave, cancelLeave, refresh: fetchData };
};

export const useHRLeave = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/api/personnel/leave/all?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
        setError(null);
      }
    } catch (err) {
      setError('Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveLeave = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/leave/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) { await fetchApplications(); return true; }
    return false;
  };

  const rejectLeave = async (id, rejection_reason) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/leave/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rejection_reason })
    });
    if (res.ok) { await fetchApplications(); return true; }
    return false;
  };

  return { data, loading, error, fetchApplications, approveLeave, rejectLeave };
};
