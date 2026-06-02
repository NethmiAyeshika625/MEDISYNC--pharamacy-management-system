import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

export function createSocket() {
  return socketUrl ? io(socketUrl, {
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5
  }) : io({
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5
  });
}
