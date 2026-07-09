import { useState, useEffect, useCallback } from 'react';
import { API_BASE, SERVER_BASE } from '../utils/api';

export const useCertificates = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/certificates/my-requests`, {
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

  const submitRequest = async (data) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) { await fetchRequests(); return { success: true }; }
    const err = await res.json();
    return { success: false, message: err.message };
  };

  const downloadServiceRecord = (employeeId) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/api/personnel/certificates/${employeeId}/service-record`;
    window.open(url + '?token=' + token, '_blank');
  };

  const downloadCOE = (employeeId) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/api/personnel/certificates/${employeeId}/coe`;
    window.open(url + '?token=' + token, '_blank');
  };

  return { requests, loading, error, submitRequest, downloadServiceRecord, downloadCOE, refresh: fetchRequests };
};

export const useHRReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/reports/summary`, {
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

  return { data, loading, error, fetchSummary, setData, setLoading, setError };
};
