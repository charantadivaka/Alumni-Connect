import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('alumni_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify session on mount
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem('alumni_user', JSON.stringify(data));
        } else {
          setUser(null);
          localStorage.removeItem('alumni_user');
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('alumni_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    localStorage.removeItem('alumni_user');
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('alumni_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isStudent = user?.role === 'student';
  const isAlumni  = user?.role === 'alumni';
  const isAdmin   = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isStudent, isAlumni, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
