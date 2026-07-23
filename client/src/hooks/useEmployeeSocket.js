import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export default function useEmployeeSocket(events = {}) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join_employee_room', user.id);

    Object.entries(events).forEach(([event, handler]) => {
      if (handler) socket.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        if (handler) socket.off(event, handler);
      });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  return socketRef;
}
