import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { request, setToken, getToken } from '../lib/api';
import { createSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    async function bootstrap() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await request('/api/auth/me');
        setUser(data.user);
        const nextSocket = createSocket();
        setSocket(nextSocket);
        if (data.user?.role === 'patient') {
          nextSocket.emit('join:patient', data.user.id);
        }
        if (data.user?.role === 'pharmacist' && data.user?.pharmacyId) {
          nextSocket.emit('join:pharmacy', data.user.pharmacyId);
        }
      } catch (_error) {
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function login(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    const me = await request('/api/auth/me');
    setUser(me.user);

    const nextSocket = createSocket();
    setSocket(nextSocket);
    if (me.user?.role === 'patient') {
      nextSocket.emit('join:patient', me.user.id);
    }
    if (me.user?.role === 'pharmacist' && me.user?.pharmacyId) {
      nextSocket.emit('join:pharmacy', me.user.pharmacyId);
    }

    return me.user;
  }

  async function register(payload) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setToken(data.token);
    const me = await request('/api/auth/me');
    setUser(me.user);
    return me.user;
  }

  async function updateProfile(payload) {
    const data = await request('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    setUser(data.user);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    socket?.disconnect();
    setSocket(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, updateProfile, logout, socket }), [user, loading, socket]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
