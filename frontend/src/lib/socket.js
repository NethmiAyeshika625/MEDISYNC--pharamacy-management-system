import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function createSocket() {
  return io(socketUrl, {
    transports: ['websocket']
  });
}
