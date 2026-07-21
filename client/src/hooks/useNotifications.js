import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../utils/api';
import { usePersonnelRealtime } from './usePersonnelRealtime';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [notifRes, countRes] = await Promise.all([
        fetch(`${API_BASE}/api/personnel/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/personnel/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (countRes.ok) {
        const c = await countRes.json();
        setUnreadCount(c.count);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  usePersonnelRealtime(['personnel:update', 'personnel:notification:update'], () => {
    fetchNotifications(true);
  });

  const markAsRead = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/personnel/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/personnel/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetchNotifications };
};
