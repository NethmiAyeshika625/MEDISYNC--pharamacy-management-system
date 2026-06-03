import { useEffect } from 'react';
import { getToken } from '../lib/api';

export function useSocketFeed(socket, roomType, roomId, onUpdate) {
  useEffect(() => {
    if (!socket || !roomId) {
      return undefined;
    }

    const token = getToken();
    const joinRoom = () => {
      if (!token) return;
      if (roomType === 'patient') {
        socket.emit('join:patient', { token, patientId: roomId });
      } else {
        socket.emit('join:pharmacy', { token, pharmacyId: roomId });
      }
    };

    joinRoom();
    socket.on('connect', joinRoom);

    const handlers = ['prescription:created', 'prescription:updated', 'order:updated', 'message:created', 'stock:updated', 'stock:alert'];
    handlers.forEach((eventName) => socket.on(eventName, onUpdate));

    return () => {
      socket.off('connect', joinRoom);
      handlers.forEach((eventName) => socket.off(eventName, onUpdate));
    };
  }, [socket, roomType, roomId, onUpdate]);
}
