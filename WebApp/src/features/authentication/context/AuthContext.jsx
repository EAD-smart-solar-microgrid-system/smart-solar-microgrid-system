import { useEffect, useState } from 'react';
import appConfig from '../../../config/appConfig';
import { AuthContext } from './AuthContextValue.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    if (token) {
      fetch(`${appConfig.apiBaseUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then(data => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(() => {
        logout();
        setIsLoading(false);
      });
    } else {
      Promise.resolve().then(() => setIsLoading(false));
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch(`${appConfig.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    setToken(data.token);
    setUser({ username: data.username, role: data.role });
    const userData = { username: data.username, role: data.role };
    setUser(userData);
    localStorage.setItem('token', data.token);
    
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
