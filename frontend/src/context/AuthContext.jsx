import { createContext, useEffect, useMemo, useState } from 'react';
import { request, setToken, getToken } from '../lib/api';
import { createSocket } from '../lib/socket';

export const AuthContext = createContext(null);

function joinUserRoom(socket, user) {
  if (!socket || !user) {
    return;
  }

  const roomId = user.id || user._id;

  const token = typeof window !== 'undefined' ? localStorage.getItem('medisync_token') : null;

  if (user.role === 'patient' && roomId) {
    socket.emit('join:patient', { token, patientId: roomId });
  }

  if (user.role === 'pharmacist' && user.pharmacyId) {
    socket.emit('join:pharmacy', { token, pharmacyId: user.pharmacyId });
  }
}

function normalizeUser(user) {
  if (!user) {
    return user;
  }

  return {
    ...user,
    id: user.id || user._id
  };
}

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
        setUser(normalizeUser(data.user));
        const nextSocket = createSocket();
        setSocket(nextSocket);
        nextSocket.on('connect', () => joinUserRoom(nextSocket, normalizeUser(data.user)));
        joinUserRoom(nextSocket, normalizeUser(data.user));
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
    setUser(normalizeUser(me.user));

    const nextSocket = createSocket();
    setSocket(nextSocket);
    nextSocket.on('connect', () => joinUserRoom(nextSocket, normalizeUser(me.user)));
    joinUserRoom(nextSocket, normalizeUser(me.user));

    return normalizeUser(me.user);
  }

  async function register(payload) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setToken(data.token);
    const me = await request('/api/auth/me');
    setUser(normalizeUser(me.user));
    return normalizeUser(me.user);
  }

  async function updateProfile(payload) {
    const data = await request('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    setUser(normalizeUser(data.user));
    return normalizeUser(data.user);
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
