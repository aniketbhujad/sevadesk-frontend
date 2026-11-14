import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.auth.me();
        if (res.success && res.user) {
          setUser(res.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.auth.login({ username, password });
    if (res.success) {
      if (res.token) {
        localStorage.setItem('sevadesk_token', res.token);
      }
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('sevadesk_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
