import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthAPI, setToken, getToken, setUnauthorizedHandler } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { setToken(null); setUser(null); });
    if (getToken()) {
      AuthAPI.me().then((d) => setUser(d.user)).catch(() => setToken(null)).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const login = useCallback(async (credentials, guestCart) => {
    const d = await AuthAPI.login({ ...credentials, guestCart });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (data, guestCart) => {
    const d = await AuthAPI.register({ ...data, guestCart });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const updateProfile = useCallback(async (data) => {
    const d = await AuthAPI.updateProfile(data);
    setUser(d.user);
    return d.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, isAdmin: user?.role === 'ADMIN', login, register, logout, updateProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
