import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../utils/api';

export const useTravel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/travel/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(await res.json());
        setError(null);
      }
    } catch (err) {
      setError('Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const submitTravel = async (formData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/travel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (res.ok) { await fetchRequests(); return { success: true }; }
    const err = await res.json();
    return { success: false, message: err.message };
  };

  const cancelTravel = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/travel/${id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) { await fetchRequests(); return { success: true }; }
    return { success: false };
  };

  return { requests, loading, error, submitTravel, cancelTravel, refresh: fetchRequests };
};

export const useHRTravel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/api/personnel/travel/all?${query}`, {
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

  const approveTravel = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/travel/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) { await fetchRequests(); return true; }
    return false;
  };

  const rejectTravel = async (id, rejection_reason) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/travel/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rejection_reason })
    });
    if (res.ok) { await fetchRequests(); return true; }
    return false;
  };

  return { data, loading, error, fetchRequests, approveTravel, rejectTravel };
};
