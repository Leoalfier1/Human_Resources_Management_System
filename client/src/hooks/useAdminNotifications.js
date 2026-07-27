import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

export const useAdminNotifications = () => {
    const [toasts, setToasts] = useState([]);
    const socketRef = useRef(null);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((data) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message: data.message, type: data.type || 'info' }]);
        setTimeout(() => dismissToast(id), 5000);
    }, [dismissToast]);

    useEffect(() => {
        const socket = io(API_BASE);
        socketRef.current = socket;

        socket.on('connect', () => {
            // Join the ld-admin room so this admin receives targeted L&D notifications
            socket.emit('join-ld-room', 'ld-admin');
        });

        // Generic admin broadcast notifications (RSP, PM, etc.)
        socket.on('notification:admin', addToast);

        // Targeted L&D notifications from applicant actions (acknowledge, submit TNA, submit eval)
        socket.on('ld:notification:admin', addToast);

        return () => {
            socket.emit('leave-user-room', 'ld-admin');
            socket.disconnect();
        };
    }, [addToast]);

    return { toasts, dismissToast };
};
