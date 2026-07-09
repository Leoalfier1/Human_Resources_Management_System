import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../utils/api';

export const useEmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/employees/my-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setError(null);
      } else {
        const err = await res.json();
        if (res.status !== 404) setError(err.message);
      }
    } catch (err) {
      setError('Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return { profile, loading, error, refresh: fetchProfile };
};

export const useHREmployees = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async (params = {}) => {
    setLoading(true);
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
        setError(err.message);
      }
    } catch (err) {
      setError('Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchEmployees };
};
