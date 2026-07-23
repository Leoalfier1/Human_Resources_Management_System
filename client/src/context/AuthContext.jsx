import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. PERSISTENCE: Check localStorage when the app first loads
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        // In a real-world app, you might want to verify the token with the backend here
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        // If data is corrupted, clear everything
        logout();
      }
    }
    setLoading(false);
  }, []);

  // 2. LOGIN: Save user data to state and storage
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 3. LOGOUT: Clear all state and storage (Defensive Check)
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Force redirect to login page (optional, handled by App.jsx or ProtectedRoute)
    window.location.href = '/'; 
  };

  // 4. CONVENIENCE HELPERS: Quick role checks
  // Define which roles count as "Staff/Admin"
  const staffRoles = ['admin', 'staff', 'hr_staff', 'hrmpsb'];
  
  const isAdmin = user && staffRoles.includes(user.role);
  const isApplicant = user && user.role === 'applicant';
  const isAuthenticated = !!token;

  // Values exposed to the rest of the app
  const value = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isApplicant,
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
