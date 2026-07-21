import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

/**
 * Reusable Custom Hook for Personnel Socket.IO Subscriptions.
 * Standardizes socket connection, multi-event subscription, silent callback execution, and cleanup.
 *
 * @param {string|string[]} events - Event name(s) to listen to (default: ['personnel:update'])
 * @param {Function} onUpdate - Callback function to invoke on socket event (e.g., (event, data) => fetchData(true))
 */
export const usePersonnelRealtime = (events = ['personnel:update'], onUpdate) => {
  const callbackRef = useRef(onUpdate);

  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!callbackRef.current) return;

    const socket = io(API_BASE);
    const eventList = Array.isArray(events) ? events : [events];

    socket.on('connect', () => {
      console.log('📡 Personnel real-time socket connected:', eventList);
    });

    eventList.forEach(evt => {
      socket.on(evt, (data) => {
        console.log(`⚡ Real-time event [${evt}] received`);
        if (callbackRef.current) {
          callbackRef.current(evt, data);
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [JSON.stringify(events)]);
};
