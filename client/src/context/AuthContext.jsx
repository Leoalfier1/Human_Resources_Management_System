import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { SERVER_BASE } from '../utils/api';

// Create the Context
const AuthContext = createContext();

// Decode a JWT without any library — the payload is just base64url encoded JSON.
// Returns null if the token is malformed or expired.
const decodeToken = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        // exp is in seconds, Date.now() is in milliseconds
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Connect Socket.IO and join user-specific rooms for real-time notifications
  const connectSocket = (currentUser, currentToken) => {
    if (socketRef.current) socketRef.current.disconnect();

    const s = io(SERVER_BASE, {
      auth: { token: currentToken }
    });

    s.on('connect', () => {
      // Join user-specific room for targeted notifications (e.g. R&R awards)
      if (currentUser?.id) {
        s.emit('join-user-room', `rr-user-${currentUser.id}`);
      }
    });

    socketRef.current = s;
    setSocket(s);
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
  };

  // 1. PERSISTENCE: Check localStorage when the app first loads
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        // Verify the token is still valid and not expired before trusting it
        const decoded = decodeToken(storedToken);
        if (!decoded) {
            // Token expired or malformed — clear everything and force re-login
            logout();
        } else {
            setToken(storedToken);
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            connectSocket(parsedUser, storedToken);
        }
      } catch (error) {
        logout();
      }
    }
    setLoading(false);

    return () => disconnectSocket();
  }, []);

  // 2. LOGIN: Save user data to state and storage
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    connectSocket(userData, userToken);
  };

  // 3. LOGOUT: Clear all state and storage (Defensive Check)
  const logout = () => {
    disconnectSocket();
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Force redirect to login page
    window.location.href = '/'; 
  };

  // 4. CONVENIENCE HELPERS: Quick role checks
  // Define which roles count as "Staff/Admin" — must match server-side allow-list
  const staffRoles = ['admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'];
  
  const isAdmin = user && staffRoles.includes(user.role);
  const isApplicant = user && user.role === 'applicant';
  const isEmployee = user && ['applicant', 'admin', 'hr_staff', 'hrmpsb', 'appointing_authority'].includes(user.role);
  const isHRAdmin = user && ['admin', 'hr_staff'].includes(user.role);
  const isAuthenticated = !!token;

    // Values exposed to the rest of the app
    const value = {
        user,
        token,
        socket,
        isAuthenticated,
        isAdmin,
        isApplicant,
        isEmployee,
        isHRAdmin,
        login,
        logout,
        loading
    };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 5. CUSTOM HOOK: Easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};