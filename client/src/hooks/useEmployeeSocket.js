import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../utils/api';

/**
 * useEmployeeSocket
 * -----------------
 * Reusable Socket.IO hook for employee-facing pages.
 * Subscribes to one or more named socket events and calls the
 * corresponding callback when each event fires.
 *
 * @param {Object} eventMap  - Plain object where keys are socket event
 *                             names and values are callback functions.
 *                             Example: { 'rating:finalized': fetchData, 'performance_update': fetchData }
 *
 * Usage:
 *   useEmployeeSocket({
 *     'rating:finalized': fetchHistory,
 *     'performance_update': fetchHistory,
 *   });
 */
const useEmployeeSocket = (eventMap = {}) => {
  // Keep a stable ref so callbacks updated between renders are always current.
  const eventMapRef = useRef(eventMap);

  useEffect(() => {
    eventMapRef.current = eventMap;
  });

  // Stringify the event names to use as the effect dependency (callbacks are
  // intentionally excluded — the ref handles them without re-subscribing).
  const eventKeys = Object.keys(eventMap).sort().join(',');

  useEffect(() => {
    if (!eventKeys) return;

    const socket = io(API_BASE);

    socket.on('connect', () => {
      console.log('📡 Employee socket connected:', eventKeys.split(','));
    });

    eventKeys.split(',').forEach((event) => {
      socket.on(event, (data) => {
        console.log(`⚡ Employee socket event [${event}] received`);
        const cb = eventMapRef.current?.[event];
        if (typeof cb === 'function') {
          cb(data);
        }
      });
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventKeys]);
};

export default useEmployeeSocket;
