import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('knowly_user') || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('knowly_token') || '');
  const [user, setUser] = useState(getStoredUser);

  function saveSession(data) {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('knowly_token', data.token);
    localStorage.setItem('knowly_user', JSON.stringify(data.user));
  }

  function logout() {
    setToken('');
    setUser(null);
    localStorage.removeItem('knowly_token');
    localStorage.removeItem('knowly_user');
  }

  const value = useMemo(() => ({ token, user, saveSession, logout }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
